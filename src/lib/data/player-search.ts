import "server-only";
import { createServerClient } from "@/lib/supabase/server";

export interface PlayerCardData {
  id: string;
  name: string;
  position: string | null;
  positionGroup: string | null;
  headshotUrl: string | null;
  /** Franchise shown on the card: the current team, or the filtered team for an all-time team search. */
  franchiseId: string | null;
  firstSeason: number | null;
  lastSeason: number | null;
  jersey: number | null;
  rosterStatus: string | null;
  isCurrent: boolean;
  isHof: boolean;
  proBowls: number | null;
  careerAv: number | null;
}

export interface PlayerQuery {
  q?: string;
  /** Franchise id ("DET"). Current scope: their roster now. All-time scope: everyone who ever played for them. */
  franchiseId?: string;
  /** QB, RB, WR, TE, OL, DL, LB, DB or SPEC. */
  group?: string;
  scope?: "current" | "all";
  limit?: number;
  offset?: number;
}

export const POSITION_GROUPS = ["QB", "RB", "WR", "TE", "OL", "DL", "LB", "DB", "SPEC"] as const;

/** Strips characters that act as wildcards or delimiters in PostgREST ilike filters. */
function nameTokens(q: string | undefined): string[] {
  return (q ?? "")
    .replace(/[%_*\\,()]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 4)
    .map((t) => t.slice(0, 30));
}

const CARD_COLUMNS =
  "id, display_name, position, position_group, headshot_url, current_franchise_id, first_season, last_season, jersey_number, roster_status, is_hof, pro_bowl_count, career_av";

/**
 * Notable-first player search over `players` (trigram-indexed name match), ordered by career value then recency.
 * Returns `limit` cards plus whether more exist (fetches one extra row).
 */
export async function searchPlayers(query: PlayerQuery): Promise<{ players: PlayerCardData[]; hasMore: boolean }> {
  const limit = Math.min(Math.max(query.limit ?? 24, 1), 48);
  const offset = Math.max(query.offset ?? 0, 0);
  const tokens = nameTokens(query.q);
  const group = query.group && (POSITION_GROUPS as readonly string[]).includes(query.group) ? query.group : undefined;
  const franchiseId = query.franchiseId?.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4) || undefined;
  const db = createServerClient();

  if (franchiseId && query.scope === "all") {
    // Everyone who ever rostered for the team, from the franchise_players view (one row per player per franchise).
    let request = db
      .from("franchise_players")
      .select("player_id, display_name, position, position_group, headshot_url, first_season, last_season, is_hof, pro_bowl_count, career_av")
      .eq("franchise_id", franchiseId);
    if (group) request = request.eq("position_group", group);
    for (const token of tokens) request = request.ilike("display_name", `%${token}%`);
    const { data, error } = await request
      .order("career_av", { ascending: false, nullsFirst: false })
      .order("last_season", { ascending: false })
      .range(offset, offset + limit);
    if (error) throw new Error(`Player search failed: ${error.message}`);
    const rows = data ?? [];
    return {
      hasMore: rows.length > limit,
      players: rows.slice(0, limit).map((r) => ({
        id: r.player_id ?? "",
        name: r.display_name ?? "",
        position: r.position,
        positionGroup: r.position_group,
        headshotUrl: r.headshot_url,
        franchiseId,
        firstSeason: r.first_season,
        lastSeason: r.last_season,
        jersey: null,
        rosterStatus: null,
        isCurrent: false,
        isHof: !!r.is_hof,
        proBowls: r.pro_bowl_count,
        careerAv: r.career_av,
      })),
    };
  }

  let request = db.from("players").select(CARD_COLUMNS);
  if (franchiseId) request = request.eq("current_franchise_id", franchiseId);
  else if (query.scope !== "all") request = request.not("current_franchise_id", "is", null);
  if (group) request = request.eq("position_group", group);
  for (const token of tokens) request = request.ilike("display_name", `%${token}%`);
  const { data, error } = await request
    .order("career_av", { ascending: false, nullsFirst: false })
    .order("last_season", { ascending: false })
    .order("display_name")
    .range(offset, offset + limit);
  if (error) throw new Error(`Player search failed: ${error.message}`);
  const rows = data ?? [];
  return {
    hasMore: rows.length > limit,
    players: rows.slice(0, limit).map((r) => ({
      id: r.id,
      name: r.display_name,
      position: r.position,
      positionGroup: r.position_group,
      headshotUrl: r.headshot_url,
      franchiseId: r.current_franchise_id,
      firstSeason: r.first_season,
      lastSeason: r.last_season,
      jersey: r.jersey_number,
      rosterStatus: r.roster_status,
      isCurrent: r.current_franchise_id !== null,
      isHof: r.is_hof,
      proBowls: r.pro_bowl_count,
      careerAv: r.career_av,
    })),
  };
}

/** Total players in the database (for the index header). */
export async function getPlayerCount(): Promise<number> {
  const { count, error } = await createServerClient().from("players").select("id", { count: "exact", head: true });
  if (error) throw new Error(`Counting players failed: ${error.message}`);
  return count ?? 0;
}
