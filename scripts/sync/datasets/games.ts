import { nflverseUpdatedAt } from "../lib/cache";
import { pruneStale, recordSource, upsertRows } from "../lib/db";
import { seasonScope, seasonsFor } from "../lib/seasons";
import type { Dataset } from "../lib/types";
import { buildGamesSrc } from "./venues";

const FIRST_GAME_SEASON = 1999;

export const games: Dataset = {
  id: "games",
  description: "Every game since 1999: schedule, scores, venue, spread, weather, coaches, QBs",
  dependsOn: ["reference", "venues"],
  async run(ctx) {
    // Rebuild games_src here too (cheap, idempotent) in case games ran without venues in the same process.
    await buildGamesSrc(ctx);

    // Leave the full-history working table for stats, team-seasons, and super-bowls, regardless of --seasons scope.
    await ctx.duck.exec(`
      create or replace table game_rows as
      select
        game_id as id, season, game_type, week, gameday, weekday, gametime,
        away_team as away_abbr, home_team as home_abbr,
        away_franchise_id, home_franchise_id, away_score, home_score, location,
        overtime, div_game, stadium_id, stadium_name, roof, surface, temp, wind,
        spread_line, total_line, away_rest, home_rest,
        away_qb_id, home_qb_id, away_qb_name, home_qb_name,
        away_coach, home_coach, referee, espn_id, pfr_id
      from games_src`);

    const seasons = seasonsFor(ctx, FIRST_GAME_SEASON);
    if (seasons.length > 0) {
      const rows = await ctx.duck.all(`
        select
          id, season::integer as season, game_type, week::integer as week,
          gameday::varchar as gameday, weekday, gametime,
          away_abbr, home_abbr, away_franchise_id, home_franchise_id,
          away_score, home_score, location, overtime, div_game,
          case when stadium_id in (select id from venue_ids) then stadium_id end as venue_id,
          stadium_name as venue_name, roof, surface, temp, wind,
          spread_line, total_line, away_rest, home_rest,
          away_qb_id, home_qb_id, away_qb_name, home_qb_name,
          away_coach, home_coach, referee, espn_id, pfr_id
        from game_rows
        where season in (${seasons.join(", ")})`);
      await upsertRows(ctx, "games", rows, "id");
      await pruneStale(ctx, "games", seasonScope(ctx, seasons));
    }

    await recordSource(ctx, {
      id: "nflverse.games",
      name: "nflverse schedules & game results",
      url: "https://github.com/nflverse/nflverse-data/releases/tag/schedules",
      license: "CC-BY-4.0",
      coverage: `${FIRST_GAME_SEASON}–${ctx.currentSeason}`,
      upstreamUpdatedAt: await nflverseUpdatedAt("schedules"),
    });
  },
};
