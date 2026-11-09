import { CreateMonsterInput } from '../store/monsterLogic';
import { Dial } from '../types';

/**
 * Benchmark Scenario definition
 */
export interface BenchmarkScenario {
  id: string;
  name: string;
  monsterCount: number;
  forcedTier: null | 'ultra' | 'high' | 'low';
  camera: 'overview' | 'inspect';
}

/**
 * Canonical list of the 8 benchmark scenarios required by Phase 7A.
 */
export const BENCHMARK_SCENARIOS: BenchmarkScenario[] = [
  { id: 'S1', name: 'S1', monsterCount: 1, forcedTier: null, camera: 'overview' },
  { id: 'S2', name: 'S2', monsterCount: 5, forcedTier: null, camera: 'overview' },
  { id: 'S3', name: 'S3', monsterCount: 10, forcedTier: null, camera: 'overview' },
  { id: 'S4', name: 'S4', monsterCount: 20, forcedTier: null, camera: 'overview' },
  { id: 'S5', name: 'S5', monsterCount: 10, forcedTier: 'high', camera: 'overview' },
  { id: 'S6', name: 'S6', monsterCount: 10, forcedTier: 'low', camera: 'overview' },
  { id: 'S7', name: 'S7', monsterCount: 20, forcedTier: 'low', camera: 'overview' },
  { id: 'S8', name: 'S8', monsterCount: 10, forcedTier: null, camera: 'inspect' },
];

/**
 * Canonical list of the 5 registered creature recipes in Draco Animi:
 * 4 handcrafted detailed models + 1 placeholder fallback recipe.
 */
export const REGISTERED_RECIPE_IDS: readonly string[] = [
  'archetype-dragon',
  'archetype-troll',
  'archetype-hydra',
  'archetype-sirens',
  '__placeholder__',
] as const;

export const BENCHMARK_DIAL_SIZES: readonly Dial[] = [4, 6, 8] as const;
export const BENCHMARK_DIAL_DISTANCES: readonly Dial[] = [2, 4, 6, 8] as const;
export const BENCHMARK_DIAL_FEROCITIES: readonly Dial[] = [3, 6, 9] as const;

export interface BenchmarkMonsterSpec extends CreateMonsterInput {
  id: string;
}

/**
 * Deterministically generates benchmark sample monsters.
 * Dials and recipes are rotated round-robin so every recipe appears at several ferocity levels.
 * All monsters are strictly marked isSample: true with deterministic, sample-prefixed IDs.
 */
export function generateBenchmarkMonsters(count: number): BenchmarkMonsterSpec[] {
  const result: BenchmarkMonsterSpec[] = [];

  for (let i = 0; i < count; i++) {
    const creatureTypeId = REGISTERED_RECIPE_IDS[i % REGISTERED_RECIPE_IDS.length];
    const size = BENCHMARK_DIAL_SIZES[i % BENCHMARK_DIAL_SIZES.length];
    const distance = BENCHMARK_DIAL_DISTANCES[i % BENCHMARK_DIAL_DISTANCES.length];
    const ferocity = BENCHMARK_DIAL_FEROCITIES[i % BENCHMARK_DIAL_FEROCITIES.length];

    result.push({
      id: `benchmark-sample-${i + 1}`,
      name: `Benchmark Sample ${i + 1} (${creatureTypeId})`,
      creatureTypeId,
      problem: `Synthetic benchmark creature #${i + 1}`,
      size,
      distance,
      ferocity,
      note: 'Generated for automated performance benchmarking',
      isSample: true,
    });
  }

  return result;
}

/**
 * Result row captured from a single benchmark scenario run.
 */
export interface BenchmarkScenarioResult {
  scenarioId: string;
  name: string;
  monsterCount: number;
  forcedTier: null | 'ultra' | 'high' | 'low';
  camera: 'overview' | 'inspect';
  avgFps: number | null;
  onePercentLowFps: number | null;
  p95Ms: number | null;
  p99Ms: number | null;
  medianDrawCalls: number;
  medianTriangles: number;
  programs: number;
  geometries: number;
  textures: number;
  tierCounts: {
    ultra: number;
    high: number;
    low: number;
  };
  invalidReason?: string;
}

export interface BenchmarkEnvironmentMetadata {
  timestamp: string;
  userAgent: string;
  devicePixelRatio: number;
  canvasCssWidth: number;
  canvasCssHeight: number;
  canvasDeviceWidth: number;
  canvasDeviceHeight: number;
  gpuRenderer: string;
  hardwareConcurrency: number | string;
  deviceMemoryGb?: number | string;
  nonSampleMonsterCount: number;
  packageVersion: string;
}

/**
 * Formats full benchmark run results into clean, standardized Markdown.
 */
export function formatBenchmarkResultsToMarkdown(
  env: BenchmarkEnvironmentMetadata,
  results: BenchmarkScenarioResult[]
): string {
  const lines: string[] = [];

  // Header Block
  lines.push('# Draco Animi - Performance Benchmark Report');
  lines.push('');
  lines.push(`- **Date & Time**: ${env.timestamp}`);
  lines.push(`- **Browser User Agent**: ${env.userAgent}`);
  lines.push(`- **Device Pixel Ratio**: ${env.devicePixelRatio}`);
  lines.push(
    `- **Canvas Size**: ${env.canvasCssWidth}x${env.canvasCssHeight} CSS px (${env.canvasDeviceWidth}x${env.canvasDeviceHeight} device px)`
  );
  lines.push(`- **GPU Renderer**: ${env.gpuRenderer}`);
  lines.push(`- **Hardware Concurrency**: ${env.hardwareConcurrency} cores`);
  if (env.deviceMemoryGb !== undefined) {
    lines.push(`- **Device Memory**: ${env.deviceMemoryGb} GB`);
  }
  lines.push(`- **Non-Sample Monsters in World**: ${env.nonSampleMonsterCount}`);
  lines.push(`- **App Version**: ${env.packageVersion}`);
  lines.push('');
  lines.push('> *Note: Framerate (FPS) is limited by the monitor refresh rate (vsync).*');
  lines.push('');

  // Results Table
  lines.push(
    '| Scenario | Monsters | Mode | Camera | Avg FPS | 1% Low | p95 (ms) | p99 (ms) | Draw Calls | Triangles | Shaders | Geoms | Textures | Ultra | High | Low | Status |'
  );
  lines.push(
    '| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |'
  );

  for (const r of results) {
    const tierMode = r.forcedTier ? `Forced ${r.forcedTier.toUpperCase()}` : 'Auto';
    const avgFpsStr = r.avgFps !== null ? r.avgFps.toFixed(1) : 'N/A';
    const lowFpsStr = r.onePercentLowFps !== null ? r.onePercentLowFps.toFixed(1) : 'N/A';
    const p95Str = r.p95Ms !== null ? r.p95Ms.toFixed(2) : 'N/A';
    const p99Str = r.p99Ms !== null ? r.p99Ms.toFixed(2) : 'N/A';
    const status = r.invalidReason ? `INVALID: ${r.invalidReason}` : 'VALID';

    lines.push(
      `| ${r.scenarioId} | ${r.monsterCount} | ${tierMode} | ${r.camera} | ${avgFpsStr} | ${lowFpsStr} | ${p95Str} | ${p99Str} | ${r.medianDrawCalls} | ${r.medianTriangles.toLocaleString()} | ${r.programs} | ${r.geometries} | ${r.textures} | ${r.tierCounts.ultra} | ${r.tierCounts.high} | ${r.tierCounts.low} | ${status} |`
    );
  }

  lines.push('');
  return lines.join('\n');
}
