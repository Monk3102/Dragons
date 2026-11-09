import React, { useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { CreatureBody } from '../creatures/engine';
import { getRecipe, hasRecipe, PLACEHOLDER_RECIPE } from '../creatures/registry';
import { CreatureRecipe, DetailTier } from '../creatures/types';
import { LookName } from '../creatures/ferocity';

interface CameraViewRigProps {
  view: 'full' | 'head' | 'wing';
  viewpoints?: CreatureRecipe['viewpoints'];
}

function CameraViewRig({ view, viewpoints }: CameraViewRigProps) {
  const currentPos = useRef(new THREE.Vector3(0, 0.2, 6.2));
  const currentTarget = useRef(new THREE.Vector3(0, 0, 0));

  useFrame((state, delta) => {
    const targetPos = new THREE.Vector3(0, 0.2, 6.2);
    const targetLook = new THREE.Vector3(0, 0, 0);

    if (view === 'head' && viewpoints?.head) {
      targetLook.set(...viewpoints.head.target);
      targetPos.set(
        viewpoints.head.target[0],
        viewpoints.head.target[1],
        viewpoints.head.target[2] + viewpoints.head.distance
      );
    } else if (view === 'wing' && viewpoints?.wing) {
      targetLook.set(...viewpoints.wing.target);
      targetPos.set(
        viewpoints.wing.target[0] + 0.3,
        viewpoints.wing.target[1],
        viewpoints.wing.target[2] + viewpoints.wing.distance
      );
    }

    currentPos.current.lerp(targetPos, Math.min(1, delta * 4));
    currentTarget.current.lerp(targetLook, Math.min(1, delta * 4));

    state.camera.position.copy(currentPos.current);
    state.camera.lookAt(currentTarget.current);
  });

  return null;
}

interface RotatingCreatureProps {
  recipe: CreatureRecipe;
  ferocity: number;
  position: [number, number, number];
  color?: string;
  accentColor?: string;
  detailLevel?: DetailTier;
  wireframe?: boolean;
  silhouetteMode?: boolean;
}

function RotatingCreature({
  recipe,
  ferocity,
  position,
  color,
  accentColor,
  detailLevel = 'high',
  wireframe = false,
  silhouetteMode = false,
}: RotatingCreatureProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.45;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <CreatureBody
        recipe={recipe}
        baseColor={color || '#252932'}
        accentColor={accentColor || '#c5a059'}
        glowColor={accentColor || '#c5a059'}
        glowStrength={1.2}
        ferocity={ferocity}
        detailLevel={detailLevel}
        bobbingSpeed={0.8}
        wireframe={wireframe}
        silhouetteMode={silhouetteMode}
      />
    </group>
  );
}

function RotatingPlaceholder({
  color,
  accentColor,
  wireframe = false,
  silhouetteMode = false,
}: {
  color?: string;
  accentColor?: string;
  wireframe?: boolean;
  silhouetteMode?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.45;
    }
  });

  return (
    <group ref={groupRef} position={[0, -0.1, 0]}>
      <CreatureBody
        recipe={PLACEHOLDER_RECIPE}
        baseColor={color || '#252932'}
        accentColor={accentColor || '#c5a059'}
        glowColor={accentColor || '#c5a059'}
        glowStrength={1.0}
        ferocity={5}
        detailLevel="high"
        bobbingSpeed={0.8}
        wireframe={wireframe}
        silhouetteMode={silhouetteMode}
      />
    </group>
  );
}

interface DevControlsProps {
  devTier: 'auto' | DetailTier;
  setDevTier: (t: 'auto' | DetailTier) => void;
  devView: 'full' | 'head' | 'wing';
  setDevView: (v: 'full' | 'head' | 'wing') => void;
  devLook: LookName;
  setDevLook: (l: LookName) => void;
  wireframe: boolean;
  setWireframe: React.Dispatch<React.SetStateAction<boolean>>;
  silhouette: boolean;
  setSilhouette: React.Dispatch<React.SetStateAction<boolean>>;
  recipe: CreatureRecipe;
  onSavePng: () => void;
}

