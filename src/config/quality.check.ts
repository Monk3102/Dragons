/**
 * src/config/quality.check.ts
 * Self-check suite for quality store.
 * Run with: npx tsx src/config/quality.check.ts
 */

import {
  getQuality,
  setQuality,
  subscribeQuality,
  getQualitySnapshot,
  QUALITY_STORAGE_KEY,
  QualityMode,
} from './quality';

function assert(condition: boolean, msg: string): void {
  if (!condition) {
    console.error(`[FAIL] ${msg}`);
    process.exit(1);
  }
}

console.log('=== Running Quality Store Self-Check Suite ===');

// 1. Default mode is 'auto'
{
  assert(getQuality() === 'auto' || getQuality() === 'low-power', 'mode must be a valid QualityMode');
  setQuality('auto');
  assert(getQuality() === 'auto', 'default mode is auto');
  assert(getQualitySnapshot() === 'auto', 'snapshot returns current mode');
  console.log('[PASS] default is auto');
}

// 2. Subscription notification
{
  let received: QualityMode | null = null;
  const unsubscribe = subscribeQuality((mode) => {
    received = mode;
  });

  setQuality('low-power');
  assert(received === 'low-power', 'listener notified on change to low-power');
  assert(getQuality() === 'low-power', 'getQuality matches new mode');

  setQuality('auto');
  assert(received === 'auto', 'listener notified on change to auto');

  unsubscribe();
  received = null;
  setQuality('low-power');
  assert(received === null, 'unsubscribed listener receives no further notifications');
  console.log('[PASS] subscription notification fires on change and cleans up');
}

// 3. Fallback when invalid value is passed
{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setQuality('invalid-mode' as any);
  assert(getQuality() === 'auto', 'invalid mode falls back to auto');
  console.log('[PASS] invalid value falls back to auto');
}

// 4. Persistence to mock storage
{
  // Simulate browser storage
  const mockStorage = new Map<string, string>();
  const origWindow = globalThis.window;

  (globalThis as any).window = {
    localStorage: {
      getItem: (key: string) => mockStorage.get(key) ?? null,
      setItem: (key: string, val: string) => mockStorage.set(key, val),
    },
  };

  setQuality('low-power');
  assert(mockStorage.get(QUALITY_STORAGE_KEY) === 'low-power', 'persisted to localStorage');

  setQuality('auto');
  assert(mockStorage.get(QUALITY_STORAGE_KEY) === 'auto', 'persisted updated value to localStorage');

  (globalThis as any).window = origWindow;
  console.log('[PASS] persistence to localStorage under DRACO_ANIMI_QUALITY works');
}

console.log('Results: all quality store checks passed.');
