"use client";

import { CircleCheckIcon, CompassIcon, PlayIcon, RotateCcwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TOUR_CHAPTERS, minutesFor } from "@/content/tour/chapters";
import { resetProgress } from "@/lib/tour/progress";
import { useTourProgress } from "@/lib/tour/use-progress";
import { cn } from "@/lib/utils";
import { useTour } from "./tour-provider";

/** Chapter cards with progress checkmarks, "Start full tour", per-chapter start, and "Reset progress". */
export function TourCenter() {
  const progress = useTourProgress();
  const { startFull, startChapter } = useTour();
  const done = TOUR_CHAPTERS.filter((c) => progress.completed.includes(c.id)).length;

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center gap-3" data-tour="tour-center-actions">
        <Button size="lg" onClick={startFull}>
          <CompassIcon />
          Start full tour
          <span className="font-normal opacity-75">· about {minutesFor(TOUR_CHAPTERS)} min</span>
        </Button>
        {progress.ready && progress.completed.length > 0 && (
          <Button variant="outline" size="lg" onClick={resetProgress}>
            <RotateCcwIcon />
            Reset progress
          </Button>
        )}
        <p className="ml-auto text-sm text-muted-foreground tabular-nums" aria-live="polite">
          {progress.ready ? `${done} of ${TOUR_CHAPTERS.length} chapters done` : " "}
        </p>
      </div>

      <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-tour="tour-center-chapters">
        {TOUR_CHAPTERS.map((chapter, index) => {
          const complete = progress.completed.includes(chapter.id);
          const resumeAt = progress.last?.chapterId === chapter.id && progress.last.step > 0 ? progress.last.step : 0;
          const inProgress = !complete && resumeAt > 0;
          return (
            <li
              key={chapter.id}
              className={cn(
                "flex flex-col rounded-2xl border bg-card p-5 transition-colors",
                complete && "border-win/30 bg-win/[0.04]",
              )}
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <span className="font-display text-3xl leading-none font-semibold text-muted-foreground tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {complete ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-win">
                    <CircleCheckIcon className="size-4" aria-hidden="true" />
                    Done
                  </span>
                ) : inProgress ? (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-primary">In progress</span>
                ) : null}
              </div>
              <h2 className="text-2xl leading-tight font-semibold">{chapter.title}</h2>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{chapter.summary}</p>
              <div className="mt-4 flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {chapter.steps.length} steps · {minutesFor([chapter])} min
                </span>
                <Button variant={complete ? "outline" : "default"} size="sm" onClick={() => startChapter(chapter.id, inProgress ? resumeAt : 0)}>
                  {complete ? <RotateCcwIcon /> : <PlayIcon />}
                  {complete ? "Replay" : inProgress ? `Resume at step ${resumeAt + 1}` : "Start"}
                </Button>
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}
