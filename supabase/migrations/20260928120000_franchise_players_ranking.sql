-- Rank a franchise's greats by what they did *for that team*: career value scaled by the share of the career
-- spent there, and Hall of Famers only when they played at least three seasons for the franchise.
create or replace view public.franchise_players with (security_invoker = true) as
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
  p.all_pro_count,
  (p.is_hof and count(distinct ps.season) >= 3) as hof_here,
  round(coalesce(p.career_av, 0) * count(distinct ps.season)::numeric / greatest(p.seasons_played, 1))::smallint as franchise_value
from public.player_seasons ps
join public.players p on p.id = ps.player_id
where ps.franchise_id is not null
group by
  ps.franchise_id, ps.player_id, p.display_name, p.position, p.position_group, p.headshot_url,
  p.is_hof, p.hof_class, p.career_av, p.pro_bowl_count, p.all_pro_count, p.seasons_played;
