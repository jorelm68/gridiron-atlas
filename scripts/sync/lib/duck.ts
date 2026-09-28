import { mkdirSync, writeFileSync } from "node:fs";
import { DuckDBInstance, type DuckDBConnection } from "@duckdb/node-api";

/**
 * Thin wrapper over a persistent DuckDB file (.cache/sync.duckdb). Datasets leave working tables behind
 * (e.g. `player_ids`, `game_ids`) so later datasets — even in a later run — can join against them.
 *
 * Rows come back via getRowObjectsJson: cast counts to INTEGER (BIGINT arrives as a string) and dates to DATE.
 */
export class Duck {
  private constructor(private readonly conn: DuckDBConnection) {}

  static async open(path = ".cache/sync.duckdb"): Promise<Duck> {
    mkdirSync(".cache", { recursive: true });
    const instance = await DuckDBInstance.create(path);
    return new Duck(await instance.connect());
  }

  async exec(sql: string): Promise<void> {
    await this.conn.run(sql);
  }

  async all<T = Record<string, unknown>>(sql: string): Promise<T[]> {
    const reader = await this.conn.runAndReadAll(sql);
    return reader.getRowObjectsJson() as T[];
  }

  async one<T = Record<string, unknown>>(sql: string): Promise<T> {
    const [row] = await this.all<T>(sql);
    return row;
  }

  /** Materializes JS rows as a DuckDB table (via a temp JSON file) so SQL can join against them. */
  async tableFromRows(name: string, rows: Record<string, unknown>[]): Promise<void> {
    const file = `.cache/tmp-${name}.json`;
    writeFileSync(file, JSON.stringify(rows));
    await this.exec(`create or replace table ${name} as select * from read_json(${lit(file)}, format = 'array')`);
  }
}

/** SQL string literal. */
export const lit = (value: string) => `'${value.replaceAll("'", "''")}'`;

/** SQL list literal for file paths, e.g. read_parquet([...]). */
export const litList = (values: string[]) => `[${values.map(lit).join(", ")}]`;
