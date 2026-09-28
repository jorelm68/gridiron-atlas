"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS, isActivePath } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function NavLinks({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary" className={cn("items-center gap-1", className)} data-tour="nav">
      {NAV_ITEMS.map(({ href, label }) => {
        const active = isActivePath(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId="nav-active"
                className="absolute inset-0 -z-10 rounded-md bg-accent"
                transition={{ type: "spring", stiffness: 420, damping: 36 }}
              />
            )}
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
