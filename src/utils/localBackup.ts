import { MonsterRecord, ConfrontationNoteItem, ChatMessageItem, Monster } from '../types';
import { ARCHETYPE_CATALOGUE } from '../data/archetypesCatalogue';
import { getLocalBestiaryRecords } from './localBestiary';
import { validateMonster } from '../store/monsterLogic';
import { getMonstersSnapshot } from '../store/monsterStore';

export const BACKUP_SCHEMA_VERSION = 3;

export interface DracoAnimiBackupPayload {
  schemaVersion: 3;
  app: 'Draco Animi';
  exportedAt: string;
  // Summary metadata for human and machine inspection
  stats: {
    customBestiaryCount: number;
    chronicleNotesCount: number;
    counselChatsCount: number;
    monsterCount: number;
  };
  // Reference information only (canonical catalogue is preserved statically)
  canonicalArchetypeCount: number;
  // User data payloads
  userBestiaryRecords: MonsterRecord[];
  chronicleNotes: ConfrontationNoteItem[];
  counselChats: ChatMessageItem[];
  monsters: Monster[];
}

export interface ImportValidationSuccess {
  isValid: true;
  payload: DracoAnimiBackupPayload;
  summary: {
    bestiaryAdded: number;
    bestiaryUpdated: number;
    notesAdded: number;
    notesUpdated: number;
    chatsAdded: number;
    chatsUpdated: number;
    monstersCount: number;
  };
}

export interface ImportValidationError {
  isValid: false;
  error: string;
}

export type ImportValidationResult = ImportValidationSuccess | ImportValidationError;

/**
 * Calculates the latest journey entry timestamp for a monster (or createdAt if empty).
 */
export function getLatestJourneyTimestamp(monster: Monster): number {
  if (!monster.journey || monster.journey.length === 0) {
    return Date.parse(monster.createdAt) || 0;
  }
  let maxTime = 0;
  for (const entry of monster.journey) {
    const time = Date.parse(entry.at) || 0;
    if (time > maxTime) maxTime = time;
  }
  return maxTime || (Date.parse(monster.createdAt) || 0);
}

/**
 * Validate and safely parse an uploaded JSON backup string.
 * Supports legacy versions 1 and 2 (treating monsters as empty), and version 3.
 * Strictly validates all monsters in version 3 with validateMonster.
 */
