import type { LeagueTopic } from "./types";

export const franchiseStructureTopic: LeagueTopic = {
  id: "franchise-structure",
  title: "How a Franchise Is Organized",
  summary: "Every NFL team runs on the same basic chain of command, from the person who owns the franchise down to the coaches working with individual position groups.",
  diagram: "org-chart",
  sections: [
    {
      heading: "The chain of command",
      body: [
        "At the top is the owner (or ownership group), who holds the franchise itself — one of only 32 in existence — and has final say on everything, though most stay out of day-to-day football decisions.",
        "The owner hires a General Manager (GM), who runs the football side of the business: scouting, the draft, free agency, trades, and the roster budget (the salary cap). Titles vary by team — some use 'President of Football Operations' or 'Executive Vice President' above or instead of a GM — but the job is the same.",
        "The GM hires (or the owner hires, with the GM's input) the head coach, who runs the team on the field: the coaching staff, practice, in-game decisions, and day-to-day player development. In a growing number of organizations the head coach reports to a GM who outranks him on personnel; in others the two are closer to equals who share power.",
      ],
    },
    {
      heading: "The coaching staff below the head coach",
      body: [
        "The offensive coordinator (OC) and defensive coordinator (DC) each run one half of the game plan — designing the scheme, calling (or helping call) plays, and managing their unit's position coaches. Many teams also have a special teams coordinator running kicks, punts, and returns.",
        "Below the coordinators are position coaches — a quarterbacks coach, offensive line coach, secondary coach, and so on — each working directly with a small group of players on technique and weekly game-planning.",
        "A head coach usually comes up through one side of the ball (offense or defense) as a coordinator first; many still call their own side's plays even after becoming head coach, while leaning on the other coordinator to run the opposite unit.",
      ],
    },
    {
      heading: "Where scouting and analytics fit in",
      body: [
        "Scouting departments (college scouts, pro scouts who study other teams' rosters, and increasingly analytics staff) report up to the GM, feeding the draft and free-agency decisions rather than the on-field coaching staff.",
        "Most teams now also have an analytics group advising on fourth-down decisions, roster construction, and contract value — typically reporting to the GM's side of the organization rather than the coaching staff, though the two groups work closely together during the season.",
      ],
    },
  ],
  relatedTopicIds: ["salary-cap", "draft"],
};
