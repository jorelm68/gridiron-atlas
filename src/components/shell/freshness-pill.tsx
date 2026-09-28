import Link from "next/link";
import { getDataFreshness } from "@/lib/data/freshness";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const syncedFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

/** "2026 · Week 3" — how current the data is, with the last sync time on hover. */
export async function FreshnessPill() {
  const { lastSyncedAt, currentSeason, latestWeek } = await getDataFreshness();
  if (!lastSyncedAt || !currentSeason) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href="/data"
          data-tour="freshness"
          className="hidden items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
        >
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-win/60 motion-reduce:hidden" />
            <span className="relative inline-flex size-1.5 rounded-full bg-win" />
          </span>
          <span className="tabular-nums">
            {currentSeason} · Week {latestWeek}
          </span>
        </Link>
      </TooltipTrigger>
      <TooltipContent>Data synced {syncedFormat.format(new Date(lastSyncedAt))} — click for sources & updates</TooltipContent>
    </Tooltip>
  );
}
