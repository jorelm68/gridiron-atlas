-- Gridiron Atlas core schema (Phase 0: data foundation).
-- Every table is public-read through RLS; only the data sync (secret key → service_role) writes.
-- Synced tables carry sync_run_id so every row is traceable to the run that last wrote it.

create extension if not exists pg_trgm with schema extensions;

-- ── Sync bookkeeping ──────────────────────────────────────────────────────────

create table public.sync_runs (
  id bigint generated always as identity primary key,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running' check (status in ('running', 'succeeded', 'failed')),
  trigger text not null check (trigger in ('cli', 'button', 'schedule')),
  datasets text[] not null,
  seasons smallint[],
  row_counts jsonb not null default '{}'::jsonb,
  error text
);
comment on table public.sync_runs is 'One row per data sync run.';

create table public.data_sources (
  id text primary key,                                  -- e.g. 'nflverse.games'
  name text not null,
  url text not null,
  license text,
  coverage text,
  upstream_updated_at timestamptz,                      -- when the source last published
  last_synced_at timestamptz,
  last_sync_run_id bigint references public.sync_runs (id)
);
comment on table public.data_sources is 'Where each dataset comes from and how fresh it is (powers "as of" labels).';

-- ── League structure ──────────────────────────────────────────────────────────

create table public.conferences (
  id text primary key,                                  -- 'AFC' | 'NFC'
  name text not null
);

create table public.divisions (
  id text primary key,                                  -- 'NFC North'
  conference_id text not null references public.conferences (id),
  name text not null,                                   -- 'North'
  active boolean not null default true                  -- false for retired divisions, e.g. 'NFC Central'
);

insert into public.conferences (id, name) values
  ('AFC', 'American Football Conference'),
  ('NFC', 'National Football Conference');

insert into public.divisions (id, conference_id, name, active) values
  ('AFC East', 'AFC', 'East', true),
  ('AFC North', 'AFC', 'North', true),
  ('AFC South', 'AFC', 'South', true),
  ('AFC West', 'AFC', 'West', true),
  ('NFC East', 'NFC', 'East', true),
  ('NFC North', 'NFC', 'North', true),
  ('NFC South', 'NFC', 'South', true),
  ('NFC West', 'NFC', 'West', true),
  ('AFC Central', 'AFC', 'Central', false),
  ('NFC Central', 'NFC', 'Central', false);

create table public.franchises (
  id text primary key,                                  -- current nflverse abbreviation, e.g. 'DET' ('LA' = Rams)
  name text not null,
  location text not null,
  nickname text not null,
  division_id text not null references public.divisions (id),
  founded_season smallint not null,
  origin_league text not null check (origin_league in ('NFL', 'AFL', 'AAFC')),
  notes text[] not null default '{}',
  color_primary text,
  color_secondary text,
  color_tertiary text,
  color_quaternary text,
  logo_url text,
  logo_squared_url text,
  wordmark_url text,
  sync_run_id bigint references public.sync_runs (id)
);
comment on table public.franchises is 'The 32 active franchises. A franchise keeps its identity through renames and relocations.';

create table public.franchise_eras (
  franchise_id text not null references public.franchises (id) on delete cascade,
  start_season smallint not null,
  end_season smallint,                                  -- null = current era
  name text not null,
  location text not null,
  nickname text not null,
  city text not null,
  state text,
  lat double precision,
  lng double precision,
  note text,
  sync_run_id bigint references public.sync_runs (id),
  primary key (franchise_id, start_season)
);
comment on table public.franchise_eras is 'Name and home city of each franchise over time (relocations and renames).';

create table public.team_abbrs (
  abbr text not null,
  start_season smallint not null,
  end_season smallint not null,
  franchise_id text references public.franchises (id), -- null for defunct teams
  name text not null,
  sync_run_id bigint references public.sync_runs (id),
  primary key (abbr, start_season)
);
comment on table public.team_abbrs is 'Resolves team codes used in source data (which change across eras) to a franchise and the name in use.';

