"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { feature, mesh } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import type { Feature, MultiLineString, MultiPolygon, Polygon } from "geojson";
import topology from "us-atlas/states-albers-10m.json";
import { projectedToWorld } from "@/lib/atlas/constants";

/** Thickness of the extruded state slab, in world units. The map surface sits at y = 0, slab hangs below it. */
export const STATE_SLAB_HEIGHT = 1.4;
/** Border lines sit just above the top face to avoid z-fighting with the surface material. */
const BORDER_Y = 0.03;

function ringToPoints(ring: number[][]): THREE.Vector2[] {
  // Shape-space y is negated so that, after the -90° X rotation below, world Z matches projectedToWorld's z.
  return ring.map(([x, y]) => {
    const [wx, wz] = projectedToWorld(x, y);
    return new THREE.Vector2(wx, -wz);
  });
}

function polygonToShape([outer, ...holes]: number[][][]): THREE.Shape {
  const shape = new THREE.Shape(ringToPoints(outer));
  for (const hole of holes) shape.holes.push(new THREE.Path(ringToPoints(hole)));
  return shape;
}

function buildStateShapes(topo: Topology): THREE.Shape[] {
  const collection = feature(topo, topo.objects.states as GeometryCollection) as unknown as {
    features: Feature<Polygon | MultiPolygon>[];
  };
  const shapes: THREE.Shape[] = [];
  for (const f of collection.features) {
    const polygons = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const polygon of polygons) shapes.push(polygonToShape(polygon));
  }
  return shapes;
}

/**
 * Flat border lines traced directly from the topology's deduplicated arcs (via topojson's `mesh`), at a fixed
 * height just above the map surface. Building these from the extruded solid's `EdgesGeometry` instead (the
 * naive approach) also picks up every vertical side-wall seam along the coastline — with `states-albers-10m`'s
 * vertex-dense coastlines that renders as a dense comb of spikes hanging off the coast, so we avoid it entirely.
 */
function buildBorderGeometry(topo: Topology): THREE.BufferGeometry {
  const lines = mesh(topo, topo.objects.states as GeometryCollection) as unknown as MultiLineString;
  const positions: number[] = [];
  for (const line of lines.coordinates) {
    for (let i = 0; i < line.length - 1; i++) {
      const [ax, az] = projectedToWorld(line[i][0], line[i][1]);
      const [bx, bz] = projectedToWorld(line[i + 1][0], line[i + 1][1]);
      positions.push(ax, BORDER_Y, az, bx, BORDER_Y, bz);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(positions), 3));
  return geometry;
}

/** The extruded, flat-lying US states mesh plus a thin border overlay. Colors are theme-driven hex strings. */
export function UsMapMesh({
  surfaceColor,
  wallColor,
  borderColor,
}: {
  surfaceColor: string;
  wallColor: string;
  borderColor: string;
}) {
  const { solid, borders } = useMemo(() => {
    const topo = topology as unknown as Topology;
    const shapes = buildStateShapes(topo);
    const solidGeo = new THREE.ExtrudeGeometry(shapes, {
      depth: STATE_SLAB_HEIGHT,
      bevelEnabled: false,
      curveSegments: 1,
    });
    // Extrude runs shape-plane -> +Z; rotate flat so the top face (z = depth) becomes y = 0, slab hangs below.
    solidGeo.rotateX(-Math.PI / 2);
    solidGeo.translate(0, -STATE_SLAB_HEIGHT, 0);
    solidGeo.computeVertexNormals();

    return { solid: solidGeo, borders: buildBorderGeometry(topo) };
  }, []);

  // ExtrudeGeometry writes two material groups — 0: top/bottom caps, 1: the coastline-following side walls.
  // The walls get their own shade (near-background in dark mode, a soft mid-tone in light) so the very jagged
  // real-coastline edge recedes instead of reading as a bright comb fringe.
  const materials = useMemo(
    () => [
      new THREE.MeshStandardMaterial({ color: surfaceColor, roughness: 0.9, metalness: 0.05 }),
      new THREE.MeshStandardMaterial({ color: wallColor, roughness: 1 }),
    ],
    [surfaceColor, wallColor],
  );

  return (
    <group>
      <mesh geometry={solid} material={materials} receiveShadow />
      <lineSegments geometry={borders}>
        <lineBasicMaterial color={borderColor} transparent opacity={0.85} />
      </lineSegments>
    </group>
  );
}