const DevControls = import.meta.env.DEV
  ? ({
      devTier,
      setDevTier,
      devView,
      setDevView,
      devLook,
      setDevLook,
      wireframe,
      setWireframe,
      silhouette,
      setSilhouette,
      recipe,
      onSavePng,
    }: DevControlsProps) => (
      <div className="absolute top-2 left-2 z-10 flex flex-wrap items-center gap-1.5 bg-black/85 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-white/10 text-[10px] font-mono text-slate-300 shadow-xl max-w-[95%]">
        <span className="text-amber-400 font-semibold mr-0.5">DEV_TIER_TOOL:</span>
        {(['auto', 'ultra', 'high', 'low'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setDevTier(t)}
            className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
              devTier === t ? 'bg-[#c5a059] text-black font-bold' : 'hover:bg-white/10 text-slate-400'
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}

        <span className="text-amber-400 font-semibold ml-1.5 mr-0.5">VIEW:</span>
        <button
          type="button"
          onClick={() => setDevView('full')}
          className={`px-1.5 py-0.5 rounded cursor-pointer ${
            devView === 'full' ? 'bg-[#c5a059] text-black font-bold' : 'hover:bg-white/10 text-slate-400'
          }`}
        >
          Full
        </button>
        <button
          type="button"
          disabled={!recipe.viewpoints?.head}
          onClick={() => setDevView('head')}
          className={`px-1.5 py-0.5 rounded cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
            devView === 'head' ? 'bg-[#c5a059] text-black font-bold' : 'hover:bg-white/10 text-slate-400'
          }`}
        >
          Head
        </button>
        <button
          type="button"
          disabled={!recipe.viewpoints?.wing}
          onClick={() => setDevView('wing')}
          className={`px-1.5 py-0.5 rounded cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
            devView === 'wing' ? 'bg-[#c5a059] text-black font-bold' : 'hover:bg-white/10 text-slate-400'
          }`}
        >
          Wing
        </button>

        <span className="text-amber-400 font-semibold ml-1.5 mr-0.5">LOOK:</span>
        {(['mild', 'menacing', 'ferocious'] as const).map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setDevLook(l)}
            className={`px-1.5 py-0.5 rounded cursor-pointer capitalize ${
              devLook === l ? 'bg-[#c5a059] text-black font-bold' : 'hover:bg-white/10 text-slate-400'
            }`}
          >
            {l}
          </button>
        ))}

        <div className="h-3 w-px bg-white/20 mx-1" />

        <button
          type="button"
          onClick={() => setSilhouette((prev) => !prev)}
          className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
            silhouette ? 'bg-amber-400 text-black font-bold' : 'hover:bg-white/10 text-slate-400'
          }`}
        >
          Silhouette
        </button>
        <button
          type="button"
          onClick={() => setWireframe((prev) => !prev)}
          className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
            wireframe ? 'bg-cyan-400 text-black font-bold' : 'hover:bg-white/10 text-slate-400'
          }`}
        >
          Wireframe
        </button>

        <button
          type="button"
          onClick={onSavePng}
          className="ml-2 px-2 py-0.5 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded cursor-pointer font-sans text-[10px] font-semibold"
        >
          Save PNG
        </button>
      </div>
    )
  : null;

interface CreaturePreviewCanvasProps {
  creatureId?: string;
  creatureName: string;
  color?: string;
  accentColor?: string;
  className?: string;
}

