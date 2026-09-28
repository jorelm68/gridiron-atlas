"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { Delaunay } from "d3-delaunay";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import type { Feature, MultiPolygon, Polygon } from "geojson";
import topology from "us-atlas/states-albers-10m.json";
import { MAP_HEIGHT, MAP_WIDTH, MAP_SCALE, projectedToWorld } from "@/lib/atlas/constants";

export interface RegionLayerPoint {
  id: string;
  /** Projected pixel position (states-albers-10m.json space), not yet scaled to world units. */
  x: number;
  y: number;
  color: string;
  /** Radius of the 75-mile home-territory circle, in the same projected pixel units. */
  homeTerritoryRadius: number | null;
}

const CANVAS_RESOLUTION = 2;

/** FIPS ids of the states drawn as projected insets (Alaska, Hawaii) — not at their real position, so no Voronoi. */
const INSET_STATE_IDS = new Set(["02", "15"]);

/**
 * Traces the contiguous-US outline into a canvas clip path (in canvas pixel space: projected units × resolution).
 * Built from the state shapes minus the Alaska/Hawaii insets: those sit in the Gulf/Pacific in this projection,
 * so shading them by "nearest stadium" would be nonsense.
 */
function clipToContiguousStates(ctx: CanvasRenderingContext2D) {
  const topo = topology as unknown as Topology;
  const states = feature(topo, topo.objects.states as GeometryCollection) as unknown as {
    features: (Feature<Polygon | MultiPolygon> & { id?: string | number })[];
  };
  ctx.beginPath();
  for (const f of states.features) {
    if (INSET_STATE_IDS.has(String(f.id))) continue;
    const polygons = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const polygon of polygons) {
      for (const ring of polygon) {
        ring.forEach(([x, y], i) => {
          const cx = x * CANVAS_RESOLUTION;
          const cy = y * CANVAS_RESOLUTION;
          if (i === 0) ctx.moveTo(cx, cy);
          else ctx.lineTo(cx, cy);
        });
        ctx.closePath();
      }
    }
  }
  ctx.clip();
}

/** Builds the "nearest stadium" Voronoi diagram as a canvas texture, clipped to the contiguous US. */
function buildVoronoiTexture(points: RegionLayerPoint[]): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = MAP_WIDTH * CANVAS_RESOLUTION;
  canvas.height = MAP_HEIGHT * CANVAS_RESOLUTION;
  const ctx = canvas.getContext("2d")!;

  ctx.save();
  clipToContiguousStates(ctx);

  const delaunay = Delaunay.from(
    points,
    (p) => p.x * CANVAS_RESOLUTION,
    (p) => p.y * CANVAS_RESOLUTION,
  );
  const voronoi = delaunay.voronoi([0, 0, canvas.width, canvas.height]);
  points.forEach((point, i) => {
    const cell = voronoi.cellPolygon(i);
    if (!cell) return;
    ctx.beginPath();
    cell.forEach(([x, y], j) => (j === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.closePath();
    ctx.fillStyle = point.color;
    ctx.globalAlpha = 0.22;
    ctx.fill();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = point.color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

const MAP_PLANE_WIDTH = MAP_WIDTH * MAP_SCALE;
const MAP_PLANE_HEIGHT = MAP_HEIGHT * MAP_SCALE;

/** The toggleable "home territory" (75-mile discs) and "nearest stadium" (Voronoi) map overlays. */
export function RegionLayers({
  points,
  showHomeTerritory,
  showVoronoi,
}: {
  points: RegionLayerPoint[];
  showHomeTerritory: boolean;
  showVoronoi: boolean;
}) {
  const voronoiTexture = useMemo(() => (showVoronoi ? buildVoronoiTexture(points) : null), [points, showVoronoi]);
  const discGeometry = useMemo(() => new THREE.CircleGeometry(1, 48), []);

  useEffect(() => () => voronoiTexture?.dispose(), [voronoiTexture]);

  return (
    <group>
      {showHomeTerritory &&
        points.map((point) => {
          if (point.homeTerritoryRadius == null) return null;
          const [x, z] = projectedToWorld(point.x, point.y);
          const radius = point.homeTerritoryRadius * MAP_SCALE;
          return (
            <mesh
              key={point.id}
              geometry={discGeometry}
              position={[x, 0.05, z]}
              rotation={[-Math.PI / 2, 0, 0]}
              scale={[radius, radius, 1]}
            >
              <meshBasicMaterial color={point.color} transparent opacity={0.16} side={THREE.DoubleSide} />
            </mesh>
          );
        })}
      {voronoiTexture && (
        <mesh position={[0, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[MAP_PLANE_WIDTH, MAP_PLANE_HEIGHT]} />
          <meshBasicMaterial map={voronoiTexture} transparent side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}
