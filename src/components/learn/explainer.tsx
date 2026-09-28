import { LightbulbIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** A short "why this matters" callout used across pages to teach league mechanics in context. */
export function Explainer({
  title,
  children,
  className,
  ...rest
}: { title: string; children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLElement>) {
  return (
    <aside className={cn("rounded-xl border border-primary/25 bg-primary/[0.06] p-4 text-sm", className)} {...rest}>
      <p className="mb-1.5 flex items-center gap-2 font-medium text-foreground">
        <LightbulbIcon className="size-4 text-primary" aria-hidden="true" />
        {title}
      </p>
      <div className="space-y-2 leading-relaxed text-muted-foreground">{children}</div>
    </aside>
  );
}
