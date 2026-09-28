import "server-only";
import { cache } from "react";
import { createServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type Franchise = Tables<"franchises">;
export type ConferenceId = "AFC" | "NFC";

export interface FranchiseSummary extends Franchise {
  conference_id: ConferenceId;
  division_name: string;
}

/** All 32 franchises with their current conference/division, ordered by division then name. */
export const getFranchises = cache(async (): Promise<FranchiseSummary[]> => {
  const db = createServerClient();
  const { data, error } = await db
    .from("franchises")
    .select("*, divisions!inner(conference_id, name)")
    .order("division_id")
    .order("name");
  if (error) throw new Error(`Loading franchises failed: ${error.message}`);
  return data.map(({ divisions, ...franchise }) => ({
    ...franchise,
    conference_id: divisions.conference_id as ConferenceId,
    division_name: divisions.name,
  }));
});

export type TeamSeason = Tables<"team_seasons">;

/** Season records keyed by franchise id (empty until that season's games are synced). */
export const getTeamSeasons = cache(async (season: number): Promise<Map<string, TeamSeason>> => {
  const db = createServerClient();
  const { data, error } = await db.from("team_seasons").select("*").eq("season", season);
  if (error) throw new Error(`Loading ${season} team seasons failed: ${error.message}`);
  return new Map(data.map((row) => [row.franchise_id, row]));
});

export const getFranchise = cache(async (id: string) => {
  const franchises = await getFranchises();
  return franchises.find((f) => f.id.toLowerCase() === id.toLowerCase()) ?? null;
});
