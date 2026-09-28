import { TeamLogo } from "@/components/team/team-logo";
import type { TeamOverview, TeamSeason } from "@/lib/data/team";
import { formatRecord, ordinal } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Team page header: logo, name, identity line, and a row of headline facts, tinted with the team color. */
export function TeamHero({ overview, current }: { overview: TeamOverview; current: TeamSeason | null }) {
  const { franchise, homeVenue, superBowls, seasons, frontOffice } = overview;
  const titles = superBowls.filter((sb) => sb.winner_franchise_id === franchise.id).length;
  const playoffTrips = seasons.filter((s) => s.playoff_result).length;
  const coach = frontOffice.find((p) => p.role === "head_coach")?.person_name ?? current?.head_coach ?? null;
  const conferenceClass = franchise.conference_id === "AFC" ? "text-afc" : "text-nfc";

  const facts = [
    current && {
      label: `${current.season} record`,
      value: formatRecord(current.wins, current.losses, current.ties),
      note: current.div_rank ? `${ordinal(current.div_rank)} in ${franchise.division_id}` : undefined,
    },
    { label: "Super Bowl titles", value: String(titles), note: superBowls.length ? `${superBowls.length} appearances` : "No appearances yet" },
    { label: "Playoff trips", value: String(playoffTrips), note: `since ${seasons[0]?.season ?? 1999}` },
    coach && { label: "Head coach", value: coach, note: undefined },
  ].filter(Boolean) as { label: string; value: string; note?: string }[];

  return (
    <section
      className="relative overflow-hidden border-b"
      style={{ "--team": franchise.color_primary ?? undefined } as React.CSSProperties}
      data-tour="team-hero"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(60rem 30rem at 15% -10%, color-mix(in oklch, var(--team) 45%, transparent), transparent 70%)",
        }}
        aria-hidden="true"
      />
      <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 pt-10 pb-8 sm:px-6 md:flex-row md:items-end">
        <TeamLogo
          name={franchise.name}
          abbr={franchise.id}
          logoUrl={franchise.logo_url}
          color={franchise.color_primary}
          size={128}
          priority
          className="drop-shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
        />
        <div className="min-w-0 flex-1">
          <p className="eyebrow text-muted-foreground">
            <span className={cn("font-bold", conferenceClass)}>{franchise.conference_id}</span> · {franchise.division_id} · Est.{" "}
            {franchise.founded_season}
          </p>
          <h1 className="mt-2 text-5xl leading-none font-bold sm:text-7xl">
            <span className="block text-2xl font-semibold text-muted-foreground sm:text-3xl">{franchise.location}</span>
            {franchise.nickname}
          </h1>
          {homeVenue && (
            <p className="mt-3 text-sm text-muted-foreground">
              Home: {homeVenue.name}
              {homeVenue.city ? ` · ${homeVenue.city}${homeVenue.region ? `, ${homeVenue.region}` : ""}` : ""}
            </p>
          )}
        </div>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-4 md:grid-cols-4" data-tour="team-facts">
          {facts.map((fact) => (
            <div key={fact.label} className="min-w-0">
              <dt className="eyebrow text-muted-foreground">{fact.label}</dt>
              <dd className="mt-1 truncate font-display text-3xl leading-none font-semibold tabular-nums">{fact.value}</dd>
              {fact.note && <dd className="mt-1 text-xs text-muted-foreground">{fact.note}</dd>}
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
