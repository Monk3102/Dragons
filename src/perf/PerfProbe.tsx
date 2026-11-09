import React from 'react';
import { useFrame } from '@react-three/fiber';
import { globalPerfSampler } from './perfSampler';

export interface PerfProbeSnapshot {
  drawCalls: number;
  triangles: number;
  points: number;
  lines: number;
  geometries: number;
  textures: number;
  programs: number;
  tabWasHidden: boolean;
}

/**
 * Stable, pre-allocated snapshot object mutated in-place every frame.
 * Zero allocation per frame; consumers read directly without re-render cascades.
 */
export const perfProbeSnapshot: PerfProbeSnapshot = {
  drawCalls: 0,
  triangles: 0,
  points: 0,
  lines: 0,
  geometries: 0,
  textures: 0,
  programs: 0,
  tabWasHidden: false,
};

/**
 * PerfProbe component mounted inside the Three.js Canvas in development mode.
 * Captures frame deltas into the global ring buffer and polls renderer memory/draw stats.
 */
export const PerfProbe: React.FC = () => {
  useFrame((state, delta) => {
    // 1. Record frame duration in milliseconds
    const deltaMs = delta * 1000;
    globalPerfSampler.record(deltaMs);

    // 2. Track tab visibility (invalidate benchmark sample windows if tab goes to background)
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      globalPerfSampler.markHidden();
      perfProbeSnapshot.tabWasHidden = true;
    }

    // 3. Query WebGL renderer stats.
    // NOTE: Reading inside useFrame returns the previous frame's draw counts: that is acceptable,
    // as Three.js executes its draw pass at the conclusion of the render loop.
    const info = state.gl.info;
    perfProbeSnapshot.drawCalls = info.render.calls;
    perfProbeSnapshot.triangles = info.render.triangles;
    perfProbeSnapshot.points = info.render.points;
    perfProbeSnapshot.lines = info.render.lines;
    perfProbeSnapshot.geometries = info.memory.geometries;
    perfProbeSnapshot.textures = info.memory.textures;
    perfProbeSnapshot.programs = (info as any).programs ? (info as any).programs.length : 0;
  });

  return null;
};

export default PerfProbe;
