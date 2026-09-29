import type { Metadata } from "next";
import { GameCard } from "@/components/game/game-card";
import { GamesPicker } from "@/components/game/games-picker";
import { getDataFreshness } from "@/lib/data/freshness";
import { defaultWeek, getSeasonWeeks, getWeekGames } from "@/lib/data/game";
import { ROUND_LABEL } from "@/lib/game";

export const metadata: Metadata = {
  title: "Games",
  description: "Scores and schedules for every NFL week since 1999, with a page for every game.",
};

const FIRST_SEASON = 1999;
const dayHeading = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function GamesPage({ searchParams }: PageProps<"/games">) {
  const query = await searchParams;
  const { currentSeason } = await getDataFreshness();
  const latest = currentSeason ?? new Date().getFullYear();
  const requestedSeason = Number.parseInt(first(query.season) ?? "", 10);
  const season = requestedSeason >= FIRST_SEASON && requestedSeason <= latest ? requestedSeason : latest;

  const weeks = await getSeasonWeeks(season);
  const requestedWeek = first(query.week);
  const week = weeks.some((w) => w.key === requestedWeek) ? (requestedWeek as string) : defaultWeek(weeks);
  const entries = weeks.length > 0 ? await getWeekGames(season, week) : [];

  const active = weeks.find((w) => w.key === week);
  const weekTitle = /^\d+$/.test(week) ? `Week ${week}` : (ROUND_LABEL[week] ?? week);
  const seasons = Array.from({ length: latest - FIRST_SEASON + 1 }, (_, i) => latest - i);

  const byDay = new Map<string, typeof entries>();
  for (const entry of entries) byDay.set(entry.game.gameday, [...(byDay.get(entry.game.gameday) ?? []), entry]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <header className="mb-8 max-w-3xl">
        <p className="eyebrow mb-3 text-primary">Scoreboard</p>
        <h1 className="text-5xl font-bold text-balance sm:text-6xl">Every game since 1999</h1>
        <p className="mt-4 text-muted-foreground">
          Pick a season and a week. Open any game for its win-probability chart, scoring summary, team comparison, and every player&apos;s
          line. Games with the Lions are outlined in Honolulu blue.
        </p>
      </header>

      <GamesPicker
        season={season}
        seasons={seasons}
        weeks={weeks.map(({ key, label, hasResults }) => ({ key, label, hasResults }))}
        activeWeek={week}
      />

      <div className="mt-8" aria-live="polite">
        <h2 className="mb-1 text-3xl font-semibold">
          {season} · {weekTitle}
        </h2>
        <p className="mb-6 text-sm text-muted-foreground">
          {entries.length} {entries.length === 1 ? "game" : "games"}
          {active && !active.hasResults ? " · not played yet" : ""}
        </p>
        {entries.length === 0 ? (
          <p className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">No games found for this week.</p>
        ) : (
          <div className="space-y-8">
            {[...byDay.entries()].map(([day, games]) => (
              <section key={day} aria-label={dayHeading.format(new Date(`${day}T00:00:00Z`))}>
                <h3 className="eyebrow mb-3 text-muted-foreground">{dayHeading.format(new Date(`${day}T00:00:00Z`))}</h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {games.map((entry) => (
                    <GameCard key={entry.game.id} entry={entry} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
