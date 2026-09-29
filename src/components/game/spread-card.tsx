import { Explainer } from "@/components/learn/explainer";
import type { GameDetail } from "@/lib/data/game";
import { spreadSentence, spreadStory } from "@/lib/game";
import { cn } from "@/lib/utils";

/** Who was favored and by how much, read in plain words, plus a short explainer on what a point spread is. */
export function SpreadCard({ detail }: { detail: GameDetail }) {
  const { game, home, away, played } = detail;
  if (game.spread_line === null) return null;
  const story = spreadStory(game.spread_line, game.home_score, game.away_score);
  const sentence = spreadSentence(story, { home: home.name, away: away.name });
  const fav = story.favorite ? detail[story.favorite] : null;

  return (
    <section className="rounded-2xl border bg-card p-5" aria-labelledby="game-spread" data-tour="game-spread">
      <p className="eyebrow text-muted-foreground">{played ? "Before kickoff" : "Expectations"}</p>
      <h2 id="game-spread" className="mb-3 text-2xl font-semibold">
        The point spread
      </h2>
      <p className="text-lg leading-snug text-balance">{sentence}</p>
      {story.outcome && (
        <p className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 font-medium",
              story.outcome === "covered"
                ? "bg-win/15 text-win"
                : story.outcome === "push"
                  ? "bg-muted text-muted-foreground"
                  : "bg-loss/15 text-loss",
            )}
          >
            {fav
              ? `${fav.nickname} ${story.outcome === "covered" ? "covered" : story.outcome === "push" ? "pushed" : "did not cover"}`
              : "Pick'em"}
          </span>
          {story.favoriteMargin !== null && fav && (
            <span className="text-muted-foreground tabular-nums">
              Expected margin {story.points} · actual margin {story.favoriteMargin > 0 ? "+" : ""}
              {story.favoriteMargin}
            </span>
          )}
        </p>
      )}
      <Explainer title="What is a point spread?" className="mt-4">
        <p>
          A spread is the oddsmakers&apos; estimate of the margin of victory. Think of it as a scoreboard forecast: the favorite is the team
          expected to win, and the number is how many points it is expected to win by.
        </p>
        <p>
          A team &ldquo;covers&rdquo; when it beats that margin, so a 3.5-point favorite that wins by 7 covers, and one that wins by 3 does
          not. Here it is just a gauge of how surprising a result was, and a quick read on how evenly matched the teams looked. Spreads come
          from the closing line and can differ slightly between sources.
        </p>
      </Explainer>
    </section>
  );
}
