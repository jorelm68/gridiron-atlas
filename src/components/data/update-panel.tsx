"use client";

import { LoaderCircleIcon, RefreshCwIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { requestSync, type SyncRequestState } from "@/app/data/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/** Passphrase-protected "Update data" control; polls sync_runs until the started run finishes, then refreshes. */
export function UpdatePanel({ latestRunId }: { latestRunId: number | null }) {
  const [state, formAction, pending] = useActionState<SyncRequestState, FormData>(requestSync, null);
  const [mode, setMode] = useState("current");
  const [finished, setFinished] = useState<string | null>(null);
  const router = useRouter();
  const waiting = state?.ok === true && !finished;

  useEffect(() => {
    if (!waiting) return;
    const timer = setInterval(async () => {
      const { data } = await getBrowserClient()
        .from("sync_runs")
        .select("id, status")
        .gt("id", latestRunId ?? 0)
        .order("id", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data && data.status !== "running") {
        setFinished(data.status === "succeeded" ? `Run #${data.id} finished.` : `Run #${data.id} failed — see history below.`);
        router.refresh();
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [waiting, latestRunId, router]);

  return (
    <form action={formAction} className="space-y-4" data-tour="data-update">
      <div className="space-y-2">
        <p className="text-sm font-medium">What to refresh</p>
        <ToggleGroup type="single" variant="outline" value={mode} onValueChange={(v) => v && setMode(v)}>
          <ToggleGroupItem value="current">This season</ToggleGroupItem>
          <ToggleGroupItem value="full">Everything (slow)</ToggleGroupItem>
        </ToggleGroup>
        <input type="hidden" name="mode" value={mode} />
      </div>
      <div className="space-y-2">
        <label htmlFor="sync-secret" className="text-sm font-medium">
          Update passphrase
        </label>
        <Input id="sync-secret" name="secret" type="password" autoComplete="off" required placeholder="SYNC_SECRET" />
      </div>
      <Button type="submit" disabled={pending || waiting} className="w-full">
        {pending || waiting ? <LoaderCircleIcon className="animate-spin" /> : <RefreshCwIcon />}
        {waiting ? "Updating…" : "Update data"}
      </Button>
      {(finished ?? state?.message) && (
        <p role="status" className={cn("text-sm", state?.ok ? "text-muted-foreground" : "text-destructive")}>
          {finished ?? state?.message}
        </p>
      )}
    </form>
  );
}
