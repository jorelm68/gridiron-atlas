import type { StatDefinition } from "./types";

export const receivingStats: StatDefinition[] = [
  {
    id: "catch-rate",
    name: "Catch Rate",
    abbr: "Catch%",
    category: "receiving",
    summary: "The share of a receiver's targets that he actually catches.",
    formulaTex: "\\text{Catch\\%} = \\frac{\\text{Receptions}}{\\text{Targets}} \\times 100",
    howToRead: [
      "Running backs and tight ends who work mostly underneath tend to post the highest catch rates (75–85%+); outside receivers who run deeper routes are typically lower (60–70%) simply because contested, downfield targets are harder to complete.",
      "Compare receivers by role before judging this number — it says as much about the kind of targets a player gets as it does about his hands.",
    ],
    pitfalls: [
      "A receiver targeted only on easy, high-percentage throws will have a great catch rate without necessarily being the offense's best or most trusted weapon — see target share and aDOT for the fuller picture.",
      "Uncatchable throws (thrown well off target) still count as a target; a low catch rate can reflect poor quarterback play, not poor hands.",
    ],
    compute: (s) => (s.targets > 0
      ? {
          value: (s.receptions / s.targets) * 100,
          steps: [
            `Receptions: ${s.receptions}`,
            `Targets: ${s.targets}`,
            `${s.receptions} ÷ ${s.targets} × 100 = ${((s.receptions / s.targets) * 100).toFixed(1)}%`,
          ],
        }
      : null),
    format: "pct",
    higherIsBetter: true,
    related: ["yards-per-target", "target-share"],
    availability: "1999–today",
    workedExampleSubject: "WR",
    qualifiedMinimum: 30,
  },
  {
    id: "yards-per-reception",
    name: "Yards per Reception",
    abbr: "Y/R",
    category: "receiving",
    summary: "The average yardage gained on each completed catch.",
    formulaTex: "\\text{Y/R} = \\frac{\\text{Receiving Yards}}{\\text{Receptions}}",
    howToRead: [
      "League average is roughly 11–12 yards per reception. Deep-threat receivers can clear 15; possession receivers and pass-catching backs are often in the 7–9 range — neither is 'wrong,' they're different roles.",
      "This blends how far downfield a player is targeted (aDOT) with how much he gains after the catch (YAC) — two very different skills that happen to add up to the same number.",
    ],
    pitfalls: [
      "Small sample sizes (fewer than ~25 catches) are easily skewed by one or two long touchdowns.",
    ],
    compute: (s) => (s.receptions > 0
      ? {
          value: s.receivingYards / s.receptions,
          steps: [
            `Receiving yards: ${s.receivingYards}`,
            `Receptions: ${s.receptions}`,
            `${s.receivingYards} ÷ ${s.receptions} = ${(s.receivingYards / s.receptions).toFixed(2)} yards/reception`,
          ],
        }
      : null),
    format: "decimal1",
    higherIsBetter: true,
    related: ["yac-per-reception", "yards-per-target"],
    availability: "1999–today",
    workedExampleSubject: "WR",
    qualifiedMinimum: 30,
  },
  {
    id: "yards-per-target",
    name: "Yards per Target",
    abbr: "Y/Tgt",
    category: "receiving",
    summary: "Receiving yards averaged across every target, whether caught or not — a blend of catch rate and explosiveness.",
    formulaTex: "\\text{Y/Tgt} = \\frac{\\text{Receiving Yards}}{\\text{Targets}}",
    howToRead: [
      "Around 7–8 yards per target is average; 9+ over a full season with real volume (70+ targets) signals an efficient, high-value receiving option.",
      "This is often considered a more complete efficiency stat than yards per reception, since it penalizes drops and low-value targets rather than ignoring them.",
    ],
    pitfalls: [
      "A receiver targeted rarely but only on easy, high-value plays (a check-down specialist) can post a good rate on very little usage — always read this alongside target volume.",
    ],
    compute: (s) => (s.targets > 0
      ? {
          value: s.receivingYards / s.targets,
          steps: [
            `Receiving yards: ${s.receivingYards}`,
            `Targets: ${s.targets}`,
            `${s.receivingYards} ÷ ${s.targets} = ${(s.receivingYards / s.targets).toFixed(2)} yards/target`,
          ],
        }
      : null),
    format: "decimal1",
    higherIsBetter: true,
    related: ["catch-rate", "yards-per-reception", "racr"],
    availability: "1999–today",
    workedExampleSubject: "WR",
    qualifiedMinimum: 30,
  },
  {
    id: "yac-per-reception",
    name: "Yards After Catch per Reception",
    abbr: "YAC/R",
    category: "receiving",
    summary: "The average yardage a receiver gains with his legs after the ball is in his hands, per catch.",
    formulaTex: "\\text{YAC/R} = \\frac{\\text{Yards After Catch}}{\\text{Receptions}}",
    howToRead: [
      "League average is roughly 4.5–5.5 yards after the catch per reception. Slot receivers, running backs, and yards-after-catch specialists at any position can run well into the 6–8 range.",
      "High YAC/R usually reflects a player's open-field skill (vision, elusiveness, speed) more than the quarterback's arm — it's a good way to separate 'the scheme created this' from 'the player created this.'",
    ],
    pitfalls: [
      "Screen-heavy offenses inflate every receiver's YAC/R by design — always sanity-check against the team's overall passing scheme.",
    ],
    compute: (s) => (s.receptions > 0
      ? {
          value: s.receivingYardsAfterCatch / s.receptions,
          steps: [
            `Yards after catch: ${s.receivingYardsAfterCatch}`,
            `Receptions: ${s.receptions}`,
            `${s.receivingYardsAfterCatch} ÷ ${s.receptions} = ${(s.receivingYardsAfterCatch / s.receptions).toFixed(2)} YAC/reception`,
          ],
        }
      : null),
    format: "decimal1",
    higherIsBetter: true,
    related: ["yards-per-reception", "air-yards-per-attempt"],
    availability: "2006–today (requires charted air-yards/YAC splits)",
    workedExampleSubject: "WR",
    qualifiedMinimum: 30,
  },
  {
    id: "target-share",
    name: "Target Share",
    abbr: "Tgt%",
    category: "receiving",
    summary: "The percentage of his team's total pass targets that went to this player — a measure of how central he is to the passing game.",
    formulaTex: "\\text{Tgt\\%} = \\frac{\\text{Player Targets}}{\\text{Team Targets}} \\times 100",
    variables: [{ symbol: "\\text{Team Targets}", meaning: "Every target thrown by the team all season, across all receivers" }],
    howToRead: [
      "A target share above 25% marks a true #1 option; above 30% is a massive, offense-defining workload. Below 15% typically means a complementary or depth role.",
      "Target share is one of the best predictors of receiver value precisely because it doesn't care about efficiency — it just measures how much the offense trusts a player with the ball in the air.",
    ],
    pitfalls: [
      "A receiver on a run-heavy team can have a low target share while still being that offense's clear top target — always consider it relative to the team's overall pass volume, not in isolation.",
      "A player who changes teams mid-season splits his targets across two different team denominators — this app attributes target share to the player's most common team that season.",
    ],
    compute: (s) => (s.teamTargets && s.teamTargets > 0
      ? {
          value: (s.targets / s.teamTargets) * 100,
          steps: [
            `Player targets: ${s.targets}`,
            `Team targets this season: ${s.teamTargets}`,
            `${s.targets} ÷ ${s.teamTargets} × 100 = ${((s.targets / s.teamTargets) * 100).toFixed(1)}%`,
          ],
        }
      : null),
    format: "pct",
    higherIsBetter: true,
    related: ["air-yards-share", "wopr"],
    availability: "1999–today",
    workedExampleSubject: "WR",
    qualifiedMinimum: 30,
  },
  {
    id: "air-yards-share",
    name: "Air Yards Share",
    abbr: "AY%",
    category: "receiving",
    summary: "The percentage of his team's total passing air yards that were thrown to this player — measures how much of the offense's downfield attention he commands.",
    formulaTex: "\\text{AY\\%} = \\frac{\\text{Player Air Yards}}{\\text{Team Air Yards}} \\times 100",
    howToRead: [
      "A receiver who dominates air yards share (35%+) is the clear focal point of the passing offense's downfield plan, even if his raw catch total is modest.",
      "Compare a player's air-yards share with his target share: a much higher air-yards share than target share signals a true deep-threat role, while the reverse signals a short-area, high-volume role.",
    ],
    pitfalls: [
      "Air yards are charted on every target regardless of whether it's caught, so this rewards being thrown to deep, not catching the ball deep — pair it with RACR to see if those deep shots are actually connecting.",
    ],
    compute: (s) => (s.teamPassingAirYards && s.teamPassingAirYards > 0
      ? {
          value: (s.receivingAirYards / s.teamPassingAirYards) * 100,
          steps: [
            `Player air yards: ${s.receivingAirYards}`,
            `Team air yards this season: ${s.teamPassingAirYards}`,
            `${s.receivingAirYards} ÷ ${s.teamPassingAirYards} × 100 = ${((s.receivingAirYards / s.teamPassingAirYards) * 100).toFixed(1)}%`,
          ],
        }
      : null),
    format: "pct",
    higherIsBetter: true,
    related: ["target-share", "wopr", "racr"],
    availability: "2006–today (requires charted air yards)",
    workedExampleSubject: "WR",
    qualifiedMinimum: 30,
  },
  {
    id: "wopr",
    name: "Weighted Opportunity Rating",
    abbr: "WOPR",
    category: "receiving",
    summary: "A single 'opportunity' score combining target share and air-yards share, built to predict fantasy and real-world receiving production better than either alone.",
    formulaTex: "\\text{WOPR} = 1.5 \\times \\text{Tgt\\%} + 0.7 \\times \\text{AY\\%}",
    variables: [
      { symbol: "\\text{Tgt\\%}", meaning: "Target share, as a decimal (e.g. 0.25 for 25%)" },
      { symbol: "\\text{AY\\%}", meaning: "Air-yards share, as a decimal" },
    ],
    howToRead: [
      "Developed by analyst Josh Hermsmeyer, WOPR was fit so that the two inputs' weights (1.5 and 0.7) best matched actual receiving fantasy output across thousands of player-seasons.",
      "A WOPR above 0.85 marks an offense's clear #1 receiving option; above 1.0 is an elite, do-everything workload.",
    ],
    pitfalls: [
      "It's a volume/opportunity metric, not an efficiency one — a receiver can have a great WOPR while being inefficient with the chances he gets.",
      "The 1.5/0.7 weighting was fit on historical data; if league passing patterns shift, the 'ideal' weights could drift with them.",
    ],
    compute: (s) => {
      if (!s.teamTargets || s.teamTargets <= 0 || !s.teamPassingAirYards || s.teamPassingAirYards <= 0) return null;
      const tgtShare = s.targets / s.teamTargets;
      const ayShare = s.receivingAirYards / s.teamPassingAirYards;
      const wopr = 1.5 * tgtShare + 0.7 * ayShare;
      return {
        value: wopr,
        steps: [
          `Target share: ${s.targets} ÷ ${s.teamTargets} = ${(tgtShare * 100).toFixed(1)}%`,
          `Air-yards share: ${s.receivingAirYards} ÷ ${s.teamPassingAirYards} = ${(ayShare * 100).toFixed(1)}%`,
          `WOPR = 1.5 × ${tgtShare.toFixed(3)} + 0.7 × ${ayShare.toFixed(3)} = ${wopr.toFixed(2)}`,
        ],
      };
    },
    format: "decimal2",
    higherIsBetter: true,
    related: ["target-share", "air-yards-share"],
    availability: "2006–today (requires charted air yards)",
    workedExampleSubject: "WR",
    qualifiedMinimum: 30,
  },
  {
    id: "racr",
    name: "Receiver Air Conversion Ratio",
    abbr: "RACR",
    category: "receiving",
    summary: "How efficiently a receiver turns the air yards thrown his way into actual receiving yards.",
    formulaTex: "\\text{RACR} = \\frac{\\text{Receiving Yards}}{\\text{Air Yards}}",
    howToRead: [
      "A RACR near or above 1.0 means a receiver gains at least as many yards as the ball traveled in the air — usually a sign of strong yards-after-catch ability or a short-area role.",
      "A RACR well below 1.0 (0.5–0.7) is typical for true deep threats, since many deep targets fall incomplete or are caught right at the air-yards mark with little YAC left to add.",
    ],
    pitfalls: [
      "A low RACR isn't necessarily bad play — it's often just the signature of a boom-or-bust deep-threat role rather than an efficiency problem.",
    ],
    compute: (s) => (s.receivingAirYards > 0
      ? {
          value: s.receivingYards / s.receivingAirYards,
          steps: [
            `Receiving yards: ${s.receivingYards}`,
            `Air yards: ${s.receivingAirYards}`,
            `${s.receivingYards} ÷ ${s.receivingAirYards} = ${(s.receivingYards / s.receivingAirYards).toFixed(2)} RACR`,
          ],
        }
      : null),
    format: "decimal2",
    higherIsBetter: true,
    related: ["air-yards-share", "yards-per-target"],
    availability: "2006–today (requires charted air yards)",
    workedExampleSubject: "WR",
    qualifiedMinimum: 30,
  },
  {
    id: "receiving-epa-per-target",
    name: "Receiving EPA per Target",
    abbr: "EPA/tgt",
    category: "receiving",
    summary: "The average Expected Points Added on every target thrown to a receiver — a points-based efficiency stat that accounts for down, distance, and field position.",
    formulaTex: "\\text{EPA/tgt} = \\frac{\\sum \\text{EPA}}{\\text{Targets}}",
    howToRead: [
      "Positive values mean targeting this player is, on average, good for the offense relative to the situation; the best receivers in a season are typically above +0.4 to +0.5 EPA per target.",
      "Because incompletions usually cost the offense a down (negative EPA), this rewards receivers who both get open and finish plays, not just ones who accumulate raw targets.",
    ],
    pitfalls: [
      "A receiver targeted only in 'gimme' situations (easy completions in neutral game states) will look better here than one who's frequently the contested, high-difficulty target in crucial moments.",
    ],
    compute: (s) => (s.targets > 0
      ? {
          value: s.receivingEpa / s.targets,
          steps: [
            `Total receiving EPA this season: ${s.receivingEpa.toFixed(1)}`,
            `Targets: ${s.targets}`,
            `${s.receivingEpa.toFixed(1)} ÷ ${s.targets} = ${(s.receivingEpa / s.targets).toFixed(2)} EPA/target`,
          ],
        }
      : null),
    format: "decimal2",
    higherIsBetter: true,
    related: ["expected-points", "yards-per-target"],
    availability: "1999–today",
    workedExampleSubject: "WR",
    qualifiedMinimum: 30,
  },
];
