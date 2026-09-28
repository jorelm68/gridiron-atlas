const STOPS = [
  { month: "Mar", label: "League year opens", detail: "Free agency, tags" },
  { month: "Apr", label: "Draft", detail: "7 rounds" },
  { month: "Jul", label: "Training camp", detail: "Roster cuts to 53" },
  { month: "Sep", label: "Regular season begins", detail: "18 weeks, 17 games" },
  { month: "Nov", label: "Trade deadline", detail: "Roughly midseason" },
  { month: "Jan", label: "Playoffs", detail: "Single elimination" },
  { month: "Feb", label: "Super Bowl", detail: "Neutral site" },
];

/** Horizontal season calendar: one dot per milestone month, in cycle order (wraps from Feb back to March). */
export function SeasonTimelineDiagram() {
  return (
    <div
      className="overflow-x-auto rounded-2xl border bg-card/60 p-6"
      role="img"
      aria-label={`NFL season calendar, in order: ${STOPS.map((s) => `${s.month} — ${s.label}`).join("; ")}.`}
    >
      <div className="relative flex min-w-[640px] justify-between gap-2 pt-2">
        <div aria-hidden="true" className="absolute top-[9px] right-0 left-0 h-px bg-border" />
        {STOPS.map((stop) => (
          <div key={stop.month} className="relative flex flex-1 flex-col items-center gap-2 text-center">
            <span aria-hidden="true" className="z-10 size-2.5 rounded-full bg-primary ring-4 ring-card" />
            <span className="eyebrow text-primary">{stop.month}</span>
            <span className="text-xs leading-tight font-medium text-balance">{stop.label}</span>
            <span className="text-[11px] leading-tight text-balance text-muted-foreground">{stop.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
