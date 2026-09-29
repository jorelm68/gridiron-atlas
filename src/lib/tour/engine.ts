import type { Driver } from "driver.js";
import { LIONS_GAME_ROUTE, TOUR_CHAPTERS, type TourChapter, type TourStep } from "@/content/tour/chapters";
import { runBeforeAction, sleep, waitForElement } from "./dom";
import { markChapterComplete, rememberStep } from "./progress";

export type TourMode = "full" | "chapter" | "page";

export interface TourStatus {
  running: boolean;
  chapterId: string | null;
}

export interface EngineHooks {
  navigate: (href: string) => void;
  onStatus: (status: TourStatus) => void;
}

/** Same-page steps get a short wait; after a route change a page may have to compile and fetch data first. */
const SAME_PAGE_TIMEOUT_MS = 6000;
const AFTER_NAVIGATION_TIMEOUT_MS = 15000;

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const pathOf = (route: string) => route.split(/[?#]/)[0];

/**
 * Runs chapters of tour steps with driver.js, one highlight at a time. driver.js only knows about one page, so
 * the engine owns the flow: it changes routes, waits for each anchor, performs `before` actions, skips steps whose
 * anchor never shows up, and remembers progress. Framework-free on purpose; the React side is tour-provider.tsx.
 */
export class TourEngine {
  private seq = 0;
  private queue: TourChapter[] = [];
  private ci = 0;
  private si = 0;
  private mode: TourMode = "chapter";
  private drv: Driver | null = null;
  private running = false;
  private lionsGamePath: string | null = null;

  constructor(private hooks: EngineHooks) {}

  setHooks(hooks: EngineHooks) {
    this.hooks = hooks;
  }

  get isRunning() {
    return this.running;
  }

  /**
   * Starts a queue of chapters. `fromPath` begins at the first step that already lives on that page; `step` resumes
   * the first chapter at a given step.
   */
  async start(chapters: readonly TourChapter[], mode: TourMode, { fromPath, step }: { fromPath?: string; step?: number } = {}) {
    if (chapters.length === 0) return;
    this.teardown();
    const seq = ++this.seq;
    this.queue = [...chapters];
    this.mode = mode;
    this.running = true;
    this.lionsGamePath = null;
    this.hooks.onStatus({ running: true, chapterId: chapters[0].id });
    window.addEventListener("keydown", this.onKeyDown, true);

    let startStep = step ?? 0;
    if (fromPath) {
      const first = this.queue[0];
      const found = first.steps.findIndex((step) => this.matchesPath(step, first, fromPath));
      if (found > 0) startStep = found;
      if (first.steps.some((s) => (s.route ?? first.route) === LIONS_GAME_ROUTE) && fromPath.startsWith("/games/")) {
        this.lionsGamePath = fromPath;
      }
    }
    await this.go(0, startStep, 1, seq);
  }

  stop() {
    this.seq++;
    this.teardown();
    this.finishStatus();
  }

  next() {
    if (!this.running) return;
    void this.go(this.ci, this.si + 1, 1, ++this.seq);
  }

  prev() {
    if (!this.running) return;
    void this.go(this.ci, this.si - 1, -1, ++this.seq);
  }

  // ---- flow -------------------------------------------------------------------------------------------------

  private matchesPath(step: TourStep, chapter: TourChapter, path: string) {
    const route = step.route ?? chapter.route;
    return route === LIONS_GAME_ROUTE ? path.startsWith("/games/") : pathOf(route) === path;
  }

  private async go(ci: number, si: number, dir: 1 | -1, seq: number) {
    const cancelled = () => seq !== this.seq;
    // Bounded: every pass either shows a step, moves to another chapter, or gives up.
    for (let guard = 0; guard < 200; guard++) {
      if (ci < 0) {
        ci = 0;
        si = 0;
        dir = 1;
      }
      if (ci >= this.queue.length) return this.complete();
      const chapter = this.queue[ci];
      if (si >= chapter.steps.length) {
        markChapterComplete(chapter.id);
        ci++;
        si = 0;
        dir = 1;
        continue;
      }
      if (si < 0) {
        ci--;
        si = ci >= 0 ? this.queue[ci].steps.length - 1 : 0;
        continue;
      }

      const step = chapter.steps[si];
      const el = await this.prepare(step, chapter, cancelled);
      if (cancelled()) return;
      if (!el) {
        si += dir;
        continue;
      }
      this.ci = ci;
      this.si = si;
      this.hooks.onStatus({ running: true, chapterId: chapter.id });
      rememberStep(chapter.id, si);
      await this.show(el, step, chapter, ci, si);
      return;
    }
    this.stop();
  }

  private complete() {
    this.seq++;
    this.teardown();
    this.finishStatus();
  }

  /** Gets the page ready for a step and returns its anchor, or null when the step should be skipped. */
  private async prepare(step: TourStep, chapter: TourChapter, cancelled: () => boolean): Promise<HTMLElement | null> {
    const route = await this.resolveRoute(step.route ?? chapter.route);
    if (!route || cancelled()) return null;

    let timeout = SAME_PAGE_TIMEOUT_MS;
    if (window.location.pathname !== pathOf(route)) {
      // The overlay would otherwise sit over the outgoing page while the next one loads.
      this.clearHighlight();
      this.hooks.navigate(route);
      timeout = AFTER_NAVIGATION_TIMEOUT_MS;
      // Wait for the outgoing page to be replaced, so an anchor with the same selector isn't matched on it.
      const deadline = performance.now() + timeout;
      while (window.location.pathname !== pathOf(route) && performance.now() < deadline) {
        if (cancelled()) return null;
        await sleep(40);
      }
    }

    if (step.before) {
      const actions = typeof step.before === "string" ? [step.before] : step.before;
      for (const action of actions) {
        if (cancelled()) return null;
        await runBeforeAction(action, cancelled);
        await sleep(120);
      }
    }
    if (cancelled()) return null;
    return waitForElement(step.element, timeout, cancelled);
  }

  private async resolveRoute(route: string): Promise<string | null> {
    if (route !== LIONS_GAME_ROUTE) return route;
    if (this.lionsGamePath) return this.lionsGamePath;
    try {
      const response = await fetch("/api/tour/lions-game");
      if (!response.ok) return null;
      const data = (await response.json()) as { href?: string };
      this.lionsGamePath = data.href ?? null;
    } catch {
      this.lionsGamePath = null;
    }
    return this.lionsGamePath;
  }

  // ---- driver.js --------------------------------------------------------------------------------------------

  private async ensureDriver(): Promise<Driver> {
    if (this.drv) return this.drv;
    const { driver } = await import("driver.js");
    const reduced = reducedMotion();
    this.drv = driver({
      animate: !reduced,
      smoothScroll: !reduced,
      duration: 320,
      overlayColor: document.documentElement.classList.contains("dark") ? "#02050c" : "#0b1220",
      overlayOpacity: document.documentElement.classList.contains("dark") ? 0.68 : 0.5,
      stagePadding: 8,
      stageRadius: 14,
      popoverOffset: 10,
      popoverClass: "gridiron-tour",
      // Arrow keys and Esc are handled in onKeyDown: driver.js's own Back key does nothing for one-at-a-time highlights.
      allowKeyboardControl: false,
      allowClose: true,
      onDestroyStarted: () => this.stop(),
    });
    return this.drv;
  }

  private clearHighlight() {
    this.drv?.destroy();
    this.drv = null;
  }

  private async show(el: HTMLElement, step: TourStep, chapter: TourChapter, ci: number, si: number) {
    const seqAtStart = this.seq;
    const drv = await this.ensureDriver();
    if (seqAtStart !== this.seq) return;

    const isFirst = ci === 0 && si === 0;
    const isLastOfChapter = si === chapter.steps.length - 1;
    const isLastOfQueue = isLastOfChapter && ci === this.queue.length - 1;
    const fraction = (si + 1) / chapter.steps.length;

    drv.highlight({
      element: el,
      disableActiveInteraction: !step.interactive,
      popover: {
        title: step.title,
        description: step.body,
        side: step.side ?? "bottom",
        align: "center",
        showButtons: isFirst ? ["next", "close"] : ["previous", "next", "close"],
        showProgress: true,
        progressText: `Step ${si + 1} of ${chapter.steps.length}`,
        prevBtnText: "Back",
        nextBtnText: isLastOfQueue ? "Finish" : isLastOfChapter ? (this.mode === "full" ? "Next chapter" : "Done") : "Next",
        onNextClick: () => this.next(),
        onPrevClick: () => this.prev(),
        onCloseClick: () => this.stop(),
        onPopoverRender: (popover) => {
          const eyebrow = document.createElement("p");
          eyebrow.className = "gridiron-tour-eyebrow";
          eyebrow.textContent = this.mode === "full" ? `${chapter.title} · ${ci + 1}/${this.queue.length}` : chapter.title;
          popover.wrapper.insertBefore(eyebrow, popover.title);
          popover.wrapper.style.setProperty("--tour-progress", String(fraction));
          popover.closeButton.setAttribute("aria-label", "Close tour");
        },
      },
    });
  }

  // ---- keyboard and cleanup ---------------------------------------------------------------------------------

  private onKeyDown = (event: KeyboardEvent) => {
    if (!this.running || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const target = event.target as HTMLElement | null;
    if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
    if (event.key === "Escape") this.stop();
    else if (event.key === "ArrowRight") this.next();
    else if (event.key === "ArrowLeft") this.prev();
    else return;
    event.preventDefault();
    event.stopPropagation();
  };

  private teardown() {
    window.removeEventListener("keydown", this.onKeyDown, true);
    this.clearHighlight();
    this.running = false;
  }

  private finishStatus() {
    this.hooks.onStatus({ running: false, chapterId: null });
  }
}

export const findChapters = (ids: readonly string[]) =>
  ids.map((id) => TOUR_CHAPTERS.find((c) => c.id === id)).filter((c): c is TourChapter => Boolean(c));

