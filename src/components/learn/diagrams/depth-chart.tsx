const GROUPS = [
  { position: "QB", ranks: ["Player A", "Player B", "Player C"] },
  { position: "WR1", ranks: ["Player D", "Player E"] },
  { position: "RB", ranks: ["Player F", "Player G", "Player H"] },
  { position: "LT", ranks: ["Player I", "Player J"] },
];

/** A generic, position-only example of how a depth chart ranks players — not tied to any real team's current roster. */
export function DepthChartDiagram() {
  return (
    <div
      className="rounded-2xl border bg-card/60 p-6"
      role="img"
      aria-label="Example depth chart: each position lists players ranked 1 (starter) through 2nd and 3rd string, top to bottom."
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {GROUPS.map((group) => (
          <div key={group.position}>
            <p className="eyebrow mb-2 text-primary">{group.position}</p>
            <ol className="space-y-1">
              {group.ranks.map((name, i) => (
                <li key={name} className="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1 text-xs">
                  <span className="eyebrow text-[10px] text-muted-foreground">{i + 1}</span>
                  <span className={i === 0 ? "font-medium" : "text-muted-foreground"}>{name}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[11px] text-muted-foreground">Top row (1) is the starter; each row below is the next player up if he&apos;s unavailable.</p>
    </div>
  );
}
