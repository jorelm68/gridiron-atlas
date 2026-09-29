"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/** Regular season / playoffs switch over two server-rendered tables (so glossary hover cards stay server components). */
export function SeasonTypeTabs({
  heading,
  regular,
  playoffs,
}: {
  heading: React.ReactNode;
  regular: React.ReactNode;
  /** Omit when the player has no playoff stat lines. */
  playoffs?: React.ReactNode;
}) {
  return (
    <Tabs defaultValue="REG" className="gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        {heading}
        {playoffs && (
          <TabsList>
            <TabsTrigger value="REG">Regular season</TabsTrigger>
            <TabsTrigger value="POST">Playoffs</TabsTrigger>
          </TabsList>
        )}
      </div>
      <TabsContent value="REG">{regular}</TabsContent>
      {playoffs && <TabsContent value="POST">{playoffs}</TabsContent>}
    </Tabs>
  );
}
