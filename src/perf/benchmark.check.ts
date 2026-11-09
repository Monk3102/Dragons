import {
  BENCHMARK_SCENARIOS,
  REGISTERED_RECIPE_IDS,
  generateBenchmarkMonsters,
  formatBenchmarkResultsToMarkdown,
  BenchmarkEnvironmentMetadata,
  BenchmarkScenarioResult,
} from './benchmark';

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

console.log('=== Running Benchmark Engine Self-Check Suite ===\n');

// 1. Scenarios are exactly the eight specified scenarios
runTest('scenarios are exactly the eight canonical benchmark scenarios', () => {
  if (BENCHMARK_SCENARIOS.length !== 8) return false;

  const expected = [
    { id: 'S1', count: 1, forcedTier: null, camera: 'overview' },
    { id: 'S2', count: 5, forcedTier: null, camera: 'overview' },
    { id: 'S3', count: 10, forcedTier: null, camera: 'overview' },
    { id: 'S4', count: 20, forcedTier: null, camera: 'overview' },
    { id: 'S5', count: 10, forcedTier: 'high', camera: 'overview' },
    { id: 'S6', count: 10, forcedTier: 'low', camera: 'overview' },
    { id: 'S7', count: 20, forcedTier: 'low', camera: 'overview' },
    { id: 'S8', count: 10, forcedTier: null, camera: 'inspect' },
  ];

  for (let i = 0; i < 8; i++) {
    const actual = BENCHMARK_SCENARIOS[i];
    const exp = expected[i];
    if (actual.id !== exp.id) return false;
    if (actual.monsterCount !== exp.count) return false;
    if (actual.forcedTier !== exp.forcedTier) return false;
    if (actual.camera !== exp.camera) return false;
  }

  return true;
});

// 2. Generation is deterministic (same input gives same output twice)
runTest('generation is deterministic (same input produces identical output)', () => {
  const run1 = generateBenchmarkMonsters(20);
  const run2 = generateBenchmarkMonsters(20);

  if (run1.length !== 20 || run2.length !== 20) return false;
  const json1 = JSON.stringify(run1);
  const json2 = JSON.stringify(run2);

  return json1 === json2;
});

// 3. Every generated monster is a sample and has valid dials 1 to 10
runTest('every generated monster is marked isSample: true with dials in [1, 10]', () => {
  const monsters = generateBenchmarkMonsters(50);

  for (const m of monsters) {
    if (m.isSample !== true) return false;
    if (typeof m.size !== 'number' || m.size < 1 || m.size > 10 || !Number.isInteger(m.size)) return false;
    if (typeof m.distance !== 'number' || m.distance < 1 || m.distance > 10 || !Number.isInteger(m.distance)) return false;
    if (typeof m.ferocity !== 'number' || m.ferocity < 1 || m.ferocity > 10 || !Number.isInteger(m.ferocity)) return false;
    if (!m.name || m.name.length === 0) return false;
    if (!m.creatureTypeId || m.creatureTypeId.length === 0) return false;
  }

  return true;
});

// 4. S2 contains every registered recipe exactly once
runTest('S2 contains every registered recipe exactly once', () => {
  const s2Monsters = generateBenchmarkMonsters(5);
  if (s2Monsters.length !== REGISTERED_RECIPE_IDS.length) return false;

  const foundRecipeIds = s2Monsters.map((m) => m.creatureTypeId);
  const distinct = new Set(foundRecipeIds);

  if (distinct.size !== REGISTERED_RECIPE_IDS.length) return false;
  for (const regId of REGISTERED_RECIPE_IDS) {
    if (!distinct.has(regId)) return false;
  }

  return true;
});

// 5. No real (non-sample) monster id is ever produced
runTest('no real (non-sample) monster id is ever produced', () => {
  const monsters = generateBenchmarkMonsters(100);
  for (const m of monsters) {
    if (m.isSample !== true) return false;
    if (!m.id.startsWith('benchmark-sample-')) return false;
  }
  return true;
});

// 6. Markdown formatter contains header lines and one row per scenario
runTest('Markdown formatter contains header lines and one row per scenario', () => {
  const mockEnv: BenchmarkEnvironmentMetadata = {
    timestamp: '2026-11-09T18:30:00Z',
    userAgent: 'Mozilla/5.0 Mock Test Engine',
    devicePixelRatio: 2.0,
    canvasCssWidth: 1920,
    canvasCssHeight: 1080,
    canvasDeviceWidth: 3840,
    canvasDeviceHeight: 2160,
    gpuRenderer: 'ANGLE (Apple, Apple M2 Pro, OpenGL 4.1)',
    hardwareConcurrency: 12,
    deviceMemoryGb: 16,
    nonSampleMonsterCount: 3,
    packageVersion: '0.1.0',
  };

  const mockResults: BenchmarkScenarioResult[] = BENCHMARK_SCENARIOS.map((s) => ({
    scenarioId: s.id,
    name: s.name,
    monsterCount: s.monsterCount,
    forcedTier: s.forcedTier,
    camera: s.camera,
    avgFps: 60.0,
    onePercentLowFps: 58.5,
    p95Ms: 16.8,
    p99Ms: 17.1,
    medianDrawCalls: 28,
    medianTriangles: 82000,
    programs: 4,
    geometries: 96,
    textures: 8,
    tierCounts: { ultra: 1, high: 2, low: s.monsterCount - 3 },
  }));

  const markdown = formatBenchmarkResultsToMarkdown(mockEnv, mockResults);

  // Assert required header lines
  if (!markdown.includes('# Draco Animi - Performance Benchmark Report')) return false;
  if (!markdown.includes('Mozilla/5.0 Mock Test Engine')) return false;
  if (!markdown.includes('Device Pixel Ratio')) return false;
  if (!markdown.includes('1920x1080 CSS px (3840x2160 device px)')) return false;
  if (!markdown.includes('ANGLE (Apple, Apple M2 Pro, OpenGL 4.1)')) return false;
  if (!markdown.includes('12 cores')) return false;
  if (!markdown.includes('16 GB')) return false;
  if (!markdown.includes('Non-Sample Monsters in World')) return false;
  if (!markdown.includes('0.1.0')) return false;
  if (!markdown.includes('monitor refresh rate')) return false;

  // Assert all 8 scenario rows are rendered
  for (const s of BENCHMARK_SCENARIOS) {
    if (!markdown.includes(`| ${s.id} |`)) return false;
  }

  return true;
});

console.log(`\nResults: ${passed} passed, ${failed} failed.`);

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
