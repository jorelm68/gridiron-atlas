// Verifies data/seed/franchises.json and data/seed/team-abbrs.json against the raw
// nflverse roster + schedule files, and checks internal consistency of the seed data.
//
// Usage: node scripts/seed-checks/teams.mjs
import { DuckDBInstance } from "@duckdb/node-api";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..");
const ROSTERS_GLOB = resolve(ROOT, ".cache/nflverse/rosters/*.parquet");
const GAMES_CSV = resolve(ROOT, ".cache/nflverse/schedules/games.csv");
const FRANCHISES_JSON = resolve(ROOT, "data/seed/franchises.json");
const TEAM_ABBRS_JSON = resolve(ROOT, "data/seed/team-abbrs.json");

if (!existsSync(resolve(ROOT, ".cache/nflverse/rosters"))) {
  console.error(`roster parquet files not found under ${resolve(ROOT, ".cache/nflverse/rosters")}.`);
  process.exit(1);
}
if (!existsSync(GAMES_CSV)) {
  console.error(
    `games.csv not found at ${GAMES_CSV}. Download it first:\n` +
      `  curl -sL https://github.com/nflverse/nflverse-data/releases/download/schedules/games.csv -o ${GAMES_CSV}`
  );
  process.exit(1);
}

const EXPECTED_FRANCHISE_IDS = [
  "ARI", "ATL", "BAL", "BUF", "CAR", "CHI", "CIN", "CLE", "DAL", "DEN", "DET", "GB",
  "HOU", "IND", "JAX", "KC", "LA", "LAC", "LV", "MIA", "MIN", "NE", "NO", "NYG", "NYJ",
  "PHI", "PIT", "SEA", "SF", "TB", "TEN", "WAS",
];

// The Browns' 1996-1998 inactive gap (personnel relocated to Baltimore to become the
// Ravens; the NFL preserved the Browns' name/history for a new team that resumed in 1999).
const DOCUMENTED_GAPS = [{ franchise: "CLE", from: 1996, to: 1998 }];

let failures = 0;
const fail = (msg) => {
  failures++;
  console.error(`FAIL: ${msg}`);
};
const ok = (msg) => console.log(`ok: ${msg}`);

const franchises = JSON.parse(readFileSync(FRANCHISES_JSON, "utf8"));
const teamAbbrs = JSON.parse(readFileSync(TEAM_ABBRS_JSON, "utf8"));

// ---------- (d) exactly 32 franchises with the documented ids ----------
console.log(`\n--- (d) franchise roster ---`);
if (franchises.length !== 32) {
  fail(`expected 32 franchises, found ${franchises.length}`);
} else {
  ok(`32 franchises present`);
}
const franchiseIds = new Set(franchises.map((f) => f.id));
for (const id of EXPECTED_FRANCHISE_IDS) {
  if (!franchiseIds.has(id)) fail(`missing expected franchise id ${id}`);
}
for (const id of franchiseIds) {
  if (!EXPECTED_FRANCHISE_IDS.includes(id)) fail(`unexpected franchise id ${id} not in the documented list of 32`);
}
const dupeIds = franchises.map((f) => f.id).filter((id, i, arr) => arr.indexOf(id) !== i);
if (dupeIds.length) fail(`duplicate franchise ids: ${[...new Set(dupeIds)].join(", ")}`);

// ---------- (c) franchise eras contiguous from founded to present, one gap allowed ----------
console.log(`\n--- (c) franchise era contiguity ---`);
const CURRENT_SEASON = 2026;
for (const f of franchises) {
  if (!Array.isArray(f.eras) || f.eras.length === 0) {
    fail(`${f.id}: has no eras`);
    continue;
  }
  const eras = [...f.eras].sort((a, b) => a.from - b.from);

  if (eras[0].from !== f.founded) {
    fail(`${f.id}: first era starts ${eras[0].from}, expected founded year ${f.founded}`);
  }

  const last = eras[eras.length - 1];
  if (last.to !== null) {
    fail(`${f.id}: last era's "to" is ${last.to}, expected null (current)`);
  }
  for (let i = 0; i < eras.length - 1; i++) {
    if (eras[i].to === null) fail(`${f.id}: era starting ${eras[i].from} has to:null but is not the last era`);
  }

  for (let i = 1; i < eras.length; i++) {
    const prevTo = eras[i - 1].to;
    const curFrom = eras[i].from;
    if (prevTo === null) continue; // already flagged above
    const gapFrom = prevTo + 1;
    const gapTo = curFrom - 1;
    if (gapFrom > gapTo) {
      if (gapFrom < curFrom) fail(`${f.id}: eras overlap between ${eras[i - 1].from}-${prevTo} and ${curFrom}-${eras[i].to}`);
      continue; // exactly contiguous
    }
    const documented = DOCUMENTED_GAPS.find((g) => g.franchise === f.id && g.from === gapFrom && g.to === gapTo);
    if (!documented) {
      fail(`${f.id}: undocumented gap in eras from ${gapFrom} to ${gapTo}`);
    }
  }

  for (const e of eras) {
    const to = e.to === null ? CURRENT_SEASON : e.to;
    if (e.from > to) fail(`${f.id}: era "${e.name}" has from ${e.from} > to ${e.to}`);
  }
}
if (failures === 0) ok(`all franchise eras contiguous from founding to present (documented gaps: ${DOCUMENTED_GAPS.map((g) => `${g.franchise} ${g.from}-${g.to}`).join(", ") || "none"})`);

