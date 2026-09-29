import { AwardIcon, StarIcon } from "lucide-react";
import Link from "next/link";
import { StatTerm } from "@/components/learn/stat-term";
import { PlayerAvatar } from "@/components/player/player-avatar";
import { TeamLogo } from "@/components/team/team-logo";
import { AWARD_NAME, draftLine, type AwardChip, type Player, type Stint } from "@/lib/data/player";
import type { FranchiseSummary } from "@/lib/data/teams";
import { ageFromDate, formatHeight, formatLongDate, formatSeasonSpan } from "@/lib/format";
import { leagueTopicHref, teamHref } from "@/lib/routes";
import { cn } from "@/lib/utils";

const POSITION_NAME: Record<string, string> = {
  QB: "Quarterback",
  RB: "Running back",
  FB: "Fullback",
  WR: "Wide receiver",
  TE: "Tight end",
  OT: "Offensive tackle",
  G: "Guard",
  C: "Center",
  OL: "Offensive lineman",
  DE: "Defensive end",
  DT: "Defensive tackle",
  NT: "Nose tackle",
  DL: "Defensive lineman",
  LB: "Linebacker",
  OLB: "Outside linebacker",
  ILB: "Inside linebacker",
  MLB: "Middle linebacker",
  CB: "Cornerback",
  S: "Safety",
  FS: "Free safety",
  SS: "Strong safety",
  SAF: "Safety",
  DB: "Defensive back",
  K: "Kicker",
  P: "Punter",
  LS: "Long snapper",
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  RES: { label: "Injured reserve", className: "bg-loss/15 text-loss" },
  DEV: { label: "Practice squad", className: "bg-primary/15 text-primary" },
  INA: { label: "Inactive", className: "bg-muted text-muted-foreground" },
  EXE: { label: "Exempt list", className: "bg-muted text-muted-foreground" },
};

interface PlayerHeroProps {
  player: Player;
  currentFranchise: FranchiseSummary | null;
  lastStint: Stint | null;
  awards: AwardChip[];
  franchises: FranchiseSummary[];
  currentSeason: number;
}

/** Where the player stands today: on a team, a free agent, or retired. */
function availability(player: Player, currentSeason: number): string {
  if (player.roster_status === "RET") return "Retired";
  if (player.last_season !== null && player.last_season >= currentSeason)
    return player.roster_status === "CUT" ? "Free agent" : `Not on a ${currentSeason} roster`;
  if (player.last_season === currentSeason - 1) return `Not on a ${currentSeason} roster`;
  return "Retired";
}

