import { cn } from "@/lib/utils";

function Node({
  children,
  tone = "default",
  size = "md",
}: {
  children: React.ReactNode;
  tone?: "default" | "accent" | "muted";
  size?: "md" | "sm";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border text-center font-medium text-balance",
        size === "md" ? "px-3 py-2 text-sm" : "px-2 py-1 text-xs",
        tone === "accent" && "border-primary/30 bg-primary/[0.08] text-primary",
        tone === "muted" && "border-border/60 bg-transparent text-muted-foreground",
        tone === "default" && "border-border bg-card text-card-foreground",
      )}
    >
      {children}
    </div>
  );
}

function Connector({ height = 16 }: { height?: number }) {
  return <div aria-hidden="true" className="w-px bg-border" style={{ height }} />;
}

/** Owner → GM/Head Coach → coordinators, scouting, and position coaches. Purely illustrative, not to scale with any real team's exact reporting lines (those vary — see the section text). */
export function OrgChartDiagram() {
  return (
    <div className="flex flex-col items-center gap-0 rounded-2xl border bg-card/60 p-6" role="img" aria-label="Simplified NFL front-office and coaching org chart: owner at the top, branching to general manager and head coach.">
      <Node tone="accent">Owner</Node>
      <Connector />
      <div className="flex flex-wrap items-start justify-center gap-x-10 gap-y-4">
        <div className="flex flex-col items-center gap-0">
          <Node>General Manager</Node>
          <Connector height={12} />
          <Node tone="muted" size="sm">
            Scouting &amp; Analytics
          </Node>
        </div>
        <div className="flex flex-col items-center gap-0">
          <Node>Head Coach</Node>
          <Connector height={12} />
          <div className="flex flex-wrap justify-center gap-1.5">
            <Node tone="muted" size="sm">
              Offensive Coord.
            </Node>
            <Node tone="muted" size="sm">
              Defensive Coord.
            </Node>
            <Node tone="muted" size="sm">
              Special Teams Coord.
            </Node>
          </div>
          <Connector height={12} />
          <Node tone="muted" size="sm">
            Position coaches
          </Node>
        </div>
      </div>
    </div>
  );
}
