import type { Metadata } from "next";
import { LeagueExplorer, type ExplorerTeam } from "@/components/league/league-explorer";
import { Explainer } from "@/components/learn/explainer";
import { getDataFreshness } from "@/lib/data/freshness";
import { getFranchises, getTeamSeasons } from "@/lib/data/teams";

export const revalidate = 3600;
export const metadata: Metadata = { title: "Teams" };

export default async function TeamsPage() {
  const [franchises, { currentSeason }] = await Promise.all([getFranchises(), getDataFreshness()]);
  const seasons = currentSeason ? await getTeamSeasons(currentSeason) : new Map();

  const teams: ExplorerTeam[] = franchises.map((f) => {
    const record = seasons.get(f.id);
    return {
      id: f.id,
      name: f.name,
      location: f.location,
      nickname: f.nickname,
      conference: f.conference_id,
      division: f.division_id,
      divisionName: f.division_name,
      color: f.color_primary,
      logoUrl: f.logo_url,
      record: record ? { wins: record.wins, losses: record.losses, ties: record.ties } : null,
      divRank: record?.div_rank ?? null,
    };
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <header className="mb-8 grid gap-6 lg:grid-cols-[1fr_24rem] lg:items-end">
        <div>
          <p className="eyebrow mb-3 text-primary">League structure</p>
          <h1 className="text-5xl font-bold text-balance sm:text-6xl">32 teams · 2 conferences · 8 divisions</h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Every NFL team belongs to one of two conferences — the AFC or the NFC — and within its conference to one
            of four divisions named for a compass direction. Teams are listed in their division&apos;s current order.
          </p>
        </div>
        <Explainer title="Why divisions matter" data-tour="teams-explainer">
          <p>
            A division is a team&apos;s closest rivalry group. Each team plays its three division rivals twice a season
            (6 of its 17 games), and winning the division guarantees a playoff spot.
          </p>
          <p>
            The conferences meet only in the Super Bowl — the AFC champion plays the NFC champion.
          </p>
        </Explainer>
      </header>
      <LeagueExplorer teams={teams} season={currentSeason} />
    </div>
  );
}
