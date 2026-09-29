-- Aggregate tenures before joining players so a franchise filter is applied first (the old shape merge-joined all
-- 35k players per request and timed out while 32 team pages prerendered in parallel).
create or replace view public.franchise_players with (security_invoker = true) as
with tenure as (
  select
    franchise_id,
    player_id,
    min(season)::smallint as first_season,
    max(season)::smallint as last_season,
    count(distinct season)::smallint as seasons
  from public.player_seasons
  where franchise_id is not null
  group by franchise_id, player_id
)
select
  t.franchise_id,
  t.player_id,
  t.first_season,
  t.last_season,
  t.seasons,
  p.display_name,
  p.position,
  p.position_group,
  p.headshot_url,
  p.is_hof,
  p.hof_class,
  p.career_av,
  p.pro_bowl_count,
  p.all_pro_count,
  (p.is_hof and t.seasons >= 3) as hof_here,
  round(coalesce(p.career_av, 0) * t.seasons::numeric / greatest(p.seasons_played, 1))::smallint as franchise_value
from tenure t
join public.players p on p.id = t.player_id;
