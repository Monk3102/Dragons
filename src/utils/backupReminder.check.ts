import { shouldRemind, daysSinceExport } from './backupReminder';

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

console.log('=== Running Backup Reminder Logic Check Suite ===\n');

const referenceNow = '2026-03-20T12:00:00.000Z';
const nowMs = Date.parse(referenceNow);
const dayMs = 24 * 60 * 60 * 1000;

// 1. Missing last export value (null, undefined, empty string)
runTest('missing last export triggers reminder when nonSampleMonsterCount >= 1', () => {
  // With 1 non-sample monster:
  if (shouldRemind(1, null, referenceNow) !== true) return false;
  if (shouldRemind(1, undefined, referenceNow) !== true) return false;
  if (shouldRemind(1, '', referenceNow) !== true) return false;
  if (shouldRemind(5, null, referenceNow) !== true) return false;

  // With 0 non-sample monsters:
  if (shouldRemind(0, null, referenceNow) !== false) return false;
  if (shouldRemind(0, undefined, referenceNow) !== false) return false;

  // daysSinceExport returns null for missing values
  if (daysSinceExport(null, referenceNow) !== null) return false;
  if (daysSinceExport(undefined, referenceNow) !== null) return false;
  if (daysSinceExport('', referenceNow) !== null) return false;

  return true;
});

// 2. Boundary day 13 (not older than 14 days => shouldRemind is false)
runTest('boundary day 13 is not older than 14 days', () => {
  const export13DaysAgo = new Date(nowMs - 13 * dayMs).toISOString();

  const days = daysSinceExport(export13DaysAgo, referenceNow);
  if (days !== 13) {
    console.error(`Expected 13 days, got ${days}`);
    return false;
  }

  // Reminder should be false
  if (shouldRemind(1, export13DaysAgo, referenceNow) !== false) {
    console.error('shouldRemind should be false at 13 days');
    return false;
  }

  return true;
});

// 3. Boundary day 14 (exactly 14 days, not older than 14 days => shouldRemind is false)
runTest('boundary day 14 is not older than 14 days', () => {
  const export14DaysAgo = new Date(nowMs - 14 * dayMs).toISOString();

  const days = daysSinceExport(export14DaysAgo, referenceNow);
  if (days !== 14) {
    console.error(`Expected 14 days, got ${days}`);
    return false;
  }

  // Reminder should be false (14 is not older than 14)
  if (shouldRemind(1, export14DaysAgo, referenceNow) !== false) {
    console.error('shouldRemind should be false at 14 days');
    return false;
  }

  return true;
});

// 4. Boundary day 15 (older than 14 days => shouldRemind is true)
runTest('boundary day 15 is older than 14 days and triggers reminder', () => {
  const export15DaysAgo = new Date(nowMs - 15 * dayMs).toISOString();

  const days = daysSinceExport(export15DaysAgo, referenceNow);
  if (days !== 15) {
    console.error(`Expected 15 days, got ${days}`);
    return false;
  }

  // Reminder should be true (15 is older than 14)
  if (shouldRemind(1, export15DaysAgo, referenceNow) !== true) {
    console.error('shouldRemind should be true at 15 days');
    return false;
  }

  // With 0 non-sample monsters, should be false even at 15 days
  if (shouldRemind(0, export15DaysAgo, referenceNow) !== false) {
    console.error('shouldRemind should be false when nonSampleMonsterCount is 0');
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
