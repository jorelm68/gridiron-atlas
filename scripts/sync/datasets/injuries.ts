import { nflverseSeasonAssets, nflverseUpdatedAt } from "../lib/cache";
import { pruneStale, recordSource, upsertRows } from "../lib/db";
import { litList } from "../lib/duck";
import { seasonScope, seasonsFor } from "../lib/seasons";
import type { Dataset } from "../lib/types";

const FIRST_INJURY_SEASON = 2009;

/**
 * Weekly injury reports (2009+), one row per player per team-week. The report_* columns are the official game-day
 * designation (Out / Doubtful / Questionable); players who only appear on the practice report keep a null
 * report_status and take their injury text from the practice columns. A player re-listed within a week (2024 has
 * two such rows) keeps the latest report by date_modified.
 */
export const injuries: Dataset = {
  id: "injuries",
  description: "Weekly injury reports since 2009: game status, injury, practice participation",
  dependsOn: ["players"],
  async run(ctx) {
    const seasons = seasonsFor(ctx, FIRST_INJURY_SEASON);
    if (seasons.length === 0) return;
    const files = await nflverseSeasonAssets(ctx, "injuries", "injuries", seasons);
    if (files.size === 0) {
      ctx.log(`  injuries: no report files published yet for ${seasons.join(", ")}`);
      return;
    }
    const { duck } = ctx;

    await duck.exec(
      `create or replace table src_injuries as select * from read_parquet(${litList([...files.values()])}, union_by_name = true)`,
    );
    await duck.exec(`alter table src_injuries add column if not exists date_modified varchar`); // absent from newer files

    const rows = await duck.all<{ player_id: string | null }>(`
      select
        i.season::integer as season, i.week::integer as week, i.game_type, i.team as team_abbr, a.franchise_id,
        i.full_name as player_name, p.id as player_id, i.position, i.report_status,
        case when i.report_primary_injury is not null then i.report_primary_injury else i.practice_primary_injury end as primary_injury,
        case when i.report_primary_injury is not null then i.report_secondary_injury else i.practice_secondary_injury end as secondary_injury,
        i.practice_status
      from src_injuries i
      left join team_abbrs a on a.abbr = i.team and i.season between a.start_season and a.end_season
      left join player_rows p on p.id = clean_id(i.gsis_id)
      where i.full_name is not null and i.team is not null and i.week is not null and i.game_type is not null
      qualify row_number() over (
        partition by i.season, i.week, i.game_type, i.team, i.full_name
        order by try_cast(i.date_modified as timestamptz) desc nulls last, i.report_status is null
      ) = 1`);

    ctx.log(`  injuries: ${rows.length.toLocaleString()} rows, ${rows.filter((r) => !r.player_id).length} players unmatched`);
    await upsertRows(ctx, "injury_reports", rows, "season,week,game_type,team_abbr,player_name", { batchSize: 1000 });
    await pruneStale(ctx, "injury_reports", seasonScope(ctx, [...files.keys()]));

    await recordSource(ctx, {
      id: "nflverse.injuries",
      name: "nflverse weekly injury reports",
      url: "https://github.com/nflverse/nflverse-data/releases/tag/injuries",
      license: "CC-BY-4.0",
      coverage: `${FIRST_INJURY_SEASON}–${ctx.currentSeason}, weekly`,
      upstreamUpdatedAt: await nflverseUpdatedAt("injuries"),
    });
  },
};
