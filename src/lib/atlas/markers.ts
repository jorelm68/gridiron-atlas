import { teamColor, type MapTheme } from "@/lib/atlas/colors";
import { projectedToWorld, type ColorMode } from "@/lib/atlas/constants";
import type { AtlasTeam } from "@/lib/data/atlas";

export type ConferenceFilter = "ALL" | "AFC" | "NFC";

/** One team's marker, resolved for the active color mode / filter. Shared by the 3D beams and the DOM labels. */
export interface AtlasMarker {
  team: AtlasTeam;
  /** [x, z] world units — the marker's ground position; y = 0 is the map surface. */
  position: [number, number];
  color: string;
  dimmed: boolean;
  /**
   * Horizontal screen-space nudge (−1…1) for the logo button when a stadium is shared (SoFi, MetLife). The beams
   * sit a few pixels apart on the map; the 36px logos need more room than that to stay individually clickable.
   */
  labelShift: number;
}

/** One marker per current home venue; teams whose venue hasn't synced yet are skipped. */
export function buildMarkers(
  teams: AtlasTeam[],
  colorMode: ColorMode,
  theme: MapTheme,
  conferenceFilter: ConferenceFilter,
): AtlasMarker[] {
  const markers: AtlasMarker[] = [];
  for (const team of teams) {
    if (!team.venue) continue;
    const [x, z] = projectedToWorld(team.venue.x + team.markerOffset[0], team.venue.y + team.markerOffset[1]);
    const [dx, dy] = team.markerOffset;
    const magnitude = Math.hypot(dx, dy);
    markers.push({
      team,
      position: [x, z],
      color: teamColor(team, colorMode, theme),
      dimmed: conferenceFilter !== "ALL" && team.conference !== conferenceFilter,
      labelShift: magnitude > 0 ? dx / magnitude : 0,
    });
  }
  return markers;
}
