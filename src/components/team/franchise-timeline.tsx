import type { FranchiseEra } from "@/lib/data/team";

/** Every name and home city the franchise has had, oldest first. */
export function FranchiseTimeline({ eras, notes }: { eras: FranchiseEra[]; notes: string[] }) {
  return (
    <article className="rounded-2xl border bg-card p-5" data-tour="team-timeline">
      <p className="eyebrow text-muted-foreground">Franchise history</p>
      <h3 className="mb-4 text-2xl font-semibold">
        {eras.length > 1 ? `${eras.length} names & homes` : "One name, one home"}
      </h3>
      <ol className="relative space-y-4 border-l border-border pl-5">
        {eras.map((era, index) => {
          const current = era.end_season === null;
          const moved = index > 0 && eras[index - 1].city !== era.city;
          return (
            <li key={era.start_season} className="relative">
              <span
                className={`absolute top-1.5 -left-[1.6rem] size-2.5 rounded-full ring-4 ring-card ${current ? "bg-team" : "bg-muted-foreground/60"}`}
                aria-hidden="true"
              />
              <p className="font-display text-sm font-semibold text-muted-foreground tabular-nums">
                {era.start_season}–{era.end_season ?? "today"}
                {moved && <span className="ml-2 rounded bg-accent px-1.5 py-0.5 text-[10px] tracking-wide uppercase">Relocated</span>}
              </p>
              <p className="font-medium">{era.name}</p>
              <p className="text-sm text-muted-foreground">
                {era.city}
                {era.state ? `, ${era.state}` : ""}
                {era.note ? ` — ${era.note}` : ""}
              </p>
            </li>
          );
        })}
      </ol>
      {notes.length > 0 && (
        <ul className="mt-4 space-y-1 border-t pt-4 text-sm text-muted-foreground">
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      )}
    </article>
  );
}
