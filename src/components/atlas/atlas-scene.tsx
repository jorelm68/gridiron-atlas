"use client";

import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Grid, OrbitControls } from "@react-three/drei";
import { UsMapMesh, STATE_SLAB_HEIGHT } from "@/components/atlas/us-map-mesh";
import { RegionLayers } from "@/components/atlas/region-layers";
import { BEAM_HEIGHT, TeamBeam } from "@/components/atlas/team-marker";
import { MarkerProjector } from "@/components/atlas/marker-projector";
import type { MarkerElements } from "@/components/atlas/marker-overlay";
import { useMapTheme } from "@/lib/atlas/colors";
import { usePrefersReducedMotion } from "@/lib/use-media-query";
import { MAP_HEIGHT, MAP_WIDTH, MAP_SCALE } from "@/lib/atlas/constants";
import type { AtlasMarker } from "@/lib/atlas/markers";

type Controls = React.ComponentRef<typeof OrbitControls>;

const FOV = 32;
/** Unit vector from the look-at point out to the resting camera: ~45° elevation, tiny yaw for a touch of depth. */
const REST_DIRECTION = new THREE.Vector3(0.05, 0.72, 0.7).normalize();
/** The intro sweeps down from a steeper, more top-down angle. */
const INTRO_DIRECTION = new THREE.Vector3(0.1, 0.94, 0.32).normalize();
/** Nudged north of centre so the map sits a little lower in the frame, clear of the toolbar. */
const REST_TARGET = new THREE.Vector3(0, 0, -2.2);
const FOCUS_DISTANCE = 36;
const CAMERA_LAMBDA = 4.5;

const HALF_W = (MAP_WIDTH * MAP_SCALE) / 2;
const HALF_H = (MAP_HEIGHT * MAP_SCALE) / 2;
/** Points the resting camera must keep in frame: the map's footprint at slab depth and at beam-top height. */
const FIT_POINTS = [-1, 1].flatMap((sx) =>
  [-1, 1].flatMap((sz) =>
    [-STATE_SLAB_HEIGHT, BEAM_HEIGHT + 2].map((y) => new THREE.Vector3(sx * HALF_W * 0.97, y, sz * HALF_H * 0.94)),
  ),
);

/** Smallest camera distance (along REST_DIRECTION) at which the whole map fits a frame of this aspect ratio. */
function fitRestDistance(aspect: number): number {
  const probe = new THREE.PerspectiveCamera(FOV, aspect, 1, 400);
  const point = new THREE.Vector3();
  const fits = (distance: number) => {
    probe.position.copy(REST_TARGET).addScaledVector(REST_DIRECTION, distance);
    probe.lookAt(REST_TARGET);
    probe.updateMatrixWorld();
    return FIT_POINTS.every((p) => {
      point.copy(p).project(probe);
      return Math.abs(point.x) <= 0.96 && Math.abs(point.y) <= 0.9;
    });
  };
  let [near, far] = [20, 400];
  for (let i = 0; i < 24; i++) {
    const mid = (near + far) / 2;
    if (fits(mid)) far = mid;
    else near = mid;
  }
  return far;
}

/** Pixels of the frame covered by UI (the side panel on the right, or the bottom sheet), in CSS pixels. */
export interface CameraInset {
  right: number;
  bottom: number;
}

/**
 * Owns the camera pose. Three moves, all critically-damped: a one-time intro sweep, easing to a selected team
 * (offset so the marker lands in the part of the frame the side panel leaves visible), and easing back to the
 * fitted overview. Easing only runs while a move is pending — the moment the user grabs the controls (or the
 * transition settles) it stops, so it never fights manual orbiting. Reduced motion snaps instead of easing.
 */
