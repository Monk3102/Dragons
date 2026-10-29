import React from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { DragonProblem } from '../types';
import { Character } from './Character';
import { DragonMesh } from './DragonMesh';
import { VoidEnvironment } from './VoidEnvironment';
import { CameraController } from './CameraController';

interface SceneProps {
  dragons: DragonProblem[];
  selectedDragonId: string | null;
  onSelectDragon: (id: string) => void;
  onDeselectDragon: () => void;
  cameraPreset: 'overview' | 'hero' | 'inspect' | null;
  onClearPreset: () => void;
  isActive?: boolean;
}

export const Scene: React.FC<SceneProps> = ({
  dragons,
  selectedDragonId,
  onSelectDragon,
  onDeselectDragon,
  cameraPreset,
  onClearPreset,
  isActive = true,
}) => {
  const selectedDragon = dragons.find((d) => d.id === selectedDragonId) || null;

  return (
    <div className="absolute inset-0 w-full h-full bg-[#07090e] overflow-hidden select-none">
      <Canvas
        frameloop={isActive ? 'always' : 'never'}
        shadows
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

          const canvas = gl.domElement;
          canvas.addEventListener('webglcontextlost', (event) => {
            event.preventDefault();
          });
          canvas.addEventListener('webglcontextrestored', () => {
            gl.setClearColor('#07090e', 1);
          });
        }}
      >
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
          selectedDragon={selectedDragon}
          cameraPreset={cameraPreset}
          onClearPreset={onClearPreset}
        />
      </Canvas>
    </div>
  );
};
