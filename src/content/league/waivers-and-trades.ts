import type { LeagueTopic } from "./types";

export const waiversAndTradesTopic: LeagueTopic = {
  id: "waivers-and-trades",
  title: "Waivers & the Trade Deadline",
  summary: "A released player usually doesn't become a free agent right away — he passes through a waiver claim process first — and trades stop being allowed after a fixed deadline roughly at midseason.",
  sections: [
    {
      heading: "How waivers work",
      body: [
        "When a team releases a player who has less than the veteran threshold of accrued NFL seasons (roughly, players early in their careers), he doesn't immediately become a free agent — he's first placed on waivers, where any other team can claim him and take over his existing contract.",
        "Waiver priority runs in reverse order of current standings (worst record picks first), reset weekly during the season and re-set by the prior season's order once the new league year begins — the same worst-to-first logic that shapes the draft order.",
        "If no team claims a player within the waiver window (about 24 hours during the season), he clears waivers and becomes a true unrestricted free agent, able to sign with any team, including the one that just released him.",
        "Veteran players (past the accrued-seasons threshold) skip the waiver process entirely when released during most of the season and become free agents immediately — waivers mainly apply to less-experienced players and to everyone during a shorter waiver period right after final roster cuts.",
      ],
    },
    {
      heading: "The trade deadline",
      body: [
        "The trade deadline falls in early November, roughly at the season's midpoint. Up until that point, teams can trade players (and picks) freely, subject to normal roster and cap rules.",
        "After the deadline passes, players can no longer be traded for the rest of that season — a team can still release a player it no longer wants (subject to waivers, as above), but it can no longer receive anything in return for him.",
        "The deadline creates the league's busiest short trading window each year: contending teams add proven veterans for a playoff push, while teams that are out of contention often sell impending free agents for future draft capital.",
      ],
    },
  ],
  relatedTopicIds: ["roster-rules", "season-calendar", "draft"],
};
