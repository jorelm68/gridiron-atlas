import type { LeagueTopic } from "./types";

export const seasonCalendarTopic: LeagueTopic = {
  id: "season-calendar",
  title: "The Season Calendar",
  summary: "The NFL year runs on a fixed annual cycle — a new 'league year' opens in March, months before a single regular-season snap is played.",
  diagram: "season-timeline",
  sections: [
    {
      heading: "Offseason: a new league year begins",
      body: [
        "The league year (and the salary cap for that year) opens in mid-March. This is when free agency begins — teams can officially sign players whose contracts have expired, and the year's cap number takes effect.",
        "In the weeks before the league year opens, teams can apply the franchise or transition tag to one of their own impending free agents, and use a 'legal tampering' negotiating window (typically the 2 days right before free agency opens) to work out deals that become official once the league year starts.",
      ],
    },
    {
      heading: "The draft and offseason programs",
      body: [
        "The draft is held in late April, 7 rounds over 3 days. Teams then sign their draft picks and a wave of undrafted free agents.",
        "Through the spring, teams run voluntary offseason workouts followed by mandatory minicamp — organized practice time with no live contact, focused on installing schemes and evaluating the roster before training camp.",
      ],
    },
    {
      heading: "Training camp and preseason",
      body: [
        "Training camp opens in late July: full-squad practices, the first live contact of the year, and the buildup to final roster cuts.",
        "The preseason (3 exhibition games per team in recent years) runs through August and is used to evaluate roster bubble players, not to prepare starters, who typically play limited snaps.",
        "Rosters are cut down from the offseason's larger roster to the 53-man regular-season limit right before Week 1, with a practice squad then built from many of the players let go.",
      ],
    },
    {
      heading: "Regular season and the trade deadline",
      body: [
        "The regular season runs 18 weeks for 17 games per team (each team gets one bye week), starting in early September and running through early January.",
        "The trade deadline falls in early November, roughly at the season's midpoint — the last day teams can trade players until the following offseason (waivers remain available after that for players a team releases).",
      ],
    },
    {
      heading: "Playoffs and the offseason turnover",
      body: [
        "The playoffs run through January, ending with the Super Bowl in February. The following week, the new league year's countdown effectively resumes: coaching changes, front-office moves, and franchise-tag decisions cluster in this window before free agency reopens the cycle in March.",
      ],
    },
  ],
  relatedTopicIds: ["salary-cap", "draft", "waivers-and-trades", "roster-rules"],
};
