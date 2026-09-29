-- Season totals move from a (materialized) view to a table the sync fills: aggregating ~480k game rows at query time
-- hit the anon role's 3s statement timeout, and refreshing a materialized view over the API hit the service timeout.
-- Same name and columns as before, so readers are unchanged.

drop function public.refresh_season_stats();
drop materialized view public.player_season_stats;

create table public.player_season_stats (
  player_id text not null references public.players (id) on delete cascade,
  season smallint not null,
  season_type text not null,                          -- 'REG' | 'POST'
  games smallint not null,
  last_franchise_id text references public.franchises (id),
  franchise_ids text[] not null default '{}',
  completions integer not null default 0,
  attempts integer not null default 0,
  passing_yards integer not null default 0,
  passing_tds integer not null default 0,
  passing_interceptions integer not null default 0,
  sacks_suffered integer not null default 0,
  sack_yards_lost integer not null default 0,
  passing_air_yards integer not null default 0,
  passing_yards_after_catch integer not null default 0,
  passing_first_downs integer not null default 0,
  passing_epa real not null default 0,
  passing_cpoe real,                                   -- attempt-weighted
  passing_2pt_conversions integer not null default 0,
  carries integer not null default 0,
  rushing_yards integer not null default 0,
  rushing_tds integer not null default 0,
  rushing_first_downs integer not null default 0,
  rushing_epa real not null default 0,
  rushing_2pt_conversions integer not null default 0,
  targets integer not null default 0,
  receptions integer not null default 0,
  receiving_yards integer not null default 0,
  receiving_tds integer not null default 0,
  receiving_air_yards integer not null default 0,
  receiving_yards_after_catch integer not null default 0,
  receiving_first_downs integer not null default 0,
  receiving_epa real not null default 0,
  receiving_2pt_conversions integer not null default 0,
  fumbles_lost integer not null default 0,
  def_tackles_solo integer not null default 0,
  def_tackle_assists integer not null default 0,
  def_tackles_for_loss real not null default 0,
  def_sacks real not null default 0,
  def_qb_hits integer not null default 0,
  def_interceptions integer not null default 0,
  def_pass_defended integer not null default 0,
  def_fumbles_forced integer not null default 0,
  def_tds integer not null default 0,
  def_safeties integer not null default 0,
  punt_returns integer not null default 0,
  punt_return_yards integer not null default 0,
  kickoff_returns integer not null default 0,
  kickoff_return_yards integer not null default 0,
  special_teams_tds integer not null default 0,
  fg_made integer not null default 0,
  fg_att integer not null default 0,
  fg_long integer,
  fg_made_50_plus integer not null default 0,
  pat_made integer not null default 0,
  pat_att integer not null default 0,
  punts integer not null default 0,
  punt_yards integer not null default 0,
  punts_inside_20 integer not null default 0,
  sync_run_id bigint references public.sync_runs (id),
  primary key (player_id, season, season_type)
);
comment on table public.player_season_stats is 'Per-player season totals by season type (REG/POST), computed by the sync from player_game_stats.';
create index player_season_stats_season_idx on public.player_season_stats (season, season_type);

alter table public.player_season_stats enable row level security;
create policy "Public read" on public.player_season_stats for select to anon, authenticated using (true);
