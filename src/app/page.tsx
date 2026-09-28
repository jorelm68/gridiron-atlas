import { connection } from "next/server";
import { getSetupChecks, type CheckState } from "@/lib/supabase/health";

const badges: Record<CheckState, { text: string; className: string }> = {
  ok: { text: "Ready", className: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30" },
  missing: { text: "Missing", className: "bg-amber-500/15 text-amber-300 ring-amber-500/30" },
  failed: { text: "Failed", className: "bg-rose-500/15 text-rose-300 ring-rose-500/30" },
};

// Temporary home page until the Atlas lands in Phase 1: confirms Supabase is wired up.
export default async function SetupStatusPage() {
  await connection();
  const checks = await getSetupChecks();
  const allReady = checks.every((check) => check.state === "ok");

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-10 px-4 py-16">
      <header className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-sky-400">Gridiron Atlas</p>
        <h1 className="text-4xl font-semibold tracking-tight text-balance">Setup status</h1>
        <p className="text-zinc-400">
          Checks that the app can reach your Supabase project. Values come from{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[0.9em]">.env.local</code>.
        </p>
      </header>

      <ul className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.03]">
        {checks.map((check) => {
          const badge = badges[check.state];
          return (
            <li key={check.label} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <p className="font-medium">{check.label}</p>
                <p className="truncate text-sm text-zinc-400">{check.detail}</p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${badge.className}`}
              >
                {badge.text}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="text-sm text-zinc-400">
        {allReady
          ? "Supabase is connected. Next up: the database schema and data sync (Phase 0)."
          : "Follow the Setup section in README.md, then refresh this page."}
      </p>
    </main>
  );
}
