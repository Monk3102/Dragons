import { MonsterRecord, ConfrontationNoteItem, ChatMessageItem } from '../types';
import { ARCHETYPE_CATALOGUE } from '../data/archetypesCatalogue';
import { getLocalBestiaryRecords, saveLocalBestiaryRecord } from './localBestiary';

export const BACKUP_SCHEMA_VERSION = 2;

export interface DracoAnimiBackupPayload {
  schemaVersion: 2;
  app: 'Draco Animi';
  exportedAt: string;
  // Summary metadata for human and machine inspection
  stats: {
    customBestiaryCount: number;
    chronicleNotesCount: number;
    counselChatsCount: number;
  };
  // Reference information only (canonical catalogue is preserved statically)
  canonicalArchetypeCount: number;
  // User data payloads
  userBestiaryRecords: MonsterRecord[];
  chronicleNotes: ConfrontationNoteItem[];
  counselChats: ChatMessageItem[];
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
  };
}

export interface ImportValidationError {
  isValid: false;
  error: string;
}

export type ImportValidationResult = ImportValidationSuccess | ImportValidationError;

/**
 * Validate and safely parse an uploaded JSON backup string.
 */
export function validateBackupJson(rawJson: string): ImportValidationResult {
  try {
    const data = JSON.parse(rawJson);
    if (!data || typeof data !== 'object') {
      return { isValid: false, error: 'File is not a valid JSON object.' };
    }

    // Check version compatibility (supports v1 bestiary export or v2 full backup)
    const version = data.schemaVersion;
    if (version !== 1 && version !== 2) {
      return {
        isValid: false,
        error: `Unsupported schema version: ${version}. Expected version 1 or 2.`,
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

    // Sanitize chronicleNotes (if v2)
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

    // Sanitize counselChats (if v2)
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

    const sanitizedPayload: DracoAnimiBackupPayload = {
      schemaVersion: 2,
      app: 'Draco Animi',
      exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : new Date().toISOString(),
      stats: {
        customBestiaryCount: userBestiaryRecords.length,
        chronicleNotesCount: chronicleNotes.length,
        counselChatsCount: counselChats.length,
      },
      canonicalArchetypeCount: ARCHETYPE_CATALOGUE.length,
      userBestiaryRecords,
      chronicleNotes,
      counselChats,
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
 * In 'replace' mode: Overwrites user records with the imported records.
 */
export function applyBackupImport(
  imported: DracoAnimiBackupPayload,
  current: {
    bestiary: MonsterRecord[];
    notes: ConfrontationNoteItem[];
    chats: ChatMessageItem[];
  },
  mode: 'merge' | 'replace' = 'merge'
): {
  mergedBestiary: MonsterRecord[];
  mergedNotes: ConfrontationNoteItem[];
  mergedChats: ChatMessageItem[];
  stats: {
    bestiaryCount: number;
    notesCount: number;
    chatsCount: number;
  };
} {
  if (mode === 'replace') {
    return {
      mergedBestiary: imported.userBestiaryRecords,
      mergedNotes: imported.chronicleNotes,
      mergedChats: imported.counselChats,
      stats: {
        bestiaryCount: imported.userBestiaryRecords.length,
        notesCount: imported.chronicleNotes.length,
        chatsCount: imported.counselChats.length,
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
  // Sort newest first
  mergedNotes.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  // 3. Merge Chats
  const chatsMap = new Map<string, ChatMessageItem>();
  current.chats.forEach((c) => chatsMap.set(c.id, c));
  imported.counselChats.forEach((c) => chatsMap.set(c.id, c));
  const mergedChats = Array.from(chatsMap.values());
  // Sort chronological
  mergedChats.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));

  return {
    mergedBestiary,
    mergedNotes,
    mergedChats,
    stats: {
      bestiaryCount: mergedBestiary.length,
      notesCount: mergedNotes.length,
      chatsCount: mergedChats.length,
    },
  };
}

/**
 * Build the full v2 backup payload.
 */
export function buildFullBackupPayload(
  notes: ConfrontationNoteItem[],
  chats: ChatMessageItem[],
  customBestiary?: MonsterRecord[]
): DracoAnimiBackupPayload {
  const bestiaryRecords = customBestiary || getLocalBestiaryRecords();
  return {
    schemaVersion: 2,
    app: 'Draco Animi',
    exportedAt: new Date().toISOString(),
    stats: {
      customBestiaryCount: bestiaryRecords.length,
      chronicleNotesCount: notes.length,
      counselChatsCount: chats.length,
    },
    canonicalArchetypeCount: ARCHETYPE_CATALOGUE.length,
    userBestiaryRecords: bestiaryRecords,
    chronicleNotes: notes,
    counselChats: chats,
  };
}

/**
 * Trigger immediate browser download of the complete JSON backup.
 */
export function downloadCompleteBackup(
  notes: ConfrontationNoteItem[],
  chats: ChatMessageItem[],
  customBestiary?: MonsterRecord[],
  filenamePrefix = 'draco-animi-complete-backup'
): void {
  if (typeof window === 'undefined') return;
  const payload = buildFullBackupPayload(notes, chats, customBestiary);
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
