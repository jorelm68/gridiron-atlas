import { Skeleton } from "@/components/ui/skeleton";

/** Fallback while the Three.js canvas (client-only) loads. Matches the map's rounded frame so there's no layout shift. */
export function MapSkeleton() {
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-3xl border bg-muted/40">
      <Skeleton className="absolute inset-0 rounded-none" />
      <p className="eyebrow relative text-muted-foreground">Loading the map…</p>
    </div>
  );
}
