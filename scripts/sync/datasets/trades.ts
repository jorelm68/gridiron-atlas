import { nflverseAsset, nflverseUpdatedAt } from "../lib/cache";
import { pruneStale, recordSource, upsertRows } from "../lib/db";
import { lit } from "../lib/duck";
import type { Dataset } from "../lib/types";

// Franchise for a trade's team-code column: era match, else the code itself, else the era nearest the trade's season.
const franchiseOf = (code: string, era: string, own: string) => `coalesce(${era}.franchise_id, ${own}.id, (
  select arg_min(a.franchise_id, greatest(a.start_season - t.season, t.season - a.end_season, 0))
  from team_abbrs a where a.abbr = t.${code} and a.franchise_id is not null))`;

/**
 * Every NFL trade since 2002 (nflverse), one row per asset that moved. Assets are numbered per trade in a fixed
 * order (pick season/round/number, then player) so asset_index is stable across runs. A draft pick that has since
 * been used also carries the player it became (player_id/player_name), so a row can be both a pick and a player.
 * Team codes are historical (OAK, SD, STL): franchises resolve through team_abbrs for the trade's season, falling
 * back to the code itself when it is already a franchise id, then to the code's nearest era (April 2016 trades
 * still say STL, a code whose era ended with the 2015 season). Players resolve through pfr_id.
 */
export const trades: Dataset = {
  id: "trades",
  description: "Trades since 2002: players and draft picks exchanged",
  dependsOn: ["players"],
  async run(ctx) {
    const file = await nflverseAsset("trades", "trades.parquet", { refresh: true });

    const rows = await ctx.duck.all<{ player_id: string | null; player_name: string | null; from_franchise_id: string | null; to_franchise_id: string | null }>(`
      with franchise_ids as (select distinct franchise_id as id from team_abbrs)
      select
        t.trade_id::integer as trade_id,
        row_number() over (
          partition by t.trade_id
          order by t.pick_season nulls last, t.pick_round nulls last, t.pick_number nulls last, t.pfr_id nulls last, t.pfr_name nulls last, t.gave, t.received
        )::integer as asset_index,
        t.season::integer as season, t.trade_date::varchar as trade_date,
        t.gave as from_abbr, t.received as to_abbr,
        ${franchiseOf("gave", "fa", "ff")} as from_franchise_id, ${franchiseOf("received", "ta", "tf")} as to_franchise_id,
        p.id as player_id, nullif(t.pfr_name, '') as player_name,
        t.pick_season::integer as pick_season, t.pick_round::integer as pick_round, t.pick_number::integer as pick_number,
        t.conditional::boolean as pick_conditional
      from read_parquet(${lit(file)}) t
      left join team_abbrs fa on fa.abbr = t.gave and t.season between fa.start_season and fa.end_season
      left join franchise_ids ff on ff.id = t.gave
      left join team_abbrs ta on ta.abbr = t.received and t.season between ta.start_season and ta.end_season
      left join franchise_ids tf on tf.id = t.received
      left join player_rows p on p.pfr_id = nullif(t.pfr_id, '')
      where t.trade_id is not null and t.gave is not null and t.received is not null`);

    const unresolved = rows.filter((r) => !r.from_franchise_id || !r.to_franchise_id).length;
    const unmatched = rows.filter((r) => r.player_name && !r.player_id).length;
    ctx.log(
      `  trades: ${rows.length.toLocaleString()} assets; ${unmatched} named players unmatched, ` +
        `${unresolved} rows with an unmapped team code`,
    );

    await upsertRows(ctx, "trades", rows, "trade_id,asset_index", { batchSize: 1000 });
    await pruneStale(ctx, "trades");

    await recordSource(ctx, {
      id: "nflverse.trades",
      name: "nflverse trades",
      url: "https://github.com/nflverse/nflverse-data/releases/tag/trades",
      license: "CC-BY-4.0",
      coverage: `2002–${ctx.currentSeason}`,
      upstreamUpdatedAt: await nflverseUpdatedAt("trades"),
    });
  },
};
