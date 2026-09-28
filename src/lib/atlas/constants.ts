/**
 * Shared geometry constants for the Atlas 3D map. Isomorphic (no `server-only` / DOM APIs) so both
 * `src/lib/data/atlas.ts` (server) and the client map components can agree on the same coordinate space.
 *
 * `us-atlas`'s `states-albers-10m.json` ships pre-projected with a 975×610 viewBox. `ALBERS_USA_SCALE`/
 * `ALBERS_USA_TRANSLATE` are the `d3.geoAlbersUsa()` parameters that reproduce that exact projection, so a
 * lat/lng projected with them lands in the same pixel space as the state shapes.
 */
export const ALBERS_USA_SCALE = 1300;
export const ALBERS_USA_TRANSLATE: [number, number] = [487.5, 305];
export const MAP_WIDTH = 975;
export const MAP_HEIGHT = 610;

/** Projected pixels → Three.js world units. Keeps the map roughly 78×49 units across. */
export const MAP_SCALE = 0.08;

/** Rough miles-per-degree of latitude, used to size the 75-mile "home territory" discs. */
export const MILES_PER_DEGREE_LAT = 69.0;

/** Converts a projected point (in `states-albers-10m.json` pixel space) to Three.js [x, z] world units. */
export function projectedToWorld(x: number, y: number): [number, number] {
  return [(x - MAP_WIDTH / 2) * MAP_SCALE, (y - MAP_HEIGHT / 2) * MAP_SCALE];
}

export type ColorMode = "team" | "conference" | "division";

/** Stable draw order for the 8 active divisions, paired with the `--div-N` tokens defined in globals.css. */
export const DIVISION_ORDER = [
  "AFC East",
  "AFC North",
  "AFC South",
  "AFC West",
  "NFC East",
  "NFC North",
  "NFC South",
  "NFC West",
] as const;

export const DIVISION_COLOR_VARS: Record<string, string> = Object.fromEntries(
  DIVISION_ORDER.map((division, index) => [division, `--div-${index + 1}`]),
);
