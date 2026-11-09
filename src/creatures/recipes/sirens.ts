import { CreatureRecipe, Part } from '../types';
import { humanoidHood, humanoidFace, humanoidArms, soundRing } from '../helpers';

/**
 * Sirens Anatomical Skeleton Plan
 * =============================================================================
 * Facing: +Z forward, +Y dorsal, +X lateral left, -X lateral right.
 * 
 * The Sirens manifest as an abyssal triad (a lead siren flanked by two sister
 * sirens in a seductive chorus formation) emerging from a deep whirlpool vortex
 * of iridescent mist and hypnotic sound waves.
 * 
 * 1. Triad Figure Positioning & Spines:
 *   - Lead Siren (Apex / Fore):       [ 0.00,  0.15,  0.45]
 *       * Head Visor / Cowl:          [ 0.00,  1.30,  0.55]
 *       * Slender Torso Curve:        [ 0.00, -0.30,  0.25] -> [0.00, 1.20, 0.55]
 *       * Dorsal Ribbons:             Descending to caudal root [0.00, -1.20, -2.35]
 *   - Sister Left (Port Chorus):      [-1.45,  0.05, -0.25], canted +12° yaw
 *       * Head Visor / Cowl:          [-1.45,  1.10, -0.15]
 *       * Reaching Arms:              Extending towards [ -1.85, 0.55, 0.35 ]
 *       * Trailing Veil Ribbons:      Descending to [ -1.50, -1.20, -2.60 ]
 *   - Sister Right (Starboard Chorus):[ 1.45,  0.05, -0.25], canted -12° yaw
 *       * Head Visor / Cowl:          [ 1.45,  1.10, -0.15]
 *       * Reaching Arms:              Extending towards [ 1.85, 0.55, 0.35 ]
 *       * Trailing Veil Ribbons:      Descending to [ 1.50, -1.20, -2.60 ]
 * 
 * 2. Hypnotic Resonance & Vortex Foundation:
 *   - Shared Sonic Resonant Core:     [ 0.00, -0.15, -0.20 ] (octahedral pulse)
 *   - Concentric Hypnotic Wave Rings: Expanding horizontal planar tori
 *       * Ring 1: Radius 1.6 at       [ 0.00, -0.35, -0.20 ]
 *       * Ring 2: Radius 2.1 at       [ 0.00, -0.65, -0.50 ]
 *       * Ring 3: Radius 2.5 at       [ 0.00, -0.95, -0.90 ]
 *   - Abyssal Swirl Vortex Tubes:     Interlocking spiral currents from Y=-1.35 to -1.05
 * =============================================================================
 */

