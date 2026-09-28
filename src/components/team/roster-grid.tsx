import Link from "next/link";
import { Explainer } from "@/components/learn/explainer";
import { PlayerAvatar } from "@/components/player/player-avatar";
import type { RosterPlayer } from "@/lib/data/team";
import { playerHref } from "@/lib/routes";
import { cn } from "@/lib/utils";

const UNITS = [
  { name: "Offense", groups: [["QB", "Quarterbacks"], ["RB", "Running backs"], ["WR", "Wide receivers"], ["TE", "Tight ends"], ["OL", "Offensive line"]] },
  { name: "Defense", groups: [["DL", "Defensive line"], ["LB", "Linebackers"], ["DB", "Defensive backs"]] },
  { name: "Special teams", groups: [["SPEC", "Specialists"]] },
] as const;

const STATUS: Record<string, { label: string; className: string }> = {
  RES: { label: "Injured reserve", className: "bg-loss/15 text-loss" },
  DEV: { label: "Practice squad", className: "bg-primary/15 text-primary" },
  INA: { label: "Inactive", className: "bg-muted text-muted-foreground" },
  EXE: { label: "Exempt", className: "bg-muted text-muted-foreground" },
};

/** The current organization grouped by unit and position group, with roster-status badges. */
export function RosterGrid({ players, season }: { players: RosterPlayer[]; season: number }) {
  const byGroup = Map.groupBy(players, (p) => p.positionGroup ?? "Other");
  const active = players.filter((p) => p.status === "ACT").length;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-10">
        {UNITS.map((unit) => (
          <section key={unit.name} aria-labelledby={`unit-${unit.name}`}>
            <h2 id={`unit-${unit.name}`} className="mb-4 text-3xl font-semibold">
              {unit.name}
            </h2>
            <div className="space-y-6">
              {unit.groups.map(([code, label]) => {
                const group = (byGroup.get(code) ?? []).toSorted(
                  (a, b) => Number(a.status !== "ACT") - Number(b.status !== "ACT") || (a.jersey ?? 99) - (b.jersey ?? 99),
                );
                if (!group.length) return null;
                return (
                  <div key={code}>
                    <h3 className="eyebrow mb-2 text-muted-foreground">
                      {label} · {group.length}
                    </h3>
                    <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {group.map((player) => (
                        <li key={player.id}>
                          <PlayerRow player={player} />
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
      <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-2xl border bg-card p-5">
          <p className="eyebrow text-muted-foreground">{season} organization</p>
          <p className="mt-1 font-display text-4xl font-semibold tabular-nums">{players.length}</p>
          <p className="text-sm text-muted-foreground">players under contract · {active} on the active roster</p>
        </div>
        <Explainer title="Reading a roster" data-tour="roster-explainer">
          <p>
            Teams carry up to 53 players on the <strong>active roster</strong>. The <strong>practice squad</strong> is a
            separate group that practices with the team and can be promoted.
          </p>
          <p>
            <strong>Injured reserve</strong> players are hurt and don&apos;t count against the 53, but they can&apos;t
            play until they&apos;re eligible to return.
          </p>
        </Explainer>
      </aside>
    </div>
  );
}

function PlayerRow({ player }: { player: RosterPlayer }) {
  const status = player.status ? STATUS[player.status] : undefined;
  const experience = player.yearsExp === 0 ? "Rookie" : player.yearsExp ? `${player.yearsExp} yr${player.yearsExp === 1 ? "" : "s"}` : null;
  return (
    <Link
      href={playerHref(player.id)}
      className={cn(
        "flex items-center gap-3 rounded-xl border bg-card/60 p-2.5 transition-colors hover:bg-accent",
        status && "opacity-85",
      )}
    >
      <PlayerAvatar name={player.name} headshotUrl={player.headshotUrl} size={44} />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          {player.jersey !== null && (
            <span className="font-display text-sm font-semibold text-muted-foreground tabular-nums">#{player.jersey}</span>
          )}
          <span className="truncate font-medium">{player.name}</span>
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {[player.position, experience, player.college].filter(Boolean).join(" · ")}
        </span>
      </span>
      {status && <span className={cn("shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium", status.className)}>{status.label}</span>}
    </Link>
  );
}
