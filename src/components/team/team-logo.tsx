"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface TeamLogoProps {
  name: string;
  abbr: string;
  logoUrl: string | null;
  color?: string | null;
  size?: number;
  className?: string;
  priority?: boolean;
}

/** Team logo from the ESPN CDN, falling back to a monogram in the team color if it fails to load. */
export function TeamLogo({ name, abbr, logoUrl, color, size = 40, className, priority }: TeamLogoProps) {
  const [failed, setFailed] = useState(false);

  if (!logoUrl || failed) {
    return (
      <span
        role="img"
        aria-label={`${name} logo`}
        className={cn("inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold text-white", className)}
        style={{ width: size, height: size, fontSize: size * 0.36, backgroundColor: color ?? "var(--muted)" }}
      >
        {abbr}
      </span>
    );
  }

  return (
    <Image
      src={logoUrl}
      alt={`${name} logo`}
      width={size}
      height={size}
      priority={priority}
      onError={() => setFailed(true)}
      className={cn("shrink-0 object-contain", className)}
      style={{ width: size, height: size }}
    />
  );
}
