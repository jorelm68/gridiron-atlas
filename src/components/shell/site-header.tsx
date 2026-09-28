import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/brand/logo";
import { getFranchises } from "@/lib/data/teams";
import { CommandSearch } from "./command-search";
import { FreshnessPill } from "./freshness-pill";
import { MobileNav } from "./mobile-nav";
import { NavLinks } from "./nav-links";
import { ThemeToggle } from "./theme-toggle";

export async function SiteHeader() {
  const teams = (await getFranchises()).map((f) => ({
    id: f.id,
    name: f.name,
    division: f.division_id,
    logoUrl: f.logo_url,
    color: f.color_primary,
  }));

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <MobileNav />
        <Link href="/" className="flex items-center gap-2 rounded-md" aria-label="Gridiron Atlas home">
          <Logo className="size-7" />
          <span className="font-display text-lg font-bold tracking-wide uppercase">Gridiron Atlas</span>
        </Link>
        <NavLinks className="ml-4 hidden md:flex" />
        <div className="ml-auto flex items-center gap-1.5">
          <Suspense>
            <FreshnessPill />
          </Suspense>
          <CommandSearch teams={teams} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
