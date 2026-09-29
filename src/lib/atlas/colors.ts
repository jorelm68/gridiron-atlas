"use client";

import { useSyncExternalStore } from "react";
import { DIVISION_COLOR_VARS, DIVISION_ORDER, type ColorMode } from "./constants";

/**
 * Design tokens are defined as `oklch(...)` strings (see globals.css), but `THREE.Color` only understands
 * #hex, rgb()/rgba(), hsl()/hsla(), and named colors — and modern browsers no longer normalize a wide-gamut
 * color to rgb() when it's read back (`getComputedStyle(...).color` and canvas `fillStyle` both now echo the
 * *original* color function, e.g. `lab(...)`, per the current CSS Color serialization spec). The one thing
 * that's guaranteed to produce real sRGB numbers regardless of source color space is actually rasterizing the
 * color: draw a 1×1 rect with it as `fillStyle` and read the pixel back.
 */
const probeCanvas = typeof document !== "undefined" ? document.createElement("canvas") : null;
const probeCtx = probeCanvas?.getContext("2d", { willReadFrequently: true }) ?? null;
if (probeCanvas) {
  probeCanvas.width = 1;
  probeCanvas.height = 1;
}

/**
 * `backdrop` matters: a few tokens (`--border`, `--input`) are deliberately semi-transparent — e.g. "white at
 * 9% opacity" — meant to be composited over whatever's beneath them in normal CSS use. Rasterizing one alone
 * onto a blank canvas would composite it over transparent black instead, crushing it to near-invisible. Filling
 * the pixel with the theme's real background color first reproduces the same effective color CSS would show.
 */
