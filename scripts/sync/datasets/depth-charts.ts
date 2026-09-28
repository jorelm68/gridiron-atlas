import { nflverseAsset, nflverseUpdatedAt } from "../lib/cache";
import { pruneStale, recordSource, upsertRows } from "../lib/db";
import { lit } from "../lib/duck";
import type { Dataset } from "../lib/types";

/**
 * Each team's latest depth-chart snapshot from nflverse (ESPN data, 2025+ format). The file holds every snapshot
 * of the season, so only rows at each team's max(dt) are kept. `slot` is the spot in the formation (one row per
 * position on the field diagram) and `depth` counts that slot's players (1 = starter) in pos_rank order — nflverse
 * ranks WRs across the whole group, so slot 1's backups arrive as ranks 4, 7, … and are renumbered here.
 * Offense is the '3WR 1TE' formation, defense the 'Base 3-4 D' / 'Base 4-3 D' front, plus 'Special Teams'.
 * Players resolve through gsis_id, then espn_id.
 */
export const depthCharts: Dataset = {
  id: "depth-charts",
  description: "Current depth charts: latest snapshot per team, offense/defense/special teams",
  dependsOn: ["players"],
  async run(ctx) {
    const asset = `depth_charts_${ctx.currentSeason}.parquet`;
    let file: string;
    try {
      file = await nflverseAsset("depth_charts", asset, { refresh: true });
    } catch (err) {
      if (!(err instanceof Error && err.message.includes("HTTP 404"))) throw err;
      ctx.log(`  depth charts: ${asset} is not published yet; keeping existing rows`);
      return;
    }

    const rows = await ctx.duck.all<{ franchise_id: string | null; player_id: string | null; unit: string }>(`
      with latest as (
        select * from read_parquet(${lit(file)})
        qualify dt = max(dt) over (partition by team)
      )
      select
        a.franchise_id, d.pos_grp as formation, d.pos_slot::integer as slot,
        row_number() over (partition by d.team, d.pos_grp, d.pos_slot order by d.pos_rank)::integer as depth,
        case when d.pos_grp = 'Special Teams' then 'special_teams' when d.pos_grp like '% D' then 'defense' else 'offense' end as unit,
        d.pos_abb as position, d.pos_name as position_name,
        coalesce(p1.id, p2.id) as player_id, d.player_name, d.dt as as_of
      from latest d
      left join team_abbrs a on a.abbr = d.team and ${ctx.currentSeason} between a.start_season and a.end_season
      left join player_rows p1 on p1.id = clean_id(d.gsis_id)
      left join player_rows p2 on p2.espn_id = clean_id(d.espn_id) and p1.id is null
      where d.player_name is not null and d.pos_slot is not null`);

    const usable = rows.filter((r) => r.franchise_id);
    const units = Object.fromEntries(["offense", "defense", "special_teams"].map((u) => [u, usable.filter((r) => r.unit === u).length]));
    ctx.log(
      `  depth charts: ${usable.length.toLocaleString()} rows (${JSON.stringify(units)}); ` +
        `${rows.length - usable.length} dropped for unknown team, ${usable.filter((r) => !r.player_id).length} players unmatched`,
    );

    await upsertRows(ctx, "depth_charts", usable, "franchise_id,formation,slot,depth");
    await pruneStale(ctx, "depth_charts");

    await recordSource(ctx, {
      id: "nflverse.depth_charts",
      name: "nflverse depth charts",
      url: "https://github.com/nflverse/nflverse-data/releases/tag/depth_charts",
      license: "CC-BY-4.0",
      coverage: `${ctx.currentSeason}, latest snapshot per team`,
      upstreamUpdatedAt: await nflverseUpdatedAt("depth_charts"),
    });
  },
};
