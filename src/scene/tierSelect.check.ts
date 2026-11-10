/**
 * src/scene/tierSelect.check.ts
 * Self-check suite for pickNearest and tier selection logic.
 * Run with: npx tsx src/scene/tierSelect.check.ts
 */

import { pickNearest, evaluateTier, DISTANCE_ULTRA_THRESHOLD, DISTANCE_HIGH_THRESHOLD, HYSTERESIS_BUFFER } from './tierSelect';
import { DetailTier } from '../creatures/types';

function assert(condition: boolean, msg: string): void {
  if (!condition) {
    console.error(`[FAIL] ${msg}`);
    process.exit(1);
  }
}

console.log('=== Running Tier Select Self-Check Suite ===');

// Reference implementation using sort for validation
function referencePickNearest(
  ids: readonly string[],
  distances: readonly number[],
  count: number,
  limit: number
): string[] {
  const candidates: { id: string; d: number }[] = [];
  for (let i = 0; i < ids.length; i++) {
    if (distances[i] < limit) {
      candidates.push({ id: ids[i], d: distances[i] });
    }
  }
  candidates.sort((a, b) => {
    if (a.d !== b.d) return a.d - b.d;
    return a.id.localeCompare(b.id);
  });
  return candidates.slice(0, count).map((c) => c.id);
}

// 1. Empty list
{
  const out = ['stale_1', 'stale_2'];
  const written = pickNearest([], [], 2, 40, out);
  assert(written === 0, 'empty list should write 0');
  assert(out[0] === '' && out[1] === '', 'empty list clears output array');
  console.log('[PASS] empty list returns 0 and clears output array');
}

// 2. Limit excluding everyone
{
  const ids = ['m1', 'm2', 'm3'];
  const dists = [50, 60, 70];
  const out = ['stale_1', 'stale_2'];
  const written = pickNearest(ids, dists, 2, 40, out);
  assert(written === 0, 'limit excluding all should return 0');
  assert(out[0] === '' && out[1] === '', 'limit excluding all clears out array');
  console.log('[PASS] limit excluding everyone returns 0 and clears stale entries');
}

// 3. Count larger than number of monsters
{
  const ids = ['m1'];
  const dists = [20];
  const out = ['x', 'y', 'z'];
  const written = pickNearest(ids, dists, 5, 40, out);
  assert(written === 1, 'count larger than pool returns actual count');
  assert(out[0] === 'm1' && out[1] === '' && out[2] === '', 'extra slots cleared');
  console.log('[PASS] count larger than monsters handles correctly without stale entries');
}

// 4. Deterministic tie breaking by ID
{
  const ids = ['dragon-b', 'dragon-a', 'dragon-c'];
  const dists = [25, 25, 25];
  const out = ['', ''];
  const written = pickNearest(ids, dists, 2, 40, out);
  assert(written === 2, 'two written');
  assert(out[0] === 'dragon-a' && out[1] === 'dragon-b', 'ties broken by id alphabetically');
  console.log('[PASS] distance ties broken deterministically by string ID');
}

// 5. Output array reused between calls without stale entries
{
  const out = ['stale_a', 'stale_b', 'stale_c'];
  const ids1 = ['m1', 'm2'];
  const dists1 = [10, 15];
  let written = pickNearest(ids1, dists1, 2, 40, out);
  assert(written === 2 && out[0] === 'm1' && out[1] === 'm2' && out[2] === '', 'call 1 writes 2');

  const ids2 = ['m9'];
  const dists2 = [5];
  written = pickNearest(ids2, dists2, 2, 40, out);
  assert(written === 1 && out[0] === 'm9' && out[1] === '', 'call 2 overwrites and clears slot 1');
  console.log('[PASS] output array reused between calls without stale entries');
}

// 6. 1,000 random calls matching simple reference implementation
{
  const testOut = new Array(5).fill('');
  for (let trial = 0; trial < 1000; trial++) {
    const numMonsters = Math.floor(Math.random() * 20);
    const ids: string[] = [];
    const dists: number[] = [];
    for (let i = 0; i < numMonsters; i++) {
      ids.push(`monster_${i}_${(Math.random() * 1000) | 0}`);
      dists.push(Math.round(Math.random() * 120 * 10) / 10);
    }
    const count = 1 + Math.floor(Math.random() * 4);
    const limit = 10 + Math.random() * 80;

    const ref = referencePickNearest(ids, dists, count, limit);
    const written = pickNearest(ids, dists, count, limit, testOut);

    assert(written === ref.length, `trial ${trial}: length match (${written} vs ${ref.length})`);
    for (let k = 0; k < written; k++) {
      assert(testOut[k] === ref[k], `trial ${trial} item ${k} match: ${testOut[k]} vs ${ref[k]}`);
    }
    for (let k = written; k < testOut.length; k++) {
      assert(testOut[k] === '', `trial ${trial} slot ${k} beyond written is cleared`);
    }
  }
  console.log('[PASS] 1,000 random calls match reference implementation exactly');
}

// 7. evaluateTier hysteresis logic
{
  // Ultra -> High with hysteresis buffer
  let tier: DetailTier = evaluateTier('ultra', 43, false, false);
  assert(tier === 'high', 'ultra drops to high when not top candidate');

  tier = evaluateTier('ultra', 45, true, false);
  assert(tier === 'high', 'ultra drops to high when dist > 44 (40 + buffer 4)');

  tier = evaluateTier('high', 35, true, false);
  assert(tier === 'ultra', 'high rises to ultra when top candidate and dist < 36 (40 - buffer 4)');

  tier = evaluateTier('high', 38, true, false);
  assert(tier === 'high', 'high stays high if dist is 38 (between 36 and 44)');

  tier = evaluateTier('high', 95, false, false);
  assert(tier === 'low', 'high drops to low when dist > 94 (90 + buffer 4)');

  tier = evaluateTier('low', 85, false, false);
  assert(tier === 'high', 'low rises to high when dist < 86 (90 - buffer 4)');

  // Selected monster is always ultra
  tier = evaluateTier('low', 120, false, true);
  assert(tier === 'ultra', 'selected monster is always ultra regardless of distance');

  // Low power mode caps at high
  tier = evaluateTier('high', 20, true, false, DISTANCE_ULTRA_THRESHOLD, DISTANCE_HIGH_THRESHOLD, HYSTERESIS_BUFFER, true);
  assert(tier === 'high', 'low-power cap prevents ultra even if within distance');
  console.log('[PASS] evaluateTier handles hysteresis, selection, and low-power caps correctly');
}

console.log('Results: all tierSelect checks passed.');
