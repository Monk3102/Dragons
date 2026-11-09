import { CreatureRecipe } from './types';
import { dragonRecipe } from './recipes/dragon';
import { trollRecipe } from './recipes/troll';
import { hydraRecipe } from './recipes/hydra';

/**
 * Fallback generic placeholder creature recipe:
 * A simple floating glowing core orb surrounded by a resonant ring and crystalline spikes.
 * Guaranteed to render safely for any archetype that does not yet have a custom model.
 */
export const PLACEHOLDER_RECIPE: CreatureRecipe = {
  id: '__placeholder__',
  family: 'spectral',
  palette: {
    body: '#12141a',
    accent: '#c5a059',
    metalness: 0.6,
    roughness: 0.4,
  },
  parts: [
    // Central Resonant Core
    {
      id: 'placeholder-core',
      shape: 'octahedron',
      role: 'glow',
      pos: [0, 0, 0],
      scale: [0.6, 0.6, 0.6],
      grow: [1.0, 1.6],
      anim: { kind: 'pulse', speed: 2.0, amp: 0.15 },
    },
    // Floating Primary Orb Shell
    {
      id: 'placeholder-orb',
      shape: 'sphere',
      role: 'body',
      pos: [0, 0, 0],
      scale: [0.95, 0.95, 0.95],
      opacity: 0.85,
    },
    // Equatorial Resonant Halo Ring
    {
      id: 'placeholder-ring',
      shape: 'torus',
      role: 'accent',
      pos: [0, 0, 0],
      rot: [Math.PI / 2, 0, 0],
      scale: [1.35, 1.35, 0.08],
      anim: { kind: 'spin', speed: 0.5, amp: 1.0 },
    },
    // Top & Bottom Spire Crystals
    {
      id: 'placeholder-spire-top',
      shape: 'cone',
      role: 'accent',
      pos: [0, 1.15, 0],
      rot: [0, 0, 0],
      scale: [0.18, 0.6, 0.18],
      grow: [1.0, 1.5],
    },
    {
      id: 'placeholder-spire-bottom',
      shape: 'cone',
      role: 'accent',
      pos: [0, -1.15, 0],
      rot: [Math.PI, 0, 0],
      scale: [0.18, 0.6, 0.18],
      grow: [1.0, 1.5],
    },
  ],
};

/**
 * Registry of canonical creature recipes keyed by archetype id.
 */
export const RECIPES: Record<string, CreatureRecipe> = {
  [dragonRecipe.id]: dragonRecipe,
  [trollRecipe.id]: trollRecipe,
  [hydraRecipe.id]: hydraRecipe,
};

/**
 * Checks if a verified custom 3D model recipe exists for the given archetype ID.
 */
export function hasRecipe(id: string | undefined | null): boolean {
  if (!id) return false;
  return Boolean(RECIPES[id]);
}

/**
 * Retrieves the recipe for an archetype, falling back to the generic placeholder recipe.
 */
export function getRecipe(id: string | undefined | null): CreatureRecipe {
  if (id && RECIPES[id]) {
    return RECIPES[id];
  }
  return PLACEHOLDER_RECIPE;
}
