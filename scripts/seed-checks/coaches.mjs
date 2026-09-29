// Validates data/seed/head-coaches.json and data/seed/front-office.json against franchises.json:
// all 32 franchises present, head-coach ranges start at/after the founding season and are chronological,
// exactly one current head coach per franchise (matching front-office.json), required front-office roles
// present with a source_url for every entry.
// Usage: node scripts/seed-checks/coaches.mjs
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..", "..");
const FRANCHISES_JSON = resolve(ROOT, "data/seed/franchises.json");
const COACHES_JSON = resolve(ROOT, "data/seed/head-coaches.json");
const FRONT_OFFICE_JSON = resolve(ROOT, "data/seed/front-office.json");

for (const [label, path] of [
  ["franchises.json", FRANCHISES_JSON],
  ["head-coaches.json", COACHES_JSON],
  ["front-office.json", FRONT_OFFICE_JSON],
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

const franchises = JSON.parse(readFileSync(FRANCHISES_JSON, "utf8"));
const coaches = JSON.parse(readFileSync(COACHES_JSON, "utf8"));
const frontOffice = JSON.parse(readFileSync(FRONT_OFFICE_JSON, "utf8"));

const CURRENT_SEASON = 2026;
const FOUNDED = new Map(franchises.map((f) => [f.id, f.founded]));
const FRANCHISE_IDS = [...FOUNDED.keys()];
const REQUIRED_ROLES = [
  "owner",
  "general_manager",
  "head_coach",
  "offensive_coordinator",
  "defensive_coordinator",
  "special_teams_coordinator",
];
const ALLOWED_ROLES = new Set([...REQUIRED_ROLES, "president"]);

const isInt = (v) => Number.isInteger(v);
const isCount = (v) => isInt(v) && v >= 0;
const isNonEmptyString = (v) => typeof v === "string" && v.trim().length > 0;

if (FRANCHISE_IDS.length !== 32) fail(`franchises.json has ${FRANCHISE_IDS.length} franchises, expected 32`);

// ---------- head-coaches.json ----------
if (!Array.isArray(coaches)) {
  fail("head-coaches.json must be an array");
  process.exit(1);
}

const byFranchise = new Map(FRANCHISE_IDS.map((id) => [id, []]));
const seenKeys = new Set();
coaches.forEach((c, i) => {
  const where = `head-coaches[${i}] ${c?.franchise}/${c?.coach}/${c?.from}`;
  if (!FOUNDED.has(c.franchise)) return fail(`${where}: unknown franchise "${c.franchise}"`);
  if (!isNonEmptyString(c.coach)) fail(`${where}: coach must be a non-empty string`);
  if (!isInt(c.from)) fail(`${where}: from must be an integer`);
  if (c.to !== null && !isInt(c.to)) fail(`${where}: to must be an integer or null`);
  if (typeof c.interim !== "boolean") fail(`${where}: interim must be a boolean`);
  if (c.note !== null && typeof c.note !== "string") fail(`${where}: note must be a string or null`);
  if (c.regular !== null) {
    if (!c.regular || !isCount(c.regular.w) || !isCount(c.regular.l) || !isCount(c.regular.t)) {
      fail(`${where}: regular must be null or { w, l, t } non-negative integers`);
    }
  }
  if (c.playoff !== null) {
    if (!c.playoff || !isCount(c.playoff.w) || !isCount(c.playoff.l)) {
      fail(`${where}: playoff must be null or { w, l } non-negative integers`);
    }
  }
  const key = `${c.franchise}|${c.coach}|${c.from}`;
  if (seenKeys.has(key)) fail(`${where}: duplicate (franchise, coach, from)`);
  seenKeys.add(key);
  if (isInt(c.from)) {
    if (c.from < FOUNDED.get(c.franchise)) {
      fail(`${where}: starts in ${c.from}, before the franchise's founding season ${FOUNDED.get(c.franchise)}`);
    }
    if (c.from > CURRENT_SEASON) fail(`${where}: from ${c.from} is after the current season`);
  }
  if (isInt(c.to)) {
    if (isInt(c.from) && c.to < c.from) fail(`${where}: to ${c.to} is before from ${c.from}`);
    if (c.to > CURRENT_SEASON) fail(`${where}: to ${c.to} is after the current season`);
  }
  byFranchise.get(c.franchise).push(c);
});

const currentCoachByFranchise = new Map();
for (const id of FRANCHISE_IDS) {
  const list = byFranchise.get(id);
  if (list.length === 0) {
    fail(`${id}: no head coaches in head-coaches.json`);
    continue;
  }
  for (let i = 1; i < list.length; i++) {
    if (list[i].from < list[i - 1].from) {
      fail(`${id}: not chronological — ${list[i - 1].coach} (${list[i - 1].from}) is followed by ${list[i].coach} (${list[i].from})`);
    }
  }
  const current = list.filter((c) => c.to === null);
  if (current.length !== 1) {
    fail(`${id}: expected exactly one current head coach (to: null), found ${current.length}`);
  } else {
    currentCoachByFranchise.set(id, current[0]);
    if (current[0] !== list[list.length - 1]) fail(`${id}: the current head coach (${current[0].coach}) must be the last entry`);
    if (current[0].interim) fail(`${id}: current head coach ${current[0].coach} is marked interim`);
  }
}
// franchises present in the file but missing from franchises.json are already reported above
const coachFranchises = new Set(coaches.map((c) => c.franchise));
if (FRANCHISE_IDS.every((id) => coachFranchises.has(id)) && coachFranchises.size === 32) {
  ok("head-coaches.json covers all 32 franchises");
}

// ---------- front-office.json ----------
if (!Array.isArray(frontOffice)) {
  fail("front-office.json must be an array");
  process.exit(1);
}
const roleMap = new Map(); // `${franchise}|${role}` -> entry
frontOffice.forEach((e, i) => {
  const where = `front-office[${i}] ${e?.franchise}/${e?.role}`;
  if (!FOUNDED.has(e.franchise)) return fail(`${where}: unknown franchise "${e.franchise}"`);
  if (!ALLOWED_ROLES.has(e.role)) return fail(`${where}: unknown role "${e.role}"`);
  if (!isNonEmptyString(e.person)) fail(`${where}: person must be a non-empty string`);
  if (e.since !== null && !(isInt(e.since) && e.since >= 1900 && e.since <= CURRENT_SEASON)) {
    fail(`${where}: since must be null or a season between 1900 and ${CURRENT_SEASON}`);
  }
  if (e.note !== null && typeof e.note !== "string") fail(`${where}: note must be a string or null`);
  if (!isNonEmptyString(e.source_url) || !/^https:\/\/[^\s]+$/.test(e.source_url)) {
    fail(`${where}: source_url must be an https URL`);
  }
  const key = `${e.franchise}|${e.role}`;
  if (roleMap.has(key)) fail(`${where}: more than one entry for this franchise and role`);
  roleMap.set(key, e);
});

for (const id of FRANCHISE_IDS) {
  for (const role of REQUIRED_ROLES) {
    if (!roleMap.has(`${id}|${role}`)) fail(`${id}: front-office.json is missing role ${role}`);
  }
  const fo = roleMap.get(`${id}|head_coach`);
  const current = currentCoachByFranchise.get(id);
  if (fo && current) {
    if (fo.person !== current.coach) {
      fail(`${id}: front-office head_coach "${fo.person}" does not match the current coach in head-coaches.json "${current.coach}"`);
    }
    if (fo.since !== current.from) {
      fail(`${id}: front-office head_coach since ${fo.since} does not match the current coach's start season ${current.from}`);
    }
  }
}
const foFranchises = new Set(frontOffice.map((e) => e.franchise));
if (FRANCHISE_IDS.every((id) => foFranchises.has(id)) && foFranchises.size === 32) {
  ok("front-office.json covers all 32 franchises");
}

// ---------- summary ----------
const interimCount = coaches.filter((c) => c.interim).length;
const uniqueCoaches = new Set(coaches.map((c) => `${c.franchise}|${c.coach}`)).size;
const noRecord = coaches.filter((c) => c.regular === null).length;
console.log(
  `head-coaches.json: ${coaches.length} entries, ${uniqueCoaches} distinct (franchise, coach) pairs, ${interimCount} interim, ${noRecord} without a regular-season record`,
);
const perFranchise = FRANCHISE_IDS.map((id) => `${id}:${byFranchise.get(id).length}`).join(" ");
console.log(`  entries per franchise: ${perFranchise}`);
const roleCounts = {};
for (const e of frontOffice) roleCounts[e.role] = (roleCounts[e.role] ?? 0) + 1;
console.log(`front-office.json: ${frontOffice.length} entries`);
console.log(`  by role: ${Object.entries(roleCounts).map(([r, n]) => `${r}=${n}`).join(", ")}`);
const withoutSince = frontOffice.filter((e) => e.since === null).length;
console.log(`  entries without a 'since' season: ${withoutSince}`);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log("\nall coach/front-office checks passed");
