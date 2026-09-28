"use client";

import { useState } from "react";
import { formatRecord, ordinal } from "@/lib/format";
import { PLAYOFF_LABEL } from "@/lib/playoffs";

export interface SeasonPoint {
  season: number;
  wins: number;
  losses: number;
  ties: number;
  divRank: number | null;
  playoffResult: string | null;
  coach: string | null;
  inProgress: boolean;
}

const H = 180; // plot height
const PAD = { top: 22, right: 8, bottom: 26, left: 34 };
const SLOT = 26; // horizontal band per season
const BAR = 16; // bar width (≤ 24px, leaves air in the band)

/** Win percentage by season (comparable across 16- and 17-game eras) with playoff markers and a hover card. */
export function SeasonChart({ points }: { points: SeasonPoint[] }) {
  const [active, setActive] = useState<SeasonPoint | null>(null);
  const width = PAD.left + points.length * SLOT + PAD.right;
  const y = (pct: number) => PAD.top + H * (1 - pct);
  const pct = (p: SeasonPoint) => (p.wins + p.ties / 2) / Math.max(1, p.wins + p.losses + p.ties);
  const shown = active ?? points[points.length - 1];

  return (
    <figure className="rounded-2xl border bg-card p-5" data-tour="team-season-chart">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <figcaption>
          <p className="eyebrow text-muted-foreground">Season by season</p>
          <h3 className="text-2xl font-semibold">Win percentage since {points[0]?.season}</h3>
        </figcaption>
        {shown && (
          <p className="text-right text-sm" aria-live="polite">
            <span className="font-display text-xl font-semibold tabular-nums">{shown.season}</span>{" "}
            <span className="tabular-nums">{formatRecord(shown.wins, shown.losses, shown.ties)}</span>
            <span className="block text-xs text-muted-foreground">
              {[
                shown.divRank && `${ordinal(shown.divRank)} in division`,
                shown.playoffResult ? PLAYOFF_LABEL[shown.playoffResult] : shown.inProgress ? "Season in progress" : "Missed playoffs",
                shown.coach,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </p>
        )}
      </div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${PAD.top + H + PAD.bottom}`}
          className="h-auto w-full min-w-[640px]"
          role="img"
          aria-label="Bar chart of regular-season win percentage by season; the table below lists every season."
          onMouseLeave={() => setActive(null)}
        >
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={width - PAD.right}
                y1={y(tick)}
                y2={y(tick)}
                className={tick === 0.5 ? "stroke-muted-foreground/50" : "stroke-border"}
                strokeWidth={1}
              />
              <text x={PAD.left - 6} y={y(tick) + 3} textAnchor="end" className="fill-muted-foreground text-[9px]">
                {tick === 0.5 ? ".500" : `${tick * 100}%`}
              </text>
            </g>
          ))}
          {points.map((point, i) => {
            const x = PAD.left + i * SLOT + (SLOT - BAR) / 2;
            const top = y(pct(point));
            const height = Math.max(0, y(0) - top);
            const r = Math.min(4, height);
            const isActive = active?.season === point.season;
            return (
              <g
                key={point.season}
                tabIndex={0}
                role="button"
                aria-label={`${point.season}: ${formatRecord(point.wins, point.losses, point.ties)}`}
                onMouseEnter={() => setActive(point)}
                onFocus={() => setActive(point)}
                onBlur={() => setActive(null)}
                className="cursor-pointer outline-none"
              >
                {/* Hit target spans the whole band, taller than the mark. */}
                <rect x={PAD.left + i * SLOT} y={PAD.top} width={SLOT} height={H} className="fill-transparent" />
                <path
                  d={`M${x},${y(0)} V${top + r} Q${x},${top} ${x + r},${top} H${x + BAR - r} Q${x + BAR},${top} ${x + BAR},${top + r} V${y(0)} Z`}
                  className={isActive ? "fill-primary" : "fill-primary/70"}
                />
                {point.playoffResult && (
                  <circle
                    cx={x + BAR / 2}
                    cy={top - 9}
                    r={point.playoffResult === "won_sb" ? 5 : 4}
                    className={point.playoffResult === "won_sb" ? "fill-chart-3 stroke-card" : "fill-foreground/70 stroke-card"}
                    strokeWidth={2}
                  />
                )}
                {(i % 5 === 0 || i === points.length - 1) && (
                  <text x={x + BAR / 2} y={y(0) + 16} textAnchor="middle" className="fill-muted-foreground text-[9px] tabular-nums">
                    {point.season}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <p className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-foreground/70" /> Made the playoffs
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-chart-3" /> Won the Super Bowl
        </span>
        <span>The .500 line splits winning and losing seasons.</span>
      </p>
    </figure>
  );
}
