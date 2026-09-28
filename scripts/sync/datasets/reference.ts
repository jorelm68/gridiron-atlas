import { nflverseAsset, nflverseUpdatedAt } from "../lib/cache";
import { pruneStale, recordSource, upsertRows } from "../lib/db";
import { lit } from "../lib/duck";
import { readSeed, seedPath, type FranchiseSeed } from "../lib/seeds";
import type { Dataset } from "../lib/types";

interface Branding {
  team_abbr: string;
  team_color: string | null;
  team_color2: string | null;
  team_color3: string | null;
  team_color4: string | null;
  team_logo_espn: string | null;
  team_logo_squared: string | null;
  team_wordmark: string | null;
}

const CURRENT_ALIGNMENT_START = 2002;

export const reference: Dataset = {
  id: "reference",
  description: "Franchises, name/city eras, division alignment, team-code map, colors and logos",
  dependsOn: [],
  async run(ctx) {
    const franchises = readSeed<FranchiseSeed[]>("franchises.json");
    const alignment1999 = readSeed<{ division: string; teams: string[] }[]>("divisions-1999-2001.json");
    const teamsFile = await nflverseAsset("teams", "teams_colors_logos.parquet", { refresh: true });

    const branding = new Map(
      (await ctx.duck.all<Branding>(`select * from read_parquet(${lit(teamsFile)})`)).map((b) => [b.team_abbr, b]),
    );

    await upsertRows(
      ctx,
      "franchises",
      franchises.map((f) => {
        const current = f.eras[f.eras.length - 1];
        const b = branding.get(f.id);
        return {
          id: f.id,
          name: current.name,
          location: current.location,
          nickname: current.nickname,
          division_id: f.division,
          founded_season: f.founded,
          origin_league: f.origin_league,
          notes: f.notes,
          color_primary: b?.team_color ?? null,
          color_secondary: b?.team_color2 ?? null,
          color_tertiary: b?.team_color3 ?? null,
          color_quaternary: b?.team_color4 ?? null,
          logo_url: b?.team_logo_espn ?? null,
          logo_squared_url: b?.team_logo_squared ?? null,
          wordmark_url: b?.team_wordmark ?? null,
        };
      }),
      "id",
    );

    await upsertRows(
      ctx,
      "franchise_eras",
      franchises.flatMap((f) =>
        f.eras.map((e) => ({
          franchise_id: f.id,
          start_season: e.from,
          end_season: e.to,
          name: e.name,
          location: e.location,
          nickname: e.nickname,
          city: e.city,
          state: e.state,
          lat: e.lat,
          lng: e.lng,
          note: e.note,
        })),
      ),
      "franchise_id,start_season",
    );

    const division1999 = new Map(alignment1999.flatMap((d) => d.teams.map((team) => [team, d.division] as const)));
    const teamDivisions = franchises.flatMap((f) => [
      ...(division1999.has(f.id)
        ? [{ franchise_id: f.id, start_season: 1999, end_season: CURRENT_ALIGNMENT_START - 1, division_id: division1999.get(f.id)! }]
        : []),
      { franchise_id: f.id, start_season: Math.max(CURRENT_ALIGNMENT_START, f.founded), end_season: null, division_id: f.division },
    ]);
    await upsertRows(ctx, "team_divisions", teamDivisions, "franchise_id,start_season");
    await ctx.duck.tableFromRows("team_divisions", teamDivisions);

    // Other datasets join source team codes against this DuckDB table to resolve franchises.
    await ctx.duck.exec(`
      create or replace table team_abbrs as
      select abbr, "from"::integer as start_season, "to"::integer as end_season, franchise as franchise_id, name
      from read_json(${lit(seedPath("team-abbrs.json"))}, format = 'array')`);
    await upsertRows(ctx, "team_abbrs", await ctx.duck.all(`select * from team_abbrs`), "abbr,start_season");

    for (const table of ["team_abbrs", "team_divisions", "franchise_eras", "franchises"] as const) {
      await pruneStale(ctx, table);
    }

    await recordSource(ctx, {
      id: "nflverse.teams",
      name: "nflverse team colors & logos",
      url: "https://github.com/nflverse/nflverse-data/releases/tag/teams",
      license: "CC-BY-4.0",
      coverage: "32 current teams",
      upstreamUpdatedAt: await nflverseUpdatedAt("teams"),
    });
    await recordSource(ctx, {
      id: "curated.franchises",
      name: "Curated franchise history, team codes, and division alignment",
      url: "https://github.com/jorelm68/gridiron-atlas/tree/main/data/seed",
      coverage: "Franchise eras since 1920; division alignment since 1999",
    });
  },
};
