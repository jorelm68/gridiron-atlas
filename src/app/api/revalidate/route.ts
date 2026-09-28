import { revalidatePath } from "next/cache";
import { syncSecretMatches } from "@/lib/sync-secret";

/** Called by the data sync when it finishes so cached pages pick up the new data immediately. */
export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!syncSecretMatches(token)) return Response.json({ ok: false }, { status: 401 });
  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}
