import Link from "next/link";
import type { TeamOverview } from "@/lib/data/team";
import { leagueTopicHref } from "@/lib/routes";

const ROLES = [
  { role: "owner", label: "Owner" },
  { role: "president", label: "President / CEO" },
  { role: "general_manager", label: "General manager" },
  { role: "head_coach", label: "Head coach" },
  { role: "offensive_coordinator", label: "Offensive coordinator" },
  { role: "defensive_coordinator", label: "Defensive coordinator" },
  { role: "special_teams_coordinator", label: "Special teams coordinator" },
] as const;

/** Who runs the team, top to bottom — the franchise org chart in one card. */
export function FrontOfficeCard({ people }: { people: TeamOverview["frontOffice"] }) {
  if (people.length === 0) return null;
  return (
    <article className="rounded-2xl border bg-card p-5" data-tour="team-front-office">
      <p className="eyebrow text-muted-foreground">Who runs the team</p>
      <h3 className="mb-3 text-2xl font-semibold">Front office & coaches</h3>
      <dl className="divide-y text-sm">
        {ROLES.flatMap(({ role, label }) =>
          people
            .filter((p) => p.role === role)
            .map((p) => (
              <div key={`${role}-${p.person_name}`} className="flex items-baseline justify-between gap-4 py-2">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="text-right">
                  <span className="font-medium">{p.person_name}</span>
                  {p.since_season && <span className="text-muted-foreground"> · since {p.since_season}</span>}
                </dd>
              </div>
            )),
        )}
      </dl>
      <Link
        href={leagueTopicHref("franchise-structure")}
        className="mt-3 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        What each role does →
      </Link>
    </article>
  );
}
