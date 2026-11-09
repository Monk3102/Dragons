import React, { useState, useEffect, useRef, useCallback } from 'react';
import { globalPerfSampler } from './perfSampler';
import { perfProbeSnapshot } from './PerfProbe';
import { devFlags } from './devFlags';
import {
  BENCHMARK_SCENARIOS,
  generateBenchmarkMonsters,
  formatBenchmarkResultsToMarkdown,
  BenchmarkScenarioResult,
  BenchmarkEnvironmentMetadata,
} from './benchmark';
import { useMonsters } from '../store/monsterStore';
import { Activity, Play, RefreshCw, Copy, Check, X, Layers } from 'lucide-react';

interface PerfOverlayProps {
  onSelectDragon?: (id: string) => void;
  onDeselectDragon?: () => void;
  isAnyModalOpen?: boolean;
}

interface TelemetryState {
  avgFps: number | null;
  onePercentLowFps: number | null;
  p95Ms: number | null;
  p99Ms: number | null;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  programs: number;
  aliveCount: number;
  tierCounts: { ultra: number; high: number; low: number };
  dpr: number;
  cssSize: [number, number];
  deviceSize: [number, number];
  jsHeapMb: string | null;
}

interface MemoryCycleRow {
  cycle: string;
  geometries: number;
  textures: number;
  programs: number;
}

