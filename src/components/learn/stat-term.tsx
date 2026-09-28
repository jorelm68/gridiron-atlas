import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { getStatById } from "@/content/stats";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { renderFormula } from "@/lib/katex";
import { statHref } from "@/lib/routes";

/**
 * Wraps inline text that references a stat by id with a dotted underline and a hover card (name, summary, a
 * small rendered formula, and a link to the full glossary page). Use anywhere a stat is mentioned in prose
 * outside the glossary itself, e.g. `<StatTerm id="passer-rating">passer rating</StatTerm>`.
 */
export function StatTerm({ id, children }: { id: string; children: React.ReactNode }) {
  const stat = getStatById(id);
  if (!stat) return <>{children}</>;

  return (
    <HoverCard openDelay={150}>
      <HoverCardTrigger asChild>
        <Link
          href={statHref(stat.id)}
          data-tour="stat-term"
          className="underline decoration-muted-foreground/50 decoration-dotted underline-offset-4 transition-colors hover:decoration-primary hover:text-primary"
        >
          {children}
        </Link>
      </HoverCardTrigger>
      <HoverCardContent className="w-72 space-y-2">
        <div>
          <p className="font-display text-base leading-tight font-semibold">
            {stat.name}
            {stat.abbr && <span className="ml-1.5 text-xs font-normal text-muted-foreground">{stat.abbr}</span>}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{stat.summary}</p>
        </div>
        {stat.formulaTex && (
          <div
            className="overflow-x-auto text-sm [&_.katex-display]:my-0"
            dangerouslySetInnerHTML={{ __html: renderFormula(stat.formulaTex, false) }}
          />
        )}
        <Link href={statHref(stat.id)} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          Learn more <ArrowRightIcon className="size-3" aria-hidden="true" />
        </Link>
      </HoverCardContent>
    </HoverCard>
  );
}