export function validateBackupJson(rawJson: string): ImportValidationResult {
  try {
    const data = JSON.parse(rawJson);
    if (!data || typeof data !== 'object') {
      return { isValid: false, error: 'File is not a valid JSON object.' };
    }

    // Check version compatibility (supports v1, v2, and v3)
    const version = data.schemaVersion;
    if (version !== 1 && version !== 2 && version !== 3) {
      return {
        isValid: false,
        error: `Unsupported schema version: ${version}. Expected version 1, 2, or 3.`,
      };
    }

    // Sanitize userBestiaryRecords
    const userBestiaryRecords: MonsterRecord[] = [];
    const rawBestiary = Array.isArray(data.userBestiaryRecords) ? data.userBestiaryRecords : [];
    for (const item of rawBestiary) {
      if (item && typeof item === 'object' && typeof item.id === 'string' && typeof item.name === 'string') {
        userBestiaryRecords.push({
          id: String(item.id),
          name: String(item.name).slice(0, 128),
          subtitle: String(item.subtitle || '').slice(0, 256),
          category: String(item.category || '').slice(0, 128),
          temperament: String(item.temperament || 'Formidable') as any,
          manifestation: String(item.manifestation || '').slice(0, 2048),
          voice: String(item.voice || '').slice(0, 1024),
          roots: String(item.roots || '').slice(0, 2048),
          somaticFeeling: String(item.somaticFeeling || '').slice(0, 1024),
          inquiry: String(item.inquiry || '').slice(0, 1024),
          status: item.status || 'Formidable',
          isCustom: true,
        });
      }
    }

    // Sanitize chronicleNotes (if v2/v3)
    const chronicleNotes: ConfrontationNoteItem[] = [];
    const rawNotes = Array.isArray(data.chronicleNotes) ? data.chronicleNotes : [];
    for (const item of rawNotes) {
      if (item && typeof item === 'object' && typeof item.id === 'string' && typeof item.text === 'string') {
        chronicleNotes.push({
          id: String(item.id),
          userId: String(item.userId || 'local-user'),
          dragonId: String(item.dragonId || 'dragon-inertia'),
          dragonName: String(item.dragonName || 'Unknown Leviathan'),
          text: String(item.text).slice(0, 10000),
          status: item.status || 'Acknowledged',
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: item.updatedAt || new Date().toISOString(),
        });
      }
    }

    // Sanitize counselChats (if v2/v3)
    const counselChats: ChatMessageItem[] = [];
    const rawChats = Array.isArray(data.counselChats) ? data.counselChats : [];
    for (const item of rawChats) {
      if (item && typeof item === 'object' && typeof item.id === 'string' && typeof item.content === 'string') {
        const role = item.role === 'model' ? 'model' : 'user';
        counselChats.push({
          id: String(item.id),
          userId: item.userId ? String(item.userId) : undefined,
          dragonId: item.dragonId ? String(item.dragonId) : undefined,
          role,
          content: String(item.content).slice(0, 15000),
          modelUsed: item.modelUsed ? String(item.modelUsed) : 'gemini-3.8-flash',
          createdAt: item.createdAt || new Date().toISOString(),
        });
      }
    }

    // Validate monsters (v1 and v2 simply have no monsters)
    const validatedMonsters: Monster[] = [];
    if (version === 3) {
      if (data.monsters !== undefined && !Array.isArray(data.monsters)) {
        return {
          isValid: false,
          error: 'Invalid backup: "monsters" property must be an array of monsters.',
        };
      }
      const rawMonsters = Array.isArray(data.monsters) ? data.monsters : [];
      for (let i = 0; i < rawMonsters.length; i++) {
        const rawM = rawMonsters[i];
        const monster = validateMonster(rawM);
        if (!monster) {
          const monsterDesc =
            rawM && typeof rawM === 'object' && typeof rawM.name === 'string'
              ? `"${rawM.name}"`
              : `at index ${i}`;
          return {
            isValid: false,
            error: `Invalid monster record ${monsterDesc}: failed validation checks.`,
          };
        }
        validatedMonsters.push(monster);
      }
    }

    const sanitizedPayload: DracoAnimiBackupPayload = {
      schemaVersion: 3,
      app: 'Draco Animi',
      exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : new Date().toISOString(),
      stats: {
        customBestiaryCount: userBestiaryRecords.length,
        chronicleNotesCount: chronicleNotes.length,
        counselChatsCount: counselChats.length,
        monsterCount: validatedMonsters.length,
      },
      canonicalArchetypeCount: ARCHETYPE_CATALOGUE.length,
      userBestiaryRecords,
      chronicleNotes,
      counselChats,
      monsters: validatedMonsters,
    };

    return {
      isValid: true,
      payload: sanitizedPayload,
      summary: {
        bestiaryAdded: userBestiaryRecords.length,
        bestiaryUpdated: 0,
        notesAdded: chronicleNotes.length,
        notesUpdated: 0,
        chatsAdded: counselChats.length,
        chatsUpdated: 0,
        monstersCount: validatedMonsters.length,
      },
    };
  } catch (err) {
    return {
      isValid: false,
      error: `JSON parse error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Merge an imported backup into current data safely without data loss.
 * In 'merge' mode: Existing records with the same ID are updated; new records are appended.
 * For monsters: If the same id exists in both, keep the one whose latest journey entry is newer.
 * In 'replace' mode: Overwrites user records with the imported records.
 */
export function applyBackupImport(
  imported: DracoAnimiBackupPayload,
  current: {
    bestiary: MonsterRecord[];
    notes: ConfrontationNoteItem[];
    chats: ChatMessageItem[];
    monsters?: Monster[];
  },
  mode: 'merge' | 'replace' = 'merge'
): {
  mergedBestiary: MonsterRecord[];
  mergedNotes: ConfrontationNoteItem[];
  mergedChats: ChatMessageItem[];
  mergedMonsters: Monster[];
  stats: {
    bestiaryCount: number;
    notesCount: number;
    chatsCount: number;
    monsterCount: number;
  };
} {
  const currentMonsters = current.monsters || getMonstersSnapshot();

  if (mode === 'replace') {
    return {
      mergedBestiary: imported.userBestiaryRecords,
      mergedNotes: imported.chronicleNotes,
      mergedChats: imported.counselChats,
      mergedMonsters: imported.monsters,
      stats: {
        bestiaryCount: imported.userBestiaryRecords.length,
        notesCount: imported.chronicleNotes.length,
        chatsCount: imported.counselChats.length,
        monsterCount: imported.monsters.length,
      },
    };
  }

  // MERGE MODE (Default, non-destructive)
  // 1. Merge Bestiary
  const bestiaryMap = new Map<string, MonsterRecord>();
  current.bestiary.forEach((r) => bestiaryMap.set(r.id, r));
  imported.userBestiaryRecords.forEach((r) => bestiaryMap.set(r.id, r));
  const mergedBestiary = Array.from(bestiaryMap.values());

  // 2. Merge Chronicle Notes
  const notesMap = new Map<string, ConfrontationNoteItem>();
  current.notes.forEach((n) => notesMap.set(n.id, n));
  imported.chronicleNotes.forEach((n) => notesMap.set(n.id, n));
  const mergedNotes = Array.from(notesMap.values());
  mergedNotes.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  // 3. Merge Chats
  const chatsMap = new Map<string, ChatMessageItem>();
  current.chats.forEach((c) => chatsMap.set(c.id, c));
  imported.counselChats.forEach((c) => chatsMap.set(c.id, c));
  const mergedChats = Array.from(chatsMap.values());
  mergedChats.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));

  // 4. Merge Monsters
  // "Merge on import by id. If the same id exists in both, keep the one whose latest journey entry is newer."
  const monsterMap = new Map<string, Monster>();
  for (const m of currentMonsters) {
    monsterMap.set(m.id, m);
  }

  for (const imp of imported.monsters) {
    const existing = monsterMap.get(imp.id);
    if (!existing) {
      monsterMap.set(imp.id, imp);
    } else {
      const existingLatestTime = getLatestJourneyTimestamp(existing);
      const importedLatestTime = getLatestJourneyTimestamp(imp);
      if (importedLatestTime > existingLatestTime) {
        monsterMap.set(imp.id, imp);
      }
    }
  }

  const mergedMonsters = Array.from(monsterMap.values());

  return {
    mergedBestiary,
    mergedNotes,
    mergedChats,
    mergedMonsters,
    stats: {
      bestiaryCount: mergedBestiary.length,
      notesCount: mergedNotes.length,
      chatsCount: mergedChats.length,
      monsterCount: mergedMonsters.length,
    },
  };
}

/**
 * Build the full v3 backup payload.
 */
export function buildFullBackupPayload(
  notes: ConfrontationNoteItem[] = [],
  chats: ChatMessageItem[] = [],
  customBestiary?: MonsterRecord[],
  monstersList?: Monster[]
): DracoAnimiBackupPayload {
  const bestiaryRecords = customBestiary || getLocalBestiaryRecords();
  const currentMonsters = monstersList || getMonstersSnapshot();
  return {
    schemaVersion: 3,
    app: 'Draco Animi',
    exportedAt: new Date().toISOString(),
    stats: {
      customBestiaryCount: bestiaryRecords.length,
      chronicleNotesCount: notes.length,
      counselChatsCount: chats.length,
      monsterCount: currentMonsters.length,
    },
    canonicalArchetypeCount: ARCHETYPE_CATALOGUE.length,
    userBestiaryRecords: bestiaryRecords,
    chronicleNotes: notes,
    counselChats: chats,
    monsters: currentMonsters,
  };
}

/**
 * Trigger immediate browser download of the complete JSON backup.
 */
export function downloadCompleteBackup(
  notes: ConfrontationNoteItem[] = [],
  chats: ChatMessageItem[] = [],
  customBestiary?: MonsterRecord[],
  monstersList?: Monster[],
  filenamePrefix = 'draco-animi-complete-backup'
): void {
  if (typeof window === 'undefined') return;
  const payload = buildFullBackupPayload(notes, chats, customBestiary, monstersList);
  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  a.href = url;
  a.download = `${filenamePrefix}-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
