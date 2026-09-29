import { Explainer } from "@/components/learn/explainer";
import type { InjuryStatus } from "@/lib/data/player";
import { cn } from "@/lib/utils";

const GAME_STATUS: Record<string, { text: string; className: string }> = {
  Out: { text: "Out", className: "bg-loss/15 text-loss" },
  Doubtful: { text: "Doubtful", className: "bg-loss/10 text-loss" },
  Questionable: { text: "Questionable", className: "bg-chart-3/20 text-foreground" },
};

const PRACTICE: Record<string, string> = {
  "Full Participation in Practice": "Full participation",
  "Limited Participation in Practice": "Limited participation",
  "Did Not Participate In Practice": "Did not practice",
};

/** The player's line on the league's latest injury report (or a note that he isn't on it). */
export function InjuryCard({ status, season, onRoster }: { status: InjuryStatus; season: number; onRoster: boolean }) {
  const { entry, latestWeek } = status;
  if (!entry && !(onRoster && latestWeek)) return null;
  const gameStatus = entry?.report_status ? (GAME_STATUS[entry.report_status] ?? { text: entry.report_status, className: "bg-muted" }) : null;
  const injuries = [entry?.primary_injury, entry?.secondary_injury].filter(Boolean).join(" · ");

  return (
    <section aria-labelledby="injuries" data-tour="player-injury">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 id="injuries" className="text-3xl font-semibold">
          Injury report
        </h2>
        <p className="text-sm text-muted-foreground">
          {season} · Week {latestWeek}
        </p>
      </div>
      {entry ? (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-2xl border bg-card p-5 sm:grid-cols-3">
          <div>
            <dt className="eyebrow text-muted-foreground">Injury</dt>
            <dd className="mt-1 font-display text-2xl leading-none font-semibold">{injuries || "Not specified"}</dd>
          </div>
          <div>
            <dt className="eyebrow text-muted-foreground">Practice</dt>
            <dd className="mt-1 font-display text-2xl leading-none font-semibold">
              {entry.practice_status ? (PRACTICE[entry.practice_status] ?? entry.practice_status) : "—"}
            </dd>
          </div>
          <div>
            <dt className="eyebrow text-muted-foreground">Game status</dt>
            <dd className="mt-1">
              {gameStatus ? (
                <span className={cn("inline-block rounded px-2 py-0.5 font-display text-2xl leading-tight font-semibold", gameStatus.className)}>
                  {gameStatus.text}
                </span>
              ) : (
                <span className="font-display text-2xl leading-none font-semibold text-muted-foreground">No designation</span>
              )}
            </dd>
          </div>
        </dl>
      ) : (
        <p className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground">
          Not on the Week {latestWeek} injury report. Teams only list players with an injury or illness, so no entry
          means nothing was reported.
        </p>
      )}
      <Explainer title="How to read an injury report" className="mt-3">
        <p>
          Each week teams report who practiced and how much (<strong>full</strong>, <strong>limited</strong> or{" "}
          <strong>none</strong>), plus a game-day designation: <strong>Doubtful</strong> means unlikely to play,{" "}
          <strong>Questionable</strong> means uncertain, and <strong>Out</strong> means he won&apos;t play. A missing
          designation means the player is expected to play.
        </p>
      </Explainer>
    </section>
  );
}
