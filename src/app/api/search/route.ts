import type { NextRequest } from "next/server";
import { searchPlayers } from "@/lib/data/player-search";

/** ⌘K quick search: up to 8 players matching a name, notable players first. */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return Response.json({ players: [] });
  try {
    const { players } = await searchPlayers({ q, scope: "all", limit: 8 });
    return Response.json(
      {
        players: players.map((p) => ({
          id: p.id,
          name: p.name,
          position: p.position,
          teamId: p.franchiseId,
          headshotUrl: p.headshotUrl,
          firstSeason: p.firstSeason,
          lastSeason: p.lastSeason,
        })),
      },
      { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } },
    );
  } catch {
    return Response.json({ players: [], error: "Search is unavailable right now." }, { status: 500 });
  }
}
