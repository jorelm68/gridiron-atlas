-- Every player who ever rostered for a franchise, with tenure and honors — powers "notable players" on team pages.
create view public.franchise_players with (security_invoker = true) as
select
  ps.franchise_id,
  ps.player_id,
  min(ps.season)::smallint as first_season,
  max(ps.season)::smallint as last_season,
  count(distinct ps.season)::smallint as seasons,
  p.display_name,
  p.position,
  p.position_group,
  p.headshot_url,
  p.is_hof,
  p.hof_class,
  p.career_av,
  p.pro_bowl_count,
  p.all_pro_count
from public.player_seasons ps
join public.players p on p.id = ps.player_id
where ps.franchise_id is not null
group by
  ps.franchise_id, ps.player_id, p.display_name, p.position, p.position_group, p.headshot_url,
  p.is_hof, p.hof_class, p.career_av, p.pro_bowl_count, p.all_pro_count;
comment on view public.franchise_players is 'Player tenures per franchise (from season rosters) with honors, for ranking notable players.';
