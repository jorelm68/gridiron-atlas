import type { LeagueDiagram } from "@/content/league";
import { DepthChartDiagram } from "./depth-chart";
import { OrgChartDiagram } from "./org-chart";
import { PlayoffBracketDiagram } from "./playoff-bracket";
import { SeasonTimelineDiagram } from "./season-timeline";

const DIAGRAMS: Record<LeagueDiagram, React.ComponentType> = {
  "org-chart": OrgChartDiagram,
  "playoff-bracket": PlayoffBracketDiagram,
  "season-timeline": SeasonTimelineDiagram,
  "depth-chart": DepthChartDiagram,
};

export function LeagueTopicDiagram({ diagram }: { diagram: LeagueDiagram }) {
  const Diagram = DIAGRAMS[diagram];
  return <Diagram />;
}
