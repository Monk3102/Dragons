/**
 * Performance Frame-Time Sampler
 *
 * Implements a fixed-size ring buffer of frame durations (in milliseconds)
 * with zero memory allocation inside useFrame loops.
 *
 * Provides statistical aggregations: Average FPS, 1% Low FPS, p50/p95/p99 frame
 * times, and dropped frame counts (> 33ms).
 */

export const RING_BUFFER_CAPACITY = 2400; // ~20 seconds at 120 fps, or ~40s at 60 fps

export interface SamplerMetrics {
  avgFps: number | null;
  /**
   * 1% low FPS: defined as 1000 divided by the 99th percentile frame time in ms.
   * Represents the framerate during the worst 1% frame-time spikes.
   */
  onePercentLowFps: number | null;
  p50: number | null;
  p95: number | null;
  p99: number | null;
  framesOver33ms: number;
  sampleCount: number;
}

/**
 * Computes a percentile value (0 to 100) from an already-sorted array of numbers
 * using linear interpolation between nearest ranks.
 * Returns null if the array is empty.
 */
export function computePercentile(
  sorted: ArrayLike<number>,
  p: number,
  length: number = sorted.length
): number | null {
  if (length === 0) return null;
  if (length === 1) return sorted[0];

  const clampedP = Math.max(0, Math.min(100, p));
  const rank = (clampedP / 100) * (length - 1);
  const lower = Math.floor(rank);
  const upper = Math.ceil(rank);
  const weight = rank - lower;

  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

/**
 * Computes average frames per second from an array of frame durations in milliseconds.
 * Returns null if empty or if total elapsed time is zero.
 */
export function computeAverageFps(
  samples: ArrayLike<number>,
  length: number = samples.length
): number | null {
  if (length === 0) return null;

  let totalMs = 0;
  for (let i = 0; i < length; i++) {
    totalMs += samples[i];
  }

  if (totalMs <= 0) return null;
  return (length / totalMs) * 1000;
}

/**
 * Calculates 1% low FPS from the 99th percentile frame time in milliseconds.
 * Defined as 1000 / p99Ms.
 * Returns null if p99Ms is null or non-positive.
 */
export function computeOnePercentLowFps(p99Ms: number | null): number | null {
  if (p99Ms === null || p99Ms <= 0) return null;
  return 1000 / p99Ms;
}

/**
 * Counts how many frames exceeded 33 milliseconds (~30 fps drop threshold).
 */
export function countFramesOver33ms(
  samples: ArrayLike<number>,
  length: number = samples.length
): number {
  let count = 0;
  for (let i = 0; i < length; i++) {
    if (samples[i] > 33) {
      count++;
    }
  }
  return count;
}

/**
 * Fixed-size ring buffer for tracking frame times with zero garbage collection allocations.
 */
export class FrameTimeSampler {
  private buffer: Float64Array;
  private sortScratch: Float64Array;
  private capacity: number;
  private head: number = 0;
  private count: number = 0;
  private tabWasHidden: boolean = false;

  constructor(capacity = RING_BUFFER_CAPACITY) {
    this.capacity = capacity;
    this.buffer = new Float64Array(capacity);
    this.sortScratch = new Float64Array(capacity);
  }

  /**
   * Records a single frame duration in milliseconds.
   * Zero heap allocation.
   */
  record(deltaMs: number): void {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0) return;

    this.buffer[this.head] = deltaMs;
    this.head = (this.head + 1) % this.capacity;
    if (this.count < this.capacity) {
      this.count++;
    }
  }

  /**
   * Marks the current sample window as compromised (e.g. browser tab was hidden).
   */
  markHidden(): void {
    this.tabWasHidden = true;
  }

  get isWindowValid(): boolean {
    return !this.tabWasHidden;
  }

  /**
   * Clears the sample buffer and resets validity.
   */
  reset(): void {
    this.head = 0;
    this.count = 0;
    this.tabWasHidden = false;
  }

  get sampleCount(): number {
    return this.count;
  }

  /**
   * Calculates metrics across the current ring buffer window.
   * Copies active samples into pre-allocated scratch buffer for sorting.
   * Returns null values when empty.
   */
  getMetrics(): SamplerMetrics {
    if (this.count === 0) {
      return {
        avgFps: null,
        onePercentLowFps: null,
        p50: null,
        p95: null,
        p99: null,
        framesOver33ms: 0,
        sampleCount: 0,
      };
    }

    // Copy current samples into scratch buffer
    for (let i = 0; i < this.count; i++) {
      this.sortScratch[i] = this.buffer[i];
    }

    const activeView = this.sortScratch.subarray(0, this.count);
    activeView.sort();

    const p50 = computePercentile(activeView, 50, this.count);
    const p95 = computePercentile(activeView, 95, this.count);
    const p99 = computePercentile(activeView, 99, this.count);
    const avgFps = computeAverageFps(this.buffer, this.count);
    const onePercentLowFps = computeOnePercentLowFps(p99);
    const framesOver33ms = countFramesOver33ms(this.buffer, this.count);

    return {
      avgFps,
      onePercentLowFps,
      p50,
      p95,
      p99,
      framesOver33ms,
      sampleCount: this.count,
    };
  }
}

/** Global shared instance for the probe and overlay */
export const globalPerfSampler = new FrameTimeSampler();
