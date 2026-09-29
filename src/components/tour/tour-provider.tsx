"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { TOUR_CHAPTERS, chaptersForPath, getChapter } from "@/content/tour/chapters";
import { TourEngine, findChapters, type TourStatus } from "@/lib/tour/engine";
import { dismissPrompt } from "@/lib/tour/progress";
import { TourWelcomePrompt } from "./tour-welcome-prompt";

interface TourApi {
  running: boolean;
  /** The chapter currently on screen (null when no tour is running). */
  activeChapterId: string | null;
  /** Runs the whole tour, chapter after chapter. */
  startFull: () => void;
  /** Runs one chapter from its first step. */
  startChapter: (id: string, step?: number) => void;
  /** Runs the chapters that belong to the page the reader is on ("Tour this page"). Returns false when none do. */
  startPage: (pathname: string) => boolean;
  stop: () => void;
}

const TourContext = createContext<TourApi | null>(null);

export function useTour(): TourApi {
  const api = useContext(TourContext);
  if (!api) throw new Error("useTour must be used inside <TourProvider>");
  return api;
}

/** Owns the tour engine (src/lib/tour/engine.ts), exposes start/stop to the UI, and hosts the first-visit prompt. */
export function TourProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<TourStatus>({ running: false, chapterId: null });
  const [engine] = useState(() => new TourEngine({ navigate: () => {}, onStatus: () => {} }));

  useEffect(() => {
    engine.setHooks({ navigate: (href) => router.push(href), onStatus: setStatus });
    return () => engine.stop();
  }, [engine, router]);

  const startFull = useCallback(() => {
    dismissPrompt();
    void engine.start(TOUR_CHAPTERS, "full");
  }, [engine]);
  const startChapter = useCallback(
    (id: string, step?: number) => {
      const chapter = getChapter(id);
      if (!chapter) return;
      dismissPrompt();
      void engine.start([chapter], "chapter", { step });
    },
    [engine],
  );
  const startPage = useCallback(
    (pathname: string) => {
      const chapters = chaptersForPath(pathname);
      if (chapters.length === 0) return false;
      dismissPrompt();
      void engine.start(findChapters(chapters.map((c) => c.id)), "page", { fromPath: pathname });
      return true;
    },
    [engine],
  );
  const stop = useCallback(() => engine.stop(), [engine]);

  const api = useMemo<TourApi>(
    () => ({ running: status.running, activeChapterId: status.chapterId, startFull, startChapter, startPage, stop }),
    [status, startFull, startChapter, startPage, stop],
  );

  return (
    <TourContext.Provider value={api}>
      {children}
      <TourWelcomePrompt />
    </TourContext.Provider>
  );
}
