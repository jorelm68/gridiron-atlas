import { nflverseAsset, nflverseUpdatedAt } from "../lib/cache";
import { pruneStale, recordSource, upsertRows } from "../lib/db";
import { litList } from "../lib/duck";
import { seasonScope, seasonsFor } from "../lib/seasons";
import type { Dataset, SyncContext } from "../lib/types";

const FIRST_STATS_SEASON = 1999;

/** Downloads one release asset per season, 8 at a time; the current season is always re-downloaded. */
async function seasonFiles(
  ctx: SyncContext,
  tag: string,
  prefix: string,
  seasons: number[],
): Promise<string[]> {
  const files: string[] = [];
  for (let i = 0; i < seasons.length; i += 8) {
    const chunk = seasons.slice(i, i + 8);
    files.push(
      ...(await Promise.all(
        chunk.map((season) =>
          nflverseAsset(tag, `${prefix}_${season}.parquet`, {
            refresh: ctx.refresh || season === ctx.currentSeason,
          }),
        ),
      )),
    );
  }
  return files;
}

export const stats: Dataset = {
  id: "stats",
  description: "Per-game player and team box-score stats (1999+)",
  dependsOn: ["players", "games"],
  async run(ctx) {
    const seasons = seasonsFor(ctx, FIRST_STATS_SEASON);
    if (seasons.length === 0) return;
    const { duck } = ctx;

    // One season per pass keeps memory bounded on --full runs (~20k player rows per season).
    const playerFiles = await seasonFiles(
      ctx,
      "stats_player",
      "stats_player_week",
      seasons,
    );
    const teamFiles = await seasonFiles(
      ctx,
      "stats_team",
      "stats_team_week",
      seasons,
    );
    let droppedPlayer = 0;
    let droppedTeam = 0;

    for (const [i, season] of seasons.entries()) {
      // ── Player stats ──────────────────────────────────────────────────────────
      await duck.exec(
        `create or replace table src_player_stats as select * from read_parquet(${litList([playerFiles[i]])}, union_by_name = true)`,
      );
      const totalPlayer = (
        await duck.one<{ n: number }>(
          `select count(*)::integer as n from src_player_stats`,
        )
      ).n;

      await duck.exec(`
      create or replace table season_pgs as
      select
        s.player_id, s.game_id, s.season::integer as season, s.week::integer as week, s.season_type,
        s.team as team_abbr, a.franchise_id, s.opponent_team as opponent_abbr, s.position,
        nz(s.completions) as completions, nz(s.attempts) as attempts,
        nz(s.passing_yards) as passing_yards, nz(s.passing_tds) as passing_tds,
        nz(s.passing_interceptions) as passing_interceptions,
        nz(s.sacks_suffered) as sacks_suffered, nz(s.sack_yards_lost) as sack_yards_lost,
        nz(s.passing_air_yards) as passing_air_yards, nz(s.passing_yards_after_catch) as passing_yards_after_catch,
        nz(s.passing_first_downs) as passing_first_downs,
        nz(s.passing_epa) as passing_epa, nz(s.passing_cpoe) as passing_cpoe,
        nz(s.passing_2pt_conversions) as passing_2pt_conversions,
        nz(s.carries) as carries, nz(s.rushing_yards) as rushing_yards, nz(s.rushing_tds) as rushing_tds,
        nz(s.rushing_first_downs) as rushing_first_downs, nz(s.rushing_epa) as rushing_epa,
        nz(s.rushing_2pt_conversions) as rushing_2pt_conversions,
        nz(s.targets) as targets, nz(s.receptions) as receptions,
        nz(s.receiving_yards) as receiving_yards, nz(s.receiving_tds) as receiving_tds,
        nz(s.receiving_air_yards) as receiving_air_yards, nz(s.receiving_yards_after_catch) as receiving_yards_after_catch,
        nz(s.receiving_first_downs) as receiving_first_downs,
        nz(s.receiving_epa) as receiving_epa, nz(s.receiving_2pt_conversions) as receiving_2pt_conversions,
        nz(s.fumbles_lost_total) as fumbles_lost,
        nz(s.def_tackles_solo) as def_tackles_solo, nz(s.def_tackle_assists) as def_tackle_assists,
        nz(s.def_tackles_for_loss) as def_tackles_for_loss, nz(s.def_sacks) as def_sacks,
        nz(s.def_qb_hits) as def_qb_hits, nz(s.def_interceptions) as def_interceptions,
        nz(s.def_pass_defended) as def_pass_defended, nz(s.def_fumbles_forced) as def_fumbles_forced,
        nz(s.def_tds) as def_tds, nz(s.def_safeties) as def_safeties,
        nz(s.punt_returns) as punt_returns, nz(s.punt_return_yards) as punt_return_yards,
        nz(s.kickoff_returns) as kickoff_returns, nz(s.kickoff_return_yards) as kickoff_return_yards,
        nz(s.special_teams_tds) as special_teams_tds,
        nz(s.fg_made) as fg_made, nz(s.fg_att) as fg_att, nz(s.fg_long) as fg_long,
        nz(coalesce(s.fg_made_50_59, 0) + coalesce(s.fg_made_60_, 0)) as fg_made_50_plus,
        nz(s.pat_made) as pat_made, nz(s.pat_att) as pat_att,
        nz(s.pt_att) as punts, nz(s.pt_yards) as punt_yards, nz(s.pt_inside_20) as punts_inside_20
      from src_player_stats s
      left join team_abbrs a on a.abbr = s.team and s.season between a.start_season and a.end_season
      where s.player_id in (select id from player_rows) and s.game_id in (select id from game_rows) and s.team is not null`);
      const playerRows = await duck.all(`select * from season_pgs`);
      droppedPlayer += totalPlayer - playerRows.length;
      await upsertRows(
        ctx,
        "player_game_stats",
        playerRows,
        "player_id,game_id",
        { batchSize: 1000 },
      );

      // Season totals (REG/POST) for this season, summed here so readers never aggregate game rows.
      const totals = await duck.all(`
        select
          player_id, season, season_type, count(*)::integer as games,
          arg_max(franchise_id, week) as last_franchise_id,
          coalesce(list_sort(list_distinct(list(franchise_id) filter (where franchise_id is not null))), []) as franchise_ids,
          coalesce(sum(completions), 0)::integer as completions, coalesce(sum(attempts), 0)::integer as attempts, coalesce(sum(passing_yards), 0)::integer as passing_yards,
          coalesce(sum(passing_tds), 0)::integer as passing_tds, coalesce(sum(passing_interceptions), 0)::integer as passing_interceptions, coalesce(sum(sacks_suffered), 0)::integer as sacks_suffered,
          coalesce(sum(sack_yards_lost), 0)::integer as sack_yards_lost, coalesce(sum(passing_air_yards), 0)::integer as passing_air_yards, coalesce(sum(passing_yards_after_catch), 0)::integer as passing_yards_after_catch,
          coalesce(sum(passing_first_downs), 0)::integer as passing_first_downs, coalesce(sum(passing_2pt_conversions), 0)::integer as passing_2pt_conversions, coalesce(sum(carries), 0)::integer as carries,
          coalesce(sum(rushing_yards), 0)::integer as rushing_yards, coalesce(sum(rushing_tds), 0)::integer as rushing_tds, coalesce(sum(rushing_first_downs), 0)::integer as rushing_first_downs,
          coalesce(sum(rushing_2pt_conversions), 0)::integer as rushing_2pt_conversions, coalesce(sum(targets), 0)::integer as targets, coalesce(sum(receptions), 0)::integer as receptions,
          coalesce(sum(receiving_yards), 0)::integer as receiving_yards, coalesce(sum(receiving_tds), 0)::integer as receiving_tds, coalesce(sum(receiving_air_yards), 0)::integer as receiving_air_yards,
          coalesce(sum(receiving_yards_after_catch), 0)::integer as receiving_yards_after_catch, coalesce(sum(receiving_first_downs), 0)::integer as receiving_first_downs, coalesce(sum(receiving_2pt_conversions), 0)::integer as receiving_2pt_conversions,
          coalesce(sum(fumbles_lost), 0)::integer as fumbles_lost, coalesce(sum(def_tackles_solo), 0)::integer as def_tackles_solo, coalesce(sum(def_tackle_assists), 0)::integer as def_tackle_assists,
          coalesce(sum(def_qb_hits), 0)::integer as def_qb_hits, coalesce(sum(def_interceptions), 0)::integer as def_interceptions, coalesce(sum(def_pass_defended), 0)::integer as def_pass_defended,
          coalesce(sum(def_fumbles_forced), 0)::integer as def_fumbles_forced, coalesce(sum(def_tds), 0)::integer as def_tds, coalesce(sum(def_safeties), 0)::integer as def_safeties,
          coalesce(sum(punt_returns), 0)::integer as punt_returns, coalesce(sum(punt_return_yards), 0)::integer as punt_return_yards, coalesce(sum(kickoff_returns), 0)::integer as kickoff_returns,
          coalesce(sum(kickoff_return_yards), 0)::integer as kickoff_return_yards, coalesce(sum(special_teams_tds), 0)::integer as special_teams_tds, coalesce(sum(fg_made), 0)::integer as fg_made,
          coalesce(sum(fg_att), 0)::integer as fg_att, coalesce(sum(fg_made_50_plus), 0)::integer as fg_made_50_plus, coalesce(sum(pat_made), 0)::integer as pat_made,
          coalesce(sum(pat_att), 0)::integer as pat_att, coalesce(sum(punts), 0)::integer as punts, coalesce(sum(punt_yards), 0)::integer as punt_yards,
          coalesce(sum(punts_inside_20), 0)::integer as punts_inside_20, coalesce(sum(passing_epa), 0)::double as passing_epa, coalesce(sum(rushing_epa), 0)::double as rushing_epa,
          coalesce(sum(receiving_epa), 0)::double as receiving_epa, coalesce(sum(def_tackles_for_loss), 0)::double as def_tackles_for_loss, coalesce(sum(def_sacks), 0)::double as def_sacks,
          case when sum(attempts) filter (where passing_cpoe is not null) > 0
            then sum(passing_cpoe * attempts) filter (where passing_cpoe is not null)
              / sum(attempts) filter (where passing_cpoe is not null) end as passing_cpoe,
          max(fg_long)::integer as fg_long
        from season_pgs
        group by player_id, season, season_type`);
      await upsertRows(ctx, "player_season_stats", totals, "player_id,season,season_type", { batchSize: 1000 });

      // ── Team stats ────────────────────────────────────────────────────────────
      await duck.exec(
        `create or replace table src_team_stats as select * from read_parquet(${litList([teamFiles[i]])}, union_by_name = true)`,
      );
      const totalTeam = (
        await duck.one<{ n: number }>(
          `select count(*)::integer as n from src_team_stats`,
        )
      ).n;

      const teamRows = await duck.all(`
      select
        s.game_id, s.team as team_abbr, a.franchise_id, s.season::integer as season, s.week::integer as week,
        s.season_type, s.opponent_team as opponent_abbr,
        nz(s.completions) as completions, nz(s.attempts) as attempts,
        nz(s.passing_yards) as passing_yards, nz(s.passing_tds) as passing_tds,
        nz(s.passing_interceptions) as passing_interceptions,
        nz(s.sacks_suffered) as sacks_suffered, nz(s.sack_yards_lost) as sack_yards_lost,
        nz(s.passing_air_yards) as passing_air_yards, nz(s.passing_first_downs) as passing_first_downs,
        nz(s.passing_epa) as passing_epa, nz(s.passing_cpoe) as passing_cpoe,
        nz(s.carries) as carries, nz(s.rushing_yards) as rushing_yards, nz(s.rushing_tds) as rushing_tds,
        nz(s.rushing_first_downs) as rushing_first_downs, nz(s.rushing_epa) as rushing_epa,
        nz(s.targets) as targets, nz(s.receptions) as receptions,
        nz(s.fumbles_total) as fumbles_total, nz(s.fumbles_lost_total) as fumbles_lost,
        nz(s.penalties) as penalties, nz(s.penalty_yards) as penalty_yards,
        nz(s.def_sacks) as def_sacks, nz(s.def_qb_hits) as def_qb_hits,
        nz(s.def_tackles_for_loss) as def_tackles_for_loss, nz(s.def_interceptions) as def_interceptions,
        nz(s.def_pass_defended) as def_pass_defended, nz(s.def_fumbles_forced) as def_fumbles_forced,
        nz(s.def_tds) as def_tds, nz(s.def_safeties) as def_safeties, nz(s.special_teams_tds) as special_teams_tds,
        nz(s.punt_returns) as punt_returns, nz(s.punt_return_yards) as punt_return_yards,
        nz(s.kickoff_returns) as kickoff_returns, nz(s.kickoff_return_yards) as kickoff_return_yards,
        nz(s.fg_made) as fg_made, nz(s.fg_att) as fg_att, nz(s.pat_made) as pat_made, nz(s.pat_att) as pat_att,
        nz(s.pt_att) as punts, nz(s.pt_yards) as punt_yards
      from src_team_stats s
      left join team_abbrs a on a.abbr = s.team and s.season between a.start_season and a.end_season
      where s.game_id in (select id from game_rows) and s.team is not null`);
      droppedTeam += totalTeam - teamRows.length;
      await upsertRows(ctx, "team_game_stats", teamRows, "game_id,team_abbr");
      ctx.log(
        `  stats ${season}: ${playerRows.length.toLocaleString()} player rows, ${teamRows.length.toLocaleString()} team rows`,
      );
    }

    ctx.log(
      `  dropped ${droppedPlayer} player rows (unknown player/game or missing team) and ${droppedTeam} team rows (unknown game or missing team)`,
    );
    await pruneStale(ctx, "player_game_stats", seasonScope(ctx, seasons));
    await pruneStale(ctx, "team_game_stats", seasonScope(ctx, seasons));
    await pruneStale(ctx, "player_season_stats", seasonScope(ctx, seasons));

    await recordSource(ctx, {
      id: "nflverse.stats_player",
      name: "nflverse player box-score stats",
      url: "https://github.com/nflverse/nflverse-data/releases/tag/stats_player",
      license: "CC-BY-4.0",
      coverage: `${FIRST_STATS_SEASON}–${ctx.currentSeason}, weekly`,
      upstreamUpdatedAt: await nflverseUpdatedAt("stats_player"),
    });
    await recordSource(ctx, {
      id: "nflverse.stats_team",
      name: "nflverse team box-score stats",
      url: "https://github.com/nflverse/nflverse-data/releases/tag/stats_team",
      license: "CC-BY-4.0",
      coverage: `${FIRST_STATS_SEASON}–${ctx.currentSeason}, weekly`,
      upstreamUpdatedAt: await nflverseUpdatedAt("stats_team"),
    });
  },
};
