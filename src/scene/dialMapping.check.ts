import {
  computeScale,
  computeRadius,
  dialsToVisuals,
  layoutMonsters,
  ARC_RADIANS,
  OVERLAP_DISTANCE_FACTOR,
} from './dialMapping';
import { Dial } from '../types';

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

console.log('=== Running Dial Mapping Self-Check Suite ===\n');

// 1. scale increases when size increases
runTest('scale increases when size increases', () => {
  for (let s = 1; s < 10; s++) {
    const s1 = computeScale(s as Dial);
    const s2 = computeScale((s + 1) as Dial);
    if (!(s2 > s1)) return false;
  }
  return true;
});

// 2. radius increases when distance increases
runTest('radius increases when distance increases', () => {
  for (let d = 1; d < 10; d++) {
    const r1 = computeRadius(d as Dial);
    const r2 = computeRadius((d + 1) as Dial);
    if (!(r2 > r1)) return false;
  }
  return true;
});

// 3. glow strength, bobbingSpeed and bobbingAmplitude increase when ferocity increases
runTest('glow strength, bobbingSpeed and bobbingAmplitude increase when ferocity increases', () => {
  for (let f = 1; f < 10; f++) {
    const v1 = dialsToVisuals('test-id', 5, 5, f as Dial);
    const v2 = dialsToVisuals('test-id', 5, 5, (f + 1) as Dial);

    if (!(v2.glowStrength > v1.glowStrength)) return false;
    if (!(v2.bobbingSpeed > v1.bobbingSpeed)) return false;
    if (!(v2.bobbingAmplitude > v1.bobbingAmplitude)) return false;
  }
  return true;
});

// 4. all outputs are finite numbers for every dial from 1 to 10
runTest('all outputs are finite numbers for every dial from 1 to 10', () => {
  for (let s = 1; s <= 10; s++) {
    for (let d = 1; d <= 10; d++) {
      for (let f = 1; f <= 10; f++) {
        const v = dialsToVisuals(`finite-check-${s}-${d}-${f}`, s as Dial, d as Dial, f as Dial);
        if (
          !Number.isFinite(v.scale) ||
          !Number.isFinite(v.radius) ||
          !Number.isFinite(v.floatingHeight) ||
          !Number.isFinite(v.glowStrength) ||
          !Number.isFinite(v.bobbingSpeed) ||
          !Number.isFinite(v.bobbingAmplitude) ||
          !Number.isFinite(v.t) ||
          typeof v.glowColor !== 'string' ||
          !v.glowColor.startsWith('#')
        ) {
          return false;
        }
      }
    }
  }
  return true;
});

// 5. the same id gives the same layout every time
runTest('the same id gives the same layout every time', () => {
  const monsters = [
    { id: 'dragon-inertia', size: 8 as Dial, distance: 6 as Dial, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'dragon-cacophony', size: 6 as Dial, distance: 3 as Dial, createdAt: '2026-01-02T00:00:00Z' },
    { id: 'dragon-tyrant', size: 9 as Dial, distance: 8 as Dial, createdAt: '2026-01-03T00:00:00Z' },
  ];

  const layout1 = layoutMonsters(monsters);
  const layout2 = layoutMonsters(monsters);

  for (const m of monsters) {
    const p1 = layout1.get(m.id)!;
    const p2 = layout2.get(m.id)!;
    if (!p1 || !p2) return false;
    if (p1.x !== p2.x || p1.y !== p2.y || p1.z !== p2.z || p1.angle !== p2.angle) {
      return false;
    }
  }
  return true;
});

// 6. all positions fall inside the viewing arc
runTest('all positions fall inside the viewing arc', () => {
  const testSet = Array.from({ length: 30 }, (_, i) => ({
    id: `arc-test-monster-${i}`,
    size: ((i % 10) + 1) as Dial,
    distance: (((i * 3) % 10) + 1) as Dial,
    createdAt: new Date(1700000000000 + i * 100000).toISOString(),
  }));

  const layout = layoutMonsters(testSet);

  for (const pos of layout.values()) {
    // Angle must be in [-ARC_RADIANS, ARC_RADIANS]
    if (pos.angle < -ARC_RADIANS - 1e-6 || pos.angle > ARC_RADIANS + 1e-6) {
      return false;
    }
    // Verify coordinates match angle & radius: x = r * sin(angle), z = -r * cos(angle)
    const expectedX = pos.radius * Math.sin(pos.angle);
    const expectedZ = -pos.radius * Math.cos(pos.angle);
    if (Math.abs(pos.x - expectedX) > 1e-4 || Math.abs(pos.z - expectedZ) > 1e-4) {
      return false;
    }
  }
  return true;
});

