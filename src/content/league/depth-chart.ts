import type { LeagueTopic } from "./types";

export const depthChartTopic: LeagueTopic = {
  id: "depth-chart",
  title: "How to Read a Depth Chart",
  summary: "A depth chart ranks the players at each position in order of who plays first, second, and third — but it's the team's own unofficial estimate, not a binding or official league document.",
  diagram: "depth-chart",
  sections: [
    {
      heading: "What a depth chart shows",
      body: [
        "A depth chart lists every position group (quarterback, each offensive-line spot, each defensive-line and linebacker spot, cornerback, safety, and the specialists) with players ranked top to bottom in the order they're expected to play — the top name at a position is the starter, the next is the primary backup, and so on.",
        "Unlike a starting lineup announced right before a game, a depth chart is a standing, week-to-week document that's meant to reflect the coaching staff's current plan across the whole roster, not just who's active for Sunday.",
      ],
    },
    {
      heading: "It's the team's own document, not official",
      body: [
        "Depth charts aren't a league requirement in the way the 53-man roster or inactive list is — teams publish their own depth charts (often through their media relations staff) largely for the media and fans, and the level of detail and how often it's updated varies by team.",
        "Because it's self-reported, a depth chart can be a deliberate bit of gamesmanship as much as a literal plan — a team might list an injured or clearly backup player higher than reality to avoid tipping information to an upcoming opponent.",
        "Actual snap counts (how many plays a player was actually on the field for) are a more reliable after-the-fact signal of a team's real depth chart than the published document, especially at positions that rotate by situation (e.g., sub-package defensive linemen, third-down backs).",
      ],
    },
    {
      heading: "Reading position battles and role players",
      body: [
        "Two names listed as co-starters ('OR' on some teams' charts) usually signals a genuine open competition or a planned rotation, not a printing error — it's worth checking snap counts to see how a true split actually plays out week to week.",
        "Special/niche roles (a third-down back, a slot-specific cornerback, a package-specific pass rusher) don't always map cleanly onto a simple numbered depth chart, since some players are 'starters' in their specific role without leading their broader position group in total snaps.",
      ],
    },
  ],
  relatedTopicIds: ["roster-rules", "franchise-structure"],
};
