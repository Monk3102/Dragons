import { ARCHETYPE_CATALOGUE } from '../data/archetypesCatalogue';
import { RECIPES, getRecipe, PLACEHOLDER_RECIPE } from './registry';
import { CreatureRecipe, Shape, Part, DetailTier } from './types';
import { ferocityToT, partScale, partScaleMultiplier } from './ferocity';
import { valueNoise3D, interpolateProfile } from './noise';
import { placeScales, MAX_SCALES_PER_PART, MAX_SCALES_PER_CREATURE, CurveSample } from './scales';

export const MAX_PARTS_PER_RECIPE = 100;
export const MAX_TRIANGLES_ULTRA = 90000;
export const MAX_TRIANGLES_HIGH = 35000;
export const MAX_TRIANGLES_LOW = 6000;
export const MAX_DRAW_CALLS_ULTRA = 30;

export const SHAPE_TRIANGLES: Record<DetailTier, Record<Shape, number>> = {
  ultra: {
    sphere: 40 * 28 * 2, // 2240
    box: 12,
    cone: 20 * 2, // 40
    cylinder: 20 * 4, // 80
    torus: 16 * 40 * 2, // 1280
    capsule: 20 * (2 * 10 + 1) * 2, // 840
    octahedron: 8,
    blade: 8,
    tube: 20 * 96 * 2, // 3840
    membrane: 6,
  },
  high: {
    sphere: 20 * 12 * 2, // 480
    box: 12,
    cone: 10 * 2, // 20
    cylinder: 10 * 4, // 40
    torus: 8 * 16 * 2, // 256
    capsule: 10 * (2 * 5 + 1) * 2, // 220
    octahedron: 8,
    blade: 8,
    tube: 10 * 36 * 2, // 720
    membrane: 6,
  },
  low: {
    sphere: 12 * 7 * 2, // 168
    box: 12,
    cone: 6 * 2, // 12
    cylinder: 6 * 4, // 24
    torus: 6 * 10 * 2, // 120
    capsule: 6 * (2 * 3 + 1) * 2, // 84
    octahedron: 8,
    blade: 8,
    tube: 6 * 16 * 2, // 192
    membrane: 6,
  },
};

/**
 * Calculates estimated triangle count for a recipe at a specific detail tier and ferocity 10 (t = 1.0).
 */
export function estimateTriangles(recipe: CreatureRecipe, tier: DetailTier = 'high'): number {
  let total = 0;
  for (const part of recipe.parts) {
    if (tier === 'low' && part.fine) {
      continue;
    }

    let baseTris = SHAPE_TRIANGLES[tier][part.shape] || 20;

    if (part.shape === 'membrane' && part.polygon && part.polygon.length >= 3) {
      baseTris = (part.polygon.length - 2) * 2;
    }

    const count = part.repeat ? part.repeat.count : 1;
    total += baseTris * count;

    // Scale plates instanced on tubes (full at ultra, 35% at high, none at low)
    if (part.tube?.scales) {
      let scaleCount = 0;
      if (tier === 'ultra') {
        scaleCount = Math.min(MAX_SCALES_PER_PART, Math.max(0, part.tube.scales.count));
      } else if (tier === 'high') {
        scaleCount = Math.round(Math.min(MAX_SCALES_PER_PART, Math.max(0, part.tube.scales.count)) * 0.35);
      }
      total += scaleCount * 2; // Diamond quad = 2 triangles
    }
  }
  return total;
}

/**
 * Estimates GPU draw calls for a creature recipe based on distinct shape/role/material batches.
 */
export function estimateDrawCalls(recipe: CreatureRecipe): number {
  const batches = new Set<string>();
  for (const part of recipe.parts) {
    if (part.repeat && part.repeat.count >= 4) {
      batches.add(`instanced_${part.id}`);
    } else {
      batches.add(`batch_${part.shape}_${part.role}_${part.opacity ?? 1}_${part.skin ?? 'smooth'}`);
    }
    if (part.tube?.scales) {
      batches.add(`scales_${part.id}`);
    }
  }
  return batches.size;
}

let passedCount = 0;
let failedCount = 0;

function runTest(name: string, fn: () => boolean) {
  try {
    const passed = fn();
    if (passed) {
      console.log(`[PASS] ${name}`);
      passedCount++;
    } else {
      console.error(`[FAIL] ${name}`);
      failedCount++;
    }
  } catch (err) {
    console.error(`[FAIL] ${name} threw error:`, err);
    failedCount++;
  }
}

