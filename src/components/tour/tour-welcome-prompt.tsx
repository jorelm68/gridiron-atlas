"use client";

import { CompassIcon, XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { TOUR_CHAPTERS, minutesFor } from "@/content/tour/chapters";
import { dismissPrompt } from "@/lib/tour/progress";
import { useTourProgress } from "@/lib/tour/use-progress";
import { useTour } from "./tour-provider";

const QUIET_PATHS = ["/tour", "/setup"];
const SHOW_DELAY_MS = 1600;

/**
 * A small, non-blocking first-visit card: "New here? Take the tour." Shown once (until dismissed or a tour is
 * started) and only where the choice can be remembered, so it never nags on every page load.
 */
export function TourWelcomePrompt() {
  const pathname = usePathname();
  const progress = useTourProgress();
  const { running, startFull } = useTour();
  const [delayed, setDelayed] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setDelayed(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const eligible =
    progress.ready && progress.persistent && !progress.promptDismissed && progress.completed.length === 0 && !running && !QUIET_PATHS.includes(pathname);
  const minutes = minutesFor(TOUR_CHAPTERS);

  return (
    <AnimatePresence>
      {eligible && delayed && (
        <motion.aside
          key="tour-prompt"
          aria-label="Take the guided tour"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          className="fixed right-4 bottom-4 left-4 z-40 rounded-2xl border bg-popover p-4 text-popover-foreground shadow-2xl ring-1 ring-foreground/5 sm:left-auto sm:w-88"
        >
          <button
            type="button"
            onClick={dismissPrompt}
            aria-label="Dismiss"
            className="absolute top-2.5 right-2.5 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <XIcon className="size-4" aria-hidden="true" />
          </button>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              <CompassIcon className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 pr-5">
              <p className="eyebrow text-primary">New here?</p>
              <p className="font-display text-xl leading-tight font-semibold">Take the {minutes}-minute tour</p>
              <p className="mt-1 text-sm text-muted-foreground">
                A guided walk through every feature, following the Detroit Lions from the map to the box score.
              </p>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={dismissPrompt}>
              Not now
            </Button>
            <Button
              size="sm"
              onClick={() => {
                dismissPrompt();
                startFull();
              }}
            >
              Start
            </Button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
