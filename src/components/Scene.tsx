import React, { useSyncExternalStore } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { DragonProblem } from '../types';
import { Character } from './Character';
import { DragonMesh } from './DragonMesh';
import { VoidEnvironment } from './VoidEnvironment';
import { CameraController } from './CameraController';
import { subscribeQuality, getQualitySnapshot } from '../config/quality';

const PerfProbe = import.meta.env.DEV
  ? React.lazy(
      new Function("return import('../perf/PerfProbe')") as () => Promise<{
        default: React.ComponentType;
      }>
    )
  : null;

interface SceneProps {
  dragons: DragonProblem[];
  selectedDragonId: string | null;
  onSelectDragon: (id: string) => void;
  onDeselectDragon: () => void;
  cameraPreset: 'overview' | 'hero' | 'inspect' | null;
  onClearPreset: () => void;
  isActive?: boolean;
}

export const Scene: React.FC<SceneProps> = React.memo(({
  dragons,
  selectedDragonId,
  onSelectDragon,
  onDeselectDragon,
  cameraPreset,
  onClearPreset,
  isActive = true,
}) => {
  const quality = useSyncExternalStore(subscribeQuality, getQualitySnapshot, getQualitySnapshot);
  const isLowPower = quality === 'low-power';
  const selectedDragon = dragons.find((d) => d.id === selectedDragonId) || null;

  return (
    <div className="absolute inset-0 w-full h-full bg-[#07090e] overflow-hidden select-none">
      <Canvas
        frameloop={isActive ? 'always' : 'never'}
        shadows={!isLowPower}
        dpr={isLowPower ? 1 : [1, 2]}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
        camera={{
          position: [0, 9, 28],
          fov: 46,
          near: 0.1,
          far: 200,
        }}
        onPointerMissed={(e) => {
          // If clicked empty space, deselect dragon unless dragging
          if (e.type === 'click') {
            onDeselectDragon();
          }
        }}
        onCreated={({ gl, scene }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          // Set atmospheric void fog
          scene.fog = new THREE.FogExp2('#07090e', 0.016);
          // Set environment intensity
          (scene as any).environmentIntensity = 0.35;

          const canvas = gl.domElement;
          canvas.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
          });
          canvas.addEventListener('webglcontextrestored', () => {
            gl.setClearColor('#07090e', 1);
          });
        }}
      >
        {/* Baked Studio Environment for Subtle Reflections */}
        <Environment frames={1} resolution={256}>
          <Lightformer
            form="rect"
            intensity={0.5}
            color="#c0d8f0"
            position={[0, 10, 0]}
            scale={[12, 12, 1]}
            rotation={[Math.PI / 2, 0, 0]}
          />
          <Lightformer
            form="rect"
            intensity={0.6}
            color="#f5c070"
            position={[0, -2, -8]}
            scale={[10, 2, 1]}
          />
        </Environment>
        {/* Sky/Ground Hemisphere Ambient Fill */}
        <hemisphereLight
          args={['#1c2635', '#090b0e', 1.1]}
          position={[0, 50, 0]}
        />

        {/* Key Directional Rim/Moonlight */}
        <directionalLight
          position={[18, 35, 18]}
          intensity={2.2}
          color="#dbe6f5"
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0005}
          shadow-camera-near={0.5}
          shadow-camera-far={90}
          shadow-camera-left={-25}
          shadow-camera-right={25}
          shadow-camera-top={25}
          shadow-camera-bottom={-25}
        />

        {/* Counter Rim Light from below/behind for silhouette separation */}
        <directionalLight
          position={[-22, 12, -26]}
          intensity={1.4}
          color="#415a77"
        />

        {/* Low Warm Ground Bounce for the character's dais */}
        <directionalLight
          position={[0, -5, 10]}
          intensity={0.35}
          color="#5c4436"
        />

        {/* Environmental Geometry: Platform, Monoliths, Drift Particles */}
        <VoidEnvironment />

        {/* Lone Character Sentry with Sword at center */}
        <Character />

        {/* Manifested Problem Dragons */}
        {dragons.map((dragon) => (
          <DragonMesh
            key={dragon.id}
            dragon={dragon}
            isSelected={dragon.id === selectedDragonId}
            onSelect={onSelectDragon}
          />
        ))}

        {/* Camera Orchestrator */}
        <CameraController
          dragons={dragons}
          selectedDragon={selectedDragon}
          cameraPreset={cameraPreset}
          onClearPreset={onClearPreset}
        />

        {/* Development Telemetry Probe (zero production bundle footprint) */}
        {import.meta.env.DEV && PerfProbe && (
          <React.Suspense fallback={null}>
            <PerfProbe />
          </React.Suspense>
        )}
      </Canvas>
    </div>
  );
});

Scene.displayName = 'Scene';
