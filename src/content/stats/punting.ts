import type { StatDefinition } from "./types";

export const puntingStats: StatDefinition[] = [
  {
    id: "gross-punt-average",
    name: "Gross Punt Average",
    abbr: "Gross Avg",
    category: "punting",
    summary: "The average distance a punter's kicks travel in the air and on the roll, from the line of scrimmage to where the ball is downed, touches, or is returned from.",
    formulaTex: "\\text{Gross Avg} = \\frac{\\text{Punt Yards}}{\\text{Punts}}",
    howToRead: [
      "League average gross punt average is roughly 45–47 yards in the modern era; 48+ over a full season is a strong leg.",
      "'Gross' means before subtracting return yardage — 'net' punting average (not stored in this app) subtracts what the returner gained back, which is usually considered the better overall measure of a punter's true field-position impact.",
    ],
    pitfalls: [
      "A punter who's told to prioritize hang time and pinning the ball inside the 20 (rather than pure distance) can have a lower gross average while still doing his job extremely well — see inside-20 rate for that side of the game.",
      "Playing home games at high altitude or with a lot of dome games can modestly inflate a punter's raw distance numbers.",
    ],
    compute: (s) => (s.punts > 0
      ? {
          value: s.puntYards / s.punts,
          steps: [
            `Punt yards: ${s.puntYards}`,
            `Punts: ${s.punts}`,
            `${s.puntYards} ÷ ${s.punts} = ${(s.puntYards / s.punts).toFixed(2)} yards/punt`,
          ],
        }
      : null),
    format: "decimal1",
    higherIsBetter: true,
    related: ["inside-20-rate"],
    availability: "1999–today",
    workedExampleSubject: "P",
    qualifiedMinimum: 20,
  },
  {
    id: "inside-20-rate",
    name: "Inside-20 Rate",
    abbr: "In20%",
    category: "punting",
    summary: "The share of a punter's kicks that are downed, fair-caught, or otherwise stopped inside the opponent's 20-yard line without going into the end zone.",
    formulaTex: "\\text{In20\\%} = \\frac{\\text{Punts Inside 20}}{\\text{Punts}} \\times 100",
    howToRead: [
      "This measures placement and touch, not just distance — a great directional punter can post a high inside-20 rate (40%+) even with an average gross average.",
      "It's one of the clearest ways to see a punter's field-position value, since pinning an opponent deep is often worth more than a few extra yards of raw distance.",
    ],
    pitfalls: [
      "A punter who's asked to kick from deep in his own territory often (a bad offense that stalls frequently) simply doesn't have the field position available to pin opponents inside the 20, dragging this rate down through no fault of his leg.",
      "A touchback (kicked or rolled into the end zone) counts against this rate the same way a return to the 30 does — both are 'not inside the 20' — even though a touchback is usually the worse outcome.",
    ],
    compute: (s) => (s.punts > 0
      ? {
          value: (s.puntsInside20 / s.punts) * 100,
          steps: [
            `Punts downed inside the 20: ${s.puntsInside20}`,
            `Total punts: ${s.punts}`,
            `${s.puntsInside20} ÷ ${s.punts} × 100 = ${((s.puntsInside20 / s.punts) * 100).toFixed(1)}%`,
          ],
        }
      : null),
    format: "pct",
    higherIsBetter: true,
    related: ["gross-punt-average"],
    availability: "1999–today",
    workedExampleSubject: "P",
    qualifiedMinimum: 20,
  },
];
