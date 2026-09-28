// Ad-hoc DuckDB queries against local data files (e.g. the .cache/nflverse downloads).
// Usage (from the project root): node scripts/duckq.mjs "select ..." ["select ..." ...]
// Tip: always alias with `as` — several short words (names, weeks, decade) are DuckDB keywords.
import { DuckDBInstance } from "@duckdb/node-api";

const db = await DuckDBInstance.create(":memory:");
const conn = await db.connect();

for (const sql of process.argv.slice(2)) {
  const reader = await conn.runAndReadAll(sql);
  console.log(`## ${sql.replace(/\s+/g, " ").slice(0, 100)}`);
  console.table(reader.getRowObjectsJson());
}
