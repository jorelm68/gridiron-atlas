import { ArrowRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function Stage({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-36 flex-1 flex-col gap-2">
      <div>
        <p className="eyebrow text-primary">{title}</p>
        <p className="text-[11px] text-muted-foreground">{note}</p>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-1.5">{children}</div>
    </div>
  );
}

function Seed({ n, bye = false }: { n: number; bye?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-md border px-2 py-1 text-xs font-medium",
        bye ? "border-primary/30 bg-primary/[0.08] text-primary" : "border-border bg-card",
      )}
    >
      #{n} seed{bye ? " — bye" : ""}
    </div>
  );
}

const ARROW = (
  <ArrowRightIcon aria-hidden="true" className="mx-1 hidden size-4 shrink-0 self-center text-muted-foreground sm:block" />
);

/** Four stages of the conference playoff bracket. Deliberately doesn't draw fixed seed-vs-seed lines past Wild Card — the field reseeds every round, which the section text explains. */
export function PlayoffBracketDiagram() {
  return (
    <div
      className="rounded-2xl border bg-card/60 p-6"
      role="img"
      aria-label="One conference's playoff path: 7 seeds enter the Wild Card round (the 1 seed byes), winners advance through a reseeded Divisional round and Conference Championship, then the two conference champions meet in the Super Bowl."
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
        <Stage title="Wild Card" note="#1 seed sits out (bye)">
          <Seed n={1} bye />
          <Seed n={2} />
          <Seed n={7} />
          <Seed n={3} />
          <Seed n={6} />
          <Seed n={4} />
          <Seed n={5} />
        </Stage>
        {ARROW}
        <Stage title="Divisional" note="Reseeds: #1 hosts the lowest seed left">
          <div className="rounded-md border border-dashed border-border px-2 py-1.5 text-xs text-muted-foreground">3 winners + #1 seed</div>
        </Stage>
        {ARROW}
        <Stage title="Conf. Championship" note="Hosted by the better seed">
          <div className="rounded-md border border-dashed border-border px-2 py-1.5 text-xs text-muted-foreground">2 winners</div>
        </Stage>
        {ARROW}
        <Stage title="Super Bowl" note="Neutral site, set years ahead">
          <div className="rounded-md border border-primary/30 bg-primary/[0.08] px-2 py-1.5 text-xs font-medium text-primary">AFC champ vs. NFC champ</div>
        </Stage>
      </div>
    </div>
  );
}
