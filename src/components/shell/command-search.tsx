"use client";

import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { TeamLogo } from "@/components/team/team-logo";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { NAV_ITEMS } from "@/lib/nav";
import { teamHref } from "@/lib/routes";

export interface SearchTeam {
  id: string;
  name: string;
  division: string;
  logoUrl: string | null;
  color: string | null;
}

const noopSubscribe = () => () => {};

/** ⌘K / Ctrl+K palette for jumping to any page or team. */
export function CommandSearch({ teams }: { teams: SearchTeam[] }) {
  const [open, setOpen] = useState(false);
  const isMac = useSyncExternalStore(noopSubscribe, () => /Mac|iPhone|iPad/.test(navigator.platform), () => false);
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        data-tour="search"
        className="gap-2 text-muted-foreground"
        aria-label="Search"
      >
        <SearchIcon />
        <span className="hidden lg:inline">Search</span>
        <KbdGroup className="hidden lg:inline-flex">
          <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen} title="Search Gridiron Atlas" description="Jump to a team or page">
        <CommandInput placeholder="Search teams and pages…" />
        <CommandList>
          <CommandEmpty>No matches.</CommandEmpty>
          <CommandGroup heading="Pages">
            {NAV_ITEMS.map((item) => (
              <CommandItem key={item.href} value={`page ${item.label}`} onSelect={() => go(item.href)}>
                {item.label}
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandGroup heading="Teams">
            {teams.map((team) => (
              <CommandItem
                key={team.id}
                value={`${team.name} ${team.id} ${team.division}`}
                onSelect={() => go(teamHref(team.id))}
              >
                <TeamLogo name={team.name} abbr={team.id} logoUrl={team.logoUrl} color={team.color} size={20} />
                {team.name}
                <span className="ml-auto text-xs text-muted-foreground">{team.division}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
