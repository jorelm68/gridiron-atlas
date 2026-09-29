import { pruneStale, upsertRows } from "../lib/db";
import { seasonScope, seasonsFor } from "../lib/seasons";
import type { Dataset } from "../lib/types";
import { FIRST_ROSTER_SEASON } from "./players";

/**
 * Which team(s) each player was on per season, plus each player's tenure per franchise (`franchise_players`).
 * Reads the `roster_ids` and `player_rows` tables built by the players dataset.
 */
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

    // Tenure per franchise across all history (always recomputed — a new season changes every active tenure).
    const tenures = await ctx.duck.all(`
      with tenure as (
        select franchise_id, player_id, min(season) as first_season, max(season) as last_season,
          count(distinct season) as seasons
        from roster_ids where franchise_id is not null group by all
      )
      select
        t.franchise_id, t.player_id, t.first_season::integer as first_season, t.last_season::integer as last_season,
        t.seasons::integer as seasons, p.display_name, p.position, p.position_group, p.headshot_url,
        p.is_hof, p.hof_class::integer as hof_class, p.career_av::integer as career_av,
        p.pro_bowl_count::integer as pro_bowl_count, p.all_pro_count::integer as all_pro_count,
        (p.is_hof and t.seasons >= 3) as hof_here,
        round(coalesce(p.career_av, 0) * t.seasons / greatest(coalesce(p.seasons_played, 1), 1))::integer as franchise_value
      from tenure t join player_rows p on p.id = t.player_id`);
    await upsertRows(ctx, "franchise_players", tenures, "franchise_id,player_id", { batchSize: 1000 });
    await pruneStale(ctx, "franchise_players");
  },
};
