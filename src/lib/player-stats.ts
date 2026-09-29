/**
 * Pure (server + client safe) definitions for the player page: which stat columns each kind of player gets, how
 * derived rates are computed from raw totals, and small shared types. Formulas mirror the glossary
 * (src/content/stats/*); `statId` links a column header to its glossary entry.
 */

export type StatKind = "passing" | "rushing" | "receiving" | "defense" | "kicking" | "punting" | "none";

/** Raw counting totals keyed by database column name; missing keys mean zero (0 is stored as NULL). */
export type Totals = Record<string, number>;

export type Fmt = "int" | "num" | "d1" | "d2" | "sd2" | "pct" | "text";

export interface StatColumn {
  id: string;
  /** Header text. */
  label: string;
  /** Plain-English name, used as the accessible/hover name for columns without a glossary entry. */
  title: string;
  /** Glossary entry (src/content/stats) rendered as a StatTerm header on the server. */
  statId?: string;
  fmt: Fmt;
  value: (t: Totals) => number | null;
  /** Shown in the season table (default true). */
  season?: boolean;
  /** Shown in the game log (default true). */
  game?: boolean;
}

const n = (t: Totals, key: string) => t[key] ?? 0;
const ratio = (a: number, b: number, scale = 1) => (b > 0 ? (a / b) * scale : null);

/** NFL passer rating (0–158.3), the same formula as the glossary's `passer-rating` entry. */
export function passerRating(t: Totals): number | null {
  const att = n(t, "attempts");
  if (att <= 0) return null;
  const clamp = (x: number) => Math.min(2.375, Math.max(0, x));
  const a = clamp((n(t, "completions") / att - 0.3) * 5);
  const b = clamp((n(t, "passing_yards") / att - 3) * 0.25);
  const c = clamp((n(t, "passing_tds") / att) * 20);
  const d = clamp(2.375 - (n(t, "passing_interceptions") / att) * 25);
  return ((a + b + c + d) / 6) * 100;
}

const tackles = (t: Totals) => n(t, "def_tackles_solo") + n(t, "def_tackle_assists");

const GP: StatColumn = { id: "gp", label: "GP", title: "Games played", fmt: "int", value: (t) => n(t, "games"), game: false };

const PASSING: StatColumn[] = [
  GP,
  { id: "cmp", label: "Cmp", title: "Completions", fmt: "int", value: (t) => n(t, "completions") },
  { id: "att", label: "Att", title: "Pass attempts", fmt: "int", value: (t) => n(t, "attempts") },
  { id: "cmp_pct", label: "Cmp%", title: "Completion percentage", statId: "completion-pct", fmt: "pct", value: (t) => ratio(n(t, "completions"), n(t, "attempts"), 100) },
  { id: "yds", label: "Yds", title: "Passing yards", fmt: "int", value: (t) => n(t, "passing_yards") },
  { id: "ypa", label: "Y/A", title: "Yards per attempt", statId: "yards-per-attempt", fmt: "d1", value: (t) => ratio(n(t, "passing_yards"), n(t, "attempts")), game: false },
  { id: "td", label: "TD", title: "Passing touchdowns", fmt: "int", value: (t) => n(t, "passing_tds") },
  { id: "int", label: "INT", title: "Interceptions thrown", fmt: "int", value: (t) => n(t, "passing_interceptions") },
  { id: "rate", label: "Rate", title: "Passer rating", statId: "passer-rating", fmt: "d1", value: passerRating },
  {
    id: "epa_db",
    label: "EPA/db",
    title: "Expected points added per dropback",
    statId: "epa-per-dropback",
    fmt: "sd2",
    value: (t) => ratio(n(t, "passing_epa"), n(t, "attempts") + n(t, "sacks_suffered")),
  },
  { id: "sck", label: "Sck", title: "Times sacked", statId: "sack-rate", fmt: "int", value: (t) => n(t, "sacks_suffered") },
  { id: "ra", label: "Car", title: "Rushing attempts", fmt: "int", value: (t) => n(t, "carries") },
  { id: "ry", label: "Rush Yds", title: "Rushing yards", fmt: "int", value: (t) => n(t, "rushing_yards") },
  { id: "rtd", label: "Rush TD", title: "Rushing touchdowns", fmt: "int", value: (t) => n(t, "rushing_tds") },
];

