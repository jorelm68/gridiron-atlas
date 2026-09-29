import { ChevronLeftIcon, CloudIcon, MapPinIcon, ThermometerIcon, WindIcon } from "lucide-react";
import Link from "next/link";
import { TeamLogo } from "@/components/team/team-logo";
import type { GameDetail, GameTeam } from "@/lib/data/game";
import { formatGameDate, formatKickoff, gamesWeekHref, pairColors, roofLabel, surfaceLabel, weekLabel } from "@/lib/game";
import { formatRecord } from "@/lib/format";
import { teamHref } from "@/lib/routes";
import { cn } from "@/lib/utils";

/** Game page header: both teams, the final score (or kickoff time), and the where/when/conditions line. */
export function GameHero({ detail }: { detail: GameDetail }) {
  const { game, played, home, away, venue, superBowl } = detail;
  const colors = pairColors(
    { primary: home.colorPrimary, secondary: home.colorSecondary },
    { primary: away.colorPrimary, secondary: away.colorSecondary },
  );
  const winner = !played ? null : home.score! > away.score! ? "home" : away.score! > home.score! ? "away" : null;
  const kickoff = formatKickoff(game.gametime);
  const isNeutral = game.location === "Neutral";
  const venueName = venue?.name ?? game.venue_name;
  const conditions = [
    { icon: CloudIcon, text: [roofLabel(game.roof), surfaceLabel(game.surface)].filter(Boolean).join(" · ") },
    game.temp !== null && { icon: ThermometerIcon, text: `${game.temp}°F` },
    game.wind !== null && { icon: WindIcon, text: `${game.wind} mph wind` },
  ].filter((c): c is { icon: typeof CloudIcon; text: string } => Boolean(c && c.text));

  const roundName = superBowl ? `Super Bowl ${superBowl.roman}` : weekLabel(game.game_type, game.week);

  return (
    <section
      className="relative overflow-hidden border-b"
      style={{ "--away": colors.away, "--home": colors.home } as React.CSSProperties}
      data-tour="game-header"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(44rem 26rem at 0% -10%, color-mix(in oklch, var(--away) 38%, transparent), transparent 70%), radial-gradient(44rem 26rem at 100% -10%, color-mix(in oklch, var(--home) 38%, transparent), transparent 70%)",
        }}
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-7xl px-4 pt-6 pb-8 sm:px-6">
        <h1 className="sr-only">
          {away.name} at {home.name}, {weekLabel(game.game_type, game.week)} {game.season}
        </h1>
        <nav className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground" aria-label="Game context">
          <Link
            href={gamesWeekHref(game.season, game.game_type, game.week)}
            className="inline-flex items-center gap-1 font-medium text-foreground/80 transition-colors hover:text-primary"
          >
            <ChevronLeftIcon className="size-4" aria-hidden="true" />
            {game.season} · {superBowl ? "Super Bowl" : weekLabel(game.game_type, game.week)}
          </Link>
          <span aria-hidden="true">·</span>
          <time dateTime={game.gameday}>{formatGameDate(game.gameday)}</time>
          {!played && kickoff && (
            <>
              <span aria-hidden="true">·</span>
              <span>{kickoff}</span>
            </>
          )}
        </nav>

        {superBowl && (
          <p className="eyebrow mb-4 text-chart-3">
            {roundName}
            {superBowl.mvp_name ? (
              <span className="ml-3 text-muted-foreground normal-case tracking-normal">MVP {superBowl.mvp_name}</span>
            ) : null}
          </p>
        )}

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-8">
          <TeamSide team={away} winner={winner === "away"} loser={winner === "home"} align="right" />
          <div className="text-center">
            {played ? (
              <>
                <p className="flex items-baseline justify-center gap-2 font-display text-5xl leading-none font-bold tabular-nums sm:gap-4 sm:text-8xl">
                  <span className={cn(winner === "home" && "text-muted-foreground/70")}>{away.score}</span>
                  <span className="text-2xl font-normal text-muted-foreground sm:text-4xl" aria-hidden="true">
                    –
                  </span>
                  <span className={cn(winner === "away" && "text-muted-foreground/70")}>{home.score}</span>
                </p>
                <p className="eyebrow mt-3 text-muted-foreground">
                  Final{game.overtime ? " · overtime" : ""}
                  {winner === null ? " · tie" : ""}
                </p>
              </>
            ) : (
              <>
                <p className="font-display text-3xl leading-none font-bold sm:text-5xl">{kickoff ?? "TBD"}</p>
                <p className="eyebrow mt-3 text-muted-foreground">Kickoff</p>
              </>
            )}
          </div>
          <TeamSide team={home} winner={winner === "home"} loser={winner === "away"} align="left" />
        </div>

        <dl className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          {venueName && (
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Venue</dt>
              <MapPinIcon className="size-4" aria-hidden="true" />
              <dd>
                {!isNeutral && home.franchiseId ? (
                  <Link
                    href={teamHref(home.franchiseId)}
                    className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
                  >
                    {venueName}
                  </Link>
                ) : (
                  <span className="font-medium text-foreground">{venueName}</span>
                )}
                {venue?.city ? ` · ${venue.city}${venue.region ? `, ${venue.region}` : ""}` : ""}
                {isNeutral && <span className="ml-2 rounded-full border px-2 py-0.5 text-xs">Neutral site</span>}
              </dd>
            </div>
          )}
          {conditions.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-1.5">
              <Icon className="size-4" aria-hidden="true" />
              <dd>{text}</dd>
            </div>
          ))}
          {game.div_game && (
            <div>
              <dd className="rounded-full border px-2 py-0.5 text-xs">Division game</dd>
            </div>
          )}
        </dl>
      </div>
    </section>
  );
}

function TeamSide({ team, winner, loser, align }: { team: GameTeam; winner: boolean; loser: boolean; align: "left" | "right" }) {
  const content = (
    <>
      <TeamLogo
        name={team.name}
        abbr={team.abbr}
        logoUrl={team.logoUrl}
        color={team.colorPrimary}
        size={96}
        priority
        className={cn("size-16! drop-shadow-[0_8px_24px_rgba(0,0,0,0.35)] sm:size-24!", loser && "opacity-60")}
      />
      <div className={cn("min-w-0", align === "right" ? "sm:text-right" : "sm:text-left")}>
        <p className="truncate text-xs text-muted-foreground sm:text-sm">
          {team.name.slice(0, team.name.length - team.nickname.length).trim()}
        </p>
        <p className={cn("font-display text-xl leading-tight font-bold sm:text-4xl", loser && "text-muted-foreground")}>{team.nickname}</p>
        {team.record && (
          <p className="mt-1 text-xs text-muted-foreground tabular-nums sm:text-sm">
            <span className="sr-only">Record entering the game: </span>
            {formatRecord(team.record.wins, team.record.losses, team.record.ties)}
            {winner ? <span className="ml-2 font-semibold text-win">Winner</span> : null}
          </p>
        )}
        {!team.record && winner && <p className="mt-1 text-sm font-semibold text-win">Winner</p>}
      </div>
    </>
  );
  const className = cn(
    "flex min-w-0 flex-col items-center gap-3 text-center sm:gap-5",
    align === "right" ? "sm:flex-row-reverse sm:justify-start" : "sm:flex-row sm:justify-start",
  );
  return team.franchiseId ? (
    <Link href={teamHref(team.franchiseId)} className={cn(className, "group rounded-2xl transition-opacity hover:opacity-90")}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}
