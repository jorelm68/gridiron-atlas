"use client";

import { Loader2Icon, SearchIcon, XIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { PlayerCard, type CardTeam } from "@/components/player/player-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { PlayerCardData } from "@/lib/data/player-search";

export interface BrowserTeam extends CardTeam {
  id: string;
  division: string;
}

interface Filters {
  q: string;
  team: string;
  group: string;
  scope: "current" | "all";
}

const GROUPS = [
  { value: "", label: "All" },
  { value: "QB", label: "QB" },
  { value: "RB", label: "RB" },
  { value: "WR", label: "WR" },
  { value: "TE", label: "TE" },
  { value: "OL", label: "OL" },
  { value: "DL", label: "DL" },
  { value: "LB", label: "LB" },
  { value: "DB", label: "DB" },
  { value: "SPEC", label: "K/P" },
] as const;

const PAGE = 24;

/** Searchable, filterable player grid. Starts with the server-rendered default and refetches as filters change. */
export function PlayerBrowser({
  initial,
  teams,
}: {
  initial: { players: PlayerCardData[]; hasMore: boolean };
  teams: BrowserTeam[];
}) {
  const [filters, setFilters] = useState<Filters>({ q: "", team: "", group: "", scope: "current" });
  const [players, setPlayers] = useState(initial.players);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const timer = useRef<number | undefined>(undefined);
  const controller = useRef<AbortController | null>(null);
  const teamById = new Map(teams.map((t) => [t.id, t]));

  // Cancel any pending debounce or request when the page unmounts.
  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      controller.current?.abort();
    },
    [],
  );

  async function run(next: Filters, offset = 0) {
    controller.current?.abort();
    const request = new AbortController();
    controller.current = request;
    setStatus("loading");
    const params = new URLSearchParams({ scope: next.scope, limit: String(PAGE), offset: String(offset) });
    if (next.q.trim().length >= 2) params.set("q", next.q.trim());
    if (next.team) params.set("team", next.team);
    if (next.group) params.set("group", next.group);
    try {
      const response = await fetch(`/api/players?${params}`, { signal: request.signal });
      if (!response.ok) throw new Error(String(response.status));
      const data = (await response.json()) as { players: PlayerCardData[]; hasMore: boolean };
      setPlayers((current) => (offset > 0 ? [...current, ...data.players] : data.players));
      setHasMore(data.hasMore);
      setStatus("idle");
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      setStatus("error");
    }
  }

  function update(patch: Partial<Filters>, debounce = false) {
    const next = { ...filters, ...patch };
    setFilters(next);
    window.clearTimeout(timer.current);
    // A single character is too broad to search (names are matched on trigrams); wait for a second.
    if (next.q.trim().length === 1) return;
    if (debounce) timer.current = window.setTimeout(() => void run(next), 250);
    else void run(next);
  }

  const searching = filters.q.trim().length >= 2;
  const teamName = filters.team ? teamById.get(filters.team)?.nickname : null;
  const heading = searching
    ? `Matches for “${filters.q.trim()}”`
    : filters.scope === "current"
      ? teamName
        ? `${teamName} roster`
        : "Notable current players"
      : teamName
        ? `All-time ${teamName}`
        : "Notable players, all time";

  return (
    <div className="space-y-5">
      <div className="space-y-3 rounded-2xl border bg-card/60 p-4" data-tour="players-search">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              type="text"
              value={filters.q}
              onChange={(e) => update({ q: e.target.value }, true)}
              placeholder="Search players by name — try “St. Brown”"
              aria-label="Search players by name"
              autoComplete="off"
              spellCheck={false}
              className="h-10 pr-9 pl-9 text-base"
            />
            {filters.q && (
              <button
                type="button"
                onClick={() => update({ q: "" })}
                aria-label="Clear search"
                className="absolute top-1/2 right-2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <XIcon className="size-4" />
              </button>
            )}
          </div>
          <select
            value={filters.team}
            onChange={(e) => update({ team: e.target.value })}
            aria-label="Filter by team"
            className="h-10 rounded-lg border border-input bg-card px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:w-56"
          >
            <option value="">All teams</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            spacing={1}
            value={filters.group}
            onValueChange={(value) => update({ group: value })}
            aria-label="Filter by position group"
            className="flex-wrap"
          >
            {GROUPS.map((g) => (
              <ToggleGroupItem key={g.value || "all"} value={g.value} aria-label={g.value ? `${g.label} position group` : "All positions"} className="font-display tracking-wide">
                {g.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            spacing={1}
            value={filters.scope}
            onValueChange={(value) => value && update({ scope: value as Filters["scope"] })}
            aria-label="Current players or all time"
          >
            <ToggleGroupItem value="current">Current players</ToggleGroupItem>
            <ToggleGroupItem value="all">All time</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-2xl font-semibold">{heading}</h2>
        <p className="flex items-center gap-2 text-sm text-muted-foreground" role="status" aria-live="polite">
          {status === "loading" && <Loader2Icon className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />}
          {status === "error" ? "Couldn’t load players" : `${players.length}${hasMore ? "+" : ""} shown`}
        </p>
      </div>

      {players.length === 0 && status !== "loading" ? (
        <div className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
          {status === "error" ? (
            <>
              Something went wrong.{" "}
              <button type="button" className="font-medium text-primary underline-offset-4 hover:underline" onClick={() => void run(filters)}>
                Try again
              </button>
            </>
          ) : (
            <>
              No players match those filters.
              {filters.scope === "current" && " Retired and former players only show under All time."}
            </>
          )}
        </div>
      ) : (
        <ul
          className={`grid gap-3 transition-opacity sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${status === "loading" ? "opacity-60" : ""}`}
          aria-busy={status === "loading"}
        >
          {players.map((player) => {
            const team = player.franchiseId ? (teamById.get(player.franchiseId) ?? null) : null;
            return (
              <li key={player.id}>
                <PlayerCard player={player} team={team} tenureNote={filters.scope === "all" && teamName ? `with ${teamName}` : undefined} />
              </li>
            );
          })}
        </ul>
      )}

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => void run(filters, players.length)} disabled={status === "loading"}>
            Show more players
          </Button>
        </div>
      )}
    </div>
  );
}
