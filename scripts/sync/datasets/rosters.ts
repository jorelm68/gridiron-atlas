import { pruneStale, upsertRows } from "../lib/db";
import { seasonScope, seasonsFor } from "../lib/seasons";
import type { Dataset } from "../lib/types";
import { FIRST_ROSTER_SEASON } from "./players";

/** Which team(s) each player was on per season. Reads the `roster_ids` table built by the players dataset. */
export const rosters: Dataset = {
  id: "rosters",
  description: "Player-team-season rows from season rosters (1920+)",
  dependsOn: ["players"],
  async run(ctx) {
    const seasons = seasonsFor(ctx, FIRST_ROSTER_SEASON);
    if (seasons.length === 0) return;

    const rows = await ctx.duck.all(`
      select
        player_id, season::integer as season, team as team_abbr, franchise_id, position, depth_chart_position,
        jersey_number::integer as jersey_number, status, years_exp::integer as years_exp
      from roster_ids
      where season between ${seasons[0]} and ${seasons[seasons.length - 1]}
        and season in (${seasons.join(", ")})
      qualify row_number() over (partition by player_id, season, team order by week desc nulls last) = 1`);

    await upsertRows(ctx, "player_seasons", rows, "player_id,season,team_abbr", { batchSize: 1000 });
    await pruneStale(ctx, "player_seasons", seasonScope(ctx, seasons));
  },
};
