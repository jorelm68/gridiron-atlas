---
name: nfl-sync
description: Refresh Gridiron Atlas NFL data (games, stats, rosters, players, standings) from nflverse into Supabase and verify the result. Use when asked to update, refresh, or sync the data, after a week of games, or when data looks stale.
---

# Sync NFL data

The pipeline lives in `scripts/sync/` (see its header comment for all flags). It is idempotent: re-running is always safe.

## 1. Check the current state
Run read-only SQL (Supabase MCP `execute_sql`, project `ttfcygymbiswqefdmpiu` only):
```sql
select id, status, trigger, datasets, seasons, finished_at, error from sync_runs order by id desc limit 5;
select season, max(week) filter (where home_score is not null) as last_played_week from games group by 1 order by 1 desc limit 2;
```
If a run is still `running` and started under an hour ago, another sync is in progress — don't start a second one.

## 2. Run the sync
- Weekly update (current season — the default): `npm run sync`
- Specific seasons: `npm run sync -- --seasons 2024-2026`
- Specific datasets (dependencies are added automatically): `npm run sync -- --datasets games,stats`
- Full rebuild of all history (slow, ~10+ min): `npm run sync -- --full`
- Force re-download of cached source files: add `--refresh`

Hand the run itself to the `grunt-worker` subagent when available; it only needs to report the final summary.

## 3. Verify
```sql
select * from sync_runs order by id desc limit 1;               -- status succeeded, row_counts sensible
select season, week, count(*) as games, count(home_score) as played from games
  where season = (select max(season) from games) group by 1, 2 order by 2;
select franchise_id, wins, losses, ties from team_seasons
  where season = (select max(season) from team_seasons) order by wins desc limit 5;
```
Also run `npm run check:seeds` if any file in `data/seed/` changed.

## 4. Report
Summarize for the user: the run id, the latest week with results, notable changes (new games, standings leaders), and any warnings from the log (dropped rows, enrichment failures). If the run failed, read `sync_runs.error`, fix the cause, and re-run.
