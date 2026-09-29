import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GameHero } from "@/components/game/game-hero";
import { GamePreview } from "@/components/game/game-preview";
import { GameLeaders, PlayerStatTables } from "@/components/game/player-stats";
import { ScoringSummary } from "@/components/game/scoring-summary";
import { SpreadCard } from "@/components/game/spread-card";
import { TeamComparison } from "@/components/game/team-comparison";
import { WinProbabilityChart } from "@/components/game/win-probability-chart";
import { StatTerm } from "@/components/learn/stat-term";
import { getGame } from "@/lib/data/game";
import { overtimeLength, pairColors, weekLabel } from "@/lib/game";

export const revalidate = 3600;

/** Nothing is prebuilt (7,000+ games): each page renders on first visit, then is cached and refreshed hourly. */
export function generateStaticParams() {
  return [];
}

const decodeId = (raw: string) => {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

export async function generateMetadata({ params }: PageProps<"/games/[id]">): Promise<Metadata> {
  const detail = await getGame(decodeId((await params).id));
  if (!detail) return { title: "Game" };
  const { game, home, away, played } = detail;
  return {
    title: `${away.nickname} at ${home.nickname}, ${detail.superBowl ? `Super Bowl ${detail.superBowl.roman}` : `${weekLabel(game.game_type, game.week)} ${game.season}`}`,
    description: played
      ? `${away.name} ${away.score}, ${home.name} ${home.score}: win probability, scoring summary, team comparison, and player stats.`
      : `${away.name} at ${home.name}: records, venue, and the point spread.`,
  };
}

export default async function GamePage({ params }: PageProps<"/games/[id]">) {
  const detail = await getGame(decodeId((await params).id));
  if (!detail) notFound();

  const { game, played, home, away } = detail;
  const colors = pairColors(
    { primary: home.colorPrimary, secondary: home.colorSecondary },
    { primary: away.colorPrimary, secondary: away.colorSecondary },
  );

  return (
    <div>
      <GameHero detail={detail} />
      <div className="mx-auto w-full max-w-7xl space-y-10 px-4 py-8 sm:px-6">
        {!played ? (
          <GamePreview detail={detail} spread={<SpreadCard detail={detail} />} />
        ) : (
          <>
            <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
              <div className="space-y-4" data-tour="game-wp-chart">
                {detail.winProbability.length > 1 ? (
                  <>
                    <WinProbabilityChart
                      points={detail.winProbability}
                      scoringPlays={detail.scoringPlays}
                      home={{ abbr: home.abbr, nickname: home.nickname, color: colors.home }}
                      away={{ abbr: away.abbr, nickname: away.nickname, color: colors.away }}
                      overtime={overtimeLength(game.season, game.game_type)}
                      finalHome={home.score!}
                      finalAway={away.score!}
                    />
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      <StatTerm id="win-probability">Win probability</StatTerm> is a model&apos;s estimate, before every snap, of how often
                      a team in that exact spot (score, time left, down, distance, field position, timeouts) goes on to win. Steep moves
                      mark the plays that changed the game: turnovers, long touchdowns, and late scores.
                    </p>
                  </>
                ) : (
                  <section className="rounded-2xl border bg-card p-5">
                    <h2 className="text-2xl font-semibold">Win probability</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Play-by-play data isn&apos;t available for this game yet, so there is no win-probability chart.
                    </p>
                  </section>
                )}
              </div>
              <ScoringSummary plays={detail.scoringPlays} home={home} away={away} />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <TeamComparison home={home} away={away} stats={detail.teamStats} />
              <SpreadCard detail={detail} />
            </div>

            {detail.players.length > 0 ? (
              <>
                <GameLeaders home={home} away={away} players={detail.players} />
                <PlayerStatTables home={home} away={away} players={detail.players} />
              </>
            ) : (
              <p className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground">
                Player box-score stats aren&apos;t available for this game.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
