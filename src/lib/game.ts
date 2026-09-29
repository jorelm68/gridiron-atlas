/** Pure helpers for game pages (safe on server and client). */

export type WinProbabilityPoint = [elapsedSeconds: number, homeWinProbability: number];

export interface ScoringPlay {
  qtr: number;
  clock: string;
  team: string;
  type: string;
  description: string;
  away_score: number;
  home_score: number;
}

export const ROUND_LABEL: Record<string, string> = {
  WC: "Wild Card",
  DIV: "Divisional Round",
  CON: "Conference Championship",
  SB: "Super Bowl",
};

export const ROUND_SHORT: Record<string, string> = { WC: "Wild Card", DIV: "Divisional", CON: "Conference", SB: "Super Bowl" };

/** /games URL for a season's week or playoff round. */
export const gamesWeekHref = (season: number, gameType: string, week: number) =>
  `/games?season=${season}&week=${gameType === "REG" ? week : gameType}`;

/** "Week 5", "Wild Card", … */
export function weekLabel(gameType: string, week: number): string {
  return gameType === "REG" ? `Week ${week}` : (ROUND_LABEL[gameType] ?? gameType);
}

const TWO_WORD_LOCATIONS = [
  "New York",
  "New England",
  "New Orleans",
  "San Francisco",
  "San Diego",
  "Los Angeles",
  "Las Vegas",
  "Kansas City",
  "Green Bay",
  "Tampa Bay",
  "St. Louis",
];

/** "Detroit Lions" → "Lions", "New York Giants" → "Giants". */
export function nicknameOf(fullName: string): string {
  const prefix = TWO_WORD_LOCATIONS.find((p) => fullName.startsWith(`${p} `));
  const rest = prefix ? fullName.slice(prefix.length + 1) : fullName.split(" ").slice(1).join(" ");
  return rest || fullName;
}

/** Kickoff time as "1:00 PM ET" from nflverse's Eastern-time "13:00". */
export function formatKickoff(gametime: string | null): string | null {
  const match = gametime?.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  return `${hour % 12 || 12}:${match[2]} ${hour >= 12 ? "PM" : "AM"} ET`;
}

const weekdayDate = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
/** "Sunday, September 7, 2025" from an ISO date. */
export function formatGameDate(isoDate: string): string {
  return weekdayDate.format(new Date(`${isoDate.slice(0, 10)}T00:00:00Z`));
}

const ROOF_LABEL: Record<string, string> = {
  outdoors: "Outdoors",
  dome: "Dome",
  closed: "Roof closed",
  open: "Roof open",
};

const SURFACE_LABEL: Record<string, string> = {
  grass: "Grass",
  dessograss: "DessoGrass",
  fieldturf: "FieldTurf",
  astroturf: "AstroTurf",
  a_turf: "A-Turf",
  astroplay: "AstroPlay",
  matrixturf: "MatrixTurf",
  sportturf: "SportTurf",
};

export const roofLabel = (roof: string | null) => (roof ? (ROOF_LABEL[roof] ?? roof) : null);
export const surfaceLabel = (surface: string | null) => {
  const key = surface?.trim().toLowerCase();
  return key ? (SURFACE_LABEL[key] ?? key) : null;
};

export interface SpreadStory {
  /** Favorite side, or null for a pick'em. */
  favorite: "home" | "away" | null;
  /** Points the favorite was expected to win by (always ≥ 0). */
  points: number;
  /** Once played: did the favorite cover, push, or fail to cover. */
  outcome: "covered" | "push" | "not-covered" | null;
  /** Favorite's actual margin (negative if it lost), once played. */
  favoriteMargin: number | null;
}

/** nflverse `spread_line` is the closing line from the home team's side: positive means the home team was favored. */
export function spreadStory(spreadLine: number, homeScore: number | null, awayScore: number | null): SpreadStory {
  const favorite = spreadLine > 0 ? "home" : spreadLine < 0 ? "away" : null;
  const points = Math.abs(spreadLine);
  if (homeScore === null || awayScore === null) return { favorite, points, outcome: null, favoriteMargin: null };
  if (!favorite) return { favorite, points, outcome: null, favoriteMargin: null };
  const homeMargin = homeScore - awayScore;
  const favoriteMargin = favorite === "away" ? -homeMargin : homeMargin;
  // For a pick'em nobody is favored, so "covering" just means winning.
  const outcome = favoriteMargin > points ? "covered" : favoriteMargin === points ? "push" : "not-covered";
  return { favorite, points, outcome, favoriteMargin };
}

