/**
 * Guided-tour content. The tour follows the Detroit Lions through every feature of the app (docs/SCOPE.md #41–42).
 *
 * Rules for editing:
 * - Every step points at a stable `data-tour` attribute in the UI — add the attribute with the feature, then the step.
 * - Copy is short (1–3 sentences). Teach one thing about the app and, where it fits, one thing about the league.
 * - Never hardcode numbers that change weekly (records, standings, stats): describe how to read them instead.
 * - `npm run test:tour` walks every chapter and fails if an anchor can't be found.
 */

export type TourSide = "top" | "right" | "bottom" | "left";

/**
 * Something to do before a step is shown, so its anchor is on screen:
 * - `click:<selector>`   click an element (skipped when it is already on/active, so toggles never flip back)
 * - `off:<selector>`     click a toggle only when it is currently on
 * - `atlas-focus:DET`    open a team's panel on the Atlas (`atlas-focus:none` closes it)
 */
export type TourBefore = string;

export interface TourStep {
  /** CSS selector for the anchor, normally `[data-tour="…"]`. A comma list picks the first *visible* match. */
  element: string;
  title: string;
  /** Plain text with optional <strong>/<kbd>/<code>/<em>; authored here, never user input. */
  body: string;
  side?: TourSide;
  /** Let the reader hover and click the highlighted element (default: it's dimmed and inert while the tour runs). */
  interactive?: boolean;
  before?: TourBefore | readonly TourBefore[];
  /** Page this step lives on; defaults to the chapter's route. `@lions-game` resolves to a recent completed Lions game. */
  route?: string;
}

export interface TourChapter {
  id: string;
  title: string;
  summary: string;
  /** Where the chapter starts. */
  route: string;
  /** Paths where "Tour this page" runs this chapter. A trailing `/*` matches everything below that path. */
  pages: readonly string[];
  steps: readonly TourStep[];
}

export const LIONS_GAME_ROUTE = "@lions-game";
export const GOFF_ROUTE = "/players/00-0033106";
export const PASSER_RATING_ROUTE = "/learn/stats/passer-rating";

const ATLAS_COLOR = '[data-tour="atlas-color-by"]';
const ATLAS_LAYERS = '[data-tour="atlas-layers"]';
const TEAM_TAB = (tab: string) => `click:[data-tour="team-tab-${tab}"]`;

