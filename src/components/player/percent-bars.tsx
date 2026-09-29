"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface BarDatum {
  key: string;
  /** X-axis label (a season or a week). */
  label: string;
  /** 0–100, or null when there is nothing to plot. */
  value: number | null;
  /** Readout headline, e.g. "Week 5 · @ MIN". */
  title: string;
  /** Readout detail, e.g. "62 of 66 offensive snaps · 94%". */
  detail: string;
}

const H = 110; // plot height
const PAD = { top: 12, right: 8, bottom: 24, left: 34 };
const BAR = 20; // ≤ 24px

/**
 * A 0–100% bar chart with the shared chart conventions (≤24px bars, 4px rounded data ends, hairline grid,
 * hover/focus readout) plus a table view. Bars can be selectable (used to pick the season for the game log).
 */
export function PercentBars({
  data,
  ariaLabel,
  caption,
  selectedKey,
  onSelect,
  slot = 34,
  labelEvery = 1,
}: {
  data: BarDatum[];
  ariaLabel: string;
  caption: string;
  selectedKey?: string;
  onSelect?: (key: string) => void;
  slot?: number;
  labelEvery?: number;
}) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const width = PAD.left + data.length * slot + PAD.right;
  const y = (pct: number) => PAD.top + H * (1 - pct / 100);
  const shown = data.find((d) => d.key === (activeKey ?? selectedKey)) ?? data[data.length - 1];

  return (
    <figure>
      <figcaption className="mb-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="eyebrow text-muted-foreground">{caption}</span>
        {shown && (
          <span className="text-right text-sm" aria-live="polite">
            <span className="font-display text-lg font-semibold">{shown.title}</span>
            <span className="ml-2 text-xs text-muted-foreground">{shown.detail}</span>
          </span>
        )}
      </figcaption>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${PAD.top + H + PAD.bottom}`}
          className="h-auto w-full min-w-[360px]"
          style={{ maxWidth: width * 1.5 }}
          role="img"
          aria-label={`${ariaLabel} The table below lists every value.`}
          onMouseLeave={() => setActiveKey(null)}
        >
          {[0, 50, 100].map((tick) => (
            <g key={tick}>
              <line x1={PAD.left} x2={width - PAD.right} y1={y(tick)} y2={y(tick)} className="stroke-border" strokeWidth={1} />
              <text x={PAD.left - 6} y={y(tick) + 3} textAnchor="end" className="fill-muted-foreground text-[9px] tabular-nums">
                {tick}%
              </text>
            </g>
          ))}
          {data.map((d, i) => {
            const x = PAD.left + i * slot + (slot - BAR) / 2;
            const isSelected = d.key === selectedKey;
            const isActive = d.key === activeKey;
            const height = d.value === null ? 0 : Math.max(0, y(0) - y(d.value));
            const r = Math.min(4, height);
            const barTop = y(d.value ?? 0);
            return (
              <g
                key={d.key}
                tabIndex={0}
                role={onSelect ? "button" : "img"}
                aria-label={`${d.title}: ${d.detail}`}
                aria-pressed={onSelect ? isSelected : undefined}
                onMouseEnter={() => setActiveKey(d.key)}
                onFocus={() => setActiveKey(d.key)}
                onBlur={() => setActiveKey(null)}
                onClick={onSelect ? () => onSelect(d.key) : undefined}
                onKeyDown={
                  onSelect
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onSelect(d.key);
                        }
                      }
                    : undefined
                }
                className={cn("outline-none [&:focus-visible>path]:stroke-foreground", onSelect && "cursor-pointer")}
              >
                <rect x={PAD.left + i * slot} y={PAD.top} width={slot} height={H} className="fill-transparent" />
                {height > 0 && (
                  <path
                    d={`M${x},${y(0)} V${barTop + r} Q${x},${barTop} ${x + r},${barTop} H${x + BAR - r} Q${x + BAR},${barTop} ${x + BAR},${barTop + r} V${y(0)} Z`}
                    className={isSelected || isActive ? "fill-primary" : "fill-primary/60"}
                    strokeWidth={1.5}
                    stroke="transparent"
                  />
                )}
                {(i % labelEvery === 0 || i === data.length - 1) && (
                  <text
                    x={x + BAR / 2}
                    y={y(0) + 15}
                    textAnchor="middle"
                    className={cn("text-[9px] tabular-nums", isSelected ? "fill-foreground font-semibold" : "fill-muted-foreground")}
                  >
                    {d.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <details className="mt-2 text-xs text-muted-foreground">
        <summary className="w-fit cursor-pointer rounded underline-offset-4 hover:text-foreground hover:underline">View as table</summary>
        <div className="mt-2 max-h-56 overflow-auto rounded-lg border">
          <table className="w-full text-left">
            <caption className="sr-only">{caption}</caption>
            <tbody className="divide-y">
              {data.map((d) => (
                <tr key={d.key}>
                  <th scope="row" className="px-3 py-1.5 font-medium whitespace-nowrap text-foreground">
                    {d.title}
                  </th>
                  <td className="px-3 py-1.5">{d.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
