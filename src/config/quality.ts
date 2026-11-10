/**
 * src/config/quality.ts
 * Tiny external store for visual quality modes ('auto' | 'low-power').
 * Readable from React via useSyncExternalStore, and from plain code.
 */

export type QualityMode = 'auto' | 'low-power';

export const QUALITY_STORAGE_KEY = 'DRACO_ANIMI_QUALITY';

let currentQuality: QualityMode = 'auto';

// Initialize from localStorage if available
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = window.localStorage.getItem(QUALITY_STORAGE_KEY);
    if (saved === 'auto' || saved === 'low-power') {
      currentQuality = saved;
    }
  }
} catch {
  currentQuality = 'auto';
}

type QualityListener = (mode: QualityMode) => void;
const listeners = new Set<QualityListener>();

export function getQuality(): QualityMode {
  return currentQuality;
}

export function setQuality(mode: QualityMode): void {
  const nextMode: QualityMode = mode === 'low-power' ? 'low-power' : 'auto';
  if (nextMode === currentQuality) return;

  currentQuality = nextMode;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(QUALITY_STORAGE_KEY, nextMode);
    }
  } catch {
    // Ignore storage failure, keep working in memory
  }

  listeners.forEach((listener) => listener(nextMode));
}

export function subscribeQuality(listener: QualityListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getQualitySnapshot(): QualityMode {
  return currentQuality;
}
