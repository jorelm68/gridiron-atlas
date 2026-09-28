import type { StatDefinition } from "./types";

export const passingStats: StatDefinition[] = [
  {
    id: "completion-pct",
    name: "Completion Percentage",
    abbr: "Comp%",
    category: "passing",
    summary: "The share of a quarterback's pass attempts that were caught in bounds by his own team.",
    formulaTex: "\\text{Comp\\%} = \\frac{\\text{Completions}}{\\text{Attempts}} \\times 100",
    variables: [
      { symbol: "\\text{Completions}", meaning: "Passes caught in bounds by an eligible receiver" },
      { symbol: "\\text{Attempts}", meaning: "All pass attempts, including incompletions, sacks excluded" },
    ],
    howToRead: [
      "In the modern short-passing league, 65% is roughly average and 70%+ is elite for a full season (2020s era). Before around 2010, 60% was already solid — offenses throw shorter, safer passes today than they used to.",
      "A high completion percentage doesn't always mean a great passing offense — screens and checkdowns are easy to complete but don't move the ball far. Pair it with yards per attempt to see whether the completions are doing real work.",
    ],
    pitfalls: [
      "Spikes to stop the clock and obvious throwaways count as incompletions and drag the rate down even though the quarterback made the right decision.",
      "Dropped passes count against the passer even though he did his job; charted \"drop rate\" (not stored here) explains some low completion rates.",
    ],
    compute: (s) => (s.attempts > 0
      ? {
          value: (s.completions / s.attempts) * 100,
          steps: [
            `Completions: ${s.completions}`,
            `Attempts: ${s.attempts}`,
            `${s.completions} ÷ ${s.attempts} × 100 = ${((s.completions / s.attempts) * 100).toFixed(1)}%`,
          ],
        }
      : null),
    format: "pct",
    higherIsBetter: true,
    related: ["yards-per-attempt", "passer-rating", "cpoe"],
    availability: "1999–today",
    workedExampleSubject: "QB",
    qualifiedMinimum: 200,
  },
  {
    id: "yards-per-attempt",
    name: "Yards per Attempt",
    abbr: "Y/A",
    category: "passing",
    summary: "How many yards a quarterback averages every time he drops back and throws, whether it's caught or not.",
    formulaTex: "\\text{Y/A} = \\frac{\\text{Passing Yards}}{\\text{Attempts}}",
    variables: [
      { symbol: "\\text{Passing Yards}", meaning: "Total yards gained through the air on completed passes" },
      { symbol: "\\text{Attempts}", meaning: "All pass attempts, sacks excluded" },
    ],
    howToRead: [
      "League average sits around 7.0–7.2 Y/A in the modern era; 8.0+ over a full season is excellent and usually means an aggressive, downfield-friendly offense.",
      "Unlike completion percentage, Y/A rewards big plays — one 60-yard touchdown can outweigh several short completions, so it captures explosiveness that Comp% misses.",
    ],
    pitfalls: [
      "Sacks aren't included in the denominator here, so a quarterback who takes a lot of sacks looks better on Y/A than his actual per-dropback value — that's what ANY/A fixes.",
      "A small sample (a couple of games) is easily skewed by one long touchdown; look at attempts before trusting the number.",
    ],
    compute: (s) => (s.attempts > 0
      ? {
          value: s.passingYards / s.attempts,
          steps: [
            `Passing yards: ${s.passingYards}`,
            `Attempts: ${s.attempts}`,
            `${s.passingYards} ÷ ${s.attempts} = ${(s.passingYards / s.attempts).toFixed(2)} yards/attempt`,
          ],
        }
      : null),
    format: "decimal1",
    higherIsBetter: true,
    related: ["any-a", "air-yards-per-attempt", "completion-pct"],
    availability: "1999–today",
    workedExampleSubject: "QB",
    qualifiedMinimum: 200,
  },
  {
    id: "any-a",
    name: "Adjusted Net Yards per Attempt",
    abbr: "ANY/A",
    category: "passing",
    summary: "Yards per attempt adjusted for touchdowns, interceptions, and sacks — a fuller picture of a quarterback's per-dropback value.",
    formulaTex:
      "\\text{ANY/A} = \\frac{\\text{Pass Yds} + 20 \\times \\text{TD} - 45 \\times \\text{INT} - \\text{Sack Yds}}{\\text{Attempts} + \\text{Sacks}}",
    variables: [
      { symbol: "\\text{Pass Yds}", meaning: "Total passing yards" },
      { symbol: "\\text{TD}", meaning: "Passing touchdowns, worth a 20-yard bonus each" },
      { symbol: "\\text{INT}", meaning: "Interceptions thrown, a 45-yard penalty each" },
      { symbol: "\\text{Sack Yds}", meaning: "Yards lost on sacks" },
      { symbol: "\\text{Sacks}", meaning: "Times sacked, added to the denominator with attempts" },
    ],
    howToRead: [
      "Because it folds sacks and turnovers into one rate, ANY/A correlates strongly with winning — around 6.0 is average and 7.5+ is an MVP-level season (2020s era).",
      "It's the single passing-volume stat analysts trust most for a quick 'was this a good season' read, since it can't be padded by empty short completions the way Comp% can.",
    ],
    pitfalls: [
      "The 20-yard TD and 45-yard INT bonuses are somewhat arbitrary weights chosen decades ago (by Pro-Football-Reference founder Doug Drinen, refining a Bill James idea) — treat it as a useful blend, not a physically exact value.",
      "A single pick-six or one long touchdown still swings this a lot in a small sample.",
    ],
    compute: (s) => {
      const denom = s.attempts + s.sacksSuffered;
      if (denom <= 0) return null;
      const numerator = s.passingYards + 20 * s.passingTds - 45 * s.passingInterceptions - s.sackYardsLost;
      return {
        value: numerator / denom,
        steps: [
          `Passing yards + 20 × TD − 45 × INT − sack yards = ${s.passingYards} + 20×${s.passingTds} − 45×${s.passingInterceptions} − ${s.sackYardsLost} = ${numerator}`,
          `Attempts + sacks = ${s.attempts} + ${s.sacksSuffered} = ${denom}`,
          `${numerator} ÷ ${denom} = ${(numerator / denom).toFixed(2)} ANY/A`,
        ],
      };
    },
    format: "decimal1",
    higherIsBetter: true,
    related: ["yards-per-attempt", "epa-per-dropback", "sack-rate"],
    availability: "1999–today",
    workedExampleSubject: "QB",
    qualifiedMinimum: 200,
  },
  {
    id: "passer-rating",
    name: "NFL Passer Rating",
    abbr: "Rating",
    category: "passing",
    summary: "The NFL's official passing formula, blending completion rate, yards per attempt, touchdown rate, and interception rate into one 0–158.3 number.",
    formulaTex:
      "\\text{Rating} = \\frac{a + b + c + d}{6} \\times 100, \\quad a,b,c,d \\in [0, 2.375]",
    variables: [
      { symbol: "a", meaning: "((Comp/Att) − 0.3) × 5" },
      { symbol: "b", meaning: "((Yds/Att) − 3) × 0.25" },
      { symbol: "c", meaning: "(TD/Att) × 20" },
      { symbol: "d", meaning: "2.375 − ((INT/Att) × 25)" },
    ],
    howToRead: [
      "Each of the four components (a, b, c, d) is clamped between 0 and 2.375 before averaging, which is why the maximum possible rating is exactly 158.3 — a 'perfect' game.",
      "League average is roughly 90–95 in the modern era; 100+ over a full season is very good, 110+ is an elite, often MVP-caliber year.",
      "It was designed in 1971 to summarize a box score, not to measure 'true' quality — that's why analysts now lean on ANY/A or EPA per dropback instead.",
    ],
    pitfalls: [
      "It ignores sacks and rushing entirely, so a mobile quarterback's rushing value (or a bad offensive line's sacks) never shows up here.",
      "The clamping means an incredible touchdown rate can't push a component above 2.375 — a passer throwing a touchdown on every attempt does not get an infinite rating.",
      "Because the four components are weighted equally, a rating can look mediocre even in a strong game if one component (often interceptions) has a bad day, or vice versa.",
    ],
    compute: (s) => {
      if (s.attempts <= 0) return null;
      const clamp = (n: number) => Math.min(2.375, Math.max(0, n));
      const aRaw = (s.completions / s.attempts - 0.3) * 5;
      const bRaw = (s.passingYards / s.attempts - 3) * 0.25;
      const cRaw = (s.passingTds / s.attempts) * 20;
      const dRaw = 2.375 - (s.passingInterceptions / s.attempts) * 25;
      const a = clamp(aRaw);
      const b = clamp(bRaw);
      const c = clamp(cRaw);
      const d = clamp(dRaw);
      const rating = ((a + b + c + d) / 6) * 100;
      return {
        value: rating,
        steps: [
          `a = ((${s.completions}/${s.attempts}) − 0.3) × 5 = ${aRaw.toFixed(3)} → clamped to ${a.toFixed(3)}`,
          `b = ((${s.passingYards}/${s.attempts}) − 3) × 0.25 = ${bRaw.toFixed(3)} → clamped to ${b.toFixed(3)}`,
          `c = (${s.passingTds}/${s.attempts}) × 20 = ${cRaw.toFixed(3)} → clamped to ${c.toFixed(3)}`,
          `d = 2.375 − ((${s.passingInterceptions}/${s.attempts}) × 25) = ${dRaw.toFixed(3)} → clamped to ${d.toFixed(3)}`,
          `Rating = ((${a.toFixed(3)} + ${b.toFixed(3)} + ${c.toFixed(3)} + ${d.toFixed(3)}) ÷ 6) × 100 = ${rating.toFixed(1)}`,
        ],
      };
    },
    format: "decimal1",
    higherIsBetter: true,
    related: ["any-a", "completion-pct", "td-rate", "int-rate"],
    availability: "1999–today",
    workedExampleSubject: "QB",
    qualifiedMinimum: 200,
  },
  {
    id: "td-rate",
    name: "Touchdown Rate",
    abbr: "TD%",
    category: "passing",
    summary: "The percentage of a quarterback's pass attempts that result in a touchdown.",
    formulaTex: "\\text{TD\\%} = \\frac{\\text{Passing TDs}}{\\text{Attempts}} \\times 100",
    howToRead: [
      "Around 4.5–5% is a strong full-season rate in the modern era; 6%+ is exceptional and usually pairs with an efficient red-zone offense.",
      "Read it next to interception rate — a quarterback who throws touchdowns and picks at similar rates is far less valuable than one whose TD rate clears his INT rate by several points.",
    ],
    pitfalls: [
      "Red-zone opportunities depend on the whole offense (a great running game can 'steal' goal-line touchdowns), so this partly reflects team context, not just arm talent.",
    ],
    compute: (s) => (s.attempts > 0
      ? {
          value: (s.passingTds / s.attempts) * 100,
          steps: [
            `Passing TDs: ${s.passingTds}`,
            `Attempts: ${s.attempts}`,
            `${s.passingTds} ÷ ${s.attempts} × 100 = ${((s.passingTds / s.attempts) * 100).toFixed(1)}%`,
          ],
        }
      : null),
    format: "pct",
    higherIsBetter: true,
    related: ["int-rate", "passer-rating"],
    availability: "1999–today",
    workedExampleSubject: "QB",
    qualifiedMinimum: 200,
  },
  {
    id: "int-rate",
    name: "Interception Rate",
    abbr: "INT%",
    category: "passing",
    summary: "The percentage of a quarterback's pass attempts that are intercepted.",
    formulaTex: "\\text{INT\\%} = \\frac{\\text{Interceptions}}{\\text{Attempts}} \\times 100",
    howToRead: [
      "Below 2% is good, below 1.5% over a full season is excellent ball security in the modern era. Above 3% is a real problem.",
      "Interception rate is noisier than most passing stats — a handful of tipped passes or desperate late-game throws can move it a lot within one season.",
    ],
    pitfalls: [
      "Not every interception is the quarterback's fault (tipped balls, receiver running the wrong route) — the raw rate doesn't separate blame the way a coach's film review would.",
      "Trailing teams throw more late, low-percentage passes, which inflates INT rate for quarterbacks on bad teams independent of their own play.",
    ],
    compute: (s) => (s.attempts > 0
      ? {
          value: (s.passingInterceptions / s.attempts) * 100,
          steps: [
            `Interceptions: ${s.passingInterceptions}`,
            `Attempts: ${s.attempts}`,
            `${s.passingInterceptions} ÷ ${s.attempts} × 100 = ${((s.passingInterceptions / s.attempts) * 100).toFixed(1)}%`,
          ],
        }
      : null),
    format: "pct",
    higherIsBetter: false,
    related: ["td-rate", "passer-rating"],
    availability: "1999–today",
    workedExampleSubject: "QB",
    qualifiedMinimum: 200,
  },
  {
    id: "sack-rate",
    name: "Sack Rate",
    abbr: "Sack%",
    category: "passing",
    summary: "The percentage of a quarterback's dropbacks (attempts plus sacks) that end in a sack.",
    formulaTex: "\\text{Sack\\%} = \\frac{\\text{Sacks}}{\\text{Attempts} + \\text{Sacks}} \\times 100",
    howToRead: [
      "Around 6% is league average; under 4% for a full season is very good pocket management (or a great offensive line, or both).",
      "This is shared responsibility — offensive line play, play-calling (how quickly the ball is designed to come out), and the quarterback's own pocket awareness all move this number.",
    ],
    pitfalls: [
      "A quarterback who holds the ball longer to push the ball downfield (higher air yards) will naturally take more sacks — high sack rate isn't automatically a red flag if it comes with more explosive plays.",
    ],
    compute: (s) => {
      const denom = s.attempts + s.sacksSuffered;
      return denom > 0
        ? {
            value: (s.sacksSuffered / denom) * 100,
            steps: [
              `Sacks: ${s.sacksSuffered}`,
              `Attempts + sacks: ${s.attempts} + ${s.sacksSuffered} = ${denom}`,
              `${s.sacksSuffered} ÷ ${denom} × 100 = ${((s.sacksSuffered / denom) * 100).toFixed(1)}%`,
            ],
          }
        : null;
    },
    format: "pct",
    higherIsBetter: false,
    related: ["any-a", "epa-per-dropback"],
    availability: "1999–today",
    workedExampleSubject: "QB",
    qualifiedMinimum: 200,
  },
  {
    id: "air-yards-per-attempt",
    name: "Air Yards per Attempt",
    abbr: "aDOT",
    category: "passing",
    summary: "The average distance the ball travels in the air (from the line of scrimmage to where it's caught or falls incomplete) per pass attempt — also called average depth of target.",
    formulaTex: "\\text{aDOT} = \\frac{\\text{Air Yards}}{\\text{Attempts}}",
    variables: [{ symbol: "\\text{Air Yards}", meaning: "Distance the ball traveled in the air on each attempt, summed for the season" }],
    howToRead: [
      "League average is roughly 7–8 air yards per attempt. A high aDOT (9+) signals a downfield, boom-or-bust passing style; a low one (under 7) signals a quick, short-passing scheme.",
      "This describes play style, not skill — neither a high nor low aDOT is inherently 'better.' Compare it with completion percentage and yards after catch to understand the offense's shape.",
    ],
    pitfalls: [
      "aDOT is about the QB's targets, not about YAC — a low aDOT offense can still rack up huge yardage after the catch (see the next stat).",
    ],
    compute: (s) => (s.attempts > 0
      ? {
          value: s.passingAirYards / s.attempts,
          steps: [
            `Air yards: ${s.passingAirYards}`,
            `Attempts: ${s.attempts}`,
            `${s.passingAirYards} ÷ ${s.attempts} = ${(s.passingAirYards / s.attempts).toFixed(2)} air yards/attempt`,
          ],
        }
      : null),
    format: "decimal1",
    related: ["yards-per-attempt", "air-yards-share", "racr"],
    availability: "2006–today (air yards tracking began with charting data)",
    workedExampleSubject: "QB",
    qualifiedMinimum: 200,
  },
  {
    id: "cpoe",
    name: "Completion Percentage Over Expected",
    abbr: "CPOE",
    category: "passing",
    summary: "How much better (or worse) a quarterback's completion rate is than expected, given the difficulty of each throw (depth, receiver separation, pressure).",
    formulaTex: "\\text{CPOE} = \\text{Actual Comp\\%} - \\text{Expected Comp\\%}",
    variables: [{ symbol: "\\text{Expected Comp\\%}", meaning: "A model's predicted completion probability for each throw, based on depth of target, separation, and pressure, averaged over the season" }],
    howToRead: [
      "CPOE is era- and scheme-adjusted accuracy: a quarterback who only throws 5-yard checkdowns is 'expected' to complete more passes, so simple Comp% flatters him. CPOE strips that out.",
      "Above +3% for a season is very good; above +5% is elite (Next Gen Stats era, 2017+). Zero means exactly as accurate as expected for the throws attempted.",
      "It's one of the stickiest (most season-to-season predictive) accuracy stats available, which is why teams and analysts weight it heavily when judging quarterback play.",
    ],
    pitfalls: [
      "It depends on a model most fans can't see the internals of — treat the exact number as an estimate, not a ground truth, even though the ranking of quarterbacks it produces is usually reliable.",
      "Dropped passes by receivers count against the expected model's assumptions in ways that can make a QB's CPOE look worse than his actual decision-making.",
    ],
    compute: (s) => (s.passingCpoe !== null
      ? {
          value: s.passingCpoe,
          steps: [
            `Each game's CPOE is weighted by that game's attempts, then averaged across the season.`,
            `Season CPOE: ${s.passingCpoe.toFixed(1)} percentage points`,
          ],
        }
      : null),
    format: "decimal1",
    higherIsBetter: true,
    related: ["completion-pct", "epa-per-dropback"],
    availability: "2017–today (requires Next Gen Stats tracking data)",
    workedExampleSubject: "QB",
    qualifiedMinimum: 200,
  },
  {
    id: "epa-per-dropback",
    name: "EPA per Dropback",
    abbr: "EPA/db",
    category: "passing",
    summary: "The average Expected Points Added on every quarterback dropback (pass attempts plus sacks) — the most complete single-number measure of quarterback play available from public data.",
    formulaTex: "\\text{EPA/db} = \\frac{\\sum \\text{EPA}}{\\text{Attempts} + \\text{Sacks}}",
    variables: [{ symbol: "\\sum \\text{EPA}", meaning: "Total Expected Points Added across every dropback that season (see the Expected Points glossary entry)" }],
    howToRead: [
      "Positive means the offense is better off, on average, than before the play; negative means worse off. Anything above +0.10 EPA/dropback is a good starting quarterback; above +0.20 is an MVP-caliber season.",
      "Because it's points-based, EPA naturally weights a game-changing touchdown far more than a garbage-time checkdown — closer to how coaches actually value plays than raw yardage.",
    ],
    pitfalls: [
      "EPA depends on a model of 'expected points' by down, distance, and field position — small changes in that model can shift values, so treat exact rankings between similar players loosely.",
      "This app does not store play-by-play, so per-game passing_epa here is nflverse's own pre-aggregated total for that game, not something recomputed from individual plays.",
    ],
    compute: (s) => {
      const denom = s.attempts + s.sacksSuffered;
      return denom > 0
        ? {
            value: s.passingEpa / denom,
            steps: [
              `Total passing EPA this season: ${s.passingEpa.toFixed(1)}`,
              `Dropbacks (attempts + sacks): ${s.attempts} + ${s.sacksSuffered} = ${denom}`,
              `${s.passingEpa.toFixed(1)} ÷ ${denom} = ${(s.passingEpa / denom).toFixed(2)} EPA/dropback`,
            ],
          }
        : null;
    },
    format: "decimal2",
    higherIsBetter: true,
    related: ["expected-points", "any-a", "cpoe"],
    availability: "1999–today",
    workedExampleSubject: "QB",
    qualifiedMinimum: 200,
  },
];