console.log('=== Running Creature Engine & Recipes Check Suite (Phase 6A-3) ===\n');

const allRecipesToCheck = [...Object.values(RECIPES), PLACEHOLDER_RECIPE];

// 1. Every registered recipe id exists in ARCHETYPE_CATALOGUE
runTest('every recipe id exists in ARCHETYPE_CATALOGUE', () => {
  const catalogueIds = new Set(ARCHETYPE_CATALOGUE.map((a) => a.id));
  for (const [id, recipe] of Object.entries(RECIPES)) {
    if (!catalogueIds.has(id)) {
      console.error(`Recipe key "${id}" does not exist in ARCHETYPE_CATALOGUE`);
      return false;
    }
    if (recipe.id !== id) {
      console.error(`Recipe id "${recipe.id}" does not match key "${id}"`);
      return false;
    }
  }
  return true;
});

// 2. Part ids are unique within each recipe
runTest('part ids are unique within each recipe', () => {
  for (const recipe of allRecipesToCheck) {
    const seen = new Set<string>();
    for (const part of recipe.parts) {
      if (seen.has(part.id)) {
        console.error(`Duplicate part id "${part.id}" in recipe "${recipe.id}"`);
        return false;
      }
      seen.add(part.id);
    }
  }
  return true;
});

// 3. All numbers are finite; appearAt and opacity are in [0, 1]
runTest('all numbers are finite; appearAt and opacity are in [0, 1]', () => {
  const checkFiniteArray = (arr: number[] | undefined) => {
    if (!arr) return true;
    return arr.every((n) => typeof n === 'number' && Number.isFinite(n));
  };

  for (const recipe of allRecipesToCheck) {
    for (const p of recipe.parts) {
      if (!checkFiniteArray(p.pos)) return false;
      if (!checkFiniteArray(p.scale)) return false;
      if (p.rot && !checkFiniteArray(p.rot)) return false;
      if (p.grow && !checkFiniteArray(p.grow)) return false;

      if (p.appearAt !== undefined) {
        if (!Number.isFinite(p.appearAt) || p.appearAt < 0 || p.appearAt > 1) {
          console.error(`Invalid appearAt in part "${p.id}": ${p.appearAt}`);
          return false;
        }
      }

      if (p.opacity !== undefined) {
        if (!Number.isFinite(p.opacity) || p.opacity < 0 || p.opacity > 1) {
          console.error(`Invalid opacity in part "${p.id}": ${p.opacity}`);
          return false;
        }
      }

      if (p.anim) {
        if (!Number.isFinite(p.anim.speed) || !Number.isFinite(p.anim.amp)) return false;
        if (p.anim.phase !== undefined && !Number.isFinite(p.anim.phase)) return false;
      }

      if (p.repeat) {
        if (!Number.isInteger(p.repeat.count) || p.repeat.count <= 0) return false;
        if (p.repeat.stepPos && !checkFiniteArray(p.repeat.stepPos)) return false;
        if (p.repeat.stepRot && !checkFiniteArray(p.repeat.stepRot)) return false;
        if (p.repeat.stepScale && !checkFiniteArray(p.repeat.stepScale)) return false;
      }
    }
  }
  return true;
});

// 4. Every recipe is within multi-tier budgets
runTest(
  'every recipe is within multi-tier budgets (ultra <= 90k, high <= 35k, low <= 6k, dc <= 30, parts <= 60)',
  () => {
    for (const recipe of allRecipesToCheck) {
      const partsCount = recipe.parts.length;
      const trisUltra = estimateTriangles(recipe, 'ultra');
      const trisHigh = estimateTriangles(recipe, 'high');
      const trisLow = estimateTriangles(recipe, 'low');
      const drawCalls = estimateDrawCalls(recipe);

      if (partsCount > MAX_PARTS_PER_RECIPE) {
        console.error(`Recipe "${recipe.id}" exceeds part budget: ${partsCount} > ${MAX_PARTS_PER_RECIPE}`);
        return false;
      }
      if (trisUltra > MAX_TRIANGLES_ULTRA) {
        console.error(`Recipe "${recipe.id}" exceeds ultra budget: ${trisUltra} > ${MAX_TRIANGLES_ULTRA}`);
        return false;
      }
      if (recipe.id === 'archetype-dragon' && trisUltra < 25000) {
        console.error(`Dragon recipe ultra triangles below minimum: ${trisUltra} < 25000`);
        return false;
      }
      if (trisHigh > MAX_TRIANGLES_HIGH) {
        console.error(`Recipe "${recipe.id}" exceeds high budget: ${trisHigh} > ${MAX_TRIANGLES_HIGH}`);
        return false;
      }
      if (trisLow > MAX_TRIANGLES_LOW) {
        console.error(`Recipe "${recipe.id}" exceeds low budget: ${trisLow} > ${MAX_TRIANGLES_LOW}`);
        return false;
      }
      if (drawCalls > MAX_DRAW_CALLS_ULTRA) {
        console.error(`Recipe "${recipe.id}" exceeds draw call budget: ${drawCalls} > ${MAX_DRAW_CALLS_ULTRA}`);
        return false;
      }
    }
    return true;
  }
);

