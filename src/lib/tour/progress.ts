/**
 * Tour progress in localStorage: completed chapters, where the last chapter stopped, and whether the first-visit
 * prompt was dismissed. Every storage access is wrapped in try/catch (private windows and blocked storage throw);
 * when storage is unavailable progress lives in memory for the session and `persistent` is false, so nothing
 * that depends on remembering (the first-visit prompt) nags on every page load.
 */

const KEY = "gridiron-atlas:tour:v1";

export interface TourProgress {
  /** False during server rendering and the hydration pass, true once the browser state has been read. */
  ready: boolean;
  /** False when localStorage can't be used, so choices won't survive a reload. */
  persistent: boolean;
  completed: readonly string[];
  /** The chapter that was in progress and the step it stopped on. */
  last: { chapterId: string; step: number } | null;
  promptDismissed: boolean;
}

const SERVER_STATE: TourProgress = { ready: false, persistent: false, completed: [], last: null, promptDismissed: false };

let state: TourProgress | null = null;
const listeners = new Set<() => void>();

function load(): TourProgress {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<TourProgress>) : {};
    return {
      ready: true,
      persistent: true,
      completed: Array.isArray(parsed.completed) ? parsed.completed.filter((id) => typeof id === "string") : [],
      last:
        parsed.last && typeof parsed.last.chapterId === "string" && typeof parsed.last.step === "number"
          ? { chapterId: parsed.last.chapterId, step: parsed.last.step }
          : null,
      promptDismissed: parsed.promptDismissed === true,
    };
  } catch {
    return { ...SERVER_STATE, ready: true };
  }
}

function persist(next: TourProgress) {
  try {
    const { completed, last, promptDismissed } = next;
    window.localStorage.setItem(KEY, JSON.stringify({ completed, last, promptDismissed }));
  } catch {
    /* storage is full or blocked: keep going in memory */
  }
}

function emit() {
  listeners.forEach((listener) => listener());
}

export function getProgress(): TourProgress {
  if (typeof window === "undefined") return SERVER_STATE;
  state ??= load();
  return state;
}

export function getServerProgress(): TourProgress {
  return SERVER_STATE;
}

export function subscribeProgress(listener: () => void) {
  listeners.add(listener);
  // Another tab changed the stored progress.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== KEY && event.key !== null) return;
    state = load();
    emit();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function update(patch: (current: TourProgress) => Partial<TourProgress>) {
  const current = getProgress();
  state = { ...current, ...patch(current) };
  persist(state);
  emit();
}

export const markChapterComplete = (chapterId: string) =>
  update((p) => ({
    completed: p.completed.includes(chapterId) ? p.completed : [...p.completed, chapterId],
    last: p.last?.chapterId === chapterId ? null : p.last,
  }));

export const rememberStep = (chapterId: string, step: number) => update(() => ({ last: { chapterId, step } }));

export const dismissPrompt = () => update(() => ({ promptDismissed: true }));

export const resetProgress = () => update(() => ({ completed: [], last: null, promptDismissed: true }));