// 7. with 12 monsters, no two overlap
runTest('with 12 monsters, no two overlap', () => {
  const twelve = [
    { id: 'm-1', size: 8 as Dial, distance: 4 as Dial, createdAt: '2026-01-01T01:00:00Z' },
    { id: 'm-2', size: 7 as Dial, distance: 4 as Dial, createdAt: '2026-01-01T02:00:00Z' },
    { id: 'm-3', size: 6 as Dial, distance: 4 as Dial, createdAt: '2026-01-01T03:00:00Z' },
    { id: 'm-4', size: 9 as Dial, distance: 6 as Dial, createdAt: '2026-01-01T04:00:00Z' },
    { id: 'm-5', size: 5 as Dial, distance: 2 as Dial, createdAt: '2026-01-01T05:00:00Z' },
    { id: 'm-6', size: 7 as Dial, distance: 5 as Dial, createdAt: '2026-01-01T06:00:00Z' },
    { id: 'm-7', size: 4 as Dial, distance: 3 as Dial, createdAt: '2026-01-01T07:00:00Z' },
    { id: 'm-8', size: 8 as Dial, distance: 7 as Dial, createdAt: '2026-01-01T08:00:00Z' },
    { id: 'm-9', size: 3 as Dial, distance: 1 as Dial, createdAt: '2026-01-01T09:00:00Z' },
    { id: 'm-10', size: 6 as Dial, distance: 8 as Dial, createdAt: '2026-01-01T10:00:00Z' },
    { id: 'm-11', size: 5 as Dial, distance: 5 as Dial, createdAt: '2026-01-01T11:00:00Z' },
    { id: 'm-12', size: 4 as Dial, distance: 9 as Dial, createdAt: '2026-01-01T12:00:00Z' },
  ];

  const layout = layoutMonsters(twelve);
  const items = Array.from(layout.values());

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i];
      const b = items[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dz = a.z - b.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const minDist = OVERLAP_DISTANCE_FACTOR * (a.scale + b.scale);

      if (dist < minDist - 1e-4) {
        console.error(`Overlap detected between ${a.id} and ${b.id}: dist=${dist.toFixed(2)}, min=${minDist.toFixed(2)}`);
        return false;
      }
    }
  }
  return true;
});

// 8. adding one monster does not move a monster that it does not overlap
runTest('adding one monster does not move a monster that it does not overlap', () => {
  const baseMonsters = [
    { id: 'dragon-inertia', size: 8 as Dial, distance: 6 as Dial, createdAt: '2026-01-01T00:00:00Z' },
    { id: 'dragon-cacophony', size: 6 as Dial, distance: 3 as Dial, createdAt: '2026-01-02T00:00:00Z' },
    { id: 'dragon-tyrant', size: 9 as Dial, distance: 8 as Dial, createdAt: '2026-01-03T00:00:00Z' },
  ];

  const layoutBefore = layoutMonsters(baseMonsters);

  // Add a non-overlapping distant monster created after the others
  const newMonster = {
    id: 'distant-watcher',
    size: 2 as Dial,
    distance: 10 as Dial,
    createdAt: '2026-01-04T00:00:00Z',
  };

  const layoutAfter = layoutMonsters([...baseMonsters, newMonster]);

  for (const m of baseMonsters) {
    const posBefore = layoutBefore.get(m.id)!;
    const posAfter = layoutAfter.get(m.id)!;

    if (!posBefore || !posAfter) return false;

    if (
      Math.abs(posBefore.x - posAfter.x) > 1e-6 ||
      Math.abs(posBefore.y - posAfter.y) > 1e-6 ||
      Math.abs(posBefore.z - posAfter.z) > 1e-6
    ) {
      return false;
    }
  }
  return true;
});

console.log(`\nResults: ${passedCount} passed, ${failedCount} failed.`);

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
