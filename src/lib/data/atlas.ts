import "server-only";
import { cache } from "react";
import { geoAlbersUsa } from "d3-geo";
import { getDataFreshness } from "@/lib/data/freshness";
import { getFranchises, getTeamSeasons, type ConferenceId } from "@/lib/data/teams";
import { createServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import { ALBERS_USA_SCALE, ALBERS_USA_TRANSLATE, MILES_PER_DEGREE_LAT } from "@/lib/atlas/constants";

type VenueRow = Tables<"venues">;

// Matches us-atlas's states-albers-10m.json projection exactly (see lib/atlas/constants.ts).
const projection = geoAlbersUsa().scale(ALBERS_USA_SCALE).translate(ALBERS_USA_TRANSLATE);

function projectLatLng(lat: number, lng: number): [number, number] | null {
  return projection([lng, lat]);
}

/** Great-circle-ish radius, in projected pixel units, of the league's 75-mile home-territory circle. */
function homeTerritoryRadius(lat: number, lng: number): number | null {
  const center = projectLatLng(lat, lng);
  const north = projectLatLng(lat + 75 / MILES_PER_DEGREE_LAT, lng);
  if (!center || !north) return null;
  return Math.hypot(north[0] - center[0], north[1] - center[1]);
}

export interface AtlasVenue {
  id: string;
  name: string;
  city: string | null;
  region: string | null;
  lat: number;
  lng: number;
  capacity: number | null;
  roof: string | null;
  surface: string | null;
  imageThumbUrl: string | null;
  imageCredit: string | null;
  /** Projected pixel position, in `states-albers-10m.json` space (see lib/atlas/constants.ts). */
  x: number;
  y: number;
  /** Radius of the league's 75-mile home-territory circle, in the same projected pixel units. */
  homeTerritoryRadius: number | null;
}

export interface AtlasTeam {
  id: string;
  name: string;
  nickname: string;
  location: string;
  conference: ConferenceId;
  /** e.g. "AFC North" — matches divisions.id and lib/atlas/constants.ts's DIVISION_ORDER. */
  division: string;
  divisionName: string;
  color: string | null;
  colorSecondary: string | null;
  logoUrl: string | null;
  venue: AtlasVenue | null;
  /** Small projected-unit offset applied when a venue is shared (SoFi, MetLife) so markers don't overlap. */
  markerOffset: [number, number];
  record: { wins: number; losses: number; ties: number } | null;
}

/**
 * One entry per franchise with its current home venue (the tenancy with the greatest `end_season`) and
 * latest-season record, projected into the Atlas map's coordinate space. `venue` is null until the sync
 * pipeline fills `venues`/`venue_tenancies` — the Atlas should render the rest of the page regardless.
 */
export const getAtlasTeams = cache(async (): Promise<AtlasTeam[]> => {
  const db = createServerClient();
  const [franchises, freshness] = await Promise.all([getFranchises(), getDataFreshness()]);
  const seasons = freshness.currentSeason ? await getTeamSeasons(freshness.currentSeason) : new Map();

  const { data: tenancies, error } = await db
    .from("venue_tenancies")
    .select("franchise_id, end_season, venues(*)")
    .order("end_season", { ascending: false });
  if (error) throw new Error(`Loading venue tenancies failed: ${error.message}`);

  // Rows are ordered by end_season desc, so the first row seen per franchise is its current tenancy.
  const currentVenueByFranchise = new Map<string, VenueRow>();
  for (const row of tenancies) {
    if (row.venues && !currentVenueByFranchise.has(row.franchise_id)) {
      currentVenueByFranchise.set(row.franchise_id, row.venues);
    }
  }

  const franchiseIdsByVenue = new Map<string, string[]>();
  for (const [franchiseId, venue] of currentVenueByFranchise) {
    franchiseIdsByVenue.set(venue.id, [...(franchiseIdsByVenue.get(venue.id) ?? []), franchiseId]);
  }

  return franchises.map((franchise): AtlasTeam => {
    const record = seasons.get(franchise.id);
    const venueRow = currentVenueByFranchise.get(franchise.id) ?? null;

    let venue: AtlasVenue | null = null;
    let markerOffset: [number, number] = [0, 0];
    if (venueRow && venueRow.lat != null && venueRow.lng != null) {
      const [x, y] = projectLatLng(venueRow.lat, venueRow.lng) ?? [0, 0];
      venue = {
        id: venueRow.id,
        name: venueRow.name,
        city: venueRow.city,
        region: venueRow.region,
        lat: venueRow.lat,
        lng: venueRow.lng,
        capacity: venueRow.capacity,
        roof: venueRow.roof,
        surface: venueRow.surface,
        imageThumbUrl: venueRow.image_thumb_url,
        imageCredit: venueRow.image_credit,
        x,
        y,
        homeTerritoryRadius: homeTerritoryRadius(venueRow.lat, venueRow.lng),
      };
      const sharing = franchiseIdsByVenue.get(venueRow.id) ?? [];
      if (sharing.length > 1) {
        const angle = (sharing.indexOf(franchise.id) / sharing.length) * Math.PI * 2;
        const OFFSET_PX = 7;
        markerOffset = [Math.cos(angle) * OFFSET_PX, Math.sin(angle) * OFFSET_PX];
      }
    }

    return {
      id: franchise.id,
      name: franchise.name,
      nickname: franchise.nickname,
      location: franchise.location,
      conference: franchise.conference_id,
      division: franchise.division_id,
      divisionName: franchise.division_name,
      color: franchise.color_primary,
      colorSecondary: franchise.color_secondary,
      logoUrl: franchise.logo_url,
      venue,
      markerOffset,
      record: record ? { wins: record.wins, losses: record.losses, ties: record.ties } : null,
    };
  });
});
