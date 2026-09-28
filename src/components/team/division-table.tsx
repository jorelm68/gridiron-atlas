import Link from "next/link";
import { TeamLogo } from "@/components/team/team-logo";
import type { FranchiseSummary } from "@/lib/data/teams";
import { formatRecord } from "@/lib/format";
import { teamHref } from "@/lib/routes";
import { cn } from "@/lib/utils";

interface StandingRow {
  franchise_id: string;
  wins: number;
  losses: number;
  ties: number;
  div_rank: number | null;
  div_wins: number;
  div_losses: number;
  div_ties: number;
  points_for: number;
  points_against: number;
}

/** Division standings for one season, highlighting the current team. */
export function DivisionTable({
  divisionId,
  season,
  rows,
  franchises,
  highlightId,
}: {
  divisionId: string;
  season: number;
  rows: StandingRow[];
  franchises: FranchiseSummary[];
  highlightId: string;
}) {
  const byId = new Map(franchises.map((f) => [f.id, f]));
  return (
    <article className="rounded-2xl border bg-card p-5" data-tour="team-division">
      <p className="eyebrow text-muted-foreground">{season} standings</p>
      <h3 className="mb-3 text-2xl font-semibold">{divisionId}</h3>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted-foreground">
            <th scope="col" className="pb-2 font-medium">Team</th>
            <th scope="col" className="pb-2 text-right font-medium">W–L</th>
            <th scope="col" className="pb-2 text-right font-medium" title="Record against division rivals">Div</th>
            <th scope="col" className="pb-2 text-right font-medium" title="Point differential: points scored minus points allowed">+/−</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const team = byId.get(row.franchise_id);
            const diff = row.points_for - row.points_against;
            return (
              <tr key={row.franchise_id} className={cn("border-t", row.franchise_id === highlightId && "bg-accent/60")}>
                <td className="py-2">
                  <Link href={teamHref(row.franchise_id)} className="flex items-center gap-2 hover:underline">
                    <TeamLogo
                      name={team?.name ?? row.franchise_id}
                      abbr={row.franchise_id}
                      logoUrl={team?.logo_url ?? null}
                      color={team?.color_primary}
                      size={22}
                    />
                    <span className="font-medium">{team?.nickname ?? row.franchise_id}</span>
                  </Link>
                </td>
                <td className="py-2 text-right tabular-nums">{formatRecord(row.wins, row.losses, row.ties)}</td>
                <td className="py-2 text-right text-muted-foreground tabular-nums">
                  {formatRecord(row.div_wins, row.div_losses, row.div_ties)}
                </td>
                <td className={cn("py-2 text-right tabular-nums", diff > 0 ? "text-win" : diff < 0 ? "text-loss" : "")}>
                  {diff > 0 ? `+${diff}` : diff}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </article>
  );
}
