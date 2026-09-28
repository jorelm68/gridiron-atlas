import type { LeagueTopic } from "./types";

export const playoffsTopic: LeagueTopic = {
  id: "playoffs",
  title: "Playoff Format & Tiebreakers",
  summary: "Seven teams per conference make the playoffs; the top seed gets a bye and the bracket reseeds every round so a lower seed can never host a higher one.",
  diagram: "playoff-bracket",
  sections: [
    {
      heading: "Who gets in",
      body: [
        "Each conference sends 7 of its 16 teams to the playoffs: the 4 division winners (seeded 1–4 by record, regardless of division) plus 3 'wild card' teams — the next-best non-division-winning records in that conference (seeded 5–7).",
        "The #1 seed in each conference — the best division winner — earns a first-round bye, skipping the Wild Card round entirely and waiting to host a Divisional-round game.",
      ],
    },
    {
      heading: "The bracket and reseeding",
      body: [
        "Wild Card round: #2 hosts #7, #3 hosts #6, #4 hosts #5. The #1 seed sits out.",
        "Divisional round: the bracket reseeds rather than following a fixed bracket slot. The #1 seed hosts whichever remaining team has the lowest seed number; the other two remaining teams play each other, hosted by whichever of them has the better seed.",
        "Conference Championship: the two Divisional-round winners play, hosted by whichever has the better seed.",
        "The two Conference Champions meet in the Super Bowl, played at a predetermined neutral site chosen years in advance — home field doesn't apply.",
        "Every playoff round is single-elimination — one loss and a team's season is over.",
      ],
    },
    {
      heading: "Tiebreaker basics",
      body: [
        "When teams finish with identical records, the NFL works through a fixed tiebreaker order rather than a coin flip. For two teams, the most common early tiebreakers are: head-to-head result, division record (if in the same division), common-games record, and conference record.",
        "For three or more tied teams, or ties across divisions for a wild card spot, the formula continues through additional steps (strength of victory, strength of schedule, and further tiebreakers) before reaching a true coin flip, which is exceedingly rare in practice.",
        "Division ties are broken before wild card ties, since a division winner is locked into the playoffs regardless of how its record compares to teams elsewhere in the conference.",
      ],
    },
  ],
  relatedStatIds: ["division-record", "strength-of-schedule"],
  relatedTopicIds: ["schedule-format", "season-calendar"],
};
