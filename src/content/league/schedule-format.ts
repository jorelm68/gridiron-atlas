import type { LeagueTopic } from "./types";

export const scheduleFormatTopic: LeagueTopic = {
  id: "schedule-format",
  title: "Conferences, Divisions & the 17-Game Schedule",
  summary: "The NFL's 32 teams split into two conferences and eight divisions, and a fixed formula — not a random draw — builds each team's 17-game schedule.",
  sections: [
    {
      heading: "Conferences and divisions",
      body: [
        "The 32 teams split evenly into the American Football Conference (AFC) and National Football Conference (NFC) — 16 teams each. Within each conference, four divisions (East, North, South, West) hold four teams apiece.",
        "Division rivals are a team's closest, most frequent opponents and the first tiebreaker path to the playoffs: win your division, and you're guaranteed a playoff spot regardless of your overall record compared to teams outside it.",
      ],
    },
    {
      heading: "How the 17 games are set",
      body: [
        "Every team plays 6 games against its own division (home and away against each of its three rivals) — the fixed core of the schedule.",
        "Each team also plays all 4 teams from one other division in its own conference, and all 4 teams from one division in the opposite conference — 8 more games. Those division pairings rotate on a fixed 3-year (intra-conference) and 4-year (inter-conference) cycle known well in advance.",
        "Two more games are set by the previous season's standings: a team plays the teams that finished in the same position within the two remaining divisions of its own conference (e.g., a division winner plays the other three division winners' extra-game slot). This 'standings-based' pairing is what keeps good teams playing tougher schedules and bad teams playing easier ones the following year.",
        "The 17th game is an extra inter-conference matchup, also assigned by the previous year's standings, and is the game most often used to fill international (London, Germany, and occasionally other) slots.",
      ],
    },
    {
      heading: "Why this matters for strength of schedule",
      body: [
        "Because 14 of 17 games are determined by division and rotating division-pairings — not by a team's own record — most of a team's schedule difficulty is set years in advance, before anyone knows how good either team will actually be that season.",
        "This is also why two teams in the same division can have noticeably different overall schedule difficulty in a given year, even though they share 6 of their 17 games: their remaining 11 games come from different standings-based pairings.",
      ],
    },
  ],
  relatedStatIds: ["strength-of-schedule", "division-record"],
  relatedTopicIds: ["playoffs", "season-calendar"],
};
