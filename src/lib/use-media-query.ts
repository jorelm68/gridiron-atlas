"use client";

import { useCallback, useSyncExternalStore } from "react";

function getServerSnapshot(): boolean {
  return false;
}

/**
 * Tracks a media query client-side via `useSyncExternalStore` (subscribing to the query's own `change` event
 * rather than deriving it from a `useEffect` + `setState`, which the React Compiler flags as an avoidable
 * cascading render — see react.dev/learn/you-might-not-need-an-effect).
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onStoreChange);
      return () => list.removeEventListener("change", onStoreChange);
    },
    [query],
  );
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * For imperative animations (Three.js camera moves) that CSS's `@media (prefers-reduced-motion)` override
 * in globals.css can't reach. CSS-driven motion is already covered globally — this is only for JS code paths.
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