export const CreaturePreviewCanvas: React.FC<CreaturePreviewCanvasProps> = ({
  creatureId,
  creatureName,
  color,
  accentColor,
  className = 'w-full h-48 sm:h-56',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [devTier, setDevTier] = useState<'auto' | DetailTier>('auto');
  const [devView, setDevView] = useState<'full' | 'head' | 'wing'>('full');
  const [devLook, setDevLook] = useState<LookName>('menacing');
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [silhouette, setSilhouette] = useState<boolean>(false);

  const isModeled = useMemo(() => {
    return Boolean(creatureId && hasRecipe(creatureId));
  }, [creatureId]);

  const recipe = useMemo(() => {
    return creatureId ? getRecipe(creatureId) : PLACEHOLDER_RECIPE;
  }, [creatureId]);

  const effectiveTier: DetailTier = devTier === 'auto' ? 'high' : devTier;

  const handleSavePng = () => {
    if (!containerRef.current) return;
    const canvas = containerRef.current.querySelector('canvas');
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${recipe.id}-${effectiveTier}-${devLook}.png`;
      link.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  return (
    <div
      ref={containerRef}
      className={`relative rounded-xl overflow-hidden bg-gradient-to-b from-[#0c0d12] via-[#090a0e] to-[#06070a] border border-[#c5a059]/20 shadow-inner ${className}`}
      aria-label={`3D preview for ${creatureName}`}
    >
      {/* Dev-only controls: Tier Selector, View Selector, Look, Silhouette, Wireframe, Save PNG */}
      {import.meta.env.DEV && DevControls && (
        <DevControls
          devTier={devTier}
          setDevTier={setDevTier}
          devView={devView}
          setDevView={setDevView}
          devLook={devLook}
          setDevLook={setDevLook}
          wireframe={wireframe}
          setWireframe={setWireframe}
          silhouette={silhouette}
          setSilhouette={setSilhouette}
          recipe={recipe}
          onSavePng={handleSavePng}
        />
      )}

      {isModeled ? (
        <>
          <Canvas
            camera={{ position: [0, 0.2, 6.2], fov: 42 }}
            gl={{
              antialias: true,
              powerPreference: 'low-power',
              preserveDrawingBuffer: Boolean(import.meta.env.DEV),
            }}
            onCreated={({ gl, scene }) => {
              gl.outputColorSpace = THREE.SRGBColorSpace;
              (scene as any).environmentIntensity = 0.35;
            }}
          >
            <CameraViewRig view={devView} viewpoints={recipe.viewpoints} />
            <Environment frames={1} resolution={256} environmentIntensity={0.35}>
              <Lightformer
                form="rect"
                intensity={0.5}
                color="#c0d8f0"
                position={[0, 10, 0]}
                scale={[12, 12, 1]}
                rotation={[Math.PI / 2, 0, 0]}
              />
              <Lightformer
                form="rect"
                intensity={0.6}
                color="#f5c070"
                position={[0, -2, -8]}
                scale={[10, 2, 1]}
              />
            </Environment>
            <ambientLight intensity={0.6} />
            <directionalLight position={[4, 6, 5]} intensity={1.5} color="#f5eedc" />
            <directionalLight position={[-4, -2, -3]} intensity={0.6} color="#5577aa" />

            {/* Mild Variant (ferocity 2) */}
            <RotatingCreature
              recipe={recipe}
              ferocity={2}
              position={[-2.2, -0.2, 0]}
              color={color}
              accentColor={accentColor}
              detailLevel={effectiveTier}
              wireframe={wireframe}
              silhouetteMode={silhouette}
            />

            {/* Menacing Variant (ferocity 5) */}
            <RotatingCreature
              recipe={recipe}
              ferocity={5}
              position={[0, -0.2, 0]}
              color={color}
              accentColor={accentColor}
              detailLevel={effectiveTier}
              wireframe={wireframe}
              silhouetteMode={silhouette}
            />

            {/* Ferocious Variant (ferocity 9) */}
            <RotatingCreature
              recipe={recipe}
              ferocity={9}
              position={[2.2, -0.2, 0]}
              color={color}
              accentColor={accentColor}
              detailLevel={effectiveTier}
              wireframe={wireframe}
              silhouetteMode={silhouette}
            />
          </Canvas>

          {/* Ferocity Look Variant Labels */}
          <div className="absolute bottom-2.5 inset-x-0 flex justify-around px-4 pointer-events-none text-[10px] uppercase font-mono tracking-wider">
            <div className="bg-black/60 px-2.5 py-1 rounded border border-white/10 text-emerald-300/90 shadow-sm">
              Mild <span className="opacity-60">(2)</span>
            </div>
            <div className="bg-black/60 px-2.5 py-1 rounded border border-white/10 text-amber-300/90 shadow-sm">
              Menacing <span className="opacity-60">(5)</span>
            </div>
            <div className="bg-black/60 px-2.5 py-1 rounded border border-white/10 text-rose-300/90 shadow-sm">
              Ferocious <span className="opacity-60">(9)</span>
            </div>
          </div>
        </>
      ) : (
        <>
          <Canvas
            camera={{ position: [0, 0.2, 4.0], fov: 38 }}
            gl={{
              antialias: true,
              powerPreference: 'low-power',
              preserveDrawingBuffer: Boolean(import.meta.env.DEV),
            }}
            onCreated={({ gl }) => {
              gl.outputColorSpace = THREE.SRGBColorSpace;
            }}
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[3, 5, 4]} intensity={1.2} color="#f5eedc" />
            <directionalLight position={[-3, -2, -2]} intensity={0.5} color="#5577aa" />

            <RotatingPlaceholder color={color} accentColor={accentColor} />
          </Canvas>

          {/* Un-modeled badge overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/75 px-3 py-1.5 rounded-full border border-amber-500/30 text-amber-200/90 font-mono text-xs tracking-wider uppercase shadow-lg">
              Model coming
            </div>
          </div>
        </>
      )}

      {/* Subdued watermark / tag */}
      <div className="absolute top-2 right-3 pointer-events-none text-[9px] uppercase tracking-widest font-mono text-amber-200/40">
        {isModeled ? 'Archetype Anatomy' : 'Archetype Prototype'}
      </div>
    </div>
  );
};
