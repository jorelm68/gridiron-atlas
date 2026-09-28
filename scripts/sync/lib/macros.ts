import type { Duck } from "./duck";

/** Shared DuckDB SQL helpers, (re)created at the start of every run. */
const MACROS = [
  // Name key for matching the same person across sources: lowercase ASCII letters, suffixes dropped.
  `create or replace macro norm_name(n) as
     regexp_replace(regexp_replace(lower(strip_accents(coalesce(n, ''))), '\\b(jr|sr|ii|iii|iv|v)\\b', '', 'g'), '[^a-z]', '', 'g')`,
  `create or replace macro slugify(n) as
     trim(regexp_replace(lower(strip_accents(coalesce(n, ''))), '[^a-z0-9]+', '-', 'g'), '-')`,
  // Heights arrive as inches (73, 73.0) or feet-inches strings ("6-1").
  `create or replace macro inches(h) as case
     when h is null then null
     when h::varchar like '%-%' then try_cast(split_part(h::varchar, '-', 1) as integer) * 12 + try_cast(split_part(h::varchar, '-', 2) as integer)
     else try_cast(round(try_cast(h::varchar as double)) as integer) end`,
  // IDs sometimes arrive as numbers ("4429202.0"); normalize to trimmed strings.
  `create or replace macro clean_id(x) as nullif(regexp_replace(trim(x::varchar), '\\.0$', ''), '')`,
  // Per-game stat tables store 0 as NULL.
  `create or replace macro nz(x) as nullif(x, 0)`,
  `create or replace macro pos_group(p) as case
     when p = 'QB' then 'QB'
     when p in ('RB', 'HB', 'FB', 'TB', 'WB', 'BB') then 'RB'
     when p in ('WR', 'E', 'SE', 'FL') then 'WR'
     when p = 'TE' then 'TE'
     when p in ('T', 'G', 'C', 'OT', 'OG', 'OL', 'LT', 'RT', 'LG', 'RG') then 'OL'
     when p in ('DE', 'DT', 'NT', 'DL') then 'DL'
     when p in ('LB', 'ILB', 'OLB', 'MLB') then 'LB'
     when p in ('CB', 'S', 'SS', 'FS', 'DB', 'SAF') then 'DB'
     when p in ('K', 'P', 'LS', 'PK') then 'SPEC'
     else null end`,
  // Draft data uses current franchise codes (players.csv) or Pro Football Reference codes (draft_picks);
  // a few codes are ambiguous across eras (HOU, BAL, STL).
  `create or replace macro draft_franchise(code, season) as case
     when code = 'HOU' and season < 2002 then 'TEN'
     when code = 'BAL' and season < 1996 then 'IND'
     when code = 'STL' then case when season < 1988 then 'ARI' else 'LA' end
     when code = 'GNB' then 'GB'
     when code = 'KAN' then 'KC'
     when code in ('LAR', 'RAM') then 'LA'
     when code in ('LVR', 'RAI', 'OAK') then 'LV'
     when code = 'NOR' then 'NO'
     when code = 'NWE' then 'NE'
     when code = 'PHO' then 'ARI'
     when code in ('SDG', 'SD') then 'LAC'
     when code = 'SFO' then 'SF'
     when code = 'TAM' then 'TB'
     else code end`,
];

export async function ensureMacros(duck: Duck): Promise<void> {
  for (const sql of MACROS) await duck.exec(sql);
}