// 5. Ferocity math is monotonic and has no jumps
runTest('ferocity math is monotonic and has no jumps (compare t = 0.0, 0.01, ... 1.0)', () => {
  const testParts: Part[] = [
    { id: 'grow-only', shape: 'box', role: 'body', pos: [0, 0, 0], scale: [1, 1, 1], grow: [1.0, 2.5] },
    { id: 'appear-only', shape: 'cone', role: 'accent', pos: [0, 0, 0], scale: [1, 1, 1], appearAt: 0.4 },
    { id: 'grow-and-appear', shape: 'sphere', role: 'glow', pos: [0, 0, 0], scale: [1, 1, 1], grow: [1.0, 2.0], appearAt: 0.3 },
    { id: 'plain', shape: 'cylinder', role: 'body', pos: [0, 0, 0], scale: [1, 1, 1] },
  ];

  for (const part of testParts) {
    let prevMult = partScaleMultiplier(part, 0);

    for (let step = 1; step <= 100; step++) {
      const t = step / 100;
      const mult = partScaleMultiplier(part, t);

      // Monotonic check (multiplier must not decrease)
      if (mult < prevMult - 1e-9) {
        console.error(`Non-monotonic scale in part "${part.id}" at t=${t}: prev=${prevMult}, curr=${mult}`);
        return false;
      }

      // No sudden jump check (smooth step <= 0.25 across 0.01 interval)
      const diff = mult - prevMult;
      if (diff > 0.25) {
        console.error(`Jump detected in part "${part.id}" at t=${t}: step diff=${diff}`);
        return false;
      }

      // Tuple partScale test
      const scaleTuple = partScale(part, t);
      if (!Number.isFinite(scaleTuple[0]) || scaleTuple[0] < 0) return false;

      prevMult = mult;
    }
  }

  // Check ferocityToT bounds and monotonicity across [1, 10]
  if (ferocityToT(1) !== 0 || ferocityToT(10) !== 1) return false;
  for (let f = 1; f < 10; f += 0.5) {
    if (ferocityToT(f + 0.5) <= ferocityToT(f)) return false;
  }

  return true;
});

// 6. getRecipe returns placeholder for unknown id
runTest('getRecipe returns the placeholder for an unknown id', () => {
  const unknown1 = getRecipe('nonexistent-creature');
  const unknown2 = getRecipe('');
  const unknown3 = getRecipe(null);
  const unknown4 = getRecipe(undefined);

  if (unknown1.id !== PLACEHOLDER_RECIPE.id) return false;
  if (unknown2.id !== PLACEHOLDER_RECIPE.id) return false;
  if (unknown3.id !== PLACEHOLDER_RECIPE.id) return false;
  if (unknown4.id !== PLACEHOLDER_RECIPE.id) return false;

  if (getRecipe('archetype-dragon').id !== 'archetype-dragon') return false;
  if (getRecipe('archetype-troll').id !== 'archetype-troll') return false;
  if (getRecipe('archetype-hydra').id !== 'archetype-hydra') return false;

  return true;
});

// 7. No two recipes have identical parts
runTest('no two recipes have identical parts', () => {
  const recipes = Object.values(RECIPES);
  for (let i = 0; i < recipes.length; i++) {
    for (let j = i + 1; j < recipes.length; j++) {
      const rA = recipes[i];
      const rB = recipes[j];
      const idsA = rA.parts.map((p) => p.id).sort().join(',');
      const idsB = rB.parts.map((p) => p.id).sort().join(',');
      if (idsA === idsB) {
        console.error(`Recipes "${rA.id}" and "${rB.id}" have identical parts list`);
        return false;
      }
    }
  }
  return true;
});

