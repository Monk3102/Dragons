import { Monster } from '../types';

export type WallSortKey = 'newest-slain' | 'newest' | 'longest-fight' | 'highest-ferocity';

export interface WallStats {
  totalSlain: number;
  longestFightDays: number;
  averageFightDays: number;
  mostFerociousMonster: Monster | null;
}

/**
 * Computes fight length in whole elapsed days from createdAt to slainAt.
 * Always returns a non-negative integer. If slainAt is missing or invalid, returns 0.
 */
export function getFightLengthInDays(createdAtIso: string, slainAtIso?: string): number {
  if (!slainAtIso) return 0;
  const created = Date.parse(createdAtIso);
  const slain = Date.parse(slainAtIso);
  if (isNaN(created) || isNaN(slain)) return 0;
  const diffMs = slain - created;
  if (diffMs <= 0) return 0;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Computes aggregate summary statistics for all slain monsters:
 * - total slain
 * - the longest fight (in days)
 * - average fight length (in days, rounded to one decimal place)
 * - the monster that was most ferocious when slain
 */
export function computeWallStats(slainMonsters: Monster[]): WallStats {
  if (!slainMonsters || slainMonsters.length === 0) {
    return {
      totalSlain: 0,
      longestFightDays: 0,
      averageFightDays: 0,
      mostFerociousMonster: null,
    };
  }

  const totalSlain = slainMonsters.length;
  let maxFightDays = 0;
  let totalFightDays = 0;
  let mostFerociousMonster: Monster | null = null;
  let maxFerocity = -1;

  for (const m of slainMonsters) {
    const fightDays = getFightLengthInDays(m.createdAt, m.slainAt);
    totalFightDays += fightDays;
    if (fightDays > maxFightDays) {
      maxFightDays = fightDays;
    }

    // Determine ferocity when slain (m.ferocity is set at slay time)
    if (m.ferocity > maxFerocity) {
      maxFerocity = m.ferocity;
      mostFerociousMonster = m;
    }
  }

  const rawAverage = totalFightDays / totalSlain;
  const averageFightDays = Math.round(rawAverage * 10) / 10;

  return {
    totalSlain,
    longestFightDays: maxFightDays,
    averageFightDays,
    mostFerociousMonster,
  };
}

/**
 * Returns a sorted shallow copy of the slain monsters list according to the specified key:
 * - 'newest' | 'newest-slain': newest slainAt date first. Ties broken by createdAt descending, then name.
 * - 'longest-fight': longest fight in days first. Ties broken by slainAt descending, then name.
 * - 'highest-ferocity': highest ferocity when slain first. Ties broken by slainAt descending, then name.
 */
export function sortSlain(list: Monster[], key: WallSortKey): Monster[] {
  if (!list || list.length <= 1) return [...(list || [])];

  return [...list].sort((a, b) => {
    if (key === 'newest' || key === 'newest-slain') {
      const timeA = a.slainAt ? Date.parse(a.slainAt) || 0 : 0;
      const timeB = b.slainAt ? Date.parse(b.slainAt) || 0 : 0;
      if (timeA !== timeB) return timeB - timeA;
      // Tie breaker: createdAt descending
      const createA = Date.parse(a.createdAt) || 0;
      const createB = Date.parse(b.createdAt) || 0;
      if (createA !== createB) return createB - createA;
      return a.name.localeCompare(b.name);
    }

    if (key === 'longest-fight') {
      const daysA = getFightLengthInDays(a.createdAt, a.slainAt);
      const daysB = getFightLengthInDays(b.createdAt, b.slainAt);
      if (daysA !== daysB) return daysB - daysA;
      // Tie breaker: slainAt descending
      const timeA = a.slainAt ? Date.parse(a.slainAt) || 0 : 0;
      const timeB = b.slainAt ? Date.parse(b.slainAt) || 0 : 0;
      if (timeA !== timeB) return timeB - timeA;
      return a.name.localeCompare(b.name);
    }

    if (key === 'highest-ferocity') {
      if (a.ferocity !== b.ferocity) return b.ferocity - a.ferocity;
      // Tie breaker: slainAt descending
      const timeA = a.slainAt ? Date.parse(a.slainAt) || 0 : 0;
      const timeB = b.slainAt ? Date.parse(b.slainAt) || 0 : 0;
      if (timeA !== timeB) return timeB - timeA;
      return a.name.localeCompare(b.name);
    }

    return 0;
  });
}

/**
 * Filters a list of slain monsters by creature archetype ID.
 * If creatureTypeId is 'all', null, undefined, or empty string, returns the whole list.
 */
export function filterByCreature(list: Monster[], creatureTypeId?: string | null): Monster[] {
  if (!list) return [];
  if (!creatureTypeId || creatureTypeId === 'all' || creatureTypeId.trim() === '') {
    return list;
  }
  return list.filter((m) => m.creatureTypeId === creatureTypeId);
}
