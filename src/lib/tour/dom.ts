/** DOM helpers for the guided tour: finding anchors, waiting for them, and performing `before` actions. */

export const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/** Rendered and not hidden (display:none, visibility:hidden and zero-size boxes all count as not visible). */
export function isVisible(el: Element): boolean {
  if (!(el instanceof HTMLElement || el instanceof SVGElement)) return false;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return false;
  return getComputedStyle(el).visibility !== "hidden";
}

/** First *visible* match. A comma list like `[data-tour="nav"], [data-tour="nav-mobile"]` is how a step handles desktop vs phone. */
export function resolveElement(selector: string): HTMLElement | null {
  let matches: NodeListOf<HTMLElement>;
  try {
    matches = document.querySelectorAll<HTMLElement>(selector);
  } catch {
    return null;
  }
  for (const el of matches) if (isVisible(el)) return el;
  return null;
}

/** True when a toggle, tab or switch is already in its "on" state, so clicking it would flip it back off. */
export function isOn(el: Element): boolean {
  const state = el.getAttribute("data-state");
  return state === "on" || state === "active" || el.getAttribute("aria-pressed") === "true" || el.getAttribute("aria-selected") === "true";
}

/**
 * Radix tabs switch on `mousedown`, toggles on `click`; sending both works for every control the tour touches.
 */
function activate(el: HTMLElement) {
  el.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, button: 0, view: window }));
  el.click();
}

/**
 * Resolves with the element once it exists, is visible, and has stopped moving (route transitions and sheet
 * slide-ins animate for a few hundred ms). Resolves null on timeout or when `cancelled()` turns true.
 */
export function waitForElement(selector: string, timeoutMs: number, cancelled: () => boolean = () => false): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const startedAt = performance.now();
    let last: { top: number; left: number; width: number; height: number } | null = null;
    let stableSince = 0;
    let done = false;

    const finish = (el: HTMLElement | null) => {
      if (done) return;
      done = true;
      observer.disconnect();
      window.clearInterval(timer);
      resolve(el);
    };

    const check = () => {
      if (done) return;
      if (cancelled()) return finish(null);
      const now = performance.now();
      const el = resolveElement(selector);
      if (el) {
        const r = el.getBoundingClientRect();
        const moved = !last || Math.abs(r.top - last.top) > 0.5 || Math.abs(r.left - last.left) > 0.5 || Math.abs(r.height - last.height) > 0.5 || Math.abs(r.width - last.width) > 0.5;
        last = { top: r.top, left: r.left, width: r.width, height: r.height };
        if (moved) stableSince = now;
        else if (now - stableSince >= 140) return finish(el);
        // Never wait forever for a element that keeps shifting (charts, lazy images): use it once the budget is spent.
        if (now - startedAt > timeoutMs) return finish(el);
      } else if (now - startedAt > timeoutMs) {
        return finish(null);
      }
    };

    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
    const timer = window.setInterval(check, 60);
    check();
  });
}

const ACTION_TARGET_TIMEOUT_MS = 4000;

/** Performs one `before` action (see TourBefore in src/content/tour/chapters.ts). Never throws. */
export async function runBeforeAction(action: string, cancelled: () => boolean): Promise<void> {
  const split = action.indexOf(":");
  const kind = split === -1 ? action : action.slice(0, split);
  const arg = split === -1 ? "" : action.slice(split + 1);

  switch (kind) {
    case "click":
    case "off": {
      const el = await waitForElement(arg, ACTION_TARGET_TIMEOUT_MS, cancelled);
      if (!el || cancelled()) return;
      const on = isOn(el);
      if (kind === "click" ? !on : on) activate(el);
      return;
    }
    case "atlas-focus": {
      // The Atlas registers its listener when it mounts; wait for its frame so the event isn't sent into the void.
      const map = await waitForElement('[data-tour="atlas-map"]', ACTION_TARGET_TIMEOUT_MS, cancelled);
      if (!map || cancelled()) return;
      window.dispatchEvent(new CustomEvent("atlas:focus", { detail: { teamId: arg === "none" ? null : arg } }));
      return;
    }
    default:
      console.warn(`Unknown tour action "${action}"`);
  }
}
