-- Phase 2: depth charts, injuries, snap counts, contracts, trades, game flow, honors, coaches, front office,
-- curated narratives, and season aggregate views.

-- ── Honors on players ─────────────────────────────────────────────────────────

alter table public.players add column hof_class smallint;   -- Pro Football Hall of Fame induction year (curated seed)

-- ── Current depth charts (latest nflverse snapshot per team) ──────────────────

create table public.depth_charts (
  franchise_id text not null references public.franchises (id) on delete cascade,
  formation text not null,                              -- nflverse pos_grp, e.g. '3WR 1TE', 'Base 4-3 D'
  slot smallint not null,                               -- spot within the formation (drives the field diagram)
  depth smallint not null,                              -- 1 = starter at this slot, 2 = first backup, …
  unit text not null check (unit in ('offense', 'defense', 'special_teams')),
  position text not null,                               -- 'LT', 'QB', 'LDE', …
  position_name text,
  player_id text references public.players (id) on delete set null,
  player_name text not null,
  as_of timestamptz not null,                           -- nflverse snapshot time
  sync_run_id bigint references public.sync_runs (id),
  primary key (franchise_id, formation, slot, depth)
);
create index depth_charts_player_idx on public.depth_charts (player_id);

-- ── Injury reports (2009+) ────────────────────────────────────────────────────

create table public.injury_reports (
  season smallint not null,
  week smallint not null,
  game_type text not null,
  team_abbr text not null,
  franchise_id text references public.franchises (id),
  player_name text not null,
  player_id text references public.players (id) on delete set null,
  position text,
  report_status text,                                   -- Out / Doubtful / Questionable (null = listed, no game status)
  primary_injury text,
  secondary_injury text,
  practice_status text,
  sync_run_id bigint references public.sync_runs (id),
  primary key (season, week, game_type, team_abbr, player_name)
);
create index injury_reports_franchise_idx on public.injury_reports (franchise_id, season, week);
create index injury_reports_player_idx on public.injury_reports (player_id);

-- ── Snap counts (2012+) — how much each player actually plays ─────────────────

create table public.player_game_snaps (
  player_id text not null references public.players (id) on delete cascade,
  game_id text not null references public.games (id) on delete cascade,
  season smallint not null,
  week smallint not null,
  team_abbr text not null,
  franchise_id text references public.franchises (id),
  position text,
  offense_snaps smallint,
  offense_pct smallint,                                 -- whole percent of the team's offensive snaps (0–100)
  defense_snaps smallint,
  defense_pct smallint,
  st_snaps smallint,
  st_pct smallint,
  sync_run_id bigint references public.sync_runs (id),
  primary key (player_id, game_id)
);
create index player_game_snaps_game_idx on public.player_game_snaps (game_id);
create index player_game_snaps_franchise_idx on public.player_game_snaps (franchise_id, season);

-- ── Contracts (OverTheCap via nflverse) ───────────────────────────────────────

create table public.contracts (
  contract_key text primary key,                        -- deterministic hash of player + team + year + terms
  player_id text references public.players (id) on delete cascade,
  otc_id integer,
  player_name text not null,
  position text,
  team_name text,
  franchise_id text references public.franchises (id),
  year_signed smallint,
  years smallint,
  value_millions real,
  apy_millions real,                                    -- average per year
  guaranteed_millions real,
  apy_cap_pct real,                                     -- APY as a share of the salary cap when signed
  is_active boolean,
  sync_run_id bigint references public.sync_runs (id)
);
create index contracts_player_idx on public.contracts (player_id);
create index contracts_franchise_idx on public.contracts (franchise_id, is_active);

-- ── Trades (2002+). One row per asset that moved in a trade. ──────────────────

create table public.trades (
  trade_id integer not null,
  asset_index smallint not null,
  season smallint not null,
  trade_date date,
  from_abbr text not null,                              -- team that gave the asset up
  to_abbr text not null,                                -- team that received it
  from_franchise_id text references public.franchises (id),
  to_franchise_id text references public.franchises (id),
  player_id text references public.players (id) on delete set null,
  player_name text,                                     -- null when the asset is a draft pick
  pick_season smallint,
  pick_round smallint,
  pick_number smallint,
  pick_conditional boolean,
  sync_run_id bigint references public.sync_runs (id),
  primary key (trade_id, asset_index)
);
create index trades_player_idx on public.trades (player_id);
create index trades_from_idx on public.trades (from_franchise_id, season);
create index trades_to_idx on public.trades (to_franchise_id, season);

