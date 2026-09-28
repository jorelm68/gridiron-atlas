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
