import type { StatDefinition } from "./types";

export const teamStats: StatDefinition[] = [
  {
    id: "point-differential",
    name: "Point Differential",
    abbr: "Diff",
    category: "team",
    summary: "The gap between a team's total points scored and total points allowed across the season.",
    formulaTex: "\\text{Diff} = \\text{Points For} - \\text{Points Against}",
    howToRead: [
      "Point differential predicts future win totals better than a team's actual record does, because it isn't affected by how many close games a team happened to win or lose.",
      "A differential around +100 or better over a 17-game season usually belongs to a true championship contender; anything above +150 is a dominant team.",
    ],
    pitfalls: [
      "A team that wins a lot of close games while losing a few blowouts can have a mediocre point differential despite a strong record — that combination is often a sign of good luck that tends to even out the next season (regression to the mean).",
    ],
    computeTeam: (t) => ({
      value: t.pointsFor - t.pointsAgainst,
      steps: [
        `Points for: ${t.pointsFor}`,
        `Points against: ${t.pointsAgainst}`,
        `${t.pointsFor} − ${t.pointsAgainst} = ${t.pointsFor - t.pointsAgainst}`,
      ],
    }),
    format: "int",
    higherIsBetter: true,
    related: ["pythagorean-wins", "turnover-differential"],
    availability: "1999–today",
    workedExampleSubject: "TEAM",
  },
  {
    id: "pythagorean-wins",
    name: "Pythagorean Win Expectation",
    abbr: "Pyth Wins",
    category: "team",
    summary: "An estimate of how many games a team 'should' have won based purely on points scored and allowed — a way to spot teams that got lucky or unlucky.",
    formulaTex:
      "\\text{Win\\%}_{exp} = \\frac{\\text{PF}^{2.37}}{\\text{PF}^{2.37} + \\text{PA}^{2.37}}",
    variables: [
      { symbol: "\\text{PF}", meaning: "Points For (total points scored)" },
      { symbol: "\\text{PA}", meaning: "Points Against (total points allowed)" },
      { symbol: "2.37", meaning: "The exponent found to best fit actual NFL outcomes (adapted from Bill James's baseball formula, which uses an exponent near 2)" },
    ],
    howToRead: [
      "Multiply the expected win percentage by the number of games played to get expected wins. A team that wins several more games than its Pythagorean expectation predicts often benefited from close-game luck (or a great clutch record) that year.",
      "The 2.37 exponent isn't arbitrary — analysts fit it specifically to NFL score margins; football's exponent is higher than baseball's original ~2 because football scores are more spread out per game.",
    ],
    pitfalls: [
      "This is a descriptive, retrospective tool, not a perfect predictor — some teams really are built to win close games consistently (elite late-game coaching, a shutdown defense built for the 4th quarter), not just lucky.",
      "One-score-game performance can be a repeatable skill for a team with a truly excellent quarterback or defense, so don't assume every gap between actual and Pythagorean wins will fully reverse the next season.",
    ],
    computeTeam: (t) => {
      const games = t.wins + t.losses + t.ties;
      if (games <= 0 || t.pointsFor <= 0) return null;
      const pf = Math.pow(t.pointsFor, 2.37);
      const pa = Math.pow(t.pointsAgainst, 2.37);
      const winPct = pf / (pf + pa);
      const expWins = winPct * games;
      return {
        value: expWins,
        steps: [
          `Points for^2.37 = ${t.pointsFor}^2.37 = ${pf.toFixed(0)}`,
          `Points against^2.37 = ${t.pointsAgainst}^2.37 = ${pa.toFixed(0)}`,
          `Expected win% = ${pf.toFixed(0)} ÷ (${pf.toFixed(0)} + ${pa.toFixed(0)}) = ${(winPct * 100).toFixed(1)}%`,
          `Expected wins = ${(winPct * 100).toFixed(1)}% × ${games} games = ${expWins.toFixed(1)} (actual: ${t.wins}-${t.losses}${t.ties ? `-${t.ties}` : ""})`,
        ],
      };
    },
    format: "decimal1",
    higherIsBetter: true,
    related: ["point-differential"],
    availability: "1999–today",
    workedExampleSubject: "TEAM",
  },
  {
    id: "turnover-differential",
    name: "Turnover Differential",
    abbr: "TO Diff",
    category: "team",
    summary: "The gap between how many turnovers a team's defense forces and how many its offense gives away.",
    formulaTex: "\\text{TO Diff} = \\text{Takeaways} - \\text{Giveaways}",
    variables: [
      { symbol: "\\text{Takeaways}", meaning: "Defensive interceptions + fumbles forced by the defense" },
      { symbol: "\\text{Giveaways}", meaning: "Interceptions thrown + fumbles lost by the offense" },
    ],
    howToRead: [
      "Turnover differential correlates extremely strongly with winning — a season around +10 or better is typically a playoff-caliber signal.",
      "Because a single turnover can swing 3–7 points of field position and scoring, this is one of the simplest and most predictive team stats available.",
    ],
    pitfalls: [
      "Forced fumbles aren't always recovered by the defense that forced them, so this app's takeaway count (forced fumbles, not just recovered ones) is a reasonable approximation rather than an exact accounting of possession changes — treat it as directionally correct.",
      "Turnover differential is famously one of the least 'sticky' team stats year to year — a team with a great differential one season regresses toward zero more often than most fans expect, since recovering fumbles is close to a coin flip league-wide.",
    ],
    computeTeam: (t) => {
      const takeaways = t.defInterceptions + t.defFumblesForced;
      const giveaways = t.passingInterceptions + t.fumblesLost;
      return {
        value: takeaways - giveaways,
        steps: [
          `Takeaways: defensive INTs (${t.defInterceptions}) + forced fumbles (${t.defFumblesForced}) = ${takeaways}`,
          `Giveaways: INTs thrown (${t.passingInterceptions}) + fumbles lost (${t.fumblesLost}) = ${giveaways}`,
          `${takeaways} − ${giveaways} = ${takeaways - giveaways}`,
        ],
      };
    },
    format: "int",
    higherIsBetter: true,
    related: ["point-differential", "forced-fumbles"],
    availability: "1999–today",
    workedExampleSubject: "TEAM",
  },
  {
    id: "yards-per-play",
    name: "Yards per Play",
    abbr: "Y/P",
    category: "team",
    summary: "A team's total offensive yardage averaged across every snap — pass attempts, sacks, and rush attempts combined.",
    formulaTex: "\\text{Y/P} = \\frac{\\text{Pass Yds} + \\text{Rush Yds}}{\\text{Attempts} + \\text{Sacks} + \\text{Carries}}",
    howToRead: [
      "League average is roughly 5.3–5.5 yards per play. 5.8+ over a full season marks an explosive, top-tier offense; below 5.0 signals real offensive struggles.",
      "This is widely considered one of the best single-number summaries of offensive quality, since it isn't affected by how many possessions a team had (unlike total yards) or how a game's individual drives played out (unlike points, which depend partly on field goals and red-zone luck).",
    ],
    pitfalls: [
      "It blends two very different games (passing and rushing), so two teams can have identical Y/P for completely different reasons — always break it down into pass and rush efficiency separately before drawing conclusions.",
    ],
    computeTeam: (t) => {
      const plays = t.attempts + t.sacksSuffered + t.carries;
      if (plays <= 0) return null;
      const yards = t.passingYards + t.rushingYards;
      return {
        value: yards / plays,
        steps: [
          `Total yards: passing (${t.passingYards}) + rushing (${t.rushingYards}) = ${yards}`,
          `Total plays: attempts (${t.attempts}) + sacks (${t.sacksSuffered}) + carries (${t.carries}) = ${plays}`,
          `${yards} ÷ ${plays} = ${(yards / plays).toFixed(2)} yards/play`,
        ],
      };
    },
    format: "decimal1",
    higherIsBetter: true,
    related: ["yards-per-attempt", "yards-per-carry"],
    availability: "1999–today",
    workedExampleSubject: "TEAM",
  },
  {
    id: "division-record",
    name: "Division Record",
    category: "team",
    summary: "A team's win-loss-tie record specifically in games against its three division rivals.",
    formulaTex: "\\text{Div. Win\\%} = \\frac{\\text{Div. Wins}}{\\text{Div. Wins} + \\text{Div. Losses} + \\text{Div. Ties}}",
    howToRead: [
      "Every team plays each of its three division rivals twice a season (6 of 17 games), so division record is the first tiebreaker used to decide who wins the division and earns an automatic playoff spot.",
      "A strong division record (5-1 or better) is one of the clearest paths to the playoffs, independent of how a team performs against the rest of the league.",
    ],
    pitfalls: [
      "Division strength varies wildly year to year — a 4-2 division record in a historically weak division means something different than the same record in a division full of playoff teams.",
    ],
    computeTeam: (t) => {
      const games = t.divWins + t.divLosses + t.divTies;
      if (games <= 0) return null;
      return {
        value: (t.divWins / games) * 100,
        steps: [
          `Division wins-losses-ties: ${t.divWins}-${t.divLosses}${t.divTies ? `-${t.divTies}` : ""}`,
          `Division win% = ${t.divWins} ÷ ${games} = ${((t.divWins / games) * 100).toFixed(1)}%`,
        ],
      };
    },
    format: "pct",
    higherIsBetter: true,
    related: ["point-differential"],
    availability: "1999–today",
    workedExampleSubject: "TEAM",
  },
  {
    id: "strength-of-schedule",
    name: "Strength of Schedule",
    abbr: "SOS",
    category: "team",
    summary: "A measure of how difficult a team's set of opponents was, usually based on those opponents' combined win percentage.",
    formulaTex: "\\text{SOS} = \\text{Average win\\% of opponents played}",
    howToRead: [
      "SOS is one of the tiebreakers used to set playoff seeding and draft order (worse SOS in the prior year contributes to a slightly easier upcoming schedule under the NFL's scheduling formula), so it has real structural consequences beyond just bragging rights.",
      "A team's SOS is heavily determined by its own division's strength (since 6 of 17 games are fixed division matchups) and by which other divisions it's rotated against that year, more than by anything the team itself controls.",
    ],
    pitfalls: [
      "SOS is usually calculated using opponents' full-season records, which include games against the team itself — a circular wrinkle analysts handle in different ways, so exact SOS figures can vary slightly between sources.",
    ],
    availability: "Not computed by this app — see nfl.com or Pro-Football-Reference for official strength-of-schedule figures.",
    related: ["division-record"],
    workedExampleSubject: "TEAM",
  },
];
