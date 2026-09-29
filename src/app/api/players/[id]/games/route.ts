import type { NextRequest } from "next/server";
import { decodePlayerId, getSeasonGames } from "@/lib/data/player";

/** One season of a player's games (stat line + snap counts per game), fetched when the season picker changes. */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/players/[id]/games">) {
  const { id } = await ctx.params;
  const season = Number(request.nextUrl.searchParams.get("season"));
  if (!Number.isInteger(season) || season < 1920 || season > 2100) {
    return Response.json({ error: "A valid season is required." }, { status: 400 });
  }
  try {
    const games = await getSeasonGames(decodePlayerId(id), season);
    return Response.json({ season, games }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
  } catch {
    return Response.json({ error: "Couldn't load games." }, { status: 500 });
  }
}
