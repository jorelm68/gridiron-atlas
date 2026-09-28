import type { Dataset } from "../lib/types";
import { draft } from "./draft";
import { games } from "./games";
import { players } from "./players";
import { reference } from "./reference";
import { rosters } from "./rosters";
import { stats } from "./stats";
import { superBowls } from "./super-bowls";
import { teamSeasons } from "./team-seasons";
import { venues } from "./venues";

/** Every dataset, in dependency order (a dataset only depends on ones listed before it). */
export const DATASETS: Dataset[] = [reference, venues, players, games, rosters, stats, teamSeasons, draft, superBowls];
