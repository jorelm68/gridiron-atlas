import Link from "next/link";
import { TeamLogo } from "@/components/team/team-logo";
import type { GameTeam, ScoreboardEntry } from "@/lib/data/game";
import { formatKickoff } from "@/lib/game";
import { gameHref } from "@/lib/routes";
import { cn } from "@/lib/utils";

const LIONS = "DET";
const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" });

/** One scoreboard tile: both teams with logos and scores, the winner in bold, and where/when. Lions games get a Honolulu-blue edge. */
export function GameCard({ entry }: { entry: ScoreboardEntry }) {
  const { game, home, away } = entry;
  const played = game.home_score !== null && game.away_score !== null;
  const lions = [home, away].find((t) => t.franchiseId === LIONS) ?? null;
  const homeWon = played && game.home_score! > game.away_score!;
  const awayWon = played && game.away_score! > game.home_score!;
  const kickoff = formatKickoff(game.gametime);

  return (
    <Link
      href={gameHref(game.id)}
      className={cn(
        "group relative block rounded-2xl border bg-card p-4 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-foreground/25 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        lions &&
          "border-[color-mix(in_oklch,var(--lions)_55%,transparent)] shadow-[0_0_0_1px_color-mix(in_oklch,var(--lions)_25%,transparent)]",
      )}
      style={lions ? ({ "--lions": lions.colorPrimary ?? "#0076B6" } as React.CSSProperties) : undefined}
      data-lions={lions ? "true" : undefined}
    >
      <div className="mb-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>
          {weekday.format(new Date(`${game.gameday}T00:00:00Z`))}
          {kickoff && !played ? ` · ${kickoff}` : ""}
          {played && game.overtime ? " · OT" : ""}
          {played ? " · Final" : ""}
        </span>
        {lions && (
          <span
            className="rounded-full px-2 py-0.5 font-semibold"
            style={{
              background: "color-mix(in oklch, var(--lions) 22%, transparent)",
              color: "color-mix(in oklch, var(--lions) 55%, var(--foreground))",
            }}
          >
            Lions game
          </span>
        )}
      </div>
      <div className="space-y-2">
        <TeamLine team={away} score={game.away_score} won={awayWon} lost={homeWon} />
        <TeamLine team={home} score={game.home_score} won={homeWon} lost={awayWon} />
      </div>
      {game.venue_name && (
        <p className="mt-3 truncate border-t pt-2.5 text-xs text-muted-foreground">
          {game.location === "Neutral" ? "Neutral site · " : ""}
          {game.venue_name}
        </p>
      )}
    </Link>
  );
}

function TeamLine({ team, score, won, lost }: { team: GameTeam; score: number | null; won: boolean; lost: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <TeamLogo
        name={team.name}
        abbr={team.abbr}
        logoUrl={team.logoUrl}
        color={team.colorPrimary}
        size={32}
        className={cn(lost && "opacity-60")}
      />
      <span className={cn("min-w-0 flex-1 truncate text-base", won ? "font-semibold" : "font-medium", lost && "text-muted-foreground")}>
        {team.name}
      </span>
      {score !== null && (
        <span className={cn("font-display text-2xl leading-none font-bold tabular-nums", lost && "text-muted-foreground/70")}>{score}</span>
      )}
      {won && <span className="sr-only">Winner</span>}
    </div>
  );
}