create table public.team_divisions (
  franchise_id text not null references public.franchises (id) on delete cascade,
  start_season smallint not null,
  end_season smallint,                                  -- null = current alignment
  division_id text not null references public.divisions (id),
  sync_run_id bigint references public.sync_runs (id),
  primary key (franchise_id, start_season)
);

-- ── Venues ────────────────────────────────────────────────────────────────────

create table public.venues (
  id text primary key,                                  -- nflverse stadium_id, e.g. 'DET00'
  name text not null,
  names jsonb not null default '[]'::jsonb,             -- [{name, from, to}] naming-rights history
  kind text not null check (kind in ('home', 'neutral')),
  city text,
  region text,
  country text,
  lat double precision,
  lng double precision,
  roof text,
  surface text,
  capacity integer,
  opened_year smallint,
  wikipedia_title text,
  wikidata_id text,
  summary text,
  image_url text,
  image_thumb_url text,
  image_credit text,
  image_license text,
  image_source_url text,
  sync_run_id bigint references public.sync_runs (id)
);

create table public.venue_tenancies (
  venue_id text not null references public.venues (id) on delete cascade,
  franchise_id text not null references public.franchises (id) on delete cascade,
  start_season smallint not null,
  end_season smallint not null,
  sync_run_id bigint references public.sync_runs (id),
  primary key (venue_id, franchise_id, start_season)
);

-- ── Players ───────────────────────────────────────────────────────────────────

create table public.players (
  id text primary key,                                  -- gsis_id for modern players, 'h-<name>-<birth date>' for historical
  gsis_id text unique,
  pfr_id text,
  espn_id text,
  pff_id text,
  otc_id text,
  display_name text not null,
  first_name text,
  last_name text,
  football_name text,
  suffix text,
  birth_date date,
  height_in smallint,
  weight_lb smallint,
  college text,
  position text,
  position_group text,
  jersey_number smallint,
  headshot_url text,
  first_season smallint,
  last_season smallint,
  seasons_played smallint,
  current_franchise_id text references public.franchises (id),
  roster_status text,                                   -- latest status on the current-season roster (ACT, RES, DEV, ...)
  years_exp smallint,
  draft_season smallint,
  draft_round smallint,
  draft_pick smallint,
  draft_franchise_id text references public.franchises (id),
  is_hof boolean not null default false,
  all_pro_count smallint,
  pro_bowl_count smallint,
  career_av smallint,                                   -- Pro Football Reference Approximate Value (drafted players, 1980+)
  sync_run_id bigint references public.sync_runs (id)
);
create index players_display_name_trgm on public.players using gin (display_name extensions.gin_trgm_ops);
create index players_current_franchise_idx on public.players (current_franchise_id);
create index players_last_season_idx on public.players (last_season);

create table public.player_seasons (
  player_id text not null references public.players (id) on delete cascade,
  season smallint not null,
  team_abbr text not null,
  franchise_id text references public.franchises (id),
  position text,
  depth_chart_position text,
  jersey_number smallint,
  status text,
  years_exp smallint,
  sync_run_id bigint references public.sync_runs (id),
  primary key (player_id, season, team_abbr)
);
comment on table public.player_seasons is 'Which team(s) a player was rostered by each season (from season rosters).';
create index player_seasons_franchise_season_idx on public.player_seasons (franchise_id, season);
create index player_seasons_season_idx on public.player_seasons (season);

-- ── Games ─────────────────────────────────────────────────────────────────────

