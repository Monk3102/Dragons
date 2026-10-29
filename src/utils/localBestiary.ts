import { MonsterRecord } from '../types';
import { ARCHETYPE_CATALOGUE } from '../data/archetypesCatalogue';

export const LOCAL_BESTIARY_STORAGE_KEY = 'DRACO_ANIMI_LOCAL_BESTIARY_v1';

export interface LocalBestiaryStorage {
  version: 1;
  records: MonsterRecord[];
  updatedAt: string;
}

export interface BestiaryExportPayload {
  schemaVersion: 1;
  exportedAt: string;
  canonicalCatalogue: typeof ARCHETYPE_CATALOGUE;
  userBestiaryRecords: MonsterRecord[];
}

/**
 * Safely retrieve user-created or edited monster records from localStorage.
 * Does NOT write or copy canonical catalogue entries to storage simply for browsing.
 */
export function getLocalBestiaryRecords(): MonsterRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_BESTIARY_STORAGE_KEY);
    if (!raw) return [];
    const parsed: LocalBestiaryStorage = JSON.parse(raw);
    if (parsed && parsed.version === 1 && Array.isArray(parsed.records)) {
      return parsed.records;
    }
  } catch (err) {
    console.warn('Failed to parse local bestiary records from storage:', err);
  }
  return [];
}

/**
 * Save or update a single monster record in local storage.
 */
export function saveLocalBestiaryRecord(record: MonsterRecord): MonsterRecord[] {
  try {
    const current = getLocalBestiaryRecords();
    const index = current.findIndex((r) => r.id === record.id);
    let updated: MonsterRecord[];
    if (index >= 0) {
      updated = [...current];
      updated[index] = record;
    } else {
      updated = [record, ...current];
    }
    const payload: LocalBestiaryStorage = {
      version: 1,
      records: updated,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_BESTIARY_STORAGE_KEY, JSON.stringify(payload));
    return updated;
  } catch (err) {
    console.error('Failed to save monster record to local storage:', err);
    return getLocalBestiaryRecords();
  }
}

/**
 * Delete a user monster record by ID from local storage.
 */
export function deleteLocalBestiaryRecord(id: string): MonsterRecord[] {
  try {
    const current = getLocalBestiaryRecords();
    const filtered = current.filter((r) => r.id !== id);
    const payload: LocalBestiaryStorage = {
      version: 1,
      records: filtered,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(LOCAL_BESTIARY_STORAGE_KEY, JSON.stringify(payload));
    return filtered;
  } catch (err) {
    console.error('Failed to delete monster record from local storage:', err);
    return getLocalBestiaryRecords();
  }
}

/**
 * Construct the export payload containing schema version, timestamp,
 * the canonical catalogue (42 entries), and user-customized records.
 */
export function buildExportPayload(): BestiaryExportPayload {
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    canonicalCatalogue: ARCHETYPE_CATALOGUE,
    userBestiaryRecords: getLocalBestiaryRecords(),
  };
}

/**
 * Trigger immediate browser download of the Bestiary JSON file.
 */
export function exportBestiaryToJson(filename?: string): void {
  if (typeof window === 'undefined') return;
  const payload = buildExportPayload();
  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  a.href = url;
  a.download = filename || `draco-animi-bestiary-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
