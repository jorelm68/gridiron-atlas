import type { Metadata } from "next";
import { ALL_STATS, getStatsByCategory, STAT_CATEGORIES } from "@/content/stats";
import { LEAGUE_TOPICS } from "@/content/league";
import { Explainer } from "@/components/learn/explainer";
import { LearnExplorer, type ExplorerCategory, type ExplorerTopic } from "@/components/learn/learn-explorer";

export const revalidate = 3600;
export const metadata: Metadata = { title: "Learn" };

export default function LearnPage() {
  const categories: ExplorerCategory[] = STAT_CATEGORIES.map((cat) => ({
    ...cat,
    stats: getStatsByCategory(cat.id).map((s) => ({ id: s.id, name: s.name, abbr: s.abbr })),
  }));
  const topics: ExplorerTopic[] = LEAGUE_TOPICS.map(({ id, title, summary }) => ({ id, title, summary }));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6" data-tour="learn-hub">
      <header className="mb-8 grid gap-6 lg:grid-cols-[1fr_24rem] lg:items-end">
        <div>
          <p className="eyebrow mb-3 text-primary">Learn</p>
          <h1 className="text-5xl font-bold text-balance sm:text-6xl">Every stat and how the league actually works</h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            {ALL_STATS.length} stats explained in plain language — what each one measures, exactly how it&apos;s
            computed, and how to read it — plus {LEAGUE_TOPICS.length} short guides to how teams, rosters, and the
            season itself are actually structured.
          </p>
        </div>
        <Explainer title="You already know the rules">
          <p>
            These pages skip the rulebook entirely and go straight to the parts that trip up even long-time fans:
            how a stat is calculated, what counts as good, and how the business side of the league — the cap, the
            draft, roster rules — shapes what you see on Sundays.
          </p>
        </Explainer>
      </header>
      <LearnExplorer categories={categories} topics={topics} />
    </div>
  );
}
