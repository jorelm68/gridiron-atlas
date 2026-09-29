import { nflverseSeasonAssets, nflverseUpdatedAt } from "../lib/cache";
import { pruneStale, recordSource, upsertRows } from "../lib/db";
import { lit } from "../lib/duck";
import { seasonScope, seasonsFor } from "../lib/seasons";
import type { Dataset } from "../lib/types";

const FIRST_SNAP_SEASON = 2012; // nflverse's 2012 file is published empty; real data starts in 2013

/**
 * Snap counts per player per game (Pro Football Reference via nflverse). Players resolve through
 * player_rows.pfr_id = pfr_player_id; player_id is required, so unmatched players and games missing from
 * `game_rows` are dropped and counted. The source's *_pct are fractions (0–1) and become whole percents; like the
 * box-score tables, zero snaps are stored as NULL (a percent stays null unless the player took snaps).
 */
export const snaps: Dataset = {
  id: "snaps",
  description: "Snap counts per player per game since 2013: offense, defense, special teams",
  dependsOn: ["players", "games"],
  async run(ctx) {
    const seasons = seasonsFor(ctx, FIRST_SNAP_SEASON);
    if (seasons.length === 0) return;
    const files = await nflverseSeasonAssets(ctx, "snap_counts", "snap_counts", seasons);
    const { duck } = ctx;
    let dropped = 0;

    for (const season of seasons) {
      const file = files.get(season);
      if (!file) continue;
      await duck.exec(`create or replace table src_snaps as select * from read_parquet(${lit(file)})`);
      const { n: total } = await duck.one<{ n: number }>(`select count(*)::integer as n from src_snaps`);
      if (total === 0) continue;

      const rows = await duck.all(`
        select
          p.id as player_id, s.game_id, s.season::integer as season, s.week::integer as week,
          s.team as team_abbr, a.franchise_id, s.position,
          nz(s.offense_snaps)::integer as offense_snaps, case when s.offense_snaps > 0 then round(s.offense_pct * 100)::integer end as offense_pct,
          nz(s.defense_snaps)::integer as defense_snaps, case when s.defense_snaps > 0 then round(s.defense_pct * 100)::integer end as defense_pct,
          nz(s.st_snaps)::integer as st_snaps, case when s.st_snaps > 0 then round(s.st_pct * 100)::integer end as st_pct
        from src_snaps s
        join player_rows p on p.pfr_id = s.pfr_player_id
        left join team_abbrs a on a.abbr = s.team and s.season between a.start_season and a.end_season
        where s.game_id in (select id from game_rows)
        qualify row_number() over (
          partition by p.id, s.game_id order by coalesce(s.offense_snaps, 0) + coalesce(s.defense_snaps, 0) + coalesce(s.st_snaps, 0) desc
        ) = 1`);
      dropped += total - rows.length;
      await upsertRows(ctx, "player_game_snaps", rows, "player_id,game_id", { batchSize: 1000 });
      ctx.log(`  snaps ${season}: ${rows.length.toLocaleString()} rows (${(total - rows.length).toLocaleString()} dropped: unmatched player or unknown game)`);
    }

    ctx.log(`  snaps: dropped ${dropped.toLocaleString()} rows without a matching player or game`);
    await pruneStale(ctx, "player_game_snaps", seasonScope(ctx, [...files.keys()]));

    await recordSource(ctx, {
      id: "nflverse.snap_counts",
      name: "nflverse snap counts",
      url: "https://github.com/nflverse/nflverse-data/releases/tag/snap_counts",
      license: "CC-BY-4.0",
      coverage: `2013–${ctx.currentSeason}, per game`,
      upstreamUpdatedAt: await nflverseUpdatedAt("snap_counts"),
    });
  },
};
