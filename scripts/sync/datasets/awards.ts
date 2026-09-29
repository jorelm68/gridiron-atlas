import { pruneStale, recordSource, upsertRows } from "../lib/db";
import { lit } from "../lib/duck";
import { seedPath } from "../lib/seeds";
import type { Dataset } from "../lib/types";

/**
 * Curated league awards (MVP, OPOY, DPOY, OROY, DROY, CPOY, COY, WPMOY), linked to `players` where possible.
 *
 * A recipient matches the roster_ids player of that season whose normalized name equals the seed's; when several
 * distinct players share the name, the one on the seed's team wins, then the one in the seed's position group.
 * Recipients known by another name ("Sauce" Gardner, "Cadillac" Williams) fall back to a unique last-name match on
 * the seed's team, season, and position group. Coaches, co-winner rows, ties, and no match leave player_id null.
 */
export const awards: Dataset = {
  id: "awards",
  description: "League awards (MVP, OPOY, DPOY, rookies, comeback, coach, Man of the Year) since 1957",
  dependsOn: ["players"],
  async run(ctx) {
    const { duck } = ctx;
    await duck.exec(`
      create or replace table award_seed as
      select season::integer as season, award, recipient, position, team
      from read_json(${lit(seedPath("awards.json"))}, format = 'array')`);

    const rows = await duck.all(`
      with candidates as (
        select s.season, s.award, s.recipient, r.player_id,
          bool_or(r.franchise_id = s.team) as same_team,
          bool_or(pos_group(r.position) = pos_group(s.position)) as same_position
        from award_seed s
        join roster_ids r on r.season = s.season and norm_name(r.full_name) = norm_name(s.recipient)
        where s.award <> 'COY'
        group by all
      ),
      ranked as (
        select *,
          rank() over (partition by season, award, recipient order by same_team desc, same_position desc) as rnk
        from candidates
      ),
      exact as (
        select season, award, recipient, min(player_id) as player_id
        from ranked where rnk = 1
        group by season, award, recipient
        having count(*) = 1
      ),
      by_last_name as (
        select s.season, s.award, s.recipient, min(r.player_id) as player_id
        from award_seed s
        join roster_ids r on r.season = s.season and r.franchise_id = s.team
          and pos_group(r.position) = pos_group(s.position)
          and norm_name(r.last_name) <> '' and norm_name(s.recipient) like '%' || norm_name(r.last_name)
        where s.award <> 'COY' and (s.season, s.award, s.recipient) not in (select season, award, recipient from exact)
        group by s.season, s.award, s.recipient
        having count(distinct r.player_id) = 1
      )
      select s.season, s.award, s.recipient as recipient_name, coalesce(e.player_id, l.player_id) as player_id,
        s.team as franchise_id, s.position
      from award_seed s
      left join exact e using (season, award, recipient)
      left join by_last_name l using (season, award, recipient)
      order by s.season, s.award, s.recipient`);

    const players = rows.filter((r) => r.award !== "COY");
    const unmatched = players.filter((r) => r.player_id == null);
    ctx.log(
      `  awards: linked ${players.length - unmatched.length}/${players.length} player awards` +
        (unmatched.length ? `; unmatched: ${unmatched.map((r) => `${r.season} ${r.award} ${r.recipient_name}`).join(" | ")}` : ""),
    );

    await upsertRows(ctx, "awards", rows, "season,award,recipient_name");
    await pruneStale(ctx, "awards");

    await recordSource(ctx, {
      id: "curated.awards",
      name: "Curated league awards",
      url: "https://github.com/jorelm68/gridiron-atlas/tree/main/data/seed",
      coverage: `${rows.length} awards, 1957–${ctx.currentSeason}`,
    });
  },
};
