/**
 * Typed content model for the stat glossary (/learn/stats/[id]).
 *
 * `compute`/`computeTeam` reproduce the formula against real season totals pulled from our own
 * database columns (see src/lib/data/learn.ts for how SeasonTotals/TeamSeasonTotals are built from
 * `player_game_stats` / `team_game_stats`). They return human-readable `steps` so a worked example
 * can show its own arithmetic, not just the final number.
 */

export type StatCategory =
  | "passing"
  | "rushing"
  | "receiving"
  | "defense"
  | "kicking"
  | "punting"
  | "team"
  | "advanced";

export type StatFormat = "int" | "pct" | "decimal1" | "decimal2" | "yards";

export interface StatVariable {
  symbol: string;
  meaning: string;
}

export interface ComputeResult {
  value: number;
  steps: string[];
}

/** Which real Lions player (or the team itself) illustrates this stat's worked example. */
export type WorkedExampleSubject = "QB" | "RB" | "WR" | "TE" | "EDGE" | "K" | "P" | "TEAM";

/** Season totals for one player, summed from player_game_stats (0 stored as NULL, coalesced to 0). */
export interface SeasonTotals {
  playerId: string;
  season: number;
  seasonType: "REG" | "POST";
  games: number;

  completions: number;
  attempts: number;
  passingYards: number;
  passingTds: number;
  passingInterceptions: number;
  sacksSuffered: number;
  sackYardsLost: number;
  passingAirYards: number;
  passingYardsAfterCatch: number;
  passingFirstDowns: number;
  passingEpa: number;
  /** Attempt-weighted average CPOE across the season's games (CPOE itself is a rate, not additive). */
  passingCpoe: number | null;

  carries: number;
  rushingYards: number;
  rushingTds: number;
  rushingFirstDowns: number;
  rushingEpa: number;

  targets: number;
  receptions: number;
  receivingYards: number;
  receivingTds: number;
  receivingAirYards: number;
  receivingYardsAfterCatch: number;
  receivingFirstDowns: number;
  receivingEpa: number;

  fumblesLost: number;

  /** The player's own team's season totals, for share-of-team stats (target share, air-yards share, WOPR). */
  teamTargets: number | null;
  teamPassingAirYards: number | null;

  defTacklesSolo: number;
  defTackleAssists: number;
  defTacklesForLoss: number;
  defSacks: number;
  defQbHits: number;
  defInterceptions: number;
  defPassDefended: number;
  defFumblesForced: number;
  defTds: number;
  defSafeties: number;

  puntReturns: number;
  puntReturnYards: number;
  kickoffReturns: number;
  kickoffReturnYards: number;
  specialTeamsTds: number;

  fgMade: number;
  fgAtt: number;
  fgLong: number;
  fgMade50Plus: number;
  patMade: number;
  patAtt: number;

  punts: number;
  puntYards: number;
  puntsInside20: number;
}

/** Season totals for one team, summed from team_game_stats. */
export interface TeamSeasonTotals {
  franchiseId: string;
  season: number;
  games: number;

  completions: number;
  attempts: number;
  passingYards: number;
  passingTds: number;
  passingInterceptions: number;
  sacksSuffered: number;
  sackYardsLost: number;
  passingFirstDowns: number;
  passingEpa: number;

  carries: number;
  rushingYards: number;
  rushingTds: number;
  rushingFirstDowns: number;
  rushingEpa: number;

  targets: number;
  receptions: number;
  fumblesTotal: number;
  fumblesLost: number;
  penalties: number;
  penaltyYards: number;

  defSacks: number;
  defQbHits: number;
  defTacklesForLoss: number;
  defInterceptions: number;
  defPassDefended: number;
  defFumblesForced: number;
  defTds: number;
  defSafeties: number;

  fgMade: number;
  fgAtt: number;
  patMade: number;
  patAtt: number;
  punts: number;
  puntYards: number;

  /** From team_seasons — already aggregated by the sync from final scores, not team_game_stats. */
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  divWins: number;
  divLosses: number;
  divTies: number;
  divRank: number | null;
}

export interface StatDefinition {
  id: string;
  name: string;
  abbr?: string;
  category: StatCategory;
  /** One sentence: what it measures. */
  summary: string;
  /** KaTeX source, rendered server-side with katex.renderToString. */
  formulaTex?: string;
  variables?: StatVariable[];
  /** Interpretation paragraphs, including rough benchmarks tied to the season/era they apply to. */
  howToRead: string[];
  /** Common misreadings: small samples, era effects, volume vs. efficiency, etc. */
  pitfalls?: string[];
  /** Reproduces the formula against a player's real season totals. */
  compute?: (totals: SeasonTotals) => ComputeResult | null;
  /** Reproduces the formula against a team's real season totals. */
  computeTeam?: (totals: TeamSeasonTotals) => ComputeResult | null;
  format?: StatFormat;
  higherIsBetter?: boolean;
  related: string[];
  /** What years this app has data for it, e.g. "1999–today". */
  availability: string;
  /** Explained only — not computed or stored (PFF grades, DVOA, ESPN QBR). */
  proprietary?: boolean;
  /** Which subject the worked example on this stat's page should use. Defaults by category if omitted. */
  workedExampleSubject?: WorkedExampleSubject;
  /** Minimum volume (attempts/carries/targets/etc.) to be "qualified" for the percentile line. */
  qualifiedMinimum?: number;
}
