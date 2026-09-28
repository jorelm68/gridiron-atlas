import { pruneStale, recordSource, upsertRows } from "../lib/db";
import { readSeed } from "../lib/seeds";
import type { Dataset } from "../lib/types";

interface SuperBowlSeed {
  number: number;
  roman: string;
  season: number;
  date: string;
  winner: string;
  loser: string;
  winner_name: string;
  loser_name: string;
  winner_score: number;
  loser_score: number;
  venue: string;
  city: string | null;
  state: string | null;
  mvp: string | null;
  mvp_position: string | null;
  mvp_team: string | null;
}

const FIRST_GAME_SEASON = 1999;

/** Every Super Bowl (curated seed, current franchise codes) linked to its `game_rows` row from 1999+. */
export const superBowls: Dataset = {
  id: "super-bowls",
  description: "Every Super Bowl (curated) linked to its game",
  dependsOn: ["games"],
  async run(ctx) {
    const seed = readSeed<SuperBowlSeed[]>("super-bowls.json");

    const gameIds = new Map(
      (
        await ctx.duck.all<{ season: number; id: string }>(
          `select season::integer as season, id from game_rows where game_type = 'SB'`,
        )
      ).map((g) => [g.season, g.id]),
    );

    const rows = seed.map((sb) => ({
      number: sb.number,
      roman: sb.roman,
      season: sb.season,
      played_on: sb.date,
      winner_franchise_id: sb.winner,
      loser_franchise_id: sb.loser,
      winner_name: sb.winner_name,
      loser_name: sb.loser_name,
      winner_score: sb.winner_score,
      loser_score: sb.loser_score,
      venue_name: sb.venue,
      city: sb.city,
      state: sb.state,
      mvp_name: sb.mvp,
      mvp_position: sb.mvp_position,
      mvp_franchise_id: sb.mvp_team,
      game_id: sb.season >= FIRST_GAME_SEASON ? (gameIds.get(sb.season) ?? null) : null,
    }));

    await upsertRows(ctx, "super_bowls", rows, "number");
    await pruneStale(ctx, "super_bowls");

    await recordSource(ctx, {
      id: "curated.super_bowls",
      name: "Curated Super Bowl results",
      url: "https://github.com/jorelm68/gridiron-atlas/tree/main/data/seed",
      coverage: `Super Bowls I–${seed[seed.length - 1]?.roman ?? ""} (1966–${seed[seed.length - 1]?.season ?? ""} seasons)`,
    });
  },
};
