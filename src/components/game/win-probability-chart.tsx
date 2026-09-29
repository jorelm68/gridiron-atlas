"use client";

import { useId, useMemo, useState } from "react";
import { clockLabel, elapsedLabel, playElapsed, winProbabilityAt, type ScoringPlay, type WinProbabilityPoint } from "@/lib/game";
import { cn } from "@/lib/utils";

interface ChartTeam {
  abbr: string;
  nickname: string;
  color: string;
}

interface WinProbabilityChartProps {
  points: WinProbabilityPoint[];
  scoringPlays: ScoringPlay[];
  home: ChartTeam;
  away: ChartTeam;
  /** Length in seconds of the first overtime period for this game (10 or 15 minutes). */
  overtime: number;
  finalHome: number;
  finalAway: number;
}

const W = 760;
const H = 300;
const PAD = { top: 14, right: 14, bottom: 30, left: 42 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;
const MID = PAD.top + PLOT_H / 2;

/** Tint used for lines and fills: the team color nudged toward the foreground so dark colors stay visible on dark cards. */
const tint = (c: string, amount = 90) => `color-mix(in oklch, ${c} ${amount}%, var(--foreground))`;

interface Event {
  play: ScoringPlay;
  elapsed: number;
  /** PAT/2PT that followed this touchdown, if any. */
  conversion: ScoringPlay | null;
  homeScore: number;
  awayScore: number;
}

/** Win probability for the home team across the game: home color above the 50% line, away color below. */
export function WinProbabilityChart({ points, scoringPlays, home, away, overtime, finalHome, finalAway }: WinProbabilityChartProps) {
  const uid = useId().replace(/:/g, "");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const maxT = Math.max(3600, points[points.length - 1]?.[0] ?? 3600);
  const x = (t: number) => PAD.left + (t / maxT) * PLOT_W;
  const y = (p: number) => PAD.top + PLOT_H * (1 - p);

  const events = useMemo<Event[]>(() => {
    const out: Event[] = [];
    for (const play of scoringPlays) {
      const elapsed = playElapsed(play.qtr, play.clock, overtime);
      const previous = out[out.length - 1];
      if (
        (play.type === "PAT" || play.type === "2PT") &&
        previous &&
        previous.play.type === "TD" &&
        previous.play.team === play.team &&
        !previous.conversion
      ) {
        previous.conversion = play;
        previous.homeScore = play.home_score;
        previous.awayScore = play.away_score;
        continue;
      }
      out.push({ play, elapsed, conversion: null, homeScore: play.home_score, awayScore: play.away_score });
    }
    return out;
  }, [scoringPlays, overtime]);

  const linePath = points.map(([t, p], i) => `${i === 0 ? "M" : "L"}${x(t).toFixed(1)},${y(p).toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${x(points[points.length - 1][0]).toFixed(1)},${MID} L${x(points[0][0]).toFixed(1)},${MID} Z`;

  const active = hoverIndex === null ? null : points[hoverIndex];
  const activeT = active?.[0] ?? null;
  const lastScore = useMemo(() => {
    if (activeT === null) return null;
    let found: Event | null = null;
    for (const event of events) if (event.elapsed <= activeT) found = event;
    return found;
  }, [events, activeT]);

  const winner = finalHome > finalAway ? "home" : finalAway > finalHome ? "away" : null;
  const lowPoint = useMemo(() => {
    if (!winner) return null;
    let worst = points[0];
    for (const point of points) {
      const chance = winner === "home" ? point[1] : 1 - point[1];
      const worstChance = winner === "home" ? worst[1] : 1 - worst[1];
      if (chance < worstChance) worst = point;
    }
    return { t: worst[0], chance: winner === "home" ? worst[1] : 1 - worst[1] };
  }, [points, winner]);

  const quarters = [0, 1, 2, 3].map((q) => ({ label: `Q${q + 1}`, start: q * 900, end: (q + 1) * 900 }));
  if (maxT > 3600) quarters.push({ label: "OT", start: 3600, end: maxT });

  const moveTo = (clientX: number, rect: DOMRect) => {
    const t = ((((clientX - rect.left) / rect.width) * W - PAD.left) / PLOT_W) * maxT;
    let lo = 0;
    let hi = points.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (points[mid][0] < t) lo = mid + 1;
      else hi = mid;
    }
    const prev = Math.max(0, lo - 1);
    setHoverIndex(Math.abs(points[prev][0] - t) <= Math.abs(points[lo][0] - t) ? prev : lo);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    const step = event.shiftKey ? 10 : 1;
    if (event.key === "ArrowRight") setHoverIndex((i) => Math.min(points.length - 1, (i ?? -1) + step));
    else if (event.key === "ArrowLeft") setHoverIndex((i) => Math.max(0, (i ?? points.length) - step));
    else if (event.key === "Home") setHoverIndex(0);
    else if (event.key === "End") setHoverIndex(points.length - 1);
    else if (event.key === "Escape") setHoverIndex(null);
    else return;
    event.preventDefault();
  };

  const shownHome = active ? active[1] : null;
  const pct = (p: number) => `${Math.round(p * 100)}%`;
  const keyMoments = useMemo(() => {
    const rows = [
      { label: "Kickoff", home: winProbabilityAt(points, 0), score: "0–0" },
      ...events.map((e) => ({
        label: `${clockLabel(e.play.qtr, e.play.clock)} — ${e.play.team} ${e.play.type}${e.conversion ? ` + ${e.conversion.type}` : ""}`,
        home: winProbabilityAt(points, e.elapsed + 1),
        score: `${e.awayScore}–${e.homeScore}`,
      })),
      { label: "Final", home: winProbabilityAt(points, maxT), score: `${finalAway}–${finalHome}` },
    ];
    return rows;
  }, [points, events, maxT, finalAway, finalHome]);

  return (
    <figure className="rounded-2xl border bg-card p-5" style={{ "--home": home.color, "--away": away.color } as React.CSSProperties}>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <figcaption>
          <p className="eyebrow text-muted-foreground">How the game swung</p>
          <h3 className="text-2xl font-semibold">Win probability</h3>
        </figcaption>
        <p className="min-h-[2.75rem] text-right text-sm" aria-live="polite">
          {active && shownHome !== null ? (
            <>
              <span className="font-display text-xl font-semibold tabular-nums">{elapsedLabel(active[0], overtime)}</span>
              <span className="ml-3 tabular-nums">
                <span style={{ color: tint(home.color) }} className="font-semibold">
                  {home.abbr} {pct(shownHome)}
                </span>
                <span className="mx-1.5 text-muted-foreground">·</span>
                <span style={{ color: tint(away.color) }} className="font-semibold">
                  {away.abbr} {pct(1 - shownHome)}
                </span>
              </span>
              <span className="block text-xs text-muted-foreground tabular-nums">
                {lastScore
                  ? `${away.abbr} ${lastScore.awayScore}, ${home.abbr} ${lastScore.homeScore} · last score: ${lastScore.play.team} ${lastScore.play.type}`
                  : `${away.abbr} 0, ${home.abbr} 0`}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">
              Hover, or focus the chart and use the arrow keys, to read any moment.
              <span className="block text-xs">
                Above the line: {home.nickname} favored · below: {away.nickname}.
              </span>
            </span>
          )}
        </p>
      </div>

      <div
        tabIndex={0}
        role="group"
        aria-label={`Win probability chart. ${home.nickname} win probability from kickoff to the final whistle. Use the left and right arrow keys to move through the game; a table of key moments follows.`}
        onKeyDown={onKeyDown}
        onBlur={() => setHoverIndex(null)}
        className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="h-auto w-full touch-pan-y select-none"
          onPointerMove={(e) => moveTo(e.clientX, e.currentTarget.getBoundingClientRect())}
          onPointerLeave={() => setHoverIndex(null)}
          aria-hidden="true"
        >
          <defs>
            <clipPath id={`${uid}-top`}>
              <rect x={0} y={0} width={W} height={MID} />
            </clipPath>
            <clipPath id={`${uid}-bottom`}>
              <rect x={0} y={MID} width={W} height={H - MID} />
            </clipPath>
          </defs>

          {/* Quarter bands */}
          {quarters.map((q, i) => (
            <g key={q.label}>
              {i > 0 && (
                <line
                  x1={x(q.start)}
                  x2={x(q.start)}
                  y1={PAD.top}
                  y2={PAD.top + PLOT_H}
                  className={q.start === 1800 ? "stroke-muted-foreground/40" : "stroke-border"}
                  strokeWidth={1}
                  strokeDasharray={q.start === 1800 ? undefined : "2 4"}
                />
              )}
              <text
                x={(x(q.start) + x(q.end)) / 2}
                y={H - 10}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px] font-medium"
              >
                {q.label}
              </text>
            </g>
          ))}

          {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
            <g key={tick}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(tick)}
                y2={y(tick)}
                className={tick === 0.5 ? "stroke-muted-foreground/60" : "stroke-border"}
                strokeWidth={1}
              />
              <text x={PAD.left - 6} y={y(tick) + 3} textAnchor="end" className="fill-muted-foreground text-[9px] tabular-nums">
                {tick === 0.5 ? "50%" : `${Math.round(Math.abs(tick - 0.5) * 200)}%`}
              </text>
            </g>
          ))}

          <text x={PAD.left + 6} y={PAD.top + 13} style={{ fill: tint("var(--home)") }} className="text-[11px] font-bold">
            {home.abbr}
          </text>
          <text x={PAD.left + 6} y={PAD.top + PLOT_H - 6} style={{ fill: tint("var(--away)") }} className="text-[11px] font-bold">
            {away.abbr}
          </text>

          {/* Home half */}
          <g clipPath={`url(#${uid}-top)`}>
            <path d={areaPath} style={{ fill: `color-mix(in oklch, ${tint("var(--home)")} 34%, transparent)` }} />
            <path d={linePath} fill="none" strokeWidth={2} strokeLinejoin="round" style={{ stroke: tint("var(--home)", 100) }} />
          </g>
          {/* Away half */}
          <g clipPath={`url(#${uid}-bottom)`}>
            <path d={areaPath} style={{ fill: `color-mix(in oklch, ${tint("var(--away)")} 34%, transparent)` }} />
            <path d={linePath} fill="none" strokeWidth={2} strokeLinejoin="round" style={{ stroke: tint("var(--away)", 100) }} />
          </g>

          {/* Scoring markers */}
          {events.map((event, i) => {
            const isHome = event.play.team === home.abbr;
            return (
              <circle
                key={`${event.elapsed}-${i}`}
                cx={x(event.elapsed)}
                cy={y(winProbabilityAt(points, event.elapsed + 1))}
                r={event.play.type === "TD" ? 4.5 : 3.5}
                className="stroke-card"
                strokeWidth={2}
                style={{ fill: tint(isHome ? "var(--home)" : "var(--away)", 100) }}
              />
            );
          })}

          {active && (
            <g>
              <line
                x1={x(active[0])}
                x2={x(active[0])}
                y1={PAD.top}
                y2={PAD.top + PLOT_H}
                className="stroke-foreground/50"
                strokeWidth={1}
              />
              <circle cx={x(active[0])} cy={y(active[1])} r={4} className="fill-foreground stroke-card" strokeWidth={2} />
            </g>
          )}
        </svg>
      </div>

      <p className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ background: tint("var(--home)", 100) }} /> {home.nickname} score
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-full" style={{ background: tint("var(--away)", 100) }} /> {away.nickname} score
        </span>
        {lowPoint && lowPoint.chance < 0.4 && (
          <span>
            Low point for the winner: {winner === "home" ? home.nickname : away.nickname} had just {pct(lowPoint.chance)} at{" "}
            {elapsedLabel(lowPoint.t, overtime)}.
          </span>
        )}
      </p>

      <details className="group mt-3 text-sm">
        <summary className="w-fit cursor-pointer rounded-md py-1 font-medium text-primary underline-offset-4 outline-none group-open:mb-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring/60">
          Table view of key moments
        </summary>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{home.nickname} win probability at kickoff, after each score, and at the end</caption>
            <thead className="text-xs text-muted-foreground">
              <tr>
                <th className="py-1 pr-3 font-medium">Moment</th>
                <th className="px-3 py-1 text-right font-medium">
                  {away.abbr}–{home.abbr}
                </th>
                <th className="px-3 py-1 text-right font-medium">{home.abbr} win chance</th>
                <th className="py-1 pl-3 text-right font-medium">{away.abbr} win chance</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {keyMoments.map((row, i) => (
                <tr key={i} className={cn(i === keyMoments.length - 1 && "font-semibold")}>
                  <td className="py-1.5 pr-3">{row.label}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{row.score}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">{pct(row.home)}</td>
                  <td className="py-1.5 pl-3 text-right tabular-nums">{pct(1 - row.home)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
