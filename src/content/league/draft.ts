import type { LeagueTopic } from "./types";

export const draftTopic: LeagueTopic = {
  id: "draft",
  title: "The Draft: Order, Compensatory Picks & Trades",
  summary: "Seven rounds, one pick per team per round as a baseline — except the draft order runs worst-to-first, extra 'compensatory' picks get added for lost free agents, and picks are traded constantly.",
  sections: [
    {
      heading: "Seven rounds, worst to first",
      body: [
        "The draft runs 7 rounds, held over 3 days in late April, with each of the 32 teams holding one pick per round as a starting baseline (before trades and compensatory picks reshape things — see below).",
        "The base order in round 1 runs from the team with the worst prior-season record to the team with the best, with the two Super Bowl participants picking last: the Super Bowl loser picks 31st, and the defending champion picks 32nd.",
        "Playoff teams are slotted in among the last picks by how far they advanced (an early playoff exit picks earlier than a Super Bowl participant), and this same worst-to-first logic re-sets and repeats for every round, not just round 1.",
        "Ties in draft position are broken using a strength-of-schedule tiebreaker (the team with the weaker schedule the prior season picks earlier), among other tiebreaking rules for teams with identical records.",
      ],
    },
    {
      heading: "Compensatory picks",
      body: [
        "Compensatory picks are extra picks (beyond each team's normal 1-per-round allotment) awarded to teams that lost more notable free agents than they signed the prior offseason, as a way to soften the loss of a valuable player who left in free agency.",
        "They're calculated by a league formula weighing the salary, playing time, and postseason honors of the free agents lost versus signed — the exact formula isn't fully public, but bigger, more decorated departures earn earlier compensatory picks.",
        "Compensatory picks are attached to the end of rounds 3 through 7 (never rounds 1–2) and, unlike normal picks, generally cannot be traded away before the draft in which they're awarded — only the team that earned one can use it.",
      ],
    },
    {
      heading: "Trading picks",
      body: [
        "Draft picks are traded constantly, both in the days and weeks before the draft and live during it — teams commonly move up to target a specific prospect, or trade down to collect more picks by turning one high pick into multiple later ones.",
        "There's no single official trade-value chart the league uses; teams generally negotiate off their own internal draft-value charts, though a well-known public one (the original 'Jimmy Johnson chart,' along with newer analytically-derived versions) is widely referenced as a starting point.",
        "Picks can also be traded for players, or packaged with players in larger trades — future-year picks (not just the current draft's) are tradable too, though the league limits how far into the future a pick can be dealt.",
      ],
    },
  ],
  relatedTopicIds: ["salary-cap", "season-calendar", "franchise-structure"],
};
