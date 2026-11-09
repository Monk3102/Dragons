import {
  FrameTimeSampler,
  computePercentile,
  computeAverageFps,
  computeOnePercentLowFps,
  countFramesOver33ms,
} from './perfSampler';

let passed = 0;
let failed = 0;

function runTest(name: string, fn: () => boolean) {
  try {
    const ok = fn();
    if (ok) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}`);
      failed++;
    }
  } catch (err) {
    console.error(`[FAIL] ${name} threw:`, err);
    failed++;
  }
}

console.log('=== Running Perf Sampler Self-Check Suite ===\n');

// 1. Empty window returns nulls, not NaN
runTest('empty window returns nulls, not NaN', () => {
  const sampler = new FrameTimeSampler(100);
  const metrics = sampler.getMetrics();

  if (metrics.sampleCount !== 0) return false;
  if (metrics.avgFps !== null) return false;
  if (metrics.onePercentLowFps !== null) return false;
  if (metrics.p50 !== null) return false;
  if (metrics.p95 !== null) return false;
  if (metrics.p99 !== null) return false;
  if (metrics.framesOver33ms !== 0) return false;

  return true;
});

// 2. Steady 60 fps stream (16.666 ms per frame)
runTest('steady 60 fps stream yields ~60 fps, ~16.67ms frame time, and zero drops', () => {
  const sampler = new FrameTimeSampler(300);
  const frameDeltaMs = 1000 / 60; // 16.6666... ms

  for (let i = 0; i < 180; i++) {
    sampler.record(frameDeltaMs);
  }

  const metrics = sampler.getMetrics();
  if (metrics.sampleCount !== 180) return false;

  if (!metrics.avgFps || Math.abs(metrics.avgFps - 60) > 0.1) return false;
  if (!metrics.p50 || Math.abs(metrics.p50 - frameDeltaMs) > 0.05) return false;
  if (!metrics.p95 || Math.abs(metrics.p95 - frameDeltaMs) > 0.05) return false;
  if (!metrics.p99 || Math.abs(metrics.p99 - frameDeltaMs) > 0.05) return false;
  if (!metrics.onePercentLowFps || Math.abs(metrics.onePercentLowFps - 60) > 0.1) return false;
  if (metrics.framesOver33ms !== 0) return false;

  return true;
});

// 3. Stream with one 200 ms frame spike
runTest('stream with one 200 ms frame reports frame drop and impacts 1% low', () => {
  const sampler = new FrameTimeSampler(300);
  const frameDeltaMs = 16.667;

  // 59 steady frames (~16.67ms) + 1 massive spike frame (200ms) = 60 frames (1 second stream)
  for (let i = 0; i < 59; i++) {
    sampler.record(frameDeltaMs);
  }
  sampler.record(200.0);

  const metrics = sampler.getMetrics();
  if (metrics.sampleCount !== 60) return false;
  if (metrics.framesOver33ms !== 1) return false;

  // p99 on 60 frames captures the 200ms spike (> 50ms)
  if (!metrics.p99 || metrics.p99 < 50) return false;
  // 1% low fps drops significantly (< 30 fps)
  if (!metrics.onePercentLowFps || metrics.onePercentLowFps > 30) return false;

  return true;
});

// 4. Full ring buffer overwriting old values
runTest('full ring buffer overwrites old values without memory leak or bounds error', () => {
  const capacity = 10;
  const sampler = new FrameTimeSampler(capacity);

  // Fill with 10 ms values
  for (let i = 0; i < capacity; i++) {
    sampler.record(10.0);
  }
  let m = sampler.getMetrics();
  if (m.sampleCount !== 10) return false;
  if (m.p50 !== 10.0) return false;

  // Now overwrite all 10 slots with 30 ms values
  for (let i = 0; i < capacity; i++) {
    sampler.record(30.0);
  }
  m = sampler.getMetrics();
  if (m.sampleCount !== 10) return false;
  if (!m.p50 || Math.abs(m.p50 - 30.0) > 0.001) return false;
  if (!m.avgFps || Math.abs(m.avgFps - (1000 / 30.0)) > 0.01) return false;

  return true;
});

// 5. Percentile calculation on known lists
runTest('percentile calculation on known sorted lists matches mathematical expectation', () => {
  const known = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const p0 = computePercentile(known, 0);
  const p50 = computePercentile(known, 50);
  const p100 = computePercentile(known, 100);

  if (p0 !== 1) return false;
  if (p50 !== 5.5) return false;
  if (p100 !== 10) return false;

  const p90 = computePercentile(known, 90);
  if (p90 === null || Math.abs(p90 - 9.1) > 1e-6) return false;

  // Single element list
  if (computePercentile([42], 50) !== 42) return false;
  if (computePercentile([42], 99) !== 42) return false;

  // Empty list
  if (computePercentile([], 50) !== null) return false;

  return true;
});

console.log(`\nResults: ${passed} passed, ${failed} failed.`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