function CameraRig({
  focus,
  inset,
  reducedMotion,
  controlsRef,
  animatingRef,
}: {
  focus: { x: number; z: number } | null;
  inset: CameraInset;
  reducedMotion: boolean;
  controlsRef: RefObject<Controls | null>;
  animatingRef: RefObject<boolean>;
}) {
  const { camera, size, invalidate } = useThree();
  const desired = useRef({ position: new THREE.Vector3(), target: new THREE.Vector3() });
  const dirty = useRef(true);
  const introPending = useRef(true);
  const scratch = useRef({
    direction: new THREE.Vector3(),
    forward: new THREE.Vector3(),
    right: new THREE.Vector3(),
    back: new THREE.Vector3(),
  });

  const focusX = focus?.x ?? null;
  const focusZ = focus?.z ?? null;
  useEffect(() => {
    dirty.current = true;
    invalidate();
  }, [focusX, focusZ, inset.right, inset.bottom, size.width, size.height, reducedMotion, invalidate]);

  useFrame((state, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const persp = state.camera as THREE.PerspectiveCamera;

    if (dirty.current) {
      dirty.current = false;
      const aspect = size.width / Math.max(1, size.height);
      const restDistance = fitRestDistance(aspect);
      controls.maxDistance = restDistance * 1.35;
      controls.minDistance = 18;
      // Fog is tied to the fitted distance so a narrow (phone) frame, which pulls the camera back, isn't washed out.
      if (state.scene.fog instanceof THREE.Fog) {
        state.scene.fog.near = restDistance * 1.2;
        state.scene.fog.far = restDistance * 2.6;
      }

      const { position, target } = desired.current;
      if (focusX != null && focusZ != null) {
        // Keep the current viewing direction so selecting a team never spins the map out from under you.
        const { direction, forward, right, back } = scratch.current;
        direction.copy(camera.position).sub(controls.target).normalize();
        forward.copy(direction).negate();
        right.crossVectors(forward, camera.up).normalize();
        back.set(direction.x, 0, direction.z).normalize();
        const visibleWidth = 2 * FOCUS_DISTANCE * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * aspect;
        const visibleHeight = visibleWidth / aspect;
        target.set(focusX, 3.2, focusZ);
        // Look slightly past the marker so it lands in the middle of the part of the frame the panel leaves clear.
        const rightFraction = Math.min(0.6, inset.right / size.width);
        const bottomFraction = Math.min(0.6, inset.bottom / size.height);
        target.addScaledVector(right, rightFraction * 0.5 * visibleWidth);
        target.addScaledVector(back, bottomFraction * 0.5 * visibleHeight * 1.3);
        position.copy(target).addScaledVector(direction, FOCUS_DISTANCE);
      } else {
        target.copy(REST_TARGET);
        position.copy(target).addScaledVector(REST_DIRECTION, restDistance);
      }

      if (introPending.current) {
        introPending.current = false;
        if (!reducedMotion) {
          persp.position.copy(REST_TARGET).addScaledVector(INTRO_DIRECTION, restDistance * 1.35);
          controls.target.copy(REST_TARGET);
          controls.update();
        }
      }

      if (reducedMotion) {
        persp.position.copy(position);
        controls.target.copy(target);
        controls.update();
        animatingRef.current = false;
      } else {
        animatingRef.current = true;
      }
      state.invalidate();
    }

    if (!animatingRef.current) return;

    const { position, target } = desired.current;
    persp.position.x = THREE.MathUtils.damp(persp.position.x, position.x, CAMERA_LAMBDA, delta);
    persp.position.y = THREE.MathUtils.damp(persp.position.y, position.y, CAMERA_LAMBDA, delta);
    persp.position.z = THREE.MathUtils.damp(persp.position.z, position.z, CAMERA_LAMBDA, delta);
    controls.target.x = THREE.MathUtils.damp(controls.target.x, target.x, CAMERA_LAMBDA, delta);
    controls.target.y = THREE.MathUtils.damp(controls.target.y, target.y, CAMERA_LAMBDA, delta);
    controls.target.z = THREE.MathUtils.damp(controls.target.z, target.z, CAMERA_LAMBDA, delta);
    controls.update();

    if (persp.position.distanceToSquared(position) < 0.004 && controls.target.distanceToSquared(target) < 0.004) {
      persp.position.copy(position);
      controls.target.copy(target);
      controls.update();
      animatingRef.current = false;
    }
    state.invalidate();
  });

  return null;
}

