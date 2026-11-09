import { CreatureRecipe, Part } from '../types';
import { serpentHead } from '../helpers';

/**
 * Hydra Anatomical Skeleton Plan
 * =============================================================================
 * Facing: +Z forward, +Y dorsal, +X lateral left, -X lateral right.
 * 
 * 1. Coiled Axial Body & Caudal Plan:
 *   - Deep Posterior Pelvic Anchor:  [-0.25, -0.58,  0.45]
 *   - Right Lateral Coil Arch:       [ 0.85, -0.55,  0.25]
 *   - Posterior Caudal Sweep Back:   [ 0.55, -0.52, -0.65]
 *   - Left Posterior Counter-Coil:   [-0.55, -0.50, -0.60]
 *   - Anterior Pectoral Root:        [-0.75, -0.42,  0.20]
 *   - Cervical Nexus Hub (Neck Root):[ 0.00, -0.18,  0.18]
 *   - Tail Root:                     [-0.55, -0.50, -0.60]
 *   - Tail Trough Ventral:           [-0.10, -0.52, -0.95]
 *   - Caudal Loop Lateral:           [ 0.45, -0.46, -1.05]
 *   - Caudal Dorsal Sweep:           [ 0.85, -0.38, -0.80]
 *   - Tail Apex / Spade Joint:       [ 0.92, -0.28, -0.45]
 * 
 * 2. The 7 Cervical Neck Curves (Root -> Mid-Arch -> Cranial Occiput):
 *   - Neck 1 (Center-Dominant, t>=0):
 *       Root: [0.00, -0.05, 0.22] -> Mid: [0.00, 0.70, 0.32] -> Head: [0.00, 1.45, 0.42]
 *       Length: 1.54, Curve Angle: [-0.12, 0, 0], Scale: 1.05, Phase: 0.0
 *   - Neck 2 (Left-Primary Lateral, t>=0):
 *       Root: [0.28, -0.08, 0.16] -> Mid: [0.82, 0.65, 0.15] -> Head: [1.32, 1.32, 0.20]
 *       Length: 1.76, Curve Angle: [0.15, -0.32, -0.22], Scale: 0.98, Phase: 1.2
 *   - Neck 3 (Right-Primary Lateral, t>=0):
 *       Root: [-0.28, -0.08, 0.16] -> Mid: [-0.84, 0.64, 0.14] -> Head: [-1.34, 1.30, 0.18]
 *       Length: 1.78, Curve Angle: [0.16, 0.30, 0.24], Scale: 0.97, Phase: 2.3
 *   - Neck 4 (Left-Forward Striking, t>=0.20):
 *       Root: [0.18, -0.12, 0.28] -> Mid: [0.52, 0.42, 0.62] -> Head: [0.78, 0.95, 0.88]
 *       Length: 1.42, Curve Angle: [0.42, -0.25, -0.10], Scale: 0.92, Phase: 3.4
 *   - Neck 5 (Right-Forward Striking, t>=0.40):
 *       Root: [-0.18, -0.12, 0.28] -> Mid: [-0.54, 0.40, 0.60] -> Head: [-0.80, 0.92, 0.86]
 *       Length: 1.44, Curve Angle: [0.44, 0.26, 0.10], Scale: 0.91, Phase: 4.5
 *   - Neck 6 (Left-Dorsal High Sentry, t>=0.60):
 *       Root: [0.15, 0.02, -0.05] -> Mid: [0.42, 0.95, -0.30] -> Head: [0.62, 1.62, -0.55]
 *       Length: 1.72, Curve Angle: [-0.20, -0.35, -0.10], Scale: 0.88, Phase: 0.9
 *   - Neck 7 (Right-Dorsal High Sentry, t>=0.80):
 *       Root: [-0.15, 0.02, -0.05] -> Mid: [-0.40, 0.96, -0.32] -> Head: [-0.60, 1.64, -0.58]
 *       Length: 1.75, Curve Angle: [-0.18, 0.38, 0.12], Scale: 0.87, Phase: 5.1
 * =============================================================================
 */

