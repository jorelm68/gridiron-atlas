import Link from "next/link";
import { PlayerAvatar } from "@/components/player/player-avatar";
import type { Tables } from "@/lib/supabase/database.types";
import { formatSeasonSpan } from "@/lib/format";
import { playerHref } from "@/lib/routes";

type NotablePlayer = Tables<"franchise_players">;

/** The franchise's greats: its Hall of Famers, then the players who created the most value for it. */
export function NotablePlayers({
  hallOfFamers,
  others,
  teamName,
}: {
  hallOfFamers: NotablePlayer[];
  others: NotablePlayer[];
  teamName: string;
}) {
  return (
    <section aria-labelledby="notable-players" className="space-y-8" data-tour="team-notable">
      <h2 id="notable-players" className="text-3xl font-semibold">
        All-time greats
      </h2>
      {hallOfFamers.length > 0 && (
        <PlayerGroup
          title={`Hall of Famers · ${hallOfFamers.length}`}
          caption="Enshrined in the Pro Football Hall of Fame after at least three seasons here, by induction year."
          players={hallOfFamers}
        />
      )}
      <PlayerGroup
        title="Most valuable to the franchise"
        caption="Ranked by career value created while with this team. Pro Bowl and career-value data covers players drafted since 1980."
        players={others}
      />
      <p className="text-xs text-muted-foreground">Everyone who ever played for the {teamName} is searchable.</p>
    </section>
  );
}

function PlayerGroup({ title, caption, players }: { title: string; caption: string; players: NotablePlayer[] }) {
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="eyebrow text-muted-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{caption}</p>
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
              <span className="leading-tight font-medium">{player.display_name}</span>
              <span className="text-xs text-muted-foreground">
                {player.position} · {formatSeasonSpan(player.first_season ?? 0, player.last_season ?? 0)}
              </span>
              <span className="mt-auto flex flex-wrap justify-center gap-1">
                {player.hof_here && (
                  <span className="rounded bg-chart-3/20 px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
                    HOF {player.hof_class}
                  </span>
                )}
                {!!player.pro_bowl_count && (
                  <span className="rounded bg-accent px-1.5 py-0.5 text-[10px]">{player.pro_bowl_count}× Pro Bowl</span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
