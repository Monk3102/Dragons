import { createMonster, changeDials, slayMonster, validateMonster } from './monsterLogic';

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

console.log('=== Running Monster Logic Self-Check Suite ===\n');

// 1. Valid createMonster works
runTest('a valid createMonster works', () => {
  const res = createMonster({
    name: 'Dread Wyrm',
    creatureTypeId: 'archetype-dragon',
    problem: 'Avoidance of critical life tasks',
    size: 7,
    distance: 4,
    ferocity: 6,
    note: 'Initial spawn observation',
  });

  return (
    res.ok === true &&
    res.monster.status === 'alive' &&
    res.monster.name === 'Dread Wyrm' &&
    res.monster.size === 7 &&
    res.monster.distance === 4 &&
    res.monster.ferocity === 6 &&
    res.monster.journey.length === 1 &&
    res.monster.journey[0].kind === 'spawn' &&
    res.monster.journey[0].note === 'Initial spawn observation'
  );
});

// 2. A dial of 0, 11 or 4.5 fails
runTest('a dial of 0, 11 or 4.5 fails', () => {
  const baseInput = {
    name: 'Dial Test Monster',
    creatureTypeId: 'archetype-dragon',
    problem: 'Testing invalid dials',
    note: 'Valid note',
  };

  // Dial = 0
  const res0 = createMonster({ ...baseInput, size: 0 as any, distance: 5, ferocity: 5 });
  // Dial = 11
  const res11 = createMonster({ ...baseInput, size: 5, distance: 11 as any, ferocity: 5 });
  // Dial = 4.5 (non-integer)
  const resFloat = createMonster({ ...baseInput, size: 5, distance: 5, ferocity: 4.5 as any });

  return res0.ok === false && res11.ok === false && resFloat.ok === false;
});

// 3. An empty note fails, and a 501-character note fails
runTest('an empty note fails, and a 501-character note fails', () => {
  const baseInput = {
    name: 'Note Test Monster',
    creatureTypeId: 'archetype-dragon',
    problem: 'Testing note validation',
    size: 5,
    distance: 5,
    ferocity: 5,
  };

  // Empty note
  const resEmpty = createMonster({ ...baseInput, note: '   ' });
  // 501-character note
  const longNote = 'a'.repeat(501);
  const resLong = createMonster({ ...baseInput, note: longNote });
  // 500-character note should succeed
  const valid500Note = 'a'.repeat(500);
  const resValid = createMonster({ ...baseInput, note: valid500Note });

  return resEmpty.ok === false && resLong.ok === false && resValid.ok === true;
});

// 4. changeDials with identical values fails
runTest('changeDials with identical values fails', () => {
  const res = createMonster({
    name: 'Identical Dials Monster',
    creatureTypeId: 'archetype-dragon',
    problem: 'Testing no-op dial change',
    size: 5,
    distance: 5,
    ferocity: 5,
    note: 'Spawn note',
  });
  if (!res.ok) return false;

  const changeRes = changeDials(
    res.monster,
    { size: 5, distance: 5, ferocity: 5 },
    'Trying to change with identical dials'
  );

  return changeRes.ok === false;
});

// 5. changeDials adds exactly one journey entry
runTest('changeDials adds exactly one journey entry', () => {
  const res = createMonster({
    name: 'Journey Test Monster',
    creatureTypeId: 'archetype-dragon',
    problem: 'Testing journey append',
    size: 3,
    distance: 3,
    ferocity: 3,
    note: 'Spawn note',
  });
  if (!res.ok) return false;

  const initialJourneyCount = res.monster.journey.length;
  const changeRes = changeDials(
    res.monster,
    { size: 4, distance: 3, ferocity: 3 },
    'Size increased by 1'
  );

  if (!changeRes.ok) return false;

  const updatedJourney = changeRes.monster.journey;
  const newEntry = updatedJourney[updatedJourney.length - 1];

  return (
    updatedJourney.length === initialJourneyCount + 1 &&
    newEntry.kind === 'change' &&
    newEntry.size === 4 &&
    newEntry.note === 'Size increased by 1'
  );
});

