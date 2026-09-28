import Link from "next/link";
import { PlayerAvatar } from "@/components/player/player-avatar";
import type { Tables } from "@/lib/supabase/database.types";
import { playerHref } from "@/lib/routes";

type NotablePlayer = Tables<"franchise_players">;

/** The franchise's most decorated players across its whole history. */
export function NotablePlayers({ players, teamName }: { players: NotablePlayer[]; teamName: string }) {
  return (
    <section aria-labelledby="notable-players" data-tour="team-notable">
      <div className="mb-4 flex items-baseline justify-between gap-4">
        <h2 id="notable-players" className="text-3xl font-semibold">
          All-time greats
        </h2>
        <p className="text-sm text-muted-foreground">Hall of Famers first, then the value each created for this team</p>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {players.map((player) => (
          <li key={player.player_id}>
            <Link
              href={playerHref(player.player_id!)}
              className="group flex h-full flex-col items-center gap-2 rounded-2xl border bg-card p-4 text-center transition-colors hover:bg-accent"
            >
              <PlayerAvatar
                name={player.display_name ?? ""}
                headshotUrl={player.headshot_url}
                size={72}
                className="transition-transform duration-300 ease-out-expo group-hover:scale-105"
              />
              <span className="font-medium leading-tight">{player.display_name}</span>
              <span className="text-xs text-muted-foreground">
                {player.position} · {player.first_season === player.last_season ? player.first_season : `${player.first_season}–${player.last_season}`}
              </span>
              <span className="mt-auto flex flex-wrap justify-center gap-1">
                {player.is_hof && (
                  <span className="rounded bg-chart-3/20 px-1.5 py-0.5 text-[10px] font-semibold text-foreground">Hall of Fame</span>
                )}
                {!!player.pro_bowl_count && (
                  <span className="rounded bg-accent px-1.5 py-0.5 text-[10px]">{player.pro_bowl_count}× Pro Bowl</span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">
        Pro Bowl and career-value data covers players drafted since 1980; Hall of Fame status covers all eras. Everyone who
        ever played for the {teamName} is searchable.
      </p>
    </section>
  );
}
