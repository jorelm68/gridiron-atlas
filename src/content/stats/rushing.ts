import type { StatDefinition } from "./types";

export const rushingStats: StatDefinition[] = [
  {
    id: "yards-per-carry",
    name: "Yards per Carry",
    abbr: "YPC",
    category: "rushing",
    summary: "The average yards a running back (or any ball carrier) gains on each rush attempt.",
    formulaTex: "\\text{YPC} = \\frac{\\text{Rushing Yards}}{\\text{Carries}}",
    howToRead: [
      "League average is roughly 4.2–4.4 yards per carry in the modern era. 4.7+ over a full season with real volume (150+ carries) is excellent.",
      "A back's YPC is shaped heavily by his offensive line and scheme, not just his own vision and burst — that's why teams and scouts also watch yards created after contact.",
    ],
    pitfalls: [
      "One or two long touchdown runs can inflate a season average a lot, especially for backs with fewer than 100 carries — check the carry count before trusting the number.",
      "Short-yardage and goal-line specialists are often given carries specifically in situations where big gains are unlikely (3rd-and-1, inside the 5), which drags their YPC down through no fault of their own.",
    ],
    compute: (s) => (s.carries > 0
      ? {
          value: s.rushingYards / s.carries,
          steps: [
            `Rushing yards: ${s.rushingYards}`,
            `Carries: ${s.carries}`,
            `${s.rushingYards} ÷ ${s.carries} = ${(s.rushingYards / s.carries).toFixed(2)} yards/carry`,
          ],
        }
      : null),
    format: "decimal1",
    higherIsBetter: true,
    related: ["rushing-epa-per-carry", "rushing-first-down-rate"],
    availability: "1999–today",
    workedExampleSubject: "RB",
    qualifiedMinimum: 100,
  },
  {
    id: "rushing-epa-per-carry",
    name: "Rushing EPA per Carry",
    abbr: "EPA/carry",
    category: "rushing",
    summary: "The average Expected Points Added on every rush attempt — captures how much a carry actually helped the offense, not just how many yards it gained.",
    formulaTex: "\\text{EPA/carry} = \\frac{\\sum \\text{EPA}}{\\text{Carries}}",
    howToRead: [
      "Positive means carries are, on average, moving the offense closer to scoring than the down-and-distance situation implied; most running backs still run slightly negative EPA/carry because runs are lower-value than passes on average.",
      "A back who is only slightly negative (around −0.02 to 0) while carrying a heavy workload is usually graded very well by this measure, since most carries — even good ones — are worth a bit less than a league-average pass.",
    ],
    pitfalls: [
      "Because passing is generally more efficient than rushing on a per-play basis, comparing a runner's EPA/carry directly to a quarterback's EPA/dropback is misleading — compare running backs to other running backs.",
      "Short-yardage carries (3rd/4th-and-1) succeed or fail in a binary way that this model handles reasonably but not perfectly — a back who's used often in those spots can look worse here than his actual value to the team.",
    ],
    compute: (s) => (s.carries > 0
      ? {
          value: s.rushingEpa / s.carries,
          steps: [
            `Total rushing EPA this season: ${s.rushingEpa.toFixed(1)}`,
            `Carries: ${s.carries}`,
            `${s.rushingEpa.toFixed(1)} ÷ ${s.carries} = ${(s.rushingEpa / s.carries).toFixed(2)} EPA/carry`,
          ],
        }
      : null),
    format: "decimal2",
    higherIsBetter: true,
    related: ["expected-points", "yards-per-carry", "success-rate"],
    availability: "1999–today",
    workedExampleSubject: "RB",
    qualifiedMinimum: 100,
  },
  {
    id: "rushing-first-down-rate",
    name: "Rushing First-Down Rate",
    abbr: "1D%",
    category: "rushing",
    summary: "The share of a runner's carries that move the chains for a new first down.",
    formulaTex: "\\text{1D\\%} = \\frac{\\text{Rushing First Downs}}{\\text{Carries}} \\times 100",
    howToRead: [
      "Around 20–22% is typical for a season; backs who are used heavily on 3rd/4th-and-short (where success is likely but the ceiling is capped at 'moved the chains') often post rates in the mid-20s.",
      "This rewards consistency and situational usage over explosiveness — pair it with YPC to see whether a back is a steady mover, a big-play threat, or both.",
    ],
    pitfalls: [
      "This is highly dependent on what down and distance a back is given the ball on — a back used mostly on 1st-and-10 has a much harder path to '1st down on this carry' than one used on 3rd-and-2.",
    ],
    compute: (s) => (s.carries > 0
      ? {
          value: (s.rushingFirstDowns / s.carries) * 100,
          steps: [
            `Rushing first downs: ${s.rushingFirstDowns}`,
            `Carries: ${s.carries}`,
            `${s.rushingFirstDowns} ÷ ${s.carries} × 100 = ${((s.rushingFirstDowns / s.carries) * 100).toFixed(1)}%`,
          ],
        }
      : null),
    format: "pct",
    higherIsBetter: true,
    related: ["yards-per-carry", "success-rate"],
    availability: "1999–today",
    workedExampleSubject: "RB",
    qualifiedMinimum: 100,
  },
  {
    id: "fumbles-lost",
    name: "Fumbles Lost",
    abbr: "FL",
    category: "rushing",
    summary: "The number of times a player fumbled the ball and his own team failed to recover it — a turnover charged directly against him.",
    howToRead: [
      "This app stores fumbles lost (the ones that actually cost a possession), not total fumbles — a player can fumble and recover his own ball with no stat impact here.",
      "Two or fewer fumbles lost across a full season on a normal workload is good ball security for a running back; three or more starts to become a real concern for playing time.",
    ],
    pitfalls: [
      "Fumble recovery itself is close to a coin flip league-wide, so 'fumbles' (before the lost/recovered split) is a more stable measure of ball security than fumbles lost alone — a back can fumble often but get lucky recovering his own ball for a year or two.",
    ],
    compute: (s) => ({
      value: s.fumblesLost,
      steps: [`Fumbles lost this season: ${s.fumblesLost}`],
    }),
    format: "int",
    higherIsBetter: false,
    related: ["yards-per-carry"],
    availability: "1999–today",
    workedExampleSubject: "RB",
    qualifiedMinimum: 100,
  },
];
