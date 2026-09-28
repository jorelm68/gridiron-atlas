import type { SyncContext } from "./types";

/** "2024-2026", "2024,2026", or "2026" → sorted season list. */
export function parseSeasons(spec: string): number[] {
  const seasons = new Set<number>();
  for (const part of spec.split(",")) {
    const [start, end = start] = part.split("-").map((s) => Number.parseInt(s.trim(), 10));
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) throw new Error(`Bad --seasons value: ${spec}`);
    for (let season = start; season <= end; season++) seasons.add(season);
  }
  return [...seasons].sort((a, b) => a - b);
}

export const range = (start: number, end: number) => Array.from({ length: end - start + 1 }, (_, i) => start + i);

/** Seasons a seasonal dataset should process: its whole coverage on --full, else the requested seasons it covers. */
export function seasonsFor(ctx: SyncContext, firstAvailable: number): number[] {
  if (ctx.full) return range(firstAvailable, ctx.currentSeason);
  return ctx.seasons.filter((season) => season >= firstAvailable && season <= ctx.currentSeason);
}

/** Prune scope for seasonal tables: nothing (global prune) on --full, else the refreshed seasons. */
export function seasonScope(ctx: SyncContext, seasons: number[]) {
  return ctx.full ? undefined : { column: "season", values: seasons };
}
