# Creature Style Guide & Realism Engine

## 1. Detail Tiers & Multi-Tier Authoring
- **Ultra (`ultra`)**: Reserved for close-up inspection (distance < 40 or selected). Features high tessellation (sphere 40x28, cylinder/capsule 20, tube 20x96), procedural normal/bump maps, and instanced diamond scale plates.
- **High (`high`)**: Standard mid-range tier (distance 40–90). Balances silhouette definition with performance.
- **Low (`low`)**: Distant LOD (distance > 90). Strips fine decorative parts, halves segment counts, and disables scale plates.

## 2. Advanced Tube Shaping
- **Aspect Ratio (`aspect: [x, y]`)**: Flattens or widens tube cross-sections into non-circular ribbons or muscular slabs.
- **Radius Profile (`radiusProfile: [[u, r], ...]`)**: Controls longitudinal thickness along normalized length `u` ∈ [0, 1].
- **Organic Bumps (`bumps: { amp, freq, seed }`)**: Applies 3D value-noise perturbation along the surface normal.
- **Surface Scale Plates (`scales: { count, size, seed }`)**: Instanced diamond plates seated on tube surfaces, oriented along tangent and normal.

## 3. Materials, Roles & Textures
- **Procedural Textures**: Lazy runtime canvas generation with repeat wrapping and mipmapping (`scaleNormalMap`, `skinBump`, `crackEmissive`, `membraneVeins`).
- **Material Budget**: Maximum 6 distinct materials per creature (body, accent, glow, eye, membrane, scale plates).
- **Specialized Roles**:
  - `membrane`: Double-sided translucency with `depthWrite: false` to eliminate sorting artifacts on wings and webbing.
  - `eye`: Focused ocular specular reflection with concentrated emissive brilliance (intensity ~3.5).
