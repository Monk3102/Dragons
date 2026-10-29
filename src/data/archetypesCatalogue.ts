import { ArchetypeCatalogueEntry } from '../types';

/**
 * The Canonical Bestiary Archetype Catalogue (42 Archetypes).
 *
 * This catalogue serves as the reference archive of mythological creature archetypes
 * representing human psychological patterns, fears, resistances, and struggles.
 *
 * Strict Constraints:
 * - Contains the exact canonical names and working meanings supplied in the Draco Animi brief.
 * - Does not invent additional titles, categories, temperaments, voices, roots, somatic feelings, or inquiries.
 * - Unspecified characteristics remain optional.
 * - Entries here are static reference definitions and do not instantiate 3D objects in the scene.
 * - The three foundational 3D dragons in `src/data/dragons.ts` remain separate and unchanged.
 */
export const ARCHETYPE_CATALOGUE: ArchetypeCatalogueEntry[] = [
  {
    index: 1,
    id: 'archetype-dragon',
    name: 'Dragon',
    workingMeaning: 'A problem that grows when neglected',
  },
  {
    index: 2,
    id: 'archetype-hydra',
    name: 'Hydra',
    workingMeaning: 'A problem that multiplies when treated incorrectly',
  },
  {
    index: 3,
    id: 'archetype-sirens',
    name: 'Sirens',
    workingMeaning: 'Temptation and loss of self-control',
  },
  {
    index: 4,
    id: 'archetype-minotaur',
    name: 'Minotaur',
    workingMeaning: 'A frightening problem hidden within a complicated situation',
  },
  {
    index: 5,
    id: 'archetype-medusa',
    name: 'Medusa',
    workingMeaning: 'Fear that prevents effective action',
  },
  {
    index: 6,
    id: 'archetype-vampire',
    name: 'Vampire',
    workingMeaning: 'Persistent depletion of resources',
  },
  {
    index: 7,
    id: 'archetype-werewolf',
    name: 'Werewolf',
    workingMeaning: 'Uncontrolled impulses',
  },
  {
    index: 8,
    id: 'archetype-cyclops',
    name: 'Cyclops',
    workingMeaning: 'Narrow thinking and blind spots',
  },
  {
    index: 9,
    id: 'archetype-cerberus',
    name: 'Cerberus',
    workingMeaning: 'A difficult transition or boundary',
  },
  {
    index: 10,
    id: 'archetype-giant',
    name: 'Giant',
    workingMeaning: 'A challenge that overwhelms your capabilities',
  },
  {
    index: 11,
    id: 'archetype-trickster',
    name: 'Trickster',
    workingMeaning: 'Cleverness used for deception or avoidance',
  },
  {
    index: 12,
    id: 'archetype-shadow-monster',
    name: 'Shadow monster',
    workingMeaning: 'Unacknowledged aspects of yourself',
  },
  {
    index: 13,
    id: 'archetype-fenrir',
    name: 'Fenrir',
    workingMeaning: 'A serious threat that may be difficult to contain',
  },
  {
    index: 14,
    id: 'archetype-jormungandr',
    name: 'Jörmungandr',
    workingMeaning: 'An interconnected problem that surrounds your life',
  },
  {
    index: 15,
    id: 'archetype-typhon',
    name: 'Typhon',
    workingMeaning: 'A crisis that overwhelms normal methods',
  },
  {
    index: 16,
    id: 'archetype-leviathan',
    name: 'Leviathan',
    workingMeaning: 'A powerful system or force beyond individual control',
  },
  {
    index: 17,
    id: 'archetype-sphinx',
    name: 'Sphinx',
    workingMeaning: 'A problem that requires understanding before action',
  },
  {
    index: 18,
    id: 'archetype-chimera',
    name: 'Chimera',
    workingMeaning: 'Conflicting objectives or incompatible demands',
  },
  {
    index: 19,
    id: 'archetype-kitsune',
    name: 'Kitsune',
    workingMeaning: 'Deception, disguise, and uncertainty about intentions',
  },
  {
    index: 20,
    id: 'archetype-doppelganger',
    name: 'Doppelgänger',
    workingMeaning: 'A conflict between self-image and actual behaviour',
  },
  {
    index: 21,
    id: 'archetype-icarus',
    name: 'Icarus',
    workingMeaning: 'Ambition without adequate regard for limitations',
  },
  {
    index: 22,
    id: 'archetype-arachne',
    name: 'Arachne',
    workingMeaning: 'Destructive competition or the need to prove oneself',
  },
  {
    index: 23,
    id: 'archetype-midas',
    name: 'Midas',
    workingMeaning: 'A desire that undermines the value of its reward',
  },
  {
    index: 24,
    id: 'archetype-narcissus',
    name: 'Narcissus',
    workingMeaning: "Excessive dependence on one's own image",
  },
  {
    index: 25,
    id: 'archetype-banshee',
    name: 'Banshee',
    workingMeaning: 'Fear of anticipated loss',
  },
  {
    index: 26,
    id: 'archetype-ghost',
    name: 'Ghost',
    workingMeaning: 'The continuing influence of the past',
  },
  {
    index: 27,
    id: 'archetype-ouroboros',
    name: 'Ouroboros',
    workingMeaning: 'A self-reinforcing cycle',
  },
  {
    index: 28,
    id: 'archetype-wendigo',
    name: 'Wendigo',
    workingMeaning: 'Destructive excess or insatiable desire',
  },
  {
    index: 29,
    id: 'archetype-scylla',
    name: 'Scylla',
    workingMeaning: 'One danger that forces you toward another',
  },
  {
    index: 30,
    id: 'archetype-charybdis',
    name: 'Charybdis',
    workingMeaning: 'A problem that consumes too many resources',
  },
  {
    index: 31,
    id: 'archetype-harpies',
    name: 'Harpies',
    workingMeaning: 'Persistent interference and disruption',
  },
  {
    index: 32,
    id: 'archetype-rakshasa',
    name: 'Rakshasa',
    workingMeaning: 'Deception that exploits vulnerabilities',
  },
  {
    index: 33,
    id: 'archetype-asura',
    name: 'Asura',
    workingMeaning: 'Competition that becomes a struggle for dominance',
  },
  {
    index: 34,
    id: 'archetype-apep',
    name: 'Apep',
    workingMeaning: 'Disorder that repeatedly threatens stability',
  },
  {
    index: 35,
    id: 'archetype-kraken',
    name: 'Kraken',
    workingMeaning: 'A hidden or poorly understood risk',
  },
  {
    index: 36,
    id: 'archetype-basilisk',
    name: 'Basilisk',
    workingMeaning: 'A danger that requires careful engagement',
  },
  {
    index: 37,
    id: 'archetype-baku',
    name: 'Baku',
    workingMeaning: 'The need to recover from distress',
  },
  {
    index: 38,
    id: 'archetype-golem',
    name: 'Golem',
    workingMeaning: 'Unintended consequences of something you create',
  },
  {
    index: 39,
    id: 'archetype-troll',
    name: 'Troll',
    workingMeaning: 'Distractions that consume disproportionate attention',
  },
  {
    index: 40,
    id: 'archetype-kelpie',
    name: 'Kelpie',
    workingMeaning: 'An attractive opportunity concealing danger',
  },
  {
    index: 41,
    id: 'archetype-phoenix',
    name: 'Phoenix',
    workingMeaning: 'Recovery and renewal after failure',
  },
  {
    index: 42,
    id: 'archetype-griffin',
    name: 'Griffin',
    workingMeaning: 'Combining different strengths',
  },
];

/**
 * Total count of canonical archetypes.
 */
export const ARCHETYPE_COUNT = ARCHETYPE_CATALOGUE.length;

/**
 * Retrieve a canonical archetype by its unique ID.
 */
export function getArchetypeById(id: string): ArchetypeCatalogueEntry | undefined {
  return ARCHETYPE_CATALOGUE.find((a) => a.id === id);
}

/**
 * Retrieve a canonical archetype by its 1-indexed catalogue position.
 */
export function getArchetypeByIndex(index: number): ArchetypeCatalogueEntry | undefined {
  return ARCHETYPE_CATALOGUE.find((a) => a.index === index);
}

/**
 * Search archetypes matching a keyword query across name and working meaning.
 */
export function searchArchetypes(query: string): ArchetypeCatalogueEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return ARCHETYPE_CATALOGUE;
  return ARCHETYPE_CATALOGUE.filter(
    (a) =>
      a.name.toLowerCase().includes(q) ||
      (a.workingMeaning && a.workingMeaning.toLowerCase().includes(q))
  );
}
