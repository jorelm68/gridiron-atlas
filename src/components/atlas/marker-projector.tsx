"use client";

import { useMemo, type RefObject } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { BEAM_HEIGHT } from "@/components/atlas/team-marker";
import type { MarkerElements } from "@/components/atlas/marker-overlay";
import type { AtlasMarker } from "@/lib/atlas/markers";

/** Where the logo button sits: just above the beam tip. */
const LABEL_HEIGHT = BEAM_HEIGHT + 0.9;
/** Labels closer to the top than this flip their tooltip underneath so it isn't hidden by the toolbar. */
const TOOLTIP_FLIP_Y = 120;
/** Screen pixels a shared-stadium label is pushed sideways (see AtlasMarker.labelShift). */
const SHARED_LABEL_SHIFT_PX = 19;

/**
 * Runs inside the Canvas each frame: projects every marker's label anchor to screen space and writes it onto the
 * matching DOM wrapper (see marker-overlay.tsx). Nearer markers get a higher z-index so overlapping logos in the
 * crowded Northeast stack the way you'd expect; a hovered/selected label always lifts to the top.
 */
export function MarkerProjector({
  markers,
  elements,
  hoveredId,
  selectedId,
}: {
  markers: AtlasMarker[];
  elements: RefObject<MarkerElements>;
  hoveredId: string | null;
  selectedId: string | null;
}) {
  const anchor = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ camera, size }) => {
    for (const marker of markers) {
      const el = elements.current.get(marker.team.id);
      if (!el) continue;

      anchor.set(marker.position[0], LABEL_HEIGHT, marker.position[1]);
      const distance = camera.position.distanceTo(anchor);
      anchor.project(camera);

      const inFront = anchor.z > -1 && anchor.z < 1;
      const x = (anchor.x * 0.5 + 0.5) * size.width + marker.labelShift * SHARED_LABEL_SHIFT_PX;
      const y = (-anchor.y * 0.5 + 0.5) * size.height;
      const lifted = marker.team.id === hoveredId || marker.team.id === selectedId;

      el.style.visibility = inFront ? "visible" : "hidden";
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      el.style.zIndex = String(Math.max(1, Math.round(2000 - distance * 12)) + (lifted ? 5000 : 0));
      el.dataset.flip = y < TOOLTIP_FLIP_Y ? "true" : "false";
    }
  });

  return null;
}
