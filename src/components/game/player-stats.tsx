import Link from "next/link";
import { GameStatTabs } from "@/components/game/game-stat-tabs";
import { StatTerm } from "@/components/learn/stat-term";
import { PlayerAvatar } from "@/components/player/player-avatar";
import { TeamLogo } from "@/components/team/team-logo";
import type { GamePlayerLine, GameTeam } from "@/lib/data/game";
import { playerHref, teamHref } from "@/lib/routes";
import { cn } from "@/lib/utils";

const n = (v: number | null | undefined) => v ?? 0;
const tackles = (l: GamePlayerLine) => n(l.stats.def_tackles_solo) + n(l.stats.def_tackle_assists);
const half = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
const signed = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : ""}${Math.abs(v).toFixed(1)}`;
const ratio = (num: number, den: number) => (den > 0 ? (num / den).toFixed(1) : "–");

type Lines = GamePlayerLine[];

const byTeam = (lines: Lines, team: GameTeam) => lines.filter((l) => l.stats.team_abbr === team.abbr);

// ── Which lines qualify for each table ────────────────────────────────────────
const passers = (lines: Lines) =>
  lines.filter((l) => n(l.stats.attempts) > 0).toSorted((a, b) => n(b.stats.attempts) - n(a.stats.attempts));
const rushers = (lines: Lines) =>
  lines.filter((l) => n(l.stats.carries) > 0).toSorted((a, b) => n(b.stats.rushing_yards) - n(a.stats.rushing_yards));
const receivers = (lines: Lines) =>
  lines
    .filter((l) => n(l.stats.targets) > 0 || n(l.stats.receptions) > 0)
    .toSorted((a, b) => n(b.stats.receiving_yards) - n(a.stats.receiving_yards) || n(b.stats.targets) - n(a.stats.targets));
const defenders = (lines: Lines) =>
  lines
    .filter(
      (l) =>
        tackles(l) +
          n(l.stats.def_sacks) +
          n(l.stats.def_interceptions) +
          n(l.stats.def_pass_defended) +
          n(l.stats.def_fumbles_forced) +
          n(l.stats.def_tackles_for_loss) +
          n(l.stats.def_qb_hits) +
          n(l.stats.def_tds) >
        0,
    )
    .toSorted(
      (a, b) =>
        tackles(b) +
        3 * n(b.stats.def_sacks) +
        3 * n(b.stats.def_interceptions) -
        (tackles(a) + 3 * n(a.stats.def_sacks) + 3 * n(a.stats.def_interceptions)),
    );
const kickers = (lines: Lines) =>
  lines.filter((l) => n(l.stats.fg_att) > 0 || n(l.stats.pat_att) > 0).toSorted((a, b) => n(b.stats.fg_att) - n(a.stats.fg_att));
const punters = (lines: Lines) => lines.filter((l) => n(l.stats.punts) > 0);

// ── Leaders ───────────────────────────────────────────────────────────────────
interface Leader {
  key: string;
  category: string;
  line: GamePlayerLine;
  text: string;
}

function leadersFor(lines: Lines): Leader[] {
  const out: Leader[] = [];
  const qb = passers(lines)[0];
  if (qb) {
    const s = qb.stats;
    out.push({
      key: "pass",
      category: "Passing",
      line: qb,
      text: `${n(s.completions)}/${n(s.attempts)}, ${n(s.passing_yards)} yds, ${n(s.passing_tds)} TD${n(s.passing_interceptions) ? `, ${n(s.passing_interceptions)} INT` : ""}`,
    });
  }
  const rb = rushers(lines)[0];
  if (rb) {
    const s = rb.stats;
    out.push({
      key: "rush",
      category: "Rushing",
      line: rb,
      text: `${n(s.carries)} car, ${n(s.rushing_yards)} yds${n(s.rushing_tds) ? `, ${n(s.rushing_tds)} TD` : ""}`,
    });
  }
  const wr = receivers(lines)[0];
  if (wr) {
    const s = wr.stats;
    out.push({
      key: "rec",
      category: "Receiving",
      line: wr,
      text: `${n(s.receptions)} rec, ${n(s.receiving_yards)} yds${n(s.receiving_tds) ? `, ${n(s.receiving_tds)} TD` : ""}`,
    });
  }
  const d = defenders(lines)[0];
  if (d) {
    const s = d.stats;
    const extras = [
      n(s.def_sacks) ? `${half(n(s.def_sacks))} sk` : "",
      n(s.def_interceptions) ? `${n(s.def_interceptions)} INT` : "",
      n(s.def_pass_defended) ? `${n(s.def_pass_defended)} PD` : "",
    ].filter(Boolean);
    out.push({ key: "def", category: "Defense", line: d, text: [`${tackles(d)} tkl`, ...extras].join(", ") });
  }
  return out;
}

/** Each team's top passer, rusher, receiver, and defender for the game. */
export function GameLeaders({ home, away, players }: { home: GameTeam; away: GameTeam; players: Lines }) {
  return (
    <section aria-labelledby="game-leaders" data-tour="game-leaders">
      <h2 id="game-leaders" className="mb-4 text-3xl font-semibold">
        Game leaders
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        {[away, home].map((team) => {
          const leaders = leadersFor(byTeam(players, team));
          return (
            <article key={team.abbr} className="rounded-2xl border bg-card p-5">
              <TeamHeading team={team} />
              {leaders.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No player stats recorded.</p>
              ) : (
                <ul className="mt-3 divide-y">
                  {leaders.map((leader) => (
                    <li key={leader.key} className="flex items-center gap-3 py-2.5">
                      <PlayerAvatar name={leader.line.player.name} headshotUrl={leader.line.player.headshotUrl} size={44} />
                      <div className="min-w-0 flex-1">
                        <p className="eyebrow text-[10px] text-muted-foreground">{leader.category}</p>
                        <Link
                          href={playerHref(leader.line.player.id)}
                          className="block truncate font-medium underline-offset-4 hover:text-primary hover:underline"
                        >
                          {leader.line.player.name}
                          {leader.line.player.position && (
                            <span className="ml-1.5 text-xs font-normal text-muted-foreground">{leader.line.player.position}</span>
                          )}
                        </Link>
                      </div>
                      <p className="shrink-0 text-right text-sm font-medium tabular-nums">{leader.text}</p>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function TeamHeading({ team }: { team: GameTeam }) {
  const inner = (
    <>
      <TeamLogo name={team.name} abbr={team.abbr} logoUrl={team.logoUrl} color={team.colorPrimary} size={32} />
      <h3 className="text-xl font-semibold">{team.name}</h3>
    </>
  );
  return team.franchiseId ? (
    <Link href={teamHref(team.franchiseId)} className="inline-flex items-center gap-2.5 transition-colors hover:text-primary">
      {inner}
    </Link>
  ) : (
    <div className="inline-flex items-center gap-2.5">{inner}</div>
  );
}

// ── Tables ────────────────────────────────────────────────────────────────────
interface Column {
  key: string;
  label: React.ReactNode;
  cell: (l: GamePlayerLine) => React.ReactNode;
  /** Bold, primary column (usually yards). */
  strong?: boolean;
}

function PlayerCell({ line }: { line: GamePlayerLine }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <PlayerAvatar name={line.player.name} headshotUrl={line.player.headshotUrl} size={28} />
      <Link href={playerHref(line.player.id)} className="min-w-0 truncate underline-offset-4 hover:text-primary hover:underline">
        {line.player.name}
      </Link>
      {line.player.position && <span className="hidden text-xs text-muted-foreground sm:inline">{line.player.position}</span>}
    </div>
  );
}

function StatTable({ team, lines, columns, empty }: { team: GameTeam; lines: Lines; columns: Column[]; empty: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <div className="border-b px-4 py-3">
        <TeamHeading team={team} />
      </div>
      {lines.length === 0 ? (
        <p className="px-4 py-4 text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b text-xs text-muted-foreground">
                <th scope="col" className="px-4 py-2 text-left font-medium">
                  Player
                </th>
                {columns.map((c) => (
                  <th key={c.key} scope="col" className="px-2 py-2 text-right font-medium last:pr-4">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {lines.map((line) => (
                <tr key={line.player.id} className="hover:bg-accent/50">
                  <td className="max-w-[14rem] px-4 py-2">
                    <PlayerCell line={line} />
                  </td>
                  {columns.map((c) => (
                    <td key={c.key} className={cn("px-2 py-2 text-right tabular-nums last:pr-4", c.strong && "font-semibold")}>
                      {c.cell(line)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const PASSING: Column[] = [
  { key: "ca", label: "C/A", cell: (l) => `${n(l.stats.completions)}/${n(l.stats.attempts)}` },
  { key: "yds", label: "Yds", strong: true, cell: (l) => n(l.stats.passing_yards) },
  { key: "td", label: "TD", cell: (l) => n(l.stats.passing_tds) },
  { key: "int", label: "INT", cell: (l) => n(l.stats.passing_interceptions) },
  { key: "sck", label: <StatTerm id="sacks">Sacked</StatTerm>, cell: (l) => n(l.stats.sacks_suffered) },
  { key: "ya", label: <StatTerm id="yards-per-attempt">Y/A</StatTerm>, cell: (l) => ratio(n(l.stats.passing_yards), n(l.stats.attempts)) },
  { key: "epa", label: <StatTerm id="expected-points">EPA</StatTerm>, cell: (l) => signed(n(l.stats.passing_epa)) },
];

const RUSHING: Column[] = [
  { key: "car", label: "Car", cell: (l) => n(l.stats.carries) },
  { key: "yds", label: "Yds", strong: true, cell: (l) => n(l.stats.rushing_yards) },
  { key: "ypc", label: <StatTerm id="yards-per-carry">Y/C</StatTerm>, cell: (l) => ratio(n(l.stats.rushing_yards), n(l.stats.carries)) },
  { key: "td", label: "TD", cell: (l) => n(l.stats.rushing_tds) },
  { key: "fum", label: "Fum lost", cell: (l) => n(l.stats.fumbles_lost) },
  { key: "epa", label: <StatTerm id="expected-points">EPA</StatTerm>, cell: (l) => signed(n(l.stats.rushing_epa)) },
];

const RECEIVING: Column[] = [
  { key: "tgt", label: <StatTerm id="target-share">Tgt</StatTerm>, cell: (l) => n(l.stats.targets) },
  { key: "rec", label: "Rec", cell: (l) => n(l.stats.receptions) },
  { key: "yds", label: "Yds", strong: true, cell: (l) => n(l.stats.receiving_yards) },
  {
    key: "ypr",
    label: <StatTerm id="yards-per-reception">Y/R</StatTerm>,
    cell: (l) => ratio(n(l.stats.receiving_yards), n(l.stats.receptions)),
  },
  { key: "td", label: "TD", cell: (l) => n(l.stats.receiving_tds) },
  { key: "yac", label: <StatTerm id="yac-per-reception">YAC</StatTerm>, cell: (l) => n(l.stats.receiving_yards_after_catch) },
  { key: "epa", label: <StatTerm id="expected-points">EPA</StatTerm>, cell: (l) => signed(n(l.stats.receiving_epa)) },
];

const dash = (v: number, fmt: (x: number) => string = String) => (v ? fmt(v) : "–");
const DEFENSE: Column[] = [
  { key: "tkl", label: <StatTerm id="solo-vs-assisted-tackles">Tkl</StatTerm>, strong: true, cell: (l) => tackles(l) },
  { key: "solo", label: "Solo", cell: (l) => n(l.stats.def_tackles_solo) },
  { key: "tfl", label: <StatTerm id="tackles-for-loss">TFL</StatTerm>, cell: (l) => dash(n(l.stats.def_tackles_for_loss), half) },
  { key: "sck", label: <StatTerm id="sacks">Sacks</StatTerm>, cell: (l) => dash(n(l.stats.def_sacks), half) },
  { key: "hits", label: <StatTerm id="qb-hits">QB hits</StatTerm>, cell: (l) => dash(n(l.stats.def_qb_hits)) },
  { key: "int", label: <StatTerm id="def-interceptions">INT</StatTerm>, cell: (l) => dash(n(l.stats.def_interceptions)) },
  { key: "pd", label: <StatTerm id="passes-defended">PD</StatTerm>, cell: (l) => dash(n(l.stats.def_pass_defended)) },
  { key: "ff", label: <StatTerm id="forced-fumbles">FF</StatTerm>, cell: (l) => dash(n(l.stats.def_fumbles_forced)) },
];

const KICKING: Column[] = [
  { key: "fg", label: <StatTerm id="fg-pct">FG</StatTerm>, strong: true, cell: (l) => `${n(l.stats.fg_made)}/${n(l.stats.fg_att)}` },
  { key: "long", label: "Long", cell: (l) => dash(n(l.stats.fg_long)) },
  { key: "xp", label: <StatTerm id="xp-pct">XP</StatTerm>, cell: (l) => `${n(l.stats.pat_made)}/${n(l.stats.pat_att)}` },
];

const PUNTING: Column[] = [
  { key: "punts", label: <StatTerm id="punting">Punts</StatTerm>, cell: (l) => n(l.stats.punts) },
  { key: "yds", label: "Yds", strong: true, cell: (l) => n(l.stats.punt_yards) },
  { key: "avg", label: <StatTerm id="gross-punt-average">Avg</StatTerm>, cell: (l) => ratio(n(l.stats.punt_yards), n(l.stats.punts)) },
  { key: "in20", label: <StatTerm id="inside-20-rate">In 20</StatTerm>, cell: (l) => n(l.stats.punts_inside_20) },
];

/** Per-team stat tables for every category, behind tabs (away team first, like the scoreboard). */
export function PlayerStatTables({ home, away, players }: { home: GameTeam; away: GameTeam; players: Lines }) {
  const pair = (pick: (lines: Lines) => Lines, columns: Column[], empty: string) => (
    <div className="grid gap-4 lg:grid-cols-2">
      {[away, home].map((team) => (
        <StatTable key={team.abbr} team={team} lines={pick(byTeam(players, team))} columns={columns} empty={empty} />
      ))}
    </div>
  );

  return (
    <section aria-labelledby="player-stats" data-tour="game-player-stats">
      <h2 id="player-stats" className="mb-4 text-3xl font-semibold">
        Player stats
      </h2>
      <GameStatTabs
        panels={{
          passing: pair(passers, PASSING, "No passing attempts."),
          rushing: pair(rushers, RUSHING, "No rushing attempts."),
          receiving: pair(receivers, RECEIVING, "No targets."),
          defense: pair(defenders, DEFENSE, "No defensive stats recorded."),
          kicking: (
            <div className="space-y-4">
              {pair(kickers, KICKING, "No field goal or extra point attempts.")}
              {[home, away].some((t) => punters(byTeam(players, t)).length > 0) && pair(punters, PUNTING, "No punts.")}
            </div>
          ),
        }}
      />
    </section>
  );
}
