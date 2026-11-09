import React, { useRef, useState, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { DragonProblem } from '../types';

interface DragonMeshProps {
  dragon: DragonProblem;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export const DragonMesh: React.FC<DragonMeshProps> = ({
  dragon,
  isSelected,
  onSelect,
}) => {
  const rootRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Group>(null);
  const rightWingRef = useRef<THREE.Group>(null);
  const tailGroupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Animated refs for smooth damping transition over ~1s (lambda around 3)
  // If newly spawned (< 5s ago), start animated scale at 5% of target
  const isNewlySpawned = useMemo(() => {
    const createdStr = (dragon as any).createdAt;
    if (!createdStr) return false;
    const time = Date.parse(createdStr);
    return !isNaN(time) && Date.now() - time < 5000;
  }, [dragon.id, (dragon as any).createdAt]);

  const currentScale = useRef<number>(isNewlySpawned ? dragon.scale * 0.05 : dragon.scale);
  const currentPosX = useRef<number>(dragon.position[0]);
  const currentPosY = useRef<number>(dragon.position[1]);
  const currentPosZ = useRef<number>(dragon.position[2]);
  const currentBobSpeed = useRef<number>(dragon.bobbingSpeed);
  const currentBobAmp = useRef<number>(dragon.bobbingAmplitude);

  const baseGlow = (dragon as any).coreGlowStrength ?? 1.6;
  const currentGlowStrength = useRef<number>(baseGlow);

  // Reusable materials memoized by monster ID so dial changes do not recreate them
  const bodyMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: dragon.color,
        roughness: dragon.roughness,
        metalness: dragon.metalness,
        flatShading: true,
      }),
    [dragon.id]
  );

  const accentMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: dragon.accentColor,
        roughness: Math.max(0.2, dragon.roughness - 0.2),
        metalness: Math.min(0.9, dragon.metalness + 0.2),
        flatShading: true,
      }),
    [dragon.id]
  );

  const coreMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: dragon.coreGlow,
        emissive: dragon.coreGlow,
        emissiveIntensity: baseGlow,
        roughness: 0.2,
      }),
    [dragon.id]
  );

  // Update core colors dynamically on material instance without recreation
  useEffect(() => {
    coreMaterial.color.set(dragon.coreGlow);
    coreMaterial.emissive.set(dragon.coreGlow);
  }, [dragon.coreGlow, coreMaterial]);

  // Generate vertebrae/rib segments data once per monster
  const spineSegments = useMemo(() => {
    return Array.from({ length: dragon.bodySegments }).map((_, i) => {
      const factor = (i + 1) / dragon.bodySegments;
      const size = 1.0 - factor * 0.55;
      return { id: i, size, zOffset: -1.2 * (i + 1) };
    });
  }, [dragon.bodySegments]);

  useFrame((state, delta) => {
    if (!rootRef.current) return;
    const t = state.clock.getElapsedTime();

    // Damping toward target values (lambda around 3 for ~1s transition)
    const lambda = 3.0;
    currentScale.current = THREE.MathUtils.damp(currentScale.current, dragon.scale, lambda, delta);
    currentPosX.current = THREE.MathUtils.damp(currentPosX.current, dragon.position[0], lambda, delta);
    currentPosY.current = THREE.MathUtils.damp(currentPosY.current, dragon.position[1], lambda, delta);
    currentPosZ.current = THREE.MathUtils.damp(currentPosZ.current, dragon.position[2], lambda, delta);
    currentBobSpeed.current = THREE.MathUtils.damp(currentBobSpeed.current, dragon.bobbingSpeed, lambda, delta);
    currentBobAmp.current = THREE.MathUtils.damp(currentBobAmp.current, dragon.bobbingAmplitude, lambda, delta);

    const glowMultiplier = isSelected ? 2.2 : isHovered ? 1.6 : 1.0;
    const targetGlow = ((dragon as any).coreGlowStrength ?? 1.6) * glowMultiplier;
    currentGlowStrength.current = THREE.MathUtils.damp(currentGlowStrength.current, targetGlow, lambda, delta);

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

    // Dynamic light & core emission updates
    coreMaterial.emissiveIntensity = currentGlowStrength.current;
    if (pointLightRef.current) {
      pointLightRef.current.intensity = currentGlowStrength.current * 2.2;
      pointLightRef.current.distance = currentScale.current * 6.5;
    }

    // Wing flap oscillation
    if (leftWingRef.current && rightWingRef.current) {
      const wingFlap = Math.sin(t * currentBobSpeed.current * 1.8) * 0.28;
      leftWingRef.current.rotation.z = 0.2 + wingFlap;
      rightWingRef.current.rotation.z = -0.2 - wingFlap;
    }

    // Tail undulating wave
    if (tailGroupRef.current) {
      tailGroupRef.current.rotation.y = Math.sin(t * currentBobSpeed.current * 1.5) * 0.2;
    }

    // Core pulsing glow
    if (coreRef.current) {
      const pulse = 1 + Math.sin(t * 2.5) * 0.15;
      coreRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <group
      ref={rootRef}
      position={dragon.position}
      rotation={dragon.rotation}
      scale={dragon.scale}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(dragon.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setIsHovered(true);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setIsHovered(false);
        document.body.style.cursor = 'auto';
      }}
    >
      {/* Selection / Aura Ring (subtle, non-gamey, architectural halo) */}
      {(isSelected || isHovered) && (
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

      {/* Main Thorax / Ribcage (Faceted Monumental Geometry) */}
      <mesh material={bodyMaterial} castShadow receiveShadow>
        <dodecahedronGeometry args={[1.2, 0]} />
      </mesh>

      {/* Glowing Inner Core / The Seed of the Problem */}
      <mesh ref={coreRef} material={coreMaterial} position={[0, 0, 0.15]}>
        <octahedronGeometry args={[0.45, 0]} />
      </mesh>

      {/* Point light emitted from dragon's core to illuminate its own ribs and nearby fog */}
      <pointLight
        ref={pointLightRef}
        color={dragon.coreGlow}
        intensity={baseGlow * (isSelected ? 2.2 : isHovered ? 1.6 : 1.0) * 2.2}
        distance={dragon.scale * 6.5}
        decay={2}
      />

      {/* Neck & Head */}
      <group position={[0, 0.6, 1.1]} rotation={[-0.35, 0, 0]}>
        {/* Neck Segment 1 */}
        <mesh material={bodyMaterial} position={[0, 0.4, 0.4]} castShadow>
          <cylinderGeometry args={[0.45, 0.65, 0.9, 6]} />
        </mesh>

        {/* Neck Segment 2 */}
        <mesh material={bodyMaterial} position={[0, 0.95, 0.9]} rotation={[0.45, 0, 0]} castShadow>
          <cylinderGeometry args={[0.35, 0.45, 0.9, 6]} />
        </mesh>

        {/* Angular Draconian Skull */}
        <group position={[0, 1.45, 1.4]} rotation={[0.2, 0, 0]}>
          {/* Main Cranium */}
          <mesh material={bodyMaterial} castShadow>
            <coneGeometry args={[0.48, 1.2, 5]} />
          </mesh>

          {/* Lower Jaw */}
          <mesh material={accentMaterial} position={[0, -0.25, 0.2]} rotation={[-0.2, 0, 0]} castShadow>
            <boxGeometry args={[0.32, 0.15, 0.9]} />
          </mesh>

          {/* Left Horn */}
          <mesh
            material={accentMaterial}
            position={[0.35, 0.45, -0.3]}
            rotation={[-0.6, 0.4, 0.3]}
            castShadow
          >
            <coneGeometry args={[0.12, 1.3, 4]} />
          </mesh>

          {/* Right Horn */}
          <mesh
            material={accentMaterial}
            position={[-0.35, 0.45, -0.3]}
            rotation={[-0.6, -0.4, -0.3]}
            castShadow
          >
            <coneGeometry args={[0.12, 1.3, 4]} />
          </mesh>

          {/* Brow Crest Plates */}
          <mesh material={accentMaterial} position={[0, 0.55, 0.1]} castShadow>
            <boxGeometry args={[0.55, 0.18, 0.4]} />
          </mesh>

          {/* Eyes (Subtle Pinpoint of Light) */}
          <mesh position={[0.22, 0.18, 0.35]}>
            <sphereGeometry args={[0.06, 6, 6]} />
            <meshBasicMaterial color={dragon.coreGlow} />
          </mesh>
          <mesh position={[-0.22, 0.18, 0.35]}>
            <sphereGeometry args={[0.06, 6, 6]} />
            <meshBasicMaterial color={dragon.coreGlow} />
          </mesh>
        </group>
      </group>

      {/* Left Wing Assembly */}
      <group ref={leftWingRef} position={[0.9, 0.4, -0.2]}>
        {/* Main Wing Bone / Strut */}
        <mesh material={accentMaterial} position={[dragon.wingspan * 0.45, 0.2, 0]} rotation={[0, 0, -0.2]} castShadow>
          <cylinderGeometry args={[0.1, 0.18, dragon.wingspan * 0.95, 5]} />
        </mesh>
        {/* Secondary Wing Spar */}
        <mesh
          material={accentMaterial}
          position={[dragon.wingspan * 0.85, 0.5, -0.4]}
          rotation={[0.3, 0.2, -0.7]}
          castShadow
        >
          <cylinderGeometry args={[0.06, 0.1, dragon.wingspan * 0.75, 4]} />
        </mesh>
        {/* Wing Sail / Membrane Plate */}
        <mesh
          material={bodyMaterial}
          position={[dragon.wingspan * 0.55, -0.2, -0.35]}
          rotation={[0.15, 0, -0.3]}
          castShadow
        >
          <boxGeometry args={[dragon.wingspan * 0.85, 0.04, 1.4]} />
        </mesh>
      </group>

      {/* Right Wing Assembly */}
      <group ref={rightWingRef} position={[-0.9, 0.4, -0.2]}>
        {/* Main Wing Bone / Strut */}
        <mesh material={accentMaterial} position={[-dragon.wingspan * 0.45, 0.2, 0]} rotation={[0, 0, 0.2]} castShadow>
          <cylinderGeometry args={[0.1, 0.18, dragon.wingspan * 0.95, 5]} />
        </mesh>
        {/* Secondary Wing Spar */}
        <mesh
          material={accentMaterial}
          position={[-dragon.wingspan * 0.85, 0.5, -0.4]}
          rotation={[0.3, -0.2, 0.7]}
          castShadow
        >
          <cylinderGeometry args={[0.06, 0.1, dragon.wingspan * 0.75, 4]} />
        </mesh>
        {/* Wing Sail / Membrane Plate */}
        <mesh
          material={bodyMaterial}
          position={[-dragon.wingspan * 0.55, -0.2, -0.35]}
          rotation={[0.15, 0, 0.3]}
          castShadow
        >
          <boxGeometry args={[dragon.wingspan * 0.85, 0.04, 1.4]} />
        </mesh>
      </group>

      {/* Segmented Spine & Tail */}
      <group ref={tailGroupRef}>
        {spineSegments.map((seg) => (
          <group key={seg.id} position={[0, Math.sin(seg.id * 0.4) * 0.2, seg.zOffset]}>
            {/* Vertebra body */}
            <mesh material={bodyMaterial} castShadow>
              <dodecahedronGeometry args={[seg.size * 0.75, 0]} />
            </mesh>
            {/* Dorsal Spine Blade */}
            <mesh
              material={accentMaterial}
              position={[0, seg.size * 0.65, 0]}
              rotation={[-0.35, 0, 0]}
              castShadow
            >
              <coneGeometry args={[seg.size * 0.18, seg.size * 1.1, 4]} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
};
