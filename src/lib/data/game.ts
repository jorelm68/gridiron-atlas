import "server-only";
import { cache } from "react";
import { createServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { nicknameOf, type ScoringPlay, type WinProbabilityPoint } from "@/lib/game";
import { getFranchises, type FranchiseSummary } from "./teams";

export type GameRow = Tables<"games">;
export type TeamGameStats = Tables<"team_game_stats">;
export type PlayerGameStatsRow = Tables<"player_game_stats">;
export type Venue = Tables<"venues">;

export interface GameTeam {
  side: "home" | "away";
  abbr: string;
  franchiseId: string | null;
  /** Name as of the game's season ("Oakland Raiders" in 2019). */
  name: string;
  nickname: string;
  logoUrl: string | null;
  colorPrimary: string | null;
  colorSecondary: string | null;
  score: number | null;
  /** Regular-season record going into the game (whole regular season for playoff games). */
  record: { wins: number; losses: number; ties: number } | null;
}

export interface GamePlayerLine {
  stats: PlayerGameStatsRow;
  player: { id: string; name: string; headshotUrl: string | null; position: string | null };
}

export interface LastMeeting {
  id: string;
  gameday: string;
  season: number;
  homeAbbr: string;
  awayAbbr: string;
  homeScore: number;
  awayScore: number;
}

/** Team names as of a season, keyed by abbreviation ("OAK" → "Oakland Raiders" in 2019). */
export const getSeasonTeamNames = cache(async (season: number): Promise<Map<string, string>> => {
  const { data, error } = await createServerClient()
    .from("team_abbrs")
    .select("abbr, name")
    .lte("start_season", season)
    .gte("end_season", season);
  if (error) throw new Error(`Loading ${season} team names failed: ${error.message}`);
  return new Map(data.map((row) => [row.abbr, row.name]));
});

function toTeam(
  side: "home" | "away",
  game: GameRow,
  names: Map<string, string>,
  byId: Map<string, FranchiseSummary>,
  record: GameTeam["record"],
): GameTeam {
  const abbr = side === "home" ? game.home_abbr : game.away_abbr;
  const franchiseId = side === "home" ? game.home_franchise_id : game.away_franchise_id;
  const franchise = franchiseId ? byId.get(franchiseId) : undefined;
  const name = names.get(abbr) ?? franchise?.name ?? abbr;
  return {
    side,
    abbr,
    franchiseId,
    name,
    nickname: nicknameOf(name),
    logoUrl: franchise?.logo_url ?? null,
    colorPrimary: franchise?.color_primary ?? null,
    colorSecondary: franchise?.color_secondary ?? null,
    score: side === "home" ? game.home_score : game.away_score,
    record,
  };
}

async function recordBefore(franchiseId: string | null, game: GameRow): Promise<GameTeam["record"]> {
  if (!franchiseId) return null;
  const { data, error } = await createServerClient()
    .from("games")
    .select("home_franchise_id, home_score, away_score")
    .eq("season", game.season)
    .eq("game_type", "REG")
    .lt("gameday", game.gameday)
    .not("home_score", "is", null)
    .or(`home_franchise_id.eq.${franchiseId},away_franchise_id.eq.${franchiseId}`);
  if (error) throw new Error(`Loading record before ${game.id} failed: ${error.message}`);
  const record = { wins: 0, losses: 0, ties: 0 };
  for (const g of data) {
    const mine = g.home_franchise_id === franchiseId ? g.home_score : g.away_score;
    const theirs = g.home_franchise_id === franchiseId ? g.away_score : g.home_score;
    if (mine === null || theirs === null) continue;
    if (mine > theirs) record.wins++;
    else if (mine < theirs) record.losses++;
    else record.ties++;
  }
  return record;
}

/** The game's whole page worth of data, in one round of parallel queries. Null for an unknown game id. */
export const getGame = cache(async (id: string) => {
  const db = createServerClient();
  const { data: game, error } = await db.from("games").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Loading game ${id} failed: ${error.message}`);
  if (!game) return null;

  const played = game.home_score !== null && game.away_score !== null;
  const homeId = game.home_franchise_id;
  const awayId = game.away_franchise_id;

  const [franchises, names, venue, flow, teamStats, playerStats, superBowl, homeRecord, awayRecord, lastMeeting] = await Promise.all([
    getFranchises(),
    getSeasonTeamNames(game.season),
    game.venue_id ? db.from("venues").select("*").eq("id", game.venue_id).maybeSingle() : null,
    played ? db.from("game_flow").select("win_probability, scoring_plays").eq("game_id", id).maybeSingle() : null,
    played ? db.from("team_game_stats").select("*").eq("game_id", id) : null,
    played ? db.from("player_game_stats").select("*, players(id, display_name, headshot_url, position)").eq("game_id", id) : null,
    game.game_type === "SB" ? db.from("super_bowls").select("number, roman, mvp_name, mvp_position").eq("game_id", id).maybeSingle() : null,
    recordBefore(homeId, game),
    recordBefore(awayId, game),
    !played && homeId && awayId
      ? db
          .from("games")
          .select("id, gameday, season, home_abbr, away_abbr, home_score, away_score")
          .or(
            `and(home_franchise_id.eq.${homeId},away_franchise_id.eq.${awayId}),and(home_franchise_id.eq.${awayId},away_franchise_id.eq.${homeId})`,
          )
          .lt("gameday", game.gameday)
          .not("home_score", "is", null)
          .order("gameday", { ascending: false })
          .limit(1)
          .maybeSingle()
      : null,
  ]);

  for (const result of [venue, flow, teamStats, playerStats, superBowl, lastMeeting]) {
    if (result?.error) throw new Error(`Loading game ${id} failed: ${result.error.message}`);
  }

  const byId = new Map(franchises.map((f) => [f.id, f]));
  const flowRow = flow?.data;
  const meeting = lastMeeting?.data;

  return {
    game,
    played,
    home: toTeam("home", game, names, byId, homeRecord),
    away: toTeam("away", game, names, byId, awayRecord),
    venue: (venue?.data ?? null) as Venue | null,
    superBowl: superBowl?.data ?? null,
    winProbability: (flowRow?.win_probability ?? []) as unknown as WinProbabilityPoint[],
    scoringPlays: (flowRow?.scoring_plays ?? []) as unknown as ScoringPlay[],
    teamStats: teamStats?.data ?? [],
    players: (playerStats?.data ?? []).flatMap((row): GamePlayerLine[] => {
      const { players, ...stats } = row;
      return players
        ? [{ stats, player: { id: players.id, name: players.display_name, headshotUrl: players.headshot_url, position: players.position } }]
        : [];
    }),
    lastMeeting: meeting
      ? ({
          id: meeting.id,
          gameday: meeting.gameday,
          season: meeting.season,
          homeAbbr: meeting.home_abbr,
          awayAbbr: meeting.away_abbr,
          homeScore: meeting.home_score as number,
          awayScore: meeting.away_score as number,
        } satisfies LastMeeting)
      : null,
  };
});

export type GameDetail = NonNullable<Awaited<ReturnType<typeof getGame>>>;

export interface WeekOption {
  /** "1".."22" for regular-season weeks, or "WC" | "DIV" | "CON" | "SB". */
  key: string;
  label: string;
  hasResults: boolean;
}

const ROUND_ORDER = ["WC", "DIV", "CON", "SB"];

/** Every week (and playoff round) that exists for a season, and which of them have results. */
export const getSeasonWeeks = cache(async (season: number): Promise<WeekOption[]> => {
  const { data, error } = await createServerClient().from("games").select("game_type, week, home_score").eq("season", season);
  if (error) throw new Error(`Loading ${season} weeks failed: ${error.message}`);
  const weeks = new Map<string, WeekOption>();
  for (const g of data) {
    const key = g.game_type === "REG" ? String(g.week) : g.game_type;
    const existing = weeks.get(key);
    const label =
      g.game_type === "REG"
        ? `Wk ${g.week}`
        : g.game_type === "SB"
          ? "Super Bowl"
          : g.game_type === "WC"
            ? "Wild Card"
            : g.game_type === "DIV"
              ? "Divisional"
              : "Conf. Champ";
    weeks.set(key, { key, label, hasResults: (existing?.hasResults ?? false) || g.home_score !== null });
  }
  return [...weeks.values()].sort((a, b) => {
    const ai = ROUND_ORDER.indexOf(a.key);
    const bi = ROUND_ORDER.indexOf(b.key);
    if (ai >= 0 || bi >= 0) return (ai < 0 ? -1 : ai) - (bi < 0 ? -1 : bi);
    return Number(a.key) - Number(b.key);
  });
});

/** The latest week (or round) with a final score in a season, or the first week if nothing has been played. */
export function defaultWeek(weeks: WeekOption[]): string {
  const played = weeks.filter((w) => w.hasResults);
  return (played.length > 0 ? played[played.length - 1] : weeks[0])?.key ?? "1";
}

/** One week's (or playoff round's) games in kickoff order. */
export const getWeekGames = cache(async (season: number, weekKey: string) => {
  const isRound = ROUND_ORDER.includes(weekKey);
  let query = createServerClient().from("games").select("*").eq("season", season);
  query = isRound ? query.eq("game_type", weekKey) : query.eq("game_type", "REG").eq("week", Number(weekKey));
  const [{ data, error }, names, franchises] = await Promise.all([
    query.order("gameday").order("gametime"),
    getSeasonTeamNames(season),
    getFranchises(),
  ]);
  if (error) throw new Error(`Loading ${season} week ${weekKey} failed: ${error.message}`);
  const byId = new Map(franchises.map((f) => [f.id, f]));
  return data.map((game) => ({
    game,
    home: toTeam("home", game, names, byId, null),
    away: toTeam("away", game, names, byId, null),
  }));
});

export type ScoreboardEntry = Awaited<ReturnType<typeof getWeekGames>>[number];
