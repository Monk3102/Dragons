import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { OrbitControls as DreiOrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { DragonProblem } from '../types';

interface CameraControllerProps {
  dragons?: DragonProblem[];
  selectedDragon: DragonProblem | null;
  cameraPreset: 'overview' | 'hero' | 'inspect' | null;
  onClearPreset: () => void;
}

export const CameraController: React.FC<CameraControllerProps> = ({
  dragons = [],
  selectedDragon,
  cameraPreset,
  onClearPreset,
}) => {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  // Target positions to interpolate toward
  const targetCameraPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 9, 28));
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 2, 0));
  const isTransitioning = useRef<boolean>(true);

  // When selected dragon or preset changes, calculate target vectors
  useEffect(() => {
    isTransitioning.current = true;

    if (selectedDragon) {
      // Inspect preset: camera distance scales with the dragon's scale so big dragons are not cut off
      const offsetDist = Math.max(8.5, selectedDragon.scale * 4.2);
      targetCameraPos.current.set(
        selectedDragon.position[0] + (selectedDragon.position[0] >= 0 ? -offsetDist * 0.65 : offsetDist * 0.65),
        selectedDragon.position[1] + offsetDist * 0.32,
        selectedDragon.position[2] + offsetDist * 0.95
      );
      targetLookAt.current.set(
        selectedDragon.position[0],
        selectedDragon.position[1],
        selectedDragon.position[2]
      );
    } else if (cameraPreset === 'hero') {
      // Hero preset: low-angle shot right behind the lone character looking up at the sky
      targetCameraPos.current.set(0, 1.4, 4.2);
      targetLookAt.current.set(0, 4.0, -10);
    } else {
      // Overview preset: frame ALL alive monsters based on their farthest extents
      if (dragons.length === 0) {
        // With no monsters, use current default view
        targetCameraPos.current.set(0, 9, 28);
        targetLookAt.current.set(0, 2, 0);
      } else {
        let maxRadius = 0;
        let maxY = 0;
        let minZ = 0;

        for (const d of dragons) {
          const r = Math.sqrt(d.position[0] * d.position[0] + d.position[2] * d.position[2]) + d.scale * 2.2;
          if (r > maxRadius) maxRadius = r;
          const topY = d.position[1] + d.scale * 1.8;
          if (topY > maxY) maxY = topY;
          const backZ = d.position[2] - d.scale * 1.5;
          if (backZ < minZ) minZ = backZ;
        }

        const camZ = Math.max(28, maxRadius * 0.68 + 14);
        const camY = Math.max(9, maxY * 0.52 + 4);
        const lookY = Math.max(2, maxY * 0.3);
        const lookZ = Math.min(0, minZ * 0.25);

        targetCameraPos.current.set(0, camY, camZ);
        targetLookAt.current.set(0, lookY, lookZ);
      }
    }
  }, [selectedDragon, cameraPreset, dragons]);

  // When the user actively drags or orbits, cancel scripted transition
  const handleStartInteraction = () => {
    isTransitioning.current = false;
    onClearPreset();
  };

  useFrame((_, delta) => {
    if (!controlsRef.current) return;

    if (isTransitioning.current) {
      // Smooth exponential damping
      const lambda = 4.0;
      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCameraPos.current.x, lambda, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCameraPos.current.y, lambda, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCameraPos.current.z, lambda, delta);

      controlsRef.current.target.x = THREE.MathUtils.damp(controlsRef.current.target.x, targetLookAt.current.x, lambda, delta);
      controlsRef.current.target.y = THREE.MathUtils.damp(controlsRef.current.target.y, targetLookAt.current.y, lambda, delta);
      controlsRef.current.target.z = THREE.MathUtils.damp(controlsRef.current.target.z, targetLookAt.current.z, lambda, delta);

      controlsRef.current.update();

      // Check if settled
      if (
        camera.position.distanceTo(targetCameraPos.current) < 0.1 &&
        controlsRef.current.target.distanceTo(targetLookAt.current) < 0.05
      ) {
        isTransitioning.current = false;
      }
    }
  });

  return (
    <DreiOrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      minDistance={2.5}
      maxDistance={120}
      maxPolarAngle={Math.PI / 2 + 0.1}
      onStart={handleStartInteraction}
    />
  );
};
