import Link from "next/link";
import { TeamLogo } from "@/components/team/team-logo";
import type { ScheduleEntry } from "@/lib/data/team";
import { gameHref } from "@/lib/routes";
import { cn } from "@/lib/utils";

const ROUND: Record<string, string> = { WC: "Wild Card", DIV: "Divisional", CON: "Conference", SB: "Super Bowl" };
const dateFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

/** A season's games week by week, with bye weeks shown where the team didn't play. */
export function ScheduleList({ entries, season }: { entries: ScheduleEntry[]; season: number }) {
  const regular = entries.filter((e) => e.game.game_type === "REG");
  const lastWeek = Math.max(0, ...regular.map((e) => e.game.week));
  const byWeek = new Map(regular.map((e) => [e.game.week, e]));
  const rows: (ScheduleEntry | { bye: number })[] = [];
  for (let week = 1; week <= lastWeek; week++) rows.push(byWeek.get(week) ?? { bye: week });
  rows.push(...entries.filter((e) => e.game.game_type !== "REG"));

  return (
    <section aria-labelledby="schedule" data-tour="team-schedule">
      <h2 id="schedule" className="mb-4 text-3xl font-semibold">
        {season} schedule
      </h2>
      <ol className="divide-y overflow-hidden rounded-2xl border bg-card">
        {rows.map((row) =>
          "bye" in row ? (
            <li key={`bye-${row.bye}`} className="flex items-center gap-4 px-4 py-3 text-sm text-muted-foreground">
              <span className="w-16 font-display font-semibold tabular-nums">Week {row.bye}</span>
              <span className="italic">Bye week — every team gets one rest week during the season</span>
            </li>
          ) : (
            <li key={row.game.id}>
              <GameRow entry={row} />
            </li>
          ),
        )}
      </ol>
    </section>
  );
}

function GameRow({ entry }: { entry: ScheduleEntry }) {
  const { game, opponent, isHome, neutral, result } = entry;
  const label = game.game_type === "REG" ? `Week ${game.week}` : ROUND[game.game_type];
  return (
    <Link href={gameHref(game.id)} className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-accent">
      <span className="w-16 shrink-0 font-display text-sm font-semibold tabular-nums">{label}</span>
      <span className="hidden w-14 shrink-0 text-xs text-muted-foreground sm:block">{dateFormat.format(new Date(game.gameday))}</span>
      <span className="w-6 shrink-0 text-center text-xs text-muted-foreground">{neutral ? "vs" : isHome ? "vs" : "@"}</span>
      {opponent && (
        <TeamLogo name={opponent.name} abbr={opponent.id} logoUrl={opponent.logo_url} color={opponent.color_primary} size={28} />
      )}
      <span className="min-w-0 flex-1 truncate font-medium">
        {opponent?.name ?? "TBD"}
        {neutral && <span className="ml-2 text-xs text-muted-foreground">at {game.venue_name}</span>}
      </span>
      {result ? (
        <span className="flex items-center gap-2 font-display text-lg font-semibold tabular-nums">
          <span
            className={cn(
              "inline-flex size-6 items-center justify-center rounded text-xs",
              result === "W" ? "bg-win/20 text-win" : result === "L" ? "bg-loss/20 text-loss" : "bg-muted",
            )}
          >
            {result}
          </span>
          {entry.teamScore}–{entry.opponentScore}
          {game.overtime && <span className="text-xs text-muted-foreground">OT</span>}
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">
          {game.weekday?.slice(0, 3)} {game.gametime} ET
        </span>
      )}
    </Link>
  );
}
