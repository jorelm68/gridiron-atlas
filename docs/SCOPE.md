# Gridiron Atlas — Scope & Decisions

A visual, beginner-friendly NFL learning app. Decided 2026-09-27 (user accepted every recommended default).
Read this before starting any feature. Change a decision here first, then in code.

## Audience
The user already knows football **rules** — never explain rules. Do explain everything else: every statistic
(how it's computed, how to read it, what "good" looks like), how teams and rosters are built, league structure,
and why notable players matter.

## Product decisions

### Audience, hosting, cost
1. Deployed on Vercel, **unlisted** (not advertised). No authentication.
2. Desktop-first, responsive; quizzes fully usable on a phone.
3. $0 budget: Supabase free tier, free data sources only.

### Time depth
4. Full current season (2026): rosters, weekly stats, games, standings, depth charts, injuries.
5. Stats depth: full stats 1999+; identity/teams/seasons/draft/awards for every player since 1920; curated milestones
   (Super Bowls, MVPs, #1 picks, Hall of Fame) for all of history. Pages label data depth by era honestly.
6. Game results 1999+; all playoff games since 1966 if a reliable source verifies.
7. No raw play-by-play in the DB. Store a compact win-probability series per game (for a WP chart), computed during sync.

### Map & geography
8. Team "regions": the league's official 75-mile home territory **and** nearest-stadium (Voronoi) as toggleable layers,
   each explained.
9. Both map styles: stylized 3D US map (react-three-fiber) on the home Atlas; real map (MapLibre, satellite) when
   zooming into a stadium.
10. International games shown on a small world view.
11. Relocation time slider (1920 → today) showing franchises appear, move, and rename — a signature feature.

### Team structure
12. Current owner, GM, head coach, OC, DC; all-time head coaches per franchise.
13. Salary cap & contracts at a basic level (cap hit, length, APY) with explainers.
14. Draft history.
15. Current depth chart rendered on a field diagram.
16. Injury / IR status for the current season.
17. Curated franchise history page (founding, relocations, name changes, retired numbers, rivalries, eras) —
    AI-drafted with sources, human-reviewed before publishing.

### Players
18. Every player gets a page; richness varies by era and is labeled.
19. "Why they're special" narratives: AI-written with citations for current starters, Hall of Famers, and ~500 all-time
    greats; Wikipedia summary for everyone else.
20. Advanced stats included (EPA, CPOE, success rate) with explainers. Proprietary stats (PFF grades, DVOA, ESPN QBR)
    are explained in the glossary only — never computed or stored.
21. Snap counts / usage (2012+).
22. Transactions: trades from data; signings/releases inferred from roster changes and labeled "inferred".
23. Defense and special teams at equal depth to offense (offense listed first).
24. No fantasy football.
25. Point spread shown on game pages only as "who was favored and by how much" — no betting features.

### Images & media
26. Logos and headshots hotlinked from ESPN's CDN with a fallback image; Wikimedia stadium photos with attribution.
27. Uniforms: our own SVG uniform renderer (from team colors) plus a 3D helmet viewer; primary home/away first.
28. Logo evolution timeline — Phase 4, if Wikimedia sourcing works.
29. No video (link out at most).

### Updating
30. Update triggers: CLI (`npm run sync`) and an in-app "Update data" button (protected by `SYNC_SECRET`,
    dispatches a GitHub Action); optional Tuesday-morning schedule after Monday Night Football.
31. nflverse is authoritative. ESPN's public API only fills same-day scores and injuries.
32. AI-updated narrative content lands in a `pending` state with sources; approved in an admin view.
33. Sync runs in GitHub Actions and locally (not in Vercel functions).

### Learning & quizzes
34. Quiz progress in the browser (localStorage) with JSON export/import.
35. Spaced repetition resurfaces missed items.
36. v1 quiz types: drag logo to map · division sort · blurred/cropped logo · color palette → team · Super Bowl
    timeline · headshot → player · career path → player · "is this stat good?" · higher/lower stat · stadium from
    photo/map · relocation history.
37. Difficulty tiers and themed packs (e.g. "1990s dynasties").
38. Light structured learning path alongside free exploration.
39. Claude keeps proposing new quiz types; each is implemented only after approval.
    Quizzes are seeded — the same seed reproduces the same quiz. Quiz types are plugins
    (generator + interaction component + grader).

### Design & tour
40. Dark "broadcast" base with team-adaptive accents; light mode available. Respect `prefers-reduced-motion`.
41. Guided tour: auto first-visit walkthrough, per-page "?" mini-tours, and a Tour Center with chapters.
    Every feature ships with its tour steps (stable `data-tour` attributes) and a browser test that walks the tour.
42. The tour follows the **Detroit Lions** through every feature.

### Engineering
43. Model-tier subagents in `.claude/agents/` with routing rules in CLAUDE.md.
44. Private GitHub repo.
45. Supabase cloud project for the app; local Supabase (Docker) for development. Migrations live in the repo.

## Data sources

| Data | Source | Coverage (verify when building) |
|---|---|---|
| Rosters (who played where) | nflverse | 1920–now, sparser in early decades |
| Draft picks | nflverse | 1980–now |
| Schedules, results, spreads | nflverse | 1999–now |
| Player game stats, play-by-play (EPA, WP, CPOE) | nflverse | 1999–now |
| Depth charts / injuries / snap counts / Next Gen Stats | nflverse | 2001 / 2009 / 2012 / 2016–now |
| Trades / contracts | nflverse (OverTheCap) | ~2002–now |
| Same-day scores, logos, headshots | ESPN public API (unofficial) | current |
| Bios, stadium photos | Wikipedia / Wikimedia | CC-licensed, attribute |
| Pre-1999 box scores | Pro Football Reference | **Do not scrape** (terms prohibit bulk scraping) |

## Out of scope
Football rules · minute-by-minute live data · user accounts · other leagues · betting tools ·
scraping Pro Football Reference · raw play-by-play storage · video.

## Phases
- **0 — Data foundation:** schema, sync pipeline + run log, 2026 season & rosters, games 1999+, all-time players,
  Super Bowl history.
- **1 — Explore:** Atlas (3D map), league structure explorer, team pages, stat glossary.
- **2 — Depth:** player pages, game pages (WP charts), transactions.
- **3 — Learn:** quiz engine, first quiz types, spaced repetition.
- **4 — History:** relocation time-lapse, logo evolution, pre-1999 data.
- The guided tour grows with every phase.

## Status
- 2026-09-27 — Project scaffolded (Next.js 16, Tailwind 4, Supabase CLI), setup-status page, subagents, private repo.
- 2026-09-28 — **Phase 0 done**: schema (core + phase 2 tables), full-history sync (34.8k players, 142k roster seasons,
  7.5k games, 479k player-game stat lines, 893 team seasons, 12.9k draft picks, 67 venues with photos, 60 Super Bowls),
  update button / GitHub Action / nfl-sync skill. DB ≈ 205 MB of the 500 MB free tier.
  **Phase 1/2 in progress**: shell + Teams explorer + team pages done; Atlas, Learn, honors/coaches seeds underway.
  Next: player pages, game pages, Phase 2 datasets (depth charts, injuries, snaps, contracts, trades, game flow),
  guided tour, quizzes.
- Known gaps: Hall of Fame flags cover only 1980+ draftees until the curated HOF seed loads; pre-1999 game results and
  pre-2002 division alignment beyond 1999–2001 aren't loaded yet (Phase 4).
