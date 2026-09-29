import { StatTerm } from "@/components/learn/stat-term";
import { Explainer } from "@/components/learn/explainer";
import { CareerChart, type CareerPoint } from "@/components/player/career-chart";
import { SeasonTypeTabs } from "@/components/player/season-type-tabs";
import { TeamLogo } from "@/components/team/team-logo";
import type { Player, RosterSeason, SeasonLine } from "@/lib/data/player";
import { teamNameAsOf } from "@/lib/data/player";
import type { FranchiseSummary } from "@/lib/data/teams";
import type { Tables } from "@/lib/supabase/database.types";
import {
  ROSTER_CODE_LABEL,
  formatCell,
  headlineFor,
  seasonColumns,
  sumTotals,
  type StatColumn,
  type StatKind,
} from "@/lib/player-stats";
import { cn } from "@/lib/utils";

interface SeasonStatsProps {
  player: Player;
  kind: StatKind;
  lines: SeasonLine[];
  rosterSeasons: RosterSeason[];
  franchises: FranchiseSummary[];
  abbrs: Tables<"team_abbrs">[];
  currentSeason: number;
}

const READING: Record<Exclude<StatKind, "none">, React.ReactNode> = {
  passing: (
    <>
      <p>
        Every rate is computed from the season&apos;s totals, not averaged from single games.{" "}
        <StatTerm id="passer-rating">Passer rating</StatTerm> (0–158.3) blends completion rate, yards per attempt,
        touchdown rate and interception rate.
      </p>
      <p>
        <StatTerm id="epa-per-dropback">EPA per dropback</StatTerm> is points added on every pass attempt <em>and</em>{" "}
        sack, so it credits (or punishes) plays a box score ignores. &ldquo;Car&rdquo; and the rush columns are his own runs.
      </p>
    </>
  ),
  rushing: (
    <>
      <p>
        <StatTerm id="yards-per-carry">Yards per carry</StatTerm> is the efficiency check on total yards, and{" "}
        <StatTerm id="rushing-epa-per-carry">EPA per carry</StatTerm> goes further by weighing the situation: three yards
        on 3rd-and-2 is worth more than three yards on 3rd-and-8.
      </p>
      <p>Receiving columns show his work as a pass catcher; fumbles lost are turnovers he gave the ball away on.</p>
    </>
  ),
  receiving: (
    <>
      <p>
        <StatTerm id="catch-rate">Catch rate</StatTerm> (catches ÷ targets) and <StatTerm id="yards-per-target">yards per
        target</StatTerm> show how efficiently he turns opportunities into production; raw yards alone reward volume.
      </p>
      <p>
        <StatTerm id="receiving-epa-per-target">EPA per target</StatTerm> adds game situation: a big gain on 3rd-and-long
        is worth far more than the same yards when trailing by three scores.
      </p>
    </>
  ),
  defense: (
    <>
      <p>
        Tackle totals aren&apos;t official — each team&apos;s own stat crew counts them — so treat them as approximate.{" "}
        <StatTerm id="sacks">Sacks</StatTerm> (half-sacks count) and <StatTerm id="qb-hits">QB hits</StatTerm> show
        pass-rush impact.
      </p>
      <p>
        <StatTerm id="passes-defended">Passes defended</StatTerm> and interceptions matter most for coverage players;{" "}
        <StatTerm id="tackles-for-loss">tackles for loss</StatTerm> stop runs behind the line.
      </p>
    </>
  ),
  kicking: (
    <>
      <p>
        <StatTerm id="fg-pct">Field goal percentage</StatTerm> reads best next to distance: nearly every kicker is
        automatic inside 40 yards, so makes from 50+ separate the leg strength.
      </p>
      <p>We store makes from 50+ yards but not attempts from that range, so a 50+ percentage isn&apos;t shown.</p>
    </>
  ),
  punting: (
    <>
      <p>
        <StatTerm id="gross-punt-average">Gross average</StatTerm> counts every yard the ball flies, ignoring returns.{" "}
        <StatTerm id="inside-20-rate">Inside-the-20 rate</StatTerm> reflects how often he pins the opponent deep.
      </p>
    </>
  ),
};

