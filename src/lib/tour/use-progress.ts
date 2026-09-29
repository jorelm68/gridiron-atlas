"use client";

import { useSyncExternalStore } from "react";
import { getProgress, getServerProgress, subscribeProgress, type TourProgress } from "./progress";

/** Tour progress from localStorage. `ready` is false until the browser state has been read (and during SSR). */
export function useTourProgress(): TourProgress {
  return useSyncExternalStore(subscribeProgress, getProgress, getServerProgress);
}
