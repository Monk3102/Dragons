import { Dial } from '../types';

/**
 * ============================================================================
 * TUNABLE NUMERIC CONSTANTS FOR 3D DIAL MAPPING
 * ============================================================================
 */

/** Base scale multiplier for size = 1 */
export const SCALE_BASE = 1.2;
/** Scale step added per size point */
export const SCALE_STEP = 0.4;

/** Base distance (in Three.js world units) from the origin / Sentry for distance = 1 */
export const RADIUS_BASE = 9.0;
/** Distance step added per unit of distance */
export const RADIUS_STEP = 4.5;

/** Base vertical floating height */
export const HEIGHT_BASE = 4.0;
/** Vertical height scaling multiplier with monster scale */
export const HEIGHT_SCALE_FACTOR = 1.6;
/** Maximum vertical jitter height applied stably per monster */
export const HEIGHT_JITTER_MAX = 3.0;

/** Viewing arc half-angle in degrees around the negative Z axis (facing away from default camera) */
export const ARC_DEGREES = 100.0;
/** Viewing arc half-angle in radians */
export const ARC_RADIANS = (ARC_DEGREES * Math.PI) / 180.0;

/** Step angle in radians when rotating to resolve overlaps */
export const OVERLAP_STEP_RAD = (1.5 * Math.PI) / 180.0;
/** Minimum clearance factor: distance must be >= OVERLAP_DISTANCE_FACTOR * (scaleA + scaleB) */
export const OVERLAP_DISTANCE_FACTOR = 1.2;

/** Base core glow intensity */
export const GLOW_STRENGTH_BASE = 0.4;
/** Glow intensity multiplier scaled by ferocity factor t */
export const GLOW_STRENGTH_FACTOR = 1.6;

/** Base vertical bobbing oscillation speed */
export const BOB_SPEED_BASE = 0.4;
/** Bobbing oscillation speed multiplier scaled by ferocity factor t */
export const BOB_SPEED_FACTOR = 1.4;

/** Base vertical bobbing amplitude (displacement in units) */
export const BOB_AMP_BASE = 0.4;
/** Bobbing amplitude multiplier scaled by ferocity factor t */
export const BOB_AMP_FACTOR = 0.7;

/**
 * Output visual parameters computed purely from a monster's three dials.
 */
export interface MonsterVisualParameters {
  scale: number;
  radius: number;
  floatingHeight: number;
  glowStrength: number;
  glowColor: string;
  bobbingSpeed: number;
  bobbingAmplitude: number;
  t: number; // Ferocity normalized 0..1
}

/**
 * Layout position in 3D space with resolved angle.
 */
export interface MonsterLayoutPosition {
  id: string;
  x: number;
  y: number;
  z: number;
  scale: number;
  angle: number;
  radius: number;
}

/**
 * Deterministic 32-bit FNV-1a string hash returning a float in [0, 1).
 * Never uses Math.random.
 */
export function hashString(str: string, seed = 0): number {
  let h = (seed ^ 0x811c9dc5) >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h / 4294967296;
}

/**
 * Maps ferocity factor t (0..1) to a hex glow color:
 * #9fd4ff (t = 0) -> #ff5a36 (t = 0.6) -> #ff1f1f (t = 1)
 */
export function interpolateGlowColor(t: number): string {
  const clampedT = Math.max(0, Math.min(1, t));

  // Color 0: #9fd4ff -> (159, 212, 255)
  // Color 1: #ff5a36 -> (255, 90, 54)
  // Color 2: #ff1f1f -> (255, 31, 31)
  let r: number;
  let g: number;
  let b: number;

  if (clampedT <= 0.6) {
    const u = clampedT / 0.6;
    r = Math.round(159 + u * (255 - 159));
    g = Math.round(212 + u * (90 - 212));
    b = Math.round(255 + u * (54 - 255));
  } else {
    const u = (clampedT - 0.6) / 0.4;
    r = Math.round(255 + u * (255 - 255));
    g = Math.round(90 + u * (31 - 90));
    b = Math.round(54 + u * (31 - 54));
  }

  const hexR = r.toString(16).padStart(2, '0');
  const hexG = g.toString(16).padStart(2, '0');
  const hexB = b.toString(16).padStart(2, '0');

  return `#${hexR}${hexG}${hexB}`;
}

/**
 * Computes scale from size dial (1..10).
 */
export function computeScale(size: Dial): number {
  return SCALE_BASE + SCALE_STEP * size;
}

/**
 * Computes radial distance from Sentry (origin) from distance dial (1..10).
 */
export function computeRadius(distance: Dial): number {
  return RADIUS_BASE + RADIUS_STEP * (distance - 1);
}

/**
 * Maps all 3 dials into visual metrics (scale, radius, height, glow, bobbing).
 */
