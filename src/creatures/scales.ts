export interface CurveSample {
  u: number;
  pos: [number, number, number];
  tangent: [number, number, number];
  normal: [number, number, number];
  binormal: [number, number, number];
}

export interface ScaleSpec {
  count: number;
  size: [number, number];
  seed: number;
}

export interface PlacedScales {
  count: number;
  positions: Float32Array;
  normals: Float32Array;
  tangents: Float32Array;
  sizes: Float32Array;
}

export const MAX_SCALES_PER_PART = 2500;
export const MAX_SCALES_PER_CREATURE = 6000;

function createRng(seed: number) {
  let a = (seed ^ 0x6d2b79f5) >>> 0;
  return () => {
    a = (a + 0x9e3779b9) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sampleCurve(samples: CurveSample[], u: number) {
  if (!samples.length) {
    return { pos: [0, 0, 0], tangent: [0, 0, 1], normal: [1, 0, 0], binormal: [0, 1, 0] };
  }
  if (samples.length === 1 || u <= samples[0].u) return samples[0];
  if (u >= samples[samples.length - 1].u) return samples[samples.length - 1];

  let i = 0;
  while (i < samples.length - 1 && samples[i + 1].u < u) i++;
  const s0 = samples[i], s1 = samples[i + 1];
  const span = s1.u - s0.u;
  const t = span > 0 ? (u - s0.u) / span : 0;
  const l = (a: number, b: number) => a + (b - a) * t;

  const pos: [number, number, number] = [l(s0.pos[0], s1.pos[0]), l(s0.pos[1], s1.pos[1]), l(s0.pos[2], s1.pos[2])];
  const tan: [number, number, number] = [l(s0.tangent[0], s1.tangent[0]), l(s0.tangent[1], s1.tangent[1]), l(s0.tangent[2], s1.tangent[2])];
  const tL = Math.hypot(...tan) || 1;
  const norm: [number, number, number] = [l(s0.normal[0], s1.normal[0]), l(s0.normal[1], s1.normal[1]), l(s0.normal[2], s1.normal[2])];
  const nL = Math.hypot(...norm) || 1;
  const bin: [number, number, number] = [l(s0.binormal[0], s1.binormal[0]), l(s0.binormal[1], s1.binormal[1]), l(s0.binormal[2], s1.binormal[2])];
  const bL = Math.hypot(...bin) || 1;

  return {
    pos,
    tangent: [tan[0] / tL, tan[1] / tL, tan[2] / tL] as [number, number, number],
    normal: [norm[0] / nL, norm[1] / nL, norm[2] / nL] as [number, number, number],
    binormal: [bin[0] / bL, bin[1] / bL, bin[2] / bL] as [number, number, number],
  };
}

export function placeScales(
  spec: ScaleSpec,
  curveSamples: CurveSample[],
  radiusAt: (u: number) => number
): PlacedScales {
  const target = Math.max(0, Math.min(MAX_SCALES_PER_PART, Math.floor(spec.count)));
  if (!target || !curveSamples.length) {
    return {
      count: 0,
      positions: new Float32Array(0),
      normals: new Float32Array(0),
      tangents: new Float32Array(0),
      sizes: new Float32Array(0),
    };
  }

  const positions = new Float32Array(target * 3);
  const normals = new Float32Array(target * 3);
  const tangents = new Float32Array(target * 3);
  const sizes = new Float32Array(target * 2);

  const rng = createRng(spec.seed);
  const baseR0 = radiusAt(0) || 1.0;
  const numRings = Math.max(4, Math.round(Math.sqrt(target * 1.5)));
  const scalesPerRing = Math.max(3, Math.ceil(target / numRings));
  let placed = 0;

  for (let r = 0; r < numRings && placed < target; r++) {
    const uFrac = (r + 0.5) / numRings;
    const curve = sampleCurve(curveSamples, uFrac);
    const radius = radiusAt(uFrac);
    const ringOffset = (r % 2) * (Math.PI / scalesPerRing);
    const ringCount = Math.min(scalesPerRing, target - placed);

    for (let s = 0; s < ringCount && placed < target; s++) {
      const angle = (s / ringCount) * Math.PI * 2 + ringOffset + (rng() - 0.5) * 0.04;
      const cos = Math.cos(angle), sin = Math.sin(angle);

      const nx = curve.normal[0] * cos + curve.binormal[0] * sin;
      const ny = curve.normal[1] * cos + curve.binormal[1] * sin;
      const nz = curve.normal[2] * cos + curve.binormal[2] * sin;
      const nL = Math.hypot(nx, ny, nz) || 1;
      const normX = nx / nL, normY = ny / nL, normZ = nz / nL;

      const p3 = placed * 3, p2 = placed * 2;
      positions[p3] = curve.pos[0] + normX * radius;
      positions[p3 + 1] = curve.pos[1] + normY * radius;
      positions[p3 + 2] = curve.pos[2] + normZ * radius;

      normals[p3] = normX;
      normals[p3 + 1] = normY;
      normals[p3 + 2] = normZ;

      tangents[p3] = curve.tangent[0];
      tangents[p3 + 1] = curve.tangent[1];
      tangents[p3 + 2] = curve.tangent[2];

      const radScale = Math.max(0.3, Math.min(2.0, radius / baseR0));
      sizes[p2] = spec.size[0] * radScale;
      sizes[p2 + 1] = spec.size[1] * radScale;

      placed++;
    }
  }

  return {
    count: placed,
    positions: positions.subarray(0, placed * 3),
    normals: normals.subarray(0, placed * 3),
    tangents: tangents.subarray(0, placed * 3),
    sizes: sizes.subarray(0, placed * 2),
  };
}
