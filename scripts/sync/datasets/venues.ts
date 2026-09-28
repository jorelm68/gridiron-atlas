import { fetchWithRetry, nflverseAsset } from "../lib/cache";
import { pruneStale, recordSource, upsertRows } from "../lib/db";
import { lit } from "../lib/duck";
import { readSeed } from "../lib/seeds";
import type { Dataset, SyncContext } from "../lib/types";

const USER_AGENT = "GridironAtlas/0.1 (https://github.com/jorelm68/gridiron-atlas)";

interface GameOverride {
  game_id: string;
  stadium_id?: string;
  location?: string;
  reason: string;
}

interface VenueSeed {
  id: string;
  name: string;
  names: { name: string; from: number; to: number }[];
  kind: "home" | "neutral";
  city: string | null;
  region: string | null;
  country: string | null;
  wikipedia: string | null;
  wikidata: string | null;
  lat: number | null;
  lng: number | null;
}

/**
 * Builds `games_src`: nflverse schedules/games.parquet with curated overrides (data/seed/game-overrides.json)
 * applied and away/home franchise ids resolved via team_abbrs. Covers all seasons in the source (1999+).
 * Shared by venues (roof/surface, tenancies) and games (the `games` table, `game_rows`) — safe to call from
 * both in the same run since it's a `create or replace`.
 */
export async function buildGamesSrc(ctx: SyncContext): Promise<void> {
  const gamesFile = await nflverseAsset("schedules", "games.parquet", { refresh: true });
  const overrides = readSeed<GameOverride[]>("game-overrides.json");
  await ctx.duck.tableFromRows("game_overrides", overrides as unknown as Record<string, unknown>[]);

  await ctx.duck.exec(`
    create or replace table games_src as
    select
      g.game_id, g.season::integer as season, g.game_type, g.week::integer as week,
      g.gameday, g.weekday, g.gametime,
      g.away_team, g.home_team,
      aa.franchise_id as away_franchise_id, ha.franchise_id as home_franchise_id,
      g.away_score::integer as away_score, g.home_score::integer as home_score,
      coalesce(o.location, g.location) as location,
      g.overtime::boolean as overtime, g.div_game::boolean as div_game,
      coalesce(o.stadium_id, g.stadium_id) as stadium_id, g.stadium as stadium_name,
      nullif(g.roof, '') as roof, nullif(g.surface, '') as surface,
      g.temp::integer as temp, g.wind::integer as wind,
      g.spread_line::double as spread_line, g.total_line::double as total_line,
      g.away_rest::integer as away_rest, g.home_rest::integer as home_rest,
      g.away_qb_id, g.home_qb_id, g.away_qb_name, g.home_qb_name,
      g.away_coach, g.home_coach, g.referee,
      clean_id(g.espn) as espn_id, clean_id(g.pfr) as pfr_id
    from read_parquet(${lit(gamesFile)}) g
    left join game_overrides o on o.game_id = g.game_id
    left join team_abbrs aa on aa.abbr = g.away_team and g.season between aa.start_season and aa.end_season
    left join team_abbrs ha on ha.abbr = g.home_team and g.season between ha.start_season and ha.end_season`);
}

interface WikiEnrichment {
  summary: string | null;
  imageCandidate: string | null;
  original: string | null;
  thumbnail: string | null;
}

/** Batches Wikipedia page summaries + candidate lead images (≤20 titles/request), following redirects. */
async function fetchWikipediaSummaries(titles: string[]): Promise<Map<string, WikiEnrichment>> {
  const result = new Map<string, WikiEnrichment>();
  for (let i = 0; i < titles.length; i += 20) {
    const batch = titles.slice(i, i + 20);
    const url =
      "https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&redirects=1" +
      "&prop=pageimages|extracts&piprop=original|thumbnail|name&pithumbsize=960&exintro=1&explaintext=1" +
      `&exsentences=3&titles=${encodeURIComponent(batch.join("|"))}`;
    const res = await fetchWithRetry(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) continue;
    const data = (await res.json()) as {
      query?: {
        redirects?: { from: string; to: string }[];
        normalized?: { from: string; to: string }[];
        pages?: { title: string; missing?: boolean; extract?: string; pageimage?: string; original?: { source: string }; thumbnail?: { source: string } }[];
      };
    };
    const resolved = new Map<string, string>();
    for (const r of [...(data.query?.normalized ?? []), ...(data.query?.redirects ?? [])]) resolved.set(r.from, r.to);
    const pages = new Map((data.query?.pages ?? []).map((p) => [p.title, p]));
    for (const title of batch) {
      let final = title;
      if (resolved.has(final)) final = resolved.get(final)!;
      if (resolved.has(final)) final = resolved.get(final)!;
      const page = pages.get(final);
      if (!page || page.missing) continue;
      result.set(title, {
        summary: page.extract ?? null,
        imageCandidate: page.pageimage ?? null,
        original: page.original?.source ?? null,
        thumbnail: page.thumbnail?.source ?? null,
      });
    }
  }
  return result;
}