create table public.games (
  id text primary key,                                  -- nflverse game_id, e.g. '2026_03_GB_DET'
  season smallint not null,
  game_type text not null check (game_type in ('REG', 'WC', 'DIV', 'CON', 'SB')),
  week smallint not null,
  gameday date not null,
  weekday text,
  gametime text,                                        -- kickoff, US Eastern (HH:MM)
  away_abbr text not null,
  home_abbr text not null,
  away_franchise_id text references public.franchises (id),
  home_franchise_id text references public.franchises (id),
  away_score smallint,                                  -- null until played
  home_score smallint,
  location text,                                        -- 'Home' | 'Neutral'
  overtime boolean,
  div_game boolean,
  venue_id text references public.venues (id),
  venue_name text,
  roof text,
  surface text,
  temp smallint,
  wind smallint,
  spread_line real,                                     -- points the home team was favored by (negative = underdog)
  total_line real,
  away_rest smallint,
  home_rest smallint,
  away_qb_id text,
  home_qb_id text,
  away_qb_name text,
  home_qb_name text,
  away_coach text,
  home_coach text,
  referee text,
  espn_id text,
  pfr_id text,
  sync_run_id bigint references public.sync_runs (id)
);
create index games_season_week_idx on public.games (season, week);
create index games_home_idx on public.games (home_franchise_id, season);
create index games_away_idx on public.games (away_franchise_id, season);

-- Per-game stat tables store 0 as NULL to keep rows small; aggregate with coalesce(sum(x), 0).

create table public.team_game_stats (
  game_id text not null references public.games (id) on delete cascade,
  team_abbr text not null,
  franchise_id text references public.franchises (id),
  season smallint not null,
  week smallint not null,
  season_type text not null,                            -- 'REG' | 'POST'
  opponent_abbr text,
  completions smallint,
  attempts smallint,
  passing_yards smallint,
  passing_tds smallint,
  passing_interceptions smallint,
  sacks_suffered smallint,
  sack_yards_lost smallint,
  passing_air_yards smallint,
  passing_first_downs smallint,
  passing_epa real,
  passing_cpoe real,
  carries smallint,
  rushing_yards smallint,
  rushing_tds smallint,
  rushing_first_downs smallint,
  rushing_epa real,
  targets smallint,
  receptions smallint,
  fumbles_total smallint,
  fumbles_lost smallint,
  penalties smallint,
  penalty_yards smallint,
  def_sacks real,
  def_qb_hits smallint,
  def_tackles_for_loss real,
  def_interceptions smallint,
  def_pass_defended smallint,
  def_fumbles_forced smallint,
  def_tds smallint,
  def_safeties smallint,
  special_teams_tds smallint,
  punt_returns smallint,
  punt_return_yards smallint,
  kickoff_returns smallint,
  kickoff_return_yards smallint,
  fg_made smallint,
  fg_att smallint,
  pat_made smallint,
  pat_att smallint,
  punts smallint,
  punt_yards smallint,
  sync_run_id bigint references public.sync_runs (id),
  primary key (game_id, team_abbr)
);
create index team_game_stats_franchise_season_idx on public.team_game_stats (franchise_id, season);

create table public.player_game_stats (
  player_id text not null references public.players (id) on delete cascade,
  game_id text not null references public.games (id) on delete cascade,
  season smallint not null,
  week smallint not null,
  season_type text not null,                            -- 'REG' | 'POST'
  team_abbr text not null,
  franchise_id text references public.franchises (id),
  opponent_abbr text,
  position text,
  completions smallint,
  attempts smallint,
  passing_yards smallint,
  passing_tds smallint,
  passing_interceptions smallint,
  sacks_suffered smallint,
  sack_yards_lost smallint,
  passing_air_yards smallint,
  passing_yards_after_catch smallint,
  passing_first_downs smallint,
  passing_epa real,
  passing_cpoe real,
  passing_2pt_conversions smallint,
  carries smallint,
  rushing_yards smallint,
  rushing_tds smallint,
  rushing_first_downs smallint,
  rushing_epa real,
  rushing_2pt_conversions smallint,
  targets smallint,
  receptions smallint,
  receiving_yards smallint,
  receiving_tds smallint,
  receiving_air_yards smallint,
  receiving_yards_after_catch smallint,
  receiving_first_downs smallint,
  receiving_epa real,
  receiving_2pt_conversions smallint,
  fumbles_lost smallint,
  def_tackles_solo smallint,
  def_tackle_assists smallint,
  def_tackles_for_loss real,
  def_sacks real,
  def_qb_hits smallint,
  def_interceptions smallint,
  def_pass_defended smallint,
  def_fumbles_forced smallint,
  def_tds smallint,
  def_safeties smallint,
  punt_returns smallint,
  punt_return_yards smallint,
  kickoff_returns smallint,
  kickoff_return_yards smallint,
  special_teams_tds smallint,
  fg_made smallint,
  fg_att smallint,
  fg_long smallint,
  fg_made_50_plus smallint,
  pat_made smallint,
  pat_att smallint,
  punts smallint,
  punt_yards smallint,
  punts_inside_20 smallint,
  sync_run_id bigint references public.sync_runs (id),
  primary key (player_id, game_id)
);
create index player_game_stats_game_idx on public.player_game_stats (game_id);
create index player_game_stats_season_idx on public.player_game_stats (season, season_type);
create index player_game_stats_franchise_season_idx on public.player_game_stats (franchise_id, season);