const pointsText = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(1)} ${n === 1 ? "point" : "points"}`;

/** The one-sentence plain-English reading of the line, e.g. "Lions were favored by 3.5 — they won by 7, covering the spread." */
export function spreadSentence(story: SpreadStory, names: { home: string; away: string }): string {
  const { favorite, points, outcome, favoriteMargin } = story;
  if (!favorite) {
    return "The line was a pick'em — oddsmakers saw the teams as evenly matched, so neither was favored.";
  }
  const fav = names[favorite];
  const dog = names[favorite === "home" ? "away" : "home"];
  const base = `${fav} ${outcome === null ? "are" : "were"} favored by ${pointsText(points)}`;
  if (outcome === null || favoriteMargin === null) return `${base} over ${dog}, according to the latest line.`;
  if (favoriteMargin > 0) {
    const won = `they won by ${favoriteMargin}`;
    if (outcome === "covered") return `${base} — ${won}, covering the spread.`;
    if (outcome === "push") return `${base} — ${won}, exactly the spread, so it was a push (neither side covered).`;
    return `${base} — ${won}, but that was less than the spread, so they did not cover.`;
  }
  if (favoriteMargin === 0) return `${base} — the game ended in a tie, so they did not cover.`;
  return `${base} — but ${dog} won outright by ${-favoriteMargin}, the upset.`;
}

/** Seconds elapsed for a scoring play's quarter and clock, on the same axis as the win-probability series. */
export function playElapsed(qtr: number, clock: string, overtimeLength: number): number {
  const [m, s] = clock.split(":").map((n) => Number.parseInt(n, 10) || 0);
  const remaining = m * 60 + s;
  if (qtr <= 4) return (qtr - 1) * 900 + (900 - remaining);
  return 3600 + (qtr - 5) * 900 + (overtimeLength - remaining);
}

/** Overtime is 10 minutes in regular seasons from 2017 on, and 15 otherwise. */
export const overtimeLength = (season: number, gameType: string) => (season >= 2017 && gameType === "REG" ? 600 : 900);

/** "Q3 4:21", "OT 2:10". */
export function clockLabel(qtr: number, clock: string): string {
  const time = clock.replace(/^0/, "");
  return `${qtr <= 4 ? `Q${qtr}` : qtr === 5 ? "OT" : `${qtr - 4}OT`} ${time}`;
}

/** Home win probability at `t` seconds, linearly interpolated along the series. */
export function winProbabilityAt(points: WinProbabilityPoint[], t: number): number {
  if (points.length === 0) return 0.5;
  if (t <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [t1, p1] = points[i];
    if (t <= t1) {
      const [t0, p0] = points[i - 1];
      return t1 === t0 ? p1 : p0 + ((p1 - p0) * (t - t0)) / (t1 - t0);
    }
  }
  return points[points.length - 1][1];
}

const mmss = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, "0")}`;

/** Seconds elapsed → "Q3 4:21" for a point on the chart's x-axis; `overtime` is the first overtime period's length. */
export function elapsedLabel(elapsed: number, overtime: number): string {
  if (elapsed <= 0) return "Kickoff";
  if (elapsed <= 3600) {
    const qtr = Math.max(1, Math.ceil(elapsed / 900));
    return clockLabel(qtr, mmss(qtr * 900 - elapsed));
  }
  const inOvertime = elapsed - 3600;
  if (inOvertime <= overtime) return clockLabel(5, mmss(overtime - inOvertime));
  const extra = Math.ceil((inOvertime - overtime) / 900);
  return clockLabel(5 + extra, mmss(extra * 900 + overtime - inOvertime));
}

function parseHex(hex: string | null): [number, number, number] | null {
  const m = hex?.match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = Number.parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance([r, g, b]: [number, number, number]): number {
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

const toHex = (rgb: number[]) => `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;

/** A team color that stays visible on a dark card: very dark primaries fall back to the secondary, or get lightened. */
function legible(primary: string | null, secondary: string | null, fallback: string): string {
  const p = parseHex(primary);
  if (!p) return fallback;
  if (luminance(p) >= 0.05) return toHex(p);
  const s = parseHex(secondary);
  if (s && luminance(s) >= 0.12) return toHex(s);
  return toHex(p.map((c) => c + (255 - c) * 0.5));
}

/**
 * Picks readable, distinguishable colors for the two sides of a game: each team's primary color (lightened or swapped
 * for the secondary when it is nearly black), unless the two clash, in which case the away team uses its secondary.
 */
export function pairColors(
  home: { primary: string | null; secondary: string | null },
  away: { primary: string | null; secondary: string | null },
): { home: string; away: string } {
  const h = legible(home.primary, home.secondary, "#3b82f6");
  let a = legible(away.primary, away.secondary, "#ef4444");
  const rgbH = parseHex(h)!;
  const dist = (hex: string) => {
    const c = parseHex(hex)!;
    return Math.hypot(rgbH[0] - c[0], rgbH[1] - c[1], rgbH[2] - c[2]);
  };
  if (dist(a) < 90) {
    const alt = legible(away.secondary, away.primary, "#ef4444");
    a = dist(alt) >= 90 ? alt : dist(a) < 60 ? "#94a3b8" : a;
  }
  return { home: h, away: a };
}
