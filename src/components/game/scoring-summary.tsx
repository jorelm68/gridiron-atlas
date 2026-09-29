import { TeamLogo } from "@/components/team/team-logo";
import type { GameTeam } from "@/lib/data/game";
import type { ScoringPlay } from "@/lib/game";
import { cn } from "@/lib/utils";

interface ScoreEvent {
  play: ScoringPlay;
  conversion: ScoringPlay | null;
  awayScore: number;
  homeScore: number;
}

const FALLBACK: Record<string, string> = {
  TD: "Touchdown",
  FG: "Field goal",
  Safety: "Safety",
  PAT: "Extra point",
  "2PT": "Two-point conversion",
  Score: "Score",
};

const PERIOD = (qtr: number) =>
  qtr <= 4 ? `${qtr}${["st", "nd", "rd", "th"][qtr - 1]} quarter` : qtr === 5 ? "Overtime" : `Overtime ${qtr - 4}`;

/** Merges each extra point or two-point try into its touchdown so a score reads as one line. */
function toEvents(plays: ScoringPlay[]): ScoreEvent[] {
  const events: ScoreEvent[] = [];
  for (const play of plays) {
    const previous = events[events.length - 1];
    if (
      (play.type === "PAT" || play.type === "2PT") &&
      previous?.play.type === "TD" &&
      previous.play.team === play.team &&
      !previous.conversion
    ) {
      previous.conversion = play;
      previous.awayScore = play.away_score;
      previous.homeScore = play.home_score;
    } else {
      events.push({ play, conversion: null, awayScore: play.away_score, homeScore: play.home_score });
    }
  }
  return events;
}

/** Every score in order, grouped by quarter, with the running score. */
export function ScoringSummary({ plays, home, away }: { plays: ScoringPlay[]; home: GameTeam; away: GameTeam }) {
  const events = toEvents(plays);
  const teams = new Map([
    [home.abbr, home],
    [away.abbr, away],
  ]);
  const groups = new Map<number, ScoreEvent[]>();
  for (const event of events) groups.set(event.play.qtr, [...(groups.get(event.play.qtr) ?? []), event]);

  if (events.length === 0) {
    return (
      <section className="rounded-2xl border bg-card p-5" data-tour="game-scoring">
        <h2 className="text-2xl font-semibold">Scoring summary</h2>
        <p className="mt-2 text-sm text-muted-foreground">Scoring plays aren&apos;t available for this game.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border bg-card p-5" aria-labelledby="scoring-summary" data-tour="game-scoring">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-muted-foreground">Every score</p>
          <h2 id="scoring-summary" className="text-2xl font-semibold">
            Scoring summary
          </h2>
        </div>
        <div className="flex gap-1 text-xs font-semibold text-muted-foreground" aria-hidden="true">
          <span className="w-8 text-right">{away.abbr}</span>
          <span className="w-8 text-right">{home.abbr}</span>
        </div>
      </div>
      <div className="space-y-4">
        {[...groups.entries()].map(([qtr, group]) => (
          <div key={qtr}>
            <p className="eyebrow mb-1 text-muted-foreground/80">{PERIOD(qtr)}</p>
            <ol className="divide-y">
              {group.map((event, i) => {
                const team = teams.get(event.play.team);
                const label = event.conversion ? `TD + ${event.conversion.type === "PAT" ? "PAT" : "2PT"}` : event.play.type;
                const description = event.play.description || FALLBACK[event.play.type] || "Score";
                const homeScored = event.play.team === home.abbr;
                return (
                  <li key={`${qtr}-${i}`} className="flex items-start gap-3 py-2.5">
                    {team ? (
                      <TeamLogo
                        name={team.name}
                        abbr={team.abbr}
                        logoUrl={team.logoUrl}
                        color={team.colorPrimary}
                        size={28}
                        className="mt-0.5"
                      />
                    ) : (
                      <span className="size-7" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                        <span className="rounded bg-muted px-1.5 py-0.5 font-display font-semibold text-foreground">{label}</span>
                        <span className="tabular-nums">{event.play.clock.replace(/^0/, "")}</span>
                      </p>
                      <p className="mt-0.5 text-sm leading-snug">
                        {description}
                        {event.conversion && event.conversion.description && (
                          <span className="text-muted-foreground"> {event.conversion.description}</span>
                        )}
                      </p>
                    </div>
                    <div
                      className="flex shrink-0 gap-1 font-display text-lg font-semibold tabular-nums"
                      aria-label={`Score ${away.abbr} ${event.awayScore}, ${home.abbr} ${event.homeScore}`}
                    >
                      <span className={cn("w-8 text-right", homeScored && "text-muted-foreground/70")}>{event.awayScore}</span>
                      <span className={cn("w-8 text-right", !homeScored && "text-muted-foreground/70")}>{event.homeScore}</span>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}