create table public.team_seasons (
  franchise_id text not null references public.franchises (id) on delete cascade,
  season smallint not null,
  team_abbr text not null,
  team_name text not null,
  division_id text references public.divisions (id),
  wins smallint not null,
  losses smallint not null,
  ties smallint not null,
  points_for smallint not null,
  points_against smallint not null,
  div_wins smallint not null,
  div_losses smallint not null,
  div_ties smallint not null,
  div_rank smallint,                                    -- official for completed seasons, by record otherwise
  playoff_seed smallint,
  playoff_result text check (playoff_result in ('won_sb', 'lost_sb', 'lost_con', 'lost_div', 'lost_wc')),
  head_coach text,
  sync_run_id bigint references public.sync_runs (id),
  primary key (franchise_id, season)
);
comment on table public.team_seasons is 'Season records computed from games (1999+).';

-- ── History ───────────────────────────────────────────────────────────────────

create table public.draft_picks (
  season smallint not null,
  pick smallint not null,                               -- overall pick number
  round smallint not null,
  team_abbr text not null,
  franchise_id text references public.franchises (id),
  player_id text references public.players (id) on delete set null,
  pfr_player_id text,
  player_name text not null,
  position text,
  side text,                                            -- O | D | S (special teams)
  college text,
  age smallint,
  is_hof boolean not null default false,
  all_pro_count smallint,
  pro_bowl_count smallint,
  seasons_started smallint,
  career_av smallint,
  games smallint,
  last_season smallint,
  sync_run_id bigint references public.sync_runs (id),
  primary key (season, pick)
);
create index draft_picks_franchise_idx on public.draft_picks (franchise_id, season);
create index draft_picks_player_idx on public.draft_picks (player_id);

create table public.super_bowls (
  number smallint primary key,
  roman text not null,
  season smallint not null unique,
  played_on date not null,
  winner_franchise_id text not null references public.franchises (id),
  loser_franchise_id text not null references public.franchises (id),
  winner_name text not null,
  loser_name text not null,
  winner_score smallint not null,
  loser_score smallint not null,
  venue_name text not null,
  city text,
  state text,
  mvp_name text,
  mvp_position text,
  mvp_franchise_id text references public.franchises (id),
  game_id text references public.games (id),
  sync_run_id bigint references public.sync_runs (id)
);

-- ── Row level security: public read, no public writes ─────────────────────────

do $$
declare
  t text;
begin
  foreach t in array array[
    'sync_runs', 'data_sources', 'conferences', 'divisions', 'franchises', 'franchise_eras', 'team_abbrs',
    'team_divisions', 'venues', 'venue_tenancies', 'players', 'player_seasons', 'games', 'team_game_stats',
    'player_game_stats', 'team_seasons', 'draft_picks', 'super_bowls'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "Public read" on public.%I for select to anon, authenticated using (true)', t);
  end loop;
end $$;