export interface AtlasSceneProps {
  markers: AtlasMarker[];
  markerElements: RefObject<MarkerElements>;
  showHomeTerritory: boolean;
  showVoronoi: boolean;
  selectedTeamId: string | null;
  hoveredTeamId: string | null;
  inset: CameraInset;
  onHoverTeam: (id: string | null) => void;
  onSelectTeam: (id: string) => void;
}

/** The Atlas's Three.js scene contents — loaded client-only via next/dynamic (see atlas-experience.tsx). */
export default function AtlasScene({
  markers,
  markerElements,
  showHomeTerritory,
  showVoronoi,
  selectedTeamId,
  hoveredTeamId,
  inset,
  onHoverTeam,
  onSelectTeam,
}: AtlasSceneProps) {
  const theme = useMapTheme();
  const reducedMotion = usePrefersReducedMotion();
  const controlsRef = useRef<Controls | null>(null);
  const animatingRef = useRef(true);

  const selected = selectedTeamId ? markers.find((m) => m.team.id === selectedTeamId) : undefined;
  const focus = selected ? { x: selected.position[0], z: selected.position[1] } : null;

  // Projected-pixel positions (not world units) — the region layers work in the map texture's coordinate space.
  const regionPoints = useMemo(
    () =>
      markers.map(({ team, color }) => {
        const venue = team.venue!;
        return {
          id: team.id,
          x: venue.x + team.markerOffset[0],
          y: venue.y + team.markerOffset[1],
          color,
          homeTerritoryRadius: venue.homeTerritoryRadius,
        };
      }),
    [markers],
  );

  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 2]}
      camera={{ position: [2, 46, 50], fov: FOV, near: 1, far: 400 }}
      gl={{ antialias: true }}
      aria-hidden="true"
    >
      <color attach="background" args={[theme.background]} />
      <fog attach="fog" args={[theme.background, 80, 170]} />
      <ambientLight intensity={theme.isDark ? 0.7 : 0.95} />
      <hemisphereLight args={[theme.background, theme.land, 0.5]} />
      <directionalLight position={[32, 55, 22]} intensity={theme.isDark ? 1.15 : 0.9} color="#ffffff" />

      <UsMapMesh surfaceColor={theme.land} wallColor={theme.landWall} borderColor={theme.landBorder} />
      <Grid
        position={[0, -STATE_SLAB_HEIGHT - 0.12, 0]}
        args={[MAP_WIDTH * MAP_SCALE * 1.7, MAP_HEIGHT * MAP_SCALE * 1.7]}
        cellSize={4}
        cellThickness={0.5}
        cellColor={theme.border}
        sectionSize={16}
        sectionThickness={0.9}
        sectionColor={theme.border}
        fadeDistance={220}
        fadeStrength={1.4}
        side={THREE.DoubleSide}
      />

      <RegionLayers points={regionPoints} showHomeTerritory={showHomeTerritory} showVoronoi={showVoronoi} />

      {markers.map(({ team, position, color, dimmed }) => (
        <TeamBeam
          key={team.id}
          position={position}
          color={color}
          emphasized={hoveredTeamId === team.id || selectedTeamId === team.id}
          dimmed={dimmed && hoveredTeamId !== team.id && selectedTeamId !== team.id}
          additiveGlow={theme.isDark}
          onHoverChange={(hovered) => onHoverTeam(hovered ? team.id : null)}
          onSelect={() => onSelectTeam(team.id)}
        />
      ))}

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        enablePan={false}
        minDistance={18}
        maxDistance={120}
        minPolarAngle={THREE.MathUtils.degToRad(15)}
        maxPolarAngle={THREE.MathUtils.degToRad(62)}
        onStart={() => {
          animatingRef.current = false;
        }}
      />
      <CameraRig focus={focus} inset={inset} reducedMotion={reducedMotion} controlsRef={controlsRef} animatingRef={animatingRef} />
      {/* After the rig: same-priority frame callbacks run in mount order, and labels must read the final camera pose. */}
      <MarkerProjector markers={markers} elements={markerElements} hoveredId={hoveredTeamId} selectedId={selectedTeamId} />
    </Canvas>
  );
}
