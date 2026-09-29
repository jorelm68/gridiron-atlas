import type { Metadata } from "next";
import { UpdatePanel } from "@/components/data/update-panel";
import { Explainer } from "@/components/learn/explainer";
import { Badge } from "@/components/ui/badge";
import { getDataFreshness } from "@/lib/data/freshness";
import { getDataSources, getDatasetCounts, getRecentSyncRuns, type SyncRun } from "@/lib/data/sync";
import { cn } from "@/lib/utils";

export const revalidate = 300;
export const metadata: Metadata = { title: "Data & updates" };

const when = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

function duration(run: SyncRun) {
  if (!run.finished_at) return "—";
  const seconds = Math.round((Date.parse(run.finished_at) - Date.parse(run.started_at)) / 1000);
  return seconds < 90 ? `${seconds}s` : `${Math.round(seconds / 60)}m`;
}

const statusStyles: Record<string, string> = {
  succeeded: "bg-win/15 text-win",
  running: "bg-primary/15 text-primary",
  failed: "bg-loss/15 text-loss",
};

export default async function DataPage() {
  const [runs, sources, counts, freshness] = await Promise.all([
    getRecentSyncRuns(),
    getDataSources(),
    getDatasetCounts(),
    getDataFreshness(),
  ]);

  const stats = [
    { label: "Latest week", value: freshness.currentSeason ? `${freshness.currentSeason} · Wk ${freshness.latestWeek}` : "—" },
    { label: "Players", value: counts.players.toLocaleString() },
    { label: "Games", value: counts.games.toLocaleString() },
    { label: "Player stat lines", value: counts.statLines.toLocaleString() },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <header className="mb-8 max-w-3xl">
        <p className="eyebrow mb-3 text-primary">Data & updates</p>
        <h1 className="text-5xl font-bold sm:text-6xl">Where the numbers come from</h1>
        <p className="mt-4 text-muted-foreground">
          Everything here is synced from open sources into the app&apos;s database. Stats refresh when you press
          Update (or automatically every Tuesday morning after Monday Night Football).
        </p>
      </header>

      <dl className="mb-10 grid grid-cols-2 gap-3 lg:grid-cols-4" data-tour="data-stats">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border bg-card/60 p-4">
            <dt className="eyebrow text-muted-foreground">{stat.label}</dt>
            <dd className="mt-1 font-display text-3xl font-semibold tabular-nums">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-10">
          <section aria-labelledby="history" data-tour="data-history">
            <h2 id="history" className="mb-3 text-2xl font-semibold">
              Update history
            </h2>
            <div className="overflow-x-auto rounded-2xl border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    {["Run", "Started", "Trigger", "Scope", "Status", "Took", "Rows written"].map((h) => (
                      <th key={h} scope="col" className="eyebrow px-3 py-2 font-semibold text-muted-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {runs.map((run) => {
                    const rows = Object.values(run.row_counts as Record<string, number>).reduce((a, b) => a + b, 0);
                    return (
                      <tr key={run.id} className="align-top">
                        <td className="px-3 py-2 tabular-nums">#{run.id}</td>
                        <td className="px-3 py-2 whitespace-nowrap">{when.format(new Date(run.started_at))}</td>
                        <td className="px-3 py-2 capitalize">{run.trigger}</td>
                        <td className="px-3 py-2">
                          <span className="block">{run.seasons?.length ? run.seasons.join(", ") : "All seasons"}</span>
                          <span className="block text-xs text-muted-foreground">{run.datasets.join(" · ")}</span>
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant="secondary" className={cn("capitalize", statusStyles[run.status])} title={run.error ?? undefined}>
                            {run.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 tabular-nums">{duration(run)}</td>
                        <td className="px-3 py-2 tabular-nums">{rows.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section aria-labelledby="sources" data-tour="data-sources">
            <h2 id="sources" className="mb-3 text-2xl font-semibold">
              Sources
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {sources.map((source) => (
                <li key={source.id} className="rounded-2xl border bg-card/60 p-4 text-sm">
                  <a href={source.url} target="_blank" rel="noreferrer" className="font-medium underline-offset-4 hover:underline">
                    {source.name}
                  </a>
                  {source.coverage && <p className="mt-1 text-muted-foreground">{source.coverage}</p>}
                  <p className="mt-2 text-xs text-muted-foreground">
                    {source.license && <>License: {source.license} · </>}
                    {source.upstream_updated_at && <>Published {when.format(new Date(source.upstream_updated_at))} · </>}
                    {source.last_synced_at && <>Synced {when.format(new Date(source.last_synced_at))}</>}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="rounded-2xl border bg-card p-5">
            <h2 className="mb-4 text-xl font-semibold">Update now</h2>
            <UpdatePanel latestRunId={runs[0]?.id ?? null} />
          </div>
          <Explainer title="Why a passphrase?" data-tour="data-passphrase">
            <p>
              The app has no accounts, so the Update button asks for the <code>SYNC_SECRET</code> from your settings to
              keep strangers from triggering updates.
            </p>
          </Explainer>
        </aside>
      </div>
    </div>
  );
}