interface CommonsInfo {
  artist: string | null;
  license: string | null;
  descriptionUrl: string | null;
}

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, "").trim();

/** Confirms candidate lead images are hosted on Wikimedia Commons (free-licensed) and fetches their metadata. */
async function fetchCommonsInfo(fileTitles: string[]): Promise<Map<string, CommonsInfo>> {
  const result = new Map<string, CommonsInfo>();
  for (let i = 0; i < fileTitles.length; i += 50) {
    const batch = fileTitles.slice(i, i + 50);
    const url =
      "https://commons.wikimedia.org/w/api.php?action=query&format=json&formatversion=2&prop=imageinfo" +
      `&iiprop=extmetadata|url&iiextmetadatafilter=Artist|LicenseShortName&titles=${encodeURIComponent(batch.join("|"))}`;
    const res = await fetchWithRetry(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) continue;
    const data = (await res.json()) as {
      query?: {
        pages?: {
          title: string;
          missing?: boolean;
          imageinfo?: { descriptionurl?: string; extmetadata?: { Artist?: { value: string }; LicenseShortName?: { value: string } } }[];
        }[];
      };
    };
    for (const page of data.query?.pages ?? []) {
      const info = page.imageinfo?.[0];
      if (page.missing || !info) continue;
      result.set(page.title.replaceAll("_", " "), {
        artist: info.extmetadata?.Artist?.value ? stripHtml(info.extmetadata.Artist.value) : null,
        license: info.extmetadata?.LicenseShortName?.value ?? null,
        descriptionUrl: info.descriptionurl ?? null,
      });
    }
  }
  return result;
}

interface WikidataClaim {
  rank: "preferred" | "normal" | "deprecated";
  mainsnak: { datavalue?: { value: { amount?: string; time?: string } } };
}
interface WikidataInfo {
  capacity: number | null;
  openedYear: number | null;
}

const claimAmount = (c: WikidataClaim) => Number(c.mainsnak.datavalue?.value.amount ?? 0);

