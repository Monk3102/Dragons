import { CreatureRecipe, Part } from '../types';
import { hornPair, limbPair } from '../helpers';

/**
 * Dragon Recipe ('archetype-dragon')
 * Family: winged
 * 
 * Monumental Western dragon leviathan:
 * - Body: Deep chest, narrower waist, strong hip (three overlapping ellipsoids) with glowing chest core.
 * - Neck: Tapering tube in an S-curve curving forward to the cranium, with blade dorsal spikes.
 * - Head: Wedge snout, lower jaw, brow ridges, nostril bumps, glowing eyes, sweeping horns, cheek spikes.
 * - Tail: Gentle S-curve tapering tube with spade-shaped tip and blade spines diminishing along length.
 * - Wings: Shoulder-to-wrist arm tube, three finger bone tubes, and aerodynamic membrane polygons.
 * - Legs: Folded front legs with blade claws; muscular rear legs with thigh bulge, bent hock, 3-blade feet.
 * - Ferocity (t = 0 to 1):
 *   - Mild (1-3): Smooth body, compact horns, 8 dorsal spikes, half-folded wings, subdued core glow.
 *   - Menacing (4-7): Lengthened horns, 16 dorsal spikes, open wings, heightened glow.
 *   - Ferocious (8-10): Quad horns, ~28 spikes, exposed jaw blade teeth, extended claws, brilliant core, fully spread wings.
 */