export const PerfOverlay: React.FC<PerfOverlayProps> = ({
  onSelectDragon,
  onDeselectDragon,
  isAnyModalOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [telemetry, setTelemetry] = useState<TelemetryState>({
    avgFps: null,
    onePercentLowFps: null,
    p95Ms: null,
    p99Ms: null,
    drawCalls: 0,
    triangles: 0,
    geometries: 0,
    textures: 0,
    programs: 0,
    aliveCount: 0,
    tierCounts: { ultra: 0, high: 0, low: 0 },
    dpr: 1,
    cssSize: [0, 0],
    deviceSize: [0, 0],
    jsHeapMb: null,
  });

  const { monsters, addMonster, deleteMonster } = useMonsters();
  const monstersRef = useRef(monsters);
  monstersRef.current = monsters;

  const [benchmarkStatus, setBenchmarkStatus] = useState<string | null>(null);
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkScenarioResult[] | null>(null);
  const [benchmarkMarkdown, setBenchmarkMarkdown] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Memory Cycle Test state
  const [memoryCycleRows, setMemoryCycleRows] = useState<MemoryCycleRow[] | null>(null);
  const [memoryCycleSummary, setMemoryCycleSummary] = useState<{
    growthAfterCycle1: boolean;
    baselineVsCycle1: string;
  } | null>(null);
  const [isMemoryTesting, setIsMemoryTesting] = useState(false);

  const abortControllerRef = useRef<{ abort: boolean }>({ abort: false });

  // 1. Toggle with P key (ignoring when user is typing in form inputs)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        (activeEl as HTMLElement)?.isContentEditable;

      if (isInput) return;

      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        if (devFlags.benchmarkRunning) {
          abortControllerRef.current.abort = true;
          setBenchmarkStatus('Aborting benchmark on Escape...');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 2. Refresh telemetry text at most twice per second (500ms interval)
  useEffect(() => {
    if (!isOpen) return;

    const intervalId = setInterval(() => {
      const metrics = globalPerfSampler.getMetrics();
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      const cssW = typeof window !== 'undefined' ? window.innerWidth : 0;
      const cssH = typeof window !== 'undefined' ? window.innerHeight : 0;

      let heapMb: string | null = null;
      if (typeof performance !== 'undefined' && (performance as any).memory) {
        const mem = (performance as any).memory;
        heapMb = (mem.usedJSHeapSize / (1024 * 1024)).toFixed(1);
      }

      const alive = monstersRef.current.filter((m) => m.status === 'alive').length;

      setTelemetry({
        avgFps: metrics.avgFps,
        onePercentLowFps: metrics.onePercentLowFps,
        p95Ms: metrics.p95,
        p99Ms: metrics.p99,
        drawCalls: perfProbeSnapshot.drawCalls,
        triangles: perfProbeSnapshot.triangles,
        geometries: perfProbeSnapshot.geometries,
        textures: perfProbeSnapshot.textures,
        programs: perfProbeSnapshot.programs,
        aliveCount: alive,
        tierCounts: { ...devFlags.tierCounts },
        dpr,
        cssSize: [cssW, cssH],
        deviceSize: [Math.round(cssW * dpr), Math.round(cssH * dpr)],
        jsHeapMb: heapMb,
      });
    }, 500);

    return () => clearInterval(intervalId);
  }, [isOpen]);

  const removeAllSampleMonsters = useCallback(() => {
    const samples = monstersRef.current.filter((m) => m.isSample);
    for (const m of samples) {
      deleteMonster(m.id);
    }
  }, [deleteMonster]);

  // Query GPU renderer string safely
  const getGpuRendererString = (): string => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (gl) {
        const ext = (gl as any).getExtension('WEBGL_debug_renderer_info');
        if (ext) {
          const renderer = (gl as any).getParameter(ext.UNMASKED_RENDERER_WEBGL);
          if (renderer) return String(renderer);
        }
      }
    } catch {
      // ignore
    }
    return 'not available';
  };

  // 3. TASK 6: Benchmark Runner
  const runBenchmark = async () => {
    if (isAnyModalOpen || devFlags.benchmarkRunning || isMemoryTesting) return;

    abortControllerRef.current = { abort: false };
    devFlags.benchmarkRunning = true;
    setBenchmarkStatus('Starting Phase 7A Benchmark Suite...');
    setBenchmarkResults(null);
    setBenchmarkMarkdown(null);

    const nonSampleCount = monstersRef.current.filter((m) => !m.isSample).length;
    const initialForcedTier = devFlags.forcedTier;
    const results: BenchmarkScenarioResult[] = [];

    const sleep = (ms: number) =>
      new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => resolve(), ms);
        const checkAbort = setInterval(() => {
          if (abortControllerRef.current.abort) {
            clearTimeout(timeout);
            clearInterval(checkAbort);
            reject(new Error('Benchmark aborted by user (Escape)'));
          }
        }, 100);
      });

    try {
      for (let sIdx = 0; sIdx < BENCHMARK_SCENARIOS.length; sIdx++) {
        const scenario = BENCHMARK_SCENARIOS[sIdx];
        let attempt = 0;
        let scenarioPassed = false;

        while (attempt < 2 && !scenarioPassed) {
          attempt++;
          if (abortControllerRef.current.abort) {
            throw new Error('Benchmark aborted by user (Escape)');
          }

          setBenchmarkStatus(
            `Scenario ${scenario.id} (${sIdx + 1}/${BENCHMARK_SCENARIOS.length}): ${scenario.monsterCount} monsters, ${scenario.forcedTier ? 'Forced ' + scenario.forcedTier : 'Auto'} [Attempt ${attempt}]`
          );

          // 1. Remove previous sample monsters
          removeAllSampleMonsters();
          await sleep(500);

          // 2. Add scenario monsters
          const specs = generateBenchmarkMonsters(scenario.monsterCount);
          for (const spec of specs) {
            addMonster(spec);
          }

          // 3. Apply tier setting and camera
          devFlags.forcedTier = scenario.forcedTier;
          if (scenario.camera === 'inspect') {
            const firstSample = monstersRef.current.find((m) => m.isSample);
            if (firstSample && onSelectDragon) {
              onSelectDragon(firstSample.id);
            }
          } else {
            if (onDeselectDragon) {
              onDeselectDragon();
            }
          }

          // 4. Reset tab visibility flag on probe
          perfProbeSnapshot.tabWasHidden = false;

          // 5. Warm-up 2 seconds (discarded)
          setBenchmarkStatus(`Scenario ${scenario.id}: warming up (2s)...`);
          globalPerfSampler.reset();
          await sleep(2000);

          // 6. Reset sampler and sample for 6 seconds
          setBenchmarkStatus(`Scenario ${scenario.id}: measuring (6s)...`);
          globalPerfSampler.reset();
          perfProbeSnapshot.tabWasHidden = false;

          const drawCallSamples: number[] = [];
          const triangleSamples: number[] = [];

          const sampleInterval = setInterval(() => {
            drawCallSamples.push(perfProbeSnapshot.drawCalls);
            triangleSamples.push(perfProbeSnapshot.triangles);
          }, 200);

          await sleep(6000);
          clearInterval(sampleInterval);

          const metrics = globalPerfSampler.getMetrics();
          const tabHidden = perfProbeSnapshot.tabWasHidden || !globalPerfSampler.isWindowValid;

          // Compute medians
          drawCallSamples.sort((a, b) => a - b);
          triangleSamples.sort((a, b) => a - b);
          const medianDrawCalls =
            drawCallSamples.length > 0
              ? drawCallSamples[Math.floor(drawCallSamples.length / 2)]
              : perfProbeSnapshot.drawCalls;
          const medianTriangles =
            triangleSamples.length > 0
              ? triangleSamples[Math.floor(triangleSamples.length / 2)]
              : perfProbeSnapshot.triangles;

          if (tabHidden && attempt === 1) {
            setBenchmarkStatus(`Scenario ${scenario.id}: tab was hidden. Retrying scenario once...`);
            continue; // Retry scenario once
          }

          const resultRow: BenchmarkScenarioResult = {
            scenarioId: scenario.id,
            name: scenario.name,
            monsterCount: scenario.monsterCount,
            forcedTier: scenario.forcedTier,
            camera: scenario.camera,
            avgFps: metrics.avgFps,
            onePercentLowFps: metrics.onePercentLowFps,
            p95Ms: metrics.p95,
            p99Ms: metrics.p99,
            medianDrawCalls,
            medianTriangles,
            programs: perfProbeSnapshot.programs,
            geometries: perfProbeSnapshot.geometries,
            textures: perfProbeSnapshot.textures,
            tierCounts: { ...devFlags.tierCounts },
            invalidReason: tabHidden ? 'tab hidden' : undefined,
          };

          results.push(resultRow);
          scenarioPassed = true;
        }

        // Wait 1 second between scenarios
        setBenchmarkStatus(`Scenario ${scenario.id} complete. Pausing 1s...`);
        removeAllSampleMonsters();
        globalPerfSampler.reset();
        await sleep(1000);
      }

      // Format markdown report
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      const cssW = typeof window !== 'undefined' ? window.innerWidth : 1920;
      const cssH = typeof window !== 'undefined' ? window.innerHeight : 1080;

      const envMeta: BenchmarkEnvironmentMetadata = {
        timestamp: new Date().toISOString(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
        devicePixelRatio: dpr,
        canvasCssWidth: cssW,
        canvasCssHeight: cssH,
        canvasDeviceWidth: Math.round(cssW * dpr),
        canvasDeviceHeight: Math.round(cssH * dpr),
        gpuRenderer: getGpuRendererString(),
        hardwareConcurrency:
          typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 'unknown' : 'unknown',
        deviceMemoryGb:
          typeof navigator !== 'undefined' ? (navigator as any).deviceMemory : undefined,
        nonSampleMonsterCount: nonSampleCount,
        packageVersion: '0.1.0',
      };

      const md = formatBenchmarkResultsToMarkdown(envMeta, results);
      setBenchmarkResults(results);
      setBenchmarkMarkdown(md);
      console.log('\n' + md);
      setBenchmarkStatus('Benchmark completed successfully!');
    } catch (err: any) {
      console.warn('[Benchmark] Terminated:', err.message);
      setBenchmarkStatus(`Benchmark stopped: ${err.message}`);
    } finally {
      // Guaranteed cleanup in all conditions (success, abort, error)
      removeAllSampleMonsters();
      devFlags.forcedTier = initialForcedTier;
      devFlags.benchmarkRunning = false;
      if (onDeselectDragon) {
        onDeselectDragon();
      }
    }
  };

  // 4. TASK 7: Memory Cycle Test
  const runMemoryCycleTest = async () => {
    if (isAnyModalOpen || devFlags.benchmarkRunning || isMemoryTesting) return;

    abortControllerRef.current = { abort: false };
    setIsMemoryTesting(true);
    setMemoryCycleRows(null);
    setMemoryCycleSummary(null);

    const sleep = (ms: number) =>
      new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => resolve(), ms);
        const checkAbort = setInterval(() => {
          if (abortControllerRef.current.abort) {
            clearTimeout(timeout);
            clearInterval(checkAbort);
            reject(new Error('Memory cycle test aborted by user'));
          }
        }, 100);
      });

    try {
      // Initial empty sample set record
      removeAllSampleMonsters();
      await sleep(1000);

      const baselineRow: MemoryCycleRow = {
        cycle: 'Baseline (0 sample monsters)',
        geometries: perfProbeSnapshot.geometries,
        textures: perfProbeSnapshot.textures,
        programs: perfProbeSnapshot.programs,
      };

      const rows: MemoryCycleRow[] = [baselineRow];

      for (let c = 1; c <= 3; c++) {
        // Add 20 monsters
        const specs = generateBenchmarkMonsters(20);
        for (const spec of specs) {
          addMonster(spec);
        }
        await sleep(3000);

        // Remove them all
        removeAllSampleMonsters();
        await sleep(3000);

        // Record counts after cycle
        rows.push({
          cycle: `Cycle ${c} (after removal)`,
          geometries: perfProbeSnapshot.geometries,
          textures: perfProbeSnapshot.textures,
          programs: perfProbeSnapshot.programs,
        });
      }

      setMemoryCycleRows(rows);

      // Determine growth after cycle 1
      const c1 = rows[1];
      const c3 = rows[3];
      const hasGrowth =
        c3.geometries > c1.geometries ||
        c3.textures > c1.textures ||
        c3.programs > c1.programs;

      const summary = {
        growthAfterCycle1: hasGrowth,
        baselineVsCycle1: `Before test: [Geoms: ${baselineRow.geometries}, Textures: ${baselineRow.textures}, Shaders: ${baselineRow.programs}] -> After Cycle 1: [Geoms: ${c1.geometries}, Textures: ${c1.textures}, Shaders: ${c1.programs}] (shared caches warm-up)`,
      };
      setMemoryCycleSummary(summary);
    } catch (err: any) {
      console.warn('[Memory Cycle] Aborted:', err.message);
    } finally {
      removeAllSampleMonsters();
      setIsMemoryTesting(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (!benchmarkMarkdown) return;
    navigator.clipboard.writeText(benchmarkMarkdown).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-14 right-6 z-50 w-96 max-h-[85vh] bg-[#0c1017]/95 border border-cyan-500/30 rounded-xl shadow-2xl backdrop-blur-md flex flex-col text-slate-200 text-xs font-mono select-none overflow-hidden animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/10 bg-black/40">
        <div className="flex items-center gap-2 text-cyan-400 font-semibold tracking-wide">
          <Activity className="w-3.5 h-3.5" />
          <span>PERF TELEMETRY (P)</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Close Perf Overlay"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-3 space-y-3 overflow-y-auto flex-1 scrollbar-thin">
        {/* Real-time framerate card */}
        <div className="grid grid-cols-2 gap-2 bg-black/30 p-2.5 rounded-lg border border-white/5">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Avg Framerate</div>
            <div className="text-lg font-bold text-emerald-400">
              {telemetry.avgFps !== null ? `${telemetry.avgFps.toFixed(1)} fps` : '...'}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">1% Low Framerate</div>
            <div className="text-lg font-bold text-amber-400">
              {telemetry.onePercentLowFps !== null
                ? `${telemetry.onePercentLowFps.toFixed(1)} fps`
                : '...'}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">p95 Frame Time</div>
            <div className="text-sm font-semibold text-slate-300">
              {telemetry.p95Ms !== null ? `${telemetry.p95Ms.toFixed(2)} ms` : '...'}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">p99 Frame Time</div>
            <div className="text-sm font-semibold text-slate-300">
              {telemetry.p99Ms !== null ? `${telemetry.p99Ms.toFixed(2)} ms` : '...'}
            </div>
          </div>
        </div>

        {/* WebGL Hardware Stats */}
        <div className="bg-black/30 p-2.5 rounded-lg border border-white/5 space-y-1.5">
          <div className="text-[10px] text-cyan-300 uppercase tracking-wider font-semibold">
            WebGL Renderer Pipeline
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-400">Draw Calls:</span>
              <span className="text-slate-200 font-semibold">{telemetry.drawCalls}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Triangles:</span>
              <span className="text-slate-200 font-semibold">{telemetry.triangles.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Geometries:</span>
              <span className="text-slate-200 font-semibold">{telemetry.geometries}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Textures:</span>
              <span className="text-slate-200 font-semibold">{telemetry.textures}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Shader Programs:</span>
              <span className="text-slate-200 font-semibold">{telemetry.programs}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Pixel Ratio:</span>
              <span className="text-slate-200 font-semibold">{telemetry.dpr}x</span>
            </div>
          </div>

          <div className="pt-1 border-t border-white/5 text-[10px] text-slate-400 space-y-0.5">
            <div>Canvas: {telemetry.cssSize[0]}x{telemetry.cssSize[1]} CSS ({telemetry.deviceSize[0]}x{telemetry.deviceSize[1]} dev)</div>
            <div>JS Heap: {telemetry.jsHeapMb ? `${telemetry.jsHeapMb} MB (Chrome only)` : 'N/A (Chrome only)'}</div>
          </div>
        </div>

        {/* Alive Monsters & Tier Breakdown */}
        <div className="bg-black/30 p-2.5 rounded-lg border border-white/5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-cyan-300 uppercase tracking-wider font-semibold">
              Monsters & Detail Tiers
            </span>
            <span className="text-xs font-bold text-amber-300">{telemetry.aliveCount} alive</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
            <div className="bg-purple-950/40 border border-purple-500/30 p-1 rounded">
              <div className="text-purple-300 font-bold">{telemetry.tierCounts.ultra}</div>
              <div className="text-slate-400">Ultra</div>
            </div>
            <div className="bg-blue-950/40 border border-blue-500/30 p-1 rounded">
              <div className="text-blue-300 font-bold">{telemetry.tierCounts.high}</div>
              <div className="text-slate-400">High</div>
            </div>
            <div className="bg-emerald-950/40 border border-emerald-500/30 p-1 rounded">
              <div className="text-emerald-300 font-bold">{telemetry.tierCounts.low}</div>
              <div className="text-slate-400">Low</div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={runBenchmark}
              disabled={isAnyModalOpen || devFlags.benchmarkRunning || isMemoryTesting}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                devFlags.benchmarkRunning
                  ? 'bg-amber-500/30 text-amber-200 border border-amber-500/50 animate-pulse'
                  : isAnyModalOpen
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-cyan-600/30 hover:bg-cyan-600/40 text-cyan-200 border border-cyan-500/40'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>{devFlags.benchmarkRunning ? 'Benchmarking...' : 'Run benchmark'}</span>
            </button>

            <button
              onClick={runMemoryCycleTest}
              disabled={isAnyModalOpen || devFlags.benchmarkRunning || isMemoryTesting}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg font-semibold transition-colors cursor-pointer ${
                isMemoryTesting
                  ? 'bg-purple-500/30 text-purple-200 border border-purple-500/50 animate-pulse'
                  : isAnyModalOpen
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-purple-600/30 hover:bg-purple-600/40 text-purple-200 border border-purple-500/40'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isMemoryTesting ? 'Testing memory...' : 'Memory cycle test'}</span>
            </button>
          </div>

          {benchmarkStatus && (
            <div className="text-[10px] text-amber-300 bg-black/40 p-1.5 rounded border border-amber-500/20">
              {benchmarkStatus}
            </div>
          )}
        </div>

        {/* Benchmark Results Display */}
        {benchmarkResults && (
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-cyan-300 font-semibold uppercase">
                Benchmark Results (8 Scenarios)
              </span>
              <button
                onClick={handleCopyMarkdown}
                className="flex items-center gap-1 text-[10px] px-2 py-0.5 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-200 border border-cyan-500/40 rounded transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied!' : 'Copy Markdown'}</span>
              </button>
            </div>

            <div className="overflow-x-auto max-h-48 border border-white/10 rounded">
              <table className="w-full text-left text-[10px] border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 text-slate-400">
                    <th className="p-1">ID</th>
                    <th className="p-1">Mon</th>
                    <th className="p-1">FPS</th>
                    <th className="p-1">1% Low</th>
                    <th className="p-1">p99</th>
                    <th className="p-1">Draw</th>
                    <th className="p-1">Tris</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {benchmarkResults.map((r) => (
                    <tr key={r.scenarioId} className="hover:bg-white/[0.02]">
                      <td className="p-1 font-semibold text-cyan-300">{r.scenarioId}</td>
                      <td className="p-1">{r.monsterCount}</td>
                      <td className="p-1 text-emerald-400">{r.avgFps ? r.avgFps.toFixed(0) : '-'}</td>
                      <td className="p-1 text-amber-400">
                        {r.onePercentLowFps ? r.onePercentLowFps.toFixed(0) : '-'}
                      </td>
                      <td className="p-1">{r.p99Ms ? r.p99Ms.toFixed(1) : '-'}</td>
                      <td className="p-1">{r.medianDrawCalls}</td>
                      <td className="p-1">{(r.medianTriangles / 1000).toFixed(0)}k</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Memory Cycle Test Results */}
        {memoryCycleRows && (
          <div className="space-y-1.5 pt-2 border-t border-white/10">
            <div className="text-[10px] text-purple-300 font-semibold uppercase flex items-center gap-1.5">
              <Layers className="w-3 h-3" />
              <span>Memory Cycle Test (3 Cycles)</span>
            </div>

            <div className="overflow-x-auto border border-white/10 rounded">
              <table className="w-full text-left text-[10px] border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 text-slate-400">
                    <th className="p-1">Cycle</th>
                    <th className="p-1">Geometries</th>
                    <th className="p-1">Textures</th>
                    <th className="p-1">Shaders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {memoryCycleRows.map((r, i) => (
                    <tr key={i} className="hover:bg-white/[0.02]">
                      <td className="p-1 font-semibold text-slate-300">{r.cycle}</td>
                      <td className="p-1">{r.geometries}</td>
                      <td className="p-1">{r.textures}</td>
                      <td className="p-1">{r.programs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {memoryCycleSummary && (
              <div className="space-y-1 text-[10px] bg-black/40 p-1.5 rounded border border-white/5">
                <div className="font-semibold text-slate-300">
                  Growth after cycle 1:{' '}
                  <span
                    className={
                      memoryCycleSummary.growthAfterCycle1 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'
                    }
                  >
                    {memoryCycleSummary.growthAfterCycle1 ? 'yes' : 'no'}
                  </span>
                </div>
                <div className="text-slate-400 text-[9px]">{memoryCycleSummary.baselineVsCycle1}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PerfOverlay;