/** Player page header: headshot, name and team, bio facts, draft line, honors — tinted with the team color. */
export function PlayerHero({ player, currentFranchise, lastStint, awards, franchises, currentSeason }: PlayerHeroProps) {
  const [first, ...rest] = player.display_name.split(" ");
  const last = rest.join(" ");
  const isCurrent = currentFranchise !== null;
  const status = isCurrent && player.roster_status ? STATUS_BADGE[player.roster_status] : undefined;
  const positionName = player.position ? (POSITION_NAME[player.position] ?? player.position) : null;
  const ageOrBorn = player.birth_date
    ? isCurrent
      ? { label: "Age", value: String(ageFromDate(player.birth_date)), note: `Born ${formatLongDate(player.birth_date)}` }
      : { label: "Born", value: formatLongDate(player.birth_date), note: undefined }
    : null;
  const experience = isCurrent
    ? player.years_exp === 0
      ? "Rookie"
      : player.years_exp
        ? `${player.years_exp} yr${player.years_exp === 1 ? "" : "s"}`
        : null
    : player.seasons_played
      ? `${player.seasons_played} season${player.seasons_played === 1 ? "" : "s"}`
      : null;

  const facts = [
    ageOrBorn,
    player.height_in ? { label: "Height", value: formatHeight(player.height_in), note: undefined } : null,
    player.weight_lb ? { label: "Weight", value: `${player.weight_lb} lb`, note: undefined } : null,
    player.college ? { label: "College", value: player.college, note: undefined } : null,
    experience ? { label: "Experience", value: experience, note: player.first_season ? `Since ${player.first_season}` : undefined } : null,
  ].filter(Boolean) as { label: string; value: string; note?: string }[];

  const honors = [
    player.pro_bowl_count !== null && { label: "Pro Bowls", value: player.pro_bowl_count },
    player.all_pro_count !== null && { label: "All-Pro", value: player.all_pro_count },
  ].filter(Boolean) as { label: string; value: number }[];

  const teamLine = currentFranchise ? (
    <Link href={teamHref(currentFranchise.id)} className="group inline-flex items-center gap-2 rounded-md font-medium">
      <TeamLogo name={currentFranchise.name} abbr={currentFranchise.id} logoUrl={currentFranchise.logo_url} color={currentFranchise.color_primary} size={32} />
      <span className="underline-offset-4 group-hover:underline">{currentFranchise.name}</span>
    </Link>
  ) : lastStint && !lastStint.defunct && lastStint.franchiseId ? (
    <Link href={teamHref(lastStint.franchiseId)} className="group inline-flex items-center gap-2 rounded-md font-medium">
      <TeamLogo name={lastStint.name} abbr={lastStint.franchiseId} logoUrl={lastStint.logoUrl} color={lastStint.color} size={28} />
      <span className="underline-offset-4 group-hover:underline">{lastStint.name}</span>
    </Link>
  ) : lastStint ? (
    <span className="font-medium">{lastStint.name}</span>
  ) : null;

  return (
    <section className="relative overflow-hidden border-b" data-tour="player-hero">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background: "radial-gradient(60rem 30rem at 15% -10%, color-mix(in oklch, var(--team) 45%, transparent), transparent 70%)",
        }}
        aria-hidden="true"
      />
      {player.jersey_number !== null && player.jersey_number > 0 && (
        <span
          className="pointer-events-none absolute -top-6 right-6 hidden font-display text-[15rem] leading-none font-bold text-team opacity-[0.07] select-none lg:block"
          aria-hidden="true"
        >
          {player.jersey_number}
        </span>
      )}
      <div className="relative mx-auto flex max-w-7xl flex-col gap-8 px-4 pt-10 pb-8 sm:px-6 md:flex-row md:items-end">
        <PlayerAvatar
          name={player.display_name}
          headshotUrl={player.headshot_url}
          size={160}
          className="bg-[color-mix(in_oklch,var(--team)_28%,var(--card))] shadow-[0_10px_30px_rgba(0,0,0,0.3)] ring-2 ring-[color-mix(in_oklch,var(--team)_65%,transparent)]"
        />
        <div className="min-w-0 flex-1">
          <p className="eyebrow text-muted-foreground">
            {positionName ?? "Player"}
            {player.jersey_number !== null && player.jersey_number > 0 && <> · #{player.jersey_number}</>}
            {player.first_season && player.last_season && <> · {formatSeasonSpan(player.first_season, player.last_season)}</>}
          </p>
          <h1 className="mt-2 text-5xl leading-none font-bold sm:text-7xl">
            {last ? (
              <>
                <span className="block text-2xl font-semibold text-muted-foreground sm:text-3xl">{first}</span>
                {last}
              </>
            ) : (
              player.display_name
            )}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {teamLine ? (
              <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">
                {!isCurrent && <span className="text-muted-foreground">{availability(player, currentSeason)} · last team</span>}
                {teamLine}
                {!isCurrent && lastStint && (
                  <span className="text-muted-foreground tabular-nums">({formatSeasonSpan(lastStint.startSeason, lastStint.endSeason)})</span>
                )}
              </span>
            ) : (
              <span className="text-muted-foreground">{availability(player, currentSeason)}</span>
            )}
            {status && (
              <Link href={leagueTopicHref("roster-statuses")} className={cn("rounded px-2 py-0.5 text-xs font-medium", status.className)}>
                {status.label}
              </Link>
            )}
          </div>

          {(player.is_hof || awards.length > 0) && (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Honors">
              {player.is_hof && (
                <li className="inline-flex items-center gap-1.5 rounded-full bg-chart-3/20 px-3 py-1 text-xs font-semibold">
                  <StarIcon className="size-3.5 fill-chart-3 text-chart-3" aria-hidden="true" />
                  Hall of Fame{player.hof_class ? ` · Class of ${player.hof_class}` : ""}
                </li>
              )}
              {awards.map((a) => (
                <li
                  key={a.award}
                  title={AWARD_NAME[a.award] ?? a.award}
                  className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium"
                >
                  <AwardIcon className="size-3.5 text-primary" aria-hidden="true" />
                  {a.seasons.length === 1 ? `${a.seasons[0]} ${a.award}` : `${a.seasons.length}× ${a.award} · ${a.seasons.join(", ")}`}
                </li>
              ))}
            </ul>
          )}

          <dl className="mt-6 grid grid-cols-2 gap-x-8 gap-y-4 sm:grid-cols-3 lg:grid-cols-5">
            {facts.map((fact) => (
              <div key={fact.label} className="min-w-0">
                <dt className="eyebrow text-muted-foreground">{fact.label}</dt>
                <dd className="mt-1 font-display text-2xl leading-tight font-semibold tabular-nums text-balance">
                  {fact.value}
                </dd>
                {fact.note && <dd className="mt-1 text-xs text-muted-foreground">{fact.note}</dd>}
              </div>
            ))}
            <div className="col-span-2 min-w-0 sm:col-span-3 lg:col-span-5">
              <dt className="eyebrow text-muted-foreground">Draft</dt>
              <dd className="mt-1 font-display text-2xl leading-none font-semibold">{draftLine(player, franchises)}</dd>
            </div>
          </dl>
        </div>

        {(honors.length > 0 || player.career_av !== null) && (
          <div data-tour="player-honors" className="md:text-right">
            <dl className="grid grid-cols-3 gap-x-8 gap-y-3 md:grid-cols-1">
            {honors.map((h) => (
              <div key={h.label}>
                <dt className="eyebrow text-muted-foreground">{h.label}</dt>
                <dd className="mt-1 font-display text-4xl leading-none font-semibold tabular-nums">{h.value}</dd>
              </div>
            ))}
            {player.career_av !== null && (
              <div>
                <dt className="eyebrow text-muted-foreground">
                  <StatTerm id="approximate-value">Career AV</StatTerm>
                </dt>
                <dd className="mt-1 font-display text-4xl leading-none font-semibold tabular-nums">{player.career_av}</dd>
              </div>
            )}
            </dl>
            <p className="mt-3 text-[11px] text-muted-foreground">Honors and AV cover players drafted since 1980.</p>
          </div>
        )}
      </div>
    </section>
  );
}
