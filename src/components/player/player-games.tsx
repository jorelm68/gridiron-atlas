"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Explainer } from "@/components/learn/explainer";
import { PercentBars, type BarDatum } from "@/components/player/percent-bars";
import { TeamLogo } from "@/components/team/team-logo";
import { formatShortDate } from "@/lib/format";
import {
  POSTSEASON_LABEL,
  formatCell,
  gameColumns,
  primaryUnit,
  type GameLogRow,
  type SeasonSnaps,
  type SnapUnit,
  type StatKind,
} from "@/lib/player-stats";
import { gameHref } from "@/lib/routes";
import { cn } from "@/lib/utils";

export interface TeamLite {
  name: string;
  nickname: string;
  logoUrl: string | null;
  color: string | null;
}

interface PlayerGamesProps {
  playerId: string;
  playerName: string;
  kind: StatKind;
  /** Seasons that have game-level data, oldest first. */
  seasons: number[];
  initialSeason: number | null;
  initialGames: GameLogRow[];
  snapSeasons: SeasonSnaps[];
  teams: Record<string, TeamLite>;
  /** Server-rendered column headers (glossary hover cards) keyed by stat column id. */
  headers: Record<string, React.ReactNode>;
  /** Whether the game log's start (1999) and snap counts' start (2013) apply, for honest empty states. */
  firstSeason: number | null;
}

const UNIT_LABEL: Record<SnapUnit, string> = { offense: "offensive", defense: "defensive", st: "special-teams" };
const UNIT_SHORT: Record<SnapUnit, string> = { offense: "Offense", defense: "Defense", st: "Special teams" };

function unitFigures(snaps: NonNullable<GameLogRow["snaps"]>, unit: SnapUnit) {
  return unit === "offense"
    ? { count: snaps.offense, pct: snaps.offensePct }
    : unit === "defense"
      ? { count: snaps.defense, pct: snaps.defensePct }
      : { count: snaps.st, pct: snaps.stPct };
}

function seasonFigures(s: SeasonSnaps, unit: SnapUnit) {
  return unit === "offense"
    ? { count: s.offenseSnaps, pct: s.offensePct }
    : unit === "defense"
      ? { count: s.defenseSnaps, pct: s.defensePct }
      : { count: s.stSnaps, pct: s.stPct };
}

const roundLabel = (game: GameLogRow) => (game.gameType === "REG" ? `Wk ${game.week}` : (POSTSEASON_LABEL[game.gameType] ?? game.gameType));
const shortRound = (game: GameLogRow) => (game.gameType === "REG" ? `W${game.week}` : game.gameType);

