"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface WeekChip {
  key: string;
  label: string;
  hasResults: boolean;
}

/** Season dropdown plus week / playoff-round chips for the scoreboard. Chips are plain links, so they work without JS. */
export function GamesPicker({
  season,
  seasons,
  weeks,
  activeWeek,
}: {
  season: number;
  seasons: number[];
  weeks: WeekChip[];
  activeWeek: string;
}) {
  const router = useRouter();
  const regular = weeks.filter((w) => /^\d+$/.test(w.key));
  const playoffs = weeks.filter((w) => !/^\d+$/.test(w.key));
  const href = (key: string) => `/games?season=${season}&week=${key}`;

  const chip = (w: WeekChip) => (
    <li key={w.key}>
      <Link
        href={href(w.key)}
        scroll={false}
        aria-current={w.key === activeWeek ? "page" : undefined}
        className={cn(
          "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border px-2.5 text-sm font-medium whitespace-nowrap tabular-nums transition-colors",
          w.key === activeWeek ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent",
          !w.hasResults && w.key !== activeWeek && "text-muted-foreground",
        )}
      >
        {/^\d+$/.test(w.key) ? w.key : w.label}
      </Link>
    </li>
  );

  return (
    <div className="space-y-3" data-tour="games-week-picker">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="eyebrow">Season</span>
          <select
            value={season}
            onChange={(e) => router.push(`/games?season=${e.target.value}`)}
            className="h-9 rounded-lg border bg-card px-3 font-display text-lg font-semibold text-foreground tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            {seasons.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>
      <nav
        aria-label={`${season} weeks`}
        className="flex items-center gap-x-3 gap-y-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible"
      >
        <span className="eyebrow shrink-0 text-muted-foreground">Week</span>
        <ul className="flex gap-1.5 sm:flex-wrap">{regular.map(chip)}</ul>
        {playoffs.length > 0 && (
          <>
            <span className="h-6 w-px shrink-0 bg-border" aria-hidden="true" />
            <span className="eyebrow shrink-0 text-muted-foreground">Playoffs</span>
            <ul className="flex gap-1.5 sm:flex-wrap">{playoffs.map(chip)}</ul>
          </>
        )}
      </nav>
    </div>
  );
}
