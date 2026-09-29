import type { Metadata } from "next";
import { Explainer } from "@/components/learn/explainer";
import { StatTerm } from "@/components/learn/stat-term";
import { PlayerBrowser, type BrowserTeam } from "@/components/player/player-browser";
import { getPlayerCount, searchPlayers } from "@/lib/data/player-search";
import { getFranchises } from "@/lib/data/teams";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: "Players",
  description: "Search every NFL player since 1920 — current stars, Hall of Famers, and everyone in between.",
};

export default async function PlayersPage() {
  const [franchises, initial, total] = await Promise.all([
    getFranchises(),
    searchPlayers({ scope: "current", limit: 24 }),
    getPlayerCount(),
  ]);
  const teams: BrowserTeam[] = franchises
    .toSorted((a, b) => a.name.localeCompare(b.name))
    .map((f) => ({ id: f.id, name: f.name, nickname: f.nickname, logoUrl: f.logo_url, color: f.color_primary, division: f.division_id }));

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <header className="mb-8 grid gap-6 lg:grid-cols-[1fr_24rem] lg:items-end">
        <div>
          <p className="eyebrow mb-3 text-primary">Every player since 1920</p>
          <h1 className="text-5xl font-bold text-balance sm:text-6xl">{total.toLocaleString("en-US")} players, one search box</h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Search by name, or narrow by team and position group. Each player page traces his career path across teams, breaks
            down his stats in plain language, and shows how much he plays and what he&apos;s paid.
          </p>
        </div>
        <Explainer title="How results are ordered" data-tour="players-explainer">
          <p>
            Players are sorted by career value: <StatTerm id="approximate-value">Approximate Value (AV)</StatTerm> rolls a
            whole career into one number so stars rise to the top no matter their position.
          </p>
          <p>Detailed game stats start in 1999; older players still have a page with their teams, draft position, and honors.</p>
        </Explainer>
      </header>
      <PlayerBrowser initial={initial} teams={teams} />
    </div>
  );
}
