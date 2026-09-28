import "server-only";
import { cache } from "react";
import { getStatById, type SeasonTotals, type StatDefinition, type TeamSeasonTotals, type WorkedExampleSubject } from "@/content/stats";
import { createServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

type PlayerSeasonRow = Tables<"player_season_stats">;
type SeasonType = "REG" | "POST";

/**
 * The app's signature worked-example season for every stat page — see docs/SCOPE.md ("the tour follows the
 * Detroit Lions"). 2025 is nflverse's most recently completed regular season as of this writing; player ids below
 * were looked up directly in `players` via the Supabase MCP (read-only, project ttfcygymbiswqefdmpiu).
 */
export const WORKED_EXAMPLE_SEASON = 2025;
export const LIONS_FRANCHISE_ID = "DET";

const n = (v: number | null | undefined) => v ?? 0;

/** Detroit Lions player ids for each worked-example subject. No Lions punter is specified by the project spec, so "P" always falls back to that season's league leader (see getWorkedExamplePlayer). */
const LIONS_SUBJECT_PLAYERS: Partial<Record<WorkedExampleSubject, string>> = {
  QB: "00-0033106", // Jared Goff
  RB: "00-0039139", // Jahmyr Gibbs
  WR: "00-0036963", // Amon-Ra St. Brown
  TE: "00-0039065", // Sam LaPorta
  EDGE: "00-0037236", // Aidan Hutchinson
  K: "00-0039172", // Jake Bates
};

/** Position(s) and the volume column used both to find a subject's "qualified" pool and, when no Lions player is mapped (or their season is missing), that season's league leader. */
const SUBJECT_QUALIFIER: Record<Exclude<WorkedExampleSubject, "TEAM">, { positions: string[]; volumeColumn: string }> = {
  QB: { positions: ["QB"], volumeColumn: "attempts" },
  RB: { positions: ["RB"], volumeColumn: "carries" },
  WR: { positions: ["WR"], volumeColumn: "targets" },
  TE: { positions: ["TE"], volumeColumn: "targets" },
  EDGE: { positions: ["DE", "OLB"], volumeColumn: "def_sacks" },
  K: { positions: ["K"], volumeColumn: "fg_att" },
  P: { positions: ["P"], volumeColumn: "punts" },
};

function toSeasonTotals(row: PlayerSeasonRow, team: { targets: number; passingAirYards: number } | undefined): SeasonTotals {
  return {
    playerId: row.player_id ?? "",
    season: row.season ?? 0,
    seasonType: (row.season_type as SeasonType) ?? "REG",
    games: n(row.games),
    completions: n(row.completions),
    attempts: n(row.attempts),
    passingYards: n(row.passing_yards),
    passingTds: n(row.passing_tds),
    passingInterceptions: n(row.passing_interceptions),
    sacksSuffered: n(row.sacks_suffered),
    sackYardsLost: n(row.sack_yards_lost),
    passingAirYards: n(row.passing_air_yards),
    passingYardsAfterCatch: n(row.passing_yards_after_catch),
    passingFirstDowns: n(row.passing_first_downs),
    passingEpa: n(row.passing_epa),
    passingCpoe: row.passing_cpoe,
    carries: n(row.carries),
    rushingYards: n(row.rushing_yards),
    rushingTds: n(row.rushing_tds),
    rushingFirstDowns: n(row.rushing_first_downs),
    rushingEpa: n(row.rushing_epa),
    targets: n(row.targets),
    receptions: n(row.receptions),
    receivingYards: n(row.receiving_yards),
    receivingTds: n(row.receiving_tds),
    receivingAirYards: n(row.receiving_air_yards),
    receivingYardsAfterCatch: n(row.receiving_yards_after_catch),
    receivingFirstDowns: n(row.receiving_first_downs),
    receivingEpa: n(row.receiving_epa),
    fumblesLost: n(row.fumbles_lost),
    teamTargets: team?.targets ?? null,
    teamPassingAirYards: team?.passingAirYards ?? null,
    defTacklesSolo: n(row.def_tackles_solo),
    defTackleAssists: n(row.def_tackle_assists),
    defTacklesForLoss: n(row.def_tackles_for_loss),
    defSacks: n(row.def_sacks),
    defQbHits: n(row.def_qb_hits),
    defInterceptions: n(row.def_interceptions),
    defPassDefended: n(row.def_pass_defended),
    defFumblesForced: n(row.def_fumbles_forced),
    defTds: n(row.def_tds),
    defSafeties: n(row.def_safeties),
    puntReturns: n(row.punt_returns),
    puntReturnYards: n(row.punt_return_yards),
    kickoffReturns: n(row.kickoff_returns),
    kickoffReturnYards: n(row.kickoff_return_yards),
    specialTeamsTds: n(row.special_teams_tds),
    fgMade: n(row.fg_made),
    fgAtt: n(row.fg_att),
    fgLong: n(row.fg_long),
    fgMade50Plus: n(row.fg_made_50_plus),
    patMade: n(row.pat_made),
    patAtt: n(row.pat_att),
    punts: n(row.punts),
    puntYards: n(row.punt_yards),
    puntsInside20: n(row.punts_inside_20),
  };
}

interface TeamAggregate extends TeamSeasonTotals {
  /** Not part of the public TeamSeasonTotals shape (no stat is computed directly from it) — only used to fill SeasonTotals.teamPassingAirYards for receiving share stats. */
  passingAirYards: number;
}

function emptyTeamAggregate(franchiseId: string, season: number): TeamAggregate {
  return {
    franchiseId,
    season,
    games: 0,
    completions: 0,
    attempts: 0,
    passingYards: 0,
    passingTds: 0,
    passingInterceptions: 0,
    sacksSuffered: 0,
    sackYardsLost: 0,
    passingFirstDowns: 0,
    passingEpa: 0,
    passingAirYards: 0,
    carries: 0,
    rushingYards: 0,
    rushingTds: 0,
    rushingFirstDowns: 0,
    rushingEpa: 0,
    targets: 0,
    receptions: 0,
    fumblesTotal: 0,
    fumblesLost: 0,
    penalties: 0,
    penaltyYards: 0,
    defSacks: 0,
    defQbHits: 0,
    defTacklesForLoss: 0,
    defInterceptions: 0,
    defPassDefended: 0,
    defFumblesForced: 0,
    defTds: 0,
    defSafeties: 0,
    fgMade: 0,
    fgAtt: 0,
    patMade: 0,
    patAtt: 0,
    punts: 0,
    puntYards: 0,
    wins: 0,
    losses: 0,
    ties: 0,
    pointsFor: 0,
    pointsAgainst: 0,
    divWins: 0,
    divLosses: 0,
    divTies: 0,
    divRank: null,
  };
}

/** Every franchise's season totals in one pass: team_game_stats summed per franchise, plus team_seasons for the standings columns. Powers team worked examples, team-percentile pools, and the team-share (target/air-yards) numbers behind receiving stats. */
export const getSeasonTeamAggregates = cache(async (season: number, seasonType: SeasonType = "REG"): Promise<Map<string, TeamAggregate>> => {
  const db = createServerClient();
  const [{ data: gameRows, error: gameErr }, { data: seasonRows, error: seasonErr }] = await Promise.all([
    db.from("team_game_stats").select("*").eq("season", season).eq("season_type", seasonType),
    db.from("team_seasons").select("*").eq("season", season),
  ]);
  if (gameErr) throw new Error(`Loading ${season} team game stats failed: ${gameErr.message}`);
  if (seasonErr) throw new Error(`Loading ${season} team seasons failed: ${seasonErr.message}`);

  const byFranchise = new Map<string, TeamAggregate>();
  for (const row of gameRows ?? []) {
    if (!row.franchise_id) continue;
    const agg = byFranchise.get(row.franchise_id) ?? emptyTeamAggregate(row.franchise_id, season);
    agg.games += 1;
    agg.completions += n(row.completions);
    agg.attempts += n(row.attempts);
    agg.passingYards += n(row.passing_yards);
    agg.passingTds += n(row.passing_tds);
    agg.passingInterceptions += n(row.passing_interceptions);
    agg.sacksSuffered += n(row.sacks_suffered);
    agg.sackYardsLost += n(row.sack_yards_lost);
    agg.passingFirstDowns += n(row.passing_first_downs);
    agg.passingEpa += n(row.passing_epa);
    agg.passingAirYards += n(row.passing_air_yards);
    agg.carries += n(row.carries);
    agg.rushingYards += n(row.rushing_yards);
    agg.rushingTds += n(row.rushing_tds);
    agg.rushingFirstDowns += n(row.rushing_first_downs);
    agg.rushingEpa += n(row.rushing_epa);
    agg.targets += n(row.targets);
    agg.receptions += n(row.receptions);
    agg.fumblesTotal += n(row.fumbles_total);
    agg.fumblesLost += n(row.fumbles_lost);
    agg.penalties += n(row.penalties);
    agg.penaltyYards += n(row.penalty_yards);
    agg.defSacks += n(row.def_sacks);
    agg.defQbHits += n(row.def_qb_hits);
    agg.defTacklesForLoss += n(row.def_tackles_for_loss);
    agg.defInterceptions += n(row.def_interceptions);
    agg.defPassDefended += n(row.def_pass_defended);
    agg.defFumblesForced += n(row.def_fumbles_forced);
    agg.defTds += n(row.def_tds);
    agg.defSafeties += n(row.def_safeties);
    agg.fgMade += n(row.fg_made);
    agg.fgAtt += n(row.fg_att);
    agg.patMade += n(row.pat_made);
    agg.patAtt += n(row.pat_att);
    agg.punts += n(row.punts);
    agg.puntYards += n(row.punt_yards);
    byFranchise.set(row.franchise_id, agg);
  }
  for (const row of seasonRows ?? []) {
    const agg = byFranchise.get(row.franchise_id) ?? emptyTeamAggregate(row.franchise_id, season);
    agg.wins = row.wins;
    agg.losses = row.losses;
    agg.ties = row.ties;
    agg.pointsFor = row.points_for;
    agg.pointsAgainst = row.points_against;
    agg.divWins = row.div_wins;
    agg.divLosses = row.div_losses;
    agg.divTies = row.div_ties;
    agg.divRank = row.div_rank;
    byFranchise.set(row.franchise_id, agg);
  }
  return byFranchise;
});

export async function getTeamSeasonTotals(franchiseId: string, season = WORKED_EXAMPLE_SEASON): Promise<TeamSeasonTotals | null> {
  const map = await getSeasonTeamAggregates(season, "REG");
  return map.get(franchiseId) ?? null;
}

/** One player's season totals, with team-share fields (teamTargets/teamPassingAirYards) filled from the same season's team aggregates. */
export async function getPlayerSeasonTotals(
  playerId: string,
  season = WORKED_EXAMPLE_SEASON,
  seasonType: SeasonType = "REG",
): Promise<{ totals: SeasonTotals; playerName: string; franchiseId: string | null } | null> {
  const db = createServerClient();
  const [{ data: row, error }, { data: player, error: playerErr }] = await Promise.all([
    db.from("player_season_stats").select("*").eq("player_id", playerId).eq("season", season).eq("season_type", seasonType).maybeSingle(),
    db.from("players").select("display_name").eq("id", playerId).maybeSingle(),
  ]);
  if (error) throw new Error(`Loading ${playerId} ${season} stats failed: ${error.message}`);
  if (playerErr) throw new Error(`Loading player ${playerId} failed: ${playerErr.message}`);
  if (!row || !player) return null;
  const franchiseId = row.last_franchise_id ?? row.franchise_ids?.[0] ?? null;
  const teamMap = await getSeasonTeamAggregates(season, seasonType);
  const team = franchiseId ? teamMap.get(franchiseId) : undefined;
  return {
    totals: toSeasonTotals(row, team ? { targets: team.targets, passingAirYards: team.passingAirYards } : undefined),
    playerName: player.display_name,
    franchiseId,
  };
}

export interface WorkedExamplePlayer {
  totals: SeasonTotals;
  playerName: string;
  franchiseId: string | null;
  /** True when no Lions player fit this subject (or their season was missing), so this is that season's league leader instead. */
  isLeagueLeaderFallback: boolean;
}

/** Resolves a stat's worked-example subject to a real player: the mapped Lions starter when available, otherwise that season's league leader at the position. */
export const getWorkedExamplePlayer = cache(
  async (subject: Exclude<WorkedExampleSubject, "TEAM">, season = WORKED_EXAMPLE_SEASON): Promise<WorkedExamplePlayer | null> => {
    const lionsId = LIONS_SUBJECT_PLAYERS[subject];
    if (lionsId) {
      const lions = await getPlayerSeasonTotals(lionsId, season, "REG");
      if (lions) return { ...lions, isLeagueLeaderFallback: false };
    }

    const { positions, volumeColumn } = SUBJECT_QUALIFIER[subject];
    const db = createServerClient();
    const { data: rows, error } = await db
      .from("player_season_stats")
      .select("*")
      .eq("season", season)
      .eq("season_type", "REG")
      .order(volumeColumn, { ascending: false })
      .limit(50);
    if (error) throw new Error(`Loading ${season} league leaders failed: ${error.message}`);
    if (!rows?.length) return null;

    const ids = rows.map((r) => r.player_id).filter((id): id is string => Boolean(id));
    const { data: players, error: playerErr } = await db.from("players").select("id, display_name, position").in("id", ids);
    if (playerErr) throw new Error(`Loading players for league leaders failed: ${playerErr.message}`);
    const byId = new Map((players ?? []).map((p) => [p.id, p]));

    const leaderRow = rows.find((r) => r.player_id && positions.includes(byId.get(r.player_id)?.position ?? ""));
    if (!leaderRow?.player_id) return null;

    const teamMap = await getSeasonTeamAggregates(season, "REG");
    const franchiseId = leaderRow.last_franchise_id ?? leaderRow.franchise_ids?.[0] ?? null;
    const team = franchiseId ? teamMap.get(franchiseId) : undefined;
    return {
      totals: toSeasonTotals(leaderRow, team ? { targets: team.targets, passingAirYards: team.passingAirYards } : undefined),
      playerName: byId.get(leaderRow.player_id)?.display_name ?? "League leader",
      franchiseId,
      isLeagueLeaderFallback: true,
    };
  },
);

/**
 * Every player_season_stats column except last_franchise_id. That one column requires the view to compute an
 * `array_agg(franchise_id ORDER BY week DESC)`, which forces a full sort of every underlying game row per player
 * — measured as the dominant cost (~400ms of ~430ms) of an unfiltered season scan via EXPLAIN ANALYZE. The
 * percentile pool doesn't need "most recent" team precision, so it uses the cheaper franchise_ids[0] instead.
 */
const PERCENTILE_POOL_COLUMNS = [
  "player_id",
  "season",
  "season_type",
  "games",
  "franchise_ids",
  "completions",
  "attempts",
  "passing_yards",
  "passing_tds",
  "passing_interceptions",
  "sacks_suffered",
  "sack_yards_lost",
  "passing_air_yards",
  "passing_yards_after_catch",
  "passing_first_downs",
  "passing_epa",
  "passing_cpoe",
  "carries",
  "rushing_yards",
  "rushing_tds",
  "rushing_first_downs",
  "rushing_epa",
  "targets",
  "receptions",
  "receiving_yards",
  "receiving_tds",
  "receiving_air_yards",
  "receiving_yards_after_catch",
  "receiving_first_downs",
  "receiving_epa",
  "fumbles_lost",
  "def_tackles_solo",
  "def_tackle_assists",
  "def_tackles_for_loss",
  "def_sacks",
  "def_qb_hits",
  "def_interceptions",
  "def_pass_defended",
  "def_fumbles_forced",
  "def_tds",
  "def_safeties",
  "punt_returns",
  "punt_return_yards",
  "kickoff_returns",
  "kickoff_return_yards",
  "special_teams_tds",
  "fg_made",
  "fg_att",
  "fg_long",
  "fg_made_50_plus",
  "pat_made",
  "pat_att",
  "punts",
  "punt_yards",
  "punts_inside_20",
].join(",");

export interface PercentileResult {
  /** 0–100. Always framed so higher = better, regardless of the stat's own higherIsBetter direction. */
  percentile: number;
  qualifiedCount: number;
}

/**
 * Where a player's stat value falls among that season's qualified players at the same subject position (min
 * volume from stat.qualifiedMinimum). Skipped (returns null) below a 5-player sample — too small to be a
 * meaningful percentile. This is a "nice to have" enrichment on the stat page, not core content, so any query
 * failure (including the anon role's 3s statement_timeout under a cold/loaded database) degrades to null instead
 * of throwing — the page should still render its formula, explanation, and worked example without it.
 */
export const getStatPercentile = cache(
  async (statId: string, targetPlayerId: string, season = WORKED_EXAMPLE_SEASON): Promise<PercentileResult | null> => {
    const stat = getStatById(statId);
    if (!stat?.compute || !stat.qualifiedMinimum || !stat.workedExampleSubject || stat.workedExampleSubject === "TEAM") return null;
    const { positions, volumeColumn } = SUBJECT_QUALIFIER[stat.workedExampleSubject];

    try {
      const db = createServerClient();
      const { data: rawRows, error } = await db
        .from("player_season_stats")
        .select(PERCENTILE_POOL_COLUMNS)
        .eq("season", season)
        .eq("season_type", "REG")
        .gte(volumeColumn, stat.qualifiedMinimum);
      if (error) throw new Error(`Loading ${season} qualified pool failed: ${error.message}`);
      if (!rawRows?.length) return null;
      // last_franchise_id isn't in PERCENTILE_POOL_COLUMNS (see comment above) — toSeasonTotals/below fall back
      // to franchise_ids[0] whenever it's missing, which this cast makes explicit.
      const rows = rawRows as unknown as PlayerSeasonRow[];

      const ids = rows.map((r) => r.player_id).filter((id): id is string => Boolean(id));
      const { data: players, error: playerErr } = await db.from("players").select("id, position").in("id", ids);
      if (playerErr) throw new Error(`Loading positions for qualified pool failed: ${playerErr.message}`);
      const positionById = new Map((players ?? []).map((p) => [p.id, p.position]));
      const teamMap = await getSeasonTeamAggregates(season, "REG");

      return computePercentile(rows, stat, targetPlayerId, (row) => {
        if (!row.player_id || !positions.includes(positionById.get(row.player_id) ?? "")) return null;
        const franchiseId = row.franchise_ids?.[0] ?? null;
        const team = franchiseId ? teamMap.get(franchiseId) : undefined;
        return toSeasonTotals(row, team ? { targets: team.targets, passingAirYards: team.passingAirYards } : undefined);
      });
    } catch (err) {
      console.warn(`getStatPercentile(${statId}) skipped:`, err);
      return null;
    }
  },
);

function computePercentile(
  rows: PlayerSeasonRow[],
  stat: StatDefinition,
  targetPlayerId: string,
  toTotals: (row: PlayerSeasonRow) => SeasonTotals | null,
): PercentileResult | null {
  const values: number[] = [];
  let targetValue: number | null = null;
  for (const row of rows) {
    const totals = toTotals(row);
    if (!totals) continue;
    const result = stat.compute?.(totals);
    if (!result) continue;
    values.push(result.value);
    if (row.player_id === targetPlayerId) targetValue = result.value;
  }
  if (targetValue === null || values.length < 5) return null;
  const better =
    stat.higherIsBetter === false
      ? values.filter((v) => v >= (targetValue as number)).length
      : values.filter((v) => v <= (targetValue as number)).length;
  return { percentile: Math.round((better / values.length) * 100), qualifiedCount: values.length };
}

/** Same idea as getStatPercentile, but for a computeTeam stat across all 32 franchises (every team "qualifies" — same game count). */
export const getTeamStatPercentile = cache(
  async (statId: string, franchiseId: string, season = WORKED_EXAMPLE_SEASON): Promise<PercentileResult | null> => {
    const stat = getStatById(statId);
    if (!stat?.computeTeam) return null;
    try {
      const map = await getSeasonTeamAggregates(season, "REG");

      const values: number[] = [];
      let targetValue: number | null = null;
      for (const [id, totals] of map) {
        const result = stat.computeTeam(totals);
        if (!result) continue;
        values.push(result.value);
        if (id === franchiseId) targetValue = result.value;
      }
      if (targetValue === null || values.length < 5) return null;
      const better =
        stat.higherIsBetter === false
          ? values.filter((v) => v >= (targetValue as number)).length
          : values.filter((v) => v <= (targetValue as number)).length;
      return { percentile: Math.round((better / values.length) * 100), qualifiedCount: values.length };
    } catch (err) {
      console.warn(`getTeamStatPercentile(${statId}) skipped:`, err);
      return null;
    }
  },
);
