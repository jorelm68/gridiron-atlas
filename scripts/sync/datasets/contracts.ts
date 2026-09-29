import { nflverseAsset, nflverseUpdatedAt } from "../lib/cache";
import { pruneStale, recordSource, upsertRows } from "../lib/db";
import { lit } from "../lib/duck";
import type { Dataset } from "../lib/types";

/** OverTheCap team nicknames → franchise ids. Traded contracts use abbreviations instead ("LAR/DET"). */
const TEAM_IDS: Record<string, string> = {
  Cardinals: "ARI", Falcons: "ATL", Ravens: "BAL", Bills: "BUF", Panthers: "CAR", Bears: "CHI", Bengals: "CIN", Browns: "CLE",
  Cowboys: "DAL", Broncos: "DEN", Lions: "DET", Packers: "GB", Texans: "HOU", Colts: "IND", Jaguars: "JAX", Chiefs: "KC",
  Rams: "LA", Chargers: "LAC", Raiders: "LV", Dolphins: "MIA", Vikings: "MIN", Patriots: "NE", Saints: "NO", Giants: "NYG",
  Jets: "NYJ", Eagles: "PHI", Steelers: "PIT", Seahawks: "SEA", "49ers": "SF", Buccaneers: "TB", Titans: "TEN", Commanders: "WAS",
};

/**
 * Every OverTheCap contract via nflverse (~49k, money in millions). `team` is a nickname ("Lions") or, when the
 * player was traded mid-contract, "SIGNING/CURRENT" abbreviations ("LAR/DET"); team_name keeps the source text and
 * franchise_id is the team the contract ended with (or currently sits on), since that is whose books it is on.
 * The source repeats some contracts (exact copies, or an is_active flip), so rows are deduped on contract_key,
 * preferring the active copy. year_signed 0 (unknown) becomes NULL. apy_cap_pct stays a 0–1 fraction.
 * Players resolve through gsis_id, then otc_id.
 */
export const contracts: Dataset = {
  id: "contracts",
  description: "Player contracts (OverTheCap): length, value, APY, guarantees, cap share",
  dependsOn: ["players"],
  async run(ctx) {
    const file = await nflverseAsset("contracts", "historical_contracts.parquet", { refresh: true });
    const { duck } = ctx;

    await duck.tableFromRows("otc_teams", Object.entries(TEAM_IDS).map(([name, franchise_id]) => ({ name, franchise_id })));
    const rows = await duck.all<{ franchise_id: string | null; team_name: string; player_id: string | null }>(`
      with src as (
        select *,
          md5(concat_ws('|', otc_id::varchar, coalesce(team, ''), year_signed::varchar, years::varchar, value::varchar)) as contract_key,
          case when team like '%/%' then case when list_last(string_split(team, '/')) = 'LAR' then 'LA' else list_last(string_split(team, '/')) end end as last_abbr
        from read_parquet(${lit(file)})
        where otc_id is not null and player is not null
      )
      select
        s.contract_key, coalesce(p1.id, p2.id) as player_id, s.otc_id::integer as otc_id, s.player as player_name, s.position,
        s.team as team_name, coalesce(t.franchise_id, f.franchise_id) as franchise_id,
        nullif(s.year_signed, 0)::integer as year_signed, s.years::integer as years,
        s.value as value_millions, s.apy as apy_millions, s.guaranteed as guaranteed_millions, s.apy_cap_pct, s.is_active
      from src s
      left join otc_teams t on t.name = s.team
      left join (select distinct franchise_id from team_abbrs) f on f.franchise_id = s.last_abbr
      left join player_rows p1 on p1.id = clean_id(s.gsis_id)
      left join player_rows p2 on p2.otc_id = clean_id(s.otc_id) and p1.id is null
      qualify row_number() over (
        partition by s.contract_key order by s.is_active desc nulls last, s.guaranteed desc nulls last, s.apy_cap_pct desc nulls last
      ) = 1`);

    const unmapped = [...new Set(rows.filter((r) => !r.franchise_id).map((r) => r.team_name))];
    ctx.log(
      `  contracts: ${rows.length.toLocaleString()} rows, ${rows.filter((r) => !r.player_id).length.toLocaleString()} players unmatched, ` +
        `${unmapped.length} unmapped team names${unmapped.length ? `: ${unmapped.join(", ")}` : ""}`,
    );

    await upsertRows(ctx, "contracts", rows, "contract_key", { batchSize: 1000 });
    await pruneStale(ctx, "contracts");

    await recordSource(ctx, {
      id: "nflverse.contracts",
      name: "nflverse contracts (OverTheCap)",
      url: "https://github.com/nflverse/nflverse-data/releases/tag/contracts",
      license: "CC-BY-4.0",
      coverage: "Historical and active contracts",
      upstreamUpdatedAt: await nflverseUpdatedAt("contracts"),
    });
  },
};
