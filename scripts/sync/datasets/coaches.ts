import { pruneStale, recordSource, upsertRows } from "../lib/db";
import { readSeed } from "../lib/seeds";
import type { Dataset } from "../lib/types";

interface HeadCoachSeed {
  franchise: string;
  coach: string;
  from: number;
  to: number | null;
  interim: boolean;
  regular: { w: number; l: number; t: number } | null;
  playoff: { w: number; l: number } | null;
  note: string | null;
}

interface FrontOfficeSeed {
  franchise: string;
  role: string;
  person: string;
  since: number | null;
  note: string | null;
  source_url: string;
}

/** Date the curated front-office seed was last verified against team sources. */
const FRONT_OFFICE_VERIFIED_ON = "2026-09-28";

/** Every head coach in franchise history plus current front offices, from curated seeds (data/seed). */
export const coaches: Dataset = {
  id: "coaches",
  description: "All-time head coaches and current front offices (curated)",
  dependsOn: ["reference"],
  async run(ctx) {
    const headCoaches = readSeed<HeadCoachSeed[]>("head-coaches.json");
    const byKey = new Map(
      headCoaches.map((c) => [
        `${c.franchise}|${c.coach}|${c.from}`,
        {
          franchise_id: c.franchise,
          coach_name: c.coach,
          start_season: c.from,
          end_season: c.to,
          regular_wins: c.regular?.w ?? null,
          regular_losses: c.regular?.l ?? null,
          regular_ties: c.regular?.t ?? null,
          playoff_wins: c.playoff?.w ?? null,
          playoff_losses: c.playoff?.l ?? null,
          is_interim: c.interim,
          note: c.note,
        },
      ]),
    );
    await upsertRows(ctx, "head_coaches", [...byKey.values()], "franchise_id,coach_name,start_season");
    await pruneStale(ctx, "head_coaches");

    const frontOffice = readSeed<FrontOfficeSeed[]>("front-office.json").map((p) => ({
      franchise_id: p.franchise,
      role: p.role,
      person_name: p.person,
      since_season: p.since,
      note: p.note,
      source_url: p.source_url,
      verified_on: FRONT_OFFICE_VERIFIED_ON,
    }));
    await upsertRows(ctx, "front_office", frontOffice, "franchise_id,role,person_name");
    await pruneStale(ctx, "front_office");

    await recordSource(ctx, {
      id: "curated.coaches",
      name: "Curated head-coach history and front offices",
      url: "https://github.com/jorelm68/gridiron-atlas/tree/main/data/seed",
      coverage: `${byKey.size} head-coach tenures; front offices verified ${FRONT_OFFICE_VERIFIED_ON}`,
    });
  },
};
