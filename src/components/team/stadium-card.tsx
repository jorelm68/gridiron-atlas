import Image from "next/image";
import Link from "next/link";
import type { Venue } from "@/lib/data/team";

const ROOF_LABEL: Record<string, string> = { dome: "Dome", retractable: "Retractable roof", "open-air": "Open air" };
const SURFACE_LABEL: Record<string, string> = {
  grass: "Natural grass",
  fieldturf: "FieldTurf (artificial)",
  a_turf: "A-Turf (artificial)",
  sportturf: "SportTurf (artificial)",
  matrixturf: "Matrix Turf (artificial)",
  astroturf: "AstroTurf (artificial)",
  astroplay: "AstroPlay (artificial)",
  dessograss: "Hybrid grass",
};

/** Home stadium: photo (Wikimedia Commons, credited), key facts, and a short summary. */
export function StadiumCard({ venue, since }: { venue: Venue; since: number | null }) {
  const facts = [
    venue.capacity && { label: "Capacity", value: venue.capacity.toLocaleString() },
    venue.opened_year && { label: "Opened", value: String(venue.opened_year) },
    venue.roof && { label: "Roof", value: ROOF_LABEL[venue.roof] ?? venue.roof },
    venue.surface && { label: "Surface", value: SURFACE_LABEL[venue.surface] ?? venue.surface },
    since && { label: "Home since", value: String(since) },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <article className="overflow-hidden rounded-2xl border bg-card" data-tour="team-stadium">
      {venue.image_thumb_url && (
        <figure className="relative aspect-[16/9] bg-muted">
          <Image src={venue.image_thumb_url} alt={venue.name} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover" />
          {venue.image_credit && (
            <figcaption className="absolute right-2 bottom-2 max-w-[80%] truncate rounded bg-black/60 px-2 py-0.5 text-[10px] text-white">
              Photo:{" "}
              {venue.image_source_url ? (
                <a href={venue.image_source_url} target="_blank" rel="noreferrer" className="underline">
                  {venue.image_credit}
                </a>
              ) : (
                venue.image_credit
              )}
              {venue.image_license ? ` · ${venue.image_license}` : ""}
            </figcaption>
          )}
        </figure>
      )}
      <div className="space-y-4 p-5">
        <div>
          <p className="eyebrow text-muted-foreground">Home stadium</p>
          <h3 className="text-2xl font-semibold">{venue.name}</h3>
          <p className="text-sm text-muted-foreground">
            {[venue.city, venue.region].filter(Boolean).join(", ")}
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt className="text-xs text-muted-foreground">{fact.label}</dt>
              <dd className="font-medium">{fact.value}</dd>
            </div>
          ))}
        </dl>
        {venue.summary && <p className="text-sm leading-relaxed text-muted-foreground">{venue.summary}</p>}
        <Link href="/" className="inline-block text-sm font-medium text-primary underline-offset-4 hover:underline">
          See it on the Atlas →
        </Link>
      </div>
    </article>
  );
}
