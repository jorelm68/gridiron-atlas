import type { Dataset } from "../lib/types";
import { awards } from "./awards";
import { coaches } from "./coaches";
import { contracts } from "./contracts";
import { depthCharts } from "./depth-charts";
import { draft } from "./draft";
import { gameFlow } from "./game-flow";
import { games } from "./games";
import { injuries } from "./injuries";
import { players } from "./players";
import { reference } from "./reference";
import { rosters } from "./rosters";
import { snaps } from "./snaps";
import { stats } from "./stats";
import { superBowls } from "./super-bowls";
import { teamSeasons } from "./team-seasons";
import { trades } from "./trades";
import { venues } from "./venues";

/** Every dataset, in dependency order (a dataset only depends on ones listed before it). */
export const DATASETS: Dataset[] = [
  reference, venues, players, games, gameFlow, rosters, stats, teamSeasons, draft, superBowls,
  awards, depthCharts, injuries, snaps, contracts, trades, coaches,
];