const necksConfig: Array<{
  id: number;
  rootPos: [number, number, number];
  points: [number, number, number][];
  headBase: [number, number, number];
  headRot: [number, number, number];
  scale: number;
  speed: number;
  amp: number;
  phase: number;
  appearAt?: number;
  crestScale: [number, number, number];
}> = [
  {
    id: 1,
    rootPos: [0.0, -0.05, 0.22],
    points: [
      [0.0, -0.05, 0.22],
      [0.0, 0.70, 0.32],
      [0.0, 1.45, 0.42],
    ],
    headBase: [0.0, 1.45, 0.42],
    headRot: [0.25, 0, 0],
    scale: 1.05,
    speed: 1.4,
    amp: 0.14,
    phase: 0.0,
    appearAt: undefined,
    crestScale: [0.06, 0.34, 0.20],
  },
  {
    id: 2,
    rootPos: [0.28, -0.08, 0.16],
    points: [
      [0.28, -0.08, 0.16],
      [0.82, 0.65, 0.15],
      [1.32, 1.32, 0.20],
    ],
    headBase: [1.32, 1.32, 0.20],
    headRot: [0.15, -0.32, -0.22],
    scale: 0.98,
    speed: 1.6,
    amp: 0.16,
    phase: 1.2,
    appearAt: undefined,
    crestScale: [0.05, 0.28, 0.18],
  },
  {
    id: 3,
    rootPos: [-0.28, -0.08, 0.16],
    points: [
      [-0.28, -0.08, 0.16],
      [-0.84, 0.64, 0.14],
      [-1.34, 1.30, 0.18],
    ],
    headBase: [-1.34, 1.30, 0.18],
    headRot: [0.16, 0.30, 0.24],
    scale: 0.97,
    speed: 1.7,
    amp: 0.15,
    phase: 2.3,
    appearAt: undefined,
    crestScale: [0.05, 0.27, 0.17],
  },
  {
    id: 4,
    rootPos: [0.18, -0.12, 0.28],
    points: [
      [0.18, -0.12, 0.28],
      [0.52, 0.42, 0.62],
      [0.78, 0.95, 0.88],
    ],
    headBase: [0.78, 0.95, 0.88],
    headRot: [0.42, -0.25, -0.10],
    scale: 0.92,
    speed: 1.9,
    amp: 0.18,
    phase: 3.4,
    appearAt: 0.20,
    crestScale: [0.045, 0.24, 0.15],
  },
  {
    id: 5,
    rootPos: [-0.18, -0.12, 0.28],
    points: [
      [-0.18, -0.12, 0.28],
      [-0.54, 0.40, 0.60],
      [-0.80, 0.92, 0.86],
    ],
    headBase: [-0.80, 0.92, 0.86],
    headRot: [0.44, 0.26, 0.10],
    scale: 0.91,
    speed: 2.0,
    amp: 0.17,
    phase: 4.5,
    appearAt: 0.40,
    crestScale: [0.045, 0.24, 0.15],
  },
  {
    id: 6,
    rootPos: [0.15, 0.02, -0.05],
    points: [
      [0.15, 0.02, -0.05],
      [0.42, 0.95, -0.30],
      [0.62, 1.62, -0.55],
    ],
    headBase: [0.62, 1.62, -0.55],
    headRot: [-0.20, -0.35, -0.10],
    scale: 0.88,
    speed: 2.2,
    amp: 0.19,
    phase: 0.9,
    appearAt: 0.60,
    crestScale: [0.04, 0.22, 0.14],
  },
  {
    id: 7,
    rootPos: [-0.15, 0.02, -0.05],
    points: [
      [-0.15, 0.02, -0.05],
      [-0.40, 0.96, -0.32],
      [-0.60, 1.64, -0.58],
    ],
    headBase: [-0.60, 1.64, -0.58],
    headRot: [-0.18, 0.38, 0.12],
    scale: 0.87,
    speed: 2.3,
    amp: 0.20,
    phase: 5.1,
    appearAt: 0.80,
    crestScale: [0.04, 0.21, 0.14],
  },
];

