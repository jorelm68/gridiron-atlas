"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { TeamLogo } from "@/components/team/team-logo";
import { formatRecord } from "@/lib/format";
import { teamHref } from "@/lib/routes";
import { cn } from "@/lib/utils";

export interface ExplorerTeam {
  id: string;
  name: string;
  location: string;
  nickname: string;
  conference: "AFC" | "NFC";
  division: string;
  divisionName: string;
  color: string | null;
  logoUrl: string | null;
  record: { wins: number; losses: number; ties: number } | null;
  divRank: number | null;
}

const CONFERENCES = [
  { id: "AFC", name: "American Football Conference", accent: "text-afc", bar: "bg-afc" },
  { id: "NFC", name: "National Football Conference", accent: "text-nfc", bar: "bg-nfc" },
] as const;
const DIVISION_ORDER = ["East", "North", "South", "West"];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

/** Two conferences → four divisions each → four teams each, with current records. */
export function LeagueExplorer({ teams, season }: { teams: ExplorerTeam[]; season: number | null }) {
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {CONFERENCES.map((conf) => (
        <section key={conf.id} aria-labelledby={`conf-${conf.id}`} data-tour={`conference-${conf.id.toLowerCase()}`}>
          <header className="mb-4 flex items-baseline gap-3">
            <span className={cn("h-6 w-1.5 self-center rounded-full", conf.bar)} aria-hidden="true" />
            <h2 id={`conf-${conf.id}`} className={cn("text-3xl font-bold", conf.accent)}>
              {conf.id}
            </h2>
            <span className="text-sm text-muted-foreground">{conf.name}</span>
          </header>
          <motion.div className="grid gap-4 sm:grid-cols-2" variants={container} initial="hidden" animate="show">
            {DIVISION_ORDER.map((divisionName) => {
              const divisionTeams = teams
                .filter((t) => t.conference === conf.id && t.divisionName === divisionName)
                .sort((a, b) => (a.divRank ?? 9) - (b.divRank ?? 9) || a.name.localeCompare(b.name));
              const divisionId = `${conf.id} ${divisionName}`;
              return (
                <motion.div
                  key={divisionId}
                  variants={item}
                  className="rounded-2xl border bg-card/60 p-3"
                  data-tour={divisionId === "NFC North" ? "division-nfc-north" : undefined}
                >
                  <h3 className="eyebrow mb-2 px-2 text-muted-foreground">{divisionId}</h3>
                  <ul className="space-y-1">
                    {divisionTeams.map((team) => (
                      <li key={team.id}>
                        <TeamRow team={team} season={season} />
                      </li>
                    ))}
                  </ul>
                </motion.div>
              );
            })}
          </motion.div>
        </section>
      ))}
    </div>
  );
}

function TeamRow({ team, season }: { team: ExplorerTeam; season: number | null }) {
  return (
    <Link
      href={teamHref(team.id)}
      className="group relative flex items-center gap-3 overflow-hidden rounded-xl px-2 py-2 transition-colors hover:bg-accent"
      style={{ "--team": team.color ?? undefined } as React.CSSProperties}
    >
      <span
        className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-team opacity-0 transition-opacity group-hover:opacity-100"
        aria-hidden="true"
      />
      <TeamLogo
        name={team.name}
        abbr={team.id}
        logoUrl={team.logoUrl}
        color={team.color}
        size={36}
        className="transition-transform duration-300 ease-out-expo group-hover:scale-110"
      />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs text-muted-foreground">{team.location}</span>
        <span className="block truncate font-display text-lg leading-tight font-semibold">{team.nickname}</span>
      </span>
      {team.record && (
        <span className="text-right">
          <span className="block font-display text-lg leading-tight font-semibold tabular-nums">
            {formatRecord(team.record.wins, team.record.losses, team.record.ties)}
          </span>
          <span className="block text-[11px] text-muted-foreground">{season}</span>
        </span>
      )}
    </Link>
  );
}
