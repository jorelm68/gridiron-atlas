import "server-only";
import { cache } from "react";
import { createServerClient } from "@/lib/supabase/server";

export interface DataFreshness {
  lastSyncedAt: string | null;
  currentSeason: number | null;
  latestWeek: number | null;
}

/** When data was last synced and the latest completed week — powers the "as of" pill. */
export const getDataFreshness = cache(async (): Promise<DataFreshness> => {
  const db = createServerClient();
  const [{ data: run }, { data: lastGame }] = await Promise.all([
    db
      .from("sync_runs")
      .select("finished_at")
      .eq("status", "succeeded")
      .order("finished_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    db
      .from("games")
      .select("season, week")
      .not("home_score", "is", null)
      .order("gameday", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  return {
    lastSyncedAt: run?.finished_at ?? null,
    currentSeason: lastGame?.season ?? null,
    latestWeek: lastGame?.week ?? null,
  };
});
