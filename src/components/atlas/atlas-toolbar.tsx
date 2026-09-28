"use client";

import { LayersIcon, ListIcon, MapIcon, PaletteIcon } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DIVISION_ORDER, type ColorMode } from "@/lib/atlas/constants";
import type { MapTheme } from "@/lib/atlas/colors";
import type { ConferenceFilter } from "@/lib/atlas/markers";

export type { ConferenceFilter };
export type Layer = "home-territory" | "voronoi";

const COLOR_MODES: { id: ColorMode; label: string }[] = [
  { id: "team", label: "Team colors" },
  { id: "conference", label: "Conference" },
  { id: "division", label: "Division" },
];

const LAYERS: { id: Layer; label: string; explainer: string }[] = [
  {
    id: "home-territory",
    label: "Home territory",
    explainer: "The league's official 75-mile radius around each team's home city.",
  },
  {
    id: "voronoi",
    label: "Nearest stadium",
    explainer: "Every point on the map shaded by whichever stadium is geographically closest to it.",
  },
];

const CONFERENCES: { id: ConferenceFilter; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "AFC", label: "AFC" },
  { id: "NFC", label: "NFC" },
];

interface AtlasToolbarProps {
  colorMode: ColorMode;
  onColorModeChange: (mode: ColorMode) => void;
  layers: Layer[];
  onLayersChange: (layers: Layer[]) => void;
  conferenceFilter: ConferenceFilter;
  onConferenceFilterChange: (filter: ConferenceFilter) => void;
  listView: boolean;
  onListViewChange: (listView: boolean) => void;
}

/** The compact floating control cluster over the Atlas map: color-by, region layers, conference filter, list view. */
export function AtlasToolbar({
  colorMode,
  onColorModeChange,
  layers,
  onLayersChange,
  conferenceFilter,
  onConferenceFilterChange,
  listView,
  onListViewChange,
}: AtlasToolbarProps) {
  return (
    <div className="pointer-events-none z-10 flex flex-wrap items-center gap-2 p-3 sm:absolute sm:inset-x-4 sm:top-4 sm:p-0">
      {!listView && (
        <>
          <div
            className="pointer-events-auto flex items-center gap-1.5 rounded-2xl border bg-card/85 px-2 py-1.5 shadow-lg backdrop-blur-sm max-sm:rounded-none max-sm:border-0 max-sm:bg-transparent max-sm:p-0 max-sm:shadow-none max-sm:backdrop-blur-none"
            data-tour="atlas-color-by"
          >
            <PaletteIcon className="ml-1 size-3.5 text-muted-foreground max-sm:hidden" aria-hidden="true" />
            <ToggleGroup
              type="single"
              size="sm"
              variant="outline"
              value={colorMode}
              onValueChange={(value) => value && onColorModeChange(value as ColorMode)}
              aria-label="Color markers by"
            >
              {COLOR_MODES.map((mode) => (
                <ToggleGroupItem key={mode.id} value={mode.id} aria-label={mode.label}>
                  {mode.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div
            className="pointer-events-auto flex items-center gap-1.5 rounded-2xl border bg-card/85 px-2 py-1.5 shadow-lg backdrop-blur-sm max-sm:rounded-none max-sm:border-0 max-sm:bg-transparent max-sm:p-0 max-sm:shadow-none max-sm:backdrop-blur-none"
            data-tour="atlas-layers"
          >
            <LayersIcon className="ml-1 size-3.5 text-muted-foreground max-sm:hidden" aria-hidden="true" />
            <ToggleGroup
              type="multiple"
              size="sm"
              variant="outline"
              value={layers}
              onValueChange={(value) => onLayersChange(value as Layer[])}
              aria-label="Toggle region layers"
            >
              {LAYERS.map((layer) => (
                <Tooltip key={layer.id}>
                  <TooltipTrigger asChild>
                    <ToggleGroupItem value={layer.id} aria-label={layer.label}>
                      {layer.label}
                    </ToggleGroupItem>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-56 text-pretty">{layer.explainer}</TooltipContent>
                </Tooltip>
              ))}
            </ToggleGroup>
          </div>

          <ToggleGroup
            type="single"
            size="sm"
            variant="outline"
            value={conferenceFilter}
            onValueChange={(value) => value && onConferenceFilterChange(value as ConferenceFilter)}
            aria-label="Filter by conference"
            className="pointer-events-auto rounded-2xl border bg-card/85 px-1 py-1 shadow-lg backdrop-blur-sm max-sm:rounded-none max-sm:border-0 max-sm:bg-transparent max-sm:p-0 max-sm:shadow-none max-sm:backdrop-blur-none"
          >
            {CONFERENCES.map((conf) => (
              <ToggleGroupItem key={conf.id} value={conf.id} aria-label={`Show ${conf.label}`}>
                {conf.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </>
      )}

      <button
        type="button"
        data-tour="atlas-list-toggle"
        aria-pressed={listView}
        onClick={() => onListViewChange(!listView)}
        className="pointer-events-auto ml-auto flex items-center gap-1.5 rounded-2xl border bg-card/85 px-3 py-1.5 text-xs font-medium shadow-lg backdrop-blur-sm transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        {listView ? (
          <>
            <MapIcon className="size-3.5" aria-hidden="true" /> Map view
          </>
        ) : (
          <>
            <ListIcon className="size-3.5" aria-hidden="true" /> List view
          </>
        )}
      </button>
    </div>
  );
}

/** One line per active region layer, so what the shading means is never a mystery (tooltips don't exist on touch). */
export function LayerCaption({ layers }: { layers: Layer[] }) {
  const active = LAYERS.filter((layer) => layers.includes(layer.id));
  if (active.length === 0) return null;
  return (
    <div className="pointer-events-none max-w-md space-y-1 rounded-2xl border bg-card/85 px-3 py-2 text-xs shadow-lg backdrop-blur-sm">
      {active.map((layer) => (
        <p key={layer.id} className="text-muted-foreground">
          <span className="font-medium text-foreground">{layer.label}.</span> {layer.explainer}
        </p>
      ))}
    </div>
  );
}

/** Legend shown when color-by is "division" — the 8 division swatches. */
export function DivisionLegend({ theme }: { theme: MapTheme }) {
  return (
    <div className="pointer-events-none flex flex-wrap gap-x-3 gap-y-1 rounded-2xl border bg-card/85 px-3 py-2 text-xs shadow-lg backdrop-blur-sm">
      {DIVISION_ORDER.map((division) => (
        <span key={division} className="flex items-center gap-1.5 text-muted-foreground">
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: theme.divisions[division] ?? theme.primary }}
            aria-hidden="true"
          />
          {division}
        </span>
      ))}
    </div>
  );
}
