import {
  describeEntry,
  ageInDays,
  trendSinceSpawn,
  getDialDirection,
  formatDateTime,
} from './journeyFormat';
import { JourneyEntry } from '../types';

let passedCount = 0;
let failedCount = 0;

function runTest(name: string, fn: () => boolean) {
  try {
    const passed = fn();
    if (passed) {
      console.log(`[PASS] ${name}`);
      passedCount++;
    } else {
      console.error(`[FAIL] ${name}`);
      failedCount++;
    }
  } catch (err) {
    console.error(`[FAIL] ${name} threw error:`, err);
    failedCount++;
  }
}

console.log('=== Running Journey Format Logic Check Suite ===\n');

// 1. First entry has no changes
runTest('first entry has no changes', () => {
  const spawnEntry: JourneyEntry = {
    id: 'e1',
    at: '2026-03-01T10:00:00.000Z',
    kind: 'spawn',
    size: 7,
    distance: 3,
    ferocity: 6,
    note: 'Initial spawn note',
  };

  const descWithoutPrev = describeEntry(spawnEntry);
  if (descWithoutPrev.label !== 'Spawned') return false;
  if (descWithoutPrev.changes.length !== 0) return false;

  const descWithUndefined = describeEntry(spawnEntry, undefined);
  if (descWithUndefined.changes.length !== 0) return false;

  return true;
});

// 2. The direction rule for each of the three dials in both directions
runTest('the direction rule for each of the three dials in both directions', () => {
  // Size: down is easing, up is worsening
  const sizeDown = getDialDirection('size', 8, 5);
  const sizeUp = getDialDirection('size', 4, 7);
  if (sizeDown !== 'easing' || sizeUp !== 'worsening') {
    console.error(`Size direction failed: down=${sizeDown}, up=${sizeUp}`);
    return false;
  }

  // Distance: up is easing (further away), down is worsening (nearer)
  const distUp = getDialDirection('distance', 2, 7);
  const distDown = getDialDirection('distance', 8, 3);
  if (distUp !== 'easing' || distDown !== 'worsening') {
    console.error(`Distance direction failed: up=${distUp}, down=${distDown}`);
    return false;
  }

  // Ferocity: down is easing, up is worsening
  const feroDown = getDialDirection('ferocity', 9, 3);
  const feroUp = getDialDirection('ferocity', 2, 8);
  if (feroDown !== 'easing' || feroUp !== 'worsening') {
    console.error(`Ferocity direction failed: down=${feroDown}, up=${feroUp}`);
    return false;
  }

  // Unchanged
  if (getDialDirection('size', 5, 5) !== 'unchanged') return false;
  if (getDialDirection('distance', 4, 4) !== 'unchanged') return false;
  if (getDialDirection('ferocity', 6, 6) !== 'unchanged') return false;

  return true;
});

// 3. ageInDays across a month boundary and for a future date (gives 0)
runTest('ageInDays across a month boundary and for a future date (gives 0)', () => {
  // Across month boundary: Jan 25, 2026 to Feb 5, 2026 (11 full days)
  const jan25 = '2026-01-25T12:00:00.000Z';
  const feb05 = '2026-02-05T12:00:00.000Z';
  const daysAcrossMonth = ageInDays(jan25, feb05);
  if (daysAcrossMonth !== 11) {
    console.error(`Expected 11 days, got ${daysAcrossMonth}`);
    return false;
  }

  // Future date gives 0
  const createdDate = '2026-06-10T12:00:00.000Z';
  const pastReferenceNow = '2026-06-01T12:00:00.000Z';
  const futureAge = ageInDays(createdDate, pastReferenceNow);
  if (futureAge !== 0) {
    console.error(`Expected 0 days for future date, got ${futureAge}`);
    return false;
  }

  // Exact same timestamp gives 0
  const sameDateAge = ageInDays(jan25, jan25);
  if (sameDateAge !== 0) return false;

  return true;
});

