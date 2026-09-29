import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DivisionTable } from "@/components/team/division-table";
import { FranchiseTimeline } from "@/components/team/franchise-timeline";
import { FrontOfficeCard } from "@/components/team/front-office-card";
import { NotablePlayers } from "@/components/team/notable-players";
import { RosterGrid } from "@/components/team/roster-grid";
import { ScheduleList } from "@/components/team/schedule-list";
import { SeasonHistory } from "@/components/team/season-history";
import { StadiumCard } from "@/components/team/stadium-card";
import { TeamHero } from "@/components/team/team-hero";
import { TeamTabs } from "@/components/team/team-tabs";
import { getDataFreshness } from "@/lib/data/freshness";
import { getDivisionStandings, getNotablePlayers, getTeamOverview, getTeamRoster, getTeamSchedule } from "@/lib/data/team";
import { getFranchises } from "@/lib/data/teams";

export const revalidate = 3600;

export async function generateStaticParams() {
  return (await getFranchises()).map((f) => ({ id: f.id.toLowerCase() }));
}

export async function generateMetadata({ params }: PageProps<"/teams/[id]">): Promise<Metadata> {
  const overview = await getTeamOverview((await params).id);
  return { title: overview?.franchise.name ?? "Team" };
}

export default async function TeamPage({ params }: PageProps<"/teams/[id]">) {
  const { id } = await params;
  const [overview, { currentSeason }, franchises] = await Promise.all([
    getTeamOverview(id),
    getDataFreshness(),
    getFranchises(),
  ]);
  if (!overview) notFound();

  const franchiseId = overview.franchise.id;
  const season = currentSeason ?? new Date().getFullYear();
  const [schedule, roster, notable, standings] = await Promise.all([
    getTeamSchedule(franchiseId, season),
    getTeamRoster(franchiseId, season),
    getNotablePlayers(franchiseId),
    getDivisionStandings(overview.franchise.division_id, season),
  ]);
  const current = overview.seasons.find((s) => s.season === season) ?? null;
  const homeStint = overview.venueHistory[0];

  return (
    <div style={{ "--team": overview.franchise.color_primary ?? undefined } as React.CSSProperties}>
      <TeamHero overview={overview} current={current} />
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <TeamTabs
          panels={{
            overview: (
              <div className="space-y-10">
                <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                  {overview.homeVenue && <StadiumCard venue={overview.homeVenue} since={homeStint?.startSeason ?? null} />}
                  <div className="space-y-6">
                    {standings.length > 0 && (
                      <DivisionTable
                        divisionId={overview.franchise.division_id}
                        season={season}
                        rows={standings}
                        franchises={franchises}
                        highlightId={franchiseId}
                      />
                    )}
                    <FrontOfficeCard people={overview.frontOffice} />
                    <FranchiseTimeline eras={overview.eras} notes={overview.franchise.notes} />
                  </div>
                </div>
                <NotablePlayers hallOfFamers={notable.hallOfFamers} others={notable.others} teamName={overview.franchise.nickname} />
              </div>
            ),
            roster: <RosterGrid players={roster} season={season} />,
            schedule: <ScheduleList entries={schedule} season={season} />,
            history: <SeasonHistory overview={overview} currentSeason={season} />,
          }}
        />
      </div>
    </div>
  );
}
