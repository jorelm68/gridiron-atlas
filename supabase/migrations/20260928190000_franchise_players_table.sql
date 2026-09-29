-- franchise_players becomes a table the sync fills (rosters dataset): even filter-first, the view merge-joined all
-- players per request and couldn't meet the 3s anon timeout while team pages prerender in parallel.
drop view public.franchise_players;

create table public.franchise_players (
  franchise_id text not null references public.franchises (id) on delete cascade,
  player_id text not null references public.players (id) on delete cascade,
  first_season smallint not null,
  last_season smallint not null,
  seasons smallint not null,
  display_name text not null,
  position text,
  position_group text,
  headshot_url text,
  is_hof boolean not null default false,
  hof_class smallint,
  career_av smallint,
  pro_bowl_count smallint,
  all_pro_count smallint,
  hof_here boolean not null default false,   -- Hall of Famer with 3+ seasons for this franchise
  franchise_value smallint,                  -- career AV scaled by the share of the career spent here
  sync_run_id bigint references public.sync_runs (id),
  primary key (franchise_id, player_id)
);
comment on table public.franchise_players is 'Player tenures per franchise with honors, computed by the sync — powers "all-time greats".';
create index franchise_players_rank_idx on public.franchise_players (franchise_id, hof_here, franchise_value desc nulls last);

alter table public.franchise_players enable row level security;
create policy "Public read" on public.franchise_players for select to anon, authenticated using (true);