const RUSHING: StatColumn[] = [
  GP,
  { id: "car", label: "Car", title: "Carries", fmt: "int", value: (t) => n(t, "carries") },
  { id: "ryd", label: "Yds", title: "Rushing yards", fmt: "int", value: (t) => n(t, "rushing_yards") },
  { id: "ypc", label: "YPC", title: "Yards per carry", statId: "yards-per-carry", fmt: "d1", value: (t) => ratio(n(t, "rushing_yards"), n(t, "carries")) },
  { id: "rtd", label: "TD", title: "Rushing touchdowns", fmt: "int", value: (t) => n(t, "rushing_tds") },
  { id: "epa_c", label: "EPA/car", title: "Expected points added per carry", statId: "rushing-epa-per-carry", fmt: "sd2", value: (t) => ratio(n(t, "rushing_epa"), n(t, "carries")), game: false },
  { id: "tgt", label: "Tgt", title: "Targets", fmt: "int", value: (t) => n(t, "targets") },
  { id: "rec", label: "Rec", title: "Receptions", fmt: "int", value: (t) => n(t, "receptions") },
  { id: "recyd", label: "Rec Yds", title: "Receiving yards", fmt: "int", value: (t) => n(t, "receiving_yards") },
  { id: "ypr", label: "Y/R", title: "Yards per reception", statId: "yards-per-reception", fmt: "d1", value: (t) => ratio(n(t, "receiving_yards"), n(t, "receptions")), game: false },
  { id: "rectd", label: "Rec TD", title: "Receiving touchdowns", fmt: "int", value: (t) => n(t, "receiving_tds") },
  { id: "fl", label: "FL", title: "Fumbles lost", statId: "fumbles-lost", fmt: "int", value: (t) => n(t, "fumbles_lost") },
];

const RECEIVING: StatColumn[] = [
  GP,
  { id: "tgt", label: "Tgt", title: "Targets", fmt: "int", value: (t) => n(t, "targets") },
  { id: "rec", label: "Rec", title: "Receptions", fmt: "int", value: (t) => n(t, "receptions") },
  { id: "recyd", label: "Yds", title: "Receiving yards", fmt: "int", value: (t) => n(t, "receiving_yards") },
  { id: "rectd", label: "TD", title: "Receiving touchdowns", fmt: "int", value: (t) => n(t, "receiving_tds") },
  { id: "catch", label: "Catch%", title: "Catch rate", statId: "catch-rate", fmt: "pct", value: (t) => ratio(n(t, "receptions"), n(t, "targets"), 100) },
  { id: "ypr", label: "Y/R", title: "Yards per reception", statId: "yards-per-reception", fmt: "d1", value: (t) => ratio(n(t, "receiving_yards"), n(t, "receptions")) },
  { id: "ypt", label: "Y/Tgt", title: "Yards per target", statId: "yards-per-target", fmt: "d1", value: (t) => ratio(n(t, "receiving_yards"), n(t, "targets")), game: false },
  { id: "yac", label: "YAC/R", title: "Yards after catch per reception", statId: "yac-per-reception", fmt: "d1", value: (t) => ratio(n(t, "receiving_yards_after_catch"), n(t, "receptions")), game: false },
  { id: "epa_t", label: "EPA/tgt", title: "Expected points added per target", statId: "receiving-epa-per-target", fmt: "sd2", value: (t) => ratio(n(t, "receiving_epa"), n(t, "targets")), game: false },
  { id: "car", label: "Car", title: "Carries", fmt: "int", value: (t) => n(t, "carries"), game: false },
  { id: "ryd", label: "Rush Yds", title: "Rushing yards", fmt: "int", value: (t) => n(t, "rushing_yards"), game: false },
  { id: "fl", label: "FL", title: "Fumbles lost", statId: "fumbles-lost", fmt: "int", value: (t) => n(t, "fumbles_lost"), game: false },
];

const DEFENSE: StatColumn[] = [
  GP,
  { id: "tkl", label: "Tkl", title: "Total tackles (solo + assisted)", statId: "solo-vs-assisted-tackles", fmt: "int", value: tackles },
  { id: "solo", label: "Solo", title: "Solo tackles", fmt: "int", value: (t) => n(t, "def_tackles_solo") },
  { id: "tfl", label: "TFL", title: "Tackles for loss", statId: "tackles-for-loss", fmt: "num", value: (t) => n(t, "def_tackles_for_loss") },
  { id: "sck", label: "Sck", title: "Sacks", statId: "sacks", fmt: "num", value: (t) => n(t, "def_sacks") },
  { id: "qbh", label: "QB Hits", title: "Quarterback hits", statId: "qb-hits", fmt: "int", value: (t) => n(t, "def_qb_hits") },
  { id: "int", label: "INT", title: "Interceptions", statId: "def-interceptions", fmt: "int", value: (t) => n(t, "def_interceptions") },
  { id: "pd", label: "PD", title: "Passes defended", statId: "passes-defended", fmt: "int", value: (t) => n(t, "def_pass_defended") },
  { id: "ff", label: "FF", title: "Forced fumbles", statId: "forced-fumbles", fmt: "int", value: (t) => n(t, "def_fumbles_forced") },
  { id: "dtd", label: "TD", title: "Defensive touchdowns", fmt: "int", value: (t) => n(t, "def_tds") },
];

