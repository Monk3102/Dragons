import {
  computeWallStats,
  sortSlain,
  filterByCreature,
  getFightLengthInDays,
} from './wallStats';
import { Monster } from '../types';

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

console.log('=== Running Wall of Fame Stats Check Suite ===\n');

// 1. Empty list
runTest('empty list returns zero stats and empty arrays', () => {
  const stats = computeWallStats([]);
  if (stats.totalSlain !== 0) return false;
  if (stats.longestFightDays !== 0) return false;
  if (stats.averageFightDays !== 0) return false;
  if (stats.mostFerociousMonster !== null) return false;

  const sorted = sortSlain([], 'newest-slain');
  if (!Array.isArray(sorted) || sorted.length !== 0) return false;

  const filtered = filterByCreature([], 'archetype-dragon');
  if (!Array.isArray(filtered) || filtered.length !== 0) return false;

  return true;
});

// 2. One monster
runTest('one monster computes accurate stats', () => {
  const singleMonster: Monster = {
    id: 'm1',
    name: 'Lone Hydra',
    creatureTypeId: 'archetype-hydra',
    problem: 'Proliferating confusion',
    size: 6,
    distance: 3,
    ferocity: 8,
    status: 'slain',
    createdAt: '2026-03-01T10:00:00.000Z',
    slainAt: '2026-03-06T10:00:00.000Z', // exactly 5 days
    finalNote: 'Addressed root cause',
    journey: [],
  };

  const stats = computeWallStats([singleMonster]);
  if (stats.totalSlain !== 1) return false;
  if (stats.longestFightDays !== 5) return false;
  if (stats.averageFightDays !== 5) return false;
  if (!stats.mostFerociousMonster || stats.mostFerociousMonster.id !== 'm1') return false;

  const sorted = sortSlain([singleMonster], 'longest-fight');
  if (sorted.length !== 1 || sorted[0].id !== 'm1') return false;

  const filteredMatch = filterByCreature([singleMonster], 'archetype-hydra');
  if (filteredMatch.length !== 1) return false;

  const filteredMismatch = filterByCreature([singleMonster], 'archetype-dragon');
  if (filteredMismatch.length !== 0) return false;

  const filteredAll = filterByCreature([singleMonster], 'all');
  if (filteredAll.length !== 1) return false;

  return true;
});

// 3. Fight length counted from createdAt to slainAt in whole days
runTest('fight length counted from createdAt to slainAt in whole days', () => {
  // Test exactly 0 days (slain 2 hours after creation)
  const lenSameDay = getFightLengthInDays(
    '2026-03-01T10:00:00.000Z',
    '2026-03-01T12:00:00.000Z'
  );
  if (lenSameDay !== 0) {
    console.error(`Expected 0 days for 2 hour diff, got ${lenSameDay}`);
    return false;
  }

  // Test 1 day and 23 hours (returns 1 day, since Math.floor)
  const lenAlmostTwo = getFightLengthInDays(
    '2026-03-01T10:00:00.000Z',
    '2026-03-03T09:00:00.000Z'
  );
  if (lenAlmostTwo !== 1) {
    console.error(`Expected 1 day for 47 hour diff, got ${lenAlmostTwo}`);
    return false;
  }

  // Across month boundary (Feb 25 to Mar 5, 2026: 8 full days in non-leap year 2026)
  const lenAcrossMonth = getFightLengthInDays(
    '2026-02-25T10:00:00.000Z',
    '2026-03-05T10:00:00.000Z'
  );
  if (lenAcrossMonth !== 8) {
    console.error(`Expected 8 days across Feb-Mar 2026, got ${lenAcrossMonth}`);
    return false;
  }

  // Missing or future slainAt returns 0
  if (getFightLengthInDays('2026-03-01T10:00:00.000Z', undefined) !== 0) return false;
  if (getFightLengthInDays('2026-03-05T10:00:00.000Z', '2026-03-01T10:00:00.000Z') !== 0) return false;

  return true;
});

// 4. Ties in sorting
runTest('ties in sorting handled cleanly and stably', () => {
  const m1: Monster = {
    id: 'm1',
    name: 'Alpha Beast',
    creatureTypeId: 'archetype-dragon',
    problem: 'Problem A',
    size: 5,
    distance: 5,
    ferocity: 8,
    status: 'slain',
    createdAt: '2026-03-01T10:00:00.000Z',
    slainAt: '2026-03-10T10:00:00.000Z', // 9 days
    journey: [],
  };

  const m2: Monster = {
    id: 'm2',
    name: 'Beta Beast',
    creatureTypeId: 'archetype-medusa',
    problem: 'Problem B',
    size: 5,
    distance: 5,
    ferocity: 8, // same ferocity as m1 (tie!)
    status: 'slain',
    createdAt: '2026-03-02T10:00:00.000Z',
    slainAt: '2026-03-11T10:00:00.000Z', // 9 days (same fight length as m1!)
    journey: [],
  };

  const m3: Monster = {
    id: 'm3',
    name: 'Gamma Beast',
    creatureTypeId: 'archetype-vampire',
    problem: 'Problem C',
    size: 7,
    distance: 2,
    ferocity: 4,
    status: 'slain',
    createdAt: '2026-03-08T10:00:00.000Z',
    slainAt: '2026-03-11T10:00:00.000Z', // 3 days (shorter), same slainAt as m2 (tie on slainAt)
    journey: [],
  };

  const inputList = [m1, m2, m3];

  // 4a. Sort by longest fight: m1 (9d) and m2 (9d) tie. m2 was slain later (Mar 11 vs Mar 10), so m2 should come before m1. m3 is 3d.
  const byFight = sortSlain(inputList, 'longest-fight');
  if (byFight[0].id !== 'm2' || byFight[1].id !== 'm1' || byFight[2].id !== 'm3') {
    console.error('Longest fight tie-break mismatch:', byFight.map((x) => x.id));
    return false;
  }

  // 4b. Sort by highest ferocity: m1 (8) and m2 (8) tie. m2 slain later, so m2 before m1. m3 is 4.
  const byFero = sortSlain(inputList, 'highest-ferocity');
  if (byFero[0].id !== 'm2' || byFero[1].id !== 'm1' || byFero[2].id !== 'm3') {
    console.error('Ferocity tie-break mismatch:', byFero.map((x) => x.id));
    return false;
  }

  // 4c. Sort by newest slain: m2 and m3 have same slainAt (Mar 11). m3 was created Mar 08, m2 created Mar 02. m3 before m2, then m1.
  const byNewest = sortSlain(inputList, 'newest-slain');
  if (byNewest[0].id !== 'm3' || byNewest[1].id !== 'm2' || byNewest[2].id !== 'm1') {
    console.error('Newest slain tie-break mismatch:', byNewest.map((x) => x.id));
    return false;
  }

  // 4d. Ensure input list was not mutated
  if (inputList[0].id !== 'm1' || inputList[1].id !== 'm2' || inputList[2].id !== 'm3') {
    console.error('Input array was mutated by sortSlain');
    return false;
  }

  return true;
});

console.log(`\nResults: ${passedCount} passed, ${failedCount} failed.`);

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