const hydraParts: Part[] = [
  // ---------------------------------------------------------------------------
  // 1. Coiled Serpentine Base (Thick S-Loop Torso with Scales & Ventral Bands)
  // ---------------------------------------------------------------------------
  {
    id: 'hydra-body-coil',
    shape: 'tube',
    role: 'body',
    pos: [0, 0, 0],
    scale: [1, 1, 1],
    skin: 'scales',
    tube: {
      points: [
        [-0.25, -0.78, 0.45],
        [0.85, -0.74, 0.25],
        [0.55, -0.68, -0.65],
        [-0.55, -0.65, -0.60],
        [-0.75, -0.55, 0.20],
        [0.00, -0.22, 0.18],
      ],
      radiusStart: 0.42,
      radiusEnd: 0.38,
      aspect: 1.35,
      radiusProfile: [1.0, 1.35, 1.45, 1.30, 1.15, 1.0],
      bumps: { amp: 0.02, freq: 3.0, seed: 77 },
      scales: { count: 500, size: [0.10, 0.14], seed: 77 },
    },
    silhouette: true,
  },
  // ---------------------------------------------------------------------------
  // 2. Coiled Caudal Tail with Terminal Blade Spade
  // ---------------------------------------------------------------------------
  {
    id: 'hydra-tail-coil',
    shape: 'tube',
    role: 'body',
    pos: [0, 0, 0],
    scale: [1, 1, 1],
    skin: 'scales',
    tube: {
      points: [
        [-0.55, -0.65, -0.60],
        [-0.10, -0.68, -0.95],
        [0.45, -0.60, -1.05],
        [0.85, -0.50, -0.80],
        [0.92, -0.38, -0.45],
      ],
      radiusStart: 0.35,
      radiusEnd: 0.06,
      radiusProfile: [1.0, 0.75, 0.50, 0.30, 0.15],
      bumps: { amp: 0.015, freq: 3.2, seed: 88 },
      scales: { count: 180, size: [0.08, 0.12], seed: 88 },
    },
    silhouette: true,
  },
  {
    id: 'hydra-tail-spade',
    shape: 'blade',
    role: 'accent',
    pos: [0.94, -0.36, -0.40],
    rot: [0.2, 0.8, -0.4],
    scale: [0.06, 0.28, 0.22],
    silhouette: true,
  },
  // ---------------------------------------------------------------------------
  // 3. Central Pulsing Heart Core
  // ---------------------------------------------------------------------------
  {
    id: 'hydra-core',
    shape: 'octahedron',
    role: 'glow',
    pos: [0, -0.10, 0.18],
    scale: [0.55, 0.55, 0.55],
    grow: [1.0, 2.2],
    anim: { kind: 'pulse', speed: 2.4, amp: 0.2 },
  },
  // ---------------------------------------------------------------------------
  // 4. Ventral Armor Bands & Midline Dorsal Spines on Coiled Torso
  // ---------------------------------------------------------------------------
  {
    id: 'hydra-ventral-bands',
    shape: 'cylinder',
    role: 'body',
    pos: [-0.15, -0.80, 0.35],
    rot: [0.1, 0.8, 0],
    scale: [0.22, 0.04, 0.14],
    repeat: { count: 8, stepPos: [0.10, 0.01, -0.10], stepRot: [0, 0.15, 0], stepScale: [0.01, 0, 0.01] },
    fine: true,
  },
  {
    id: 'hydra-body-spikes',
    shape: 'blade',
    role: 'accent',
    pos: [0.55, -0.46, 0.20],
    rot: [0.2, -0.4, 0.6],
    scale: [0.06, 0.24, 0.08],
    repeat: { count: 7, stepPos: [-0.08, 0.02, -0.12], stepScale: [-0.003, -0.01, -0.002] },
    fine: true,
  },
];

// Append 7 muscular fanning necks, dorsal neck spines, and detailed serpent heads
for (const n of necksConfig) {
  // Muscular neck tube (thickens with ferocity)
  hydraParts.push({
    id: `hydra-neck-${n.id}`,
    shape: 'tube',
    role: 'body',
    pos: [0, 0, 0],
    scale: [1, 1, 1],
    skin: 'scales',
    appearAt: n.appearAt,
    grow: [1.0, 1.4],
    tube: {
      points: n.points,
      radiusStart: 0.22 * n.scale,
      radiusEnd: 0.14 * n.scale,
      aspect: 1.15,
      radiusProfile: [1.0, 1.25, 0.95, 0.85],
      bumps: { amp: 0.02, freq: 3.2, seed: 10 + n.id },
      scales: { count: 100, size: [0.08, 0.12], seed: 10 + n.id },
    },
    anim: { kind: 'sway', speed: n.speed, amp: n.amp, phase: n.phase },
    silhouette: true,
  });

  // Row of small blade spikes along the cervical crest
  hydraParts.push({
    id: `hydra-neck-spikes-${n.id}`,
    shape: 'blade',
    role: 'accent',
    pos: [n.points[1][0], n.points[1][1], n.points[1][2]],
    rot: [n.headRot[0] - 0.2, n.headRot[1], n.headRot[2]],
    scale: [0.04 * n.scale, 0.18 * n.scale, 0.05 * n.scale],
    repeat: {
      count: 4,
      stepPos: [
        (n.points[2][0] - n.points[1][0]) * 0.25,
        (n.points[2][1] - n.points[1][1]) * 0.25,
        (n.points[2][2] - n.points[1][2]) * 0.25,
      ],
    },
    appearAt: n.appearAt,
    grow: [1.0, 1.6],
    fine: true,
  });

  // Serpent skull head assembly (10 parts)
  const headParts = serpentHead(`hydra-h${n.id}`, n.headBase, n.headRot, n.scale, {
    appearAt: n.appearAt,
    crestScale: n.crestScale,
  });
  hydraParts.push(...headParts);
}

export const hydraRecipe: CreatureRecipe = {
  id: 'archetype-hydra',
  family: 'serpentine',
  palette: {
    body: '#0f1d19',
    accent: '#2d6a4f',
    metalness: 0.35,
    roughness: 0.65,
  },
  viewpoints: {
    head: { target: [0.0, 1.45, 0.42], distance: 2.2 },
    // Since Hydra has no wings, 'wing' viewpoint points at its heavily detailed coiled body & ventral core
    wing: { target: [0.20, -0.38, 0.10], distance: 2.8 },
  },
  parts: hydraParts,
};
