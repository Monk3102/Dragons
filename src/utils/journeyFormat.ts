import { Dial, JourneyEntry } from '../types';

export type DialName = 'size' | 'distance' | 'ferocity';
export type Direction = 'easing' | 'worsening';

export interface DialChange {
  dial: DialName;
  from: number;
  to: number;
  direction: Direction;
}

export interface EntryDescription {
  label: 'Spawned' | 'Changed' | 'Slain';
  changes: DialChange[];
}

export interface DialTrend {
  dial: DialName;
  from: number;
  to: number;
  net: number;
  direction: 'easing' | 'worsening' | 'unchanged';
}

export type TrendResult = DialTrend[] & {
  size: DialTrend;
  distance: DialTrend;
  ferocity: DialTrend;
};

/**
 * Calculates direction of change for a given dial.
 * Direction rule:
 * - Size going down is easing, going up is worsening.
 * - Distance going up is easing (further away), going down is worsening.
 * - Ferocity going down is easing, going up is worsening.
 */
export function getDialDirection(
  dial: DialName,
  from: number,
  to: number
): 'easing' | 'worsening' | 'unchanged' {
  if (from === to) return 'unchanged';
  if (dial === 'size' || dial === 'ferocity') {
    return to < from ? 'easing' : 'worsening';
  }
  // distance: going up (farther away from threat) is easing
  return to > from ? 'easing' : 'worsening';
}

/**
 * Describes a journey entry and its dial changes relative to the chronologically previous entry.
 * First entry has no changes. Entries where a dial did not change are omitted from changes.
 */
export function describeEntry(
  entry: JourneyEntry,
  previousEntry?: JourneyEntry
): EntryDescription {
  let label: 'Spawned' | 'Changed' | 'Slain';
  if (entry.kind === 'spawn') {
    label = 'Spawned';
  } else if (entry.kind === 'slain') {
    label = 'Slain';
  } else {
    label = 'Changed';
  }

  if (!previousEntry) {
    return { label, changes: [] };
  }

  const changes: DialChange[] = [];
  const dials: DialName[] = ['size', 'distance', 'ferocity'];

  for (const dial of dials) {
    const from = previousEntry[dial];
    const to = entry[dial];
    if (from !== to) {
      const dir = getDialDirection(dial, from, to);
      if (dir !== 'unchanged') {
        changes.push({
          dial,
          from,
          to,
          direction: dir,
        });
      }
    }
  }

  return { label, changes };
}

/**
 * Computes the age in whole elapsed days between two ISO timestamps.
 * Always returns a non-negative whole integer. Future dates return 0.
 */
export function ageInDays(createdAtIso: string, nowIso?: string): number {
  const created = Date.parse(createdAtIso);
  const now = nowIso ? Date.parse(nowIso) : Date.now();
  if (isNaN(created) || isNaN(now)) return 0;
  const diffMs = now - created;
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Computes net change per dial from the first entry to the latest entry.
 * Uses the same direction rule:
 * - size: down is easing, up is worsening
 * - distance: up is easing, down is worsening
 * - ferocity: down is easing, up is worsening
 */
export function trendSinceSpawn(journey: JourneyEntry[]): TrendResult {
  const dials: DialName[] = ['size', 'distance', 'ferocity'];

  if (!journey || journey.length === 0) {
    const list: DialTrend[] = dials.map((dial) => ({
      dial,
      from: 5,
      to: 5,
      net: 0,
      direction: 'unchanged',
    }));
    return Object.assign(list, {
      size: list[0],
      distance: list[1],
      ferocity: list[2],
    });
  }

  const first = journey[0];
  const latest = journey[journey.length - 1];

  const list: DialTrend[] = dials.map((dial) => {
    const from = first[dial];
    const to = latest[dial];
    return {
      dial,
      from,
      to,
      net: to - from,
      direction: getDialDirection(dial, from, to),
    };
  });

  return Object.assign(list, {
    size: list[0],
    distance: list[1],
    ferocity: list[2],
  });
}

/**
 * Formats an ISO date string using Intl.DateTimeFormat with the user's locale.
 */
export function formatDateTime(iso: string, locale?: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale || undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
