/** "11–6" or "10–6–1" (en dashes, ties only when present). */
export function formatRecord(wins: number, losses: number, ties = 0): string {
  return ties ? `${wins}–${losses}–${ties}` : `${wins}–${losses}`;
}

export function ordinal(n: number): string {
  const suffix = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${suffix[(v - 20) % 10] ?? suffix[v] ?? suffix[0]}`;
}
