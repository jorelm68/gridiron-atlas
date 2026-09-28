import { readFileSync } from "node:fs";
import { join } from "node:path";
import { duckPath } from "./cache";

const SEED_DIR = join(process.cwd(), "data", "seed");

/** Absolute, DuckDB-ready path of a curated seed file in data/seed/. */
export const seedPath = (file: string) => duckPath(join(SEED_DIR, file));

export function readSeed<T>(file: string): T {
  return JSON.parse(readFileSync(join(SEED_DIR, file), "utf8")) as T;
}

export interface FranchiseEraSeed {
  from: number;
  to: number | null;
  name: string;
  location: string;
  nickname: string;
  city: string;
  state: string | null;
  lat: number | null;
  lng: number | null;
  note: string | null;
}

export interface FranchiseSeed {
  id: string;
  founded: number;
  origin_league: "NFL" | "AFL" | "AAFC";
  division: string;
  eras: FranchiseEraSeed[];
  notes: string[];
}

export interface TeamAbbrSeed {
  abbr: string;
  from: number;
  to: number;
  franchise: string | null;
  name: string;
}