export function dialsToVisuals(
  id: string,
  size: Dial,
  distance: Dial,
  ferocity: Dial
): MonsterVisualParameters {
  const t = (ferocity - 1) / 9;
  const scale = computeScale(size);
  const radius = computeRadius(distance);

  // Stable vertical jitter from 0 to 3 using hash of monster id
  const jitter = hashString(id + ':jitter') * HEIGHT_JITTER_MAX;
  const floatingHeight = HEIGHT_BASE + HEIGHT_SCALE_FACTOR * scale + jitter;

  const glowStrength = GLOW_STRENGTH_BASE + GLOW_STRENGTH_FACTOR * t;
  const glowColor = interpolateGlowColor(t);
  const bobbingSpeed = BOB_SPEED_BASE + BOB_SPEED_FACTOR * t;
  const bobbingAmplitude = BOB_AMP_BASE + BOB_AMP_FACTOR * t;

  return {
    scale,
    radius,
    floatingHeight,
    glowStrength,
    glowColor,
    bobbingSpeed,
    bobbingAmplitude,
    t,
  };
}

/**
 * Derives initial base angle for a monster in radians within [-ARC_RADIANS, +ARC_RADIANS]
 * around the direction facing away from the default camera (the negative Z axis).
 */
export function computeBaseAngle(id: string): number {
  const norm = hashString(id + ':angle');
  return (norm * 2 - 1) * ARC_RADIANS;
}

/**
 * Calculates 3D distance between two spatial positions.
 */
function distance3D(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): number {
  const dx = x1 - x2;
  const dy = y1 - y2;
  const dz = z1 - z2;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Lays out a collection of monsters in 3D space, resolving collisions deterministically.
 *
 * Rules:
 * - Process monsters in order of createdAt, then id.
 * - Angle is centered around negative z axis: x = radius * sin(angle), z = -radius * cos(angle).
 * - If two monsters would be closer than 1.2 * (scaleA + scaleB), rotate the later one's angle
 *   in small steps until they are not, remaining strictly within the viewing arc [-100deg, +100deg].
 * - Earlier monsters are never displaced by later monsters.
 */
export function layoutMonsters(
  monsters: Array<{
    id: string;
    size: Dial;
    distance: Dial;
    createdAt?: string;
  }>
): Map<string, MonsterLayoutPosition> {
  const layout = new Map<string, MonsterLayoutPosition>();

  // Deterministic processing order: createdAt ascending, then id ascending
  const sorted = [...monsters].sort((a, b) => {
    const timeA = a.createdAt || '';
    const timeB = b.createdAt || '';
    const cmp = timeA.localeCompare(timeB);
    if (cmp !== 0) return cmp;
    return a.id.localeCompare(b.id);
  });

  for (const monster of sorted) {
    const scale = computeScale(monster.size);
    const radius = computeRadius(monster.distance);
    const jitter = hashString(monster.id + ':jitter') * HEIGHT_JITTER_MAX;
    const y = HEIGHT_BASE + HEIGHT_SCALE_FACTOR * scale + jitter;

    const baseAngle = computeBaseAngle(monster.id);

    // Find non-overlapping angle starting from baseAngle
    let resolvedAngle = baseAngle;
    let resolvedX = radius * Math.sin(resolvedAngle);
    let resolvedZ = -radius * Math.cos(resolvedAngle);

    // Check collision against all already-placed monsters
    const placed = Array.from(layout.values());

    const hasCollision = (x: number, z: number, s: number) => {
      for (const other of placed) {
        const minDist = OVERLAP_DISTANCE_FACTOR * (s + other.scale);
        const dist = distance3D(x, y, z, other.x, other.y, other.z);
        if (dist < minDist) {
          return true;
        }
      }
      return false;
    };

    if (hasCollision(resolvedX, resolvedZ, scale)) {
      // Rotate in alternating small steps: +1, -1, +2, -2, ...
      // staying strictly within [-ARC_RADIANS, +ARC_RADIANS]
      const maxSteps = Math.ceil((2 * ARC_RADIANS) / OVERLAP_STEP_RAD);
      let found = false;

      for (let step = 1; step <= maxSteps; step++) {
        // Try positive step, then negative step
        for (const dir of [1, -1]) {
          const candAngle = baseAngle + dir * step * OVERLAP_STEP_RAD;
          if (candAngle >= -ARC_RADIANS && candAngle <= ARC_RADIANS) {
            const candX = radius * Math.sin(candAngle);
            const candZ = -radius * Math.cos(candAngle);
            if (!hasCollision(candX, candZ, scale)) {
              resolvedAngle = candAngle;
              resolvedX = candX;
              resolvedZ = candZ;
              found = true;
              break;
            }
          }
        }
        if (found) break;
      }
    }

    layout.set(monster.id, {
      id: monster.id,
      x: resolvedX,
      y,
      z: resolvedZ,
      scale,
      angle: resolvedAngle,
      radius,
    });
  }

  return layout;
}
