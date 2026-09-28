import { nflverseAsset, nflverseUpdatedAt } from "../lib/cache";
import { pruneStale, recordSource, upsertRows } from "../lib/db";
import { lit, litList } from "../lib/duck";
import { range } from "../lib/seasons";
import { seedPath } from "../lib/seeds";
import type { Dataset, SyncContext } from "../lib/types";

export const FIRST_ROSTER_SEASON = 1920;

/** Every season roster, downloaded once and cached; the current season is re-downloaded each run. */
async function rosterFiles(ctx: SyncContext): Promise<string[]> {
  const seasons = range(FIRST_ROSTER_SEASON, ctx.currentSeason);
  const files: string[] = [];
  for (let i = 0; i < seasons.length; i += 8) {
    const chunk = seasons.slice(i, i + 8);
    files.push(
      ...(await Promise.all(
        chunk.map((season) =>
          nflverseAsset("rosters", `roster_${season}.parquet`, { refresh: ctx.refresh || season === ctx.currentSeason }),
        ),
      )),
    );
  }
  return files;
}

/**
 * Builds one identity per real person across 1920–today and upserts `players`.
 *
 * Modern players (nflverse players file, rookies 1974+) are keyed by gsis_id. Older roster rows carry no IDs, so
 * they are matched to a modern player by normalized name + birth date when that match is unique; otherwise they
 * get a stable historical id 'h-<name>-<yyyymmdd>' (or, without a birth date, 'h-<name>-<team><first season>').
 *
 * Leaves DuckDB tables `roster_ids` (every roster row with its player_id and franchise) and `player_rows`
 * (the upserted players) for the rosters, stats, and draft datasets.
 */
