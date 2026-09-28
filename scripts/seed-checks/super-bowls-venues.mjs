// Validates data/seed/super-bowls.json and data/seed/venues.json against nflverse games.csv.
// Usage: node scripts/seed-checks/super-bowls-venues.mjs
import { DuckDBInstance } from "@duckdb/node-api";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..");
const GAMES_CSV = resolve(ROOT, ".cache/nflverse/schedules/games.csv");
const SB_JSON = resolve(ROOT, "data/seed/super-bowls.json");
const VENUES_JSON = resolve(ROOT, "data/seed/venues.json");

// Historical games.csv team abbreviations -> current nflverse franchise ids.
const FRANCHISE_MAP = {
  STL: "LA", LA: "LA",
  OAK: "LV", LV: "LV",
  SD: "LAC", LAC: "LAC",
};
const toFranchise = (team) => FRANCHISE_MAP[team] ?? team;

// Known legitimate cases where one franchise has overlapping/co-current tenant ranges across
// multiple venues in the same season(s) — e.g. displaced mid-season, not a data error.
const KNOWN_MULTI_VENUE_SEASONS = new Set([
  "NO|2005", // Hurricane Katrina: Saints split 2005 home games between Baton Rouge and San Antonio
]);

let failures = 0;
const fail = (msg) => {
  console.error(`FAIL: ${msg}`);
  failures++;
};
const ok = (msg) => console.log(`ok: ${msg}`);

if (!existsSync(GAMES_CSV)) {
  console.error(
    `games.csv not found at ${GAMES_CSV}. Download it first:\n` +
      `  curl -sL https://github.com/nflverse/nflverse-data/releases/download/schedules/games.csv -o ${GAMES_CSV}`
  );
  process.exit(1);
}

const superBowls = JSON.parse(readFileSync(SB_JSON, "utf8"));
const venues = JSON.parse(readFileSync(VENUES_JSON, "utf8"));

// --- 1. Super Bowl count, numbering, seasons -------------------------------------------------
if (superBowls.length === 60) {
  ok("60 Super Bowls present");
} else {
  fail(`expected 60 Super Bowls, found ${superBowls.length}`);
}

for (let i = 0; i < superBowls.length; i++) {
  const sb = superBowls[i];
  const expectedNumber = i + 1;
  const expectedSeason = 1966 + i;
  if (sb.number !== expectedNumber) {
    fail(`entry at index ${i} has number ${sb.number}, expected ${expectedNumber}`);
  }
  if (sb.season !== expectedSeason) {
    fail(`Super Bowl ${sb.number} has season ${sb.season}, expected ${expectedSeason}`);
  }
}
if (failures === 0) ok("numbers 1..60 and seasons 1966..2025 are sequential");

// --- DuckDB: load games.csv ------------------------------------------------------------------
const db = await DuckDBInstance.create(":memory:");
const conn = await db.connect();

const sbRowsReader = await conn.runAndReadAll(`
  select season, gameday, away_team, away_score, home_team, home_score, stadium, stadium_id
  from '${GAMES_CSV.replace(/\\/g, "/")}'
  where game_type = 'SB'
`);
const sbRows = sbRowsReader.getRowObjectsJson();
const sbBySeason = new Map(sbRows.map((r) => [Number(r.season), r]));

// --- 2. 1999+ entries match games.csv (teams, scores, date) ----------------------------------
let mismatches = 0;
for (const sb of superBowls) {
  if (sb.season < 1999) continue;
  const g = sbBySeason.get(sb.season);
  if (!g) {
    fail(`no games.csv SB row for season ${sb.season} (Super Bowl ${sb.roman})`);
    mismatches++;
    continue;
  }
  const homeScore = Number(g.home_score);
  const awayScore = Number(g.away_score);
  const winnerIsHome = homeScore > awayScore;
  const csvWinner = toFranchise(winnerIsHome ? g.home_team : g.away_team);
  const csvLoser = toFranchise(winnerIsHome ? g.away_team : g.home_team);
  const csvWinnerScore = Math.max(homeScore, awayScore);
  const csvLoserScore = Math.min(homeScore, awayScore);

  const problems = [];
  if (csvWinner !== sb.winner) problems.push(`winner ${sb.winner} != csv ${csvWinner}`);
  if (csvLoser !== sb.loser) problems.push(`loser ${sb.loser} != csv ${csvLoser}`);
  if (csvWinnerScore !== sb.winner_score) problems.push(`winner_score ${sb.winner_score} != csv ${csvWinnerScore}`);
  if (csvLoserScore !== sb.loser_score) problems.push(`loser_score ${sb.loser_score} != csv ${csvLoserScore}`);
  if (g.gameday !== sb.date) problems.push(`date ${sb.date} != csv ${g.gameday}`);

  if (problems.length) {
    fail(`Super Bowl ${sb.roman} (season ${sb.season}): ${problems.join("; ")}`);
    mismatches++;
  }
}
if (mismatches === 0) ok("all 1999+ Super Bowls match games.csv on teams, scores, and date");