function buildSirensParts(): Part[] {
  const parts: Part[] = [];

  const figures = [
    { prefix: 'siren-lead', pos: [0.0, 0.15, 0.45] as [number, number, number], rotY: 0, scale: 1.0 },
    { prefix: 'siren-left', pos: [-1.45, 0.05, -0.25] as [number, number, number], rotY: 0.22, scale: 0.92 },
    { prefix: 'siren-right', pos: [1.45, 0.05, -0.25] as [number, number, number], rotY: -0.22, scale: 0.92 },
  ];

  for (const f of figures) {
    // 1. Slender torso tube with aspect ratio, radiusProfile, bumps, and shimmering scales
    parts.push({
      id: `${f.prefix}-torso`,
      shape: 'tube',
      role: 'body',
      pos: f.pos,
      rot: [0, f.rotY, 0],
      scale: [f.scale, f.scale, f.scale],
      skin: 'scales',
      silhouette: true,
      tube: {
        points: [
          [0, -0.45, -0.2],
          [0, -0.15, -0.05],
          [0, 0.25, 0.1],
          [0, 0.65, 0.15],
          [0, 1.05, 0.1],
        ],
        radiusStart: 0.22,
        radiusEnd: 0.11,
        aspect: 1.25,
        radiusProfile: [0.9, 1.2, 1.0, 0.8, 0.7],
        bumps: { amp: 0.03, freq: 3.2, seed: 101 },
        scales: { count: 65, size: [0.035, 0.055], seed: 202 },
      },
    });

    // 2. Hood / Cowl (3 membrane panels)
    parts.push(...humanoidHood(f.prefix, [f.pos[0], f.pos[1] + 1.15 * f.scale, f.pos[2] + 0.1 * f.scale], 0.38 * f.scale));

    // 3. Face & Visor with Glowing Eyes (4 parts)
    parts.push(...humanoidFace(f.prefix, [f.pos[0], f.pos[1] + 1.12 * f.scale, f.pos[2] + 0.14 * f.scale], 0.32 * f.scale));

    // 4. Slender Reaching Arms (3 parts)
    parts.push(...humanoidArms(f.prefix, [f.pos[0], f.pos[1] + 0.65 * f.scale, f.pos[2] + 0.12 * f.scale], 0.42 * f.scale));

    // 5. Flowing Ethereal Hair Strands (cylinder repeats)
    parts.push({
      id: `${f.prefix}-hair-l`,
      shape: 'cylinder',
      role: 'accent',
      pos: [f.pos[0] - 0.14 * f.scale, f.pos[1] + 1.0 * f.scale, f.pos[2] - 0.05 * f.scale],
      rot: [0.2, 0.1, -0.15],
      scale: [0.03 * f.scale, 0.35 * f.scale, 0.03 * f.scale],
      repeat: { count: 4, stepPos: [-0.04 * f.scale, -0.05 * f.scale, -0.06 * f.scale], stepScale: [-0.003, -0.02, -0.003] },
      fine: true,
    });
    parts.push({
      id: `${f.prefix}-hair-r`,
      shape: 'cylinder',
      role: 'accent',
      pos: [f.pos[0] + 0.14 * f.scale, f.pos[1] + 1.0 * f.scale, f.pos[2] - 0.05 * f.scale],
      rot: [0.2, -0.1, 0.15],
      scale: [0.03 * f.scale, 0.35 * f.scale, 0.03 * f.scale],
      repeat: { count: 4, stepPos: [0.04 * f.scale, -0.05 * f.scale, -0.06 * f.scale], stepScale: [-0.003, -0.02, -0.003] },
      fine: true,
    });

    // 6. Trailing Ribbons:
    // Main structural dorsal ribbon with scaled plates
    parts.push({
      id: `${f.prefix}-ribbon-main`,
      shape: 'tube',
      role: 'body',
      pos: f.pos,
      rot: [0, f.rotY, 0],
      scale: [f.scale, f.scale, f.scale],
      skin: 'scales',
      silhouette: true,
      tube: {
        points: [
          [0, -0.45, -0.2],
          [-0.1, -0.75, -0.7],
          [0.1, -1.05, -1.4],
          [-0.05, -1.25, -2.1],
          [0, -1.35, -2.8],
        ],
        radiusStart: 0.2,
        radiusEnd: 0.04,
        aspect: 1.15,
        radiusProfile: [1.0, 0.85, 0.65, 0.45, 0.25],
        bumps: { amp: 0.02, freq: 2.8, seed: 303 },
        scales: { count: 55, size: [0.03, 0.05], seed: 404 },
      },
    });

    // Flank shimmering accent ribbon
    parts.push({
      id: `${f.prefix}-ribbon-flank`,
      shape: 'tube',
      role: 'accent',
      pos: f.pos,
      rot: [0, f.rotY, 0],
      scale: [f.scale, f.scale, f.scale],
      silhouette: true,
      tube: {
        points: [
          [0.12, -0.4, -0.15],
          [0.25, -0.7, -0.6],
          [0.32, -0.95, -1.2],
          [0.25, -1.15, -1.8],
          [0.12, -1.25, -2.4],
        ],
        radiusStart: 0.15,
        radiusEnd: 0.03,
        aspect: 1.1,
        radiusProfile: [1.0, 0.8, 0.6, 0.4, 0.2],
        bumps: { amp: 0.02, freq: 2.5, seed: 505 },
      },
    });

    // Ethereal veil streamer ribbon (shed at low detail tier)
    parts.push({
      id: `${f.prefix}-ribbon-veil`,
      shape: 'tube',
      role: 'accent',
      pos: f.pos,
      rot: [0, f.rotY, 0],
      scale: [f.scale, f.scale, f.scale],
      fine: true,
      tube: {
        points: [
          [-0.12, -0.4, -0.15],
          [-0.22, -0.65, -0.55],
          [-0.28, -0.9, -1.1],
          [-0.2, -1.1, -1.65],
          [-0.08, -1.2, -2.2],
        ],
        radiusStart: 0.12,
        radiusEnd: 0.02,
        aspect: 1.0,
        radiusProfile: [1.0, 0.8, 0.6, 0.4, 0.2],
      },
    });

    // Translucent ribbon fin membrane
    parts.push({
      id: `${f.prefix}-fin-membrane`,
      shape: 'membrane',
      role: 'membrane',
      pos: [f.pos[0], f.pos[1] - 0.7 * f.scale, f.pos[2] - 0.8 * f.scale],
      scale: [0.5 * f.scale, 0.6 * f.scale, 0.8 * f.scale],
      fine: true,
      polygon: [
        [0, 0.4],
        [0.35, 0.1],
        [0.25, -0.4],
        [-0.1, -0.3],
        [-0.25, 0.1],
      ],
    });
  }

  // 7. Shared Central Resonant Sonic Core
  parts.push({
    id: 'sirens-resonant-core',
    shape: 'octahedron',
    role: 'glow',
    pos: [0, -0.15, -0.2],
    scale: [0.55, 0.55, 0.55],
    grow: [1.0, 2.0],
    anim: { kind: 'pulse', speed: 2.4, amp: 0.22 },
  });

  // 8. Hypnotic Sound Wave Rings expanding outward
  parts.push(soundRing('sirens-ring-1', [0, -0.35, -0.2], 1.6, 0.025, 0.25, 1.8));
  parts.push(soundRing('sirens-ring-2', [0, -0.65, -0.5], 2.1, 0.025, 0.55, 1.5));
  parts.push(soundRing('sirens-ring-3', [0, -0.95, -0.9], 2.5, 0.025, 0.85, 1.2));

  // 9. Interlocking Abyssal Vortex Swirl Tubes (foundation)
  parts.push({
    id: 'sirens-vortex-l',
    shape: 'tube',
    role: 'body',
    pos: [0, 0, 0],
    scale: [1, 1, 1],
    skin: 'scales',
    silhouette: true,
    tube: {
      points: [
        [-1.8, -1.1, -0.3],
        [-1.2, -1.25, 0.5],
        [0.0, -1.35, 0.8],
        [1.2, -1.3, 0.4],
        [1.7, -1.2, -0.4],
      ],
      radiusStart: 0.18,
      radiusEnd: 0.12,
      aspect: 1.3,
      radiusProfile: [0.9, 1.1, 1.2, 1.0, 0.8],
      bumps: { amp: 0.02, freq: 2.0, seed: 707 },
      scales: { count: 70, size: [0.035, 0.055], seed: 808 },
    },
  });

  parts.push({
    id: 'sirens-vortex-r',
    shape: 'tube',
    role: 'accent',
    pos: [0, 0, 0],
    scale: [1, 1, 1],
    silhouette: true,
    tube: {
      points: [
        [1.8, -1.05, -0.5],
        [1.1, -1.2, -1.5],
        [-0.1, -1.3, -2.2],
        [-1.3, -1.25, -1.7],
        [-1.7, -1.15, -0.7],
      ],
      radiusStart: 0.16,
      radiusEnd: 0.1,
      aspect: 1.2,
      radiusProfile: [0.9, 1.1, 1.1, 1.0, 0.8],
      bumps: { amp: 0.02, freq: 2.0, seed: 909 },
    },
  });

  return parts;
}

export const sirensRecipe: CreatureRecipe = {
  id: 'archetype-sirens',
  family: 'spectral',
  palette: {
    body: '#162238',
    accent: '#70b2c4',
    metalness: 0.5,
    roughness: 0.3,
  },
  viewpoints: {
    head: { target: [0.0, 1.3, 0.55], distance: 2.2 },
    wing: { target: [0.0, -0.45, -0.4], distance: 3.4 }, // Points at detailed trailing ribbons & hypnotic vortex
  },
  parts: buildSirensParts(),
};
