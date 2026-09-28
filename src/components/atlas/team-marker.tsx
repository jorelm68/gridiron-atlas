"use client";

import * as THREE from "three";

export const BEAM_HEIGHT = 7;

/**
 * The 3D half of a team marker: a beam in the team's color rising from a ring on the map. The logo button that
 * tops it is plain DOM (see marker-overlay.tsx) so it can layer correctly with the toolbar and side panel; the
 * beam itself is also hoverable/clickable so the whole thing reads as one target.
 */
export function TeamBeam({
  position,
  color,
  emphasized,
  dimmed,
  additiveGlow,
  onHoverChange,
  onSelect,
}: {
  /** [x, z] world units — the marker's ground position; y = 0 is the map surface. */
  position: [number, number];
  color: string;
  emphasized: boolean;
  dimmed: boolean;
  /** Additive glow reads as light on a dark map; on a pale map it just washes out, so use normal blending there. */
  additiveGlow: boolean;
  onHoverChange: (hovered: boolean) => void;
  onSelect: () => void;
}) {
  const [x, z] = position;
  const opacity = dimmed ? 0.2 : 1;

  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, BEAM_HEIGHT / 2, 0]} scale={emphasized ? [1.8, 1, 1.8] : [1, 1, 1]}>
        <cylinderGeometry args={[0.12, 0.12, BEAM_HEIGHT, 8]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} />
      </mesh>
      <mesh position={[0, BEAM_HEIGHT / 2, 0]}>
        <cylinderGeometry args={[0.42, 0.42, BEAM_HEIGHT, 8]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={(emphasized ? 0.4 : 0.16) * (additiveGlow ? 1 : 1.25) * opacity}
          blending={additiveGlow ? THREE.AdditiveBlending : THREE.NormalBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.68, 28]} />
        <meshBasicMaterial color={color} transparent opacity={0.55 * opacity} side={THREE.DoubleSide} />
      </mesh>
      {/* Wider invisible hit target so the thin beam is easy to hover. */}
      <mesh
        position={[0, BEAM_HEIGHT / 2, 0]}
        onPointerOver={(event) => {
          event.stopPropagation();
          onHoverChange(true);
        }}
        onPointerOut={() => onHoverChange(false)}
        onClick={(event) => {
          event.stopPropagation();
          onSelect();
        }}
      >
        <cylinderGeometry args={[0.7, 0.7, BEAM_HEIGHT, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
