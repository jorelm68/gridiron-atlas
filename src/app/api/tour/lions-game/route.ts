import { createServerClient } from "@/lib/supabase/server";
import { gameHref } from "@/lib/routes";

/**
 * The guided tour's Games chapter shows a real Lions game. Rather than hardcode an id, it asks here for the
 * most recent completed Lions game (any season, playoffs included).
 */
export async function GET() {
  const { data, error } = await createServerClient()
    .from("games")
    .select("id")
    .or("home_franchise_id.eq.DET,away_franchise_id.eq.DET")
    .not("home_score", "is", null)
    .order("gameday", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return Response.json({ error: "No completed Lions game found." }, { status: 404 });
  return Response.json(
    { id: data.id, href: gameHref(data.id) },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } },
  );
}
