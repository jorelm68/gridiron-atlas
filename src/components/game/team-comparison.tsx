import { StatTerm } from "@/components/learn/stat-term";
import type { GameTeam, TeamGameStats } from "@/lib/data/game";
import { pairColors } from "@/lib/game";
import { cn } from "@/lib/utils";

interface Row {
  id: string;
  /** Plain-text name for assistive tech. */
  name: string;
  label: React.ReactNode;
  home: number;
  away: number;
  /** Lower numbers are better (turnovers, penalties). */
  lowerIsBetter?: boolean;
  format: (n: number) => string;
  /** Optional second line per side, e.g. penalty yards. */
  sub?: { home: string; away: string };
}

const n = (v: number | null | undefined) => v ?? 0;
const int = (v: number) => Math.round(v).toLocaleString("en-US");
const signed1 = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)}`;

const netPassing = (s: TeamGameStats) => n(s.passing_yards) - n(s.sack_yards_lost);
const totalYards = (s: TeamGameStats) => netPassing(s) + n(s.rushing_yards);
const plays = (s: TeamGameStats) => n(s.attempts) + n(s.carries) + n(s.sacks_suffered);
const turnovers = (s: TeamGameStats) => n(s.passing_interceptions) + n(s.fumbles_lost);
const epa = (s: TeamGameStats) => n(s.passing_epa) + n(s.rushing_epa);

/** Head-to-head team totals as mirrored bars: away on the left, home on the right, the better side in full color. */
export function TeamComparison({ home, away, stats }: { home: GameTeam; away: GameTeam; stats: TeamGameStats[] }) {
  const h = stats.find((s) => s.team_abbr === home.abbr);
  const a = stats.find((s) => s.team_abbr === away.abbr);
  if (!h || !a) {
    return (
      <section className="rounded-2xl border bg-card p-5" data-tour="game-box">
        <h2 className="text-2xl font-semibold">Team comparison</h2>
        <p className="mt-2 text-sm text-muted-foreground">Team box-score totals aren&apos;t available for this game.</p>
      </section>
    );
  }
  const colors = pairColors(
    { primary: home.colorPrimary, secondary: home.colorSecondary },
    { primary: away.colorPrimary, secondary: away.colorSecondary },
  );

  const rows: Row[] = [
    { id: "total", name: "Total yards", label: "Total yards", home: totalYards(h), away: totalYards(a), format: int },
    { id: "pass", name: "Net passing yards", label: "Net passing yards", home: netPassing(h), away: netPassing(a), format: int },
    { id: "rush", name: "Rushing yards", label: "Rushing yards", home: n(h.rushing_yards), away: n(a.rushing_yards), format: int },
    {
      id: "ypp",
      name: "Yards per play",
      label: <StatTerm id="yards-per-play">Yards per play</StatTerm>,
      home: plays(h) ? totalYards(h) / plays(h) : 0,
      away: plays(a) ? totalYards(a) / plays(a) : 0,
      format: (v) => v.toFixed(1),
    },
    {
      id: "epa",
      name: "Total EPA",
      label: <StatTerm id="expected-points">Total EPA</StatTerm>,
      home: epa(h),
      away: epa(a),
      format: signed1,
    },
    {
      id: "turnovers",
      name: "Turnovers",
      label: <StatTerm id="turnover-differential">Turnovers</StatTerm>,
      home: turnovers(h),
      away: turnovers(a),
      lowerIsBetter: true,
      format: int,
      sub: {
        home: `${n(h.passing_interceptions)} INT · ${n(h.fumbles_lost)} fumbles lost`,
        away: `${n(a.passing_interceptions)} INT · ${n(a.fumbles_lost)} fumbles lost`,
      },
    },
    {
      id: "sacks",
      name: "Sacks made",
      label: <StatTerm id="sacks">Sacks made</StatTerm>,
      home: n(h.def_sacks),
      away: n(a.def_sacks),
      format: (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1)),
    },
    {
      id: "penalties",
      name: "Penalties",
      label: "Penalties",
      home: n(h.penalties),
      away: n(a.penalties),
      lowerIsBetter: true,
      format: int,
      sub: { home: `${n(h.penalty_yards)} yds`, away: `${n(a.penalty_yards)} yds` },
    },
  ];

  return (
    <section className="rounded-2xl border bg-card p-5" aria-labelledby="team-comparison" data-tour="game-box">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-muted-foreground">Box score</p>
          <h2 id="team-comparison" className="text-2xl font-semibold">
            Team comparison
          </h2>
        </div>
        <p className="flex items-center gap-3 text-xs font-semibold">
          <span style={{ color: `color-mix(in oklch, ${colors.away} 70%, var(--foreground))` }}>{away.abbr}</span>
          <span className="text-muted-foreground">vs</span>
          <span style={{ color: `color-mix(in oklch, ${colors.home} 70%, var(--foreground))` }}>{home.abbr}</span>
        </p>
      </div>
      <ul className="space-y-4">
        {rows.map((row) => {
          const max = Math.max(Math.abs(row.home), Math.abs(row.away), 1e-9);
          const tie = row.home === row.away;
          const homeLeads = tie ? false : row.lowerIsBetter ? row.home < row.away : row.home > row.away;
          const awayLeads = tie ? false : !homeLeads;
          return (
            <li key={row.id}>
              <div className="mb-1 grid grid-cols-[1fr_auto_1fr] items-baseline gap-2 text-sm">
                <span className={cn("font-display text-lg font-semibold tabular-nums", !awayLeads && !tie && "text-muted-foreground")}>
                  {row.format(row.away)}
                </span>
                <span className="text-center text-xs text-muted-foreground">{row.label}</span>
                <span
                  className={cn(
                    "text-right font-display text-lg font-semibold tabular-nums",
                    !homeLeads && !tie && "text-muted-foreground",
                  )}
                >
                  {row.format(row.home)}
                </span>
              </div>
              <div
                className="grid grid-cols-2 gap-1"
                role="img"
                aria-label={`${row.name}: ${away.abbr} ${row.format(row.away)}, ${home.abbr} ${row.format(row.home)}`}
              >
                <Bar value={row.away} max={max} color={colors.away} leads={awayLeads || tie} side="away" />
                <Bar value={row.home} max={max} color={colors.home} leads={homeLeads || tie} side="home" />
              </div>
              {row.sub && (
                <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
                  <span>{row.sub.away}</span>
                  <span>{row.sub.home}</span>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        Bars are scaled within each row. For turnovers and penalties, fewer is better, so the smaller number gets the full color. Net
        passing yards subtract yards lost on sacks.
      </p>
    </section>
  );
}

function Bar({ value, max, color, leads, side }: { value: number; max: number; color: string; leads: boolean; side: "home" | "away" }) {
  const width = Math.max(value === 0 ? 0 : 2, (Math.abs(value) / max) * 100);
  return (
    <div className={cn("flex h-2.5 overflow-hidden rounded-full bg-muted", side === "away" ? "justify-end" : "justify-start")}>
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out-expo motion-reduce:transition-none"
        style={{
          width: `${width}%`,
          backgroundColor: `color-mix(in oklch, ${color} 70%, var(--foreground))`,
          opacity: leads ? 1 : 0.4,
          backgroundImage: value < 0 ? "repeating-linear-gradient(135deg, transparent 0 4px, rgb(0 0 0 / 0.25) 4px 6px)" : undefined,
        }}
      />
    </div>
  );
}