export const players: Dataset = {
  id: "players",
  description: "Every player since 1920: identity, bio, career span, current team, draft, honors",
  dependsOn: ["reference"],
  async run(ctx) {
    const playersFile = await nflverseAsset("players", "players.parquet", { refresh: true });
    const draftFile = await nflverseAsset("draft_picks", "draft_picks.parquet", { refresh: true });
    const rosters = await rosterFiles(ctx);
    const { duck } = ctx;

    await duck.exec(`
      create or replace table src_players as
      select
        clean_id(gsis_id) as gsis_id, display_name, first_name, last_name, football_name, suffix,
        clean_id(pfr_id) as pfr_id, clean_id(espn_id) as espn_id, clean_id(pff_id) as pff_id, clean_id(otc_id) as otc_id,
        try_cast(birth_date as date) as birth_date, inches(height) as height_in, try_cast(weight as integer) as weight_lb,
        college_name as college, position, position_group, headshot as headshot_url,
        try_cast(rookie_season as integer) as rookie_season, try_cast(last_season as integer) as last_season,
        try_cast(years_of_experience as integer) as years_exp, try_cast(jersey_number as integer) as jersey_number,
        try_cast(draft_year as integer) as draft_year, try_cast(draft_round as integer) as draft_round,
        try_cast(draft_pick as integer) as draft_pick, draft_team
      from read_parquet(${lit(playersFile)})
      where gsis_id is not null`);

    await duck.exec(`
      create or replace table src_rosters as
      select
        try_cast(season as integer) as season, team, position, depth_chart_position,
        try_cast(jersey_number as integer) as jersey_number, status, full_name, first_name, last_name,
        try_cast(birth_date as date) as birth_date, inches(height) as height_in, try_cast(weight as integer) as weight_lb,
        college, clean_id(gsis_id) as gsis_id, clean_id(pfr_id) as pfr_id, headshot_url,
        try_cast(years_exp as integer) as years_exp, try_cast(week as integer) as week
      from read_parquet(${litList(rosters)}, union_by_name = true)
      where full_name is not null`);

    // Name + birth date keys that point at exactly one gsis_id.
    await duck.exec(`
      create or replace table identity_keys as
      with keyed as (
        select gsis_id, norm_name(display_name) || '|' || birth_date as k from src_players where birth_date is not null
        union all
        select gsis_id, norm_name(first_name || ' ' || last_name) || '|' || birth_date from src_players where birth_date is not null
        union all
        select gsis_id, norm_name(full_name) || '|' || birth_date from src_rosters where gsis_id is not null and birth_date is not null
      )
      select k, min(gsis_id) as gsis_id from keyed group by k having count(distinct gsis_id) = 1`);

    await duck.exec(`
      create or replace table roster_ids as
      select
        r.*,
        coalesce(
          r.gsis_id,
          ik.gsis_id,
          case when r.birth_date is not null
            then 'h-' || slugify(r.full_name) || '-' || strftime(r.birth_date, '%Y%m%d')
            else 'h-' || slugify(r.full_name) || '-' || lower(r.team)
              || min(r.season) over (partition by slugify(r.full_name), r.team, r.birth_date is null)
          end
        ) as player_id,
        a.franchise_id
      from src_rosters r
      left join identity_keys ik on ik.k = norm_name(r.full_name) || '|' || r.birth_date
      left join team_abbrs a on a.abbr = r.team and r.season between a.start_season and a.end_season`);

    await duck.exec(`
      create or replace table player_rows as
      with career as (
        select player_id, min(season) as first_season, max(season) as last_season, count(distinct season) as seasons_played
        from roster_ids group by all
      ),
      latest as (
        select * from roster_ids
        qualify row_number() over (partition by player_id order by season desc, week desc nulls last) = 1
      ),
      usual_position as (
        select player_id, mode(position) as position from roster_ids where position is not null group by all
      ),
      headshots as (
        select player_id, arg_max(headshot_url, season) as headshot_url from roster_ids where headshot_url is not null group by all
      ),
      current_row as (
        select player_id, franchise_id, status, jersey_number, years_exp from roster_ids
        where season = ${ctx.currentSeason}
        qualify row_number() over (
          partition by player_id order by (status not in ('CUT', 'RET')) desc, week desc nulls last) = 1
      ),
      honors as (
        select
          coalesce(p1.gsis_id, p2.gsis_id) as gsis_id,
          bool_or(d.hof) as is_hof, max(d.allpro) as all_pro_count, max(d.probowls) as pro_bowl_count, max(d.w_av) as career_av
        from read_parquet(${lit(draftFile)}) d
        left join src_players p1 on p1.gsis_id = clean_id(d.gsis_id)
        left join src_players p2 on p2.pfr_id = clean_id(d.pfr_player_id)
        where coalesce(p1.gsis_id, p2.gsis_id) is not null
        group by all
      ),
      modern as (
        select
          p.gsis_id as id, p.gsis_id, p.pfr_id, p.espn_id, p.pff_id, p.otc_id,
          p.display_name, p.first_name, p.last_name, p.football_name, p.suffix,
          p.birth_date, p.height_in, p.weight_lb, p.college, p.position, p.position_group,
          coalesce(c.jersey_number, p.jersey_number) as jersey_number,
          coalesce(p.headshot_url, h.headshot_url) as headshot_url,
          coalesce(k.first_season, p.rookie_season) as first_season,
          coalesce(k.last_season, p.last_season) as last_season,
          k.seasons_played,
          case when c.status not in ('CUT', 'RET') then c.franchise_id end as current_franchise_id, c.status as roster_status,
          coalesce(c.years_exp, p.years_exp) as years_exp,
          p.draft_year as draft_season, p.draft_round, p.draft_pick,
          case when p.draft_team is not null then draft_franchise(p.draft_team, p.draft_year) end as draft_franchise_id,
          coalesce(o.is_hof, false) as is_hof, o.all_pro_count, o.pro_bowl_count, o.career_av
        from src_players p
        left join career k on k.player_id = p.gsis_id
        left join current_row c on c.player_id = p.gsis_id
        left join headshots h on h.player_id = p.gsis_id
        left join honors o on o.gsis_id = p.gsis_id
      ),
      legacy as (
        select
          l.player_id as id, l.gsis_id, l.pfr_id, null as espn_id, null as pff_id, null as otc_id,
          l.full_name as display_name, l.first_name, l.last_name, null as football_name, null as suffix,
          l.birth_date, l.height_in, l.weight_lb, l.college, u.position, pos_group(u.position) as position_group,
          coalesce(c.jersey_number, l.jersey_number) as jersey_number, h.headshot_url,
          k.first_season, k.last_season, k.seasons_played,
          case when c.status not in ('CUT', 'RET') then c.franchise_id end as current_franchise_id, c.status as roster_status, l.years_exp,
          null as draft_season, null as draft_round, null as draft_pick, null as draft_franchise_id,
          false as is_hof, null as all_pro_count, null as pro_bowl_count, null as career_av
        from latest l
        join career k using (player_id)
        left join usual_position u using (player_id)
        left join headshots h using (player_id)
        left join current_row c using (player_id)
        where l.player_id not in (select gsis_id from src_players)
      )
      select * from modern
      union all by name
      select * from legacy`);

    // ── Hall of Fame ─────────────────────────────────────────────────────────
    // Match curated inductees (category "player") to player_rows: (a) norm_name + birth_date,
    // (b) else a unique norm_name match whose career touched one of the inductee's franchises,
    // (c) else a unique norm_name match overall. is_hof is OR'd with the existing draft-honors flag.
    await duck.exec(`
      create or replace table hof_players as
      select row_number() over () as hof_row_id, name, "class"::integer as class, franchises,
        try_cast(birth_date as date) as birth_date
      from read_json(${lit(seedPath("hall-of-fame.json"))}, format = 'array')
      where category = 'player'`);

    // Name variants: as written, nickname removed ('Dick "Night Train" Lane' → Dick Lane), nickname + surname
    // (Night Train Lane), and first + last word (drops middle initials).
    await duck.exec(`
      create or replace table hof_keys as
      with parts as (
        select hof_row_id, name,
          trim(regexp_replace(regexp_replace(name, '"[^"]*"', '', 'g'), '\\([^)]*\\)', '', 'g')) as plain,
          coalesce(nullif(regexp_extract(name, '"([^"]+)"', 1), ''), nullif(regexp_extract(name, '\\(([^)]+)\\)', 1), '')) as nickname
        from hof_players
      ),
      variants as (
        select hof_row_id, norm_name(name) as key_name from parts
        union select hof_row_id, norm_name(plain) from parts
        union select hof_row_id, norm_name(nullif(nickname, '') || ' ' || list_last(string_split(plain, ' '))) from parts
        union select hof_row_id, norm_name(list_first(string_split(plain, ' ')) || ' ' || list_last(string_split(plain, ' '))) from parts
        -- Roster spellings that no rule derives (checked against the players table).
        union select p.hof_row_id, norm_name(alias.roster_name)
        from parts p
        join (values
          ('Charley Trippi', 'Charlie Trippi'),
          ('Dan Fortmann', 'Danny Fortmann'),
          ('Johnny Blood', 'Johnny (Blood) McNally'),
          ('William R. Lyman', 'Link Lyman')
        ) as alias(hof_name, roster_name) on alias.hof_name = p.name
      )
      select distinct hof_row_id, key_name from variants where key_name is not null and key_name <> ''`);

    await duck.exec(`
      create or replace table hof_by_birth as
      select h.hof_row_id, min(pr.id) as player_id
      from hof_players h
      join hof_keys k using (hof_row_id)
      join player_rows pr on norm_name(pr.display_name) = k.key_name and pr.birth_date = h.birth_date
      where h.birth_date is not null
      group by h.hof_row_id
      having count(distinct pr.id) = 1`);

    await duck.exec(`
      create or replace table hof_by_franchise as
      select h.hof_row_id, min(pr.id) as player_id
      from hof_players h
      join hof_keys k using (hof_row_id)
      join player_rows pr on norm_name(pr.display_name) = k.key_name
      join roster_ids ri on ri.player_id = pr.id and list_contains(h.franchises, ri.franchise_id)
      where h.hof_row_id not in (select hof_row_id from hof_by_birth)
      group by h.hof_row_id
      having count(distinct pr.id) = 1`);

    await duck.exec(`
      create or replace table hof_by_name as
      select h.hof_row_id, min(pr.id) as player_id
      from hof_players h
      join hof_keys k using (hof_row_id)
      join player_rows pr on norm_name(pr.display_name) = k.key_name
      where h.hof_row_id not in (select hof_row_id from hof_by_birth)
        and h.hof_row_id not in (select hof_row_id from hof_by_franchise)
      group by h.hof_row_id
      having count(distinct pr.id) = 1`);

    await duck.exec(`
      create or replace table hof_matches as
      select h.hof_row_id, h.class, m.player_id
      from hof_players h
      join (
        select * from hof_by_birth
        union all select * from hof_by_franchise
        union all select * from hof_by_name
      ) m using (hof_row_id)`);

    await duck.exec(`alter table player_rows add column hof_class smallint`);
    await duck.exec(`
      update player_rows
      set is_hof = true, hof_class = m.class
      from hof_matches m
      where player_rows.id = m.player_id`);

    const hofTotal = (await duck.one<{ n: number }>(`select count(*)::integer as n from hof_players`)).n;
    const hofMatched = (await duck.one<{ n: number }>(`select count(*)::integer as n from hof_matches`)).n;
    const hofUnmatched = await duck.all<{ name: string }>(`
      select h.name from hof_players h where h.hof_row_id not in (select hof_row_id from hof_matches) order by h.name`);
    ctx.log(
      `  hof: matched ${hofMatched}/${hofTotal} player inductees` +
        (hofUnmatched.length ? `; unmatched: ${hofUnmatched.map((r) => r.name).join(", ")}` : ""),
    );

    const rows = await duck.all(`
      select * replace (
        birth_date::varchar as birth_date,
        height_in::integer as height_in, weight_lb::integer as weight_lb, jersey_number::integer as jersey_number,
        first_season::integer as first_season, last_season::integer as last_season, seasons_played::integer as seasons_played,
        years_exp::integer as years_exp, draft_season::integer as draft_season, draft_round::integer as draft_round,
        draft_pick::integer as draft_pick, all_pro_count::integer as all_pro_count,
        pro_bowl_count::integer as pro_bowl_count, career_av::integer as career_av,
        espn_id::varchar as espn_id, pff_id::varchar as pff_id, otc_id::varchar as otc_id,
        hof_class::integer as hof_class
      )
      from player_rows`);
    await upsertRows(ctx, "players", rows, "id");
    if (ctx.full) await pruneStale(ctx, "players");

    await recordSource(ctx, {
      id: "nflverse.players",
      name: "nflverse players",
      url: "https://github.com/nflverse/nflverse-data/releases/tag/players",
      license: "CC-BY-4.0",
      coverage: "Players with rookie seasons 1974+",
      upstreamUpdatedAt: await nflverseUpdatedAt("players"),
    });
    await recordSource(ctx, {
      id: "nflverse.rosters",
      name: "nflverse season rosters",
      url: "https://github.com/nflverse/nflverse-data/releases/tag/rosters",
      license: "CC-BY-4.0",
      coverage: `${FIRST_ROSTER_SEASON}–${ctx.currentSeason}`,
      upstreamUpdatedAt: await nflverseUpdatedAt("rosters"),
    });
    await recordSource(ctx, {
      id: "curated.hall_of_fame",
      name: "Curated Pro Football Hall of Fame inductees",
      url: "https://github.com/jorelm68/gridiron-atlas/tree/main/data/seed",
      coverage: `${hofTotal} player inductees`,
    });
  },
};
