import type { LeagueTopic } from "./types";

export const rosterRulesTopic: LeagueTopic = {
  id: "roster-rules",
  title: "Roster Rules & Practice Squads",
  summary: "A team's 53-man roster, 48 gameday actives, and 17-man practice squad are three separate, overlapping player pools, each with its own eligibility rules.",
  sections: [
    {
      heading: "The 53-man roster",
      body: [
        "Once preseason cuts finish, every team sets its regular-season roster at a maximum of 53 players. This is the full pool of players a team owns the rights to for that week — it does not mean all 53 can suit up and play.",
        "Teams can add or drop players from the 53-man roster all season through waivers, trades, and free-agent signings, as long as they stay at or under the 53-player limit (short-term exceptions exist for practice-squad elevations and injury-related roster spots, covered below).",
      ],
    },
    {
      heading: "48 gameday actives",
      body: [
        "Only 48 of the 53 are actually active and eligible to play in a given week's game — the other 5 are 'inactive' for that game, a list each team sets a couple hours before kickoff.",
        "Coaches use the inactive list for roster management as much as injury: a healthy young player can be a normal healthy scratch one week to keep a veteran's roster spot active, then active the next.",
        "One of the 48 active spots is typically an emergency third quarterback rule exception in some seasons — check the current year's specific rule, since the NFL has adjusted the emergency-QB active-roster mechanics more than once.",
      ],
    },
    {
      heading: "The practice squad",
      body: [
        "Practice squad players practice with the team but are not on the 53-man roster and cannot play in games unless first signed to the active roster (or 'elevated' for a single game, a limited number of times per season per player).",
        "Practice squad eligibility is mostly built around limited NFL/team experience (rules on accrued seasons), which keeps the practice squad focused on developmental players rather than becoming a second bench of veterans.",
        "An international pathway exemption lets each team carry one additional practice-squad player from the NFL's International Player Pathway program, beyond the normal practice-squad limit, without that player counting against the standard practice-squad size.",
      ],
    },
    {
      heading: "Injured reserve, PUP, and NFI",
      body: [
        "A player placed on Injured Reserve (IR) comes off the 53-man roster but stays under the team's control while he recovers; the team can then sign a replacement to the 53-man roster in his place.",
        "'Designated for return' lets a team bring a specific number of IR players back that same season once they've met a minimum time on IR, after which the team has a short practice window to decide whether to activate them.",
        "The Physically Unable to Perform (PUP) list is for players who enter camp hurt from an offseason injury, and the Non-Football Injury (NFI) list covers injuries unrelated to football; both keep a player off the active roster while he recovers, with their own timelines for potential return.",
      ],
    },
  ],
  relatedTopicIds: ["roster-statuses", "salary-cap", "waivers-and-trades"],
};

export const rosterStatusesTopic: LeagueTopic = {
  id: "roster-statuses",
  title: "Reading Roster Statuses in This App",
  summary: "Player rows in this app carry a short status code straight from the league's own roster reporting — here's what each one means.",
  sections: [
    {
      heading: "The codes you'll see",
      body: [
        "Every player's roster_status reflects their most recent reported status with their team, as reported to the league and synced from nflverse. A blank/unset status usually just means the player predates consistent roster-status reporting (mostly pre-2002 or very sparsely tracked historical seasons).",
      ],
      list: [
        { term: "ACT", description: "Active — on the 53-man roster and eligible to be part of the 48 who dress for games." },
        { term: "RES", description: "Reserve — off the active 53-man count but still under team control: covers injured reserve, PUP, NFI, and reserve/suspended in this app's data, which does not split reserve into its specific sub-list." },
        { term: "DEV", description: "Practice squad ('development' squad) — practicing with the team but not on the active 53-man roster." },
        { term: "INA", description: "Inactive — set as a gameday inactive for that week; still on the 53-man roster, just not one of that week's 48 active players." },
        { term: "CUT", description: "Released — no longer on the team; kept in this app's history so the player's time with that team is still visible." },
        { term: "RET", description: "Retired." },
        { term: "EXE", description: "Exempt — on the league's Commissioner Exempt list, away from the team (most often during a legal or disciplinary process) while still under team control." },
      ],
    },
    {
      heading: "Reading it correctly",
      body: [
        "A status is a snapshot, not a season-long label — a player can move between ACT, RES, and INA multiple times across one season as injuries and roster moves happen. This app shows each player's most recent status, not a full history of every change.",
        "'RES' collapses several distinct real-world lists (IR, PUP, NFI, reserve/suspended, reserve/retired-in-progress) into one code, because the underlying weekly roster report doesn't always specify which reserve list a player is on — treat RES as 'not currently available to play' rather than a specific injury designation.",
      ],
    },
  ],
  relatedTopicIds: ["roster-rules"],
};