export const dragonRecipe: CreatureRecipe = {
  id: 'archetype-dragon',
  family: 'winged',
  palette: {
    body: '#141824',
    accent: '#8b5a3c',
    metalness: 0.4,
    roughness: 0.6,
  },
  viewpoints: {
    head: { target: [0, 1.5, 1.8], distance: 2.2 },
    wing: { target: [1.8, 0.7, -0.3], distance: 3.0 },
  },
  parts: [
    // -------------------------------------------------------------------------
    // 1. Torso: Three overlapping ellipsoids & Glowing Core
    // -------------------------------------------------------------------------
    {
      id: 'dragon-chest',
      shape: 'sphere',
      role: 'body',
      pos: [0, 0.15, 0.35],
      scale: [1.35, 1.25, 1.3],
      skin: 'scales',
      texScale: [2, 4],
      silhouette: true,
    },
    {
      id: 'dragon-waist',
      shape: 'sphere',
      role: 'body',
      pos: [0, 0.1, -0.2],
      scale: [1.0, 0.95, 1.05],
      skin: 'scales',
      texScale: [2, 4],
      silhouette: true,
    },
    {
      id: 'dragon-hip',
      shape: 'sphere',
      role: 'body',
      pos: [0, 0.12, -0.85],
      scale: [1.15, 1.05, 1.15],
      skin: 'scales',
      texScale: [2, 4],
      silhouette: true,
    },
    {
      id: 'dragon-core',
      shape: 'octahedron',
      role: 'glow',
      pos: [0, 0.18, 0.42],
      scale: [0.55, 0.55, 0.55],
      grow: [1.0, 2.2],
      anim: { kind: 'pulse', speed: 2.2, amp: 0.18 },
    },

    // -------------------------------------------------------------------------
    // 2. Neck: S-curve tapering tube with dorsal blade spikes
    // -------------------------------------------------------------------------
    {
      id: 'dragon-neck',
      shape: 'tube',
      role: 'body',
      pos: [0, 0, 0],
      scale: [1, 1, 1],
      skin: 'scales',
      texScale: [2, 4],
      tube: {
        points: [
          [0, 0.45, 0.72],
          [0, 0.9, 1.05],
          [0, 1.25, 1.35],
          [0, 1.45, 1.68],
        ],
        radiusStart: 0.42,
        radiusEnd: 0.22,
        scales: {
          count: 320,
          size: [0.12, 0.18],
          seed: 42,
        },
      },
      silhouette: true,
    },
    {
      id: 'dragon-neck-spike-0',
      shape: 'blade',
      role: 'accent',
      pos: [0, 0.85, 0.92],
      rot: [-0.35, 0, 0],
      scale: [0.12, 0.32, 0.12],
      grow: [1.0, 1.8],
    },
    {
      id: 'dragon-neck-spike-1',
      shape: 'blade',
      role: 'accent',
      pos: [0, 1.08, 1.12],
      rot: [-0.35, 0, 0],
      scale: [0.12, 0.35, 0.12],
      grow: [1.0, 1.8],
    },
    {
      id: 'dragon-neck-spike-2',
      shape: 'blade',
      role: 'accent',
      pos: [0, 1.32, 1.32],
      rot: [-0.3, 0, 0],
      scale: [0.11, 0.32, 0.11],
      grow: [1.0, 1.8],
    },
    {
      id: 'dragon-neck-spike-3',
      shape: 'blade',
      role: 'accent',
      pos: [0, 1.52, 1.52],
      rot: [-0.25, 0, 0],
      scale: [0.1, 0.28, 0.1],
      grow: [1.0, 1.8],
    },

    // -------------------------------------------------------------------------
    // 3. Head: Cranium, Snout, Jaw, Brow, Nostrils, Eyes, Horns, Cheek Spikes, Teeth
    // -------------------------------------------------------------------------
    {
      id: 'dragon-snout',
      shape: 'cone',
      role: 'body',
      pos: [0, 1.48, 1.98],
      rot: [0.35, 0, 0],
      scale: [0.38, 0.65, 0.32],
      silhouette: true,
    },
    {
      id: 'dragon-jaw',
      shape: 'box',
      role: 'accent',
      pos: [0, 1.3, 1.9],
      rot: [0.08, 0, 0],
      scale: [0.3, 0.12, 0.58],
      silhouette: true,
    },

    // Brow ridges
    ...limbPair('dragon-brow', 'box', 'accent', [0.18, 1.6, 1.76], [0.12, 0.08, 0.32], [0.15, 0.2, -0.1], {
      silhouette: true,
    }),

    // Nostril bumps
    ...limbPair('dragon-nostril', 'sphere', 'body', [0.09, 1.55, 2.18], [0.06, 0.06, 0.06], undefined, {
      fine: true,
    }),

    // Glowing eyes (small glow parts)
    ...limbPair('dragon-eye', 'sphere', 'eye', [0.18, 1.52, 1.75], [0.07, 0.07, 0.07], undefined, {
      silhouette: true,
    }),

    // Long sweeping horns
    ...hornPair('dragon-horn', 'cone', 'accent', [0.3, 1.72, 1.5], [0.13, 0.95, 0.13], [-0.7, 0.22, 0.18], {
      grow: [1.0, 2.2],
      silhouette: true,
    }),

    // Cheek spikes
    ...hornPair('dragon-cheek', 'blade', 'accent', [0.26, 1.34, 1.68], [0.09, 0.36, 0.09], [-0.2, 0.7, 0], {
      fine: true,
    }),

    // Ferocious extra horns (appearAt: 0.7)
    ...hornPair('dragon-extra-horn', 'cone', 'accent', [0.2, 1.62, 1.38], [0.1, 0.7, 0.1], [-0.85, 0.15, 0.15], {
      appearAt: 0.7,
      grow: [1.0, 1.5],
      silhouette: true,
    }),

    // Ferocious lower jaw blade teeth (appearAt: 0.7)
    ...[
      [0.11, 1.78],
      [0.11, 1.86],
      [0.1, 1.94],
      [0.08, 2.02],
    ].flatMap(([x, z], i) => [
      { id: `dragon-tooth-l-${i}`, shape: 'blade' as const, role: 'accent' as const, pos: [x, 1.36, z] as [number, number, number], rot: [0.2, 0, 0] as [number, number, number], scale: [0.04, 0.1, 0.04] as [number, number, number], appearAt: 0.7, fine: true },
      { id: `dragon-tooth-r-${i}`, shape: 'blade' as const, role: 'accent' as const, pos: [-x, 1.36, z] as [number, number, number], rot: [0.2, 0, 0] as [number, number, number], scale: [0.04, 0.1, 0.04] as [number, number, number], appearAt: 0.7, fine: true },
    ]),

    // -------------------------------------------------------------------------
    // 4. Tail: Gentle S-curve tapering tube & Spade Tip
    // -------------------------------------------------------------------------
    {
      id: 'dragon-tail',
      shape: 'tube',
      role: 'body',
      pos: [0, 0, 0],
      scale: [1, 1, 1],
      skin: 'scales',
      texScale: [2, 4],
      tube: {
        points: [
          [0, 0.15, -1.2],
          [0, 0.02, -1.8],
          [0, 0.12, -2.45],
          [0, 0.22, -3.1],
        ],
        radiusStart: 0.38,
        radiusEnd: 0.06,
        scales: {
          count: 420,
          size: [0.11, 0.16],
          seed: 88,
        },
      },
      anim: { kind: 'sway', speed: 1.6, amp: 0.22 },
      silhouette: true,
    },
    ...hornPair('dragon-tail-spade', 'blade', 'accent', [0.15, 0.22, -3.15], [0.12, 0.45, 0.22], [0, 0, 0.8], {
      silhouette: true,
    }),

    // -------------------------------------------------------------------------
    // 5. Dorsal Spikes (8 Mild base, 8 Menacing extra, 12 Ferocious tail)
    // -------------------------------------------------------------------------
    ...[
      [0.72, 0.3, 0.14, 0.42], [0.68, 0.0, 0.14, 0.4], [0.65, -0.3, 0.13, 0.38],
      [0.62, -0.6, 0.13, 0.36], [0.58, -0.9, 0.12, 0.34], [0.48, -1.2, 0.11, 0.32],
      [0.38, -1.5, 0.1, 0.3], [0.28, -1.8, 0.09, 0.28],
    ].map(([y, z, w, h], i) => ({
      id: `dragon-spine-${i}`, shape: 'blade' as const, role: 'accent' as const,
      pos: [0, y, z] as [number, number, number], rot: [-0.35, 0, 0] as [number, number, number],
      scale: [w, h, w] as [number, number, number], grow: [1.0, 2.0] as [number, number],
    })),

    ...[
      [0.7, 0.15, 0.12, 0.36], [0.66, -0.15, 0.12, 0.34], [0.63, -0.45, 0.11, 0.32],
      [0.6, -0.75, 0.11, 0.3], [0.52, -1.05, 0.1, 0.28], [0.42, -1.35, 0.09, 0.26],
      [0.32, -1.65, 0.08, 0.24], [0.24, -1.95, 0.07, 0.22],
    ].map(([y, z, w, h], i) => ({
      id: `dragon-menace-spine-${i}`, shape: 'blade' as const, role: 'accent' as const,
      pos: [0, y, z] as [number, number, number], rot: [-0.38, 0, 0] as [number, number, number],
      scale: [w, h, w] as [number, number, number], appearAt: 0.35, grow: [1.0, 1.6] as [number, number], fine: true,
    })),

    ...[
      [0.22, -2.1, 0.07, 0.22], [0.21, -2.2, 0.07, 0.21], [0.2, -2.3, 0.06, 0.2],
      [0.19, -2.4, 0.06, 0.19], [0.19, -2.5, 0.06, 0.18], [0.2, -2.6, 0.05, 0.17],
      [0.21, -2.7, 0.05, 0.16], [0.22, -2.8, 0.05, 0.15], [0.23, -2.9, 0.04, 0.14],
      [0.24, -3.0, 0.04, 0.13], [0.25, -3.05, 0.04, 0.12], [0.25, -3.1, 0.03, 0.11],
    ].map(([y, z, w, h], i) => ({
      id: `dragon-ferocious-spine-${i}`, shape: 'blade' as const, role: 'accent' as const,
      pos: [0, y, z] as [number, number, number], rot: [-0.4, 0, 0] as [number, number, number],
      scale: [w, h, w] as [number, number, number], appearAt: 0.7, grow: [1.0, 1.4] as [number, number], fine: true,
    })),

    // -------------------------------------------------------------------------
    // 6. Wings: Bilateral Arm Tubes, 3 Finger Bone Tubes, Membrane Polygons
    // -------------------------------------------------------------------------
    // Left wing arm tube
    {
      id: 'dragon-wing-arm-l',
      shape: 'tube',
      role: 'body',
      pos: [0, 0, 0],
      scale: [1, 1, 1],
      tube: {
        points: [
          [0.65, 0.5, 0.35],
          [1.25, 0.85, 0.05],
          [1.75, 0.68, -0.28],
        ],
        radiusStart: 0.15,
        radiusEnd: 0.08,
      },
      grow: [0.85, 1.25],
      anim: { kind: 'flap', speed: 1.8, amp: 0.24, phase: 0 },
      silhouette: true,
    },
    // Right wing arm tube
    {
      id: 'dragon-wing-arm-r',
      shape: 'tube',
      role: 'body',
      pos: [0, 0, 0],
      scale: [1, 1, 1],
      tube: {
        points: [
          [-0.65, 0.5, 0.35],
          [-1.25, 0.85, 0.05],
          [-1.75, 0.68, -0.28],
        ],
        radiusStart: 0.15,
        radiusEnd: 0.08,
      },
      grow: [0.85, 1.25],
      anim: { kind: 'flap', speed: 1.8, amp: 0.24, phase: Math.PI },
      silhouette: true,
    },

    // Left wing 3 finger bone tubes
    {
      id: 'dragon-wing-finger1-l',
      shape: 'tube',
      role: 'accent',
      pos: [0, 0, 0],
      scale: [1, 1, 1],
      tube: {
        points: [
          [1.75, 0.68, -0.28],
          [2.1, 1.05, -0.42],
          [2.35, 1.28, -0.62],
        ],
        radiusStart: 0.07,
        radiusEnd: 0.02,
      },
      grow: [0.85, 1.25],
      anim: { kind: 'flap', speed: 1.8, amp: 0.24, phase: 0 },
      silhouette: true,
    },
    {
      id: 'dragon-wing-finger2-l',
      shape: 'tube',
      role: 'accent',
      pos: [0, 0, 0],
      scale: [1, 1, 1],
      tube: {
        points: [
          [1.75, 0.68, -0.28],
          [2.15, 0.58, -0.58],
          [2.4, 0.42, -0.92],
        ],
        radiusStart: 0.07,
        radiusEnd: 0.02,
      },
      grow: [0.85, 1.25],
      anim: { kind: 'flap', speed: 1.8, amp: 0.24, phase: 0 },
      silhouette: true,
    },
    {
      id: 'dragon-wing-finger3-l',
      shape: 'tube',
      role: 'accent',
      pos: [0, 0, 0],
      scale: [1, 1, 1],
      tube: {
        points: [
          [1.75, 0.68, -0.28],
          [1.9, 0.22, -0.52],
          [1.92, -0.15, -0.78],
        ],
        radiusStart: 0.07,
        radiusEnd: 0.02,
      },
      grow: [0.85, 1.25],
      anim: { kind: 'flap', speed: 1.8, amp: 0.24, phase: 0 },
      silhouette: true,
    },

    // Right wing 3 finger bone tubes
    {
      id: 'dragon-wing-finger1-r',
      shape: 'tube',
      role: 'accent',
      pos: [0, 0, 0],
      scale: [1, 1, 1],
      tube: {
        points: [
          [-1.75, 0.68, -0.28],
          [-2.1, 1.05, -0.42],
          [-2.35, 1.28, -0.62],
        ],
        radiusStart: 0.07,
        radiusEnd: 0.02,
      },
      grow: [0.85, 1.25],
      anim: { kind: 'flap', speed: 1.8, amp: 0.24, phase: Math.PI },
      silhouette: true,
    },
    {
      id: 'dragon-wing-finger2-r',
      shape: 'tube',
      role: 'accent',
      pos: [0, 0, 0],
      scale: [1, 1, 1],
      tube: {
        points: [
          [-1.75, 0.68, -0.28],
          [-2.15, 0.58, -0.58],
          [-2.4, 0.42, -0.92],
        ],
        radiusStart: 0.07,
        radiusEnd: 0.02,
      },
      grow: [0.85, 1.25],
      anim: { kind: 'flap', speed: 1.8, amp: 0.24, phase: Math.PI },
      silhouette: true,
    },
    {
      id: 'dragon-wing-finger3-r',
      shape: 'tube',
      role: 'accent',
      pos: [0, 0, 0],
      scale: [1, 1, 1],
      tube: {
        points: [
          [-1.75, 0.68, -0.28],
          [-1.9, 0.22, -0.52],
          [-1.92, -0.15, -0.78],
        ],
        radiusStart: 0.07,
        radiusEnd: 0.02,
      },
      grow: [0.85, 1.25],
      anim: { kind: 'flap', speed: 1.8, amp: 0.24, phase: Math.PI },
      silhouette: true,
    },

    // Wing membrane polygons
    {
      id: 'dragon-wing-membrane-l',
      shape: 'membrane',
      role: 'membrane',
      pos: [1.75, 0.68, -0.28],
      rot: [0.15, 0, -0.1],
      scale: [1, 1, 1],
      polygon: [
        [0, 0],
        [0.6, 0.6],
        [0.65, -0.25],
        [0.17, -0.82],
        [-1.1, -0.68],
      ],
      grow: [0.85, 1.25],
      anim: { kind: 'flap', speed: 1.8, amp: 0.24, phase: 0 },
      silhouette: true,
    },
    {
      id: 'dragon-wing-membrane-r',
      shape: 'membrane',
      role: 'membrane',
      pos: [-1.75, 0.68, -0.28],
      rot: [0.15, 0, 0.1],
      scale: [1, 1, 1],
      polygon: [
        [0, 0],
        [-0.6, 0.6],
        [-0.65, -0.25],
        [-0.17, -0.82],
        [1.1, -0.68],
      ],
      grow: [0.85, 1.25],
      anim: { kind: 'flap', speed: 1.8, amp: 0.24, phase: Math.PI },
      silhouette: true,
    },

    // -------------------------------------------------------------------------
    // 7. Legs: Front Folded Legs & Strong Rear Legs with Hock and Blade Claws
    // -------------------------------------------------------------------------
    // Front left leg & claws
    { id: 'dragon-leg-fl-upper', shape: 'cylinder', role: 'body', pos: [0.55, -0.15, 0.45], rot: [0.5, 0, 0.1], scale: [0.18, 0.45, 0.18], silhouette: true },
    { id: 'dragon-leg-fl-lower', shape: 'cylinder', role: 'body', pos: [0.5, -0.42, 0.58], rot: [-0.4, 0, 0], scale: [0.14, 0.38, 0.14], silhouette: true },
    { id: 'dragon-claw-fl-1', shape: 'blade', role: 'accent', pos: [0.45, -0.58, 0.7], rot: [0.5, 0, 0], scale: [0.08, 0.2, 0.08], grow: [1.0, 1.8], silhouette: true },
    { id: 'dragon-claw-fl-2', shape: 'blade', role: 'accent', pos: [0.55, -0.58, 0.68], rot: [0.5, 0.2, 0], scale: [0.08, 0.2, 0.08], grow: [1.0, 1.8], silhouette: true },

    // Front right leg & claws
    { id: 'dragon-leg-fr-upper', shape: 'cylinder', role: 'body', pos: [-0.55, -0.15, 0.45], rot: [0.5, 0, -0.1], scale: [0.18, 0.45, 0.18], silhouette: true },
    { id: 'dragon-leg-fr-lower', shape: 'cylinder', role: 'body', pos: [-0.5, -0.42, 0.58], rot: [-0.4, 0, 0], scale: [0.14, 0.38, 0.14], silhouette: true },
    { id: 'dragon-claw-fr-1', shape: 'blade', role: 'accent', pos: [-0.45, -0.58, 0.7], rot: [0.5, 0, 0], scale: [0.08, 0.2, 0.08], grow: [1.0, 1.8], silhouette: true },
    { id: 'dragon-claw-fr-2', shape: 'blade', role: 'accent', pos: [-0.55, -0.58, 0.68], rot: [0.5, -0.2, 0], scale: [0.08, 0.2, 0.08], grow: [1.0, 1.8], silhouette: true },

    // Rear left leg (thigh bulge, bent hock, 3-blade foot)
    { id: 'dragon-thigh-rl', shape: 'sphere', role: 'body', pos: [0.72, 0.1, -0.72], scale: [0.42, 0.6, 0.48], silhouette: true },
    { id: 'dragon-hock-rl', shape: 'cylinder', role: 'body', pos: [0.76, -0.32, -0.85], rot: [-0.3, 0, 0], scale: [0.18, 0.5, 0.18], silhouette: true },
    { id: 'dragon-claw-rl-1', shape: 'blade', role: 'accent', pos: [0.7, -0.58, -0.72], rot: [0.4, -0.2, 0], scale: [0.08, 0.22, 0.08], grow: [1.0, 1.8], silhouette: true },
    { id: 'dragon-claw-rl-2', shape: 'blade', role: 'accent', pos: [0.78, -0.58, -0.7], rot: [0.4, 0, 0], scale: [0.08, 0.22, 0.08], grow: [1.0, 1.8], silhouette: true },
    { id: 'dragon-claw-rl-3', shape: 'blade', role: 'accent', pos: [0.85, -0.58, -0.72], rot: [0.4, 0.2, 0], scale: [0.08, 0.22, 0.08], grow: [1.0, 1.8], silhouette: true },

    // Rear right leg (thigh bulge, bent hock, 3-blade foot)
    { id: 'dragon-thigh-rr', shape: 'sphere', role: 'body', pos: [-0.72, 0.1, -0.72], scale: [0.42, 0.6, 0.48], silhouette: true },
    { id: 'dragon-hock-rr', shape: 'cylinder', role: 'body', pos: [-0.76, -0.32, -0.85], rot: [-0.3, 0, 0], scale: [0.18, 0.5, 0.18], silhouette: true },
    { id: 'dragon-claw-rr-1', shape: 'blade', role: 'accent', pos: [-0.7, -0.58, -0.72], rot: [0.4, 0.2, 0], scale: [0.08, 0.22, 0.08], grow: [1.0, 1.8], silhouette: true },
    { id: 'dragon-claw-rr-2', shape: 'blade', role: 'accent', pos: [-0.78, -0.58, -0.7], rot: [0.4, 0, 0], scale: [0.08, 0.22, 0.08], grow: [1.0, 1.8], silhouette: true },
    { id: 'dragon-claw-rr-3', shape: 'blade', role: 'accent', pos: [-0.85, -0.58, -0.72], rot: [0.4, -0.2, 0], scale: [0.08, 0.22, 0.08], grow: [1.0, 1.8], silhouette: true },
  ],
};
