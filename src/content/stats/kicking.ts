import type { StatDefinition } from "./types";

export const kickingStats: StatDefinition[] = [
  {
    id: "fg-pct",
    name: "Field Goal Percentage",
    abbr: "FG%",
    category: "kicking",
    summary: "The share of a kicker's field goal attempts that he made.",
    formulaTex: "\\text{FG\\%} = \\frac{\\text{FG Made}}{\\text{FG Attempts}} \\times 100",
    howToRead: [
      "Modern NFL kickers are remarkably accurate — league average is around 85–88%, and a season above 90% is now a normal expectation for a starting job, not an outlier.",
      "Because misses are rare and attempts are few (20–35 per season for most kickers), a couple of misses can swing this several percentage points — always check attempt volume.",
    ],
    pitfalls: [
      "Raw FG% ignores distance — a kicker who only attempts short field goals will naturally post a higher percentage than one asked to attempt from 50+ yards. Compare kickers with similar attempt distance profiles when possible.",
      "Special teams' decisions (whether a coach trusts a kicker from long range at all) shape a kicker's attempt distribution and therefore his FG%, independent of his true leg strength.",
    ],
    compute: (s) => (s.fgAtt > 0
      ? {
          value: (s.fgMade / s.fgAtt) * 100,
          steps: [
            `Field goals made: ${s.fgMade}`,
            `Field goal attempts: ${s.fgAtt}`,
            `${s.fgMade} ÷ ${s.fgAtt} × 100 = ${((s.fgMade / s.fgAtt) * 100).toFixed(1)}%`,
          ],
        }
      : null),
    format: "pct",
    higherIsBetter: true,
    related: ["fg-pct-long", "xp-pct"],
    availability: "1999–today",
    workedExampleSubject: "K",
    qualifiedMinimum: 10,
  },
  {
    id: "fg-pct-long",
    name: "Field Goal Percentage from 50+ Yards",
    abbr: "FG% (50+)",
    category: "kicking",
    summary: "How often a kicker converts field goal tries from 50 yards or beyond — the clearest test of raw leg strength.",
    formulaTex: "\\text{FG\\%}_{50+} = \\frac{\\text{FG Made from 50+}}{\\text{FG Attempts from 50+}} \\times 100",
    howToRead: [
      "This used to be a rare, high-difficulty attempt; today's kickers make 50+ yard field goals at a rate approaching 70% league-wide, up sharply from even a decade ago as kicking specialization and technique have improved.",
      "Long-range accuracy is often the deciding factor teams use to separate an average kicker from an elite one, since almost everyone in the league now makes short and mid-range kicks reliably.",
    ],
    pitfalls: [
      "This app currently stores makes from 50+ yards but not attempts from that range, so a true 50+ field goal percentage can't be computed from our data yet — only the raw make count is shown below. We'd need to add fg_att_50_plus to compute this properly.",
    ],
    format: "pct",
    higherIsBetter: true,
    related: ["fg-pct"],
    availability: "Makes from 50+: 1999–today. Attempts from 50+ (needed for a true percentage): not yet stored.",
    workedExampleSubject: "K",
    qualifiedMinimum: 10,
  },
  {
    id: "xp-pct",
    name: "Extra Point Percentage",
    abbr: "XP%",
    category: "kicking",
    summary: "The share of a kicker's extra-point attempts (after touchdowns) that he made.",
    formulaTex: "\\text{XP\\%} = \\frac{\\text{XP Made}}{\\text{XP Attempts}} \\times 100",
    howToRead: [
      "Extra points moved back to the 15-yard line (a 33-yard kick) in 2015, making them meaningfully harder than the old automatic 20-yard chip shot. League average is still very high, around 94–96%.",
      "Because attempts are frequent (one per touchdown scored) and success is expected, even a small dip below ~93% for a season stands out as a real accuracy concern.",
    ],
    pitfalls: [
      "Before 2015 this stat is nearly meaningless as a measure of skill — the pre-2015 extra point was close to automatic from 20 yards, so era matters a lot here.",
    ],
    compute: (s) => (s.patAtt > 0
      ? {
          value: (s.patMade / s.patAtt) * 100,
          steps: [
            `Extra points made: ${s.patMade}`,
            `Extra point attempts: ${s.patAtt}`,
            `${s.patMade} ÷ ${s.patAtt} × 100 = ${((s.patMade / s.patAtt) * 100).toFixed(1)}%`,
          ],
        }
      : null),
    format: "pct",
    higherIsBetter: true,
    related: ["fg-pct"],
    availability: "1999–today (extra point moved to the 15-yard line starting 2015)",
    workedExampleSubject: "K",
    qualifiedMinimum: 10,
  },
];
