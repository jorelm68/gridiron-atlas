import Image from "next/image";
import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TeamLogo } from "@/components/team/team-logo";
import { formatRecord } from "@/lib/format";
import { teamHref } from "@/lib/routes";
import { cn } from "@/lib/utils";
import type { AtlasTeam } from "@/lib/data/atlas";

// Roof values come from the venue sync (dome / retractable / open-air); turf values are nflverse slugs.
const ROOF_LABEL: Record<string, string> = { dome: "Dome", retractable: "Retractable roof", "open-air": "Open air" };
const SURFACE_LABEL: Record<string, string> = {
  grass: "Natural grass",
  fieldturf: "FieldTurf",
  a_turf: "A-Turf",
  sportturf: "SportTurf",
  matrixturf: "Matrix Turf",
  astroturf: "AstroTurf",
  astroplay: "AstroPlay",
  dessograss: "Hybrid grass",
};

function formatSurface(surface: string): string {
  const key = surface.trim().toLowerCase();
  return SURFACE_LABEL[key] ?? key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ");
}

/** Side-panel (desktop) / bottom-sheet (mobile) contents for the team the Atlas has selected. */
export function TeamPanel({
  team,
  season,
  latestWeek,
  sharedWith,
}: {
  team: AtlasTeam;
  season: number | null;
  latestWeek: number | null;
  /** Nicknames of the other franchise(s) that call the same stadium home (SoFi, MetLife). */
  sharedWith: string[];
}) {
  const venue = team.venue;
  return (
    <div className="flex min-h-0 flex-col gap-4 overflow-y-auto px-4 pt-5 pb-6">
      <div className="flex items-center gap-3 pr-10">
        <TeamLogo name={team.name} abbr={team.id} logoUrl={team.logoUrl} color={team.color} size={48} priority />
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{team.location}</p>
          <p className="truncate font-display text-2xl leading-tight font-bold">{team.nickname}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline" className={cn(team.conference === "AFC" ? "text-afc" : "text-nfc")}>
          {team.conference} {team.divisionName}
        </Badge>
      </div>

      {team.record && (
        <div className="rounded-xl border bg-muted/40 p-3">
          <p className="eyebrow text-muted-foreground">
            {season ? `${season} record${latestWeek ? ` · through week ${latestWeek}` : ""}` : "Current record"}
          </p>
          <p className="font-display text-3xl font-bold tabular-nums">
            {formatRecord(team.record.wins, team.record.losses, team.record.ties)}
          </p>
        </div>
      )}

      {venue ? (
        <div className="space-y-3 max-sm:order-2">
          {venue.imageThumbUrl && (
            <figure className="overflow-hidden rounded-xl border">
              <Image
                src={venue.imageThumbUrl}
                alt={venue.name}
                width={480}
                height={270}
                sizes="(min-width: 640px) 352px, 90vw"
                className="aspect-video max-h-44 w-full object-cover sm:max-h-none"
              />
              {venue.imageCredit && (
                <figcaption className="bg-muted/60 px-2 py-1 text-[11px] text-muted-foreground">
                  Photo: {venue.imageCredit}
                </figcaption>
              )}
            </figure>
          )}
          <div>
            <p className="font-medium text-foreground">{venue.name}</p>
            <p className="text-sm text-muted-foreground">{[venue.city, venue.region].filter(Boolean).join(", ")}</p>
            {sharedWith.length > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Shared with the {sharedWith.join(" and the ")}.
              </p>
            )}
          </div>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            {venue.capacity && (
              <div>
                <dt className="text-xs text-muted-foreground">Capacity</dt>
                <dd className="font-medium tabular-nums">{venue.capacity.toLocaleString("en-US")}</dd>
              </div>
            )}
            {venue.roof && (
              <div>
                <dt className="text-xs text-muted-foreground">Roof</dt>
                <dd className="font-medium">{ROOF_LABEL[venue.roof] ?? venue.roof}</dd>
              </div>
            )}
            {venue.surface && (
              <div>
                <dt className="text-xs text-muted-foreground">Surface</dt>
                <dd className="font-medium">{formatSurface(venue.surface)}</dd>
              </div>
            )}
          </dl>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground max-sm:order-2">Stadium details aren&apos;t synced yet.</p>
      )}

      <Button asChild className="mt-auto self-start max-sm:order-1">
        <Link href={teamHref(team.id)}>
          Open team page <ArrowRightIcon />
        </Link>
      </Button>
    </div>
  );
}
