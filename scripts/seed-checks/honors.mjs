// Validates data/seed/hall-of-fame.json and data/seed/awards.json: shapes, franchise ids,
// HOF class range + no duplicate (name, class), and full season coverage per award range.
// Usage: node scripts/seed-checks/honors.mjs
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..");
const HOF_JSON = resolve(ROOT, "data/seed/hall-of-fame.json");
const AWARDS_JSON = resolve(ROOT, "data/seed/awards.json");
const FRANCHISES_JSON = resolve(ROOT, "data/seed/franchises.json");

for (const [label, path] of [
  ["hall-of-fame.json", HOF_JSON],
  ["awards.json", AWARDS_JSON],
  ["franchises.json", FRANCHISES_JSON],
]) {
  if (!existsSync(path)) {
    console.error(`${label} not found at ${path}`);
    process.exit(1);
  }
}

let failures = 0;
const fail = (msg) => {
  console.error(`FAIL: ${msg}`);
  failures++;
};
const ok = (msg) => console.log(`ok: ${msg}`);

const hof = JSON.parse(readFileSync(HOF_JSON, "utf8"));
const awards = JSON.parse(readFileSync(AWARDS_JSON, "utf8"));
const franchises = JSON.parse(readFileSync(FRANCHISES_JSON, "utf8"));
const FRANCHISE_IDS = new Set(franchises.map((f) => f.id));

const HOF_CLASS_MIN = 1963;
const HOF_CLASS_MAX = 2026;
const HOF_CATEGORIES = new Set(["player", "coach", "contributor"]);

const AWARD_RANGES = {
  MVP: [1957, 2025],
  OPOY: [1972, 2025],
  DPOY: [1971, 2025],
  OROY: [1967, 2025],
  DROY: [1967, 2025],
  CPOY: [1998, 2025],
  COY: [1957, 2025],
  WPMOY: [1970, 2025],
};

// ---------- Hall of Fame: shape ----------
console.log(`\n--- hall-of-fame.json shape ---`);
if (!Array.isArray(hof)) {
  fail("hall-of-fame.json is not an array");
} else {
  let shapeOk = 0;
  for (let i = 0; i < hof.length; i++) {
    const e = hof[i];
    const where = `hall-of-fame.json[${i}] (${e?.name ?? "?"} ${e?.class ?? "?"})`;
    if (typeof e.name !== "string" || !e.name.trim()) fail(`${where}: name must be a non-empty string`);
    if (!Number.isInteger(e.class)) fail(`${where}: class must be an integer`);
    else if (e.class < HOF_CLASS_MIN || e.class > HOF_CLASS_MAX) {
      fail(`${where}: class ${e.class} outside expected range ${HOF_CLASS_MIN}..${HOF_CLASS_MAX}`);
    }
    if (!HOF_CATEGORIES.has(e.category)) fail(`${where}: invalid category "${e.category}"`);
    if (e.position !== null && typeof e.position !== "string") fail(`${where}: position must be a string or null`);
    if (e.category !== "player" && e.position !== null) {
      fail(`${where}: category "${e.category}" should have position null, got "${e.position}"`);
    }
    if (!Array.isArray(e.franchises)) {
      fail(`${where}: franchises must be an array`);
    } else {
      for (const f of e.franchises) {
        if (!FRANCHISE_IDS.has(f)) fail(`${where}: unknown franchise id "${f}"`);
      }
    }
    if (e.birth_date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(e.birth_date)) {
      fail(`${where}: birth_date must be null or "YYYY-MM-DD", got "${e.birth_date}"`);
    }
    shapeOk++;
  }
  if (failures === 0) ok(`${shapeOk} inductees have valid shape`);
}

// ---------- Hall of Fame: no duplicate (name, class) ----------
console.log(`\n--- hall-of-fame.json duplicates ---`);
{
  const seen = new Map();
  let dupes = 0;
  for (const e of hof) {
    const key = `${e.name}|${e.class}`;
    if (seen.has(key)) {
      fail(`duplicate inductee: ${e.name} (class ${e.class})`);
      dupes++;
    }
    seen.set(key, true);
  }
  if (dupes === 0) ok(`no duplicate (name, class) pairs among ${hof.length} inductees`);
}

// ---------- awards.json: shape ----------
console.log(`\n--- awards.json shape ---`);
if (!Array.isArray(awards)) {
  fail("awards.json is not an array");
} else {
  let shapeOk = 0;
  for (let i = 0; i < awards.length; i++) {
    const a = awards[i];
    const where = `awards.json[${i}] (${a?.award ?? "?"} ${a?.season ?? "?"} ${a?.recipient ?? "?"})`;
    if (!Object.hasOwn(AWARD_RANGES, a.award)) fail(`${where}: invalid award "${a.award}"`);
    if (!Number.isInteger(a.season)) fail(`${where}: season must be an integer`);
    if (typeof a.recipient !== "string" || !a.recipient.trim()) fail(`${where}: recipient must be a non-empty string`);
    if (a.position !== null && typeof a.position !== "string") fail(`${where}: position must be a string or null`);
    if (a.award === "COY" && a.position !== null) fail(`${where}: COY position must be null, got "${a.position}"`);
    if (a.team !== null && !FRANCHISE_IDS.has(a.team)) fail(`${where}: unknown franchise id "${a.team}"`);
    shapeOk++;
  }
  if (failures === 0) ok(`${shapeOk} award entries have valid shape`);
}

// ---------- awards.json: season coverage per award range ----------
console.log(`\n--- awards.json season coverage ---`);
for (const [award, [min, max]] of Object.entries(AWARD_RANGES)) {
  const seasons = new Set(awards.filter((a) => a.award === award).map((a) => a.season));
  const missing = [];
  for (let s = min; s <= max; s++) if (!seasons.has(s)) missing.push(s);
  if (missing.length) {
    fail(`${award}: missing recipient(s) for season(s) ${missing.join(", ")} (expected range ${min}-${max})`);
  } else {
    ok(`${award}: every season ${min}-${max} has >= 1 recipient (${awards.filter((a) => a.award === award).length} entries)`);
  }
  // also flag any season outside the documented range - likely a bug (wrong season parsed)
  for (const a of awards.filter((x) => x.award === award)) {
    if (a.season < min || a.season > max) fail(`${award}: season ${a.season} is outside expected range ${min}-${max}`);
  }
}

// ---------- summary ----------
console.log(`\n=== SUMMARY ===`);
console.log(`Hall of Fame inductees: ${hof.length}`);
const byCategory = new Map();
for (const e of hof) byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + 1);
for (const [cat, count] of [...byCategory.entries()].sort()) console.log(`  ${cat}: ${count}`);
console.log(`HOF classes: ${Math.min(...hof.map((e) => e.class))}-${Math.max(...hof.map((e) => e.class))}`);

console.log(`\nAwards entries: ${awards.length}`);
const byAward = new Map();
for (const a of awards) byAward.set(a.award, (byAward.get(a.award) ?? 0) + 1);
for (const award of Object.keys(AWARD_RANGES)) console.log(`  ${award}: ${byAward.get(award) ?? 0}`);

if (failures > 0) {
  console.log(`\n${failures} check(s) FAILED.`);
  process.exit(1);
} else {
  console.log(`\nAll checks passed.`);
}
