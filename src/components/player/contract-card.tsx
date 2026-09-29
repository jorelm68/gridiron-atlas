import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { Explainer } from "@/components/learn/explainer";
import type { Tables } from "@/lib/supabase/database.types";
import { formatMillions } from "@/lib/format";
import { leagueTopicHref } from "@/lib/routes";

/** The player's active contract: length, total value, average per year, guaranteed money, and share of the cap. */
export function ContractCard({ contract, teamName }: { contract: Tables<"contracts">; teamName: string | null }) {
  const total = contract.value_millions;
  const guaranteed = contract.guaranteed_millions;
  const guaranteedShare = total && guaranteed !== null ? Math.min(1, guaranteed / total) : null;

  const tiles = [
    contract.years !== null && {
      label: "Length",
      value: `${contract.years} yr${contract.years === 1 ? "" : "s"}`,
      note: contract.year_signed ? `Signed ${contract.year_signed}` : undefined,
    },
    total !== null && { label: "Total value", value: formatMillions(total), note: undefined },
    contract.apy_millions !== null && { label: "Per year (APY)", value: formatMillions(contract.apy_millions), note: undefined },
    guaranteed !== null && {
      label: "Guaranteed",
      value: formatMillions(guaranteed),
      note: guaranteedShare !== null ? `${Math.round(guaranteedShare * 100)}% of the total` : undefined,
    },
    contract.apy_cap_pct !== null && {
      label: "Share of the cap",
      value: `${(contract.apy_cap_pct * 100).toFixed(1)}%`,
      note: "APY vs. the cap when signed",
    },
  ].filter(Boolean) as { label: string; value: string; note?: string }[];

  return (
    <section aria-labelledby="contract" data-tour="player-contract">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 id="contract" className="text-3xl font-semibold">
          Contract
        </h2>
        {teamName && <p className="text-sm text-muted-foreground">Active deal with the {teamName}</p>}
      </div>
      <div className="space-y-4 rounded-2xl border bg-card p-5">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
          {tiles.map((tile) => (
            <div key={tile.label} className="min-w-0">
              <dt className="eyebrow text-muted-foreground">{tile.label}</dt>
              <dd className="mt-1 font-display text-3xl leading-none font-semibold tabular-nums">{tile.value}</dd>
              {tile.note && <dd className="mt-1 text-xs text-muted-foreground">{tile.note}</dd>}
            </div>
          ))}
        </dl>
        {guaranteedShare !== null && (
          <div>
            <div
              className="flex h-2.5 overflow-hidden rounded-full bg-muted"
              role="img"
              aria-label={`${Math.round(guaranteedShare * 100)}% of the contract's total value is guaranteed`}
            >
              <div className="rounded-full bg-primary" style={{ width: `${guaranteedShare * 100}%` }} />
            </div>
            <p className="mt-1.5 flex justify-between text-xs text-muted-foreground">
              <span>Guaranteed</span>
              <span>Not guaranteed</span>
            </p>
          </div>
        )}
      </div>
      <Explainer title="Headline value vs. guaranteed money" className="mt-3">
        <p>
          <strong>Total value</strong> is the number in the headline, but only the <strong>guaranteed</strong> part is
          truly owed if the team cuts him. <strong>APY</strong> (average per year) divides the total by the years so
          deals of different lengths compare fairly, and <strong>share of the cap</strong> shows how much of the
          league&apos;s salary cap that average takes up.
        </p>
        <Link href={leagueTopicHref("salary-cap")} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
          How the salary cap works <ArrowRightIcon className="size-3.5" aria-hidden="true" />
        </Link>
      </Explainer>
    </section>
  );
}
