"use server";

import { spawn } from "node:child_process";
import { createServerClient } from "@/lib/supabase/server";
import { syncSecretMatches } from "@/lib/sync-secret";

export type SyncRequestState = { ok: boolean; message: string } | null;

const REPO = process.env.GITHUB_REPOSITORY ?? "jorelm68/gridiron-atlas";

/**
 * Starts a data sync. Deployed: dispatches the "Data sync" GitHub Action (needs GITHUB_DISPATCH_TOKEN with
 * actions:write). Local dev: runs `npm run sync` in the background. Guarded by SYNC_SECRET since there are no accounts.
 */
export async function requestSync(_previous: SyncRequestState, formData: FormData): Promise<SyncRequestState> {
  if (!syncSecretMatches(String(formData.get("secret") ?? ""))) {
    return { ok: false, message: "That update passphrase isn't right." };
  }
  const mode = formData.get("mode") === "full" ? "full" : "current";

  const { data: running } = await createServerClient()
    .from("sync_runs")
    .select("id")
    .eq("status", "running")
    .gte("started_at", new Date(Date.now() - 60 * 60 * 1000).toISOString())
    .limit(1);
  if (running?.length) return { ok: false, message: "An update is already running — hang tight." };

  const token = process.env.GITHUB_DISPATCH_TOKEN;
  if (token) {
    const res = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/sync.yml/dispatches`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ ref: "main", inputs: { mode } }),
    });
    if (!res.ok) return { ok: false, message: `GitHub refused the request (HTTP ${res.status}).` };
    return { ok: true, message: "Update started on GitHub Actions. It usually takes a few minutes." };
  }

  if (process.env.NODE_ENV === "development") {
    const args = ["run", "sync", "--", "--trigger", "button", ...(mode === "full" ? ["--full"] : [])];
    const isWindows = process.platform === "win32";
    // Fixed arguments only; Windows needs a shell to launch npm.cmd.
    spawn(isWindows ? "npm.cmd" : "npm", args, { cwd: process.cwd(), detached: true, stdio: "ignore", shell: isWindows }).unref();
    return { ok: true, message: "Update started on this machine. It usually takes under a minute." };
  }

  return { ok: false, message: "Updates aren't configured on this server (GITHUB_DISPATCH_TOKEN is missing)." };
}
