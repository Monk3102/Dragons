import { DragonProblem, Monster } from '../types';
import { INITIAL_DRAGONS } from '../data/dragons';
import { ARCHETYPE_CATALOGUE } from '../data/archetypesCatalogue';
import {
  dialsToVisuals,
  hashString,
  MonsterLayoutPosition,
} from './dialMapping';

/**
 * Pure HSL to Hex color conversion without three.js dependencies.
 */
function hslToHex(h: number, s: number, l: number): string {
  const normS = s / 100;
  const normL = l / 100;

  const c = (1 - Math.abs(2 * normL - 1)) * normS;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = normL - c / 2;

  let rPrime = 0;
  let gPrime = 0;
  let bPrime = 0;

  if (0 <= h && h < 60) {
    rPrime = c;
    gPrime = x;
  } else if (60 <= h && h < 120) {
    rPrime = x;
    gPrime = c;
  } else if (120 <= h && h < 180) {
    gPrime = c;
    bPrime = x;
  } else if (180 <= h && h < 240) {
    gPrime = x;
    bPrime = c;
  } else if (240 <= h && h < 300) {
    rPrime = x;
    bPrime = c;
  } else if (300 <= h && h < 360) {
    rPrime = c;
    bPrime = x;
  }

  const r = Math.round((rPrime + m) * 255);
  const g = Math.round((gPrime + m) * 255);
  const b = Math.round((bPrime + m) * 255);

  const hexR = r.toString(16).padStart(2, '0');
  const hexG = g.toString(16).padStart(2, '0');
  const hexB = b.toString(16).padStart(2, '0');

  return `#${hexR}${hexG}${hexB}`;
}

/**
 * Derives a dark, low-saturation base color and accent color from a stable hash of creatureTypeId.
 */
function deriveCreatureColors(creatureTypeId: string): { color: string; accentColor: string } {
  const norm = hashString(creatureTypeId + ':color');
  const hue = Math.round(norm * 360);

  // Dark and low saturation (L = 15-18%, S = 20-25%)
  const color = hslToHex(hue, 22, 16);
  // Subtle accent: slightly shifted hue, slightly lighter
  const accentColor = hslToHex((hue + 25) % 360, 28, 34);

  return { color, accentColor };
}

/**
 * Maps a single alive Monster and its layout position to a full 3D DragonProblem.
 * Renders EVERY alive monster.
 */
export function monsterToDragonProblem(
  monster: Monster,
  layout: MonsterLayoutPosition
): DragonProblem {
  const visuals = dialsToVisuals(
    monster.id,
    monster.size,
    monster.distance,
    monster.ferocity
  );

  // Check if monster corresponds to one of the 3 canonical sample dragons
  const sampleMatch = INITIAL_DRAGONS.find((d) => d.id === monster.id);
  const archetypeMatch = ARCHETYPE_CATALOGUE.find((a) => a.id === monster.creatureTypeId);

  const derived = deriveCreatureColors(monster.creatureTypeId);

  // Text fields: manifestation is problem text, fallback to workingMeaning.
  // voice, roots, somaticFeeling, inquiry are empty strings when unknown.
  const manifestation =
    (monster.problem && monster.problem.trim() !== '')
      ? monster.problem
      : (archetypeMatch?.workingMeaning || 'A monumental manifestation of internal resistance.');

  const voice = sampleMatch?.voice || '';
  const roots = sampleMatch?.roots || '';
  const somaticFeeling = sampleMatch?.somaticFeeling || '';
  const inquiry = sampleMatch?.inquiry || '';

  // Rotation: face toward the origin (where the Sentry stands)
  const facingAngle = Math.atan2(-layout.x, -layout.z);

  return {
    id: monster.id,
    name: monster.name,
    subtitle: monster.problem || archetypeMatch?.workingMeaning || '',
    category: archetypeMatch?.name || sampleMatch?.category || 'Internal Archetype',
    temperament: sampleMatch?.temperament || 'Formidable',
    manifestation,
    voice,
    roots,
    somaticFeeling,
    inquiry,
    status: 'Formidable',

    // 3D Visual Coordinates from Layout & Dials
    scale: layout.scale,
    position: [layout.x, layout.y, layout.z],
    rotation: [0, facingAngle, 0],

    // Material & Color Parameters
    color: sampleMatch ? sampleMatch.color : derived.color,
    accentColor: sampleMatch ? sampleMatch.accentColor : derived.accentColor,
    coreGlow: visuals.glowColor,
    roughness: sampleMatch ? sampleMatch.roughness : 0.6,
    metalness: sampleMatch ? sampleMatch.metalness : 0.4,
    wingspan: sampleMatch ? sampleMatch.wingspan : Number((layout.scale * 1.3).toFixed(2)),
    bodySegments: sampleMatch ? sampleMatch.bodySegments : 7,

    // Motion Dynamics
    floatingHeight: layout.y,
    bobbingSpeed: visuals.bobbingSpeed,
    bobbingAmplitude: visuals.bobbingAmplitude,

    // Dial attachment for inspector overlays
    ...( {
      dials: {
        size: monster.size,
        distance: monster.distance,
        ferocity: monster.ferocity,
      },
      coreGlowStrength: visuals.glowStrength,
    } as any ),
  };
}