function Header({ col }: { col: StatColumn }) {
  return col.statId ? (
    <StatTerm id={col.statId}>{col.label}</StatTerm>
  ) : (
    <abbr title={col.title} className="cursor-help">
      {col.label}
    </abbr>
  );
}

/** Season-by-season table for one season type, with a career totals row (rates recomputed from summed totals). */
function StatsTable({
  columns,
  lines,
  franchises,
  abbrs,
  currentSeason,
  totalLabel,
}: {
  columns: StatColumn[];
  lines: SeasonLine[];
  franchises: FranchiseSummary[];
  abbrs: Tables<"team_abbrs">[];
  currentSeason: number;
  totalLabel: string;
}) {
  const byId = new Map(franchises.map((f) => [f.id, f]));
  const career = sumTotals(lines.map((l) => l.totals));
  const teamCount = new Set(lines.flatMap((l) => l.franchiseIds)).size;

  return (
    <div className="overflow-x-auto rounded-2xl border bg-card">
      <table className="w-full text-sm tabular-nums">
        <caption className="sr-only">{totalLabel} statistics by season</caption>
        <thead className="bg-muted text-left">
          <tr>
            <th scope="col" className="eyebrow sticky left-0 bg-muted px-3 py-2 font-semibold text-muted-foreground">
              Season
            </th>
            <th scope="col" className="eyebrow px-3 py-2 font-semibold text-muted-foreground">
              Team
            </th>
            {columns.map((col) => (
              <th key={col.id} scope="col" className="eyebrow px-3 py-2 text-right font-semibold whitespace-nowrap text-muted-foreground">
                <Header col={col} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {lines.map((line) => (
            <tr key={line.season} className="hover:bg-accent/50">
              <th scope="row" className="sticky left-0 bg-card px-3 py-2 text-left font-medium whitespace-nowrap">
                {line.season}
                {line.season === currentSeason && <span className="ml-1.5 text-[10px] font-normal text-muted-foreground">so far</span>}
              </th>
              <td className="px-3 py-2">
                <span className="flex items-center gap-1.5">
                  {line.franchiseIds.map((id) => {
                    const franchise = byId.get(id);
                    const name = franchise ? (abbrs.find((a) => a.franchise_id === id && a.start_season <= line.season && line.season <= a.end_season)?.name ?? franchise.name) : id;
                    return (
                      <span key={id} className="inline-flex items-center gap-1" title={name}>
                        <TeamLogo name={name} abbr={id} logoUrl={franchise?.logo_url ?? null} color={franchise?.color_primary} size={20} />
                        <span className="text-xs text-muted-foreground">{id}</span>
                      </span>
                    );
                  })}
                </span>
              </td>
              {columns.map((col) => (
                <td key={col.id} className={cn("px-3 py-2 text-right", col.id === "gp" && "text-muted-foreground")}>
                  {formatCell(col.value(line.totals), col.fmt)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t-2 bg-muted/50 font-semibold">
          <tr>
            <th scope="row" className="sticky left-0 bg-muted px-3 py-2 text-left whitespace-nowrap">
              {totalLabel}
            </th>
            <td className="px-3 py-2 text-xs font-normal text-muted-foreground">
              {teamCount} team{teamCount === 1 ? "" : "s"}
            </td>
            {columns.map((col) => (
              <td key={col.id} className="px-3 py-2 text-right">
                {formatCell(col.value(career), col.fmt)}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

/** Every roster season with jersey, position and status — used when detailed stats don't exist (pre-1999, linemen, snappers). */
function RosterHistory({ rosterSeasons, abbrs }: { rosterSeasons: RosterSeason[]; abbrs: Tables<"team_abbrs">[] }) {
  if (!rosterSeasons.length) return null;
  return (
    <div className="max-h-[28rem] overflow-auto rounded-2xl border bg-card">
      <table className="w-full text-sm">
        <caption className="sr-only">Roster history by season</caption>
        <thead className="sticky top-0 bg-muted text-left">
          <tr>
            {["Season", "Team", "#", "Pos", "Roster status"].map((h) => (
              <th key={h} scope="col" className="eyebrow px-3 py-2 font-semibold text-muted-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rosterSeasons.map((row) => (
            <tr key={`${row.season}-${row.teamAbbr}`}>
              <th scope="row" className="px-3 py-2 text-left font-medium tabular-nums">
                {row.season}
              </th>
              <td className="px-3 py-2">{teamNameAsOf(abbrs, row.teamAbbr, row.season, row.franchiseId) ?? row.teamAbbr}</td>
              <td className="px-3 py-2 text-muted-foreground tabular-nums">{row.jersey ? row.jersey : "—"}</td>
              <td className="px-3 py-2 text-muted-foreground">{row.position ?? "—"}</td>
              <td className="px-3 py-2 text-muted-foreground">{row.status ? (ROSTER_CODE_LABEL[row.status] ?? row.status) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Stats section: career chart, regular-season/playoff tables, and honest fallbacks for players without detailed stats. */
export function SeasonStats({ player, kind, lines, rosterSeasons, franchises, abbrs, currentSeason }: SeasonStatsProps) {
  const regular = lines.filter((l) => l.seasonType === "REG");
  const postseason = lines.filter((l) => l.seasonType === "POST");
  const columns = seasonColumns(kind);
  const headline = headlineFor(kind, player.position_group);
  const hasStats = kind !== "none" && lines.length > 0;
  const preStatsSeasons = player.first_season !== null && player.first_season < 1999 ? player.first_season : null;

  const points: CareerPoint[] =
    headline && regular.length > 1
      ? regular.map((l) => ({
          season: l.season,
          value: headline.value(l.totals),
          detail: headline.detail(l.totals),
          teams: l.franchiseIds.join(" / ") || "—",
        }))
      : [];

  return (
    <section aria-labelledby="stats" data-tour="player-stats">
      {hasStats ? (
        <>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="space-y-6">
              <SeasonTypeTabs
                heading={
                  <h2 id="stats" className="text-3xl font-semibold">
                    Season by season
                  </h2>
                }
                regular={
                  regular.length ? (
                    <StatsTable columns={columns} lines={regular} franchises={franchises} abbrs={abbrs} currentSeason={currentSeason} totalLabel="Career" />
                  ) : (
                    <p className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground">No regular-season stat lines on record.</p>
                  )
                }
                playoffs={
                  postseason.length ? (
                    <StatsTable columns={columns} lines={postseason} franchises={franchises} abbrs={abbrs} currentSeason={currentSeason} totalLabel="Playoff totals" />
                  ) : undefined
                }
              />
              {preStatsSeasons !== null && (
                <p className="text-xs text-muted-foreground">
                  Detailed game stats start in 1999, so his {preStatsSeasons}–1998 seasons appear in the career path but not in this
                  table.
                </p>
              )}
            </div>
            <aside className="space-y-4">
              <Explainer title="Reading these columns" data-tour="player-stats-explainer">
                {READING[kind]}
              </Explainer>
            </aside>
          </div>
          {headline && points.length > 1 && (
            <div className="mt-6">
              <CareerChart points={points} label={headline.label} />
            </div>
          )}
        </>
      ) : (
        <>
          <h2 id="stats" className="mb-4 text-3xl font-semibold">
            Seasons on a roster
          </h2>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <RosterHistory rosterSeasons={rosterSeasons} abbrs={abbrs} />
            <Explainer title={kind === "none" && player.last_season !== null && player.last_season >= 1999 ? "Why no stat table?" : "About older careers"}>
              {kind === "none" && player.last_season !== null && player.last_season >= 1999 ? (
                <p>
                  Offensive linemen and long snappers don&apos;t record individual box-score stats — their work shows up in
                  team results and in how much they play. The snap counts below (2013 onward) are the best individual
                  measure we have.
                </p>
              ) : (
                <>
                  <p>
                    Detailed game-by-game stats start in 1999, so {player.display_name.split(" ")[0]}&apos;s numbers
                    aren&apos;t in this app. Rosters, teams, draft position and honors are available back to 1920.
                  </p>
                  <p>Use the career path above and the roster history here to trace where he played.</p>
                </>
              )}
            </Explainer>
          </div>
        </>
      )}
    </section>
  );
}
