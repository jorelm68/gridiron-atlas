import type { Metadata } from "next";
import { AtlasExperience } from "@/components/atlas/atlas-experience";
import { getAtlasTeams } from "@/lib/data/atlas";
import { getDataFreshness } from "@/lib/data/freshness";

export const revalidate = 3600;
export const metadata: Metadata = { title: "The Atlas" };

export default async function HomePage() {
  const [teams, { currentSeason, latestWeek }] = await Promise.all([getAtlasTeams(), getDataFreshness()]);

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-4 py-8 sm:px-6">
      <p className="eyebrow mb-3 text-primary">The Atlas</p>
      <h1 className="max-w-3xl text-5xl font-bold text-balance sm:text-6xl">Where every NFL team plays</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">
        A 3D map of every stadium in the league — hover a beam for the team, click or tap for the full picture.
      </p>
      <AtlasExperience teams={teams} currentSeason={currentSeason} latestWeek={latestWeek} />
    </div>
  );
}