const KICKING: StatColumn[] = [
  GP,
  { id: "fgm", label: "FGM", title: "Field goals made", fmt: "int", value: (t) => n(t, "fg_made") },
  { id: "fga", label: "FGA", title: "Field goals attempted", fmt: "int", value: (t) => n(t, "fg_att") },
  { id: "fgp", label: "FG%", title: "Field goal percentage", statId: "fg-pct", fmt: "pct", value: (t) => ratio(n(t, "fg_made"), n(t, "fg_att"), 100) },
  { id: "lng", label: "Long", title: "Longest field goal made", fmt: "int", value: (t) => (n(t, "fg_long") > 0 ? n(t, "fg_long") : null) },
  { id: "fg50", label: "50+ FGM", title: "Field goals made from 50+ yards", statId: "fg-pct-long", fmt: "int", value: (t) => n(t, "fg_made_50_plus") },
  { id: "xpm", label: "XPM", title: "Extra points made", fmt: "int", value: (t) => n(t, "pat_made") },
  { id: "xpa", label: "XPA", title: "Extra points attempted", fmt: "int", value: (t) => n(t, "pat_att") },
  { id: "xpp", label: "XP%", title: "Extra point percentage", statId: "xp-pct", fmt: "pct", value: (t) => ratio(n(t, "pat_made"), n(t, "pat_att"), 100), game: false },
];

const PUNTING: StatColumn[] = [
  GP,
  { id: "punts", label: "Punts", title: "Punts", fmt: "int", value: (t) => n(t, "punts") },
  { id: "pyds", label: "Yds", title: "Punt yards", fmt: "int", value: (t) => n(t, "punt_yards") },
  { id: "avg", label: "Avg", title: "Gross punting average", statId: "gross-punt-average", fmt: "d1", value: (t) => ratio(n(t, "punt_yards"), n(t, "punts")) },
  { id: "in20", label: "In 20", title: "Punts downed inside the 20", statId: "inside-20-rate", fmt: "int", value: (t) => n(t, "punts_inside_20") },
  { id: "in20p", label: "In20%", title: "Share of punts downed inside the 20", statId: "inside-20-rate", fmt: "pct", value: (t) => ratio(n(t, "punts_inside_20"), n(t, "punts"), 100), game: false },
];

const COLUMNS: Record<StatKind, StatColumn[]> = {
  passing: PASSING,
  rushing: RUSHING,
  receiving: RECEIVING,
  defense: DEFENSE,
  kicking: KICKING,
  punting: PUNTING,
  none: [],
};

export const seasonColumns = (kind: StatKind) => COLUMNS[kind].filter((c) => c.season !== false);
export const gameColumns = (kind: StatKind) => COLUMNS[kind].filter((c) => c.game !== false);

/** Which stat table a player gets, from their position (kickers/punters) and position group. */
export function statKindFor(position: string | null, group: string | null): StatKind {
  if (position === "K") return "kicking";
  if (position === "P") return "punting";
  switch (group) {
    case "QB":
      return "passing";
    case "RB":
      return "rushing";
    case "WR":
    case "TE":
      return "receiving";
    case "DL":
    case "LB":
    case "DB":
      return "defense";
    default:
      return "none";
  }
}

/** Formats a computed stat for display; null (undefined rate, e.g. no attempts) becomes an em dash. */
export function formatCell(value: number | null, fmt: Fmt): string {
  if (value === null || Number.isNaN(value)) return "—";
  switch (fmt) {
    case "int":
      return Math.round(value).toLocaleString("en-US");
    case "num":
      return Number.isInteger(value) ? String(value) : value.toFixed(1);
    case "d1":
      return value.toFixed(1);
    case "d2":
      return value.toFixed(2);
    case "sd2":
      return `${value > 0 ? "+" : ""}${value.toFixed(2)}`;
    case "pct":
      return `${value.toFixed(1)}%`;
    default:
      return String(value);
  }
}

const NOT_STATS = new Set(["season", "week", "sync_run_id"]);

/** Converts any database row (or view row) to totals: numeric stat columns kept, nulls and identifiers dropped. */
export function toTotals(row: object): Totals {
  const totals: Totals = {};
  for (const [key, value] of Object.entries(row)) {
    if (typeof value === "number" && Number.isFinite(value) && !NOT_STATS.has(key)) totals[key] = value;
  }
  return totals;
}

const MAX_KEYS = new Set(["fg_long"]);

/** Sums season totals into career totals (longest kick is a max, not a sum). Rates are recomputed from these. */
export function sumTotals(rows: Totals[]): Totals {
  const out: Totals = {};
  for (const row of rows) {
    for (const [key, value] of Object.entries(row)) {
      out[key] = MAX_KEYS.has(key) ? Math.max(out[key] ?? 0, value) : (out[key] ?? 0) + value;
    }
  }
  return out;
}

