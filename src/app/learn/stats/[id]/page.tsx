import { CircleAlertIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatTerm } from "@/components/learn/stat-term";
import { WorkedExample, type WorkedExampleData } from "@/components/learn/worked-example";
import { ALL_STATS, getRelatedStats, getStatById, STAT_CATEGORIES } from "@/content/stats";
import { getFranchise } from "@/lib/data/teams";
import {
  getStatPercentile,
  getTeamSeasonTotals,
  getTeamStatPercentile,
  getWorkedExamplePlayer,
  LIONS_FRANCHISE_ID,
  WORKED_EXAMPLE_SEASON,
} from "@/lib/data/learn";
import { renderFormula } from "@/lib/katex";
import { leagueTopicHref, statHref } from "@/lib/routes";
import { cn } from "@/lib/utils";

export const revalidate = 3600;

export function generateStaticParams() {
  return ALL_STATS.map((stat) => ({ id: stat.id }));
}

export async function generateMetadata({ params }: PageProps<"/learn/stats/[id]">): Promise<Metadata> {
  const { id } = await params;
  const stat = getStatById(id);
  return { title: stat ? stat.name : "Stat not found" };
}

async function buildWorkedExample(stat: NonNullable<ReturnType<typeof getStatById>>): Promise<WorkedExampleData | null> {
  const subject = stat.workedExampleSubject;
  if (!subject) return null;

  if (subject === "TEAM") {
    if (!stat.computeTeam) return null;
    const totals = await getTeamSeasonTotals(LIONS_FRANCHISE_ID, WORKED_EXAMPLE_SEASON);
    if (!totals) return null;
    const result = stat.computeTeam(totals);
    if (!result) return null;
    const franchise = await getFranchise(LIONS_FRANCHISE_ID);
    const percentile = await getTeamStatPercentile(stat.id, LIONS_FRANCHISE_ID, WORKED_EXAMPLE_SEASON);
    return {
      season: WORKED_EXAMPLE_SEASON,
      seasonType: "REG",
      name: franchise?.name ?? LIONS_FRANCHISE_ID,
      franchiseId: LIONS_FRANCHISE_ID,
      isLeagueLeaderFallback: false,
      steps: result.steps,
      value: result.value,
      format: stat.format,
      percentile,
      poolLabel: "teams",
    };
  }

  if (!stat.compute) return null;
  const example = await getWorkedExamplePlayer(subject, WORKED_EXAMPLE_SEASON);
  if (!example) return null;
  const result = stat.compute(example.totals);
  if (!result) return null;
  const percentile = await getStatPercentile(stat.id, example.totals.playerId, WORKED_EXAMPLE_SEASON);
  return {
    season: WORKED_EXAMPLE_SEASON,
    seasonType: "REG",
    name: example.playerName,
    franchiseId: example.franchiseId,
    isLeagueLeaderFallback: example.isLeagueLeaderFallback,
    steps: result.steps,
    value: result.value,
    format: stat.format,
    percentile,
    poolLabel: "players",
  };
}

export default async function StatPage({ params }: PageProps<"/learn/stats/[id]">) {
  const { id } = await params;
  const stat = getStatById(id);
  if (!stat) notFound();

  const category = STAT_CATEGORIES.find((c) => c.id === stat.category);
  const related = getRelatedStats(stat);
  // The worked example hits the database; degrade gracefully (rest of the page still explains the stat) rather
  // than 500ing the whole page if it's ever slow or unavailable.
  const workedExample = await buildWorkedExample(stat).catch((err: unknown) => {
    console.warn(`buildWorkedExample(${stat.id}) failed:`, err);
    return null;
  });

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <Link href="/learn" className="mb-6 inline-block text-sm text-muted-foreground hover:text-primary hover:underline">
        ← All stats &amp; league topics
      </Link>

      <header className="mb-8" data-tour="stat-header">
        <p className="eyebrow mb-2 text-primary">{category?.label ?? stat.category}</p>
        <h1 className="text-4xl font-bold text-balance sm:text-5xl">
          {stat.name}
          {stat.abbr && <span className="ml-2.5 align-middle text-xl font-normal text-muted-foreground">{stat.abbr}</span>}
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{stat.summary}</p>
        {stat.proprietary && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CircleAlertIcon className="size-3.5" aria-hidden="true" />
            Explained only — this is a proprietary metric, not computed or stored by this app.
          </p>
        )}
      </header>

      <div className="space-y-8">
        {stat.formulaTex && (
          <section data-tour="stat-formula">
            <h2 className="mb-3 font-display text-xl font-semibold">Formula</h2>
            <div className="overflow-x-auto rounded-2xl border bg-card/60 p-5">
              <div
                // formulaTex is our own hand-written content (src/content/stats/*), never user input — see src/lib/katex.ts
                dangerouslySetInnerHTML={{ __html: renderFormula(stat.formulaTex, true) }}
              />
              {stat.variables && stat.variables.length > 0 && (
                <dl className="mt-4 space-y-1.5 border-t border-border pt-4 text-sm">
                  {stat.variables.map((v) => (
                    <div key={v.symbol} className="flex flex-wrap gap-x-2">
                      <dt
                        className="shrink-0 font-mono text-primary"
                        dangerouslySetInnerHTML={{ __html: renderFormula(v.symbol, false) }}
                      />
                      <dd className="text-muted-foreground">— {v.meaning}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </section>
        )}

        {workedExample && (
          <section>
            <h2 className="mb-3 font-display text-xl font-semibold">Worked example</h2>
            <WorkedExample data={workedExample} />
          </section>
        )}

        <section data-tour="stat-how-to-read">
          <h2 className="mb-3 font-display text-xl font-semibold">How to read it</h2>
          <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            {stat.howToRead.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </section>

        {stat.pitfalls && stat.pitfalls.length > 0 && (
          <section>
            <h2 className="mb-3 font-display text-xl font-semibold">Common pitfalls</h2>
            <ul className="space-y-2.5 rounded-2xl border border-destructive/25 bg-destructive/[0.05] p-4 text-sm">
              {stat.pitfalls.map((p) => (
                <li key={p} className="flex gap-2 leading-relaxed text-foreground/90">
                  <CircleAlertIcon className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden="true" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-6 text-xs text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Availability:</span> {stat.availability}
          </p>
          {stat.qualifiedMinimum && <p>Qualified minimum: {stat.qualifiedMinimum} for the worked-example percentile.</p>}
        </section>

        {related.length > 0 && (
          <section>
            <h2 className="mb-3 font-display text-xl font-semibold">Related stats</h2>
            <div className="flex flex-wrap gap-2">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={statHref(r.id)}
                  className={cn(
                    "rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium transition-colors",
                    "hover:border-primary/40 hover:bg-primary/[0.08] hover:text-primary",
                  )}
                >
                  {r.name}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <p className="mt-10 text-xs text-muted-foreground">
        Curious how a term is used elsewhere on the site? Look for a <StatTerm id={stat.id}>dotted underline</StatTerm> like this one — hover
        it for a quick reminder, or head back to the <Link href={leagueTopicHref("franchise-structure")} className="underline hover:text-primary">league mechanics guides</Link>.
      </p>
    </div>
  );
}