-- ── Game flow from play-by-play (1999+) ───────────────────────────────────────

create table public.game_flow (
  game_id text primary key references public.games (id) on delete cascade,
  win_probability jsonb not null,                       -- [[game_seconds_elapsed, home_win_prob], …] one point per play
  scoring_plays jsonb not null,                         -- [{qtr, clock, team, type, description, away_score, home_score}]
  sync_run_id bigint references public.sync_runs (id)
);

-- ── Curated honors, coaches, front office ─────────────────────────────────────

create table public.awards (
  season smallint not null,
  award text not null check (award in ('MVP', 'OPOY', 'DPOY', 'OROY', 'DROY', 'CPOY', 'COY', 'WPMOY')),
  recipient_name text not null,
  player_id text references public.players (id) on delete set null,
  franchise_id text references public.franchises (id),
  position text,
  sync_run_id bigint references public.sync_runs (id),
  primary key (season, award, recipient_name)
);
create index awards_player_idx on public.awards (player_id);

create table public.head_coaches (
  franchise_id text not null references public.franchises (id) on delete cascade,
  coach_name text not null,
  start_season smallint not null,
  end_season smallint,                                  -- null = current head coach
  regular_wins smallint,
  regular_losses smallint,
  regular_ties smallint,
  playoff_wins smallint,
  playoff_losses smallint,
  is_interim boolean not null default false,
  note text,
  sync_run_id bigint references public.sync_runs (id),
  primary key (franchise_id, coach_name, start_season)
);

create table public.front_office (
  franchise_id text not null references public.franchises (id) on delete cascade,
  role text not null check (role in (
    'owner', 'president', 'general_manager', 'head_coach',
    'offensive_coordinator', 'defensive_coordinator', 'special_teams_coordinator')),
  person_name text not null,
  since_season smallint,
  note text,
  source_url text,
  verified_on date,
  sync_run_id bigint references public.sync_runs (id),
  primary key (franchise_id, role, person_name)
);

-- ── AI-drafted narratives (franchise history, "why they're special"), human-approved ──

create table public.narratives (
  entity_type text not null check (entity_type in ('franchise', 'player', 'venue', 'season')),
  entity_id text not null,
  kind text not null check (kind in ('overview', 'why_special', 'history', 'rivalries', 'eras')),
  body text not null,                                   -- markdown
  sources jsonb not null default '[]'::jsonb,           -- [{title, url}]
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected')),
  generated_by text,
  updated_at timestamptz not null default now(),
  primary key (entity_type, entity_id, kind)
);

-- ── RLS ───────────────────────────────────────────────────────────────────────

do $$
declare
  t text;
