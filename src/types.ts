export type DragonTemperament = 'Heavy & Paralyzing' | 'Erratic & Restless' | 'Cold & Austere' | (string & {});

/**
 * Canonical reference archetype entry in the Bestiary Catalogue.
 * Unspecified characteristics are explicitly optional to avoid speculative invention.
 */
export interface ArchetypeCatalogueEntry {
  id: string;
  name: string;
  subtitle?: string;
  category?: string;
  workingMeaning?: string;
  temperament?: DragonTemperament;
  manifestation?: string;
  voice?: string;
  roots?: string;
  somaticFeeling?: string;
  inquiry?: string;
  index?: number;
}

/**
 * Active monster record in the user's bestiary.
 * Supports both library-only monsters and entities with 3D scene representations.
 */
export interface MonsterRecord {
  id: string;
  name: string;
  subtitle: string;
  category: string;
  temperament: DragonTemperament;
  manifestation: string;
  voice: string;
  roots: string;
  somaticFeeling: string;
  inquiry: string;
  status: 'Formidable' | 'Resting' | 'Acknowledged' | 'Under Inspection';

  // Optional catalogue linkage and user-customization metadata
  archetypeId?: string;
  isCustom?: boolean;
  userId?: string;

  // Optional 3D representation parameters (for entities with physical geometry in the void)
  is3D?: boolean;
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
  accentColor?: string;
  coreGlow?: string;
  roughness?: number;
  metalness?: number;
  wingspan?: number;
  bodySegments?: number;
  floatingHeight?: number;
  bobbingSpeed?: number;
  bobbingAmplitude?: number;
}

/**
 * 3D Dragon entity strictly preserving all required Three.js parameters and psychological traits.
 * Backward-compatible with all existing components.
 */
export interface DragonProblem extends MonsterRecord {
  scale: number;
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  accentColor: string;
  coreGlow: string;
  roughness: number;
  metalness: number;
  wingspan: number;
  bodySegments: number;
  floatingHeight: number;
  bobbingSpeed: number;
  bobbingAmplitude: number;
  createdAt?: string;
  creatureTypeId?: string;
}

export type NoteStatus = 'Formidable' | 'Acknowledged' | 'Weakened' | 'Transmuted';
export type MonsterStatus = 'Formidable' | 'Resting' | 'Acknowledged' | 'Under Inspection';

export interface ConfrontationNoteItem {
  id: string;
  userId: string;
  dragonId: string;
  dragonName: string;
  text: string;
  status: NoteStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatMessageItem {
  id: string;
  userId?: string;
  dragonId?: string;
  role: 'user' | 'model';
  content: string;
  modelUsed?: string;
  createdAt?: string;
}

export type ActiveView = 'world' | 'inspect' | 'notes';

export interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
}

/**
 * Dial value representing a subjective psychological metric from 1 to 10:
 * - size: 1 = tiny, 10 = huge.
 * - distance: 1 = very near, 10 = very far (the user's gut feeling, not a deadline).
 * - ferocity: 1 = mild, 10 = severe consequences.
 */
export type Dial = number;

export interface JourneyEntry {
  id: string;
  at: string; // ISO string
  kind: 'spawn' | 'change' | 'slain';
  size: Dial;
  distance: Dial;
  ferocity: Dial;
  note: string;
}

export interface Monster {
  id: string;
  name: string;
  creatureTypeId: string; // an id from ARCHETYPE_CATALOGUE
  problem: string; // what it represents
  size: Dial;
  distance: Dial;
  ferocity: Dial;
  status: 'alive' | 'slain';
  createdAt: string; // ISO string
  slainAt?: string; // ISO string
  finalNote?: string;
  isSample?: boolean;
  journey: JourneyEntry[];
}