// --- 3. Every games.csv stadium_id has exactly one venue with non-null wikipedia/wikidata/lat/lng
const stadiumIdReader = await conn.runAndReadAll(`
  select distinct stadium_id from '${GAMES_CSV.replace(/\\/g, "/")}'
`);
const csvStadiumIds = new Set(stadiumIdReader.getRowObjectsJson().map((r) => r.stadium_id));

const venueById = new Map();
for (const v of venues) {
  if (venueById.has(v.id)) {
    fail(`duplicate venue entry for stadium_id ${v.id}`);
  }
  venueById.set(v.id, v);
}

let venueProblems = 0;
for (const stadiumId of csvStadiumIds) {
  const v = venueById.get(stadiumId);
  if (!v) {
    fail(`games.csv stadium_id ${stadiumId} has no venue entry`);
    venueProblems++;
    continue;
  }
  const missingFields = ["wikipedia", "wikidata", "lat", "lng"].filter(
    (f) => v[f] === null || v[f] === undefined || v[f] === ""
  );
  if (missingFields.length) {
    fail(`venue ${stadiumId} missing: ${missingFields.join(", ")}`);
    venueProblems++;
  }
}
// also flag venues.json entries that don't correspond to any games.csv stadium_id
for (const v of venues) {
  if (!csvStadiumIds.has(v.id)) {
    fail(`venue ${v.id} does not correspond to any games.csv stadium_id`);
    venueProblems++;
  }
}
if (venueProblems === 0) {
  ok(`all ${csvStadiumIds.size} games.csv stadium_ids have exactly one venue with wikipedia/wikidata/lat/lng`);
}

// --- 4. Tenant ranges don't overlap per franchise across venues (except known exceptions) ----
// franchise -> [{ venue, from, to }]
const byFranchise = new Map();
for (const v of venues) {
  for (const t of v.tenants ?? []) {
    if (!byFranchise.has(t.franchise)) byFranchise.set(t.franchise, []);
    byFranchise.get(t.franchise).push({ venue: v.id, from: t.from, to: t.to });
  }
}

let overlapProblems = 0;
for (const [franchise, ranges] of byFranchise) {
  for (let i = 0; i < ranges.length; i++) {
    for (let j = i + 1; j < ranges.length; j++) {
      const a = ranges[i];
      const b = ranges[j];
      if (a.venue === b.venue) continue;
      const overlapFrom = Math.max(a.from, b.from);
      const overlapTo = Math.min(a.to, b.to);
      if (overlapFrom > overlapTo) continue; // no overlap
      for (let season = overlapFrom; season <= overlapTo; season++) {
        const key = `${franchise}|${season}`;
        if (KNOWN_MULTI_VENUE_SEASONS.has(key)) continue;
        fail(
          `franchise ${franchise} is a tenant of both ${a.venue} and ${b.venue} in season ${season} (not a known exception)`
        );
        overlapProblems++;
      }
    }
  }
}
if (overlapProblems === 0) {
  ok("no unexplained overlapping tenant ranges (Saints' 2005 Katrina displacement is the one known exception)");
}

// --- Summary -----------------------------------------------------------------------------------
console.log("");
if (failures > 0) {
  console.error(`${failures} check(s) failed.`);
  process.exit(1);
} else {
  console.log("All checks passed.");
}
