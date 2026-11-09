function hash3D(ix: number, iy: number, iz: number, seed: number): number {
  let h = seed ^ Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(iz, 39916801);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

export function valueNoise3D(x: number, y: number, z: number, seed: number): number {
  const x0 = Math.floor(x), y0 = Math.floor(y), z0 = Math.floor(z);
  const fx = x - x0, fy = y - y0, fz = z - z0;
  const wx = fx * fx * fx * (fx * (fx * 6 - 15) + 10);
  const wy = fy * fy * fy * (fy * (fy * 6 - 15) + 10);
  const wz = fz * fz * fz * (fz * (fz * 6 - 15) + 10);

  const c000 = hash3D(x0, y0, z0, seed), c100 = hash3D(x0 + 1, y0, z0, seed);
  const c010 = hash3D(x0, y0 + 1, z0, seed), c110 = hash3D(x0 + 1, y0 + 1, z0, seed);
  const c001 = hash3D(x0, y0, z0 + 1, seed), c101 = hash3D(x0 + 1, y0, z0 + 1, seed);
  const c011 = hash3D(x0, y0 + 1, z0 + 1, seed), c111 = hash3D(x0 + 1, y0 + 1, z0 + 1, seed);

  const x00 = c000 + wx * (c100 - c000), x10 = c010 + wx * (c110 - c010);
  const x01 = c001 + wx * (c101 - c001), x11 = c011 + wx * (c111 - c011);
  const y0V = x00 + wy * (x10 - x00), y1V = x01 + wy * (x11 - x01);
  return Math.max(-1, Math.min(1, (y0V + wz * (y1V - y0V)) * 2 - 1));
}

export function interpolateProfile(profile: number[], u: number): number {
  if (!profile || !profile.length) return 1.0;
  if (profile.length === 1) return profile[0];
  const cu = Math.max(0, Math.min(1, u));
  if (cu <= 0) return profile[0];
  if (cu >= 1) return profile[profile.length - 1];
  const pos = cu * (profile.length - 1);
  const idx = Math.floor(pos);
  const frac = pos - idx;
  if (idx >= profile.length - 1) return profile[profile.length - 1];
  const s = frac * frac * (3 - 2 * frac);
  return profile[idx] + (profile[idx + 1] - profile[idx]) * s;
}
