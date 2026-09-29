import { nflverseSeasonAssets, nflverseUpdatedAt } from "../lib/cache";
import { pruneStale, recordSource, upsertRows } from "../lib/db";
import { lit } from "../lib/duck";
import { seasonsFor } from "../lib/seasons";
import type { Dataset } from "../lib/types";

const FIRST_PBP_SEASON = 1999;
const MAX_POINTS = 200;
/** Regulation length in seconds; overtime continues past it on the chart's x-axis. */
const REGULATION = 3600;

type Point = [number, number];

/**
 * Shrinks a win-probability series to at most `max` points without shaving off the swings: the series is cut into
 * buckets and each bucket keeps its lowest and highest points (in time order), plus the very first and last point.
 */
export function downsample(points: Point[], max = MAX_POINTS): Point[] {
  if (points.length <= max) return points;
  const buckets = Math.floor((max - 2) / 2);
  const inner = points.slice(1, -1);
  const size = inner.length / buckets;
  const kept: Point[] = [points[0]];
  for (let b = 0; b < buckets; b++) {
    const slice = inner.slice(Math.floor(b * size), Math.floor((b + 1) * size));
    if (slice.length === 0) continue;
    let lo = slice[0];
    let hi = slice[0];
    for (const point of slice) {
      if (point[1] < lo[1]) lo = point;
      if (point[1] > hi[1]) hi = point;
    }
    kept.push(...(lo === hi ? [lo] : lo[0] <= hi[0] ? [lo, hi] : [hi, lo]));
  }
  kept.push(points[points.length - 1]);
  return kept;
}

interface FlowRow {
  game_id: string;
  home_score: number | null;
  away_score: number | null;
  wp: Point[] | null;
  scoring: unknown[] | null;
}

/** Start point, final point (from the final score), monotonic seconds, deduped, then downsampled. */
function buildSeries(row: FlowRow): Point[] {
  const raw = (row.wp ?? []).filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]));
  if (raw.length === 0) return [];
  const points: Point[] = raw.map(([t, wp]) => [Math.max(0, Math.round(t)), wp]);
  if (points[0][0] > 0) points.unshift([0, points[0][1]]);

  const home = Number(row.home_score);
  const away = Number(row.away_score);
  if (row.home_score !== null && row.away_score !== null) {
    const end = Math.max(REGULATION, points[points.length - 1][0]);
    const final: Point = [end, home > away ? 1 : home < away ? 0 : 0.5];
    if (points[points.length - 1][0] === end) points[points.length - 1] = final;
    else points.push(final);
  }
  return downsample(points);
}

