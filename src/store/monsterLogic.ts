import { Dial, JourneyEntry, Monster } from '../types';

export interface CreateMonsterInput {
  name: string;
  creatureTypeId: string;
  problem: string;
  size: Dial;
  distance: Dial;
  ferocity: Dial;
  note: string;
  isSample?: boolean;
}

export interface DialValues {
  size: Dial;
  distance: Dial;
  ferocity: Dial;
}

export type MonsterResult =
  | { ok: true; monster: Monster }
  | { ok: false; error: string };

function isValidDial(val: unknown): val is Dial {
  return typeof val === 'number' && Number.isInteger(val) && val >= 1 && val <= 10;
}

function validateDials(size: unknown, distance: unknown, ferocity: unknown): string | null {
  if (!isValidDial(size)) {
    return 'Size dial must be an integer between 1 and 10.';
  }
  if (!isValidDial(distance)) {
    return 'Distance dial must be an integer between 1 and 10.';
  }
  if (!isValidDial(ferocity)) {
    return 'Ferocity dial must be an integer between 1 and 10.';
  }
  return null;
}

function validateName(name: unknown): { ok: true; clean: string } | { ok: false; error: string } {
  if (typeof name !== 'string') {
    return { ok: false, error: 'Monster name must be a string.' };
  }
  const clean = name.trim();
  if (clean.length === 0) {
    return { ok: false, error: 'Monster name cannot be empty.' };
  }
  if (clean.length > 80) {
    return { ok: false, error: 'Monster name cannot exceed 80 characters.' };
  }
  return { ok: true, clean };
}

function validateNote(note: unknown): { ok: true; clean: string } | { ok: false; error: string } {
  if (typeof note !== 'string') {
    return { ok: false, error: 'Note must be a string.' };
  }
  const clean = note.trim();
  if (clean.length === 0) {
    return { ok: false, error: 'Note cannot be empty.' };
  }
  if (clean.length > 500) {
    return { ok: false, error: 'Note cannot exceed 500 characters.' };
  }
  return { ok: true, clean };
}

function toISO(now?: string | Date): string {
  if (!now) return new Date().toISOString();
  if (now instanceof Date) return now.toISOString();
  return now;
}

/**
 * Creates a new Monster instance with status 'alive' and a single initial 'spawn' journey entry.
 */
export function createMonster(input: CreateMonsterInput, now?: string | Date): MonsterResult {
  const nameResult = validateName(input.name);
  if (!nameResult.ok) {
    return { ok: false, error: nameResult.error };
  }

  if (typeof input.creatureTypeId !== 'string' || input.creatureTypeId.trim().length === 0) {
    return { ok: false, error: 'A valid creature archetype ID is required.' };
  }

  const dialError = validateDials(input.size, input.distance, input.ferocity);
  if (dialError) {
    return { ok: false, error: dialError };
  }

  const noteResult = validateNote(input.note);
  if (!noteResult.ok) {
    return { ok: false, error: noteResult.error };
  }

  const timestamp = toISO(now);
  const entryId = crypto.randomUUID();
  const monsterId = crypto.randomUUID();

  const spawnEntry: JourneyEntry = {
    id: entryId,
    at: timestamp,
    kind: 'spawn',
    size: input.size,
    distance: input.distance,
    ferocity: input.ferocity,
    note: noteResult.clean,
  };

  const newMonster: Monster = {
    id: monsterId,
    name: nameResult.clean,
    creatureTypeId: input.creatureTypeId.trim(),
    problem: typeof input.problem === 'string' ? input.problem.trim() : '',
    size: input.size,
    distance: input.distance,
    ferocity: input.ferocity,
    status: 'alive',
    createdAt: timestamp,
    isSample: input.isSample,
    journey: [spawnEntry],
  };

  return { ok: true, monster: newMonster };
}

/**
 * Updates dials on an alive monster, appending a new 'change' journey entry.
 * Fails if the monster is slain or if no dial values have changed.
 */
export function changeDials(
  monster: Monster,
  newDials: DialValues,
  note: string,
  now?: string | Date
): MonsterResult {
  if (monster.status === 'slain') {
    return { ok: false, error: 'A slain monster cannot be changed.' };
  }

  const dialError = validateDials(newDials.size, newDials.distance, newDials.ferocity);
  if (dialError) {
    return { ok: false, error: dialError };
  }

  if (
    newDials.size === monster.size &&
    newDials.distance === monster.distance &&
    newDials.ferocity === monster.ferocity
  ) {
    return { ok: false, error: 'At least one dial value must change.' };
  }

  const noteResult = validateNote(note);
  if (!noteResult.ok) {
    return { ok: false, error: noteResult.error };
  }

  const timestamp = toISO(now);
  const entryId = crypto.randomUUID();

  const changeEntry: JourneyEntry = {
    id: entryId,
    at: timestamp,
    kind: 'change',
    size: newDials.size,
    distance: newDials.distance,
    ferocity: newDials.ferocity,
    note: noteResult.clean,
  };

  const updatedMonster: Monster = {
    ...monster,
    size: newDials.size,
    distance: newDials.distance,
    ferocity: newDials.ferocity,
    journey: [...monster.journey, changeEntry],
  };

  return { ok: true, monster: updatedMonster };
}

