// Gridiron Atlas data sync. Pulls nflverse (and curated seeds) into Supabase.
//
//   npm run sync                                   refresh the current season (the weekly update)
//   npm run sync -- --full                         rebuild everything, all seasons
//   npm run sync -- --datasets games,stats --seasons 2024-2026
//   npm run sync -- --list                         show datasets
//
// Options: --refresh (re-download cached files), --no-deps (skip dependency datasets),
//          --trigger cli|button|schedule (recorded on sync_runs).
import { existsSync } from "node:fs";
import { parseArgs } from "node:util";
import { nflverseAsset } from "./lib/cache";
import { createSyncClient } from "./lib/db";
import { Duck, lit } from "./lib/duck";
import { ensureMacros } from "./lib/macros";
import { parseSeasons } from "./lib/seasons";
import type { Dataset, SyncContext } from "./lib/types";
import { DATASETS } from "./datasets";

if (existsSync(".env.local")) process.loadEnvFile(".env.local");

const { values: args } = parseArgs({
  options: {
    full: { type: "boolean", default: false },
    seasons: { type: "string" },
    datasets: { type: "string" },
    refresh: { type: "boolean", default: false },
    "no-deps": { type: "boolean", default: false },
    trigger: { type: "string", default: "cli" },
    list: { type: "boolean", default: false },
  },
});

const started = Date.now();
const log = (message: string) => console.log(`[${((Date.now() - started) / 1000).toFixed(1).padStart(6)}s] ${message}`);

function resolveDatasets(requested: string[] | undefined, withDeps: boolean): Dataset[] {
  if (!requested) return DATASETS;
  const byId = new Map(DATASETS.map((d) => [d.id, d]));
  const wanted = new Set<string>();
  const add = (id: string) => {
    const dataset = byId.get(id);
    if (!dataset) throw new Error(`Unknown dataset "${id}". Known: ${[...byId.keys()].join(", ")}`);
    if (withDeps) dataset.dependsOn.forEach(add);
    wanted.add(id);
  };
  requested.forEach(add);
  return DATASETS.filter((d) => wanted.has(d.id)); // registry order is dependency order
}

async function main() {
  if (args.list) {
    for (const d of DATASETS) console.log(`${d.id.padEnd(14)} ${d.description}${d.dependsOn.length ? `  (needs ${d.dependsOn.join(", ")})` : ""}`);
    return;
  }
  if (!["cli", "button", "schedule"].includes(args.trigger!)) throw new Error(`Bad --trigger: ${args.trigger}`);

  const datasets = resolveDatasets(args.datasets?.split(",").map((s) => s.trim()), !args["no-deps"]);
  const db = createSyncClient();
  const duck = await Duck.open();
  await ensureMacros(duck);

  const games = await nflverseAsset("schedules", "games.parquet", { refresh: true });
  const { season: currentSeason } = await duck.one<{ season: number }>(
    `select max(season)::integer as season from read_parquet(${lit(games)})`,
  );
  const seasons = args.full ? [] : args.seasons ? parseSeasons(args.seasons) : [currentSeason];

  const { data: run, error } = await db
    .from("sync_runs")
    .insert({ trigger: args.trigger!, datasets: datasets.map((d) => d.id), seasons: args.full ? null : seasons })
    .select("id")
    .single();
  if (error || !run) throw new Error(`Could not start sync run: ${error?.message}`);

  const ctx: SyncContext = {
    runId: run.id,
    db,
    duck,
    currentSeason,
    seasons,
    full: args.full!,
    refresh: args.refresh!,
    counts: {},
    log,
  };
  log(`Sync run #${run.id}: ${datasets.map((d) => d.id).join(" → ")} | ${args.full ? "full history" : `seasons ${seasons.join(", ")}`}`);

  try {
    for (const dataset of datasets) {
      log(`▶ ${dataset.id}`);
      await dataset.run(ctx);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .from("sync_runs")
      .update({ status: "failed", finished_at: new Date().toISOString(), row_counts: ctx.counts, error: message })
      .eq("id", run.id);
    throw err;
  }

  await db
    .from("sync_runs")
    .update({ status: "succeeded", finished_at: new Date().toISOString(), row_counts: ctx.counts })
    .eq("id", run.id);
  log(`✔ Sync run #${run.id} succeeded`);

  // Tell the deployed app to drop cached pages so the new data shows up right away.
  if (process.env.APP_URL && process.env.SYNC_SECRET) {
    const res = await fetch(new URL("/api/revalidate", process.env.APP_URL), {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.SYNC_SECRET}` },
    }).catch(() => null);
    log(res?.ok ? "Revalidated app pages" : `Could not revalidate app pages (${res?.status ?? "network error"})`);
  }
  for (const [table, count] of Object.entries(ctx.counts)) console.log(`  ${table.padEnd(20)} ${count.toLocaleString()}`);
}

main().catch((err) => {
  console.error(`✖ ${err instanceof Error ? err.message : err}`);
  process.exit(1);
});
