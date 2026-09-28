import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

// Placeholder home until the 3D Atlas map lands (Phase 1).
export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-4 py-24 sm:px-6">
      <p className="eyebrow mb-4 text-primary">Gridiron Atlas</p>
      <h1 className="max-w-3xl text-6xl font-bold text-balance sm:text-7xl">Learn the NFL, one team at a time.</h1>
      <p className="mt-5 max-w-xl text-lg text-muted-foreground">
        Every team, stadium, player, and stat — mapped, explained, and quizzable.
      </p>
      <div className="mt-8 flex gap-3">
        <Button asChild size="lg">
          <Link href="/teams">
            Explore the teams <ArrowRightIcon />
          </Link>
        </Button>
      </div>
    </div>
  );
}
