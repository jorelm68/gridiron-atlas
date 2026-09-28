import { cn } from "@/lib/utils";

/** Gridiron Atlas mark: a field with yard lines and a map pin at midfield. */
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("shrink-0", className)}>
      <rect x="2" y="6" width="28" height="20" rx="4" className="fill-primary/15 stroke-primary" strokeWidth="1.6" />
      {[9, 13, 19, 23].map((x) => (
        <line key={x} x1={x} y1="9" x2={x} y2="23" className="stroke-primary/45" strokeWidth="1" />
      ))}
      <path
        d="M16 9.5c-2.2 0-3.9 1.7-3.9 3.8 0 2.9 3.9 7.2 3.9 7.2s3.9-4.3 3.9-7.2c0-2.1-1.7-3.8-3.9-3.8Z"
        className="fill-primary"
      />
      <circle cx="16" cy="13.3" r="1.4" className="fill-background" />
    </svg>
  );
}