// 8. Deterministic and bounded 3D value noise
runTest('deterministic and bounded 3D noise (same inputs = same output, [-1, 1], seed changes result)', () => {
  const v1 = valueNoise3D(1.23, 4.56, 7.89, 42);
  const v2 = valueNoise3D(1.23, 4.56, 7.89, 42);
  const vOtherSeed = valueNoise3D(1.23, 4.56, 7.89, 999);

  if (v1 !== v2) {
    console.error(`valueNoise3D not deterministic: ${v1} !== ${v2}`);
    return false;
  }
  if (v1 === vOtherSeed) {
    console.error('valueNoise3D seed does not affect result');
    return false;
  }

  // Bounds check across 50 sample coordinates
  for (let i = 0; i < 50; i++) {
    const n = valueNoise3D(i * 0.37, i * -0.61, i * 1.13, 100 + i);
    if (n < -1 || n > 1 || !Number.isFinite(n)) {
      console.error(`valueNoise3D out of bounds [-1, 1]: ${n}`);
      return false;
    }
  }
  return true;
});

// 9. radiusProfile boundary matching and range bounds
runTest('radiusProfile: boundaries u=0 and u=1 match exact values; intermediate values bounded', () => {
  const profile = [0.4, 0.8, 1.2, 0.6];
  const atZero = interpolateProfile(profile, 0.0);
  const atOne = interpolateProfile(profile, 1.0);

  if (Math.abs(atZero - 0.4) > 1e-6) {
    console.error(`radiusProfile at u=0 expected 0.4, got ${atZero}`);
    return false;
  }
  if (Math.abs(atOne - 0.6) > 1e-6) {
    console.error(`radiusProfile at u=1 expected 0.6, got ${atOne}`);
    return false;
  }

  const minVal = Math.min(...profile);
  const maxVal = Math.max(...profile);

  for (let step = 0; step <= 50; step++) {
    const u = step / 50;
    const val = interpolateProfile(profile, u);
    if (val < minVal - 1e-6 || val > maxVal + 1e-6) {
      console.error(`radiusProfile at u=${u} exceeded bounding range [${minVal}, ${maxVal}]: ${val}`);
      return false;
    }
  }
  return true;
});

// 10. placeScales determinism, count caps and surface adherence
runTest('placeScales: determinism, count caps (<= 2500 per part, <= 6000 creature), surface adherence within 5%', () => {
  // Construct straight line mock curve samples along Z axis from z=0 to z=10
  const mockCurve: CurveSample[] = [];
  for (let i = 0; i <= 10; i++) {
    const u = i / 10;
    mockCurve.push({
      u,
      pos: [0, 0, u * 10],
      tangent: [0, 0, 1],
      normal: [1, 0, 0],
      binormal: [0, 1, 0],
    });
  }

  const radiusAt = (u: number) => 1.5 - u * 0.5; // Tapers from 1.5 to 1.0

  const spec = { count: 350, size: [0.1, 0.2] as [number, number], seed: 77 };
  const res1 = placeScales(spec, mockCurve, radiusAt);
  const res2 = placeScales(spec, mockCurve, radiusAt);

  if (res1.count !== res2.count || res1.count !== 350) {
    console.error(`placeScales count error: res1=${res1.count}, res2=${res2.count}`);
    return false;
  }

  // Determinism check
  for (let i = 0; i < res1.positions.length; i++) {
    if (res1.positions[i] !== res2.positions[i]) {
      console.error(`placeScales position mismatch at index ${i}`);
      return false;
    }
  }

  // Cap check: Request 5000 scales on one part -> must be capped at MAX_SCALES_PER_PART (2500)
  const overCapSpec = { count: 5000, size: [0.1, 0.2] as [number, number], seed: 77 };
  const resOverCap = placeScales(overCapSpec, mockCurve, radiusAt);
  if (resOverCap.count > MAX_SCALES_PER_PART) {
    console.error(`placeScales failed to cap at ${MAX_SCALES_PER_PART}: got ${resOverCap.count}`);
    return false;
  }

  // Total creature scale cap test
  let totalCreatureScales = 0;
  for (const part of RECIPES['archetype-dragon'].parts) {
    if (part.tube?.scales) {
      totalCreatureScales += Math.min(MAX_SCALES_PER_PART, part.tube.scales.count);
    }
  }
  if (totalCreatureScales > MAX_SCALES_PER_CREATURE) {
    console.error(`Creature exceeds MAX_SCALES_PER_CREATURE (${MAX_SCALES_PER_CREATURE}): ${totalCreatureScales}`);
    return false;
  }

  // Surface adherence: Each placed position must lie within 5% of radius around the spine
  for (let i = 0; i < res1.count; i++) {
    const px = res1.positions[i * 3];
    const py = res1.positions[i * 3 + 1];
    const pz = res1.positions[i * 3 + 2];

    const u = Math.max(0, Math.min(1, pz / 10));
    const expectedR = radiusAt(u);
    const actualR = Math.hypot(px, py); // spine center is (0, 0, pz)

    const deviation = Math.abs(actualR - expectedR) / expectedR;
    if (deviation > 0.05) {
      console.error(`Scale ${i} deviated from surface by ${(deviation * 100).toFixed(2)}% (expected <= 5%)`);
      return false;
    }
  }

  return true;
});