export const TOUR_CHAPTERS: readonly TourChapter[] = [
  {
    id: "welcome",
    title: "Welcome & getting around",
    summary: "The header tools you'll use everywhere: navigation, instant search, data freshness, theme, and this tour.",
    route: "/",
    pages: [],
    steps: [
      {
        element: '[data-tour="nav"], [data-tour="nav-mobile"]',
        title: "Five ways in",
        body: "Atlas, Teams, Players, Games and Learn. We'll visit each one, following the <strong>Detroit Lions</strong> the whole way.",
        side: "bottom",
      },
      {
        element: '[data-tour="search"]',
        title: "Jump anywhere",
        body: "Open search here, or press <kbd>Ctrl</kbd> <kbd>K</kbd> (<kbd>⌘</kbd> <kbd>K</kbd> on a Mac) on any page. Type a team, a player or a page. Try &ldquo;Goff&rdquo;.",
        side: "bottom",
      },
      {
        element: '[data-tour="freshness"]',
        title: "Fresh data, always labeled",
        body: "This pill shows the latest week in the database. Hover it for the last sync time. Every number here traces back to a source and a timestamp.",
        side: "bottom",
      },
      {
        element: '[data-tour="theme-toggle"]',
        title: "Dark or light",
        body: "Dark is the default broadcast look. Flip to light any time; the whole app, this tour included, follows.",
        side: "bottom",
      },
      {
        element: '[data-tour="tour-menu"]',
        title: "Your guide lives here",
        body: "Replay the tour for the page you're on, run the full tour, or pick a single chapter from the Tour Center.",
        side: "bottom",
      },
    ],
  },
  {
    id: "atlas",
    title: "The Atlas",
    summary: "A 3D map of every stadium: color the league by conference or division, compare territories, open the Lions.",
    route: "/",
    pages: ["/"],
    steps: [
      {
        element: '[data-tour="atlas-map"]',
        title: "Every stadium, one map",
        body: "Each beam is a team's home. Hover for the name, click for details. League trivia: 32 teams but only 30 stadiums, because the Giants and Jets share one, and so do the Rams and Chargers.",
        side: "top",
        interactive: true,
        before: ["atlas-focus:none", `off:${ATLAS_LAYERS} [aria-label="Home territory"]`, `off:${ATLAS_LAYERS} [aria-label="Nearest stadium"]`],
      },
      {
        element: ATLAS_COLOR,
        title: "Color by conference",
        body: "The league is two 16-team halves: the AFC and the NFC. Their champions meet in the Super Bowl. The Lions are NFC.",
        side: "bottom",
        before: `click:${ATLAS_COLOR} [aria-label="Conference"]`,
      },
      {
        element: ATLAS_COLOR,
        title: "Color by division",
        body: "Each conference splits into four divisions of four. Detroit sits in the <strong>NFC North</strong> with the Bears, Packers and Vikings, the three teams it plays twice every year.",
        side: "bottom",
        before: `click:${ATLAS_COLOR} [aria-label="Division"]`,
      },
      {
        element: ATLAS_LAYERS,
        title: "Home territory",
        body: "The league's official home market: a 75-mile circle around each team's city. Notice the overlap in New York and Los Angeles, where two teams share a market.",
        side: "bottom",
        before: [`click:${ATLAS_COLOR} [aria-label="Team colors"]`, `click:${ATLAS_LAYERS} [aria-label="Home territory"]`],
      },
      {
        element: ATLAS_LAYERS,
        title: "Nearest stadium",
        body: "Same map, different question: which stadium is closest to any spot? Compare the shapes with the official territories. They rarely match.",
        side: "bottom",
        before: [`off:${ATLAS_LAYERS} [aria-label="Home territory"]`, `click:${ATLAS_LAYERS} [aria-label="Nearest stadium"]`],
      },
      {
        element: '[data-tour="atlas-list-toggle"]',
        title: "Prefer a list?",
        body: "List view shows all 32 teams grouped by division, no 3D needed. Handy on a slow connection or a small screen.",
        side: "bottom",
        before: [`off:${ATLAS_LAYERS} [aria-label="Nearest stadium"]`, "atlas-focus:none"],
      },
      {
        element: '[data-tour="atlas-panel"]',
        title: "Detroit, at Ford Field",
        body: "Click any team for its record, stadium and a link to the full team page. Detroit is where the rest of the tour goes next.",
        side: "left",
        before: "atlas-focus:DET",
      },
    ],
  },
  {
    id: "league",
    title: "League structure",
    summary: "Conferences, divisions and why the NFC North is the Lions' neighborhood.",
    route: "/teams",
    pages: ["/teams"],
    steps: [
      {
        element: '[data-tour="conference-afc"]',
        title: "The AFC",
        body: "American Football Conference: 16 teams in four divisions, East, North, South and West. Divisions are named for a compass direction, not a city.",
        side: "right",
      },
      {
        element: '[data-tour="conference-nfc"]',
        title: "The NFC",
        body: "The National Football Conference has the same shape. This is the Lions' conference, so its champion is who they'd have to beat to reach the Super Bowl.",
        side: "left",
      },
      {
        element: '[data-tour="division-nfc-north"]',
        title: "The NFC North",
        body: "Lions, Bears, Packers and Vikings. Teams appear in their division's current standing order, so the leader is on top.",
        side: "left",
      },
      {
        element: '[data-tour="teams-explainer"]',
        title: "Why divisions matter",
        body: "Six of a team's 17 games are against division rivals, and winning the division guarantees a playoff spot. Click any team to open its page.",
        side: "bottom",
      },
    ],
  },
  {
    id: "team",
    title: "The Lions team page",
    summary: "Identity, stadium, standings, front office, franchise history and all-time greats, on one page.",
    route: "/teams/det",
    pages: ["/teams/*"],
    steps: [
      {
        element: '[data-tour="team-hero"]',
        title: "Meet the Detroit Lions",
        body: "Every team page opens with identity: conference, division, founding year and home stadium. The page even borrows the franchise's colors.",
        side: "bottom",
      },
      {
        element: '[data-tour="team-facts"]',
        title: "The snapshot",
        body: "Current record and division standing, Super Bowl titles, recent playoff trips and the head coach: the four things people ask first.",
        side: "bottom",
      },
      {
        element: '[data-tour="team-stadium"]',
        title: "Ford Field",
        body: "Home since 2002, in downtown Detroit. It's a dome, so weather never matters at home. The Atlas link jumps back to its beam.",
        side: "right",
        before: TEAM_TAB("overview"),
      },
      {
        element: '[data-tour="team-division"]',
        title: "The division race",
        body: "Current NFC North standings. Ties are broken by head-to-head results first, then division record, which is why those twice-a-year rivalry games count so much.",
        side: "left",
      },
      {
        element: '[data-tour="team-front-office"]',
        title: "Who runs the team",
        body: "The owner hires a general manager to build the roster and a head coach to run it. Coordinators run the offense, defense and special teams.",
        side: "left",
      },
      {
        element: '[data-tour="team-timeline"]',
        title: "From Portsmouth to Detroit",
        body: "The Lions began as the Portsmouth Spartans in Ohio in 1930, then moved to Detroit in 1934. Franchises change names and cities; the history stays with them.",
        side: "left",
      },
      {
        element: '[data-tour="team-notable"]',
        title: "All-time greats",
        body: "Pro Football Hall of Famers first, then the players who created the most value for the franchise. Click anyone to open their page.",
        side: "top",
      },
    ],
  },
  {
    id: "team-tabs",
    title: "Roster, schedule & history",
    summary: "The Lions' tabs: who's on the roster, the week-by-week schedule and every season back to 1999.",
    route: "/teams/det",
    pages: [],
    steps: [
      {
        element: '[data-tour="team-tabs"]',
        title: "One team, four views",
        body: "Overview, Roster, Schedule and History are tabs on the same page. We'll open the last three.",
        side: "bottom",
        before: TEAM_TAB("overview"),
      },
      {
        element: '[data-tour="roster-explainer"]',
        title: "The 53-man roster",
        body: "A team carries up to 53 active players. Small labels beside a name show status: practice squad, injured reserve and more.",
        side: "left",
        before: TEAM_TAB("roster"),
      },
      {
        element: '[data-tour="team-schedule"]',
        title: "Week by week",
        body: "Every game in order, with the result once it's played. The greyed-out week is the <strong>bye</strong>: every team gets one week off.",
        side: "top",
        before: TEAM_TAB("schedule"),
      },
      {
        element: '[data-tour="team-season-chart"]',
        title: "Every season at a glance",
        body: "Win percentage by season, so 16- and 17-game years compare fairly. Hover a bar for that year's record, division finish and coach.",
        side: "top",
        before: TEAM_TAB("history"),
      },
    ],
  },
  {
    id: "player",
    title: "A player: Jared Goff",
    summary: "Player pages: bio, career path, season stats, game log, snap share and contract, using the Lions' quarterback.",
    route: "/players",
    pages: ["/players", "/players/*"],
    steps: [
      {
        element: '[data-tour="players-search"]',
        title: "Every player since 1920",
        body: "Search by name, team or position. Modern players get full stats; early decades are sparser, and every page says how deep its data goes.",
        side: "bottom",
      },
      {
        route: GOFF_ROUTE,
        element: '[data-tour="player-hero"]',
        title: "Jared Goff",
        body: "The header holds the essentials: position, jersey, bio, draft slot, Pro Bowls and career approximate value (AV), a single number that estimates a player's total worth.",
        side: "bottom",
      },
      {
        route: GOFF_ROUTE,
        element: '[data-tour="player-career-path"]',
        title: "The path that got him here",
        body: "Drafted first overall by the Rams in 2016, then <strong>traded</strong> to Detroit in 2021. Each card is a run of seasons with one team, labeled Drafted, Traded or Joined.",
        side: "top",
      },
      {
        route: GOFF_ROUTE,
        element: '[data-tour="player-stats"]',
        title: "Season by season",
        body: "One row per season, plus career totals and a playoffs tab. Detailed stats start in 1999; earlier years show up in the career path only.",
        side: "top",
      },
      {
        route: GOFF_ROUTE,
        element: '[data-tour="player-stats-explainer"]',
        title: "Stats, explained in place",
        body: "Every column is decoded here. Look for terms with a dotted underline anywhere in the app: hover one for a definition, click for the full glossary page.",
        side: "left",
      },
      {
        route: GOFF_ROUTE,
        element: '[data-tour="player-gamelog"]',
        title: "The game log",
        body: "Pick a season to see every game he played, with opponent and result. Click a row to open that game.",
        side: "top",
      },
      {
        route: GOFF_ROUTE,
        element: '[data-tour="player-snaps"]',
        title: "Snap share",
        body: "How much of the team's offense he was on the field for, game by game. Snap share tells you who's a starter and who's a rotation piece.",
        side: "top",
      },
      {
        route: GOFF_ROUTE,
        element: '[data-tour="player-contract"]',
        title: "The contract",
        body: "Length, total value, average per year (APY) and guaranteed money. \"Share of the cap\" shows what he costs against the league-wide salary cap all 32 teams must fit under.",
        side: "top",
      },
    ],
  },
  {
    id: "games",
    title: "Games & box scores",
    summary: "The scoreboard, then a recent Lions game: win probability, spread, box score and leaders.",
    route: "/games",
    pages: ["/games", "/games/*"],
    steps: [
      {
        element: '[data-tour="games-week-picker"]',
        title: "Every week since 1999",
        body: "Pick a season and a week or playoff round. Lions games are outlined in Honolulu blue. Open any game for its own page.",
        side: "bottom",
      },
      {
        route: LIONS_GAME_ROUTE,
        element: '[data-tour="game-header"]',
        title: "A recent Lions game",
        body: "Final score, each team's record going in, venue and date. We picked the Lions' latest completed game for you.",
        side: "bottom",
      },
      {
        route: LIONS_GAME_ROUTE,
        element: '[data-tour="game-wp-chart"]',
        title: "How the game swung",
        body: "Win probability: a model's estimate, before every snap, of who will win. Steep moves mark the plays that decided it.",
        side: "right",
      },
      {
        route: LIONS_GAME_ROUTE,
        element: '[data-tour="game-scoring"]',
        title: "Scoring, in order",
        body: "Every scoring play with the running score, so each swing on the chart lines up with the play behind it.",
        side: "left",
      },
      {
        route: LIONS_GAME_ROUTE,
        element: '[data-tour="game-spread"]',
        title: "The point spread",
        body: "Who was favored and by how much, and whether they covered. A team favored by 3 was expected to win by about a field goal. This is a stat to read, not a betting tool.",
        side: "left",
      },
      {
        route: LIONS_GAME_ROUTE,
        element: '[data-tour="game-box"]',
        title: "The box score",
        body: "Team totals side by side: yards, first downs, turnovers, third-down efficiency and more.",
        side: "right",
      },
      {
        route: LIONS_GAME_ROUTE,
        element: '[data-tour="game-leaders"]',
        title: "Game leaders",
        body: "The top passer, rusher and receiver for each side. Full stat lines for every player follow underneath.",
        side: "top",
      },
    ],
  },
  {
    id: "learn",
    title: "Learn: stats & league mechanics",
    summary: "The glossary, and passer rating worked out step by step with Goff's real numbers.",
    route: "/learn",
    pages: ["/learn", "/learn/*"],
    steps: [
      {
        element: '[data-tour="learn-stats"]',
        title: "The stat glossary",
        body: "Every stat in plain language: what it measures, how it's computed, what counts as good. Open any card.",
        side: "top",
      },
      {
        element: '[data-tour="learn-league"]',
        title: "How the league works",
        body: "Short guides to the parts casual fans miss: how a franchise is organized, roster and practice-squad rules, the salary cap, the draft.",
        side: "top",
      },
      {
        route: PASSER_RATING_ROUTE,
        element: '[data-tour="stat-header"]',
        title: "One stat, one page",
        body: "Each page starts with a one-line summary, then goes deeper. Passer rating is the NFL's official passing formula.",
        side: "bottom",
      },
      {
        route: PASSER_RATING_ROUTE,
        element: '[data-tour="stat-formula"]',
        title: "The formula",
        body: "Four ingredients (completion rate, yards, touchdowns and interceptions per attempt), each capped at 2.375. That cap is why a perfect game is exactly 158.3.",
        side: "top",
      },
      {
        route: PASSER_RATING_ROUTE,
        element: '[data-tour="stat-example"]',
        title: "Now with real numbers",
        body: "The same formula, applied to a real Jared Goff season and worked out live from box scores, with where it ranks among qualified passers.",
        side: "top",
      },
      {
        route: PASSER_RATING_ROUTE,
        element: '[data-tour="stat-how-to-read"]',
        title: "What's a good number?",
        body: "Each stat page ends with how to read it, plus the common pitfalls. Passer rating, for one, ignores sacks and scrambling completely.",
        side: "top",
      },
    ],
  },
  {
    id: "data",
    title: "Data & updates",
    summary: "Where the numbers come from, and how to refresh them.",
    route: "/data",
    pages: ["/data"],
    steps: [
      {
        element: '[data-tour="data-stats"]',
        title: "What's in the database",
        body: "Players, games and player stat lines, all synced from open sources. The first tile is the latest week loaded.",
        side: "bottom",
      },
      {
        element: '[data-tour="data-history"]',
        title: "Every update is logged",
        body: "Each sync run records its trigger, scope, status and how many rows it wrote, so a number that looks off can be traced.",
        side: "top",
      },
      {
        element: '[data-tour="data-sources"]',
        title: "Sources and licenses",
        body: "<strong>nflverse</strong> is the authoritative source for results and stats. Curated history and photos are labeled with their license.",
        side: "top",
      },
      {
        element: '[data-tour="data-update"]',
        title: "Update on demand",
        body: "Refresh the current season, or rebuild all history, from here. Stats also refresh on their own each Tuesday after Monday Night Football.",
        side: "left",
      },
      {
        element: '[data-tour="data-passphrase"]',
        title: "Why a passphrase?",
        body: "There are no accounts, so the button asks for a passphrase (the app's <code>SYNC_SECRET</code> setting). That keeps strangers from kicking off a sync.",
        side: "left",
      },
    ],
  },
];

export const TOUR_CHAPTER_IDS = TOUR_CHAPTERS.map((c) => c.id);

export const getChapter = (id: string): TourChapter | undefined => TOUR_CHAPTERS.find((c) => c.id === id);

export const totalSteps = (chapters: readonly TourChapter[] = TOUR_CHAPTERS) => chapters.reduce((n, c) => n + c.steps.length, 0);

/** Very rough reading time: about five seconds per step. */
export const minutesFor = (chapters: readonly TourChapter[]) => Math.max(1, Math.round((totalSteps(chapters) * 5) / 60));

/** The chapters whose "Tour this page" matches a path, in tour order. */
export function chaptersForPath(pathname: string): TourChapter[] {
  return TOUR_CHAPTERS.filter((chapter) =>
    chapter.pages.some((page) => (page.endsWith("/*") ? pathname.startsWith(page.slice(0, -1)) : pathname === page)),
  );
}
