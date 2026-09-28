"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

/** Player headshot with an initials fallback (old-era players and broken CDN links). */
export function PlayerAvatar({
  name,
  headshotUrl,
  size = 48,
  className,
}: {
  name: string;
  headshotUrl: string | null;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const base = cn("shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border", className);

  if (!headshotUrl || failed) {
    return (
      <span
        role="img"
        aria-label={name}
        className={cn(base, "inline-flex items-center justify-center font-display font-semibold text-muted-foreground")}
        style={{ width: size, height: size, fontSize: size * 0.36 }}
      >
        {initials(name)}
      </span>
    );
  }
  return (
    <span className={cn(base, "inline-block")} style={{ width: size, height: size }}>
      <Image
        src={headshotUrl}
        alt={name}
        width={size * 2}
        height={size * 2}
        onError={() => setFailed(true)}
        className="size-full object-cover object-top"
      />
    </span>
  );
}
