import Image from "next/image";
import Link from "next/link";
import { TeamLogo } from "@/components/team/team-logo";
import type { GameDetail } from "@/lib/data/game";
import { formatShortDate } from "@/lib/format";
import { gameHref, teamHref } from "@/lib/routes";
import { formatRecord } from "@/lib/format";
import { roofLabel, surfaceLabel } from "@/lib/game";

/** Preview panels for a game that hasn't been played: how each team arrives, the stadium, and the last meeting. */
export function GamePreview({ detail, spread }: { detail: GameDetail; spread?: React.ReactNode }) {
  const { game, home, away, venue, lastMeeting } = detail;
  const teams = [away, home];
  const meetingWinner =
    lastMeeting && lastMeeting.homeScore !== lastMeeting.awayScore
      ? lastMeeting.homeScore > lastMeeting.awayScore
        ? lastMeeting.homeAbbr
        : lastMeeting.awayAbbr
      : null;

  return (
    <div className="grid gap-6 lg:grid-cols-2" data-tour="game-preview">
      {spread}
      <div className="space-y-6">
        <section className="rounded-2xl border bg-card p-5" aria-labelledby="preview-teams">
          <p className="eyebrow text-muted-foreground">Coming in</p>
          <h2 id="preview-teams" className="mb-4 text-2xl font-semibold">
            Team records
          </h2>
          <ul className="divide-y">
            {teams.map((team) => (
              <li key={team.abbr} className="flex items-center gap-3 py-3">
                <TeamLogo name={team.name} abbr={team.abbr} logoUrl={team.logoUrl} color={team.colorPrimary} size={40} />
                <div className="min-w-0 flex-1">
                  {team.franchiseId ? (
                    <Link href={teamHref(team.franchiseId)} className="font-medium underline-offset-4 hover:text-primary hover:underline">
                      {team.name}
                    </Link>
                  ) : (
                    <span className="font-medium">{team.name}</span>
                  )}
                  <p className="text-xs text-muted-foreground">{team === away ? "Away" : "Home"}</p>
                </div>
                <p className="font-display text-2xl font-semibold tabular-nums">
                  {team.record ? formatRecord(team.record.wins, team.record.losses, team.record.ties) : "–"}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">Regular-season record entering this game.</p>
        </section>

        <section className="rounded-2xl border bg-card p-5" aria-labelledby="preview-meeting">
          <p className="eyebrow text-muted-foreground">Last time</p>
          <h2 id="preview-meeting" className="mb-4 text-2xl font-semibold">
            Previous meeting
          </h2>
          {lastMeeting ? (
            <Link href={gameHref(lastMeeting.id)} className="block rounded-xl border p-4 transition-colors hover:bg-accent">
              <p className="text-xs text-muted-foreground">
                {formatShortDate(lastMeeting.gameday)}, {lastMeeting.season}
              </p>
              <p className="mt-1 flex items-center justify-between gap-3 font-display text-xl font-semibold tabular-nums">
                <span className={meetingWinner && meetingWinner !== lastMeeting.awayAbbr ? "text-muted-foreground" : undefined}>
                  {lastMeeting.awayAbbr} {lastMeeting.awayScore}
                </span>
                <span className="text-muted-foreground" aria-hidden="true">
                  at
                </span>
                <span className={meetingWinner && meetingWinner !== lastMeeting.homeAbbr ? "text-muted-foreground" : undefined}>
                  {lastMeeting.homeAbbr} {lastMeeting.homeScore}
                </span>
              </p>
              <p className="mt-2 text-sm text-primary">See how it played out →</p>
            </Link>
          ) : (
            <p className="text-sm text-muted-foreground">These teams haven&apos;t met since 1999, the start of our game history.</p>
          )}
        </section>
      </div>

      {venue && (
        <section className="overflow-hidden rounded-2xl border bg-card lg:col-span-2" aria-labelledby="preview-venue">
          <div className="grid md:grid-cols-[1fr_1.2fr]">
            {venue.image_thumb_url && (
              <figure className="relative aspect-[16/9] bg-muted md:aspect-auto md:min-h-48">
                <Image src={venue.image_thumb_url} alt={venue.name} fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" />
                {venue.image_credit && (
                  <figcaption className="absolute right-2 bottom-2 max-w-[80%] truncate rounded bg-black/60 px-2 py-0.5 text-[10px] text-white">
                    Photo: {venue.image_credit}
                    {venue.image_license ? ` · ${venue.image_license}` : ""}
                  </figcaption>
                )}
              </figure>
            )}
            <div className="space-y-3 p-5">
              <p className="eyebrow text-muted-foreground">{game.location === "Neutral" ? "Neutral site" : "Home field"}</p>
              <h2 id="preview-venue" className="text-2xl font-semibold">
                {venue.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {[venue.city, venue.region].filter(Boolean).join(", ")}
                {venue.capacity ? ` · ${venue.capacity.toLocaleString("en-US")} seats` : ""}
              </p>
              <p className="text-sm">
                {[roofLabel(game.roof ?? venue.roof), surfaceLabel(game.surface ?? venue.surface)].filter(Boolean).join(" · ")}
              </p>
              {venue.summary && <p className="text-sm leading-relaxed text-muted-foreground">{venue.summary}</p>}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
