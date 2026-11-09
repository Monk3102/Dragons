import { Part } from './types';

export type LookName = 'mild' | 'menacing' | 'ferocious';

/**
 * Converts dial ferocity (integer 1 to 10) to a normalized parameter t in [0, 1].
 */
export function ferocityToT(ferocity: number): number {
  if (isNaN(ferocity)) return 0;
  const clamped = Math.min(10, Math.max(1, ferocity));
  return (clamped - 1) / 9;
}

/**
 * Returns descriptive look name according to dial ferocity:
 * - 1 to 3: 'mild'
 * - 4 to 7: 'menacing'
 * - 8 to 10: 'ferocious'
 */
export function lookName(ferocity: number): LookName {
  const rounded = Math.round(ferocity);
  if (rounded <= 3) return 'mild';
  if (rounded <= 7) return 'menacing';
  return 'ferocious';
}

/**
 * Smooth Hermite interpolation (smoothstep) with continuous zero derivatives at bounds.
 */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Computes the scalar scale multiplier for a Part at normalized ferocity t (0 to 1),
 * smoothly combining grow and appearAt without jumps.
 */
export function partScaleMultiplier(part: Part, t: number): number {
  const clampedT = Math.min(1, Math.max(0, t));

  // 1. Growth multiplier across [0, 1]
  let growFactor = 1;
  if (part.grow) {
    growFactor = part.grow[0] + (part.grow[1] - part.grow[0]) * clampedT;
  }

  // 2. AppearAt multiplier: scales in from 0 to full over 0.15 of t starting at appearAt
  let appearFactor = 1;
  if (part.appearAt !== undefined) {
    const start = part.appearAt;
    const end = start + 0.15;
    if (clampedT <= start) {
      appearFactor = 0;
    } else if (clampedT >= end) {
      appearFactor = 1;
    } else {
      appearFactor = smoothstep(start, end, clampedT);
    }
  }

  return growFactor * appearFactor;
}

/**
 * Computes the final [x, y, z] scale for a Part at normalized ferocity t.
 */
export function partScale(part: Part, t: number): [number, number, number] {
  const mult = partScaleMultiplier(part, t);
  return [part.scale[0] * mult, part.scale[1] * mult, part.scale[2] * mult];
}
