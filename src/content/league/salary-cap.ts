import type { LeagueTopic } from "./types";

export const salaryCapTopic: LeagueTopic = {
  id: "salary-cap",
  title: "The Salary Cap, Cap Hits & Dead Money",
  summary: "Every team must fit its player payroll under one shared league-wide salary cap, and how a contract is structured changes how much of it counts against that cap in any given year — not just how much a player is paid.",
  sections: [
    {
      heading: "What the cap is",
      body: [
        "The salary cap is a single league-wide dollar limit on how much of a team's payroll can count against it in a given league year; it's recalculated (and typically rises) every year based on the league's overall revenue, under the collective bargaining agreement between the NFL and the players' union. Because it changes annually, this app doesn't hard-code a specific year's cap number here — check a current source for this year's figure.",
        "There's also a salary floor: teams must spend a minimum share of the cap over multi-year windows, so no team can simply pocket the difference by fielding a cheap roster indefinitely.",
        "The cap applies to all 32 teams equally, which is a big part of why the NFL is considered to have unusually strong competitive balance compared to leagues without a hard, shared cap.",
      ],
    },
    {
      heading: "Cap hit vs. actual cash paid",
      body: [
        "A player's 'cap hit' for a given year is not simply his salary that year — contracts are typically structured with a signing bonus (paid up front, in cash, in year one) that gets spread out ('prorated') evenly across the cap in up to 5 years for cap purposes, even though the player received the cash immediately.",
        "This is why a big free-agent deal can pay a player a large amount of actual cash in year one while only charging a modest amount against that year's cap — the signing bonus proration smooths the cap impact out over the life of the deal.",
        "Because of that gap between cash and cap accounting, 'total contract value' headlines (often quoted as if fully guaranteed) can overstate what a team is actually committing in practice — the guaranteed money and the realistic likely payout are usually the more meaningful numbers.",
      ],
    },
    {
      heading: "Dead money",
      body: [
        "When a team releases or trades a player before his signing-bonus proration is finished, all of that remaining prorated bonus accelerates onto the current year's cap immediately as 'dead money' — a cap charge for a player no longer on the roster.",
        "This is why cutting a player with a large signing bonus early in his deal can sometimes cost a team more cap room in the short term than just keeping him, even if he's no longer contributing on the field — teams have to weigh the on-field savings against the dead-money hit.",
        "Trading a player has similar dead-money mechanics to releasing him for the team that trades him away, while the team that trades for him usually only takes on his current-year salary (not his old signing bonus, which stays with the original team).",
      ],
    },
    {
      heading: "The rookie wage scale and the fifth-year option",
      body: [
        "Drafted rookies sign contracts on a fixed wage scale set by the pick they were drafted at, not through open negotiation — this keeps rookie costs predictable and, notably, well below what many of the best rookies would command on the open market.",
        "First-round picks get a 4-year rookie contract; picks in rounds 2–7 get 4-year deals as well, but only first-rounders come with a team option for a 5th year, exercised (or declined) by the team after the player's third season.",
        "The 5th-year option salary is itself set by a formula tied to the player's draft slot and how he's performed relative to his position group (e.g., whether he's made a Pro Bowl), rather than being individually negotiated — top-10 picks get a notably higher formula than later first-rounders.",
      ],
    },
    {
      heading: "Franchise and transition tags",
      body: [
        "A team can use the franchise tag on one of its own impending free agents to keep his rights for one more year, at a one-year salary set by a formula (roughly, the average of the top salaries at his position, or a set percentage raise over his prior salary, whichever is higher) rather than a negotiated long-term deal.",
        "An 'exclusive' franchise tag prevents the player from negotiating with any other team at all; a more common 'non-exclusive' tag lets him negotiate with others, but his original team can match any offer or receive two first-round picks as compensation if it declines to match.",
        "The transition tag is a cheaper, weaker cousin of the franchise tag: a lower guaranteed salary, and the original team gets only the right to match another offer — no draft-pick compensation if it doesn't.",
        "A team may use only one tag (franchise or transition) on one player per year, and using the franchise tag on the same player in consecutive years steps the required salary up further each time.",
      ],
    },
    {
      heading: "Free agency: UFA, RFA, ERFA",
      body: [
        "An Unrestricted Free Agent (UFA) — typically a player with 4+ accrued seasons whose contract has expired — can sign with any team once the new league year opens, with no compensation owed to his old team (aside from any possible compensatory pick effect the following year).",
        "A Restricted Free Agent (RFA) — typically 3 accrued seasons — can negotiate with other teams, but his original team can match any offer to keep him, or decline to match and receive a draft-pick compensation tied to the tender level it placed on him.",
        "An Exclusive Rights Free Agent (ERFA) — typically fewer than 3 accrued seasons — has no real bargaining power at all: if his own team simply offers him a minimum-level tender, he cannot sign anywhere else.",
      ],
    },
  ],
  relatedTopicIds: ["draft", "franchise-structure", "waivers-and-trades"],
};
