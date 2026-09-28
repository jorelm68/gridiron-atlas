import { depthChartTopic } from "./depth-chart";
import { draftTopic } from "./draft";
import { franchiseStructureTopic } from "./franchise-structure";
import { playoffsTopic } from "./playoffs";
import { relocationAndNamingTopic } from "./relocation-and-naming";
import { rosterRulesTopic, rosterStatusesTopic } from "./roster-rules";
import { salaryCapTopic } from "./salary-cap";
import { scheduleFormatTopic } from "./schedule-format";
import { seasonCalendarTopic } from "./season-calendar";
import type { LeagueTopic } from "./types";
import { waiversAndTradesTopic } from "./waivers-and-trades";

export * from "./types";

/** Ordered roughly the way a newcomer would want to learn them: org chart first, calendar mechanics last. */
export const LEAGUE_TOPICS: LeagueTopic[] = [
  franchiseStructureTopic,
  scheduleFormatTopic,
  playoffsTopic,
  rosterRulesTopic,
  rosterStatusesTopic,
  depthChartTopic,
  salaryCapTopic,
  draftTopic,
  waiversAndTradesTopic,
  seasonCalendarTopic,
  relocationAndNamingTopic,
];

const TOPICS_BY_ID = new Map(LEAGUE_TOPICS.map((topic) => [topic.id, topic]));

export function getTopicById(id: string): LeagueTopic | undefined {
  return TOPICS_BY_ID.get(id);
}

export function getRelatedTopics(topic: LeagueTopic): LeagueTopic[] {
  return (topic.relatedTopicIds ?? []).map((id) => TOPICS_BY_ID.get(id)).filter((t): t is LeagueTopic => Boolean(t));
}
