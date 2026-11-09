import React, { useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CreatureRecipe, Part, TubeParams, DetailTier } from './types';
import { ferocityToT, partScale } from './ferocity';
import { valueNoise3D, interpolateProfile } from './noise';
import { placeScales, CurveSample, MAX_SCALES_PER_PART, MAX_SCALES_PER_CREATURE } from './scales';
import { getCreatureTextures } from './textures';

export interface CreatureBodyProps {
  recipe: CreatureRecipe;
  baseColor?: string;
  accentColor?: string;
  glowColor?: string;
  glowStrength?: number;
  ferocity?: number;
  detailLevel?: DetailTier;
  bobbingSpeed?: number;
  wireframe?: boolean;
  silhouetteMode?: boolean;
}

type SharedShape = 'sphere' | 'box' | 'cone' | 'cylinder' | 'torus' | 'capsule' | 'octahedron' | 'blade';

const mkGeoms = (sR: number, sH: number, rS: number, tT: number, tR: number) => ({
  sphere: new THREE.SphereGeometry(1, sR, sH),
  box: new THREE.BoxGeometry(1, 1, 1),
  cone: new THREE.ConeGeometry(1, 1, rS),
  cylinder: new THREE.CylinderGeometry(1, 1, 1, rS),
  torus: new THREE.TorusGeometry(1, 0.3, tT, tR),
  capsule: new THREE.CapsuleGeometry(0.5, 1, Math.max(3, Math.round(rS * 0.4)), rS),
  octahedron: new THREE.OctahedronGeometry(1, 0),
  blade: new THREE.ConeGeometry(1, 1, 4),
});

export const SHARED_GEOMETRIES_ULTRA = mkGeoms(40, 28, 20, 16, 40);
export const SHARED_GEOMETRIES_HIGH = mkGeoms(20, 14, 12, 10, 24);
export const SHARED_GEOMETRIES_LOW = mkGeoms(10, 7, 6, 6, 12);
export const SHARED_GEOMETRIES = SHARED_GEOMETRIES_HIGH;

export const SHARED_SCALE_DIAMOND_GEOMETRY = (() => {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, 0.5, 0.04, -0.5, 0, 0, 0, -0.5, 0, 0.5, 0, 0]), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1]), 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  return g;
})();

interface CachedGeometryEntry {
  geometry: THREE.BufferGeometry;
  curveSamples?: CurveSample[];
  radiusAt?: (u: number) => number;
  refCount: number;
}
const _customGeometryCache = new Map<string, CachedGeometryEntry>();

function getOrCreateCustomGeometry(
  key: string,
  builder: () => { geometry: THREE.BufferGeometry; curveSamples?: CurveSample[]; radiusAt?: (u: number) => number }
): CachedGeometryEntry {
  let e = _customGeometryCache.get(key);
  if (!e) {
    const b = builder();
    e = { geometry: b.geometry, curveSamples: b.curveSamples, radiusAt: b.radiusAt, refCount: 1 };
    _customGeometryCache.set(key, e);
  } else {
    e.refCount++;
  }
  return e;
}

function releaseCustomGeometry(key: string) {
  const e = _customGeometryCache.get(key);
  if (e && --e.refCount <= 0) {
    e.geometry.dispose();
    _customGeometryCache.delete(key);
  }
}

