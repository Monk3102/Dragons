import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

export const Character: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const swordRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    // Subtle breathing posture
    groupRef.current.position.y = Math.sin(t * 1.5) * 0.02;
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Contact shadow plane directly beneath lone figure */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.7, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.65} depthWrite={false} />
      </mesh>

      {/* Robe / Lower Body */}
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.42, 1.1, 12]} />
        <meshStandardMaterial color="#1a1c22" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Torso & Cloaked Mantle */}
      <mesh position={[0, 1.25, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.28, 0.22, 0.55, 10]} />
        <meshStandardMaterial color="#14161b" roughness={0.85} metalness={0.15} />
      </mesh>

      {/* Hood / Cowl */}
      <mesh position={[0, 1.62, 0.02]} rotation={[0.08, 0, 0]} castShadow receiveShadow>
        <coneGeometry args={[0.22, 0.45, 8]} />
        <meshStandardMaterial color="#111317" roughness={0.95} metalness={0.05} />
      </mesh>

      {/* Inner Face Shadow / Void underneath hood */}
      <mesh position={[0, 1.54, 0.12]}>
        <sphereGeometry args={[0.09, 8, 8]} />
        <meshBasicMaterial color="#050608" />
      </mesh>

      {/* Shoulder Cloak drape */}
      <mesh position={[0, 1.35, -0.05]} castShadow>
        <boxGeometry args={[0.62, 0.35, 0.26]} />
        <meshStandardMaterial color="#0f1115" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Right Arm holding sword */}
      <group position={[0.3, 1.15, 0.05]} rotation={[-0.2, 0, 0.1]}>
        {/* Arm Sleeve */}
        <mesh position={[0, -0.2, 0]} castShadow>
          <cylinderGeometry args={[0.065, 0.08, 0.45, 8]} />
          <meshStandardMaterial color="#14161b" roughness={0.9} metalness={0.1} />
        </mesh>

        {/* Hand / Gauntlet */}
        <mesh position={[0, -0.42, 0]} castShadow>
          <boxGeometry args={[0.08, 0.09, 0.1]} />
          <meshStandardMaterial color="#2d313a" roughness={0.5} metalness={0.7} />
        </mesh>

        {/* Sword Entity */}
        <group position={[0, -0.45, 0.08]} rotation={[0.45, 0.15, 0]}>
          {/* Pommel */}
          <mesh position={[0, 0.15, 0]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshStandardMaterial color="#8892a0" metalness={0.85} roughness={0.25} />
          </mesh>

          {/* Grip */}
          <mesh position={[0, 0.07, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.14, 8]} />
            <meshStandardMaterial color="#1a1c20" roughness={0.9} />
          </mesh>

          {/* Crossguard */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.22, 0.03, 0.04]} />
            <meshStandardMaterial color="#94a0b2" metalness={0.9} roughness={0.2} />
          </mesh>

          {/* Slender Long Blade pointing down toward stone */}
          <mesh ref={swordRef} position={[0, -0.75, 0]} castShadow>
            <boxGeometry args={[0.045, 1.48, 0.012]} />
            <meshStandardMaterial
              color="#e4ecf7"
              metalness={0.95}
              roughness={0.12}
              emissive="#3a485a"
              emissiveIntensity={0.25}
            />
          </mesh>

          {/* Blade tip */}
          <mesh position={[0, -1.54, 0]}>
            <coneGeometry args={[0.024, 0.12, 4]} />
            <meshStandardMaterial color="#e4ecf7" metalness={0.95} roughness={0.12} />
          </mesh>
        </group>
      </group>
    </group>
  );
};
