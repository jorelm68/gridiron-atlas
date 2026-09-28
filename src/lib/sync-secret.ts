import "server-only";
import { timingSafeEqual } from "node:crypto";

/** Constant-time check of a caller-supplied value against SYNC_SECRET (false when it isn't configured). */
export function syncSecretMatches(candidate: string): boolean {
  const expected = process.env.SYNC_SECRET;
  if (!expected || !candidate) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
