import { createWriteStream, existsSync, mkdirSync, renameSync } from "node:fs";
import { dirname, join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream } from "node:stream/web";

const RELEASES = "https://github.com/nflverse/nflverse-data/releases/download";
export const CACHE_DIR = join(process.cwd(), ".cache", "nflverse");

/** DuckDB wants forward slashes, even on Windows. */
export const duckPath = (path: string) => path.replaceAll("\\", "/");

export async function fetchWithRetry(url: string, init?: RequestInit, attempts = 3): Promise<Response> {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, init);
      if (res.ok || (res.status < 500 && res.status !== 429)) return res;
      if (attempt >= attempts) return res;
    } catch (err) {
      if (attempt >= attempts) throw err;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** attempt));
  }
}

const refreshedThisRun = new Set<string>();

/**
 * Downloads an nflverse release asset to .cache/nflverse/<tag>/<asset> and returns its DuckDB-ready path.
 * With `refresh`, the file is re-downloaded once per process; otherwise an existing copy is reused.
 */
export async function nflverseAsset(tag: string, asset: string, { refresh = false } = {}): Promise<string> {
  const path = join(CACHE_DIR, tag, asset);
  const key = `${tag}/${asset}`;
  if (!existsSync(path) || (refresh && !refreshedThisRun.has(key))) {
    const res = await fetchWithRetry(`${RELEASES}/${tag}/${asset}`);
    if (!res.ok || !res.body) throw new Error(`Download failed for ${key}: HTTP ${res.status}`);
    mkdirSync(dirname(path), { recursive: true });
    await pipeline(Readable.fromWeb(res.body as ReadableStream), createWriteStream(`${path}.part`));
    renameSync(`${path}.part`, path);
    refreshedThisRun.add(key);
  }
  return duckPath(path);
}

/**
 * Downloads an arbitrary URL to .cache/<relPath> and returns its DuckDB-ready path, for non-nflverse
 * sources (e.g. nfldata standings.csv). Same refresh-once-per-process behavior as nflverseAsset.
 */
export async function cachedDownload(url: string, relPath: string, { refresh = false } = {}): Promise<string> {
  const path = join(process.cwd(), ".cache", relPath);
  if (!existsSync(path) || (refresh && !refreshedThisRun.has(relPath))) {
    const res = await fetchWithRetry(url);
    if (!res.ok || !res.body) throw new Error(`Download failed for ${relPath}: HTTP ${res.status}`);
    mkdirSync(dirname(path), { recursive: true });
    await pipeline(Readable.fromWeb(res.body as ReadableStream), createWriteStream(`${path}.part`));
    renameSync(`${path}.part`, path);
    refreshedThisRun.add(relPath);
  }
  return duckPath(path);
}

const zoneOffsets: Record<string, string> = { EDT: "-04:00", EST: "-05:00", UTC: "Z", GMT: "Z" };

/** When nflverse last published a release, from its timestamp.json (e.g. "2026-09-27 21:46:25 EDT"). */
export async function nflverseUpdatedAt(tag: string): Promise<string | null> {
  const res = await fetchWithRetry(`${RELEASES}/${tag}/timestamp.json`);
  if (!res.ok) return null;
  const { last_updated } = (await res.json()) as { last_updated?: string };
  const match = last_updated?.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) (\w+)$/);
  if (!match || !(match[3] in zoneOffsets)) return null;
  return new Date(`${match[1]}T${match[2]}${zoneOffsets[match[3]]}`).toISOString();
}
