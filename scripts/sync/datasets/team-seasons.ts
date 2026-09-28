import { cachedDownload } from "../lib/cache";
import { pruneStale, recordSource, upsertRows } from "../lib/db";
import { lit } from "../lib/duck";
import { seasonScope, seasonsFor } from "../lib/seasons";
import type { Dataset } from "../lib/types";

const FIRST_SEASON = 1999;
const STANDINGS_URL = "https://raw.githubusercontent.com/nflverse/nfldata/master/data/standings.csv";

/** Season records, division ranks, and playoff results, computed from `game_rows` (left by the games dataset). */
export const teamSeasons: Dataset = {
  id: "team-seasons",
  description: "Season records, division ranks, playoff results (1999+)",
  dependsOn: ["games"],
  async run(ctx) {
    const seasons = seasonsFor(ctx, FIRST_SEASON);
    if (seasons.length === 0) return;
    const { duck } = ctx;

    const standingsFile = await cachedDownload(STANDINGS_URL, "nfldata/standings.csv", { refresh: true });
    await duck.exec(`create or replace table standings as select * from read_csv_auto(${lit(standingsFile)})`);

    const rows = await duck.all(`
      with reg_games as (
        select season, home_franchise_id as franchise_id, home_abbr as team_abbr, home_score as pf, away_score as pa,
          (home_score > away_score) as won, (home_score < away_score) as lost, (home_score = away_score) as tied,
          div_game, home_coach as coach
        from game_rows
        where game_type = 'REG' and home_score is not null and away_score is not null and home_franchise_id is not null
        union all
        select season, away_franchise_id as franchise_id, away_abbr as team_abbr, away_score as pf, home_score as pa,
          (away_score > home_score) as won, (away_score < home_score) as lost, (away_score = home_score) as tied,
          div_game, away_coach as coach
        from game_rows
        where game_type = 'REG' and home_score is not null and away_score is not null and away_franchise_id is not null
      ),
      agg as (
        select
          franchise_id, season, mode(team_abbr) as team_abbr, mode(coach) as head_coach,
          sum(won::integer) as wins, sum(lost::integer) as losses, sum(tied::integer) as ties,
          sum(pf) as points_for, sum(pa) as points_against,
          sum((div_game and won)::integer) as div_wins,
          sum((div_game and lost)::integer) as div_losses,
          sum((div_game and tied)::integer) as div_ties
        from reg_games
        group by franchise_id, season
      ),
      postseason as (
        select season, game_type, home_franchise_id as franchise_id,
          case when home_score > away_score then 'won' else 'lost' end as outcome
        from game_rows
        where game_type in ('WC', 'DIV', 'CON', 'SB') and home_score is not null and away_score is not null and home_franchise_id is not null
        union all
        select season, game_type, away_franchise_id as franchise_id,
          case when away_score > home_score then 'won' else 'lost' end as outcome
        from game_rows
        where game_type in ('WC', 'DIV', 'CON', 'SB') and home_score is not null and away_score is not null and away_franchise_id is not null
      ),
      playoffs as (
        select franchise_id, season,
          case
            when bool_or(game_type = 'SB' and outcome = 'won') then 'won_sb'
            when bool_or(game_type = 'SB' and outcome = 'lost') then 'lost_sb'
            when bool_or(game_type = 'CON' and outcome = 'lost') then 'lost_con'
            when bool_or(game_type = 'DIV' and outcome = 'lost') then 'lost_div'
            when bool_or(game_type = 'WC' and outcome = 'lost') then 'lost_wc'
          end as playoff_result
        from postseason
        group by franchise_id, season
      ),
      with_division as (
        select a.*, d.division_id
        from agg a
        left join team_divisions d
          on d.franchise_id = a.franchise_id and a.season between d.start_season and coalesce(d.end_season, 9999)
      ),
      computed_rank as (
        select *,
          row_number() over (
            partition by division_id, season
            order by (wins + 0.5 * ties) / nullif(wins + losses + ties, 0) desc, (points_for - points_against) desc
          )::integer as computed_div_rank
        from with_division
      )
      select
        c.franchise_id, c.season, c.team_abbr, ta.name as team_name, c.division_id,
        c.wins::integer as wins, c.losses::integer as losses, c.ties::integer as ties,
        c.points_for::integer as points_for, c.points_against::integer as points_against,
        c.div_wins::integer as div_wins, c.div_losses::integer as div_losses, c.div_ties::integer as div_ties,
        coalesce(s.div_rank::integer, c.computed_div_rank) as div_rank,
        s.seed::integer as playoff_seed,
        p.playoff_result,
        c.head_coach
      from computed_rank c
      left join team_abbrs ta on ta.abbr = c.team_abbr and c.season between ta.start_season and ta.end_season
      left join standings s on s.team = c.team_abbr and s.season = c.season
      left join playoffs p on p.franchise_id = c.franchise_id and p.season = c.season
      where c.season in (${seasons.join(", ")})`);

    await upsertRows(ctx, "team_seasons", rows, "franchise_id,season");
    await pruneStale(ctx, "team_seasons", seasonScope(ctx, seasons));

    await recordSource(ctx, {
      id: "nfldata.standings",
      name: "nflverse/nfldata official standings (division rank, playoff seed)",
      url: "https://github.com/nflverse/nfldata",
      license: "CC-BY-4.0",
      coverage: "2002+; earlier seasons computed from record (win pct, then point differential)",
    });
  },
};
