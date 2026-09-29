import type { NextRequest } from "next/server";
import { searchPlayers } from "@/lib/data/player-search";

/** Players index: name search plus team / position-group / current-vs-all-time filters, paginated by offset. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const num = (key: string) => {
    const value = Number(params.get(key));
    return Number.isFinite(value) ? value : undefined;
  };
  try {
    const result = await searchPlayers({
      q: params.get("q") ?? undefined,
      franchiseId: params.get("team") ?? undefined,
      group: params.get("group") ?? undefined,
      scope: params.get("scope") === "all" ? "all" : "current",
      limit: num("limit"),
      offset: num("offset"),
    });
    return Response.json(result, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } });
  } catch {
    return Response.json({ players: [], hasMore: false, error: "Search is unavailable right now." }, { status: 500 });
  }
}
