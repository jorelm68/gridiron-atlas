import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../src/lib/supabase/database.types";
import { nodeRealtimeOptions } from "../../../src/lib/supabase/node-transport";
import type { SyncContext } from "./types";

export type Db = SupabaseClient<Database>;
export type TableName = keyof Database["public"]["Tables"];
type Row = Record<string, unknown>;

export function createSyncClient(): Db {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set (see .env.example).");
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false }, ...nodeRealtimeOptions });
}

// Table names are dynamic here, so step outside the generated per-table types.
const untyped = (db: Db) => db as unknown as SupabaseClient;

async function inPool<T>(items: T[], concurrency: number, work: (item: T, index: number) => Promise<void>) {
  let next = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      await work(items[index], index);
    }
  });
  await Promise.all(workers);
}

/**
 * Upserts rows in batches, stamping each with the current sync_run_id.
 * Null values are dropped to shrink payloads — except in each batch's first row, which keeps every key so
 * PostgREST's `columns` list covers all columns and an upstream value that became null is overwritten.
 */
export async function upsertRows(
  ctx: SyncContext,
  table: TableName,
  rows: Row[],
  onConflict: string,
  { batchSize = 500, concurrency = 4, stamp = true } = {},
): Promise<void> {
  const batches: Row[][] = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    batches.push(
      rows.slice(i, i + batchSize).map((row, j) => {
        const stamped = stamp ? { ...row, sync_run_id: ctx.runId } : row;
        return j === 0 ? stamped : Object.fromEntries(Object.entries(stamped).filter(([, v]) => v !== null));
      }),
    );
  }

  await inPool(batches, concurrency, async (batch, index) => {
    for (let attempt = 1; ; attempt++) {
      const { error } = await untyped(ctx.db).from(table).upsert(batch, { onConflict });
      if (!error) return;
      // Network blips and gateway errors are worth retrying; constraint violations (SQLSTATE codes like 23502) are not.
      const transient = /fetch failed|timeout|ECONNRESET|socket|\b50[234]\b|gateway/i.test(error.message);
      if (!transient || attempt >= 7) {
        throw new Error(`Upsert into ${table} failed (batch ${index + 1}/${batches.length}): ${error.message}`);
      }
      ctx.log(`  ${table}: batch ${index + 1} failed (${error.message}); retry ${attempt}/6`);
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    }
  });

  ctx.counts[table] = (ctx.counts[table] ?? 0) + rows.length;
  ctx.log(`  ${table}: upserted ${rows.length.toLocaleString()} rows`);
}

/**
 * Deletes rows this run did not write — i.e. rows that disappeared upstream.
 * Pass a scope to limit pruning to the seasons (or other keys) this run actually refreshed.
 */
export async function pruneStale(
  ctx: SyncContext,
  table: TableName,
  scope?: { column: string; values: (string | number)[] },
): Promise<void> {
  let query = untyped(ctx.db).from(table).delete({ count: "exact" }).neq("sync_run_id", ctx.runId);
  if (scope) query = query.in(scope.column, scope.values);
  const { error, count } = await query;
  if (error) throw new Error(`Pruning ${table} failed: ${error.message}`);
  if (count) ctx.log(`  ${table}: pruned ${count.toLocaleString()} stale rows`);
}

/** Records where a dataset came from and when it was last refreshed. */
export async function recordSource(
  ctx: SyncContext,
  source: { id: string; name: string; url: string; license?: string; coverage?: string; upstreamUpdatedAt?: string | null },
): Promise<void> {
  const { error } = await ctx.db.from("data_sources").upsert({
    id: source.id,
    name: source.name,
    url: source.url,
    license: source.license ?? null,
    coverage: source.coverage ?? null,
    upstream_updated_at: source.upstreamUpdatedAt ?? null,
    last_synced_at: new Date().toISOString(),
    last_sync_run_id: ctx.runId,
  });
  if (error) throw new Error(`Recording source ${source.id} failed: ${error.message}`);
}
