"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LeagueExplorer, type ExplorerTeam } from "@/components/league/league-explorer";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import {
  AtlasToolbar,
  DivisionLegend,
  LayerCaption,
  type ConferenceFilter,
  type Layer,
} from "@/components/atlas/atlas-toolbar";
import { MapSkeleton } from "@/components/atlas/map-skeleton";
import { MarkerOverlay, type MarkerElements } from "@/components/atlas/marker-overlay";
import { TeamPanel } from "@/components/atlas/team-panel";
import { useMapTheme } from "@/lib/atlas/colors";
import { buildMarkers } from "@/lib/atlas/markers";
import { useMediaQuery, usePrefersReducedMotion } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";
import type { ColorMode } from "@/lib/atlas/constants";
import type { AtlasTeam } from "@/lib/data/atlas";

const AtlasScene = dynamic(() => import("@/components/atlas/atlas-scene"), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

/** Width of the desktop side panel (Sheet's `sm:max-w-sm`), used to keep the focused marker out from under it. */
const PANEL_WIDTH_PX = 384;

function toExplorerTeam(team: AtlasTeam): ExplorerTeam {
  return {
    id: team.id,
    name: team.name,
    location: team.location,
    nickname: team.nickname,
    conference: team.conference,
    division: team.division,
    divisionName: team.divisionName,
    color: team.color,
    logoUrl: team.logoUrl,
    record: team.record,
    divRank: null,
  };
}

export function AtlasExperience({
  teams,
  currentSeason,
  latestWeek,
}: {
  teams: AtlasTeam[];
  currentSeason: number | null;
  latestWeek: number | null;
}) {
  const theme = useMapTheme();
  const isDesktop = useMediaQuery("(min-width: 640px)");
  const reducedMotion = usePrefersReducedMotion();

  const [colorMode, setColorMode] = useState<ColorMode>("team");
  const [layers, setLayers] = useState<Layer[]>([]);
  const [conferenceFilter, setConferenceFilter] = useState<ConferenceFilter>("ALL");
  const [listView, setListView] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [hoveredTeamId, setHoveredTeamId] = useState<string | null>(null);
  const [inset, setInset] = useState({ right: 0, bottom: 0 });

  const frameRef = useRef<HTMLDivElement>(null);
  const markerElements = useRef<MarkerElements>(new Map());
  const lastSelectedId = useRef<string | null>(null);

  const markers = useMemo(
    () => buildMarkers(teams, colorMode, theme, conferenceFilter),
    [teams, colorMode, theme, conferenceFilter],
  );
  // Tab order for the marker buttons: by conference and division, so it matches the list view.
  const orderedMarkers = useMemo(
    () =>
      [...markers].sort(
        (a, b) =>
          a.team.division.localeCompare(b.team.division) || a.team.name.localeCompare(b.team.name),
      ),
    [markers],
  );

  const selectedTeam = useMemo(() => teams.find((t) => t.id === selectedTeamId) ?? null, [teams, selectedTeamId]);
  const sharedWith = useMemo(() => {
    const venueId = selectedTeam?.venue?.id;
    if (!venueId) return [];
    return teams.filter((t) => t.id !== selectedTeam?.id && t.venue?.id === venueId).map((t) => t.nickname);
  }, [teams, selectedTeam]);

  /** Opens a team's panel and points the camera at it (never toggles it closed). */
  const openTeam = useCallback(
    (id: string) => {
      lastSelectedId.current = id;
      // How much of the frame the panel will cover, so the camera can centre the team in what's left.
      const frame = frameRef.current?.getBoundingClientRect();
      if (frame && isDesktop) {
        setInset({ right: Math.max(0, PANEL_WIDTH_PX - (window.innerWidth - frame.right)), bottom: 0 });
      } else if (frame) {
        setInset({ right: 0, bottom: Math.min(frame.height * 0.6, window.innerHeight * 0.5) });
      }
      setSelectedTeamId(id);
    },
    [isDesktop],
  );

  const selectTeam = useCallback(
    (id: string) => {
      if (selectedTeamId === id) setSelectedTeamId(null);
      else openTeam(id);
    },
    [selectedTeamId, openTeam],
  );

  // The guided tour drives the map through a window event (see src/lib/tour/actions.ts): { teamId } opens that
  // team's panel, { teamId: null } closes it. Map view only, so the list view is switched off first.
  useEffect(() => {
    const onFocus = (event: Event) => {
      const teamId = (event as CustomEvent<{ teamId: string | null }>).detail?.teamId ?? null;
      if (teamId === null) return setSelectedTeamId(null);
      if (!teams.some((t) => t.id === teamId)) return;
      setListView(false);
      openTeam(teamId);
    };
    window.addEventListener("atlas:focus", onFocus);
    return () => window.removeEventListener("atlas:focus", onFocus);
  }, [teams, openTeam]);

  // On phones the bottom sheet covers half the screen, so bring the map to the top of the viewport. This runs after
  // the render that adds the scroll spacer below, otherwise the page is too short to scroll that far.
  useEffect(() => {
    if (selectedTeamId && !isDesktop) {
      frameRef.current?.scrollIntoView({ block: "start", behavior: reducedMotion ? "auto" : "smooth" });
    }
  }, [selectedTeamId, isDesktop, reducedMotion]);

  return (
    <div className="mt-6 flex flex-col gap-3">
      <div
        ref={frameRef}
        data-tour="atlas-map"
        className={cn(
          "relative isolate flex w-full scroll-mt-20 flex-col overflow-hidden rounded-3xl border bg-muted/20",
          listView ? "min-h-[420px]" : "h-[27rem] sm:h-[min(75vh,52rem)] sm:min-h-[420px]",
        )}
      >
        <AtlasToolbar
          colorMode={colorMode}
          onColorModeChange={setColorMode}
          layers={layers}
          onLayersChange={setLayers}
          conferenceFilter={conferenceFilter}
          onConferenceFilterChange={setConferenceFilter}
          listView={listView}
          onListViewChange={(next) => {
            setListView(next);
            setHoveredTeamId(null);
            if (next) setSelectedTeamId(null);
          }}
        />

        {listView ? (
          <div className="flex-1 p-4 pt-2 sm:p-6 sm:pt-20" aria-label="All 32 NFL teams by division" role="region">
            <LeagueExplorer teams={teams.map(toExplorerTeam)} season={currentSeason} />
          </div>
        ) : (
          <div className="relative min-h-0 flex-1">
            <div className={cn("absolute inset-0", hoveredTeamId && "cursor-pointer")}>
              <AtlasScene
                markers={markers}
                markerElements={markerElements}
                showHomeTerritory={layers.includes("home-territory")}
                showVoronoi={layers.includes("voronoi")}
                selectedTeamId={selectedTeamId}
                hoveredTeamId={hoveredTeamId}
                inset={inset}
                onHoverTeam={setHoveredTeamId}
                onSelectTeam={selectTeam}
              />
            </div>
            <MarkerOverlay
              markers={orderedMarkers}
              elements={markerElements}
              hoveredId={hoveredTeamId}
              selectedId={selectedTeamId}
              onHover={setHoveredTeamId}
              onSelect={selectTeam}
            />
            <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 flex flex-col-reverse gap-2 sm:inset-x-4 sm:bottom-4 sm:flex-row sm:items-end sm:justify-between">
              <LayerCaption layers={layers} />
              {colorMode === "division" && <DivisionLegend theme={theme} />}
            </div>
          </div>
        )}
      </div>

      {/* Room to scroll the map above the bottom sheet on phones, where the sheet would otherwise cover the page's end. */}
      {!isDesktop && selectedTeam && <div aria-hidden="true" className="h-[52vh]" />}

      <Sheet
        modal={false}
        open={selectedTeam != null}
        onOpenChange={(open) => {
          if (!open) setSelectedTeamId(null);
        }}
      >
        <SheetContent
          side={isDesktop ? "right" : "bottom"}
          data-tour="atlas-panel"
          className={cn(!isDesktop && "max-h-[52vh]")}
          // Non-modal: the map stays live behind the panel, so clicking another team swaps the panel instead of
          // closing it. Esc and the close button still dismiss it.
          onInteractOutside={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => {
            // Hand focus back to the marker that opened the panel, so keyboard users land where they were.
            const id = lastSelectedId.current;
            const button = id ? markerElements.current.get(id)?.querySelector("button") : null;
            if (button) {
              event.preventDefault();
              button.focus({ preventScroll: true });
            }
          }}
        >
          {selectedTeam && (
            <>
              <SheetHeader className="sr-only">
                <SheetTitle>{selectedTeam.name}</SheetTitle>
                <SheetDescription>Team, stadium, and record details for {selectedTeam.name}.</SheetDescription>
              </SheetHeader>
              <TeamPanel team={selectedTeam} season={currentSeason} latestWeek={latestWeek} sharedWith={sharedWith} />
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