/** The game log and snap-count sections, sharing one season picker; other seasons load on demand. */
export function PlayerGames({
  playerId,
  playerName,
  kind,
  seasons,
  initialSeason,
  initialGames,
  snapSeasons,
  teams,
  headers,
  firstSeason,
}: PlayerGamesProps) {
  const router = useRouter();
  const [season, setSeason] = useState<number | null>(initialSeason);
  const [cache, setCache] = useState<Record<number, GameLogRow[]>>(initialSeason ? { [initialSeason]: initialGames } : {});
  const [failed, setFailed] = useState<Record<number, boolean>>({});

  const games = season ? cache[season] : undefined;
  const loading = season !== null && games === undefined && !failed[season];
  const columns = gameColumns(kind);

  async function load(target: number) {
    setFailed((f) => ({ ...f, [target]: false }));
    try {
      const response = await fetch(`/api/players/${encodeURIComponent(playerId)}/games?season=${target}`);
      if (!response.ok) throw new Error(String(response.status));
      const data = (await response.json()) as { games: GameLogRow[] };
      setCache((c) => ({ ...c, [target]: data.games }));
    } catch {
      setFailed((f) => ({ ...f, [target]: true }));
    }
  }

  function select(target: number) {
    setSeason(target);
    if (!(target in cache)) void load(target);
  }

  const picker = (label: string) =>
    seasons.length > 0 &&
    season !== null && (
    <label className="flex items-center gap-2 text-sm text-muted-foreground">
      Season
      <select
        aria-label={label}
        value={season}
        onChange={(e) => select(Number(e.target.value))}
        className="h-8 rounded-lg border border-input bg-card px-2.5 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {seasons.toReversed().map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </label>
  );

  /* ------------------------------------------------------------ snaps */
  const seasonSnap = season ? snapSeasons.find((s) => s.season === season) : undefined;
  const gameUnit: SnapUnit | null = seasonSnap ? primaryUnit(seasonSnap) : null;
  const snapGames = (games ?? []).filter((g) => g.snaps !== null);

  const seasonBars: BarDatum[] = snapSeasons.map((s) => {
    const unit = primaryUnit(s);
    const { count, pct } = seasonFigures(s, unit);
    const others = (["offense", "defense", "st"] as SnapUnit[])
      .filter((u) => u !== unit)
      .map((u) => ({ unit: u, ...seasonFigures(s, u) }))
      .filter((o) => o.count > 0 && o.pct !== null)
      .map((o) => `${UNIT_SHORT[o.unit]} ${o.pct}%`);
    return {
      key: String(s.season),
      label: String(s.season),
      value: pct,
      title: `${s.season}`,
      detail: `${pct ?? "—"}% of ${UNIT_LABEL[unit]} snaps · ${count.toLocaleString("en-US")} snaps in ${s.games} games${others.length ? ` · also ${others.join(", ")}` : ""}`,
    };
  });

  const gameBars: BarDatum[] =
    gameUnit === null
      ? []
      : snapGames.map((g) => {
          const { count, pct } = unitFigures(g.snaps!, gameUnit);
          const opponent = g.opponentId ? teams[g.opponentId]?.nickname : null;
          return {
            key: g.gameId,
            label: shortRound(g),
            value: pct,
            title: `${roundLabel(g)} ${g.neutral ? "vs" : g.home ? "vs" : "@"} ${opponent ?? g.opponentAbbr}`,
            detail: count ? `${count} ${UNIT_LABEL[gameUnit]} snaps · ${pct ?? "—"}% of the team's` : "Did not play this unit",
          };
        });

  return (
    <>
      {/* -------------------------------------------------------------- game log */}
      <section aria-labelledby="gamelog" data-tour="player-gamelog">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="gamelog" className="text-3xl font-semibold">
              Game log
            </h2>
            {games && games.length > 0 && (
              <p className="mt-1 text-sm text-muted-foreground">
                {season} · {games.length} game{games.length === 1 ? "" : "s"} · click a row for the full game
              </p>
            )}
          </div>
          {picker("Game log season")}
        </div>

        {seasons.length === 0 ? (
          <EmptyCard>
            Game logs start in 1999, and he didn&apos;t play in that window
            {firstSeason && firstSeason < 1999 ? ` (his career began in ${firstSeason})` : ""}. His team timeline and honors are above.
          </EmptyCard>
        ) : failed[season ?? 0] ? (
          <EmptyCard>
            Couldn&apos;t load {season}.{" "}
            <button type="button" className="font-medium text-primary underline-offset-4 hover:underline" onClick={() => season && void load(season)}>
              Try again
            </button>
          </EmptyCard>
        ) : loading ? (
          <div className="space-y-2 rounded-2xl border bg-card p-4" aria-busy="true" aria-label="Loading games">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-8 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : games && games.length === 0 ? (
          <EmptyCard>No games on record for {season}.</EmptyCard>
        ) : (
          games && (
            <GameTable
              games={games}
              columns={columns}
              headers={headers}
              kind={kind}
              teams={teams}
              onOpen={(id) => router.push(gameHref(id))}
            />
          )
        )}
      </section>

      {/* -------------------------------------------------------------- snaps */}
      <section aria-labelledby="snaps" data-tour="player-snaps">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="snaps" className="text-3xl font-semibold">
              How much he plays
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">Share of his team&apos;s snaps, 2013 onward</p>
          </div>
          {picker("Snap counts season")}
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-6">
            {snapSeasons.length === 0 ? (
              <EmptyCard>
                Snap counts start in 2013
                {firstSeason && firstSeason < 2013 ? `, so ${playerName.split(" ")[0]}'s earlier seasons don't have usage data` : ""}.
                {seasons.length > 0 ? " He has no snap data in that window." : ""}
              </EmptyCard>
            ) : (
              <>
                <div className="rounded-2xl border bg-card p-5">
                  <PercentBars
                    data={seasonBars}
                    caption="Snap share by season · click a bar to open that season"
                    ariaLabel={`Snap share by season for ${playerName}.`}
                    selectedKey={season ? String(season) : undefined}
                    onSelect={(key) => select(Number(key))}
                    labelEvery={snapSeasons.length > 14 ? 2 : 1}
                  />
                </div>
                <div className="rounded-2xl border bg-card p-5">
                  {loading ? (
                    <div className="h-40 animate-pulse rounded-md bg-muted" aria-busy="true" />
                  ) : gameBars.length > 0 && gameUnit ? (
                    <PercentBars
                      key={season}
                      data={gameBars}
                      caption={`${season} game by game · ${UNIT_SHORT[gameUnit].toLowerCase()} snap share`}
                      ariaLabel={`${UNIT_SHORT[gameUnit]} snap share in each ${season} game for ${playerName}.`}
                      slot={gameBars.length > 12 ? 28 : 34}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {season && season < 2013 ? "Per-game snap counts start in 2013." : `No per-game snap counts on record for ${season}.`}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
          <aside className="space-y-4">
            <Explainer title="What is snap share?" data-tour="player-snaps-explainer">
              <p>
                A <strong>snap</strong> is one play. <strong>Snap share</strong> is the percentage of his team&apos;s snaps
                in a unit — offense, defense or special teams — that he was on the field for.
              </p>
              <p>
                Starting quarterbacks and linemen sit near 100%. A rotational pass rusher might play 60–75%, and
                backups far less. Snap share shows how much a team trusts a player, not how well he plays.
              </p>
            </Explainer>
          </aside>
        </div>
      </section>
    </>
  );
}

function EmptyCard({ children }: { children: React.ReactNode }) {
  return <p className="rounded-2xl border bg-card p-5 text-sm text-muted-foreground">{children}</p>;
}

function GameTable({
  games,
  columns,
  headers,
  kind,
  teams,
  onOpen,
}: {
  games: GameLogRow[];
  columns: ReturnType<typeof gameColumns>;
  headers: Record<string, React.ReactNode>;
  kind: StatKind;
  teams: Record<string, TeamLite>;
  onOpen: (gameId: string) => void;
}) {
  // Players without a stat table (linemen, snappers) get snap counts in the log instead.
  const snapUnits = (["offense", "defense", "st"] as SnapUnit[]).filter(
    (unit) => kind === "none" && games.some((g) => g.snaps && (unitFigures(g.snaps, unit).count ?? 0) > 0),
  );

  return (
    <div className="overflow-x-auto rounded-2xl border bg-card">
      <table className="w-full text-sm tabular-nums">
        <caption className="sr-only">Game log</caption>
        <thead className="bg-muted text-left">
          <tr>
            {["Game", "Date", "Opponent", "Result"].map((h) => (
              <th key={h} scope="col" className="eyebrow px-3 py-2 font-semibold whitespace-nowrap text-muted-foreground">
                {h}
              </th>
            ))}
            {columns.map((col) => (
              <th key={col.id} scope="col" className="eyebrow px-3 py-2 text-right font-semibold whitespace-nowrap text-muted-foreground">
                {headers[col.id] ?? (
                  <abbr title={col.title} className="cursor-help">
                    {col.label}
                  </abbr>
                )}
              </th>
            ))}
            {snapUnits.map((unit) => (
              <th key={unit} scope="col" className="eyebrow px-3 py-2 text-right font-semibold whitespace-nowrap text-muted-foreground">
                {UNIT_SHORT[unit]} snaps
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {games.map((game) => {
            const opponent = game.opponentId ? teams[game.opponentId] : undefined;
            return (
              <tr
                key={game.gameId}
                className="cursor-pointer transition-colors hover:bg-accent/60"
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest("a")) return;
                  onOpen(game.gameId);
                }}
              >
                <th scope="row" className={cn("px-3 py-2 text-left font-medium whitespace-nowrap", game.gameType !== "REG" && "text-chart-3")}>
                  {roundLabel(game)}
                </th>
                <td className="px-3 py-2 whitespace-nowrap text-muted-foreground">{formatShortDate(game.date)}</td>
                <td className="px-3 py-2">
                  <Link href={gameHref(game.gameId)} className="flex items-center gap-2 whitespace-nowrap hover:underline">
                    <span className="w-4 text-center text-xs text-muted-foreground">{game.home || game.neutral ? "vs" : "@"}</span>
                    {game.opponentId && opponent ? (
                      <TeamLogo name={opponent.name} abbr={game.opponentId} logoUrl={opponent.logoUrl} color={opponent.color} size={22} />
                    ) : null}
                    <span className="font-medium">{opponent?.nickname ?? game.opponentAbbr}</span>
                  </Link>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {game.result ? (
                    <span className="inline-flex items-center gap-2 font-display text-base font-semibold">
                      <span
                        className={cn(
                          "inline-flex size-6 items-center justify-center rounded text-xs",
                          game.result === "W" ? "bg-win/20 text-win" : game.result === "L" ? "bg-loss/20 text-loss" : "bg-muted",
                        )}
                      >
                        {game.result}
                      </span>
                      {game.teamScore}–{game.opponentScore}
                      {game.overtime && <span className="text-xs font-normal text-muted-foreground">OT</span>}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                {columns.map((col) => (
                  <td key={col.id} className="px-3 py-2 text-right">
                    {game.stats ? formatCell(col.value(game.stats), col.fmt) : "—"}
                  </td>
                ))}
                {snapUnits.map((unit) => {
                  const figures = game.snaps ? unitFigures(game.snaps, unit) : null;
                  return (
                    <td key={unit} className="px-3 py-2 text-right">
                      {figures?.count ? (
                        <>
                          {figures.count}
                          <span className="ml-1 text-xs text-muted-foreground">{figures.pct}%</span>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
