import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LeagueTopicDiagram } from "@/components/learn/diagrams";
import { Explainer } from "@/components/learn/explainer";
import { getRelatedTopics, getTopicById, LEAGUE_TOPICS } from "@/content/league";
import { getStatById } from "@/content/stats";
import { leagueTopicHref, statHref } from "@/lib/routes";
import { cn } from "@/lib/utils";

export const revalidate = 3600;

export function generateStaticParams() {
  return LEAGUE_TOPICS.map((topic) => ({ id: topic.id }));
}

export async function generateMetadata({ params }: PageProps<"/learn/league/[id]">): Promise<Metadata> {
  const { id } = await params;
  const topic = getTopicById(id);
  return { title: topic ? topic.title : "Topic not found" };
}

export default async function LeagueTopicPage({ params }: PageProps<"/learn/league/[id]">) {
  const { id } = await params;
  const topic = getTopicById(id);
  if (!topic) notFound();

  const relatedTopics = getRelatedTopics(topic);
  const relatedStats = (topic.relatedStatIds ?? []).map((statId) => getStatById(statId)).filter((s) => s !== undefined);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <Link href="/learn" className="mb-6 inline-block text-sm text-muted-foreground hover:text-primary hover:underline">
        ← All stats &amp; league topics
      </Link>

      <header className="mb-8">
        <p className="eyebrow mb-2 text-primary">League mechanics</p>
        <h1 className="text-4xl font-bold text-balance sm:text-5xl">{topic.title}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{topic.summary}</p>
      </header>

      {topic.diagram && (
        <div className="mb-8">
          <LeagueTopicDiagram diagram={topic.diagram} />
        </div>
      )}

      <div className="space-y-8">
        {topic.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="mb-3 font-display text-xl font-semibold">{section.heading}</h2>
            <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              {section.body.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            {section.list && section.list.length > 0 && (
              <dl className="mt-4 space-y-2.5 rounded-2xl border bg-card/60 p-4">
                {section.list.map((item) => (
                  <div key={item.term} className="flex flex-col gap-0.5 sm:flex-row sm:gap-3">
                    <dt className="shrink-0 font-mono text-sm font-semibold text-primary sm:w-14">{item.term}</dt>
                    <dd className="text-sm leading-relaxed text-muted-foreground">{item.description}</dd>
                  </div>
                ))}
              </dl>
            )}
            {section.callout && (
              <Explainer title={section.callout.title} className="mt-4">
                <p>{section.callout.body}</p>
              </Explainer>
            )}
          </section>
        ))}
      </div>

      {(relatedStats.length > 0 || relatedTopics.length > 0) && (
        <div className="mt-10 space-y-6 border-t border-border pt-6">
          {relatedStats.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-lg font-semibold">Related stats</h2>
              <div className="flex flex-wrap gap-2">
                {relatedStats.map((s) => (
                  <Link
                    key={s.id}
                    href={statHref(s.id)}
                    className={cn(
                      "rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium transition-colors",
                      "hover:border-primary/40 hover:bg-primary/[0.08] hover:text-primary",
                    )}
                  >
                    {s.name}
                  </Link>
                ))}
              </div>
            </section>
          )}
          {relatedTopics.length > 0 && (
            <section>
              <h2 className="mb-3 font-display text-lg font-semibold">Related topics</h2>
              <div className="flex flex-wrap gap-2">
                {relatedTopics.map((t) => (
                  <Link
                    key={t.id}
                    href={leagueTopicHref(t.id)}
                    className={cn(
                      "rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium transition-colors",
                      "hover:border-primary/40 hover:bg-primary/[0.08] hover:text-primary",
                    )}
                  >
                    {t.title}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
