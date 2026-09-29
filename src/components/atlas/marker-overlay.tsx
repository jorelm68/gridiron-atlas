"use client";

import { useEffect, useRef, type RefObject } from "react";
import { TeamLogo } from "@/components/team/team-logo";
import type { AtlasMarker } from "@/lib/atlas/markers";
import { cn } from "@/lib/utils";

/** Team id → the positioned wrapper element the scene's projector moves each frame. */
export type MarkerElements = Map<string, HTMLElement>;

/**
 * The logo buttons that top each beam. They're ordinary DOM (not drei's `<Html>`, which mounts a nested React
 * root per marker and escapes any stacking context) so they layer correctly under the toolbar and side panel,
 * tab in a sensible order, and stay focusable. `MarkerProjector` (inside the Canvas) writes each wrapper's
 * screen position; until it has, the wrapper stays hidden so nothing flashes at the top-left corner.
 */
export function MarkerOverlay({
  markers,
  elements,
  hoveredId,
  selectedId,
  onHover,
  onSelect,
}: {
  markers: AtlasMarker[];
  elements: RefObject<MarkerElements>;
  hoveredId: string | null;
  selectedId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <ul
      className="pointer-events-none absolute inset-0 z-[1] m-0 list-none overflow-hidden p-0"
      aria-label="NFL teams on the map"
    >
      {markers.map((marker) => (
        <MarkerLabel
          key={marker.team.id}
          marker={marker}
          elements={elements}
          hovered={hoveredId === marker.team.id}
          selected={selectedId === marker.team.id}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}
    </ul>
  );
}

function MarkerLabel({
  marker,
  elements,
  hovered,
  selected,
  onHover,
  onSelect,
}: {
  marker: AtlasMarker;
  elements: RefObject<MarkerElements>;
  hovered: boolean;
  selected: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  const { team, color, dimmed } = marker;
  const wrapperRef = useRef<HTMLLIElement>(null);
  const emphasized = hovered || selected;

  useEffect(() => {
    const registry = elements.current;
    const el = wrapperRef.current;
    if (!el) return;
    registry.set(team.id, el);
    return () => {
      registry.delete(team.id);
    };
  }, [elements, team.id]);

  return (
    <li
      ref={wrapperRef}
      className="group absolute top-0 left-0 will-change-transform"
      style={{ visibility: "hidden" }}
      data-emphasized={emphasized ? "true" : undefined}
    >
      <button
        type="button"
        aria-label={`${team.name}${team.venue ? `, ${team.venue.name}` : ""}`}
        aria-pressed={selected}
        onPointerEnter={() => onHover(team.id)}
        onPointerLeave={() => onHover(null)}
        onFocus={() => onHover(team.id)}
        onBlur={() => onHover(null)}
        onClick={() => onSelect(team.id)}
        data-tour={team.id === "DET" ? "atlas-marker-det" : undefined}
        className={cn(
          "pointer-events-auto relative flex size-7 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-2 bg-card shadow-md transition-[scale,opacity,box-shadow] duration-150 ease-out-expo outline-none focus-visible:ring-3 focus-visible:ring-ring/60 sm:size-9",
          emphasized && "scale-125 shadow-lg",
        )}
        style={{ borderColor: color, opacity: dimmed && !emphasized ? 0.3 : 1 }}
      >
        <TeamLogo
          name={team.name}
          abbr={team.id}
          logoUrl={team.logoUrl}
          color={team.color}
          size={20}
          loading="eager"
          className="max-sm:size-[18px]!"
        />
        {hovered && (
          <span
            role="tooltip"
            className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max max-w-52 -translate-x-1/2 rounded-md bg-foreground px-2.5 py-1.5 text-center text-background shadow-lg group-data-[flip=true]:top-full group-data-[flip=true]:bottom-auto group-data-[flip=true]:mt-2 group-data-[flip=true]:mb-0"
          >
            <span className="block text-xs font-semibold">{team.name}</span>
            {team.venue && (
              <span className="block text-[11px] opacity-80">
                {team.venue.name}
                {team.venue.city ? ` · ${team.venue.city}` : ""}
              </span>
            )}
          </span>
        )}
      </button>
    </li>
  );
}
