"use client";

import { useState } from "react";

export interface CareerPoint {
  season: number;
  value: number;
  /** Preformatted secondary line for the hover readout (e.g. "31 TD · 8 INT · 17 GP"). */
  detail: string;
  /** Team abbreviations he played for that season. */
  teams: string;
}

const H = 150; // plot height
const PAD = { top: 16, right: 8, bottom: 26, left: 44 };
const SLOT = 34; // horizontal band per season
const BAR = 20; // bar width (≤ 24px, leaves air in the band)

/** Round the axis up to a 1/2/5 × 10ⁿ step so gridlines land on friendly numbers. */
function niceScale(max: number, intervals = 4) {
  const rough = Math.max(max, 1) / intervals;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const frac = rough / pow;
  const step = (frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10) * pow;
  return { step, top: Math.ceil(Math.max(max, 1) / step) * step };
}

/** Headline stat by season as a bar chart (≤24px bars, 4px rounded data ends, hairline grid, hover/focus readout). */
export function CareerChart({ points, label }: { points: CareerPoint[]; label: string }) {
  const [active, setActive] = useState<CareerPoint | null>(null);
  const { step, top: axisTop } = niceScale(Math.max(...points.map((p) => p.value)));
  const width = PAD.left + points.length * SLOT + PAD.right;
  const y = (value: number) => PAD.top + H * (1 - value / axisTop);
  const ticks = Array.from({ length: Math.round(axisTop / step) + 1 }, (_, i) => i * step);
  const shown = active ?? points[points.length - 1];
  const labelEvery = points.length > 14 ? 2 : 1;
  const best = points.reduce((a, b) => (b.value > a.value ? b : a));

  return (
    <figure className="rounded-2xl border bg-card p-5" data-tour="player-career-chart">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <figcaption>
          <p className="eyebrow text-muted-foreground">Season by season</p>
          <h3 className="text-2xl font-semibold">{label}</h3>
        </figcaption>
        {shown && (
          <p className="text-right text-sm" aria-live="polite">
            <span className="font-display text-xl font-semibold tabular-nums">{shown.season}</span>{" "}
            <span className="tabular-nums">
              {shown.value.toLocaleString("en-US")} {label.toLowerCase()}
            </span>
            <span className="block text-xs text-muted-foreground">
              {shown.teams} · {shown.detail}
            </span>
          </p>
        )}
      </div>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${PAD.top + H + PAD.bottom}`}
          className="h-auto w-full min-w-[360px]"
          style={{ maxWidth: width * 1.5 }}
          role="img"
          aria-label={`Bar chart of ${label.toLowerCase()} by season, ${points[0].season} to ${points.at(-1)!.season}. Best season: ${best.season} with ${best.value.toLocaleString("en-US")}. The table lists every season.`}
          onMouseLeave={() => setActive(null)}
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(tick)} y2={y(tick)} className="stroke-border" strokeWidth={1} />
              <text x={PAD.left - 6} y={y(tick) + 3} textAnchor="end" className="fill-muted-foreground text-[9px] tabular-nums">
                {tick.toLocaleString("en-US")}
              </text>
            </g>
          ))}
          {points.map((point, i) => {
            const x = PAD.left + i * SLOT + (SLOT - BAR) / 2;
            const barTop = y(point.value);
            const height = Math.max(0, y(0) - barTop);
            const r = Math.min(4, height);
            const isActive = active?.season === point.season;
            return (
              <g
                key={point.season}
                tabIndex={0}
                role="button"
                aria-label={`${point.season}: ${point.value.toLocaleString("en-US")} ${label.toLowerCase()}`}
                onMouseEnter={() => setActive(point)}
                onFocus={() => setActive(point)}
                onBlur={() => setActive(null)}
                className="cursor-pointer outline-none [&:focus-visible>path]:stroke-foreground"
              >
                {/* Hit target spans the whole band, taller than the mark. */}
                <rect x={PAD.left + i * SLOT} y={PAD.top} width={SLOT} height={H} className="fill-transparent" />
                {height > 0 && (
                  <path
                    d={`M${x},${y(0)} V${barTop + r} Q${x},${barTop} ${x + r},${barTop} H${x + BAR - r} Q${x + BAR},${barTop} ${x + BAR},${barTop + r} V${y(0)} Z`}
                    className={isActive || point.season === best.season ? "fill-primary" : "fill-primary/65"}
                    strokeWidth={1.5}
                    stroke="transparent"
                  />
                )}
                {(i % labelEvery === 0 || i === points.length - 1) && (
                  <text x={x + BAR / 2} y={y(0) + 16} textAnchor="middle" className="fill-muted-foreground text-[9px] tabular-nums">
                    {point.season}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Regular season only. The brightest bar is his best year.</p>
    </figure>
  );
}