/** Batches Wikidata entities (≤50 ids) for stadium capacity (P1083) and year opened (P1619). */
async function fetchWikidataInfo(ids: string[]): Promise<Map<string, WikidataInfo>> {
  const result = new Map<string, WikidataInfo>();
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&props=claims&ids=${batch.join("|")}`;
    const res = await fetchWithRetry(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) continue;
    const data = (await res.json()) as {
      entities?: Record<string, { missing?: string; claims?: { P1083?: WikidataClaim[]; P1619?: WikidataClaim[] } }>;
    };
    for (const id of batch) {
      const entity = data.entities?.[id];
      if (!entity || entity.missing !== undefined) continue;
      const capClaims = (entity.claims?.P1083 ?? []).filter((c) => c.rank !== "deprecated");
      const preferred = capClaims.filter((c) => c.rank === "preferred");
      const pool = preferred.length ? preferred : capClaims;
      const capClaim = pool.length ? pool.reduce((max, c) => (claimAmount(c) > claimAmount(max) ? c : max)) : null;
      const openedClaim = (entity.claims?.P1619 ?? []).find((c) => c.rank !== "deprecated");
      const time = openedClaim?.mainsnak.datavalue?.value.time;
      result.set(id, {
        capacity: capClaim ? Math.round(claimAmount(capClaim)) : null,
        openedYear: time ? Number(time.match(/-?\d+/)?.[0]) : null,
      });
    }
  }
  return result;
}

export const venues: Dataset = {
  id: "venues",
  description: "Stadiums: locations, photos, capacity, roof/surface, and which teams call them home",
  dependsOn: ["reference"],
  async run(ctx) {
    const seed = readSeed<VenueSeed[]>("venues.json");
    await buildGamesSrc(ctx);

    const roofSurface = new Map(
      (
        await ctx.duck.all<{ id: string; roof: string; surface: string | null }>(`
        with roof_calc as (
          select stadium_id,
            case
              when bool_or(roof in ('open', 'closed')) then 'retractable'
              when bool_or(roof = 'dome') then 'dome'
              else 'open-air'
            end as roof
          from games_src where stadium_id is not null group by stadium_id
        ),
        surface_calc as (
          select stadium_id, surface from games_src
          where stadium_id is not null and surface is not null
          qualify row_number() over (partition by stadium_id order by gameday desc) = 1
        )
        select r.stadium_id as id, r.roof, s.surface
        from roof_calc r left join surface_calc s using (stadium_id)`)
      ).map((r) => [r.id, r]),
    );

    // Enrichment never fails the sync — a network error just keeps the seed values.
    let summaries = new Map<string, WikiEnrichment>();
    let commons = new Map<string, CommonsInfo>();
    let wikidata = new Map<string, WikidataInfo>();
    try {
      summaries = await fetchWikipediaSummaries(seed.map((v) => v.wikipedia).filter((t): t is string => !!t));
      const candidates = [...summaries.values()].map((s) => s.imageCandidate).filter((c): c is string => !!c);
      commons = await fetchCommonsInfo(candidates.map((c) => `File:${c}`));
      wikidata = await fetchWikidataInfo(seed.map((v) => v.wikidata).filter((id): id is string => !!id));
    } catch (err) {
      ctx.log(`  ⚠ venue enrichment failed, keeping seed values: ${err instanceof Error ? err.message : err}`);
    }

    const rows = seed.map((v) => {
      const rs = roofSurface.get(v.id);
      const wiki = v.wikipedia ? summaries.get(v.wikipedia) : undefined;
      const wd = v.wikidata ? wikidata.get(v.wikidata) : undefined;
      const image = wiki?.imageCandidate ? commons.get(`File:${wiki.imageCandidate.replaceAll("_", " ")}`) : undefined;
      return {
        id: v.id,
        name: v.name,
        names: v.names,
        kind: v.kind,
        city: v.city,
        region: v.region,
        country: v.country,
        lat: v.lat,
        lng: v.lng,
        roof: rs?.roof ?? null,
        surface: rs?.surface ?? null,
        capacity: wd?.capacity ?? null,
        opened_year: wd?.openedYear ?? null,
        wikipedia_title: v.wikipedia,
        wikidata_id: v.wikidata,
        summary: wiki?.summary ?? null,
        image_url: image ? (wiki?.original ?? null) : null,
        image_thumb_url: image ? (wiki?.thumbnail ?? null) : null,
        image_credit: image?.artist ?? null,
        image_license: image?.license ?? null,
        image_source_url: image?.descriptionUrl ?? null,
      };
    });
    await upsertRows(ctx, "venues", rows, "id");
    await pruneStale(ctx, "venues");
    await ctx.duck.tableFromRows(
      "venue_ids",
      rows.map((r) => ({ id: r.id })),
    );

    const tenancies = await ctx.duck.all(`
      with tenant_seasons as (
        select home_franchise_id as franchise_id, stadium_id as venue_id, season
        from games_src
        where location = 'Home' and home_franchise_id is not null and stadium_id is not null
        group by all
        having count(*) >= 2
      ),
      islands as (
        select franchise_id, venue_id, season,
          season - row_number() over (partition by franchise_id, venue_id order by season) as grp
        from tenant_seasons
      )
      select franchise_id, venue_id, min(season)::integer as start_season, max(season)::integer as end_season
      from islands group by franchise_id, venue_id, grp`);
    await upsertRows(ctx, "venue_tenancies", tenancies, "venue_id,franchise_id,start_season");
    await pruneStale(ctx, "venue_tenancies");

    await recordSource(ctx, {
      id: "curated.venues",
      name: "Curated venue locations, naming history, and international-game tenancies",
      url: "https://github.com/jorelm68/gridiron-atlas/tree/main/data/seed",
      coverage: `${seed.length} venues`,
    });
    await recordSource(ctx, {
      id: "wikipedia.venues",
      name: "Wikipedia summaries and Wikimedia Commons images",
      url: "https://en.wikipedia.org",
      license: "CC-BY-SA-4.0 (text); images per-file licenses",
      coverage: "Venue summaries, capacity, opened year, and free-licensed lead images",
    });
  },
};
