import { TrendingUpIcon } from "lucide-react";
import Link from "next/link";
import type { StatFormat } from "@/content/stats";
import { formatStatValue, ordinal } from "@/lib/format";
import { teamHref } from "@/lib/routes";

export interface WorkedExampleData {
  season: number;
  seasonType: "REG" | "POST";
  /** Player display name, or the franchise's full name for a team-level stat. */
  name: string;
  franchiseId: string | null;
  isLeagueLeaderFallback: boolean;
  steps: string[];
  value: number;
  format?: StatFormat;
  percentile: { percentile: number; qualifiedCount: number } | null;
  /** What the percentile pool is made of, for the "among N qualified ___" line. */
  poolLabel: "players" | "teams";
}

/** Renders a stat's compute() steps against a real player or team season — see src/lib/data/learn.ts. */
export function WorkedExample({ data }: { data: WorkedExampleData }) {
  return (
    <div className="rounded-2xl border bg-card/60 p-5" data-tour="stat-example">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow text-primary">
            Worked example · {data.season} {data.seasonType === "POST" ? "postseason" : "regular season"}
          </p>
          <p className="font-display text-xl font-semibold">
            {data.name}
            {data.franchiseId && (
              <Link
                href={teamHref(data.franchiseId)}
                className="ml-1.5 text-sm font-normal text-muted-foreground hover:text-primary hover:underline"
              >
                ({data.franchiseId})
              </Link>
            )}
          </p>
          {data.isLeagueLeaderFallback && (
            <p className="mt-0.5 max-w-sm text-xs text-muted-foreground">
              No Detroit Lion fit this one — showing that season&apos;s league leader instead.
            </p>
          )}
        </div>
        <p className="font-display text-3xl font-bold tabular-nums text-primary">{formatStatValue(data.value, data.format)}</p>
      </div>
      <ol className="space-y-1.5 border-t border-border pt-3 font-mono text-xs leading-relaxed text-muted-foreground">
        {data.steps.map((step, i) => (
          // Steps are an ordered, static list from one compute() call — index keys are safe here.
          <li key={i}>{step}</li>
        ))}
      </ol>
      {data.percentile && (
        <p className="mt-3 flex items-start gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
          <TrendingUpIcon className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
          <span>
            That ranks in the <strong className="text-foreground">{ordinal(data.percentile.percentile)} percentile</strong> among{" "}
            {data.percentile.qualifiedCount} qualified {data.poolLabel} that season.
          </span>
        </p>
      )}
    </div>
  );
}
