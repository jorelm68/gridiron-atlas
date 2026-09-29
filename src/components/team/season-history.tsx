import { Explainer } from "@/components/learn/explainer";
import { SeasonChart } from "@/components/team/season-chart";
import type { TeamOverview } from "@/lib/data/team";
import { formatRecord, ordinal } from "@/lib/format";
import { PLAYOFF_LABEL } from "@/lib/playoffs";
import { cn } from "@/lib/utils";

/** History tab: win% chart, Super Bowl appearances, and a full season table (the chart's table view). */
export function SeasonHistory({ overview, currentSeason }: { overview: TeamOverview; currentSeason: number }) {
  const { seasons, superBowls, franchise } = overview;
  const points = seasons.map((s) => ({
    season: s.season,
    wins: s.wins,
    losses: s.losses,
    ties: s.ties,
    divRank: s.div_rank,
    playoffResult: s.playoff_result,
    coach: s.head_coach,
    inProgress: s.season === currentSeason && !s.playoff_result,
  }));

  return (
    <div className="space-y-8">
      {points.length > 0 && <SeasonChart points={points} />}

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <section aria-labelledby="season-table">
          <h2 id="season-table" className="mb-3 text-3xl font-semibold">
            Every season since {seasons[0]?.season ?? 1999}
          </h2>
          <div className="max-h-[32rem] overflow-auto rounded-2xl border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-muted text-left">
                <tr>
                  {["Season", "Record", "Division", "Postseason", "Head coach"].map((h) => (
                    <th key={h} scope="col" className="eyebrow px-3 py-2 font-semibold text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {seasons.toReversed().map((s) => (
                  <tr key={s.season} className={cn(s.playoff_result === "won_sb" && "bg-chart-3/10")}>
                    <td className="px-3 py-2 font-medium tabular-nums">{s.season}</td>
                    <td className="px-3 py-2 tabular-nums">{formatRecord(s.wins, s.losses, s.ties)}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {s.div_rank ? `${ordinal(s.div_rank)} · ${s.division_id}` : s.division_id}
                    </td>
                    <td className="px-3 py-2">
                      {s.playoff_result ? (
                        <>
                          {PLAYOFF_LABEL[s.playoff_result]}
                          {s.playoff_seed && <span className="text-muted-foreground"> (#{s.playoff_seed} seed)</span>}
                        </>
                      ) : (
                        <span className="text-muted-foreground">{s.season === currentSeason ? "In progress" : "—"}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{s.head_coach}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border bg-card p-5" aria-labelledby="super-bowls">
            <h2 id="super-bowls" className="mb-3 text-2xl font-semibold">
              Super Bowls
            </h2>
            {superBowls.length === 0 ? (
              <p className="text-sm text-muted-foreground">The {franchise.nickname} haven&apos;t reached a Super Bowl yet.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {superBowls.map((sb) => {
                  const won = sb.winner_franchise_id === franchise.id;
                  return (
                    <li key={sb.number} className="flex items-baseline gap-3">
                      <span className={cn("w-14 shrink-0 font-display font-semibold", won ? "text-foreground" : "text-muted-foreground")}>
                        {sb.roman}
                      </span>
                      <span>
                        <span className={cn("font-medium", won ? "text-win" : "text-loss")}>{won ? "Won" : "Lost"}</span>{" "}
                        <span className="tabular-nums">
                          {sb.winner_score}–{sb.loser_score}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          · {sb.season} season{sb.mvp_name && won ? ` · MVP ${sb.mvp_name}` : ""}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
          {overview.headCoaches.length > 0 && (
            <section className="rounded-2xl border bg-card p-5" aria-labelledby="head-coaches">
              <h2 id="head-coaches" className="mb-3 text-2xl font-semibold">
                Head coaches
              </h2>
              <ol className="max-h-80 space-y-2 overflow-auto pr-1 text-sm">
                {overview.headCoaches.map((c) => (
                  <li key={`${c.coach_name}-${c.start_season}`} className="flex items-baseline justify-between gap-3">
                    <span>
                      <span className="font-medium">{c.coach_name}</span>
                      {c.is_interim && <span className="text-xs text-muted-foreground"> (interim)</span>}
                      <span className="block text-xs text-muted-foreground tabular-nums">
                        {c.start_season === c.end_season ? c.start_season : `${c.start_season}–${c.end_season ?? "today"}`}
                      </span>
                    </span>
                    {c.regular_wins !== null && (
                      <span className="shrink-0 text-right tabular-nums text-muted-foreground">
                        {formatRecord(c.regular_wins, c.regular_losses ?? 0, c.regular_ties ?? 0)}
                        {!!(c.playoff_wins || c.playoff_losses) && (
                          <span className="block text-xs">playoffs {c.playoff_wins}–{c.playoff_losses}</span>
                        )}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}
          <Explainer title="Why win percentage?">
            <p>
              Seasons were 16 games through 2020 and 17 games since 2021, so raw win totals aren&apos;t comparable across
              eras. Win percentage (ties count as half a win) puts every season on the same scale.
            </p>
          </Explainer>
        </aside>
      </div>
    </div>
  );
}
