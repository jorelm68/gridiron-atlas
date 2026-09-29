import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StatTerm } from "@/components/learn/stat-term";
import { CareerPath } from "@/components/player/career-path";
import { ContractCard } from "@/components/player/contract-card";
import { InjuryCard } from "@/components/player/injury-card";
import { PlayerGames, type TeamLite } from "@/components/player/player-games";
import { PlayerHero } from "@/components/player/player-hero";
import { SeasonStats } from "@/components/player/season-stats";
import { decodePlayerId, getPlayer, getPlayerBundle } from "@/lib/data/player";
import { getDataFreshness } from "@/lib/data/freshness";
import { formatLongDate } from "@/lib/format";
import { gameColumns, statKindFor } from "@/lib/player-stats";

export const revalidate = 3600;

export async function generateMetadata({ params }: PageProps<"/players/[id]">): Promise<Metadata> {
  const player = await getPlayer(decodePlayerId((await params).id));
  if (!player) return { title: "Player not found" };
  const detail = [player.position, player.college].filter(Boolean).join(" · ");
  return {
    title: player.display_name,
    description: `${player.display_name}${detail ? ` (${detail})` : ""}: career path, season-by-season stats, game log, snap counts and contract explained.`,
  };
}

export default async function PlayerPage({ params }: PageProps<"/players/[id]">) {
  const id = decodePlayerId((await params).id);
  const { currentSeason, latestWeek, lastSyncedAt } = await getDataFreshness();
  const season = currentSeason ?? new Date().getFullYear();
  const bundle = await getPlayerBundle(id, season);
  if (!bundle) notFound();

  const { player, rosterSeasons, lines, snaps, awards, contract, injury, franchises, abbrs, stints, gameSeasons, defaultSeason, initialGames } = bundle;
  const currentFranchise = franchises.find((f) => f.id === player.current_franchise_id) ?? null;
  const lastStint = stints.at(-1) ?? null;
  const kind = statKindFor(player.position, player.position_group);
  const accent = currentFranchise?.color_primary ?? lastStint?.color ?? undefined;
  const contractTeam = franchises.find((f) => f.id === contract?.franchise_id)?.nickname ?? null;

  const teams: Record<string, TeamLite> = Object.fromEntries(
    franchises.map((f) => [f.id, { name: f.name, nickname: f.nickname, logoUrl: f.logo_url, color: f.color_primary }]),
  );
  // Column headers with glossary hover cards render here on the server and are handed to the client game log.
  const headers = Object.fromEntries(
    gameColumns(kind).map((col) => [
      col.id,
      col.statId ? (
        <StatTerm key={col.id} id={col.statId}>
          {col.label}
        </StatTerm>
      ) : (
        <abbr key={col.id} title={col.title} className="cursor-help">
          {col.label}
        </abbr>
      ),
    ]),
  );

  const showInjury = !!injury.entry || (!!currentFranchise && injury.latestWeek !== null);

  return (
    <div style={{ "--team": accent } as React.CSSProperties}>
      <PlayerHero
        player={player}
        currentFranchise={currentFranchise}
        lastStint={lastStint}
        awards={awards}
        franchises={franchises}
        currentSeason={season}
      />
      <div className="mx-auto w-full max-w-7xl space-y-14 px-4 py-10 sm:px-6">
        <CareerPath stints={stints} playerName={player.display_name} />
        <SeasonStats
          player={player}
          kind={kind}
          lines={lines}
          rosterSeasons={rosterSeasons}
          franchises={franchises}
          abbrs={abbrs}
          currentSeason={season}
        />
        <PlayerGames
          playerId={player.id}
          playerName={player.display_name}
          kind={kind}
          seasons={gameSeasons}
          initialSeason={defaultSeason}
          initialGames={initialGames}
          snapSeasons={snaps}
          teams={teams}
          headers={headers}
          firstSeason={player.first_season}
        />
        {(contract || showInjury) && (
          <div className={contract && showInjury ? "grid gap-10 lg:grid-cols-2" : undefined}>
            {contract && <ContractCard contract={contract} teamName={contractTeam} />}
            {showInjury && <InjuryCard status={injury} season={season} onRoster={!!currentFranchise} />}
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Stats and rosters from nflverse
          {latestWeek ? ` through Week ${latestWeek} of ${season}` : ""}
          {lastSyncedAt ? ` · synced ${formatLongDate(lastSyncedAt)}` : ""}. Contracts from OverTheCap via nflverse; headshots from the NFL.
        </p>
      </div>
    </div>
  );
}