begin
  foreach t in array array[
    'depth_charts', 'injury_reports', 'player_game_snaps', 'contracts', 'trades', 'game_flow',
    'awards', 'head_coaches', 'front_office'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "Public read" on public.%I for select to anon, authenticated using (true)', t);
  end loop;
end $$;

alter table public.narratives enable row level security;
create policy "Public read published" on public.narratives for select to anon, authenticated using (status = 'published');

-- ── Season aggregates (views; 0-as-NULL columns are summed with coalesce) ─────

create view public.player_season_stats with (security_invoker = true) as
select
  player_id,
  season,
  season_type,
  count(*)::smallint as games,
  (array_agg(franchise_id order by week desc))[1] as last_franchise_id,
  array_agg(distinct franchise_id) filter (where franchise_id is not null) as franchise_ids,
  coalesce(sum(completions), 0)::int as completions,
  coalesce(sum(attempts), 0)::int as attempts,
  coalesce(sum(passing_yards), 0)::int as passing_yards,
  coalesce(sum(passing_tds), 0)::int as passing_tds,
  coalesce(sum(passing_interceptions), 0)::int as passing_interceptions,
  coalesce(sum(sacks_suffered), 0)::int as sacks_suffered,
  coalesce(sum(sack_yards_lost), 0)::int as sack_yards_lost,
  coalesce(sum(passing_air_yards), 0)::int as passing_air_yards,
  coalesce(sum(passing_yards_after_catch), 0)::int as passing_yards_after_catch,
  coalesce(sum(passing_first_downs), 0)::int as passing_first_downs,
  coalesce(sum(passing_epa), 0)::real as passing_epa,
  -- CPOE is a per-attempt rate: weight each game's value by its attempts.
  case when sum(attempts) filter (where passing_cpoe is not null) > 0
    then (sum(passing_cpoe * attempts) / sum(attempts) filter (where passing_cpoe is not null))::real end as passing_cpoe,
  coalesce(sum(passing_2pt_conversions), 0)::int as passing_2pt_conversions,
  coalesce(sum(carries), 0)::int as carries,
  coalesce(sum(rushing_yards), 0)::int as rushing_yards,
  coalesce(sum(rushing_tds), 0)::int as rushing_tds,
  coalesce(sum(rushing_first_downs), 0)::int as rushing_first_downs,
  coalesce(sum(rushing_epa), 0)::real as rushing_epa,
  coalesce(sum(rushing_2pt_conversions), 0)::int as rushing_2pt_conversions,
  coalesce(sum(targets), 0)::int as targets,
  coalesce(sum(receptions), 0)::int as receptions,
  coalesce(sum(receiving_yards), 0)::int as receiving_yards,
  coalesce(sum(receiving_tds), 0)::int as receiving_tds,
  coalesce(sum(receiving_air_yards), 0)::int as receiving_air_yards,
  coalesce(sum(receiving_yards_after_catch), 0)::int as receiving_yards_after_catch,
  coalesce(sum(receiving_first_downs), 0)::int as receiving_first_downs,
  coalesce(sum(receiving_epa), 0)::real as receiving_epa,
  coalesce(sum(receiving_2pt_conversions), 0)::int as receiving_2pt_conversions,
  coalesce(sum(fumbles_lost), 0)::int as fumbles_lost,
  coalesce(sum(def_tackles_solo), 0)::int as def_tackles_solo,
  coalesce(sum(def_tackle_assists), 0)::int as def_tackle_assists,
  coalesce(sum(def_tackles_for_loss), 0)::real as def_tackles_for_loss,
  coalesce(sum(def_sacks), 0)::real as def_sacks,
  coalesce(sum(def_qb_hits), 0)::int as def_qb_hits,
  coalesce(sum(def_interceptions), 0)::int as def_interceptions,
  coalesce(sum(def_pass_defended), 0)::int as def_pass_defended,
  coalesce(sum(def_fumbles_forced), 0)::int as def_fumbles_forced,
  coalesce(sum(def_tds), 0)::int as def_tds,
  coalesce(sum(def_safeties), 0)::int as def_safeties,
  coalesce(sum(punt_returns), 0)::int as punt_returns,
  coalesce(sum(punt_return_yards), 0)::int as punt_return_yards,
  coalesce(sum(kickoff_returns), 0)::int as kickoff_returns,
  coalesce(sum(kickoff_return_yards), 0)::int as kickoff_return_yards,
  coalesce(sum(special_teams_tds), 0)::int as special_teams_tds,
  coalesce(sum(fg_made), 0)::int as fg_made,
  coalesce(sum(fg_att), 0)::int as fg_att,
  max(fg_long)::int as fg_long,
  coalesce(sum(fg_made_50_plus), 0)::int as fg_made_50_plus,
  coalesce(sum(pat_made), 0)::int as pat_made,
  coalesce(sum(pat_att), 0)::int as pat_att,
  coalesce(sum(punts), 0)::int as punts,
  coalesce(sum(punt_yards), 0)::int as punt_yards,
  coalesce(sum(punts_inside_20), 0)::int as punts_inside_20
from public.player_game_stats
group by player_id, season, season_type;
comment on view public.player_season_stats is 'Per-player season totals by season type (REG/POST), summed from player_game_stats.';

create view public.player_season_snaps with (security_invoker = true) as
select
  player_id,
  season,
  count(*)::smallint as games,
  coalesce(sum(offense_snaps), 0)::int as offense_snaps,
  coalesce(sum(defense_snaps), 0)::int as defense_snaps,
  coalesce(sum(st_snaps), 0)::int as st_snaps,
  round(avg(offense_pct) filter (where offense_snaps > 0))::smallint as avg_offense_pct,
  round(avg(defense_pct) filter (where defense_snaps > 0))::smallint as avg_defense_pct,
  round(avg(st_pct) filter (where st_snaps > 0))::smallint as avg_st_pct
from public.player_game_snaps
group by player_id, season;
comment on view public.player_season_snaps is 'How much each player played per season (snap totals and average share of team snaps).';
