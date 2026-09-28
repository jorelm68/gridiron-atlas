/** Typed content model for league-mechanics topic pages (/learn/league/[id]). */

export interface LeagueCallout {
  title: string;
  body: string;
}

export interface LeagueDefinitionItem {
  term: string;
  description: string;
}

export interface LeagueSection {
  heading: string;
  /** One or more short paragraphs. */
  body: string[];
  /** Optional term/definition list (roster statuses, draft rounds, tags, etc.). */
  list?: LeagueDefinitionItem[];
  callout?: LeagueCallout;
}

export type LeagueDiagram = "org-chart" | "playoff-bracket" | "season-timeline" | "depth-chart";

export interface LeagueTopic {
  id: string;
  title: string;
  summary: string;
  sections: LeagueSection[];
  /** A small SVG diagram to render after the intro, when one clarifies the topic. */
  diagram?: LeagueDiagram;
  relatedStatIds?: string[];
  relatedTopicIds?: string[];
}
