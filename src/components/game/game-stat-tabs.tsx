"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STAT_TABS = [
  { value: "passing", label: "Passing" },
  { value: "rushing", label: "Rushing" },
  { value: "receiving", label: "Receiving" },
  { value: "defense", label: "Defense" },
  { value: "kicking", label: "Kicking" },
] as const;

export type StatTabValue = (typeof STAT_TABS)[number]["value"];

/** Client-side tabs over server-rendered stat tables (each panel is prerendered for both teams). */
export function GameStatTabs({ panels }: { panels: Record<StatTabValue, React.ReactNode> }) {
  return (
    <Tabs defaultValue="passing" className="gap-4">
      <TabsList className="w-full justify-start sm:w-auto" data-tour="game-stat-tabs">
        {STAT_TABS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {STAT_TABS.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="animate-in fade-in-0 duration-300">
          {panels[tab.value]}
        </TabsContent>
      ))}
    </Tabs>
  );
}
