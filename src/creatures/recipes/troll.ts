import { CreatureRecipe } from '../types';
import { limbPair, hornPair, spikeRow } from '../helpers';

/**
 * Troll Recipe ('archetype-troll')
 * Family: humanoid
 * Heavy, hunched behemoth with massive arms, crushing fists, low-set skull, and curving tusks.
 * Ferocity effects: tusks and heavy brow ridge grow, shoulder spikes appear, ember eyes brighten.
 */
export const trollRecipe: CreatureRecipe = {
  id: 'archetype-troll',
  family: 'humanoid',
  palette: {
    body: '#1b1e23',
    accent: '#4a3b32',
    metalness: 0.25,
    roughness: 0.8,
  },
  parts: [
    // 1. Hunched Torso & Abdomen
    {
      id: 'troll-chest',
      shape: 'box',
      role: 'body',
      pos: [0, 0.4, 0.1],
      rot: [0.25, 0, 0],
      scale: [1.8, 1.4, 1.3],
    },
    {
      id: 'troll-abdomen',
      shape: 'cylinder',
      role: 'body',
      pos: [0, -0.4, 0],
      scale: [1.1, 0.9, 1.0],
    },

    // 2. Glowing Internal Core
    {
      id: 'troll-core',
      shape: 'octahedron',
      role: 'glow',
      pos: [0, 0.35, 0.45],
      scale: [0.45, 0.45, 0.45],
      grow: [1.0, 1.7],
      anim: { kind: 'pulse', speed: 1.8, amp: 0.15 },
    },

    // 3. Low-set Skull & Brow
    {
      id: 'troll-head',
      shape: 'box',
      role: 'body',
      pos: [0, 0.95, 0.65],
      rot: [0.15, 0, 0],
      scale: [0.75, 0.65, 0.75],
    },
    {
      id: 'troll-brow',
      shape: 'box',
      role: 'accent',
      pos: [0, 1.15, 0.85],
      scale: [0.82, 0.18, 0.35],
      grow: [1.0, 1.9],
    },

    // 4. Ember Eyes (glow and scale with ferocity)
    {
      id: 'troll-eye-l',
      shape: 'sphere',
      role: 'glow',
      pos: [0.22, 1.0, 0.95],
      scale: [0.08, 0.08, 0.08],
      grow: [1.0, 2.2],
    },
    {
      id: 'troll-eye-r',
      shape: 'sphere',
      role: 'glow',
      pos: [-0.22, 1.0, 0.95],
      scale: [0.08, 0.08, 0.08],
      grow: [1.0, 2.2],
    },

    // 5. Upward Curving Tusks (prominent growth with ferocity)
    ...hornPair('troll-tusks', 'cone', 'accent', [0.28, 0.85, 0.9], [0.12, 0.5, 0.12], [0.6, 0.2, -0.1], {
      grow: [1.0, 2.4],
    }),

    // 6. Colossal Arms & Forearms
    ...limbPair('troll-upper-arms', 'cylinder', 'body', [1.25, 0.35, 0.1], [0.4, 1.1, 0.4], [0.1, 0, -0.4], {
      anim: { kind: 'sway', speed: 1.2, amp: 0.12 },
    }),
    ...limbPair('troll-forearms', 'box', 'body', [1.5, -0.6, 0.25], [0.55, 1.2, 0.55], [-0.2, 0, -0.15], {
      anim: { kind: 'sway', speed: 1.2, amp: 0.14 },
    }),
    ...limbPair('troll-fists', 'box', 'accent', [1.55, -1.3, 0.4], [0.65, 0.65, 0.65], [0, 0, 0]),

    // 7. Heavy Stumpy Legs
    ...limbPair('troll-legs', 'cylinder', 'body', [0.55, -1.2, -0.1], [0.45, 1.0, 0.45], [0, 0, 0.05]),

    // 8. Ferocious Shoulder Spikes (appear at t >= 0.4)
    ...spikeRow('troll-shoulder-spikes-l', 3, [0.7, 0.95, 0.0], [0.25, -0.05, -0.1], [0.15, 0.45, 0.15], {
      rot: [-0.3, 0.2, -0.5],
      appearAt: 0.4,
      grow: [1.0, 1.8],
      fine: true,
    }),
    ...spikeRow('troll-shoulder-spikes-r', 3, [-0.7, 0.95, 0.0], [-0.25, -0.05, -0.1], [0.15, 0.45, 0.15], {
      rot: [-0.3, -0.2, 0.5],
      appearAt: 0.4,
      grow: [1.0, 1.8],
      fine: true,
    }),
  ],
};