export interface Headline {
  label: string;
  value: (t: Totals) => number;
  detail: (t: Totals) => string;
}

/** The one number a career chart plots per season. */
export function headlineFor(kind: StatKind, group: string | null): Headline | null {
  switch (kind) {
    case "passing":
      return {
        label: "Passing yards",
        value: (t) => n(t, "passing_yards"),
        detail: (t) => `${n(t, "passing_tds")} TD · ${n(t, "passing_interceptions")} INT · ${n(t, "games")} GP`,
      };
    case "rushing":
      return {
        label: "Rushing yards",
        value: (t) => n(t, "rushing_yards"),
        detail: (t) => `${n(t, "carries")} carries · ${n(t, "rushing_tds")} TD · ${n(t, "games")} GP`,
      };
    case "receiving":
      return {
        label: "Receiving yards",
        value: (t) => n(t, "receiving_yards"),
        detail: (t) => `${n(t, "receptions")} catches · ${n(t, "receiving_tds")} TD · ${n(t, "games")} GP`,
      };
    case "defense":
      if (group === "DL")
        return {
          label: "Sacks",
          value: (t) => n(t, "def_sacks"),
          detail: (t) => `${tackles(t)} tackles · ${n(t, "def_qb_hits")} QB hits · ${n(t, "games")} GP`,
        };
      if (group === "DB")
        return {
          label: "Passes defended",
          value: (t) => n(t, "def_pass_defended"),
          detail: (t) => `${n(t, "def_interceptions")} INT · ${tackles(t)} tackles · ${n(t, "games")} GP`,
        };
      return {
        label: "Tackles",
        value: tackles,
        detail: (t) => `${formatCell(n(t, "def_sacks"), "num")} sacks · ${n(t, "def_interceptions")} INT · ${n(t, "games")} GP`,
      };
    case "kicking":
      return {
        label: "Field goals made",
        value: (t) => n(t, "fg_made"),
        detail: (t) => `${n(t, "fg_made")}/${n(t, "fg_att")} · long ${n(t, "fg_long")} · ${n(t, "games")} GP`,
      };
    case "punting":
      return {
        label: "Punts inside the 20",
        value: (t) => n(t, "punts_inside_20"),
        detail: (t) => `${n(t, "punts")} punts · ${formatCell(ratio(n(t, "punt_yards"), n(t, "punts")), "d1")} avg · ${n(t, "games")} GP`,
      };
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ shared row shapes */

export interface SeasonSnaps {
  season: number;
  games: number;
  offenseSnaps: number;
  defenseSnaps: number;
  stSnaps: number;
  /** Average share (0–100) of the team's snaps in each unit across games he played in that unit. */
  offensePct: number | null;
  defensePct: number | null;
  stPct: number | null;
}

export type SnapUnit = "offense" | "defense" | "st";

/** The unit a player mostly plays: whichever of offense/defense has more snaps, else special teams. */
export function primaryUnit(s: Pick<SeasonSnaps, "offenseSnaps" | "defenseSnaps" | "stSnaps">): SnapUnit {
  if (s.offenseSnaps === 0 && s.defenseSnaps === 0) return "st";
  return s.offenseSnaps >= s.defenseSnaps ? "offense" : "defense";
}

export interface GameSnaps {
  offense: number | null;
  offensePct: number | null;
  defense: number | null;
  defensePct: number | null;
  st: number | null;
  stPct: number | null;
}

export interface GameLogRow {
  gameId: string;
  season: number;
  week: number;
  /** REG, WC, DIV, CON, or SB. */
  gameType: string;
  date: string;
  opponentId: string | null;
  opponentAbbr: string;
  home: boolean;
  neutral: boolean;
  result: "W" | "L" | "T" | null;
  teamScore: number | null;
  opponentScore: number | null;
  overtime: boolean;
  /** Counting stats for the game (missing keys = 0), or null when he has snaps but no stat line. */
  stats: Totals | null;
  snaps: GameSnaps | null;
}

export const POSTSEASON_LABEL: Record<string, string> = { WC: "Wild Card", DIV: "Divisional", CON: "Conference", SB: "Super Bowl" };

/** Human-readable roster codes from nflverse (see the roster-statuses league topic). */
export const ROSTER_CODE_LABEL: Record<string, string> = {
  ACT: "Active roster",
  RES: "Injured reserve",
  DEV: "Practice squad",
  INA: "Inactive",
  EXE: "Exempt list",
  CUT: "Released",
  RET: "Retired",
  TRC: "Traded",
  TRD: "Traded",
  TRT: "Traded",
  TRL: "Traded",
  SUS: "Suspended",
  PUP: "Physically unable to perform",
  NWT: "Non-football injury",
  RFA: "Free agent",
  UFA: "Free agent",
  RSN: "Reserve",
  RSR: "Reserve",
};
