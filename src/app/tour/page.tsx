import type { Metadata } from "next";
import { TourCenter } from "@/components/tour/tour-center";

export const metadata: Metadata = {
  title: "Tour center",
  description: "A guided walk through every feature of Gridiron Atlas, following the Detroit Lions.",
};

export default function TourPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <header className="mb-8 max-w-3xl">
        <p className="eyebrow mb-3 text-primary">Tour center</p>
        <h1 className="text-5xl font-bold text-balance sm:text-6xl">Learn the app by following the Lions</h1>
        <p className="mt-4 text-muted-foreground">
          Take the whole tour in one go, or pick a chapter. Each stop teaches one feature and, where it fits, one thing about how the
          league works. Press Esc to leave at any time; your place is remembered.
        </p>
      </header>
      <TourCenter />
    </div>
  );
}
