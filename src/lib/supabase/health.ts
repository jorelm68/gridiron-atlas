import "server-only";

export type CheckState = "ok" | "missing" | "failed";

export interface SetupCheck {
  label: string;
  state: CheckState;
  detail: string;
}

const envVars = [
  { name: "NEXT_PUBLIC_SUPABASE_URL", label: "Project URL" },
  { name: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", label: "Publishable key" },
  { name: "SUPABASE_SECRET_KEY", label: "Secret key (server only)" },
] as const;

/** Calls the Supabase auth health endpoint, which requires a valid API key. */
async function probe(url: string, key: string): Promise<Omit<SetupCheck, "label">> {
  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/auth/v1/health`, {
      headers: { apikey: key },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) return { state: "ok", detail: `Supabase accepted the key (HTTP ${res.status})` };
    if (res.status === 401 || res.status === 403) {
      return { state: "failed", detail: `Supabase rejected the key (HTTP ${res.status})` };
    }
    return { state: "failed", detail: `Unexpected response (HTTP ${res.status})` };
  } catch {
    return { state: "failed", detail: `Could not reach ${url}` };
  }
}

export async function getSetupChecks(): Promise<SetupCheck[]> {
  const checks: SetupCheck[] = envVars.map(({ name, label }) => ({
    label,
    state: process.env[name] ? "ok" : "missing",
    detail: process.env[name] ? `${name} is set` : `Add ${name} to .env.local`,
  }));

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secret = process.env.SUPABASE_SECRET_KEY;

  const [publicProbe, secretProbe] = await Promise.all([
    url && publishable ? probe(url, publishable) : null,
    url && secret ? probe(url, secret) : null,
  ]);

  checks.push({
    label: "Public API connection",
    ...(publicProbe ?? { state: "missing", detail: "Needs the project URL and publishable key" }),
  });
  checks.push({
    label: "Server API connection",
    ...(secretProbe ?? { state: "missing", detail: "Needs the project URL and secret key" }),
  });

  return checks;
}
