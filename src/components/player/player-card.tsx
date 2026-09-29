import Link from "next/link";
import { PlayerAvatar } from "@/components/player/player-avatar";
import { TeamLogo } from "@/components/team/team-logo";
import type { PlayerCardData } from "@/lib/data/player-search";
import { formatSeasonSpan } from "@/lib/format";
import { playerHref } from "@/lib/routes";

export interface CardTeam {
  name: string;
  nickname: string;
  logoUrl: string | null;
  color: string | null;
}

/** Player tile for the index: headshot in the team's color, position, team, career span, and honors. */
export function PlayerCard({ player, team, tenureNote }: { player: PlayerCardData; team: CardTeam | null; tenureNote?: string }) {
  const span =
    player.firstSeason && player.lastSeason ? formatSeasonSpan(player.firstSeason, player.lastSeason) : null;
  return (
    <Link
      href={playerHref(player.id)}
      className="group relative flex h-full items-center gap-3.5 overflow-hidden rounded-2xl border bg-card p-3.5 transition-colors hover:bg-accent"
      style={{ "--team": team?.color ?? undefined } as React.CSSProperties}
    >
      <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-team opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
      <PlayerAvatar
        name={player.name}
        headshotUrl={player.headshotUrl}
        size={64}
        className="bg-[color-mix(in_oklch,var(--team)_25%,var(--card))] transition-transform duration-300 ease-out-expo group-hover:scale-105"
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className="truncate font-display text-xl leading-tight font-semibold">{player.name}</span>
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          {player.position && <span className="rounded bg-muted px-1.5 py-0.5 font-display text-[11px] font-semibold text-foreground">{player.position}</span>}
          {player.jersey ? <span className="tabular-nums">#{player.jersey}</span> : null}
          {team && player.franchiseId ? (
            <span className="flex min-w-0 items-center gap-1">
              <TeamLogo name={team.name} abbr={player.franchiseId} logoUrl={team.logoUrl} color={team.color} size={16} />
              <span className="truncate">{team.nickname}</span>
            </span>
          ) : (
            <span>{player.lastSeason ? "Former player" : ""}</span>
          )}
        </span>
        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          {span && (
            <span className="tabular-nums">
              {span}
              {tenureNote ? ` ${tenureNote}` : ""}
            </span>
          )}
          {player.isHof && <span className="rounded bg-chart-3/20 px-1.5 py-0.5 text-[10px] font-semibold text-foreground">Hall of Fame</span>}
          {!!player.proBowls && <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] text-foreground">{player.proBowls}× Pro Bowl</span>}
        </span>
      </span>
    </Link>
  );
}