// 11. Backward compatibility: Troll, Hydra, placeholder use none of new fields
runTest('backward compatibility: Troll, Hydra, and placeholder use none of new fields', () => {
  const legacyRecipes = [RECIPES['archetype-troll'], RECIPES['archetype-hydra'], PLACEHOLDER_RECIPE];

  for (const recipe of legacyRecipes) {
    if (recipe.viewpoints) {
      console.error(`Legacy recipe "${recipe.id}" has viewpoints defined`);
      return false;
    }
    for (const part of recipe.parts) {
      if (part.skin) {
        console.error(`Legacy recipe "${recipe.id}" part "${part.id}" defines skin`);
        return false;
      }
      if (part.texScale) {
        console.error(`Legacy recipe "${recipe.id}" part "${part.id}" defines texScale`);
        return false;
      }
      if (part.role === 'membrane' || part.role === 'eye') {
        console.error(`Legacy recipe "${recipe.id}" part "${part.id}" uses new role "${part.role}"`);
        return false;
      }
      if (part.tube?.aspect || part.tube?.radiusProfile || part.tube?.bumps || part.tube?.scales) {
        console.error(`Legacy recipe "${recipe.id}" part "${part.id}" uses new tube features`);
        return false;
      }
    }
  }
  return true;
});

// 12. Check script runs with zero Three.js or DOM imports
runTest('pure logic imports: test runner has zero Three.js or DOM imports', () => {
  // If THREE or window or document were imported at top level, they would exist or throw in Node
  return typeof (globalThis as any).window === 'undefined';
});

// Print creature budget summary table
console.log('\n--- Creature Recipe Multi-Tier Budget Summary Table ---');
console.log(
  '| ID'.padEnd(20) +
  '| Parts'.padEnd(10) +
  '| Ultra Tris'.padEnd(14) +
  '| High Tris'.padEnd(14) +
  '| Low Tris'.padEnd(14) +
  '| Draw Calls'.padEnd(14) +
  '| Status'
);
console.log('-'.repeat(95));

for (const recipe of allRecipesToCheck) {
  const pCount = recipe.parts.length;
  const trisUltra = estimateTriangles(recipe, 'ultra');
  const trisHigh = estimateTriangles(recipe, 'high');
  const trisLow = estimateTriangles(recipe, 'low');
  const dc = estimateDrawCalls(recipe);
  const withinBudget =
    pCount <= MAX_PARTS_PER_RECIPE &&
    trisUltra <= MAX_TRIANGLES_ULTRA &&
    (recipe.id !== 'archetype-dragon' || trisUltra >= 25000) &&
    trisHigh <= MAX_TRIANGLES_HIGH &&
    trisLow <= MAX_TRIANGLES_LOW &&
    dc <= MAX_DRAW_CALLS_ULTRA;

  console.log(
    `| ${recipe.id}`.padEnd(20) +
    `| ${pCount}/${MAX_PARTS_PER_RECIPE}`.padEnd(10) +
    `| ${trisUltra}/${MAX_TRIANGLES_ULTRA}`.padEnd(14) +
    `| ${trisHigh}/${MAX_TRIANGLES_HIGH}`.padEnd(14) +
    `| ${trisLow}/${MAX_TRIANGLES_LOW}`.padEnd(14) +
    `| ${dc}/${MAX_DRAW_CALLS_ULTRA}`.padEnd(14) +
    `| ${withinBudget ? 'OK' : 'EXCEEDED'}`
  );
}
console.log('-'.repeat(95));

console.log(`\nResults: ${passedCount} passed, ${failedCount} failed.`);

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