function resolveToHex(cssColor: string, backdrop = "#000000"): string {
  if (!probeCtx) return "#888888";
  probeCtx.fillStyle = backdrop;
  probeCtx.fillRect(0, 0, 1, 1);
  probeCtx.fillStyle = cssColor;
  probeCtx.fillRect(0, 0, 1, 1);
  const [r, g, b] = probeCtx.getImageData(0, 0, 1, 1).data;
  const toHex = (c: number) => c.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function readVar(name: string, backdrop?: string): string {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return raw ? resolveToHex(raw, backdrop) : "#888888";
}

function parseHex(hex: string): [number, number, number] | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return null;
  const n = parseInt(match[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex([r, g, b]: [number, number, number]): string {
  const h = (c: number) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** Linear blend of two hex colors: `t` = 0 returns `a`, 1 returns `b`. */
export function mixHex(a: string, b: string, t: number): string {
  const ca = parseHex(a);
  const cb = parseHex(b);
  if (!ca || !cb) return a;
  return toHex([ca[0] + (cb[0] - ca[0]) * t, ca[1] + (cb[1] - ca[1]) * t, ca[2] + (cb[2] - ca[2]) * t]);
}

/** Mixes a hex color toward white by `amount` (0–1). Used to lift a token meant for flat UI chrome (subtly
 *  lighter than the page background) into something that reads clearly once it's a lit, shaded 3D surface. */
export function lighten(hex: string, amount: number): string {
  return mixHex(hex, "#ffffff", amount);
}

/** WCAG relative luminance (0 = black, 1 = white). */
export function luminance(hex: string): number {
  const rgb = parseHex(hex);
  if (!rgb) return 0.5;
  const [r, g, b] = rgb.map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Whether a team color reads as a glowing beam on this theme's landmass. Dark theme: bright enough to glow
 * (a near-black beam on a dark map is invisible whatever the contrast maths says). Light theme: enough contrast
 * against the pale land that pale golds and creams don't wash out.
 */
export function isLegible(hex: string, land: string, isDark: boolean): boolean {
  return isDark ? luminance(hex) >= 0.14 : contrastRatio(hex, land) >= 3;
}

/** Nudges a color toward white (dark themes) or black (light themes) until it's legible on the landmass. */
export function ensureLegible(hex: string, land: string, isDark: boolean): string {
  if (!parseHex(hex)) return hex;
  const toward = isDark ? "#ffffff" : "#000000";
  for (let t = 0; t <= 1; t += 0.1) {
    const candidate = mixHex(hex, toward, t);
    if (isLegible(candidate, land, isDark)) return candidate;
  }
  return toward;
}

export interface MapTheme {
  background: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  foreground: string;
  mutedForeground: string;
  field: string;
  primary: string;
  afc: string;
  nfc: string;
  divisions: Record<string, string>;
  isDark: boolean;
  /** The 3D landmass: `--muted` is tuned for flat UI chrome, so it's lifted/dimmed to read as a lit surface. */
  land: string;
  /** Extruded side walls of the landmass — recede toward the void in dark mode, read as a soft edge in light. */
  landWall: string;
  /** State-border lines drawn on the landmass. */
  landBorder: string;
}

const FALLBACK: MapTheme = {
  background: "#15181f",
  surface: "#26292f",
  surfaceRaised: "#2c2f36",
  border: "#3a3d44",
  foreground: "#f5f6f7",
  mutedForeground: "#9ba0a8",
  field: "#3a6b52",
  primary: "#4f9fe0",
  afc: "#c0433f",
  nfc: "#4f7fb0",
  divisions: {},
  isDark: true,
  land: "#3a3d44",
  landWall: "#0c0d10",
  landBorder: "#5a5e67",
};

function readTheme(): MapTheme {
  // Resolved first (it's always opaque) so the semi-transparent tokens below have a real backdrop to
  // composite over, matching how they'd actually look layered on the page.
  const background = readVar("--background");
  const divisions = Object.fromEntries(
    DIVISION_ORDER.map((division) => [division, readVar(DIVISION_COLOR_VARS[division], background)]),
  );
  const surface = readVar("--muted", background);
  const foreground = readVar("--foreground", background);
  const isDark = luminance(background) < 0.25;
  const land = isDark ? lighten(surface, 0.22) : mixHex(surface, foreground, 0.1);
  return {
    background,
    surface,
    surfaceRaised: readVar("--secondary", background),
    border: readVar("--border", background),
    foreground,
    mutedForeground: readVar("--muted-foreground", background),
    field: readVar("--field", background),
    primary: readVar("--primary", background),
    afc: readVar("--afc", background),
    nfc: readVar("--nfc", background),
    divisions,
    isDark,
    land,
    landWall: isDark ? mixHex(land, "#000000", 0.78) : mixHex(land, "#000000", 0.32),
    landBorder: mixHex(land, foreground, isDark ? 0.2 : 0.32),
  };
}

/**
 * Module-singleton external store: watches `<html>`'s `class` attribute (next-themes flips `.dark` there) and
 * recomputes the palette from CSS custom properties on change. A `MutationObserver` — rather than a `useEffect`
 * keyed on next-themes' `resolvedTheme` — is the "subscribe to an external system" primitive `useSyncExternalStore`
 * expects, so re-reading the DOM doesn't need a setState-in-effect (see react.dev/learn/you-might-not-need-an-effect).
 */
function createThemeStore() {
  let snapshot = FALLBACK;
  let observer: MutationObserver | null = null;
  const listeners = new Set<() => void>();

  function recompute() {
    snapshot = readTheme();
    listeners.forEach((listener) => listener());
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    if (!observer) {
      observer = new MutationObserver(recompute);
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
      recompute(); // pick up the real (non-fallback) palette now that we're on the client
    }
    return () => {
      listeners.delete(listener);
      if (listeners.size === 0 && observer) {
        observer.disconnect();
        observer = null;
      }
    };
  }

  function getSnapshot() {
    return snapshot;
  }

  return { subscribe, getSnapshot };
}

const themeStore = createThemeStore();

/** Resolves the map's palette from CSS custom properties, re-reading whenever the theme changes. */
export function useMapTheme(): MapTheme {
  return useSyncExternalStore(themeStore.subscribe, themeStore.getSnapshot, () => FALLBACK);
}

/** The color a team's marker/region should render in, given the active color-by mode. */
export function teamColor(
  team: { color: string | null; colorSecondary: string | null; conference: "AFC" | "NFC"; division: string },
  mode: ColorMode,
  theme: MapTheme,
): string {
  if (mode === "conference") return team.conference === "AFC" ? theme.afc : theme.nfc;
  if (mode === "division") return theme.divisions[team.division] ?? theme.primary;

  // Team colors: prefer the primary, but fall back to (or nudge toward) something that shows up on this theme's
  // landmass — several primaries are near-black (Steelers, Raiders) or pale (Saints).
  const primary = team.color ?? theme.primary;
  if (isLegible(primary, theme.land, theme.isDark)) return primary;
  if (team.colorSecondary && isLegible(team.colorSecondary, theme.land, theme.isDark)) return team.colorSecondary;
  return ensureLegible(primary, theme.land, theme.isDark);
}
