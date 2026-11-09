# Creature Style Guide & Realism Engine

## 1. Detail Tiers & Distance Rules
- **Ultra (`ultra`)**: Activated strictly for the currently selected creature, or the top 2 closest creatures when camera distance < 40 units. Uses sphere 40x28, cylinder/cone/capsule 20, torus 16x40, tube 20x96, full (100%) scale plates, and procedural normal/bump maps.
- **High (`high`)**: Active for creatures within 90 units. Uses mid-range segments, 35% scale plates, and full physical shaders.
- **Low (`low`)**: Distant LOD (> 90 units). Strips decorative `fine: true` parts, halves segments, disables scale plates.

## 2. Tube Upgrades & Procedural Geometry
- **Aspect Ratio (`aspect: number`)**: Cross-section width / height ratio (default 1.0) for flattening or broadening muscular spines.
- **Radius Profile (`radiusProfile: number[]`)**: Multipliers smoothly interpolated across normalized length `u` ∈ [0, 1].
- **Organic Bumps (`bumps: { amp, freq, seed }`)**: Deterministic 3D value noise vertex displacement along surface normals.
- **Scale Plates (`scales: { count, size, seed }`)**: Deterministic shingle plates along tube surface (max 2,500/part, 6,000/creature).

## 3. Materials, Roles & Textures
- **Procedural Canvas Textures**: Lazy runtime generation (`scaleNormalMap`, `skinBump`, `crackEmissive`, `membraneVeins`).
- **Material Budget**: At most 6 materials per creature (`body`, `accent`, `glow`, `membrane`, `eye`, plus silhouette).
- **Specialized Roles**:
  - `membrane`: DoubleSide translucent with `depthWrite: false` to avoid depth-sorting clipping on wings.
  - `eye`: Strong concentrated ocular emission (intensity ~3.5).
- **Physical Skin**: `skin: 'scales' | 'rough'` triggers `MeshPhysicalMaterial` with clearcoat and dynamic crack glow.

## 4. Authoring a Recipe for All Three Tiers
- **Preserve Silhouette**: Mark core structural parts (torso, skull, main wings, tail) with `silhouette: true`.
- **Cull Micro-Detail**: Mark teeth, tiny spines, and facial knobs with `fine: true` to shed geometry at low tier.
- **Surface Scale Placement**: Add `scales` to tubes; the engine automatically scales instances (100% ultra, 35% high, 0% low).
- **Respect Budgets**: Keep total parts <= 60, draw calls <= 30, and triangles <= 90k (ultra), <= 35k (high), <= 6k (low).