// 6. slayMonster works once and fails the second time
runTest('slayMonster works once and fails the second time', () => {
  const res = createMonster({
    name: 'Slay Target',
    creatureTypeId: 'archetype-dragon',
    problem: 'To be slain',
    size: 8,
    distance: 2,
    ferocity: 7,
    note: 'Spawn note',
  });
  if (!res.ok) return false;

  const slayRes1 = slayMonster(res.monster, 'Slaying the beast with direct confrontation');
  if (!slayRes1.ok) return false;

  const slain = slayRes1.monster;
  const slayRes2 = slayMonster(slain, 'Attempting to slay a corpse');

  return (
    slain.status === 'slain' &&
    typeof slain.slainAt === 'string' &&
    slain.finalNote === 'Slaying the beast with direct confrontation' &&
    slayRes2.ok === false
  );
});

// 7. changeDials on a slain monster fails
runTest('changeDials on a slain monster fails', () => {
  const res = createMonster({
    name: 'Slain Mutation Target',
    creatureTypeId: 'archetype-dragon',
    problem: 'To be slain then changed',
    size: 4,
    distance: 4,
    ferocity: 4,
    note: 'Spawn note',
  });
  if (!res.ok) return false;

  const slayRes = slayMonster(res.monster, 'Slain once');
  if (!slayRes.ok) return false;

  const changeRes = changeDials(
    slayRes.monster,
    { size: 2, distance: 4, ferocity: 4 },
    'Cannot change slain monster'
  );

  return changeRes.ok === false;
});

// 8. the input monster is never mutated
runTest('the input monster is never mutated', () => {
  const res = createMonster({
    name: 'Immutability Check Monster',
    creatureTypeId: 'archetype-dragon',
    problem: 'Testing immutability',
    size: 5,
    distance: 5,
    ferocity: 5,
    note: 'Original spawn note',
  });
  if (!res.ok) return false;

  const original = res.monster;
  const originalSnapshot = JSON.stringify(original);

  // Perform dial change
  const changeRes = changeDials(
    original,
    { size: 8, distance: 3, ferocity: 9 },
    'Changed dials'
  );
  if (!changeRes.ok) return false;

  const afterChangeSnapshot = JSON.stringify(original);
  if (originalSnapshot !== afterChangeSnapshot) return false;

  // Perform slay
  const slayRes = slayMonster(original, 'Slay original');
  if (!slayRes.ok) return false;

  const afterSlaySnapshot = JSON.stringify(original);
  return (
    originalSnapshot === afterSlaySnapshot &&
    original.size === 5 &&
    original.status === 'alive' &&
    original.journey.length === 1
  );
});

// 9. validateMonster rejects a broken object
runTest('validateMonster rejects a broken object', () => {
  const validRes = createMonster({
    name: 'Valid Specimen',
    creatureTypeId: 'archetype-dragon',
    problem: 'Specimen problem',
    size: 5,
    distance: 5,
    ferocity: 5,
    note: 'Valid note',
  });
  if (!validRes.ok) return false;

  const validMonster = validRes.monster;

  const checks = [
    validateMonster(null) === null,
    validateMonster(undefined) === null,
    validateMonster('not-an-object') === null,
    validateMonster({ ...validMonster, id: '' }) === null,
    validateMonster({ ...validMonster, name: '' }) === null,
    validateMonster({ ...validMonster, name: 'a'.repeat(81) }) === null,
    validateMonster({ ...validMonster, size: 0 }) === null,
    validateMonster({ ...validMonster, size: 11 }) === null,
    validateMonster({ ...validMonster, distance: 3.5 }) === null,
    validateMonster({ ...validMonster, status: 'zombie' }) === null,
    validateMonster({ ...validMonster, journey: 'invalid' }) === null,
    validateMonster({
      ...validMonster,
      journey: [{ ...validMonster.journey[0], kind: 'unknown' }],
    }) === null,
    validateMonster({
      ...validMonster,
      journey: [{ ...validMonster.journey[0], note: '' }],
    }) === null,
  ];

  return checks.every(Boolean);
});

console.log(`\nResults: ${passedCount} passed, ${failedCount} failed.`);

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
