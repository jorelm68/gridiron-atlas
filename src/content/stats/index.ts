import { advancedStats } from "./advanced";
import { defenseStats } from "./defense";
import { kickingStats } from "./kicking";
import { passingStats } from "./passing";
import { puntingStats } from "./punting";
import { receivingStats } from "./receiving";
import { rushingStats } from "./rushing";
import { teamStats } from "./team";
import type { StatCategory, StatDefinition } from "./types";

export * from "./types";

export const ALL_STATS: StatDefinition[] = [
  ...passingStats,
  ...rushingStats,
  ...receivingStats,
  ...defenseStats,
  ...kickingStats,
  ...puntingStats,
  ...teamStats,
  ...advancedStats,
];

const STATS_BY_ID = new Map(ALL_STATS.map((stat) => [stat.id, stat]));

export function getStatById(id: string): StatDefinition | undefined {
  return STATS_BY_ID.get(id);
}

export function getStatsByCategory(category: StatCategory): StatDefinition[] {
  return ALL_STATS.filter((stat) => stat.category === category);
}

export const STAT_CATEGORIES: { id: StatCategory; label: string; description: string }[] = [
  { id: "passing", label: "Passing", description: "Quarterback efficiency, volume, and advanced throwing metrics." },
  { id: "rushing", label: "Rushing", description: "Ball-carrier efficiency and workload." },
  { id: "receiving", label: "Receiving", description: "Target share, efficiency, and opportunity for pass catchers." },
  { id: "defense", label: "Defense", description: "Pass rush, run defense, and takeaways." },
  { id: "kicking", label: "Kicking", description: "Field goals and extra points." },
  { id: "punting", label: "Punting", description: "Field position and hang time." },
  { id: "team", label: "Team", description: "Whole-team efficiency, scoring, and schedule." },
  { id: "advanced", label: "Advanced Concepts", description: "The modeling ideas behind modern analytics, plus proprietary metrics explained (not computed)." },
];

/** All stats where the definition should link to a real worked example, keyed by related-id lookups. */
export function getRelatedStats(stat: StatDefinition): StatDefinition[] {
  return stat.related.map((id) => STATS_BY_ID.get(id)).filter((s): s is StatDefinition => Boolean(s));
}
