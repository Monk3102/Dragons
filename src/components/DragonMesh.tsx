import React, { useRef, useState, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { DragonProblem } from '../types';
import { CreatureBody } from '../creatures/engine';
import { getRecipe } from '../creatures/registry';
import { DetailTier } from '../creatures/types';

const DISTANCE_ULTRA_THRESHOLD = 40;
const DISTANCE_HIGH_THRESHOLD = 90;
const HYSTERESIS_BUFFER = 4;
const CHECK_FRAME_INTERVAL = 15;
const MAX_ULTRA_NEAREST = 2;

// Shared distance tracker to determine top closest creatures to camera
const monsterDistances = new Map<string, number>();

let devFlagsInstance: { forcedTier: null | 'ultra' | 'high' | 'low'; benchmarkRunning: boolean; tierCounts: { ultra: number; high: number; low: number } } | null = null;
if (import.meta.env.DEV) {
  new Function("return import('../perf/devFlags')")().then((m: any) => {
    devFlagsInstance = m.devFlags;
  });
}

interface DragonMeshProps {
  dragon: DragonProblem & { leaving?: boolean };
  isSelected: boolean;
  onSelect: (id: string) => void;
  leaving?: boolean;
}

export const DragonMesh: React.FC<DragonMeshProps> = ({
  dragon,
  isSelected,
  onSelect,
  leaving,
}) => {
  const isLeaving = Boolean(leaving || (dragon as { leaving?: boolean }).leaving);
  const rootRef = useRef<THREE.Group>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [detailLevel, setDetailLevel] = useState<DetailTier>('high');
  const frameCountRef = useRef(0);
  const prevTierRef = useRef<DetailTier | null>(null);

  useEffect(() => {
    if (import.meta.env.DEV) {
      const prev = prevTierRef.current;
      const current = detailLevel;
      if (devFlagsInstance) {
        if (prev) devFlagsInstance.tierCounts[prev]--;
        devFlagsInstance.tierCounts[current]++;
      } else {
        new Function("return import('../perf/devFlags')")().then((m: any) => {
          const flags = m?.devFlags;
          devFlagsInstance = flags;
          if (flags) {
            if (prev) flags.tierCounts[prev]--;
            flags.tierCounts[current]++;
          }
        });
      }
      prevTierRef.current = current;
    }

    return () => {
      monsterDistances.delete(dragon.id);
      if (import.meta.env.DEV) {
        const lastTier = prevTierRef.current;
        if (lastTier && devFlagsInstance) {
          devFlagsInstance.tierCounts[lastTier]--;
        }
      }
    };
  }, [dragon.id, detailLevel]);

  const recipe = useMemo(
    () => getRecipe(dragon.creatureTypeId || 'archetype-dragon'),
    [dragon.creatureTypeId]
  );
  const ferocity = (dragon as any).dials?.ferocity ?? 5;

  // Animated refs for smooth damping transition over ~1s (lambda around 3)
  // If newly spawned (< 5s ago), start animated scale at 5% of target
  const isNewlySpawned = useMemo(() => {
    const createdStr = dragon.createdAt;
    if (!createdStr) return false;
    const time = Date.parse(createdStr);
    return !isNaN(time) && Date.now() - time < 5000;
  }, [dragon.id, dragon.createdAt]);

  const currentScale = useRef<number>(isNewlySpawned ? dragon.scale * 0.05 : dragon.scale);
  const currentPosX = useRef<number>(dragon.position[0]);
  const currentPosY = useRef<number>(dragon.position[1]);
  const currentPosZ = useRef<number>(dragon.position[2]);
  const currentBobSpeed = useRef<number>(dragon.bobbingSpeed);
  const currentBobAmp = useRef<number>(dragon.bobbingAmplitude);

  const baseGlow = (dragon as { coreGlowStrength?: number }).coreGlowStrength ?? 1.6;
  const currentGlowStrength = useRef<number>(baseGlow);
  const leavingStartTimeRef = useRef<number | null>(null);

  useFrame((state, delta) => {
    if (!rootRef.current) return;
    const t = state.clock.getElapsedTime();

    // Check camera distance every 15 frames with hysteresis
    frameCountRef.current++;
    if (frameCountRef.current % CHECK_FRAME_INTERVAL === 0) {
      if (import.meta.env.DEV && devFlagsInstance && devFlagsInstance.forcedTier !== null) {
        if (detailLevel !== devFlagsInstance.forcedTier) {
          setDetailLevel(devFlagsInstance.forcedTier);
        }
      } else {
        const dist = state.camera.position.distanceTo(rootRef.current.position);
        monsterDistances.set(dragon.id, dist);

        // Determine top 2 closest creatures
        const sortedEntries = Array.from(monsterDistances.entries()).sort((a, b) => a[1] - b[1]);
        const isTopTwo = sortedEntries.slice(0, MAX_ULTRA_NEAREST).some((entry) => entry[0] === dragon.id);

        if (isSelected) {
          if (detailLevel !== 'ultra') setDetailLevel('ultra');
        } else {
          if (detailLevel === 'ultra') {
            // Drop from ultra to high if neither selected nor qualifying within hysteresis
            if (!isTopTwo || dist > DISTANCE_ULTRA_THRESHOLD + HYSTERESIS_BUFFER) {
              setDetailLevel(dist > DISTANCE_HIGH_THRESHOLD + HYSTERESIS_BUFFER ? 'low' : 'high');
            }
          } else if (detailLevel === 'high') {
            if (isTopTwo && dist < DISTANCE_ULTRA_THRESHOLD - HYSTERESIS_BUFFER) {
              setDetailLevel('ultra');
            } else if (dist > DISTANCE_HIGH_THRESHOLD + HYSTERESIS_BUFFER) {
              setDetailLevel('low');
            }
          } else {
            // current detailLevel === 'low'
            if (isTopTwo && dist < DISTANCE_ULTRA_THRESHOLD - HYSTERESIS_BUFFER) {
              setDetailLevel('ultra');
            } else if (dist < DISTANCE_HIGH_THRESHOLD - HYSTERESIS_BUFFER) {
              setDetailLevel('high');
            }
          }
        }
      }
    }

    if (isLeaving) {
      if (leavingStartTimeRef.current === null) {
        leavingStartTimeRef.current = t;
      }
      const elapsed = t - leavingStartTimeRef.current;

      // First 0.4 seconds: raise glow to 3x base value, then damp scale to 0 and fade glow out
      const targetScale = elapsed < 0.4 ? dragon.scale : 0.0;
      const targetGlow = elapsed < 0.4 ? baseGlow * 3.0 : 0.0;

      const lambdaScale = elapsed < 0.4 ? 3.0 : 5.0;
      const lambdaGlow = elapsed < 0.4 ? 8.0 : 4.0;

      currentScale.current = THREE.MathUtils.damp(currentScale.current, targetScale, lambdaScale, delta);
      currentGlowStrength.current = THREE.MathUtils.damp(currentGlowStrength.current, targetGlow, lambdaGlow, delta);

      currentPosX.current = THREE.MathUtils.damp(currentPosX.current, dragon.position[0], 3.0, delta);
      currentPosY.current = THREE.MathUtils.damp(currentPosY.current, dragon.position[1], 3.0, delta);
      currentPosZ.current = THREE.MathUtils.damp(currentPosZ.current, dragon.position[2], 3.0, delta);
      currentBobSpeed.current = THREE.MathUtils.damp(currentBobSpeed.current, dragon.bobbingSpeed, 3.0, delta);
      currentBobAmp.current = THREE.MathUtils.damp(currentBobAmp.current, dragon.bobbingAmplitude, 3.0, delta);
    } else {
      // Damping toward target values (lambda around 3 for ~1s transition)
      const lambda = 3.0;
      currentScale.current = THREE.MathUtils.damp(currentScale.current, dragon.scale, lambda, delta);
      currentPosX.current = THREE.MathUtils.damp(currentPosX.current, dragon.position[0], lambda, delta);
      currentPosY.current = THREE.MathUtils.damp(currentPosY.current, dragon.position[1], lambda, delta);
      currentPosZ.current = THREE.MathUtils.damp(currentPosZ.current, dragon.position[2], lambda, delta);
      currentBobSpeed.current = THREE.MathUtils.damp(currentBobSpeed.current, dragon.bobbingSpeed, lambda, delta);
      currentBobAmp.current = THREE.MathUtils.damp(currentBobAmp.current, dragon.bobbingAmplitude, lambda, delta);

      const glowMultiplier = isSelected ? 2.2 : isHovered ? 1.6 : 1.0;
      const targetGlow = baseGlow * glowMultiplier;
      currentGlowStrength.current = THREE.MathUtils.damp(currentGlowStrength.current, targetGlow, lambda, delta);
    }

    // Apply animated scale
    rootRef.current.scale.setScalar(currentScale.current);

    // Floating bobbing and subtle sway
    const bob = Math.sin(t * currentBobSpeed.current) * currentBobAmp.current;
    const sway = Math.cos(t * currentBobSpeed.current * 0.7) * 0.08;

    rootRef.current.position.set(
      currentPosX.current + Math.sin(t * 0.3) * 0.4,
      currentPosY.current + bob,
      currentPosZ.current
    );
    rootRef.current.rotation.set(
      dragon.rotation[0],
      dragon.rotation[1] + Math.sin(t * 0.2) * 0.05,
      dragon.rotation[2] + sway
    );

    // Dynamic point light updates
    if (pointLightRef.current) {
      pointLightRef.current.intensity = currentGlowStrength.current * 2.2;
      pointLightRef.current.distance = currentScale.current * 6.5;
    }
  });

  return (
    <group
      ref={rootRef}
      position={dragon.position}
      rotation={dragon.rotation}
      scale={dragon.scale}
      onClick={(e) => {
        if (isLeaving) return;
        e.stopPropagation();
        onSelect(dragon.id);
      }}
      onPointerOver={(e) => {
        if (isLeaving) return;
        e.stopPropagation();
        setIsHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        if (isLeaving) return;
        setIsHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Selection / Aura Ring (subtle, non-gamey, architectural halo) */}
      {(isSelected || isHovered) && !isLeaving && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}>
          <ringGeometry args={[dragon.wingspan * 0.65, dragon.wingspan * 0.68, 64]} />
          <meshBasicMaterial
            color={dragon.accentColor}
            transparent
            opacity={isSelected ? 0.6 : 0.3}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* Point light emitted from dragon's core to illuminate its own ribs and nearby fog */}
      <pointLight
        ref={pointLightRef}
        color={dragon.coreGlow}
        intensity={baseGlow * (isSelected ? 2.2 : isHovered ? 1.6 : 1.0) * 2.2}
        distance={dragon.scale * 6.5}
        decay={2}
      />

      {/* Dynamic Creature Body driven by Recipe Engine */}
      <CreatureBody
        recipe={recipe}
        baseColor={dragon.color}
        accentColor={dragon.accentColor}
        glowColor={dragon.coreGlow}
        glowStrength={currentGlowStrength.current}
        ferocity={ferocity}
        detailLevel={detailLevel}
        bobbingSpeed={currentBobSpeed.current}
      />
    </group>
  );
};
