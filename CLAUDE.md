@AGENTS.md

# Gridiron Atlas

Visual NFL learning app: teams, geography, current and historical players, games, beginner-friendly stat
explanations, and interactive seeded quizzes. **All product decisions live in [docs/SCOPE.md](docs/SCOPE.md) — read it
before starting a feature.** The user knows football rules; never explain rules, always explain stats and team/league
mechanics.

## Stack
- Next.js 16 (App Router, `src/` layout, `@/*` alias), React 19, TypeScript, Tailwind CSS 4.
  This Next.js version differs from training data — check `node_modules/next/dist/docs/` before using an API.
- Supabase Postgres, no auth. Clients in `src/lib/supabase/`: `createServerClient` (publishable key, RLS) and
  `createAdminClient` (secret key, server/scripts only); `getBrowserClient` for Client Components.
- Planned (add when the phase needs them): shadcn/ui, Motion, react-three-fiber + drei, d3-geo + topojson, visx,
  MapLibre, driver.js, DuckDB for the sync pipeline.

## Commands
- `npm run dev` / `npm run build` / `npm run lint` / `npm run typecheck`
- `npm run sync` refresh the current season · `-- --full` rebuild all history · `-- --datasets a,b --seasons 2024-2026`
  (pipeline in `scripts/sync/`; runbook in the `nfl-sync` skill) · `npm run check:seeds` validate curated seeds
- `node scripts/duckq.mjs "<sql>"` ad-hoc DuckDB queries over cached source files in `.cache/nflverse/`
- `npm run db:new -- <name>` new migration · `npm run db:push` apply migrations to the linked cloud project
- `npm run db:types` regenerate `src/lib/supabase/database.types.ts` after schema changes
- `npm run db:start` / `npm run db:stop` local Supabase (requires Docker Desktop running)

## Rules
- Schema changes only through migration files in `supabase/migrations/` — never ad-hoc DDL against the cloud project.
  Every public table gets RLS enabled with a public read policy; writes happen only through the secret key.
- Secrets live only in `.env.local` (gitignored). Never print, log, or commit key values; `.env.example` documents names.
- nflverse is the authoritative data source; ESPN's public API only for same-day scores, injuries, and images.
  Never scrape Pro Football Reference.
- Every synced row is traceable to a sync run and source; the UI shows "as of" timestamps.
- Every user-facing feature ships with guided-tour steps (`data-tour` attributes) and respects `prefers-reduced-motion`.
- Windows machine: the Bash tool is Git Bash; prefer absolute paths.

## Delegation (model tiers)
- **`grunt-worker` (Haiku):** file searches, running lint/typecheck/build/tests, log triage, row-count and data
  sanity checks, simple mechanical edits.
- **`implementer` (Sonnet):** well-specified implementation once the approach is decided — components from a spec,
  migrations from an agreed schema, quiz types against the quiz-engine interface, tour steps.
- **`Explore` (Haiku override):** broad read-only sweeps across many files when only the conclusion is needed.
- **Keep in the main session:** architecture, schema and data-modeling decisions, debugging strategy, visual design
  direction, and review of subagent output.
- Do tiny tasks (a single read or one-line edit) inline — a cold subagent costs more than it saves.