// 4. trendSinceSpawn with 3 entries
runTest('trendSinceSpawn with 3 entries', () => {
  const e1: JourneyEntry = {
    id: 'e1',
    at: '2026-03-01T10:00:00.000Z',
    kind: 'spawn',
    size: 8,
    distance: 2,
    ferocity: 7,
    note: 'Spawned',
  };
  const e2: JourneyEntry = {
    id: 'e2',
    at: '2026-03-05T10:00:00.000Z',
    kind: 'change',
    size: 6,
    distance: 4,
    ferocity: 8,
    note: 'Progress',
  };
  const e3: JourneyEntry = {
    id: 'e3',
    at: '2026-03-10T10:00:00.000Z',
    kind: 'change',
    size: 4, // 8 -> 4 (size down by 4 => easing)
    distance: 6, // 2 -> 6 (distance up by 4 => easing)
    ferocity: 9, // 7 -> 9 (ferocity up by 2 => worsening)
    note: 'Latest state',
  };

  const trends = trendSinceSpawn([e1, e2, e3]);
  if (!Array.isArray(trends) || trends.length !== 3) return false;

  const sizeTrend = trends.find((t) => t.dial === 'size');
  const distTrend = trends.find((t) => t.dial === 'distance');
  const feroTrend = trends.find((t) => t.dial === 'ferocity');

  if (!sizeTrend || !distTrend || !feroTrend) return false;

  if (sizeTrend.from !== 8 || sizeTrend.to !== 4 || sizeTrend.net !== -4 || sizeTrend.direction !== 'easing') {
    console.error('Size trend mismatch:', sizeTrend);
    return false;
  }

  if (distTrend.from !== 2 || distTrend.to !== 6 || distTrend.net !== 4 || distTrend.direction !== 'easing') {
    console.error('Distance trend mismatch:', distTrend);
    return false;
  }

  if (feroTrend.from !== 7 || feroTrend.to !== 9 || feroTrend.net !== 2 || feroTrend.direction !== 'worsening') {
    console.error('Ferocity trend mismatch:', feroTrend);
    return false;
  }

  // Also check named property access
  if (trends.size.direction !== 'easing' || trends.distance.direction !== 'easing' || trends.ferocity.direction !== 'worsening') {
    return false;
  }

  return true;
});

// 5. An entry whose dial did not change is not listed in changes
runTest('an entry whose dial did not change is not listed in changes', () => {
  const prev: JourneyEntry = {
    id: 'p1',
    at: '2026-03-01T10:00:00.000Z',
    kind: 'spawn',
    size: 7,
    distance: 4,
    ferocity: 5,
    note: 'Initial',
  };

  // Only size changed (7 -> 5). Distance and ferocity remain identical.
  const curr: JourneyEntry = {
    id: 'c1',
    at: '2026-03-02T10:00:00.000Z',
    kind: 'change',
    size: 5,
    distance: 4,
    ferocity: 5,
    note: 'Size decreased',
  };

  const desc = describeEntry(curr, prev);
  if (desc.changes.length !== 1) {
    console.error(`Expected exactly 1 change, got ${desc.changes.length}`);
    return false;
  }

  if (desc.changes[0].dial !== 'size' || desc.changes[0].from !== 7 || desc.changes[0].to !== 5) {
    console.error('Change mismatch:', desc.changes[0]);
    return false;
  }

  if (desc.changes[0].direction !== 'easing') {
    console.error('Direction mismatch:', desc.changes[0]);
    return false;
  }

  return true;
});

// 6. formatDateTime returns non-empty formatted string
runTest('formatDateTime formats valid ISO timestamp', () => {
  const formatted = formatDateTime('2026-03-15T14:30:00.000Z', 'en-US');
  if (typeof formatted !== 'string' || formatted.length === 0) return false;
  if (!formatted.includes('2026')) return false;
  return true;
});

console.log(`\nResults: ${passedCount} passed, ${failedCount} failed.`);

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
