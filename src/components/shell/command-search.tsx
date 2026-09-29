"use client";

import { SearchIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { PlayerAvatar } from "@/components/player/player-avatar";
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
import { formatSeasonSpan } from "@/lib/format";
import { playerHref, teamHref } from "@/lib/routes";

export interface SearchTeam {
  id: string;
  name: string;
  division: string;
  logoUrl: string | null;
  color: string | null;
}

interface SearchPlayer {
  id: string;
  name: string;
  position: string | null;
  teamId: string | null;
  headshotUrl: string | null;
  firstSeason: number | null;
  lastSeason: number | null;
}

const noopSubscribe = () => () => {};

/** ⌘K / Ctrl+K palette for jumping to any page, team, or player. */
export function CommandSearch({ teams }: { teams: SearchTeam[] }) {
  const [open, setOpen] = useState(false);
  const [players, setPlayers] = useState<SearchPlayer[]>([]);
  const [searching, setSearching] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const controller = useRef<AbortController | null>(null);
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

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      controller.current?.abort();
    },
    [],
  );

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const resetPlayers = () => {
    window.clearTimeout(timer.current);
    controller.current?.abort();
    setPlayers([]);
    setSearching(false);
  };

  /** Debounced player lookup: names are matched server-side, so only ask once there's something worth matching. */
  const onQueryChange = (value: string) => {
    const query = value.trim();
    resetPlayers();
    if (query.length < 2) return;
    setSearching(true);
    timer.current = window.setTimeout(async () => {
      const request = new AbortController();
      controller.current = request;
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: request.signal });
        const data = response.ok ? ((await response.json()) as { players: SearchPlayer[] }) : { players: [] };
        setPlayers(data.players);
        setSearching(false);
      } catch (error) {
        if ((error as Error).name !== "AbortError") setSearching(false);
      }
    }, 200);
  };

  const teamById = new Map(teams.map((t) => [t.id, t]));

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
      <CommandDialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) resetPlayers();
        }}
        title="Search Gridiron Atlas"
        description="Jump to a player, team or page"
      >
        <CommandInput placeholder="Search players, teams and pages…" onValueChange={onQueryChange} />
        <CommandList>
          {!searching && players.length === 0 && <CommandEmpty>No matches.</CommandEmpty>}
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
          {searching && <p className="px-3 py-2 text-xs text-muted-foreground">Searching players…</p>}
          {players.length > 0 && (
            <CommandGroup heading="Players" forceMount>
              {players.map((player) => {
                const team = player.teamId ? teamById.get(player.teamId) : undefined;
                return (
                  // forceMount: these rows come from the server's name match, so cmdk's own filter must not hide them.
                  <CommandItem key={player.id} value={`player ${player.id} ${player.name}`} forceMount onSelect={() => go(playerHref(player.id))}>
                    <PlayerAvatar name={player.name} headshotUrl={player.headshotUrl} size={24} />
                    <span className="truncate">{player.name}</span>
                    <span className="ml-auto flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                      {player.position}
                      {team ? (
                        <TeamLogo name={team.name} abbr={team.id} logoUrl={team.logoUrl} color={team.color} size={16} />
                      ) : player.firstSeason && player.lastSeason ? (
                        <span className="tabular-nums">{formatSeasonSpan(player.firstSeason, player.lastSeason)}</span>
                      ) : null}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
