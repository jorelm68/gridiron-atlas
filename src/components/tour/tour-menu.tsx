"use client";

import { CircleHelpIcon, CompassIcon, LayoutGridIcon, MapPinnedIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TOUR_CHAPTERS, chaptersForPath, minutesFor } from "@/content/tour/chapters";
import { useTour } from "./tour-provider";

/** The header "?" button: tour this page, the full tour, or the Tour Center. */
export function TourMenu() {
  const pathname = usePathname();
  const { startFull, startPage } = useTour();
  const pageChapters = chaptersForPath(pathname);
  // Radix hands focus back to the trigger when the menu closes; skip that when a tour is about to take focus.
  const startingTour = useRef(false);

  // Let the menu finish closing before the tour looks for anchors and moves focus.
  const launch = (start: () => void) => {
    startingTour.current = true;
    window.setTimeout(start, 180);
  };

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Guided tour" data-tour="tour-menu">
              <CircleHelpIcon />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Guided tour</TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        align="end"
        className="w-72"
        onCloseAutoFocus={(event) => {
          if (startingTour.current) {
            event.preventDefault();
            startingTour.current = false;
          }
        }}
      >
        <DropdownMenuItem
          disabled={pageChapters.length === 0}
          onSelect={() => launch(() => startPage(pathname))}
          className="items-start gap-2.5 py-2"
        >
          <MapPinnedIcon className="mt-0.5 text-primary" />
          <span className="flex flex-col">
            <span className="font-medium">Tour this page</span>
            <span className="text-xs text-muted-foreground">
              {pageChapters.length > 0 ? pageChapters.map((c) => c.title).join(" · ") : "No page tour here. Try the full tour."}
            </span>
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => launch(startFull)} className="items-start gap-2.5 py-2">
          <CompassIcon className="mt-0.5 text-primary" />
          <span className="flex flex-col">
            <span className="font-medium">Full tour</span>
            <span className="text-xs text-muted-foreground">
              {TOUR_CHAPTERS.length} chapters, about {minutesFor(TOUR_CHAPTERS)} minutes, following the Lions
            </span>
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="gap-2.5 py-2">
          <Link href="/tour">
            <LayoutGridIcon className="text-primary" />
            <span className="font-medium">Tour center</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
