import { ArrowLeftRightIcon, CircleDotIcon, GraduationCapIcon } from "lucide-react";
import Link from "next/link";
import { Explainer } from "@/components/learn/explainer";
import { TeamLogo } from "@/components/team/team-logo";
import type { Stint } from "@/lib/data/player";
import { formatLongDate, formatSeasonSpan } from "@/lib/format";
import { teamHref } from "@/lib/routes";

const ENTRY_ICON = { draft: GraduationCapIcon, trade: ArrowLeftRightIcon, joined: CircleDotIcon } as const;

/** Horizontal timeline of the clubs a player belonged to, each tinted with its team color and showing how he got there. */
export function CareerPath({ stints, playerName }: { stints: Stint[]; playerName: string }) {
  if (!stints.length) return null;
  const seasons = stints.reduce((sum, s) => sum + s.seasons, 0);
  const clubs = new Set(stints.map((s) => s.key.replace(/-\d+$/, ""))).size;

  return (
    <section aria-labelledby="career-path" data-tour="player-career-path">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 id="career-path" className="text-3xl font-semibold">
          Career path
        </h2>
        <p className="text-sm text-muted-foreground">
          {clubs} team{clubs === 1 ? "" : "s"} · {seasons} roster season{seasons === 1 ? "" : "s"} · team names as they were at the time
        </p>
      </div>

      <ol className="flex snap-x gap-3 overflow-x-auto pb-3" aria-label={`${playerName}'s teams in order`}>
        {stints.map((stint, i) => {
          const Icon = ENTRY_ICON[stint.entry.kind];
          const color = stint.color ?? "var(--muted-foreground)";
          return (
            <li
              key={stint.key}
              className="relative min-w-52 snap-start"
              style={{ flex: `${Math.max(stint.seasons, 2)} 1 0%`, "--stint": color } as React.CSSProperties}
            >
              <div className="flex h-full flex-col overflow-hidden rounded-2xl border bg-[color-mix(in_oklch,var(--stint)_14%,var(--card))]">
                <div className="h-1.5 bg-(--stint)" aria-hidden="true" />
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div className="flex items-center gap-3">
                    {stint.franchiseId ? (
                      <TeamLogo name={stint.name} abbr={stint.franchiseId} logoUrl={stint.logoUrl} color={stint.color} size={40} />
                    ) : (
                      <span
                        aria-hidden="true"
                        className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-muted font-display text-xs font-bold text-muted-foreground"
                      >
                        {stint.abbr}
                      </span>
                    )}
                    <div className="min-w-0">
                      {stint.franchiseId ? (
                        <Link href={teamHref(stint.franchiseId)} className="block truncate font-display text-xl leading-tight font-semibold hover:underline">
                          {stint.name}
                        </Link>
                      ) : (
                        <span className="block truncate font-display text-xl leading-tight font-semibold" title={stint.name}>
                          {stint.name}
                        </span>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {stint.defunct ? "Defunct club" : stint.currentName ? `Now the ${stint.currentName}` : " "}
                      </p>
                    </div>
                  </div>
                  <p className="font-display text-2xl leading-none font-semibold tabular-nums">
                    {formatSeasonSpan(stint.startSeason, stint.endSeason)}
                    <span className="ml-2 text-sm font-medium text-muted-foreground">
                      {stint.seasons} season{stint.seasons === 1 ? "" : "s"}
                    </span>
                  </p>
                  <p className="mt-auto flex items-start gap-2 text-sm">
                    <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span>
                      {stint.entry.text}
                      {stint.entry.note && (
                        <span className="block text-xs text-muted-foreground">
                          {/^\d{4}-\d{2}-\d{2}$/.test(stint.entry.note) ? formatLongDate(stint.entry.note) : stint.entry.note}
                        </span>
                      )}
                    </span>
                  </p>
                </div>
              </div>
              {i < stints.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute top-1/2 -right-2.5 z-10 hidden size-2.5 -translate-y-1/2 rotate-45 border-t border-r bg-background sm:block"
                />
              )}
            </li>
          );
        })}
      </ol>

      <Explainer title="Reading a career path" className="mt-3">
        <p>
          Each card is a run of consecutive seasons with one team. <strong>Drafted</strong> and <strong>Traded</strong> come
          from league records; <strong>Joined</strong> is inferred from a change in roster data, so it may be a free-agent
          signing, a waiver claim, or a move we can&apos;t see. Clubs that folded before today&apos;s 32 teams are marked
          &ldquo;Defunct&rdquo;.
        </p>
      </Explainer>
    </section>
  );
}
