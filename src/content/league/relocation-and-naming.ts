import type { LeagueTopic } from "./types";

export const relocationAndNamingTopic: LeagueTopic = {
  id: "relocation-and-naming",
  title: "Relocation & Naming History",
  summary: "A franchise is the legal entity, its history, and its records — the city it plays in and the name it plays under are separate decisions that have both changed many times across NFL history.",
  sections: [
    {
      heading: "A franchise is not its city or its name",
      body: [
        "When a team relocates, it's the same franchise — same ownership lineage, same all-time record book, same retired numbers and Hall of Famers — simply playing home games in a new city going forward. This app's franchise pages track that continuous identity across every relocation and renaming.",
        "This is different from an expansion team, which is a brand-new franchise added to the league with no history before its first season, and different from a team folding, which a handful of very early-NFL teams did (mostly in the 1920s–30s) with no continuation at all.",
      ],
    },
    {
      heading: "How a relocation happens",
      body: [
        "Team owners decide whether to seek a move, usually driven by stadium and market issues, but a relocation to a new market requires approval from the league's other owners — the NFL's constitution sets a supermajority ownership vote as the bar to approve a franchise relocation.",
        "Relocations have come in waves through NFL history: several in the late 1940s–60s as the league (and the rival AFL, before the 1970 merger) expanded and stabilized its footprint, a notable wave in the 1980s–90s (including moves to and from Los Angeles, and a franchise's move to Baltimore), and a more recent 2010s wave that saw three franchises move to or within California and Nevada.",
        "A relocating team sometimes changes its nickname to fit the new market's identity, and sometimes keeps its previous nickname despite the new city — both patterns have happened repeatedly across NFL history.",
      ],
    },
    {
      heading: "Renaming without relocating",
      body: [
        "A franchise can also change its name while staying in the same city — most often for branding reasons, but occasionally because of pressure over a name considered offensive, as happened with the Washington franchise's rebrand in the early 2020s (Washington Football Team as an interim name, then a permanent new nickname).",
        "Uniform, logo, and color changes are separate from — and far more frequent than — actual name or city changes; a franchise can refresh its look many times across decades while keeping the same nickname and home city throughout.",
      ],
    },
    {
      heading: "Where to see it in this app",
      body: [
        "Each franchise's page lists its founding year and every relocation or renaming in its history. A dedicated relocation time-lapse view (sliding through the league's footprint decade by decade) is a planned later feature — see the project roadmap.",
      ],
    },
  ],
  relatedTopicIds: ["franchise-structure"],
};