// ---------- (b) team-abbrs entries with a franchise fall inside an era with matching name ----------
console.log(`\n--- (b) team-abbrs franchise/era/name consistency ---`);
const franchiseById = new Map(franchises.map((f) => [f.id, f]));
let bOk = 0;
for (const entry of teamAbbrs) {
  if (entry.franchise === null) continue;
  const f = franchiseById.get(entry.franchise);
  if (!f) {
    fail(`team-abbrs ${entry.abbr} ${entry.from}-${entry.to}: franchise "${entry.franchise}" does not exist`);
    continue;
  }
  const era = f.eras.find((e) => entry.from >= e.from && entry.to <= (e.to === null ? CURRENT_SEASON : e.to));
  if (!era) {
    fail(`team-abbrs ${entry.abbr} ${entry.from}-${entry.to} (franchise ${entry.franchise}): no era of ${entry.franchise} contains this range`);
    continue;
  }
  if (era.name !== entry.name) {
    fail(`team-abbrs ${entry.abbr} ${entry.from}-${entry.to} (franchise ${entry.franchise}): name "${entry.name}" != era name "${era.name}"`);
    continue;
  }
  bOk++;
}
ok(`${bOk} franchise-linked team-abbrs entries match their franchise's era name`);

// ---------- internal team-abbrs consistency: no gaps/overlaps within an abbr ----------
console.log(`\n--- team-abbrs internal consistency ---`);
const byAbbr = new Map();
for (const e of teamAbbrs) {
  if (e.from > e.to) fail(`team-abbrs ${e.abbr}: from ${e.from} > to ${e.to}`);
  if (!byAbbr.has(e.abbr)) byAbbr.set(e.abbr, []);
  byAbbr.get(e.abbr).push(e);
}
for (const [abbr, entries] of byAbbr) {
  const sorted = [...entries].sort((a, b) => a.from - b.from);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].from <= sorted[i - 1].to) {
      fail(`team-abbrs ${abbr}: overlapping ranges ${sorted[i - 1].from}-${sorted[i - 1].to} and ${sorted[i].from}-${sorted[i].to}`);
    }
  }
}
ok(`no overlapping ranges within any abbr (${byAbbr.size} distinct abbrs, ${teamAbbrs.length} entries)`);

// ---------- (a) every (abbr, season) in rosters + games.csv matches exactly one entry ----------
console.log(`\n--- (a) data coverage (rosters 1920-2026 + games.csv 1999-2026) ---`);
const db = await DuckDBInstance.create(":memory:");
const conn = await db.connect();

async function distinctPairs(sql) {
  const reader = await conn.runAndReadAll(sql);
  return reader.getRowObjectsJson().map((r) => ({ abbr: r.abbr, season: Number(r.season) }));
}

const rosterPairs = await distinctPairs(`
  select distinct team as abbr, season
  from read_parquet('${ROSTERS_GLOB.replace(/\\/g, "/")}', union_by_name=true)
`);
const gamesPairs = await distinctPairs(`
  select distinct abbr, season from (
    select home_team as abbr, season from read_csv_auto('${GAMES_CSV.replace(/\\/g, "/")}')
    union
    select away_team as abbr, season from read_csv_auto('${GAMES_CSV.replace(/\\/g, "/")}')
  )
`);

function checkCoverage(label, pairs) {
  let missing = 0;
  let overlap = 0;
  for (const { abbr, season } of pairs) {
    const matches = teamAbbrs.filter((e) => e.abbr === abbr && season >= e.from && season <= e.to);
    if (matches.length === 0) {
      fail(`${label}: (${abbr}, ${season}) not covered by any team-abbrs entry`);
      missing++;
    } else if (matches.length > 1) {
      fail(`${label}: (${abbr}, ${season}) covered by ${matches.length} team-abbrs entries`);
      overlap++;
    }
  }
  console.log(`${label}: ${pairs.length} distinct (abbr, season) pairs checked, ${missing} missing, ${overlap} double-covered`);
}

checkCoverage("rosters", rosterPairs);
checkCoverage("games.csv", gamesPairs);

// ---------- summary ----------
console.log(`\n=== SUMMARY ===`);
console.log(`Franchises: ${franchises.length}`);
console.log(`team-abbrs entries: ${teamAbbrs.length} (${teamAbbrs.filter((e) => e.franchise === null).length} defunct/unaffiliated)`);
console.log(`Roster (abbr, season) pairs: ${rosterPairs.length}`);
console.log(`games.csv (abbr, season) pairs: ${gamesPairs.length}`);

if (failures > 0) {
  console.log(`\n${failures} check(s) FAILED.`);
  process.exit(1);
} else {
  console.log(`\nAll checks passed.`);
}
