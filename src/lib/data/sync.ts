import "server-only";
import { cache } from "react";
import { createServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type SyncRun = Tables<"sync_runs">;
export type DataSource = Tables<"data_sources">;

export const getRecentSyncRuns = cache(async (limit = 10): Promise<SyncRun[]> => {
  const { data, error } = await createServerClient()
    .from("sync_runs")
    .select("*")
    .order("id", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Loading sync runs failed: ${error.message}`);
  return data;
});

export const getDataSources = cache(async (): Promise<DataSource[]> => {
  const { data, error } = await createServerClient().from("data_sources").select("*").order("id");
  if (error) throw new Error(`Loading data sources failed: ${error.message}`);
  return data;
});

/** Headline row counts (exact counts via HEAD requests — no rows transferred). */
export const getDatasetCounts = cache(async () => {
  const db = createServerClient();
  const count = async (table: "players" | "games" | "player_game_stats" | "player_seasons") => {
    const { count: n } = await db.from(table).select("*", { count: "exact", head: true });
    return n ?? 0;
  };
  const [players, games, statLines, rosterSeasons] = await Promise.all([
    count("players"),
    count("games"),
    count("player_game_stats"),
    count("player_seasons"),
  ]);
  return { players, games, statLines, rosterSeasons };
});
