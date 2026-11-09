export interface DevFlags {
  forcedTier: null | 'ultra' | 'high' | 'low';
  benchmarkRunning: boolean;
  tierCounts: {
    ultra: number;
    high: number;
    low: number;
  };
}

/**
 * Plain mutable object for development-only performance measurement and tier overrides.
 * Not React state: modified directly without triggering unneeded re-renders.
 */
export const devFlags: DevFlags = {
  forcedTier: null,
  benchmarkRunning: false,
  tierCounts: {
    ultra: 0,
    high: 0,
    low: 0,
  },
};
