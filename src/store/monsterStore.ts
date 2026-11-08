import { useSyncExternalStore } from 'react';
import { Monster } from '../types';
import {
  createMonster,
  changeDials,
  slayMonster,
  validateMonster,
  CreateMonsterInput,
  DialValues,
} from './monsterLogic';
import { SAMPLE_MONSTERS } from '../data/sampleMonsters';

export const STORAGE_KEY = 'DRACO_ANIMI_MONSTERS_v1';

export interface MonsterStorePayload {
  version: 1;
  monsters: Monster[];
  updatedAt: string;
}

export interface UseMonstersReturn {
  monsters: Monster[];
  addMonster: (input: CreateMonsterInput) => { ok: boolean; monster?: Monster; error?: string };
  updateDials: (id: string, newDials: DialValues, note: string) => { ok: boolean; monster?: Monster; error?: string };
  slay: (id: string, note: string) => { ok: boolean; monster?: Monster; error?: string };
  deleteMonster: (id: string) => { ok: boolean; error?: string };
  replaceAll: (newMonsters: Monster[]) => { ok: boolean; error?: string };
  storageAvailable: boolean;
}

type Listener = () => void;
const listeners = new Set<Listener>();

let currentMonsters: Monster[] = [];
let isStorageAvailable = true;
let isInitialized = false;

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('[monsterStore] Listener error:', e);
    }
  });
}

function checkStorageAvailability(): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  try {
    const probe = '__draco_storage_probe__';
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

function preserveCorruptData(rawText: string, reason: string): void {
  const timestamp = Date.now();
  const corruptKey = `DRACO_ANIMI_MONSTERS_CORRUPT_${timestamp}`;
  console.warn(
    `[monsterStore] Storage corruption encountered (${reason}). Preserving raw text to "${corruptKey}".`
  );
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(corruptKey, rawText);
    }
  } catch (err) {
    console.error('[monsterStore] Failed to write corrupt backup to localStorage:', err);
  }
}

function saveToStorage(monsters: Monster[]): void {
  if (!isStorageAvailable || typeof window === 'undefined') {
    return;
  }
  try {
    const payload: MonsterStorePayload = {
      version: 1,
      monsters,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('[monsterStore] localStorage write failed or storage full:', err);
    isStorageAvailable = false;
    notify();
  }
}

function loadFromStorage(): void {
  isStorageAvailable = checkStorageAvailability();

  if (!isStorageAvailable || typeof window === 'undefined') {
    if (!isInitialized) {
      currentMonsters = [...SAMPLE_MONSTERS];
    }
    return;
  }

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch (err) {
    console.warn('[monsterStore] Error accessing localStorage:', err);
    isStorageAvailable = false;
    if (!isInitialized) {
      currentMonsters = [...SAMPLE_MONSTERS];
    }
    return;
  }

  // First run: key does not exist yet
  if (raw === null) {
    currentMonsters = [...SAMPLE_MONSTERS];
    saveToStorage(currentMonsters);
    return;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    preserveCorruptData(raw, 'Invalid JSON syntax');
    currentMonsters = [];
    return;
  }

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    (parsed as Record<string, unknown>).version !== 1 ||
    !Array.isArray((parsed as Record<string, unknown>).monsters)
  ) {
    preserveCorruptData(raw, 'Schema version unknown or invalid structure');
    currentMonsters = [];
    return;
  }

  const rawList = (parsed as { monsters: unknown[] }).monsters;
  const validList: Monster[] = [];
  let hadInvalid = false;

  for (const item of rawList) {
    const validated = validateMonster(item);
    if (validated) {
      validList.push(validated);
    } else {
      hadInvalid = true;
    }
  }

  if (hadInvalid && validList.length === 0 && rawList.length > 0) {
    // All items were invalid — preserve raw copy to prevent silent loss
    preserveCorruptData(raw, 'All items failed monster validation');
    currentMonsters = [];
  } else {
    currentMonsters = validList;
    if (hadInvalid) {
      console.warn('[monsterStore] Discarded invalid items while retaining valid monsters.');
      saveToStorage(currentMonsters);
    }
  }
}

// Initial hydration and storage listener for multi-tab synchronization
if (typeof window !== 'undefined' && !isInitialized) {
  loadFromStorage();
  isInitialized = true;

  window.addEventListener('storage', (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      loadFromStorage();
      notify();
    }
  });
}

function getSnapshot(): Monster[] {
  return currentMonsters;
}

function getServerSnapshot(): Monster[] {
  return currentMonsters;
}

function getStorageAvailableSnapshot(): boolean {
  return isStorageAvailable;
}

export function addMonster(input: CreateMonsterInput): {
  ok: boolean;
  monster?: Monster;
  error?: string;
} {
  const result = createMonster(input);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  currentMonsters = [result.monster, ...currentMonsters];
  saveToStorage(currentMonsters);
  notify();
  return { ok: true, monster: result.monster };
}

export function updateDials(
  id: string,
  newDials: DialValues,
  note: string
): { ok: boolean; monster?: Monster; error?: string } {
  const monster = currentMonsters.find((m) => m.id === id);
  if (!monster) {
    return { ok: false, error: 'Monster not found' };
  }
  const result = changeDials(monster, newDials, note);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  currentMonsters = currentMonsters.map((m) => (m.id === id ? result.monster : m));
  saveToStorage(currentMonsters);
  notify();
  return { ok: true, monster: result.monster };
}

export function slay(
  id: string,
  note: string
): { ok: boolean; monster?: Monster; error?: string } {
  const monster = currentMonsters.find((m) => m.id === id);
  if (!monster) {
    return { ok: false, error: 'Monster not found' };
  }
  const result = slayMonster(monster, note);
  if (!result.ok) {
    return { ok: false, error: result.error };
  }
  currentMonsters = currentMonsters.map((m) => (m.id === id ? result.monster : m));
  saveToStorage(currentMonsters);
  notify();
  return { ok: true, monster: result.monster };
}

export function deleteMonster(id: string): { ok: boolean; error?: string } {
  const exists = currentMonsters.some((m) => m.id === id);
  if (!exists) {
    return { ok: false, error: 'Monster not found' };
  }
  currentMonsters = currentMonsters.filter((m) => m.id !== id);
  saveToStorage(currentMonsters);
  notify();
  return { ok: true };
}

export function replaceAll(newMonsters: Monster[]): { ok: boolean; error?: string } {
  const validatedList: Monster[] = [];
  for (const item of newMonsters) {
    const valid = validateMonster(item);
    if (!valid) {
      return {
        ok: false,
        error: `Invalid monster record "${(item as { name?: string })?.name || 'unnamed'}"`,
      };
    }
    validatedList.push(valid);
  }

  currentMonsters = validatedList;
  saveToStorage(currentMonsters);
  notify();
  return { ok: true };
}

export function getMonstersSnapshot(): Monster[] {
  return currentMonsters;
}

export function getIsStorageAvailable(): boolean {
  return isStorageAvailable;
}

/**
 * React hook subscribing to the monster store via useSyncExternalStore.
 * Returns the current monsters array, mutator functions, and storage availability state.
 */
export function useMonsters(): UseMonstersReturn {
  const monsters = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const storageAvailable = useSyncExternalStore(
    subscribe,
    getStorageAvailableSnapshot,
    () => true
  );

  return {
    monsters,
    addMonster,
    updateDials,
    slay,
    deleteMonster,
    replaceAll,
    storageAvailable,
  };
}
