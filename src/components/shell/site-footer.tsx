import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/70">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-2">
          <Logo className="size-5" />
          <span>Gridiron Atlas — a learning tool. Not affiliated with the NFL or its teams.</span>
        </div>
        <p>
          <Link className="underline-offset-4 hover:underline" href="/data">
            Data & updates
          </Link>{" "}
          · Data:{" "}
          <a className="underline-offset-4 hover:underline" href="https://github.com/nflverse" target="_blank" rel="noreferrer">
            nflverse
          </a>{" "}
          (CC BY 4.0) · Photos & bios:{" "}
          <a className="underline-offset-4 hover:underline" href="https://commons.wikimedia.org" target="_blank" rel="noreferrer">
            Wikimedia
          </a>{" "}
          · Logos & headshots © their owners
        </p>
      </div>
    </footer>
  );
}
