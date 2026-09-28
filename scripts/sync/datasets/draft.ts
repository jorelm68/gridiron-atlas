import { nflverseAsset, nflverseUpdatedAt } from "../lib/cache";
import { pruneStale, recordSource, upsertRows } from "../lib/db";
import { lit } from "../lib/duck";
import type { Dataset } from "../lib/types";

const FIRST_DRAFT_SEASON = 1980;

/** Every draft pick (nflverse covers 1980+) with career honors, linked to `players` where possible. */
export const draft: Dataset = {
  id: "draft",
  description: "Every draft pick since 1980 with career honors",
  dependsOn: ["players"],
  async run(ctx) {
    const draftFile = await nflverseAsset("draft_picks", "draft_picks.parquet", { refresh: true });

    const rows = await ctx.duck.all(`
      with src as (
        select
          season, round, pick, team,
          clean_id(gsis_id) as gsis_id, clean_id(pfr_player_id) as pfr_player_id, pfr_player_name,
          hof, position, side, college, age, "to", allpro, probowls, seasons_started, w_av, games
        from read_parquet(${lit(draftFile)})
      )
      select
        d.season::integer as season, d.pick::integer as pick, d.round::integer as round,
        d.team as team_abbr, draft_franchise(d.team, d.season) as franchise_id,
        coalesce(p1.id, p2.id) as player_id,
        d.pfr_player_id, d.pfr_player_name as player_name, d.position, d.side, d.college,
        d.age::integer as age, coalesce(d.hof, false) as is_hof,
        d.allpro::integer as all_pro_count, d.probowls::integer as pro_bowl_count,
        d.seasons_started::integer as seasons_started, d.w_av::integer as career_av,
        d.games::integer as games, d."to"::integer as last_season
      from src d
      left join player_rows p1 on p1.id = d.gsis_id
      left join player_rows p2 on p2.pfr_id = d.pfr_player_id
      where d.season >= ${FIRST_DRAFT_SEASON}`);

    await upsertRows(ctx, "draft_picks", rows, "season,pick");
    await pruneStale(ctx, "draft_picks");

    await recordSource(ctx, {
      id: "nflverse.draft_picks",
      name: "nflverse draft picks",
      url: "https://github.com/nflverse/nflverse-data/releases/tag/draft_picks",
      license: "CC-BY-4.0",
      coverage: `${FIRST_DRAFT_SEASON}–present`,
      upstreamUpdatedAt: await nflverseUpdatedAt("draft_picks"),
    });
  },
};
