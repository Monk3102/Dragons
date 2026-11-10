import React, { useMemo, useRef, useSyncExternalStore } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { subscribeQuality, getQualitySnapshot } from '../config/quality';

export const VoidEnvironment: React.FC = () => {
  const particlesRef = useRef<THREE.Points>(null);
  const quality = useSyncExternalStore(subscribeQuality, getQualitySnapshot, getQualitySnapshot);
  const isLowPower = quality === 'low-power';

  // Generate particulate dust motes drifting in the void (halved in low-power)
  const [particlesPos, particlesSpeeds] = useMemo(() => {
    const count = isLowPower ? 175 : 350;
    const positions = new Float32Array(count * 3);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Spread across a radius of 60 and height of -5 to 45
      const angle = Math.random() * Math.PI * 2;
      const radius = 6 + Math.random() * 55;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = Math.random() * 45 - 5;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      speeds[i] = 0.2 + Math.random() * 0.5;
    }
    return [positions, speeds];
  }, [isLowPower]);

  // Suspended floating monolith shards in the surrounding void
  const monoliths = useMemo(() => {
    return [
      { pos: [-24, 8, -20] as [number, number, number], rot: [0.2, 0.4, 0.1] as [number, number, number], scale: [2.5, 9, 2] as [number, number, number] },
      { pos: [28, 12, -28] as [number, number, number], rot: [-0.3, 0.6, -0.2] as [number, number, number], scale: [3.2, 14, 2.5] as [number, number, number] },
      { pos: [-32, 18, 14] as [number, number, number], rot: [0.1, -0.5, 0.3] as [number, number, number], scale: [2, 11, 2] as [number, number, number] },
      { pos: [30, 6, 22] as [number, number, number], rot: [-0.2, 0.8, 0.15] as [number, number, number], scale: [2.2, 8, 2.2] as [number, number, number] },
      { pos: [-8, 26, -55] as [number, number, number], rot: [0.4, -0.2, 0] as [number, number, number], scale: [4.5, 20, 3.5] as [number, number, number] },
      { pos: [14, -4, -18] as [number, number, number], rot: [0.1, 0.2, -0.4] as [number, number, number], scale: [3, 4, 3] as [number, number, number] },
    ];
  }, []);

  useFrame((state) => {
    if (!particlesRef.current) return;
    const pos = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const delta = 0.016;

    for (let i = 0; i < particlesSpeeds.length; i++) {
      pos[i * 3 + 1] += particlesSpeeds[i] * delta * 0.4;
      if (pos[i * 3 + 1] > 45) {
        pos[i * 3 + 1] = -5;
      }
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <group>
      {/* Central Fractured Dais where the lone figure stands */}
      <group position={[0, -0.2, 0]}>
        {/* Main circular platform */}
        <mesh receiveShadow position={[0, 0, 0]}>
          <cylinderGeometry args={[2.8, 3.4, 0.4, 16]} />
          <meshStandardMaterial color="#0f1116" roughness={0.92} metalness={0.12} flatShading />
        </mesh>

        {/* Lower stepped ring */}
        <mesh receiveShadow position={[0, -0.35, 0]}>
          <cylinderGeometry args={[4.4, 5.2, 0.35, 16]} />
          <meshStandardMaterial color="#0b0d11" roughness={0.95} metalness={0.08} flatShading />
        </mesh>

        {/* Outer fractured stones */}
        <mesh receiveShadow position={[2.6, -0.2, 1.4]} rotation={[0.05, 0.3, -0.05]}>
          <boxGeometry args={[1.2, 0.3, 1.6]} />
          <meshStandardMaterial color="#0d0f14" roughness={0.9} />
        </mesh>
        <mesh receiveShadow position={[-2.4, -0.25, -1.8]} rotation={[-0.04, -0.4, 0.08]}>
          <boxGeometry args={[1.6, 0.25, 1.3]} />
          <meshStandardMaterial color="#0d0f14" roughness={0.9} />
        </mesh>
      </group>

      {/* Floating Monolith Shards in the mist */}
      {monoliths.map((m, idx) => (
        <mesh key={idx} position={m.pos} rotation={m.rot} scale={m.scale} castShadow receiveShadow>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#11141b" roughness={0.9} metalness={0.2} flatShading />
        </mesh>
      ))}

      {/* Drifting Particulate Motes */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[particlesPos, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.16}
          color="#7e91a8"
          transparent
          opacity={0.4}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Ground horizon disc with soft radial opacity fade to ground the void */}
      <mesh position={[0, -1.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, 95, 64]} />
        <meshBasicMaterial color="#06070a" transparent opacity={0.85} depthWrite={false} />
      </mesh>
    </group>
  );
};
