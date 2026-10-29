import React, { useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';

interface PlaceholderModelProps {
  color?: string;
  accentColor?: string;
}

function PlaceholderCylinder({
  color = '#252932',
  accentColor = '#c5a059',
}: PlaceholderModelProps) {
  const meshRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.45;
    }
    if (ringRef.current) {
      ringRef.current.rotation.z -= delta * 0.3;
      ringRef.current.rotation.x += delta * 0.15;
    }
  });

  return (
    <group ref={meshRef}>
      {/* Central Archetypal Monolith / Cylinder */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.75, 0.85, 2.2, 32, 1]} />
        <meshStandardMaterial
          color={color}
          roughness={0.4}
          metalness={0.7}
          envMapIntensity={0.8}
        />
      </mesh>

      {/* Antique Gold / Copper Crown Ring */}
      <mesh position={[0, 1.15, 0]}>
        <cylinderGeometry args={[0.78, 0.78, 0.1, 32]} />
        <meshStandardMaterial
          color={accentColor}
          roughness={0.25}
          metalness={0.85}
          emissive={accentColor}
          emissiveIntensity={0.25}
        />
      </mesh>

      {/* Antique Gold / Copper Base Ring */}
      <mesh position={[0, -1.15, 0]}>
        <cylinderGeometry args={[0.88, 0.88, 0.1, 32]} />
        <meshStandardMaterial
          color={accentColor}
          roughness={0.3}
          metalness={0.85}
        />
      </mesh>

      {/* Orbiting Resonant Glyphic Ring */}
      <mesh ref={ringRef} position={[0, 0, 0]}>
        <torusGeometry args={[1.35, 0.025, 16, 48]} />
        <meshStandardMaterial
          color={accentColor}
          roughness={0.2}
          metalness={0.9}
          emissive={accentColor}
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* Floating subtle point light at core */}
      <pointLight
        position={[0, 0, 0]}
        color={accentColor}
        intensity={0.8}
        distance={4}
      />
    </group>
  );
}

interface CreaturePreviewCanvasProps {
  creatureName: string;
  color?: string;
  accentColor?: string;
  className?: string;
}

export const CreaturePreviewCanvas: React.FC<CreaturePreviewCanvasProps> = ({
  creatureName,
  color,
  accentColor,
  className = 'w-full h-48 sm:h-56',
}) => {
  return (
    <div
      className={`relative rounded-xl overflow-hidden bg-gradient-to-b from-[#0c0d12] via-[#090a0e] to-[#06070a] border border-[#c5a059]/20 shadow-inner ${className}`}
      aria-label={`3D preview placeholder for ${creatureName}`}
    >
      <Canvas
        camera={{ position: [0, 0.4, 4.2], fov: 38 }}
        gl={{
          antialias: true,
          powerPreference: 'low-power',
        }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[3, 5, 4]} intensity={1.2} color="#f5eedc" />
        <directionalLight position={[-3, -2, -2]} intensity={0.5} color="#5577aa" />

        <PlaceholderCylinder color={color} accentColor={accentColor} />
      </Canvas>

      {/* Subdued watermark / tag */}
      <div className="absolute bottom-2 right-3 pointer-events-none text-[9px] uppercase tracking-widest font-mono text-amber-200/40">
        Archetype Prototype
      </div>
    </div>
  );
};
