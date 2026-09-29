import "server-only";
import { cache } from "react";
import { createServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { toTotals, type GameLogRow, type SeasonSnaps, type Totals } from "@/lib/player-stats";
import { getFranchises, type FranchiseSummary } from "./teams";

export type Player = Tables<"players">;

/** Route ids are URL-encoded ("h-bobby-layne-19261219" is safe, but decode anyway so odd ids still resolve). */
export function decodePlayerId(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export const getPlayer = cache(async (id: string): Promise<Player | null> => {
  const { data, error } = await createServerClient().from("players").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`Loading player ${id} failed: ${error.message}`);
  return data;
});

/* -------------------------------------------------------------------------- roster seasons */

export interface RosterSeason {
  season: number;
  teamAbbr: string;
  franchiseId: string | null;
  jersey: number | null;
  position: string | null;
  status: string | null;
}

export const getRosterSeasons = cache(async (id: string): Promise<RosterSeason[]> => {
  const { data, error } = await createServerClient()
    .from("player_seasons")
    .select("season, team_abbr, franchise_id, jersey_number, position, status")
    .eq("player_id", id)
    .order("season");
  if (error) throw new Error(`Loading ${id} roster seasons failed: ${error.message}`);
  return (data ?? []).map((r) => ({
    season: r.season,
    teamAbbr: r.team_abbr,
    franchiseId: r.franchise_id,
    jersey: r.jersey_number,
    position: r.position,
    status: r.status,
  }));
});

type TeamAbbrRow = Tables<"team_abbrs">;

/** Every era of the abbreviations a player used, so names can be shown as they were then ("St. Louis Rams" in 2010). */
export const getTeamAbbrs = cache(async (abbrs: string): Promise<TeamAbbrRow[]> => {
  const list = abbrs.split(",").filter(Boolean);
  if (!list.length) return [];
  const { data, error } = await createServerClient().from("team_abbrs").select("*").in("abbr", list);
  if (error) throw new Error(`Loading team names failed: ${error.message}`);
  return data ?? [];
});

/** Team name for an abbreviation in a given season, or null when we have no record of it. */
export function teamNameAsOf(rows: TeamAbbrRow[], abbr: string, season: number, franchiseId?: string | null): string | null {
  const candidates = rows.filter((r) => r.abbr === abbr);
  const inRange = candidates.filter((r) => r.start_season <= season && season <= r.end_season);
  const pool = franchiseId ? inRange.filter((r) => r.franchise_id === franchiseId) : inRange;
  return (pool[0] ?? inRange[0])?.name ?? null;
}

/* -------------------------------------------------------------------------- trades */

export const getPlayerTrades = cache(async (id: string) => {
  const { data, error } = await createServerClient().from("trades").select("*").eq("player_id", id).order("trade_date");
  if (error) throw new Error(`Loading ${id} trades failed: ${error.message}`);
  return data ?? [];
});

export type PlayerTrade = Awaited<ReturnType<typeof getPlayerTrades>>[number];

/* -------------------------------------------------------------------------- career path */

export type StintEntry =
  | { kind: "draft"; text: string; note?: string }
  | { kind: "trade"; text: string; note?: string }
  | { kind: "joined"; text: string; note?: string };

export interface Stint {
  key: string;
  franchiseId: string | null;
  abbr: string;
  /** Team name as it was when the stint began. */
  name: string;
  /** Today's name when the club has been renamed or moved since. */
  currentName: string | null;
  logoUrl: string | null;
  color: string | null;
  startSeason: number;
  endSeason: number;
  seasons: number;
  entry: StintEntry;
  /** True for clubs that no longer exist (or that aren't part of a current franchise). */
  defunct: boolean;
}

/** Statuses that mean the player was leaving that team: sorted before the team he landed with in a two-team season. */
const DEPARTURE_STATUSES = new Set(["CUT", "TRC", "TRD", "TRT", "TRL", "RFA", "UFA"]);

interface StintInput {
  player: Player;
  rosterSeasons: RosterSeason[];
  trades: PlayerTrade[];
  abbrs: TeamAbbrRow[];
  franchises: FranchiseSummary[];
}

/** Consecutive roster seasons with one club become a stint; the way he arrived comes from the draft or the trades table. */
export function buildStints({ player, rosterSeasons, trades, abbrs, franchises }: StintInput): Stint[] {
  const byId = new Map(franchises.map((f) => [f.id, f]));
  const playerTrades = trades.filter((t) => t.pick_season === null);
  const pickTrades = trades.filter((t) => t.pick_season !== null);

  const tradeRank = (row: RosterSeason) => {
    const trade = playerTrades.find((t) => t.season === row.season);
    if (!trade) return null;
    if (trade.from_franchise_id === row.franchiseId) return 0;
    if (trade.to_franchise_id === row.franchiseId) return 2;
    return null;
  };
  const ordered = rosterSeasons.toSorted(
    (a, b) =>
      a.season - b.season ||
      (tradeRank(a) ?? (DEPARTURE_STATUSES.has(a.status ?? "") ? 0 : 1)) - (tradeRank(b) ?? (DEPARTURE_STATUSES.has(b.status ?? "") ? 0 : 1)) ||
      a.teamAbbr.localeCompare(b.teamAbbr),
  );

  const runs: { key: string; rows: RosterSeason[] }[] = [];
  for (const row of ordered) {
    const key = row.franchiseId ?? `x:${row.teamAbbr}`;
    const last = runs.at(-1);
    const lastSeason = last?.rows.at(-1)?.season ?? -1;
    if (last && last.key === key && row.season - lastSeason <= 1) last.rows.push(row);
    else runs.push({ key, rows: [row] });
  }

  const claimedTrades = new Set<PlayerTrade>();
  return runs.map((run, index): Stint => {
    const first = run.rows[0];
    const franchise = first.franchiseId ? byId.get(first.franchiseId) : undefined;
    const startSeason = first.season;
    const endSeason = run.rows.at(-1)!.season;
    const name = teamNameAsOf(abbrs, first.teamAbbr, startSeason, first.franchiseId) ?? franchise?.name ?? first.teamAbbr;
    const draftedHere =
      index === 0 &&
      player.draft_season !== null &&
      player.draft_franchise_id !== null &&
      first.franchiseId === player.draft_franchise_id &&
      Math.abs(startSeason - player.draft_season) <= 1;

    let entry: StintEntry;
    if (draftedHere) {
      const pickTrade = pickTrades.find(
        (t) => t.to_franchise_id === first.franchiseId && t.season === player.draft_season && t.pick_number === player.draft_pick,
      );
      const fromName = pickTrade ? teamNameAsOf(abbrs, pickTrade.from_abbr, pickTrade.season) ?? pickTrade.from_abbr : null;
      entry = {
        kind: "draft",
        text: `Drafted · Round ${player.draft_round}, Pick ${player.draft_pick}`,
        note: fromName ? `The team traded up for this pick, acquiring it from the ${fromName}.` : undefined,
      };
    } else {
      const trade = playerTrades
        .filter((t) => !claimedTrades.has(t) && t.to_franchise_id === first.franchiseId && first.franchiseId !== null)
        .filter((t) => Math.abs(t.season - startSeason) <= 1)
        .toSorted((a, b) => Math.abs(a.season - startSeason) - Math.abs(b.season - startSeason))[0];
      if (trade) {
        claimedTrades.add(trade);
        const fromName = teamNameAsOf(abbrs, trade.from_abbr, trade.season) ?? trade.from_abbr;
        entry = { kind: "trade", text: `Traded from ${fromName}`, note: trade.trade_date ?? undefined };
      } else if (index === 0 && player.first_season !== null && player.first_season > 1980 && player.draft_season === null) {
        entry = { kind: "joined", text: "Signed as an undrafted free agent", note: "Inferred: no draft record since 1980" };
      } else {
        entry = { kind: "joined", text: "Joined the team", note: "Inferred from roster changes" };
      }
    }

    return {
      key: `${run.key}-${startSeason}`,
      franchiseId: first.franchiseId,
      abbr: first.teamAbbr,
      name,
      currentName: franchise && franchise.name !== name ? franchise.name : null,
      logoUrl: franchise?.logo_url ?? null,
      color: franchise?.color_primary ?? null,
      startSeason,
      endSeason,
      seasons: run.rows.length,
      entry,
      defunct: !franchise,
    };
  });
}

/** "2016 · Round 1, Pick 1" style draft line; undrafted only claimed where draft records exist (1980+). */
export function draftLine(player: Player, franchises: FranchiseSummary[]): string {
  if (player.draft_season !== null && player.draft_round !== null && player.draft_pick !== null) {
    const team = franchises.find((f) => f.id === player.draft_franchise_id);
    return `${player.draft_season} · Round ${player.draft_round}, Pick ${player.draft_pick}${team ? ` · ${team.nickname}` : ""}`;
  }
  if (player.first_season !== null && player.first_season > 1980) return "Undrafted";
  return "Draft records start in 1980";
}

/* -------------------------------------------------------------------------- awards, contract, injury */

export interface AwardChip {
  award: string;
  seasons: number[];
}

export const getAwards = cache(async (id: string): Promise<AwardChip[]> => {
  const { data, error } = await createServerClient().from("awards").select("season, award").eq("player_id", id).order("season");
  if (error) throw new Error(`Loading ${id} awards failed: ${error.message}`);
  const grouped = Map.groupBy(data ?? [], (a) => a.award);
  return [...grouped].map(([award, rows]) => ({ award, seasons: rows.map((r) => r.season) }));
});

export const AWARD_NAME: Record<string, string> = {
  MVP: "Most Valuable Player",
  OPOY: "Offensive Player of the Year",
  DPOY: "Defensive Player of the Year",
  OROY: "Offensive Rookie of the Year",
  DROY: "Defensive Rookie of the Year",
  CPOY: "Comeback Player of the Year",
  WPMOY: "Walter Payton Man of the Year",
  COY: "Coach of the Year",
};

export const getActiveContract = cache(async (id: string) => {
  const { data, error } = await createServerClient()
    .from("contracts")
    .select("*")
    .eq("player_id", id)
    .eq("is_active", true)
    .order("year_signed", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Loading ${id} contract failed: ${error.message}`);
  return data;
});

export interface InjuryStatus {
  /** Week of the league's most recent injury report this season (null when none exist yet). */
  latestWeek: number | null;
  /** The player's entry on that report, if he is on it. */
  entry: Tables<"injury_reports"> | null;
}

/** The player's line on the league's most recent injury report of the current season. */
export const getInjuryStatus = cache(async (id: string, season: number): Promise<InjuryStatus> => {
  const db = createServerClient();
  const [latest, mine] = await Promise.all([
    db.from("injury_reports").select("week").eq("season", season).order("week", { ascending: false }).limit(1).maybeSingle(),
    db.from("injury_reports").select("*").eq("player_id", id).eq("season", season).order("week", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (latest.error) throw new Error(`Loading injury week failed: ${latest.error.message}`);
  if (mine.error) throw new Error(`Loading ${id} injuries failed: ${mine.error.message}`);
  const latestWeek = latest.data?.week ?? null;
  return { latestWeek, entry: mine.data && mine.data.week === latestWeek ? mine.data : null };
});

/* -------------------------------------------------------------------------- season stats and snaps */

export interface SeasonLine {
  season: number;
  seasonType: "REG" | "POST";
  franchiseIds: string[];
  totals: Totals;
}

// Every stat column except `last_franchise_id`, which makes the view very slow.
const SEASON_STAT_COLUMNS =
  "season, season_type, games, franchise_ids, completions, attempts, passing_yards, passing_tds, passing_interceptions, sacks_suffered, sack_yards_lost, passing_epa, carries, rushing_yards, rushing_tds, rushing_epa, targets, receptions, receiving_yards, receiving_tds, receiving_yards_after_catch, receiving_epa, fumbles_lost, def_tackles_solo, def_tackle_assists, def_tackles_for_loss, def_sacks, def_qb_hits, def_interceptions, def_pass_defended, def_fumbles_forced, def_tds, fg_made, fg_att, fg_long, fg_made_50_plus, pat_made, pat_att, punts, punt_yards, punts_inside_20";

export const getSeasonLines = cache(async (id: string): Promise<SeasonLine[]> => {
  const { data, error } = await createServerClient().from("player_season_stats").select(SEASON_STAT_COLUMNS).eq("player_id", id).order("season");
  if (error) throw new Error(`Loading ${id} season stats failed: ${error.message}`);
  return (data ?? []).map((row) => {
    const r = row as unknown as Record<string, unknown>;
    return {
      season: r.season as number,
      seasonType: r.season_type === "POST" ? "POST" : "REG",
      franchiseIds: (r.franchise_ids as string[] | null) ?? [],
      totals: toTotals(r),
    };
  });
});

export const getSeasonSnaps = cache(async (id: string): Promise<SeasonSnaps[]> => {
  const { data, error } = await createServerClient().from("player_season_snaps").select("*").eq("player_id", id).order("season");
  if (error) throw new Error(`Loading ${id} snap counts failed: ${error.message}`);
  return (data ?? []).map((r) => ({
    season: r.season ?? 0,
    games: r.games ?? 0,
    offenseSnaps: r.offense_snaps ?? 0,
    defenseSnaps: r.defense_snaps ?? 0,
    stSnaps: r.st_snaps ?? 0,
    offensePct: r.avg_offense_pct,
    defensePct: r.avg_defense_pct,
    stPct: r.avg_st_pct,
  }));
});

/* -------------------------------------------------------------------------- game log */

/** One season's games for a player: stat line and snap counts merged per game, with opponent and result resolved. */
export const getSeasonGames = cache(async (id: string, season: number): Promise<GameLogRow[]> => {
  const db = createServerClient();
  const [stats, snaps] = await Promise.all([
    db.from("player_game_stats").select("*").eq("player_id", id).eq("season", season),
    db.from("player_game_snaps").select("*").eq("player_id", id).eq("season", season),
  ]);
  if (stats.error) throw new Error(`Loading ${id} game stats failed: ${stats.error.message}`);
  if (snaps.error) throw new Error(`Loading ${id} game snaps failed: ${snaps.error.message}`);

  const statByGame = new Map((stats.data ?? []).map((r) => [r.game_id, r]));
  const snapByGame = new Map((snaps.data ?? []).map((r) => [r.game_id, r]));
  const gameIds = [...new Set([...statByGame.keys(), ...snapByGame.keys()])];
  if (!gameIds.length) return [];

  const { data: games, error } = await db
    .from("games")
    .select("id, season, week, game_type, gameday, home_abbr, away_abbr, home_franchise_id, away_franchise_id, home_score, away_score, overtime, location")
    .in("id", gameIds);
  if (error) throw new Error(`Loading ${id} games failed: ${error.message}`);

  return (games ?? [])
    .toSorted((a, b) => a.gameday.localeCompare(b.gameday))
    .map((game): GameLogRow => {
      const stat = statByGame.get(game.id);
      const snap = snapByGame.get(game.id);
      const teamAbbr = stat?.team_abbr ?? snap?.team_abbr;
      const home = teamAbbr === game.home_abbr;
      const teamScore = home ? game.home_score : game.away_score;
      const opponentScore = home ? game.away_score : game.home_score;
      const played = teamScore !== null && opponentScore !== null;
      return {
        gameId: game.id,
        season: game.season,
        week: game.week,
        gameType: game.game_type,
        date: game.gameday,
        opponentId: home ? game.away_franchise_id : game.home_franchise_id,
        opponentAbbr: home ? game.away_abbr : game.home_abbr,
        home,
        neutral: game.location === "Neutral",
        result: !played ? null : teamScore > opponentScore ? "W" : teamScore < opponentScore ? "L" : "T",
        teamScore,
        opponentScore,
        overtime: !!game.overtime,
        stats: stat ? toTotals(stat) : null,
        snaps: snap
          ? {
              offense: snap.offense_snaps,
              offensePct: snap.offense_pct,
              defense: snap.defense_snaps,
              defensePct: snap.defense_pct,
              st: snap.st_snaps,
              stPct: snap.st_pct,
            }
          : null,
      };
    });
});

/* -------------------------------------------------------------------------- page bundle */

/** Everything the player page needs besides the (dependent) default-season game log. */
export const getPlayerBundle = cache(async (id: string, currentSeason: number) => {
  const [player, rosterSeasons, trades, lines, snaps, awards, contract, injury, franchises] = await Promise.all([
    getPlayer(id),
    getRosterSeasons(id),
    getPlayerTrades(id),
    getSeasonLines(id),
    getSeasonSnaps(id),
    getAwards(id),
    getActiveContract(id),
    getInjuryStatus(id, currentSeason),
    getFranchises(),
  ]);
  if (!player) return null;

  const abbrs = await getTeamAbbrs([...new Set([...rosterSeasons.map((r) => r.teamAbbr), ...trades.flatMap((t) => [t.from_abbr, t.to_abbr])])].sort().join(","));
  const stints = buildStints({ player, rosterSeasons, trades, abbrs, franchises });
  const gameSeasons = [...new Set([...lines.map((l) => l.season), ...snaps.map((s) => s.season)])].sort((a, b) => a - b);
  const defaultSeason = gameSeasons.at(-1) ?? null;
  const initialGames = defaultSeason ? await getSeasonGames(id, defaultSeason) : [];

  return { player, rosterSeasons, trades, lines, snaps, awards, contract, injury, franchises, abbrs, stints, gameSeasons, defaultSeason, initialGames };
});

export type PlayerBundle = NonNullable<Awaited<ReturnType<typeof getPlayerBundle>>>;
