export type Shape =
  | 'sphere'
  | 'box'
  | 'cone'
  | 'cylinder'
  | 'torus'
  | 'capsule'
  | 'octahedron'
  | 'blade'
  | 'tube'
  | 'membrane';
export type Role = 'body' | 'accent' | 'glow' | 'membrane' | 'eye';

export type DetailTier = 'ultra' | 'high' | 'low';

export interface TubeScaleSpec {
  count: number;
  size: [number, number];
  seed: number;
}

export interface TubeBumpsSpec {
  amp: number;
  freq: number;
  seed: number;
}

export interface TubeParams {
  points: [number, number, number][]; // at least 3 control points, smoothed with Catmull-Rom
  radiusStart: number;
  radiusEnd: number;
  aspect?: number; // cross-section width divided by height, default 1
  radiusProfile?: number[]; // multipliers spread along length, smoothly interpolated
  bumps?: TubeBumpsSpec; // deterministic 3D value noise vertex displacement along normal
  scales?: TubeScaleSpec; // shingle scale plates placed along tube surface
}

export interface PartAnimation {
  kind: 'sway' | 'flap' | 'pulse' | 'coil' | 'spin';
  speed: number;
  amp: number;
  phase?: number;
}

export interface PartRepeat {
  count: number;
  stepPos?: [number, number, number];
  stepRot?: [number, number, number];
  stepScale?: [number, number, number];
}

export interface Part {
  id: string;
  shape: Shape;
  role: Role;
  pos: [number, number, number];
  rot?: [number, number, number];
  scale: [number, number, number];
  opacity?: number;
  fine?: boolean; // true means "skip when far away" (LOD low)
  silhouette?: boolean; // true means "never skip at low detail"
  grow?: [number, number]; // scale multiplier at ferocity t = 0 and t = 1
  appearAt?: number; // 0 to 1; scales in from 0 to full over 0.15 of t starting at this value
  anim?: PartAnimation;
  repeat?: PartRepeat;
  tube?: TubeParams;
  polygon?: [number, number][]; // at least 3 points in local XY plane
  skin?: 'smooth' | 'scales' | 'rough';
  texScale?: [number, number];
}

export type CreatureFamily =
  | 'serpentine'
  | 'winged'
  | 'fourLegged'
  | 'humanoid'
  | 'spectral'
  | 'sea';

export interface CreaturePalette {
  body?: string;
  accent?: string;
  metalness?: number;
  roughness?: number;
}

export interface CreatureViewpoint {
  target: [number, number, number];
  distance: number;
}

export interface CreatureRecipe {
  id: string; // an id from ARCHETYPE_CATALOGUE
  family: CreatureFamily;
  palette?: CreaturePalette;
  parts: Part[];
  viewpoints?: Record<string, CreatureViewpoint>;
}
