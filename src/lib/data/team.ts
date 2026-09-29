import "server-only";
import { cache } from "react";
import { createServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { getFranchise, getFranchises } from "./teams";

export type Venue = Tables<"venues">;
export type Game = Tables<"games">;
export type TeamSeason = Tables<"team_seasons">;
export type FranchiseEra = Tables<"franchise_eras">;

/** Statuses that mean a player is currently part of the organization (see the roster-status glossary). */
const ORG_STATUSES = ["ACT", "RES", "DEV", "INA", "EXE"];

export interface RosterPlayer {
  id: string;
  name: string;
  position: string | null;
  positionGroup: string | null;
  jersey: number | null;
  status: string | null;
  yearsExp: number | null;
  headshotUrl: string | null;
  college: string | null;
  draftSeason: number | null;
  draftRound: number | null;
  draftPick: number | null;
}

/** Everything the team page header, overview, and history tabs need, in one round of parallel queries. */
export const getTeamOverview = cache(async (franchiseId: string) => {
  const franchise = await getFranchise(franchiseId);
  if (!franchise) return null;
  const id = franchise.id;
  const db = createServerClient();

  const [eras, tenancies, seasons, superBowls, frontOffice, headCoaches] = await Promise.all([
    db.from("franchise_eras").select("*").eq("franchise_id", id).order("start_season"),
    db
      .from("venue_tenancies")
      .select("start_season, end_season, venues(*)")
      .eq("franchise_id", id)
      .order("end_season", { ascending: false }),
    db.from("team_seasons").select("*").eq("franchise_id", id).order("season"),
    db
      .from("super_bowls")
      .select("number, roman, season, played_on, winner_franchise_id, loser_franchise_id, winner_score, loser_score, venue_name, mvp_name")
      .or(`winner_franchise_id.eq.${id},loser_franchise_id.eq.${id}`)
      .order("number"),
    db.from("front_office").select("role, person_name, since_season, note").eq("franchise_id", id),
    db
      .from("head_coaches")
      .select("coach_name, start_season, end_season, regular_wins, regular_losses, regular_ties, playoff_wins, playoff_losses, is_interim")
      .eq("franchise_id", id)
      .order("start_season", { ascending: false }),
  ]);

  for (const result of [eras, tenancies, seasons, superBowls, frontOffice, headCoaches]) {
    if (result.error) throw new Error(`Loading team ${id} failed: ${result.error.message}`);
  }

  const venueHistory = (tenancies.data ?? []).flatMap((t) =>
    t.venues ? [{ venue: t.venues as Venue, startSeason: t.start_season, endSeason: t.end_season }] : [],
  );

  return {
    franchise,
    eras: eras.data ?? [],
    homeVenue: venueHistory[0]?.venue ?? null,
    venueHistory,
    seasons: seasons.data ?? [],
    superBowls: superBowls.data ?? [],
    frontOffice: frontOffice.data ?? [],
    headCoaches: headCoaches.data ?? [],
  };
});

export type TeamOverview = NonNullable<Awaited<ReturnType<typeof getTeamOverview>>>;

/** A season's schedule and results for one franchise, with opponent details resolved. */
export const getTeamSchedule = cache(async (franchiseId: string, season: number) => {
  const db = createServerClient();
  const [{ data, error }, franchises] = await Promise.all([
    db
      .from("games")
      .select("*")
      .eq("season", season)
      .or(`home_franchise_id.eq.${franchiseId},away_franchise_id.eq.${franchiseId}`)
      .order("gameday"),
    getFranchises(),
  ]);
  if (error) throw new Error(`Loading ${franchiseId} ${season} schedule failed: ${error.message}`);
  const byId = new Map(franchises.map((f) => [f.id, f]));

  return (data ?? []).map((game) => {
    const isHome = game.home_franchise_id === franchiseId;
    const opponentId = isHome ? game.away_franchise_id : game.home_franchise_id;
    const teamScore = isHome ? game.home_score : game.away_score;
    const opponentScore = isHome ? game.away_score : game.home_score;
    const played = teamScore !== null && opponentScore !== null;
    return {
      game,
      isHome,
      neutral: game.location === "Neutral",
      opponent: opponentId ? (byId.get(opponentId) ?? null) : null,
      teamScore,
      opponentScore,
      result: !played ? null : teamScore > opponentScore ? "W" : teamScore < opponentScore ? "L" : "T",
    } as const;
  });
});

export type ScheduleEntry = Awaited<ReturnType<typeof getTeamSchedule>>[number];

/** The current organization: rostered players for a season, excluding cut/retired players. */
export const getTeamRoster = cache(async (franchiseId: string, season: number): Promise<RosterPlayer[]> => {
  const { data, error } = await createServerClient()
    .from("player_seasons")
    .select(
      "status, jersey_number, position, years_exp, players!inner(id, display_name, position, position_group, headshot_url, college, draft_season, draft_round, draft_pick)",
    )
    .eq("franchise_id", franchiseId)
    .eq("season", season)
    .in("status", ORG_STATUSES);
  if (error) throw new Error(`Loading ${franchiseId} roster failed: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: row.players.id,
    name: row.players.display_name,
    position: row.position ?? row.players.position,
    positionGroup: row.players.position_group,
    jersey: row.jersey_number,
    status: row.status,
    yearsExp: row.years_exp,
    headshotUrl: row.players.headshot_url,
    college: row.players.college,
    draftSeason: row.players.draft_season,
    draftRound: row.players.draft_round,
    draftPick: row.players.draft_pick,
  }));
});

/** The franchise's greats: Hall of Famers with real tenure first, then value created for this team, then tenure. */
export const getNotablePlayers = cache(async (franchiseId: string, limit = 12) => {
  const view = () => createServerClient().from("franchise_players").select("*").eq("franchise_id", franchiseId);
  const [hallOfFamers, others] = await Promise.all([
    view().eq("hof_here", true).order("hof_class"),
    view()
      .eq("hof_here", false)
      .order("franchise_value", { ascending: false, nullsFirst: false })
      .order("seasons", { ascending: false })
      .limit(limit),
  ]);
  for (const result of [hallOfFamers, others]) {
    if (result.error) throw new Error(`Loading ${franchiseId} notable players failed: ${result.error.message}`);
  }
  return { hallOfFamers: hallOfFamers.data ?? [], others: others.data ?? [] };
});

/** Division rivals' records for a season, ordered by division rank. */
export const getDivisionStandings = cache(async (divisionId: string, season: number) => {
  const { data, error } = await createServerClient()
    .from("team_seasons")
    .select("franchise_id, wins, losses, ties, div_rank, div_wins, div_losses, div_ties, points_for, points_against")
    .eq("division_id", divisionId)
    .eq("season", season)
    .order("div_rank");
  if (error) throw new Error(`Loading ${divisionId} standings failed: ${error.message}`);
  return data ?? [];
});
