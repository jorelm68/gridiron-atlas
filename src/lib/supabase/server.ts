import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { nodeRealtimeOptions } from "./node-transport";

// The app has no user accounts, so there is never a session to persist or refresh.
const noSession = { persistSession: false, autoRefreshToken: false };

function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing ${name}. Copy .env.example to .env.local and fill it in.`);
  return value;
}

/** Read-only client for Server Components and route handlers. Respects row level security. */
export function createServerClient() {
  return createClient<Database>(
    required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    { auth: noSession, ...nodeRealtimeOptions },
  );
}

/** Privileged client for route handlers that write (e.g. the update button). Bypasses RLS — server code only. */
export function createAdminClient() {
  return createClient<Database>(
    required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    required("SUPABASE_SECRET_KEY", process.env.SUPABASE_SECRET_KEY),
    { auth: noSession, ...nodeRealtimeOptions },
  );
}
