"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = [
  { value: "overview", label: "Overview" },
  { value: "roster", label: "Roster" },
  { value: "schedule", label: "Schedule" },
  { value: "history", label: "History" },
] as const;

type TabValue = (typeof TABS)[number]["value"];

/** Client-side tabs over server-rendered panels (so every panel is prerendered and the tour can target triggers). */
export function TeamTabs({ panels }: { panels: Record<TabValue, React.ReactNode> }) {
  return (
    <Tabs defaultValue="overview" className="gap-6">
      <TabsList className="w-full justify-start sm:w-auto" data-tour="team-tabs">
        {TABS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} data-tour={`team-tab-${tab.value}`}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {TABS.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
          {panels[tab.value]}
        </TabsContent>
      ))}
    </Tabs>
  );
}
