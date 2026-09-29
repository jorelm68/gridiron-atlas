"use client";

import { MotionConfig } from "motion/react";
import { ThemeProvider } from "next-themes";
import { TourProvider } from "@/components/tour/tour-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
      {/* reducedMotion="user" makes every Motion animation honor prefers-reduced-motion. */}
      <MotionConfig reducedMotion="user" transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
        <TooltipProvider delayDuration={200}>
          <TourProvider>{children}</TourProvider>
        </TooltipProvider>
      </MotionConfig>
    </ThemeProvider>
  );
}
