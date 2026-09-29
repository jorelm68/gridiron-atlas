/** "11–6" or "10–6–1" (en dashes, ties only when present). */
export function formatRecord(wins: number, losses: number, ties = 0): string {
  return ties ? `${wins}–${losses}–${ties}` : `${wins}–${losses}`;
}

export function ordinal(n: number): string {
  const suffix = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${suffix[(v - 20) % 10] ?? suffix[v] ?? suffix[0]}`;
}

/** Renders a stat's computed value per its StatFormat (src/content/stats/types.ts). */
export function formatStatValue(value: number, format?: "int" | "pct" | "decimal1" | "decimal2" | "yards"): string {
  switch (format) {
    case "pct":
      return `${value.toFixed(1)}%`;
    case "decimal1":
      return value.toFixed(1);
    case "decimal2":
      return value.toFixed(2);
    case "yards":
      return `${Math.round(value).toLocaleString()} yds`;
    case "int":
    default:
      return Math.round(value).toLocaleString();
  }
}

/** 76 → 6′4″ */
export function formatHeight(inches: number): string {
  return `${Math.floor(inches / 12)}′${inches % 12}″`;
}

/** Whole years between an ISO date (yyyy-mm-dd) and now. */
export function ageFromDate(isoDate: string, now = new Date()): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  let age = now.getUTCFullYear() - y;
  if (now.getUTCMonth() + 1 < m || (now.getUTCMonth() + 1 === m && now.getUTCDate() < d)) age -= 1;
  return age;
}

const longDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
const shortDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

/** "Mar 18, 2021" from an ISO date (rendered in UTC so server and client agree). */
export function formatLongDate(isoDate: string): string {
  return longDate.format(new Date(`${isoDate.slice(0, 10)}T00:00:00Z`));
}

/** "Sep 14" from an ISO date. */
export function formatShortDate(isoDate: string): string {
  return shortDate.format(new Date(`${isoDate.slice(0, 10)}T00:00:00Z`));
}

/** "2016–2026", or just "2021" for a single season. */
export function formatSeasonSpan(first: number, last: number): string {
  return first === last ? String(first) : `${first}–${last}`;
}

/** 53 → "$53M", 113.612 → "$113.6M" (contract figures are stored in millions of dollars). */
export function formatMillions(millions: number): string {
  return Number.isInteger(millions) ? `$${millions}M` : `$${millions.toFixed(1)}M`;
}