/**
 * Slays an alive monster, setting status to 'slain' and appending a 'slain' journey entry.
 * Fails if the monster is already slain.
 */
export function slayMonster(
  monster: Monster,
  note: string,
  now?: string | Date
): MonsterResult {
  if (monster.status === 'slain') {
    return { ok: false, error: 'A slain monster cannot be slain again.' };
  }

  const noteResult = validateNote(note);
  if (!noteResult.ok) {
    return { ok: false, error: noteResult.error };
  }

  const timestamp = toISO(now);
  const entryId = crypto.randomUUID();

  const slayEntry: JourneyEntry = {
    id: entryId,
    at: timestamp,
    kind: 'slain',
    size: monster.size,
    distance: monster.distance,
    ferocity: monster.ferocity,
    note: noteResult.clean,
  };

  const slainMonster: Monster = {
    ...monster,
    status: 'slain',
    slainAt: timestamp,
    finalNote: noteResult.clean,
    journey: [...monster.journey, slayEntry],
  };

  return { ok: true, monster: slainMonster };
}

/**
 * Strictly validates an unknown value as a valid Monster object.
 * Returns the typed Monster if valid, or null if any rule is violated.
 */
export function validateMonster(value: unknown): Monster | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (typeof candidate.id !== 'string' || candidate.id.trim().length === 0) {
    return null;
  }

  if (
    typeof candidate.name !== 'string' ||
    candidate.name.trim().length === 0 ||
    candidate.name.trim().length > 80
  ) {
    return null;
  }

  if (
    typeof candidate.creatureTypeId !== 'string' ||
    candidate.creatureTypeId.trim().length === 0
  ) {
    return null;
  }

  if (typeof candidate.problem !== 'string') {
    return null;
  }

  if (
    !isValidDial(candidate.size) ||
    !isValidDial(candidate.distance) ||
    !isValidDial(candidate.ferocity)
  ) {
    return null;
  }

  if (candidate.status !== 'alive' && candidate.status !== 'slain') {
    return null;
  }

  if (
    typeof candidate.createdAt !== 'string' ||
    isNaN(Date.parse(candidate.createdAt))
  ) {
    return null;
  }

  if (candidate.status === 'slain') {
    if (
      typeof candidate.slainAt !== 'string' ||
      isNaN(Date.parse(candidate.slainAt))
    ) {
      return null;
    }
    if (
      candidate.finalNote !== undefined &&
      typeof candidate.finalNote !== 'string'
    ) {
      return null;
    }
  }

  if (
    candidate.isSample !== undefined &&
    typeof candidate.isSample !== 'boolean'
  ) {
    return null;
  }

  if (!Array.isArray(candidate.journey)) {
    return null;
  }

  const validJourney: JourneyEntry[] = [];
  for (const item of candidate.journey) {
    if (!item || typeof item !== 'object') {
      return null;
    }
    const j = item as Record<string, unknown>;

    if (typeof j.id !== 'string' || j.id.trim().length === 0) {
      return null;
    }
    if (typeof j.at !== 'string' || isNaN(Date.parse(j.at))) {
      return null;
    }
    if (j.kind !== 'spawn' && j.kind !== 'change' && j.kind !== 'slain') {
      return null;
    }
    if (!isValidDial(j.size) || !isValidDial(j.distance) || !isValidDial(j.ferocity)) {
      return null;
    }
    if (
      typeof j.note !== 'string' ||
      j.note.trim().length === 0 ||
      j.note.trim().length > 500
    ) {
      return null;
    }

    validJourney.push({
      id: j.id,
      at: j.at,
      kind: j.kind,
      size: j.size,
      distance: j.distance,
      ferocity: j.ferocity,
      note: j.note.trim(),
    });
  }

  return {
    id: candidate.id,
    name: candidate.name.trim(),
    creatureTypeId: candidate.creatureTypeId.trim(),
    problem: candidate.problem,
    size: candidate.size,
    distance: candidate.distance,
    ferocity: candidate.ferocity,
    status: candidate.status,
    createdAt: candidate.createdAt,
    slainAt: candidate.status === 'slain' ? (candidate.slainAt as string) : undefined,
    finalNote:
      candidate.status === 'slain' && typeof candidate.finalNote === 'string'
        ? candidate.finalNote
        : undefined,
    isSample: candidate.isSample as boolean | undefined,
    journey: validJourney,
  };
}
