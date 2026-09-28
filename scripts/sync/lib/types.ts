import type { Db } from "./db";
import type { Duck } from "./duck";

export interface SyncContext {
  runId: number;
  db: Db;
  duck: Duck;
  /** Latest NFL season in the schedule (the season in progress, or the upcoming one). */
  currentSeason: number;
  /** Seasons that seasonal datasets should refresh this run. */
  seasons: number[];
  /** Full rebuild: seasonal datasets cover all history and prune globally. */
  full: boolean;
  /** Re-download cached source files. */
  refresh: boolean;
  /** Rows written per table this run (stored on sync_runs.row_counts). */
  counts: Record<string, number>;
  log: (message: string) => void;
}

export interface Dataset {
  id: string;
  description: string;
  /** Datasets that must run first (added automatically when this one is requested). */
  dependsOn: string[];
  run(ctx: SyncContext): Promise<void>;
}
