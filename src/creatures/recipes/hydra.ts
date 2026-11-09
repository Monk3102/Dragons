import { CreatureRecipe, Part } from '../types';

/**
 * Hydra Recipe ('archetype-hydra')
 * Family: serpentine
 * Multi-headed serpentine terror with a heavy coiled base and swaying sinuous necks.
 * Ferocity effects: 3 heads active at ferocity 1, scaling up to 7 fully manifested heads at ferocity 10 via appearAt.
 */
export const hydraRecipe: CreatureRecipe = {
  id: 'archetype-hydra',
  family: 'serpentine',
  palette: {
    body: '#0f1d19',
    accent: '#2d6a4f',
    metalness: 0.3,
    roughness: 0.7,
  },
  parts: [
    // 1. Coiled Serpentine Base (Ringed body mass)
    {
      id: 'hydra-coil-outer',
      shape: 'torus',
      role: 'body',
      pos: [0, -0.4, 0],
      rot: [Math.PI / 2, 0, 0],
      scale: [1.4, 1.4, 0.9],
    },
    {
      id: 'hydra-coil-inner',
      shape: 'cylinder',
      role: 'body',
      pos: [0, -0.3, 0],
      scale: [1.1, 0.6, 1.1],
    },
    {
      id: 'hydra-core',
      shape: 'octahedron',
      role: 'glow',
      pos: [0, 0.05, 0],
      scale: [0.6, 0.6, 0.6],
      grow: [1.0, 1.8],
      anim: { kind: 'pulse', speed: 2.4, amp: 0.2 },
    },

    // 2. Head 1 (Center-Main, always active from t=0)
    {
      id: 'hydra-neck-1',
      shape: 'cylinder',
      role: 'body',
      pos: [0, 0.9, 0.2],
      rot: [-0.15, 0, 0],
      scale: [0.25, 1.2, 0.25],
      anim: { kind: 'sway', speed: 1.5, amp: 0.16, phase: 0 },
    },
    {
      id: 'hydra-head-1',
      shape: 'cone',
      role: 'body',
      pos: [0, 1.6, 0.45],
      rot: [0.4, 0, 0],
      scale: [0.35, 0.7, 0.35],
    },
    {
      id: 'hydra-crest-1',
      shape: 'box',
      role: 'accent',
      pos: [0, 1.75, 0.3],
      scale: [0.12, 0.25, 0.45],
      grow: [1.0, 1.8],
    },

    // 3. Head 2 (Left-Primary, always active from t=0)
    {
      id: 'hydra-neck-2',
      shape: 'cylinder',
      role: 'body',
      pos: [0.65, 0.8, 0],
      rot: [-0.1, 0, -0.3],
      scale: [0.22, 1.1, 0.22],
      anim: { kind: 'sway', speed: 1.7, amp: 0.18, phase: 1.2 },
    },
    {
      id: 'hydra-head-2',
      shape: 'cone',
      role: 'body',
      pos: [1.0, 1.45, 0.15],
      rot: [0.3, -0.35, -0.2],
      scale: [0.3, 0.6, 0.3],
    },
    {
      id: 'hydra-crest-2',
      shape: 'box',
      role: 'accent',
      pos: [1.05, 1.6, 0.05],
      scale: [0.1, 0.2, 0.4],
      grow: [1.0, 1.7],
    },

    // 4. Head 3 (Right-Primary, always active from t=0)
    {
      id: 'hydra-neck-3',
      shape: 'cylinder',
      role: 'body',
      pos: [-0.65, 0.8, 0],
      rot: [-0.1, 0, 0.3],
      scale: [0.22, 1.1, 0.22],
      anim: { kind: 'sway', speed: 1.7, amp: 0.18, phase: 2.4 },
    },
    {
      id: 'hydra-head-3',
      shape: 'cone',
      role: 'body',
      pos: [-1.0, 1.45, 0.15],
      rot: [0.3, 0.35, 0.2],
      scale: [0.3, 0.6, 0.3],
    },
    {
      id: 'hydra-crest-3',
      shape: 'box',
      role: 'accent',
      pos: [-1.05, 1.6, 0.05],
      scale: [0.1, 0.2, 0.4],
      grow: [1.0, 1.7],
    },

    // 5. Head 4 (Left-Forward, appears at t >= 0.15)
    {
      id: 'hydra-neck-4',
      shape: 'cylinder',
      role: 'body',
      pos: [0.4, 0.6, 0.55],
      rot: [0.2, 0, -0.2],
      scale: [0.2, 0.95, 0.2],
      appearAt: 0.15,
      anim: { kind: 'sway', speed: 2.0, amp: 0.2, phase: 3.5 },
    },
    {
      id: 'hydra-head-4',
      shape: 'cone',
      role: 'body',
      pos: [0.65, 1.15, 0.85],
      rot: [0.5, -0.25, 0],
      scale: [0.28, 0.55, 0.28],
      appearAt: 0.15,
    },

    // 6. Head 5 (Right-Forward, appears at t >= 0.35)
    {
      id: 'hydra-neck-5',
      shape: 'cylinder',
      role: 'body',
      pos: [-0.4, 0.6, 0.55],
      rot: [0.2, 0, 0.2],
      scale: [0.2, 0.95, 0.2],
      appearAt: 0.35,
      anim: { kind: 'sway', speed: 2.0, amp: 0.2, phase: 4.6 },
    },
    {
      id: 'hydra-head-5',
      shape: 'cone',
      role: 'body',
      pos: [-0.65, 1.15, 0.85],
      rot: [0.5, 0.25, 0],
      scale: [0.28, 0.55, 0.28],
      appearAt: 0.35,
    },

    // 7. Head 6 (Left-Dorsal High, appears at t >= 0.60)
    {
      id: 'hydra-neck-6',
      shape: 'cylinder',
      role: 'body',
      pos: [0.35, 1.1, -0.4],
      rot: [-0.35, 0, -0.25],
      scale: [0.18, 1.0, 0.18],
      appearAt: 0.6,
      anim: { kind: 'sway', speed: 2.3, amp: 0.22, phase: 0.8 },
    },
    {
      id: 'hydra-head-6',
      shape: 'cone',
      role: 'body',
      pos: [0.55, 1.7, -0.75],
      rot: [-0.2, -0.3, 0],
      scale: [0.26, 0.5, 0.26],
      appearAt: 0.6,
    },

    // 8. Head 7 (Right-Dorsal High, appears at t >= 0.80)
    {
      id: 'hydra-neck-7',
      shape: 'cylinder',
      role: 'body',
      pos: [-0.35, 1.1, -0.4],
      rot: [-0.35, 0, 0.25],
      scale: [0.18, 1.0, 0.18],
      appearAt: 0.8,
      anim: { kind: 'sway', speed: 2.3, amp: 0.22, phase: 5.2 },
    },
    {
      id: 'hydra-head-7',
      shape: 'cone',
      role: 'body',
      pos: [-0.55, 1.7, -0.75],
      rot: [-0.2, 0.3, 0],
      scale: [0.26, 0.5, 0.26],
      appearAt: 0.8,
    },
  ],
};