export const gameFlow: Dataset = {
  id: "game-flow",
  description: "Per-game win-probability series and scoring plays from play-by-play (1999+)",
  dependsOn: ["games"],
  async run(ctx) {
    const seasons = seasonsFor(ctx, FIRST_PBP_SEASON);
    if (seasons.length === 0) return;
    const { duck } = ctx;

    // pbp files are ~20-30 MB each: download them 8 at a time, then process one season per pass.
    const files = await nflverseSeasonAssets(ctx, "pbp", "play_by_play", seasons);
    let games = 0;
    let points = 0;
    let scores = 0;
    let mismatched = 0;

    for (const season of seasons) {
      const file = files.get(season);
      if (!file) {
        ctx.log(`  game-flow ${season}: no play-by-play published yet`);
        continue;
      }

      await duck.exec(`
        create or replace table src_pbp as
        select game_id, play_id, qtr::integer as qtr, "time" as clock, sp, touchdown, safety, play_type,
          field_goal_result, extra_point_result, two_point_conv_result, two_point_attempt,
          game_seconds_remaining, coalesce(home_wp, vegas_home_wp) as wp,
          total_home_score, total_away_score, "desc" as description
        from read_parquet(${lit(file)})
        where game_id in (select id from game_rows where season = ${season})`);

      // Win probability: one point per play, on a monotonic seconds-elapsed axis (overtime runs past 3600).
      // Keeps the last play at any given second.
      await duck.exec(`
        create or replace table season_wp as
        select p.game_id,
          list([t.elapsed, round(t.wp, 3)] order by t.elapsed) as wp
        from (
          select game_id,
            case when qtr <= 4 then ${REGULATION} - game_seconds_remaining
              else ${REGULATION} + 900 * (qtr - 5)
                + (case when qtr = 5 and season >= 2017 and game_type = 'REG' then 600 else 900 end) - game_seconds_remaining
            end::integer as elapsed,
            arg_max(wp, play_id) as wp
          from src_pbp
          join (select id, season, game_type from game_rows) g on g.id = game_id
          where wp is not null and game_seconds_remaining is not null and qtr is not null
          group by game_id, elapsed
        ) t
        join (select distinct game_id from src_pbp) p on p.game_id = t.game_id
        group by p.game_id`);

      // Scoring plays: rows where the running score moved. The scoring team is whichever side gained points
      // (this also covers defensive and return touchdowns, and defensive two-point conversions).
      await duck.exec(`
        create or replace table season_scoring as
        with scoring as (
          select *,
            coalesce(lag(total_home_score) over w, 0) as prev_home,
            coalesce(lag(total_away_score) over w, 0) as prev_away,
            (total_home_score - coalesce(lag(total_home_score) over w, 0)) + (total_away_score - coalesce(lag(total_away_score) over w, 0)) as delta
          from src_pbp
          where sp = 1 and total_home_score is not null and total_away_score is not null
          window w as (partition by game_id order by play_id)
        )
        select s.game_id,
          list(struct_pack(
            qtr := s.qtr,
            clock := s.clock,
            team := case when s.total_home_score - s.prev_home >= s.total_away_score - s.prev_away then g.home_abbr else g.away_abbr end,
            "type" := case
              when s.touchdown = 1 then 'TD'
              when s.safety = 1 then 'Safety'
              when s.play_type = 'extra_point' then 'PAT'
              when s.two_point_conv_result is not null or s.two_point_attempt = 1 or s.description ilike '%TWO-POINT%' then '2PT'
              when s.field_goal_result = 'made' or s.play_type = 'field_goal' then 'FG'
              -- Older seasons sometimes lack play types: fall back on how many points the play was worth.
              when delta = 1 then 'PAT'
              when delta = 3 then 'FG'
              when delta in (6, 7, 8) then 'TD'
              when delta = 2 then 'Safety'
              else 'Score' end,
            description := left(trim(regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(
                case when s.description ilike '%under review%' then '' else coalesce(s.description, '') end,
                '^[(][0-9]{0,2}:[0-9]{2}[)][[:space:]]*', ''),
                '^.{0,60}reported in as eligible[.][[:space:]]*', ''),
                '^([(]#[^)]*[)][[:space:]]*)+', ''),
                '^([(][A-Za-z ,-]{1,30}[)][[:space:]]*)+', ''),
                '[[:space:]]+PENALTY.*$', ''),
                ',?[[:space:]]*Center-.*$', '')), 160),
            away_score := s.total_away_score::integer,
            home_score := s.total_home_score::integer
          ) order by s.play_id) as scoring
        from scoring s
        join game_rows g on g.id = s.game_id
        where s.total_home_score > s.prev_home or s.total_away_score > s.prev_away
        group by s.game_id`);

      const rows = await duck.all<FlowRow>(`
        select g.id as game_id, g.home_score::integer as home_score, g.away_score::integer as away_score,
          w.wp, sc.scoring
        from game_rows g
        left join season_wp w on w.game_id = g.id
        left join season_scoring sc on sc.game_id = g.id
        where g.season = ${season} and (w.game_id is not null or sc.game_id is not null)`);

      const out = rows
        .map((row) => {
          const series = buildSeries(row);
          const plays = (row.scoring ?? []) as { home_score: number; away_score: number }[];
          const last = plays[plays.length - 1];
          if (
            last &&
            row.home_score !== null &&
            row.away_score !== null &&
            (last.home_score !== row.home_score || last.away_score !== row.away_score)
          ) {
            mismatched++;
          }
          points += series.length;
          scores += plays.length;
          return { game_id: row.game_id, win_probability: series, scoring_plays: plays };
        })
        .filter((row) => row.win_probability.length > 0 || row.scoring_plays.length > 0);
      games += out.length;
      await upsertRows(ctx, "game_flow", out, "game_id", { batchSize: 100 });
      ctx.log(`  game-flow ${season}: ${out.length} games`);

      if (!ctx.full) {
        const ids = (await duck.all<{ id: string }>(`select id from game_rows where season = ${season}`)).map((r) => r.id);
        for (let i = 0; i < ids.length; i += 150) {
          await pruneStale(ctx, "game_flow", { column: "game_id", values: ids.slice(i, i + 150) });
        }
      }
    }

    if (ctx.full) await pruneStale(ctx, "game_flow");
    ctx.log(
      `  game-flow: ${games.toLocaleString()} games, ${points.toLocaleString()} win-probability points, ${scores.toLocaleString()} scoring plays` +
        (mismatched ? ` (${mismatched} games whose last scoring play disagrees with the final score)` : ""),
    );

    await recordSource(ctx, {
      id: "nflverse.pbp",
      name: "nflverse play-by-play (win probability, scoring plays)",
      url: "https://github.com/nflverse/nflverse-data/releases/tag/pbp",
      license: "CC-BY-4.0",
      coverage: `${FIRST_PBP_SEASON}–${ctx.currentSeason}; only a compact win-probability series and scoring plays are stored`,
      upstreamUpdatedAt: await nflverseUpdatedAt("pbp"),
    });
  },
};
