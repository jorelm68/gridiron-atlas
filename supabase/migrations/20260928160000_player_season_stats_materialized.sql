-- player_season_stats was a plain view that re-aggregated ~480k game rows per query and hit the anon role's 3s
-- statement timeout under load. It becomes a materialized view (same name and columns) refreshed by the data sync.

drop view public.player_season_stats;

create materialized view public.player_season_stats as
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
comment on materialized view public.player_season_stats is 'Per-player season totals by season type (REG/POST), summed from player_game_stats. Refreshed by the sync (refresh_season_stats).';

create unique index player_season_stats_pk on public.player_season_stats (player_id, season, season_type);
create index player_season_stats_season_idx on public.player_season_stats (season, season_type);

-- Materialized views have no RLS; this data is public by design (same as every table's "Public read" policy).
grant select on public.player_season_stats to anon, authenticated;

-- Called by the sync after stats load. Security definer so the service role can refresh without owning the view.
create function public.refresh_season_stats() returns void
language sql
security definer
set search_path = ''
as $$
  refresh materialized view concurrently public.player_season_stats;
$$;
revoke execute on function public.refresh_season_stats() from public, anon, authenticated;
grant execute on function public.refresh_season_stats() to service_role;
