"use client";

import {
  ArrowLeftRightIcon,
  BuildingIcon,
  CalendarClockIcon,
  CalendarDaysIcon,
  ClipboardListIcon,
  FootprintsIcon,
  GoalIcon,
  HandIcon,
  ListChecksIcon,
  ListOrderedIcon,
  MapPinnedIcon,
  SearchIcon,
  SendIcon,
  ShieldIcon,
  SigmaIcon,
  TrophyIcon,
  UserPlusIcon,
  UsersIcon,
  WalletIcon,
  WindIcon,
  type LucideIcon,
} from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import type { StatCategory } from "@/content/stats";
import { leagueTopicHref, statHref } from "@/lib/routes";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS: Record<StatCategory, LucideIcon> = {
  passing: SendIcon,
  rushing: FootprintsIcon,
  receiving: HandIcon,
  defense: ShieldIcon,
  kicking: GoalIcon,
  punting: WindIcon,
  team: UsersIcon,
  advanced: SigmaIcon,
};

const TOPIC_ICONS: Record<string, LucideIcon> = {
  "franchise-structure": BuildingIcon,
  "schedule-format": CalendarDaysIcon,
  playoffs: TrophyIcon,
  "roster-rules": ClipboardListIcon,
  "roster-statuses": ListChecksIcon,
  "depth-chart": ListOrderedIcon,
  "salary-cap": WalletIcon,
  draft: UserPlusIcon,
  "waivers-and-trades": ArrowLeftRightIcon,
  "season-calendar": CalendarClockIcon,
  "relocation-and-naming": MapPinnedIcon,
};

export interface ExplorerStat {
  id: string;
  name: string;
  abbr?: string;
}

export interface ExplorerCategory {
  id: StatCategory;
  label: string;
  description: string;
  stats: ExplorerStat[];
}

export interface ExplorerTopic {
  id: string;
  title: string;
  summary: string;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } };

const matches = (query: string, ...fields: string[]) => fields.some((f) => f.toLowerCase().includes(query));

export function LearnExplorer({ categories, topics }: { categories: ExplorerCategory[]; topics: ExplorerTopic[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const filteredCategories = useMemo(() => {
    if (!q) return categories;
    return categories
      .map((cat) => {
        const categoryMatches = matches(q, cat.label, cat.description);
        const stats = categoryMatches ? cat.stats : cat.stats.filter((s) => matches(q, s.name, s.abbr ?? ""));
        return { ...cat, stats };
      })
      .filter((cat) => cat.stats.length > 0);
  }, [categories, q]);

  const filteredTopics = useMemo(() => {
    if (!q) return topics;
    return topics.filter((t) => matches(q, t.title, t.summary));
  }, [topics, q]);

  const noResults = filteredCategories.length === 0 && filteredTopics.length === 0;

  return (
    <div className="space-y-10">
      <div className="relative max-w-md">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search stats and league topics…"
          aria-label="Search stats and league topics"
          className="h-10 pl-8"
        />
      </div>

      {noResults && <p className="text-sm text-muted-foreground">No stats or topics match “{query}”.</p>}

      {filteredCategories.length > 0 && (
        <section aria-labelledby="stat-glossary-heading" data-tour="learn-stats">
          <h2 id="stat-glossary-heading" className="mb-4 font-display text-2xl font-semibold">
            Stat glossary
          </h2>
          <motion.div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" variants={container} initial="hidden" animate="show">
            {filteredCategories.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.id];
              return (
                <motion.div key={cat.id} variants={item} className="rounded-2xl border bg-card/60 p-4">
                  <div className="mb-1 flex items-center gap-2.5">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-primary/[0.1] text-primary">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <h3 className="font-display text-lg font-semibold">{cat.label}</h3>
                  </div>
                  <p className="mb-3 text-xs leading-relaxed text-muted-foreground">{cat.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.stats.map((s) => (
                      <Link
                        key={s.id}
                        href={statHref(s.id)}
                        className="rounded-md border border-border bg-card px-2 py-1 text-xs font-medium transition-colors hover:border-primary/40 hover:bg-primary/[0.08] hover:text-primary"
                      >
                        {s.abbr ?? s.name}
                      </Link>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </section>
      )}

      {filteredTopics.length > 0 && (
        <section aria-labelledby="league-mechanics-heading" data-tour="learn-league">
          <h2 id="league-mechanics-heading" className="mb-4 font-display text-2xl font-semibold">
            League mechanics
          </h2>
          <motion.div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" variants={container} initial="hidden" animate="show">
            {filteredTopics.map((topic) => {
              const Icon = TOPIC_ICONS[topic.id] ?? ListChecksIcon;
              return (
                <motion.div key={topic.id} variants={item}>
                  <Link
                    href={leagueTopicHref(topic.id)}
                    className={cn(
                      "group flex h-full flex-col gap-2 rounded-2xl border bg-card/60 p-4 transition-colors",
                      "hover:border-primary/40 hover:bg-primary/[0.05]",
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-8 items-center justify-center rounded-lg bg-primary/[0.1] text-primary">
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <h3 className="font-display text-lg leading-tight font-semibold group-hover:text-primary">{topic.title}</h3>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">{topic.summary}</p>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </section>
      )}
    </div>
  );
}
