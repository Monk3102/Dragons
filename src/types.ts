export type DragonTemperament = 'Heavy & Paralyzing' | 'Erratic & Restless' | 'Cold & Austere';

export interface DragonProblem {
  id: string;
  name: string;
  subtitle: string;
  category: string;
  temperament: DragonTemperament;
  scale: number;
  position: [number, number, number];
  rotation: [number, number, number];
  color: string;
  accentColor: string;
  coreGlow: string;
  roughness: number;
  metalness: number;
  wingspan: number;
  bodySegments: number;
  floatingHeight: number;
  bobbingSpeed: number;
  bobbingAmplitude: number;
  // Psychological & Reflective content
  manifestation: string;
  voice: string;
  roots: string;
  somaticFeeling: string;
  inquiry: string;
  status: 'Formidable' | 'Resting' | 'Acknowledged' | 'Under Inspection';
}

export type ActiveView = 'world' | 'inspect' | 'notes';

export interface CameraState {
  position: [number, number, number];
  target: [number, number, number];
}
