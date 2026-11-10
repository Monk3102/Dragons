/**
 * src/scene/tierSelect.ts
 * Pure, allocation-free tier selection and nearest-monster query.
 * No Three.js or React imports.
 */

import { DetailTier } from '../creatures/types';

export const DISTANCE_ULTRA_THRESHOLD = 40;
export const DISTANCE_HIGH_THRESHOLD = 90;
export const HYSTERESIS_BUFFER = 4;
export const CHECK_FRAME_INTERVAL = 15;
export const MAX_ULTRA_NEAREST = 2;

// Fixed internal buffer for distance tracking of sorted candidates in pickNearest
const internalDistances = new Float64Array(16);

/**
 * Single-pass linear selection of the nearest `count` ids with distance < `limit`.
 * Writes up to `count` ids into `out` and returns the number of written items.
 *
 * Rules:
 * - Does not allocate any arrays, objects, or closures.
 * - Distance ties are broken deterministically by string comparison of ids.
 * - `out` entries beyond the returned length are cleared to empty strings to avoid stale reads.
 */
export function pickNearest(
  ids: readonly string[],
  distances: readonly number[],
  count: number,
  limit: number,
  out: string[]
): number {
  if (count <= 0 || ids.length === 0) {
    for (let i = 0; i < out.length; i++) {
      out[i] = '';
    }
    return 0;
  }

  const k = Math.min(count, ids.length, out.length, internalDistances.length);
  let written = 0;

  for (let i = 0; i < ids.length; i++) {
    const d = distances[i];
    if (d >= limit) {
      continue;
    }

    const id = ids[i];

    // Find insertion index in currently written items
    let insertIdx = written;
    for (let j = 0; j < written; j++) {
      const existingDist = internalDistances[j];
      const existingId = out[j];
      if (d < existingDist || (d === existingDist && id.localeCompare(existingId) < 0)) {
        insertIdx = j;
        break;
      }
    }

    if (insertIdx < k) {
      // Shift elements down to make room
      const shiftEnd = written < k ? written : k - 1;
      for (let s = shiftEnd; s > insertIdx; s--) {
        out[s] = out[s - 1];
        internalDistances[s] = internalDistances[s - 1];
      }
      out[insertIdx] = id;
      internalDistances[insertIdx] = d;
      if (written < k) {
        written++;
      }
    }
  }

  // Clear remaining elements in `out`
  for (let i = written; i < out.length; i++) {
    out[i] = '';
  }

  return written;
}

/**
 * Evaluates detail tier transition with hysteresis.
 * Pure logic function without allocations.
 */
export function evaluateTier(
  currentTier: DetailTier,
  distance: number,
  isTopCandidate: boolean,
  isSelected: boolean,
  ultraThreshold = DISTANCE_ULTRA_THRESHOLD,
  highThreshold = DISTANCE_HIGH_THRESHOLD,
  hysteresis = HYSTERESIS_BUFFER,
  capAtHigh = false
): DetailTier {
  if (capAtHigh) {
    if (currentTier === 'ultra') return 'high';
    if (currentTier === 'high') {
      return distance > highThreshold + hysteresis ? 'low' : 'high';
    }
    return distance < highThreshold - hysteresis ? 'high' : 'low';
  }

  if (isSelected) {
    return 'ultra';
  }

  if (currentTier === 'ultra') {
    if (!isTopCandidate || distance > ultraThreshold + hysteresis) {
      return distance > highThreshold + hysteresis ? 'low' : 'high';
    }
    return 'ultra';
  }

  if (currentTier === 'high') {
    if (isTopCandidate && distance < ultraThreshold - hysteresis) {
      return 'ultra';
    }
    if (distance > highThreshold + hysteresis) {
      return 'low';
    }
    return 'high';
  }

  // currentTier === 'low'
  if (isTopCandidate && distance < ultraThreshold - hysteresis) {
    return 'ultra';
  }
  if (distance < highThreshold - hysteresis) {
    return 'high';
  }
  return 'low';
}

/**
 * Module-level state & preallocated buffers for zero-allocation distance tracking.
 */
const MAX_MONSTERS = 64;
const pooledIds: string[] = new Array(MAX_MONSTERS).fill('');
const pooledDistances: number[] = new Float64Array(MAX_MONSTERS) as unknown as number[];
const pooledNearest: string[] = new Array(MAX_ULTRA_NEAREST).fill('');

let lastFrameComputed = -1;
let registeredCount = 0;
let nearestCount = 0;

export function recordMonsterDistance(id: string, dist: number): void {
  for (let i = 0; i < registeredCount; i++) {
    if (pooledIds[i] === id) {
      pooledDistances[i] = dist;
      return;
    }
  }
  if (registeredCount < MAX_MONSTERS) {
    pooledIds[registeredCount] = id;
    pooledDistances[registeredCount] = dist;
    registeredCount++;
  }
}

export function unregisterMonster(id: string): void {
  for (let i = 0; i < registeredCount; i++) {
    if (pooledIds[i] === id) {
      const last = registeredCount - 1;
      pooledIds[i] = pooledIds[last];
      pooledDistances[i] = pooledDistances[last];
      pooledIds[last] = '';
      pooledDistances[last] = 0;
      registeredCount--;
      lastFrameComputed = -1;
      return;
    }
  }
}

/**
 * Computes nearest ultra candidates once per frame interval across all monsters.
 */
export function updateNearestUltraCache(frameNumber: number, ultraLimit = DISTANCE_ULTRA_THRESHOLD): void {
  if (frameNumber === lastFrameComputed) {
    return;
  }
  lastFrameComputed = frameNumber;
  nearestCount = pickNearest(
    pooledIds.slice(0, registeredCount),
    pooledDistances.slice(0, registeredCount),
    MAX_ULTRA_NEAREST,
    ultraLimit,
    pooledNearest
  );
}

export function isMonsterInUltraCache(id: string): boolean {
  for (let i = 0; i < nearestCount; i++) {
    if (pooledNearest[i] === id) return true;
  }
  return false;
}