function buildTubeGeometry(tube: TubeParams, tier: DetailTier, texScale?: [number, number]) {
  const radSeg = tier === 'ultra' ? 20 : tier === 'high' ? 10 : 5;
  const tubSeg = tier === 'ultra' ? 96 : tier === 'high' ? 28 : 12;
  const vPts = tube.points.map((p) => new THREE.Vector3(p[0], p[1], p[2]));
  const curve = new THREE.CatmullRomCurve3(vPts);
  const frames = curve.computeFrenetFrames(tubSeg, false);

  const verts: number[] = [], norms: number[] = [], uvs: number[] = [], idxs: number[] = [];
  const curveSamples: CurveSample[] = [];
  const aspectSqrt = Math.sqrt(tube.aspect || 1.0);
  const uTexRep = texScale ? texScale[1] : 1;
  const vTexRep = texScale ? texScale[0] : 1;

  const radiusAt = (u: number) => {
    const pM = tube.radiusProfile ? interpolateProfile(tube.radiusProfile, u) : 1.0;
    return (tube.radiusStart + (tube.radiusEnd - tube.radiusStart) * u) * pM;
  };

  for (let i = 0; i <= tubSeg; i++) {
    const u = i / tubSeg;
    const p = curve.getPointAt(u);
    const bR = radiusAt(u), rx = bR * aspectSqrt, ry = bR / aspectSqrt;
    const N = frames.normals[i], B = frames.binormals[i], T = frames.tangents[i];

    curveSamples.push({
      u,
      pos: [p.x, p.y, p.z],
      tangent: [T.x, T.y, T.z],
      normal: [N.x, N.y, N.z],
      binormal: [B.x, B.y, B.z],
    });

    for (let j = 0; j <= radSeg; j++) {
      const v = (j / radSeg) * Math.PI * 2;
      const cos = -Math.cos(v), sin = Math.sin(v);
      const nv = new THREE.Vector3().addScaledVector(N, cos).addScaledVector(B, sin).normalize();
      const vp = new THREE.Vector3().copy(p).addScaledVector(N, cos * rx).addScaledVector(B, sin * ry);

      if (tube.bumps && tube.bumps.amp > 0) {
        const f = tube.bumps.freq;
        vp.addScaledVector(nv, valueNoise3D(vp.x * f, vp.y * f, vp.z * f, tube.bumps.seed) * tube.bumps.amp);
      }
      verts.push(vp.x, vp.y, vp.z);
      norms.push(nv.x, nv.y, nv.z);
      uvs.push((j / radSeg) * vTexRep, u * uTexRep);
    }
  }

  for (let i = 0; i < tubSeg; i++) {
    for (let j = 0; j < radSeg; j++) {
      const a = i * (radSeg + 1) + j, b = (i + 1) * (radSeg + 1) + j;
      const c = (i + 1) * (radSeg + 1) + (j + 1), d = i * (radSeg + 1) + (j + 1);
      idxs.push(a, b, d, b, c, d);
    }
  }

  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  geom.setAttribute('normal', new THREE.Float32BufferAttribute(norms, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geom.setIndex(idxs);
  return { geometry: geom, curveSamples, radiusAt };
}

function buildMembraneGeometry(polygon: [number, number][]): THREE.BufferGeometry {
  const verts: number[] = [], norms: number[] = [], uvs: number[] = [], idxs: number[] = [];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i < polygon.length; i++) {
    minX = Math.min(minX, polygon[i][0]);
    maxX = Math.max(maxX, polygon[i][0]);
    minY = Math.min(minY, polygon[i][1]);
    maxY = Math.max(maxY, polygon[i][1]);
  }
  const spanX = maxX - minX || 1.0;
  const spanY = maxY - minY || 1.0;

  for (let i = 0; i < polygon.length; i++) {
    verts.push(polygon[i][0], polygon[i][1], 0);
    norms.push(0, 0, 1);
    uvs.push((polygon[i][0] - minX) / spanX, (polygon[i][1] - minY) / spanY);
  }
  const off = polygon.length;
  for (let i = 0; i < polygon.length; i++) {
    verts.push(polygon[i][0], polygon[i][1], 0);
    norms.push(0, 0, -1);
    uvs.push((polygon[i][0] - minX) / spanX, (polygon[i][1] - minY) / spanY);
  }
  for (let i = 1; i < polygon.length - 1; i++) {
    idxs.push(0, i, i + 1, off, off + i + 1, off + i);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(norms, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idxs);
  return g;
}

const _tempV = new THREE.Vector3();
const _tempE = new THREE.Euler();
const _tempQ = new THREE.Quaternion();
const _tempS = new THREE.Vector3();
const _tempM = new THREE.Matrix4();
const _tempN = new THREE.Vector3();
const _tempT = new THREE.Vector3();
const _tempB = new THREE.Vector3();
const _tempRotM = new THREE.Matrix4();
const noop = () => {};

export const CreatureBody: React.FC<CreatureBodyProps> = ({
  recipe,
  baseColor,
  accentColor,
  glowColor,
  glowStrength = 1.6,
  ferocity = 5,
  detailLevel = 'high',
  bobbingSpeed = 1.0,
  wireframe = false,
  silhouetteMode = false,
}) => {
  const rootGroupRef = useRef<THREE.Group>(null);
  const tNorm = useMemo(() => ferocityToT(ferocity), [ferocity]);
  const tier: DetailTier = detailLevel || 'high';
  const isLowDetail = tier === 'low';

  const { customGeometries, tubeMeta, customKeys } = useMemo(() => {
    const geomMap = new Map<string, THREE.BufferGeometry>();
    const metaMap = new Map<string, { curveSamples: CurveSample[]; radiusAt: (u: number) => number }>();
    const keys: string[] = [];

    recipe.parts.forEach((p) => {
      if (p.shape === 'tube' && p.tube && p.tube.points.length >= 3) {
        const k = `${recipe.id}-${p.id}-${tier}`;
        keys.push(k);
        const e = getOrCreateCustomGeometry(k, () => buildTubeGeometry(p.tube!, tier, p.texScale));
        geomMap.set(p.id, e.geometry);
        if (e.curveSamples && e.radiusAt) metaMap.set(p.id, { curveSamples: e.curveSamples, radiusAt: e.radiusAt });
      } else if (p.shape === 'membrane' && p.polygon && p.polygon.length >= 3) {
        const k = `${recipe.id}-${p.id}-${tier}`;
        keys.push(k);
        geomMap.set(p.id, getOrCreateCustomGeometry(k, () => ({ geometry: buildMembraneGeometry(p.polygon!) })).geometry);
      }
    });

    return { customGeometries: geomMap, tubeMeta: metaMap, customKeys: keys };
  }, [recipe, tier]);

  useEffect(() => () => customKeys.forEach(releaseCustomGeometry), [customKeys]);

  const rimUniformsRef = useRef({
    uRimStrength: { value: (0.25 + tNorm * 0.75) * (glowStrength / 1.6) },
    uRimColor: { value: new THREE.Color(glowColor || '#fbbf24') },
  });

  useEffect(() => {
    rimUniformsRef.current.uRimStrength.value = (0.25 + tNorm * 0.75) * (glowStrength / 1.6);
    rimUniformsRef.current.uRimColor.value.set(glowColor || '#fbbf24');
  }, [tNorm, glowStrength, glowColor]);

  const hasPhysicalFeatures = useMemo(
    () => recipe.parts.some((p) => p.skin === 'scales' || p.skin === 'rough' || p.role === 'membrane' || p.role === 'eye'),
    [recipe]
  );

  const { bodyMat, accentMat, glowMat, membraneMat, eyeMat, silhouetteMat } = useMemo(() => {
    const bColor = baseColor || recipe.palette?.body || '#141824';
    const aColor = accentColor || recipe.palette?.accent || '#c5a059';
    const gColor = glowColor || '#fbbf24';

    const attachRim = (m: THREE.Material) => {
      m.onBeforeCompile = (s) => {
        s.uniforms.uRimStrength = rimUniformsRef.current.uRimStrength;
        s.uniforms.uRimColor = rimUniformsRef.current.uRimColor;
        s.fragmentShader = `uniform float uRimStrength; uniform vec3 uRimColor;\n` + s.fragmentShader;
        s.fragmentShader = s.fragmentShader.replace(
          '#include <opaque_fragment>',
          `float rimDot = 1.0 - saturate(dot(geometryNormal, geometryViewDir));
           outgoingLight += uRimColor * (pow(rimDot, 3.0) * uRimStrength);
           #include <opaque_fragment>`
        );
      };
      m.customProgramCacheKey = () => 'CreatureRimShader';
    };

    let bMat: THREE.Material, aMat: THREE.Material, mMat: THREE.Material, eMat: THREE.Material;

    if (!hasPhysicalFeatures) {
      bMat = new THREE.MeshStandardMaterial({
        color: bColor, roughness: recipe.palette?.roughness ?? 0.65, metalness: recipe.palette?.metalness ?? 0.35, flatShading: true, wireframe,
      });
      aMat = new THREE.MeshStandardMaterial({
        color: aColor, roughness: Math.max(0.2, (recipe.palette?.roughness ?? 0.65) - 0.2), metalness: Math.min(0.9, (recipe.palette?.metalness ?? 0.35) + 0.35), flatShading: true, wireframe,
      });
      mMat = bMat;
      eMat = new THREE.MeshStandardMaterial({ color: gColor, emissive: gColor, emissiveIntensity: 2.0, wireframe });
    } else {
      const tex = getCreatureTextures();
      bMat = new THREE.MeshPhysicalMaterial({
        color: bColor, roughness: 0.5, metalness: 0.1, clearcoat: 0.25, clearcoatRoughness: 0.5, normalMap: tex.scaleNormalMap,
        emissive: new THREE.Color(gColor), emissiveMap: tex.crackEmissive,
        emissiveIntensity: tNorm < 0.35 ? 0 : ((tNorm - 0.35) / 0.65) * 1.2, wireframe,
      });
      aMat = new THREE.MeshPhysicalMaterial({
        color: aColor, roughness: 0.45, metalness: 0.25, clearcoat: 0.2, clearcoatRoughness: 0.5, normalMap: tex.skinBump, wireframe,
      });
      mMat = new THREE.MeshStandardMaterial({
        color: bColor, emissive: new THREE.Color(gColor), emissiveMap: tex.membraneVeins, emissiveIntensity: 1.2,
        transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide, roughness: 0.45, wireframe,
      });
      eMat = new THREE.MeshStandardMaterial({ color: gColor, emissive: new THREE.Color(gColor), emissiveIntensity: 3.5, roughness: 0.1, wireframe });
    }

    attachRim(bMat);
    attachRim(aMat);

    const gMat = new THREE.MeshStandardMaterial({ color: gColor, emissive: gColor, emissiveIntensity: glowStrength, roughness: 0.2, metalness: 0.1, wireframe });
    const sMat = new THREE.MeshBasicMaterial({ color: '#000000', wireframe });

    return { bodyMat: bMat, accentMat: aMat, glowMat: gMat, membraneMat: mMat, eyeMat: eMat, silhouetteMat: sMat };
  }, [baseColor, accentColor, glowColor, glowStrength, recipe, wireframe, hasPhysicalFeatures, tNorm]);

  useEffect(() => () => {
    bodyMat.dispose(); accentMat.dispose(); glowMat.dispose(); membraneMat.dispose(); eyeMat.dispose(); silhouetteMat.dispose();
  }, [bodyMat, accentMat, glowMat, membraneMat, eyeMat, silhouetteMat]);

  useEffect(() => {
    if (hasPhysicalFeatures && 'emissiveIntensity' in bodyMat) {
      (bodyMat as THREE.MeshPhysicalMaterial).emissiveIntensity = tNorm < 0.35 ? 0 : ((tNorm - 0.35) / 0.65) * 1.2;
    }
  }, [tNorm, bodyMat, hasPhysicalFeatures]);

  const activeParts = useMemo(
    () => recipe.parts.filter((p) => !(isLowDetail && p.fine && !p.silhouette)),
    [recipe.parts, isLowDetail]
  );

  const { singleParts, instancedParts, scaleTubeParts } = useMemo(() => {
    const singles: Part[] = [], instanced: Part[] = [], scaleTubes: Part[] = [];
    activeParts.forEach((p) => {
      if (p.shape === 'tube' && p.tube?.scales && tier !== 'low') scaleTubes.push(p);
      if (p.repeat && p.repeat.count >= 4 && p.shape !== 'tube' && p.shape !== 'membrane') instanced.push(p);
      else singles.push(p);
    });
    return { singleParts: singles, instancedParts: instanced, scaleTubeParts: scaleTubes };
  }, [activeParts, tier]);

  const animatedRefs = useRef<Map<string, { mesh: THREE.Group | THREE.Mesh; part: Part }>>(new Map());
  const instancedRefs = useRef<Map<string, { mesh: THREE.InstancedMesh; part: Part }>>(new Map());
  const scaleMeshRefs = useRef<Map<string, THREE.InstancedMesh>>(new Map());

  const getMaterial = (p: Part) => {
    if (silhouetteMode) return silhouetteMat;
    if (p.role === 'membrane') return membraneMat;
    if (p.role === 'eye') return eyeMat;
    if (p.role === 'accent') return accentMat;
    if (p.role === 'glow') return glowMat;
    return bodyMat;
  };

  const getGeometry = (p: Part) => {
    if (p.shape === 'tube' || p.shape === 'membrane') return customGeometries.get(p.id);
    const s = tier === 'ultra' ? SHARED_GEOMETRIES_ULTRA : tier === 'low' ? SHARED_GEOMETRIES_LOW : SHARED_GEOMETRIES_HIGH;
    return s[p.shape as SharedShape];
  };

  useLayoutEffect(() => {
    instancedParts.forEach((part) => {
      const e = instancedRefs.current.get(part.id);
      if (!e || !part.repeat) return;
      const { mesh } = e;
      const count = part.repeat.count, bS = partScale(part, tNorm);
      const sP = part.repeat.stepPos || [0, 0, 0], sR = part.repeat.stepRot || [0, 0, 0], sS = part.repeat.stepScale || [0, 0, 0];

      for (let i = 0; i < count; i++) {
        _tempV.set(part.pos[0] + sP[0] * i, part.pos[1] + sP[1] * i, part.pos[2] + sP[2] * i);
        _tempE.set((part.rot ? part.rot[0] : 0) + sR[0] * i, (part.rot ? part.rot[1] : 0) + sR[1] * i, (part.rot ? part.rot[2] : 0) + sR[2] * i);
        _tempQ.setFromEuler(_tempE);
        _tempS.set(Math.max(0.001, bS[0] + sS[0] * i), Math.max(0.001, bS[1] + sS[1] * i), Math.max(0.001, bS[2] + sS[2] * i));
        _tempM.compose(_tempV, _tempQ, _tempS);
        mesh.setMatrixAt(i, _tempM);
      }
      mesh.instanceMatrix.needsUpdate = true;
    });
  }, [instancedParts, tNorm]);

  useLayoutEffect(() => {
    if (tier === 'low') return;
    let creatureScaleBudget = MAX_SCALES_PER_CREATURE;
    scaleTubeParts.forEach((part) => {
      const iMesh = scaleMeshRefs.current.get(part.id);
      const meta = tubeMeta.get(part.id);
      if (!iMesh || !part.tube?.scales || !meta) return;

      const spec = part.tube.scales;
      const baseCount = tier === 'ultra' ? spec.count : Math.round(spec.count * 0.35);
      const scaleCount = Math.min(MAX_SCALES_PER_PART, Math.min(creatureScaleBudget, baseCount));
      creatureScaleBudget -= scaleCount;
      if (scaleCount <= 0) return;

      const placed = placeScales({ ...spec, count: scaleCount }, meta.curveSamples, meta.radiusAt);

      for (let i = 0; i < placed.count; i++) {
        _tempV.fromArray(placed.positions, i * 3);
        _tempN.fromArray(placed.normals, i * 3).normalize();
        _tempT.fromArray(placed.tangents, i * 3).normalize();
        _tempB.crossVectors(_tempN, _tempT).normalize();
        _tempT.crossVectors(_tempB, _tempN).normalize();
        _tempRotM.makeBasis(_tempB, _tempT, _tempN);
        _tempQ.setFromRotationMatrix(_tempRotM);
        _tempS.set(placed.sizes[i * 2], placed.sizes[i * 2 + 1], 1);
        _tempM.compose(_tempV, _tempQ, _tempS);
        iMesh.setMatrixAt(i, _tempM);
      }
      iMesh.instanceMatrix.needsUpdate = true;
    });
  }, [scaleTubeParts, tubeMeta, tier]);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    const speedMult = Math.max(0.5, bobbingSpeed);

    animatedRefs.current.forEach(({ mesh, part }) => {
      const a = part.anim;
      if (!a) return;
      const at = time * a.speed * speedMult + (a.phase || 0);
      const bS = partScale(part, tNorm);

      if (a.kind === 'sway') {
        mesh.rotation.z = (part.rot ? part.rot[2] : 0) + Math.sin(at) * a.amp;
      } else if (a.kind === 'flap') {
        const fa = Math.sin(at) * a.amp;
        mesh.rotation.z = (part.rot ? part.rot[2] : 0) + fa;
        mesh.rotation.x = (part.rot ? part.rot[0] : 0) + fa * 0.3;
      } else if (a.kind === 'pulse') {
        const p = 1 + Math.sin(at) * a.amp;
        mesh.scale.set(bS[0] * p, bS[1] * p, bS[2] * p);
      } else if (a.kind === 'coil') {
        const cw = Math.sin(at) * a.amp;
        mesh.position.y = part.pos[1] + cw;
        mesh.rotation.y = (part.rot ? part.rot[1] : 0) + cw * 0.4;
      } else if (a.kind === 'spin') {
        mesh.rotation.y += delta * a.speed * a.amp;
      }
    });

    instancedRefs.current.forEach(({ mesh, part }) => {
      const a = part.anim;
      if (!a || !part.repeat) return;
      const bS = partScale(part, tNorm);
      const sP = part.repeat.stepPos || [0, 0, 0], sR = part.repeat.stepRot || [0, 0, 0], sS = part.repeat.stepScale || [0, 0, 0];

      for (let i = 0; i < part.repeat.count; i++) {
        const at = time * a.speed * speedMult + (a.phase || 0) + i * 0.25;
        const w = Math.sin(at) * a.amp;
        _tempV.set(part.pos[0] + sP[0] * i, part.pos[1] + sP[1] * i + (a.kind === 'coil' ? w : 0), part.pos[2] + sP[2] * i);
        _tempE.set((part.rot ? part.rot[0] : 0) + sR[0] * i, (part.rot ? part.rot[1] : 0) + sR[1] * i + (a.kind === 'sway' ? w : 0), (part.rot ? part.rot[2] : 0) + sR[2] * i + (a.kind === 'flap' ? w : 0));
        _tempQ.setFromEuler(_tempE);
        const pS = a.kind === 'pulse' ? 1 + w : 1;
        _tempS.set(Math.max(0.001, (bS[0] + sS[0] * i) * pS), Math.max(0.001, (bS[1] + sS[1] * i) * pS), Math.max(0.001, (bS[2] + sS[2] * i) * pS));
        _tempM.compose(_tempV, _tempQ, _tempS);
        mesh.setMatrixAt(i, _tempM);
      }
      mesh.instanceMatrix.needsUpdate = true;
    });
  });

  return (
    <group ref={rootGroupRef}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2.5, 8, 6]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {singleParts.map((part) => {
        const scale = partScale(part, tNorm);
        if (scale[0] <= 0.001 && scale[1] <= 0.001 && scale[2] <= 0.001) return null;
        const geom = getGeometry(part);
        if (!geom) return null;
        const mat = getMaterial(part);
        const hasScales = part.shape === 'tube' && Boolean(part.tube?.scales) && tier !== 'low';
        const rawScaleCount = hasScales ? (tier === 'ultra' ? part.tube!.scales!.count : Math.round(part.tube!.scales!.count * 0.35)) : 0;
        const scaleCount = Math.min(MAX_SCALES_PER_PART, rawScaleCount);

        return (
          <group
            key={part.id}
            ref={(node) => {
              if (node && part.anim) animatedRefs.current.set(part.id, { mesh: node, part });
              else animatedRefs.current.delete(part.id);
            }}
            position={part.pos}
            rotation={part.rot || [0, 0, 0]}
          >
            <mesh geometry={geom} material={mat} scale={scale} castShadow receiveShadow raycast={noop} />
            {hasScales && scaleCount > 0 && (
              <instancedMesh
                ref={(node) => {
                  if (node) scaleMeshRefs.current.set(part.id, node);
                  else scaleMeshRefs.current.delete(part.id);
                }}
                args={[SHARED_SCALE_DIAMOND_GEOMETRY, accentMat, scaleCount]}
                castShadow receiveShadow raycast={noop}
              />
            )}
          </group>
        );
      })}

      {instancedParts.map((part) => {
        if (!part.repeat) return null;
        const geom = getGeometry(part);
        if (!geom) return null;
        return (
          <instancedMesh
            key={part.id}
            ref={(node) => {
              if (node) instancedRefs.current.set(part.id, { mesh: node, part });
              else instancedRefs.current.delete(part.id);
            }}
            args={[geom, getMaterial(part), part.repeat.count]}
            castShadow receiveShadow raycast={noop}
          />
        );
      })}
    </group>
  );
};
