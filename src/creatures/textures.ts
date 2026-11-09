import * as THREE from 'three';

interface ProceduralTextures {
  scaleNormalMap?: THREE.CanvasTexture;
  skinBump?: THREE.CanvasTexture;
  crackEmissive?: THREE.CanvasTexture;
  membraneVeins?: THREE.CanvasTexture;
}

const _cache: ProceduralTextures = {};

function setupTexture(texture: THREE.CanvasTexture, maxAnisotropy = 8): THREE.CanvasTexture {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.anisotropy = Math.min(8, maxAnisotropy);
  texture.needsUpdate = true;
  return texture;
}

function createScaleNormalMap(maxAnisotropy?: number): THREE.CanvasTexture {
  const w = 1024, h = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  const heights = new Float32Array(w * h);
  const cols = 24, rows = 32;
  const cellW = w / cols, cellH = h / rows;

  for (let r = 0; r < rows; r++) {
    const xOff = (r % 2 === 1) ? cellW * 0.5 : 0;
    const cy = (r + 0.5) * cellH;
    for (let c = 0; c < cols; c++) {
      const cx = c * cellW + xOff;
      const rx = cellW * 0.65, ry = cellH * 0.75;
      const minX = Math.floor(cx - rx), maxX = Math.ceil(cx + rx);
      const minY = Math.floor(cy - ry), maxY = Math.ceil(cy + ry);

      for (let py = minY; py <= maxY; py++) {
        const wy = ((py % h) + h) % h;
        const dy = (py - cy) / ry;
        for (let px = minX; px <= maxX; px++) {
          const wx = ((px % w) + w) % w;
          const dx = (px - cx) / rx;
          const distSq = dx * dx + dy * dy;
          if (distSq < 1.0) {
            const val = Math.sqrt(1.0 - distSq) * (0.8 + 0.2 * (1.0 - dy));
            const idx = wy * w + wx;
            if (val > heights[idx]) heights[idx] = val;
          }
        }
      }
    }
  }

  const img = ctx.createImageData(w, h);
  const d = img.data;
  const strength = 4.5;

  for (let y = 0; y < h; y++) {
    const yp = ((y - 1 + h) % h) * w, yn = ((y + 1) % h) * w, yc = y * w;
    for (let x = 0; x < w; x++) {
      const xp = (x - 1 + w) % w, xn = (x + 1) % w;
      const dx = (heights[yc + xp] - heights[yc + xn]) * strength;
      const dy = (heights[yp + x] - heights[yn + x]) * strength;
      const len = Math.hypot(dx, dy, 1.0) || 1.0;
      const i = (yc + x) * 4;
      d[i] = Math.round((dx / len * 0.5 + 0.5) * 255);
      d[i + 1] = Math.round((dy / len * 0.5 + 0.5) * 255);
      d[i + 2] = Math.round((1.0 / len * 0.5 + 0.5) * 255);
      d[i + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  return setupTexture(new THREE.CanvasTexture(canvas), maxAnisotropy);
}

function createSkinBump(maxAnisotropy?: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const d = img.data;

  for (let y = 0; y < size; y++) {
    const v = (y / size) * Math.PI * 2;
    for (let x = 0; x < size; x++) {
      const u = (x / size) * Math.PI * 2;
      const n1 = Math.sin(u * 12 + Math.cos(v * 16)) * Math.cos(v * 12 + Math.sin(u * 16));
      const n2 = Math.sin(u * 28 + v * 28) * 0.5;
      const n3 = Math.cos(u * 44 - v * 44) * 0.25;
      const val = Math.round(Math.max(0, Math.min(255, ((n1 + n2 + n3) / 1.75 * 0.5 + 0.5) * 255)));
      const i = (y * size + x) * 4;
      d[i] = val; d[i + 1] = val; d[i + 2] = val; d[i + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  return setupTexture(new THREE.CanvasTexture(canvas), maxAnisotropy);
}

function createCrackEmissive(maxAnisotropy?: number): THREE.CanvasTexture {
  const size = 1024, grid = 16, cellSize = size / grid;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const pts: [number, number][] = [];
  let s = 42;
  const rng = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };

  for (let gy = 0; gy < grid; gy++) {
    for (let gx = 0; gx < grid; gx++) {
      pts.push([(gx + 0.15 + rng() * 0.7) * cellSize, (gy + 0.15 + rng() * 0.7) * cellSize]);
    }
  }

  const img = ctx.createImageData(size, size);
  const d = img.data;
  const thresh = cellSize * 0.09;

  for (let y = 0; y < size; y++) {
    const gy = Math.floor(y / cellSize);
    for (let x = 0; x < size; x++) {
      const gx = Math.floor(x / cellSize);
      let d1 = Infinity, d2 = Infinity;

      for (let oy = -1; oy <= 1; oy++) {
        const ny = (gy + oy + grid) % grid, offY = oy * cellSize;
        for (let ox = -1; ox <= 1; ox++) {
          const nx = (gx + ox + grid) % grid, offX = ox * cellSize;
          const p = pts[ny * grid + nx];
          let dx = Math.abs(x - (p[0] + offX));
          if (dx > size * 0.5) dx = size - dx;
          let dy = Math.abs(y - (p[1] + offY));
          if (dy > size * 0.5) dy = size - dy;
          const dist = Math.hypot(dx, dy);
          if (dist < d1) { d2 = d1; d1 = dist; }
          else if (dist < d2) { d2 = dist; }
        }
      }

      const diff = d2 - d1;
      const b = diff < thresh ? Math.round(Math.pow(1.0 - diff / thresh, 2.2) * 255) : 0;
      const i = (y * size + x) * 4;
      d[i] = b; d[i + 1] = b; d[i + 2] = b; d[i + 3] = 255;
    }
  }

  ctx.putImageData(img, 0, 0);
  return setupTexture(new THREE.CanvasTexture(canvas), maxAnisotropy);
}

function createMembraneVeins(maxAnisotropy?: number): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, size, size);
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#ffffff';

  const spans = [
    { s: [20, 20], c1: [180, 140], c2: [340, 260], e: [490, 480], w: 7 },
    { s: [20, 20], c1: [140, 240], c2: [240, 390], e: [360, 490], w: 5 },
    { s: [20, 20], c1: [250, 110], c2: [410, 220], e: [500, 320], w: 5 },
  ];
  for (const m of spans) {
    ctx.lineWidth = m.w;
    ctx.beginPath();
    ctx.moveTo(m.s[0], m.s[1]);
    ctx.bezierCurveTo(m.c1[0], m.c1[1], m.c2[0], m.c2[1], m.e[0], m.e[1]);
    ctx.stroke();
  }

  ctx.lineWidth = 2.5;
  for (let i = 0; i < 18; i++) {
    const sx = 60 + i * 22, sy = 50 + i * 20;
    const a = (i % 2 === 0 ? 0.7 : -0.7) + i * 0.1, len = 40 + (i % 5) * 15;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(sx + Math.cos(a) * len * 0.5, sy + Math.sin(a) * len * 0.5, sx + Math.cos(a) * len, sy + Math.sin(a) * len);
    ctx.stroke();
  }

  return setupTexture(new THREE.CanvasTexture(canvas), maxAnisotropy);
}

export function getCreatureTextures(maxAnisotropy = 8) {
  if (!_cache.scaleNormalMap) _cache.scaleNormalMap = createScaleNormalMap(maxAnisotropy);
  if (!_cache.skinBump) _cache.skinBump = createSkinBump(maxAnisotropy);
  if (!_cache.crackEmissive) _cache.crackEmissive = createCrackEmissive(maxAnisotropy);
  if (!_cache.membraneVeins) _cache.membraneVeins = createMembraneVeins(maxAnisotropy);

  return {
    scaleNormalMap: _cache.scaleNormalMap,
    skinBump: _cache.skinBump,
    crackEmissive: _cache.crackEmissive,
    membraneVeins: _cache.membraneVeins,
  };
}
