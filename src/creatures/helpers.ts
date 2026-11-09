import { Part, Shape, Role, PartAnimation } from './types';

export function chain(
  idPrefix: string,
  count: number,
  shape: Shape,
  role: Role,
  startPos: [number, number, number],
  endPos: [number, number, number],
  startScale: [number, number, number],
  endScale: [number, number, number],
  options?: {
    rot?: [number, number, number];
    grow?: [number, number];
    appearAt?: number;
    anim?: PartAnimation;
    fine?: boolean;
    silhouette?: boolean;
    opacity?: number;
  }
): Part[] {
  const parts: Part[] = [];
  for (let i = 0; i < count; i++) {
    const f = count > 1 ? i / (count - 1) : 0;
    parts.push({
      id: `${idPrefix}-${i}`,
      shape,
      role,
      pos: [startPos[0] + (endPos[0] - startPos[0]) * f, startPos[1] + (endPos[1] - startPos[1]) * f, startPos[2] + (endPos[2] - startPos[2]) * f],
      rot: options?.rot,
      scale: [startScale[0] + (endScale[0] - startScale[0]) * f, startScale[1] + (endScale[1] - startScale[1]) * f, startScale[2] + (endScale[2] - startScale[2]) * f],
      grow: options?.grow,
      appearAt: options?.appearAt,
      anim: options?.anim ? { ...options.anim, phase: (options.anim.phase || 0) + i * 0.3 } : undefined,
      fine: options?.fine,
      silhouette: options?.silhouette,
      opacity: options?.opacity,
    });
  }
  return parts;
}

export function spikeRow(
  idPrefix: string,
  count: number,
  startPos: [number, number, number],
  stepPos: [number, number, number],
  scale: [number, number, number],
  options?: {
    rot?: [number, number, number];
    grow?: [number, number];
    appearAt?: number;
    fine?: boolean;
    silhouette?: boolean;
    role?: Role;
    shape?: Shape;
  }
): Part[] {
  const parts: Part[] = [];
  for (let i = 0; i < count; i++) {
    parts.push({
      id: `${idPrefix}-${i}`,
      shape: options?.shape || 'cone',
      role: options?.role || 'accent',
      pos: [startPos[0] + stepPos[0] * i, startPos[1] + stepPos[1] * i, startPos[2] + stepPos[2] * i],
      rot: options?.rot,
      scale: [...scale],
      grow: options?.grow,
      appearAt: options?.appearAt,
      fine: options?.fine ?? true,
      silhouette: options?.silhouette,
    });
  }
  return parts;
}

export function limbPair(
  idPrefix: string,
  shape: Shape,
  role: Role,
  leftPos: [number, number, number],
  scale: [number, number, number],
  leftRot?: [number, number, number],
  options?: {
    grow?: [number, number];
    appearAt?: number;
    anim?: PartAnimation;
    fine?: boolean;
    silhouette?: boolean;
    opacity?: number;
  }
): Part[] {
  const rL = leftRot || [0, 0, 0];
  const aL = options?.anim;
  return [
    {
      id: `${idPrefix}-left`,
      shape,
      role,
      pos: [...leftPos],
      rot: rL,
      scale: [...scale],
      grow: options?.grow,
      appearAt: options?.appearAt,
      anim: aL,
      fine: options?.fine,
      silhouette: options?.silhouette,
      opacity: options?.opacity,
    },
    {
      id: `${idPrefix}-right`,
      shape,
      role,
      pos: [-leftPos[0], leftPos[1], leftPos[2]],
      rot: [rL[0], -rL[1], -rL[2]],
      scale: [...scale],
      grow: options?.grow,
      appearAt: options?.appearAt,
      anim: aL ? { ...aL, phase: (aL.phase || 0) + Math.PI } : undefined,
      fine: options?.fine,
      silhouette: options?.silhouette,
      opacity: options?.opacity,
    },
  ];
}

export function hornPair(
  idPrefix: string,
  shape: Shape,
  role: Role,
  leftPos: [number, number, number],
  scale: [number, number, number],
  leftRot?: [number, number, number],
  options?: {
    grow?: [number, number];
    appearAt?: number;
    fine?: boolean;
    silhouette?: boolean;
  }
): Part[] {
  const rL = leftRot || [-0.4, 0.3, 0.2];
  return [
    {
      id: `${idPrefix}-horn-l`,
      shape,
      role,
      pos: [...leftPos],
      rot: rL,
      scale: [...scale],
      grow: options?.grow,
      appearAt: options?.appearAt,
      fine: options?.fine,
      silhouette: options?.silhouette,
    },
    {
      id: `${idPrefix}-horn-r`,
      shape,
      role,
      pos: [-leftPos[0], leftPos[1], leftPos[2]],
      rot: [rL[0], -rL[1], -rL[2]],
      scale: [...scale],
      grow: options?.grow,
      appearAt: options?.appearAt,
      fine: options?.fine,
      silhouette: options?.silhouette,
    },
  ];
}

export function wingPair(
  idPrefix: string,
  leftPos: [number, number, number],
  scale: [number, number, number],
  leftRot?: [number, number, number],
  options?: {
    role?: Role;
    animSpeed?: number;
    animAmp?: number;
    grow?: [number, number];
    appearAt?: number;
    fine?: boolean;
    silhouette?: boolean;
  }
): Part[] {
  const rL = leftRot || [0.1, 0, -0.2];
  const spd = options?.animSpeed || 2.2, amp = options?.animAmp || 0.25;
  return [
    {
      id: `${idPrefix}-wing-l`,
      shape: 'box',
      role: options?.role || 'body',
      pos: [...leftPos],
      rot: rL,
      scale: [...scale],
      grow: options?.grow,
      appearAt: options?.appearAt,
      anim: { kind: 'flap', speed: spd, amp, phase: 0 },
      fine: options?.fine,
      silhouette: options?.silhouette,
    },
    {
      id: `${idPrefix}-wing-r`,
      shape: 'box',
      role: options?.role || 'body',
      pos: [-leftPos[0], leftPos[1], leftPos[2]],
      rot: [rL[0], -rL[1], -rL[2]],
      scale: [...scale],
      grow: options?.grow,
      appearAt: options?.appearAt,
      anim: { kind: 'flap', speed: spd, amp, phase: Math.PI },
      fine: options?.fine,
      silhouette: options?.silhouette,
    },
  ];
}

export function tentacle(
  idPrefix: string,
  count: number,
  startPos: [number, number, number],
  stepPos: [number, number, number],
  baseScale: [number, number, number],
  options?: {
    shape?: Shape;
    role?: Role;
    grow?: [number, number];
    appearAt?: number;
    anim?: PartAnimation;
    fine?: boolean;
    silhouette?: boolean;
  }
): Part[] {
  const parts: Part[] = [];
  for (let i = 0; i < count; i++) {
    const f = 1 - (i / Math.max(1, count)) * 0.45;
    parts.push({
      id: `${idPrefix}-${i}`,
      shape: options?.shape || 'cylinder',
      role: options?.role || 'body',
      pos: [startPos[0] + stepPos[0] * i, startPos[1] + stepPos[1] * i, startPos[2] + stepPos[2] * i],
      scale: [baseScale[0] * f, baseScale[1] * f, baseScale[2] * f],
      grow: options?.grow,
      appearAt: options?.appearAt,
      anim: options?.anim ? { ...options.anim, phase: (options.anim.phase || 0) + i * 0.4 } : undefined,
      fine: options?.fine,
      silhouette: options?.silhouette,
    });
  }
  return parts;
}

export function jointKnob(
  id: string,
  role: Role,
  pos: [number, number, number],
  radius: number,
  options?: {
    anim?: PartAnimation;
    fine?: boolean;
    silhouette?: boolean;
  }
): Part {
  return {
    id,
    shape: 'sphere',
    role,
    pos: [...pos],
    scale: [radius * 2, radius * 2, radius * 2],
    anim: options?.anim,
    fine: options?.fine ?? true,
    silhouette: options?.silhouette,
  };
}

/**
 * Rotates a 3D point by intrinsic Euler angles [rx, ry, rz] in radians.
 */
export function rotateOffset(pt: [number, number, number], rot?: [number, number, number]): [number, number, number] {
  if (!rot || (rot[0] === 0 && rot[1] === 0 && rot[2] === 0)) {
    return [...pt];
  }
  let [x, y, z] = pt;
  const [rx, ry, rz] = rot;
  if (rx !== 0) {
    const c = Math.cos(rx), s = Math.sin(rx);
    const y1 = y * c - z * s;
    const z1 = y * s + z * c;
    y = y1; z = z1;
  }
  if (ry !== 0) {
    const c = Math.cos(ry), s = Math.sin(ry);
    const x1 = x * c + z * s;
    const z1 = -x * s + z * c;
    x = x1; z = z1;
  }
  if (rz !== 0) {
    const c = Math.cos(rz), s = Math.sin(rz);
    const x1 = x * c - y * s;
    const y1 = x * s + y * c;
    x = x1; y = y1;
  }
  return [x, y, z];
}

/**
 * Builds a complete serpent-dragon head assembly with skull, snout, jaw, brow ridges,
 * slit-pupil eyes, front fangs, forked tongue, head crest, and glowing throat interior.
 */
export function serpentHead(
  idPrefix: string,
  basePos: [number, number, number],
  rot: [number, number, number] = [0, 0, 0],
  scaleMultiplier = 1.0,
  options?: {
    appearAt?: number;
    crestScale?: [number, number, number];
    jawAngle?: number;
    tonguePhase?: number;
  }
): Part[] {
  const parts: Part[] = [];
  const s = scaleMultiplier;
  const app = options?.appearAt;

  const place = (
    localPos: [number, number, number],
    localRot: [number, number, number] = [0, 0, 0]
  ): { pos: [number, number, number]; rot: [number, number, number] } => {
    const scaledLocal: [number, number, number] = [localPos[0] * s, localPos[1] * s, localPos[2] * s];
    const rotated = rotateOffset(scaledLocal, rot);
    return {
      pos: [basePos[0] + rotated[0], basePos[1] + rotated[1], basePos[2] + rotated[2]],
      rot: [rot[0] + localRot[0], rot[1] + localRot[1], rot[2] + localRot[2]],
    };
  };

  // 1. Cranium core
  const cranium = place([0, 0.04, -0.04]);
  parts.push({
    id: `${idPrefix}-cranium`,
    shape: 'box',
    role: 'body',
    pos: cranium.pos,
    rot: cranium.rot,
    scale: [0.32 * s, 0.22 * s, 0.36 * s],
    appearAt: app,
    silhouette: true,
  });

  // 2. Long tapered snout
  const snout = place([0, 0.02, 0.30], [Math.PI / 2, 0, 0]);
  parts.push({
    id: `${idPrefix}-snout`,
    shape: 'cone',
    role: 'body',
    pos: snout.pos,
    rot: snout.rot,
    scale: [0.26 * s, 0.44 * s, 0.18 * s],
    appearAt: app,
    silhouette: true,
  });

  // 3. Lower jaw (opens wider as ferocity increases)
  const jaw = place([0, -0.12, 0.20], [options?.jawAngle ?? 0.16, 0, 0]);
  parts.push({
    id: `${idPrefix}-jaw`,
    shape: 'box',
    role: 'body',
    pos: jaw.pos,
    rot: jaw.rot,
    scale: [0.24 * s, 0.08 * s, 0.42 * s],
    appearAt: app,
    grow: [1.0, 1.45],
    silhouette: true,
  });

  // 4. Brow ridges (paired via stepPos)
  const brow = place([0.13, 0.12, 0.10], [0.12, 0.15, -0.1]);
  parts.push({
    id: `${idPrefix}-brow`,
    shape: 'box',
    role: 'accent',
    pos: brow.pos,
    rot: brow.rot,
    scale: [0.08 * s, 0.06 * s, 0.26 * s],
    repeat: { count: 2, stepPos: [-0.26 * s, 0, 0], stepRot: [0, -0.3, 0.2] },
    appearAt: app,
    silhouette: true,
  });

  // 5. Slit-pupil eyes (emissive spheres)
  const eye = place([0.15, 0.06, 0.14]);
  parts.push({
    id: `${idPrefix}-eyes`,
    shape: 'sphere',
    role: 'eye',
    pos: eye.pos,
    rot: eye.rot,
    scale: [0.07 * s, 0.07 * s, 0.07 * s],
    repeat: { count: 2, stepPos: [-0.30 * s, 0, 0] },
    appearAt: app,
    silhouette: true,
  });

  // 6. Pupil dark slits
  const pupil = place([0.17, 0.06, 0.16], [0, 0.3, 0]);
  parts.push({
    id: `${idPrefix}-pupils`,
    shape: 'box',
    role: 'body',
    pos: pupil.pos,
    rot: pupil.rot,
    scale: [0.012 * s, 0.06 * s, 0.024 * s],
    repeat: { count: 2, stepPos: [-0.34 * s, 0, 0] },
    appearAt: app,
    fine: true,
  });

  // 7. Long front fangs (lengthen with ferocity)
  const fang = place([0.09, -0.06, 0.36], [0.22, 0.1, 0]);
  parts.push({
    id: `${idPrefix}-fangs`,
    shape: 'blade',
    role: 'accent',
    pos: fang.pos,
    rot: fang.rot,
    scale: [0.035 * s, 0.13 * s, 0.035 * s],
    repeat: { count: 2, stepPos: [-0.18 * s, 0, 0] },
    appearAt: app,
    grow: [1.0, 1.85],
    fine: true,
  });

  // 8. Forked tongue extending forward
  const tongue = place([0.03, -0.08, 0.48], [Math.PI / 2, 0.2, 0]);
  parts.push({
    id: `${idPrefix}-tongue`,
    shape: 'cylinder',
    role: 'accent',
    pos: tongue.pos,
    rot: tongue.rot,
    scale: [0.014 * s, 0.22 * s, 0.014 * s],
    repeat: { count: 2, stepPos: [-0.06 * s, 0, 0], stepRot: [0, -0.4, 0] },
    appearAt: app,
    fine: true,
  });

  // 9. Dorsal head crest / blade horn
  const crestScale = options?.crestScale || [0.05, 0.28, 0.18];
  const crest = place([0, 0.18, -0.06], [-0.35, 0, 0]);
  parts.push({
    id: `${idPrefix}-crest`,
    shape: 'blade',
    role: 'accent',
    pos: crest.pos,
    rot: crest.rot,
    scale: [crestScale[0] * s, crestScale[1] * s, crestScale[2] * s],
    appearAt: app,
    grow: [1.0, 1.6],
  });

  // 10. Glowing throat interior (grows and pulses, visible as jaw opens)
  const throat = place([0, -0.06, 0.10]);
  parts.push({
    id: `${idPrefix}-throat-glow`,
    shape: 'sphere',
    role: 'glow',
    pos: throat.pos,
    scale: [0.14 * s, 0.12 * s, 0.18 * s],
    appearAt: app ? Math.max(app, 0.20) : 0.20,
    grow: [0.8, 2.0],
    anim: { kind: 'pulse', speed: 2.6, amp: 0.18 },
  });

  return parts;
}

/**
 * Builds a draped hood and shoulder cloak using translucent membrane panels with soft folds.
 */
export function humanoidHood(
  idPrefix: string,
  centerPos: [number, number, number],
  scale = 1.0,
  options?: {
    rot?: [number, number, number];
    silhouette?: boolean;
  }
): Part[] {
  const s = scale;
  const rot = options?.rot || [0, 0, 0];
  const sil = options?.silhouette ?? true;

  return [
    // Hood cowl covering top and back of head
    {
      id: `${idPrefix}-hood-cowl`,
      shape: 'membrane',
      role: 'membrane',
      pos: [...centerPos],
      rot,
      scale: [s, s, s],
      polygon: [
        [-0.30, 0.25],
        [0.0, 0.38],
        [0.30, 0.25],
        [0.36, -0.05],
        [0.0, -0.22],
        [-0.36, -0.05],
      ],
      opacity: 0.88,
      silhouette: sil,
    },
    // Left draped shoulder cloak fold
    {
      id: `${idPrefix}-cloak-l`,
      shape: 'membrane',
      role: 'membrane',
      pos: [centerPos[0] + 0.18 * s, centerPos[1] - 0.22 * s, centerPos[2] - 0.05 * s],
      rot: [rot[0] + 0.1, rot[1] + 0.3, rot[2] - 0.2],
      scale: [s, s, s],
      polygon: [
        [0.0, 0.20],
        [0.28, 0.10],
        [0.38, -0.35],
        [0.10, -0.42],
        [-0.05, -0.15],
      ],
      opacity: 0.85,
      silhouette: sil,
    },
    // Right draped shoulder cloak fold
    {
      id: `${idPrefix}-cloak-r`,
      shape: 'membrane',
      role: 'membrane',
      pos: [centerPos[0] - 0.18 * s, centerPos[1] - 0.22 * s, centerPos[2] - 0.05 * s],
      rot: [rot[0] + 0.1, rot[1] - 0.3, rot[2] + 0.2],
      scale: [s, s, s],
      polygon: [
        [0.0, 0.20],
        [-0.28, 0.10],
        [-0.38, -0.35],
        [-0.10, -0.42],
        [0.05, -0.15],
      ],
      opacity: 0.85,
      silhouette: sil,
    },
  ];
}

/**
 * Builds a pale mask-like face under the hood with hollow eye sockets,
 * ocular emission, open jaw, and glowing mouth cavity.
 */
export function humanoidFace(
  idPrefix: string,
  headPos: [number, number, number],
  scale = 1.0,
  options?: {
    rot?: [number, number, number];
    jawAngle?: number;
    silhouette?: boolean;
  }
): Part[] {
  const s = scale;
  const rot = options?.rot || [0, 0, 0];
  const sil = options?.silhouette ?? true;

  const place = (local: [number, number, number]): [number, number, number] => {
    const rotated = rotateOffset([local[0] * s, local[1] * s, local[2] * s], rot);
    return [headPos[0] + rotated[0], headPos[1] + rotated[1], headPos[2] + rotated[2]];
  };

  return [
    // Smooth pale facial mask
    {
      id: `${idPrefix}-mask`,
      shape: 'capsule',
      role: 'body',
      pos: place([0, 0.02, 0.05]),
      rot,
      scale: [0.22 * s, 0.28 * s, 0.18 * s],
      skin: 'smooth',
      silhouette: sil,
    },
    // Hollow eye sockets with bright pupil/iris emission
    {
      id: `${idPrefix}-eyes`,
      shape: 'sphere',
      role: 'eye',
      pos: place([0.08, 0.06, 0.13]),
      rot,
      scale: [0.05 * s, 0.05 * s, 0.05 * s],
      repeat: { count: 2, stepPos: [-0.16 * s, 0, 0] },
      silhouette: sil,
    },
    // Open lower jaw (drops and widens with ferocity)
    {
      id: `${idPrefix}-jaw`,
      shape: 'box',
      role: 'body',
      pos: place([0, -0.12, 0.10]),
      rot: [rot[0] + (options?.jawAngle ?? 0.2), rot[1], rot[2]],
      scale: [0.18 * s, 0.07 * s, 0.22 * s],
      grow: [1.0, 1.55],
      silhouette: sil,
    },
    // Glowing mouth interior (singing voice manifestation)
    {
      id: `${idPrefix}-mouth-glow`,
      shape: 'octahedron',
      role: 'glow',
      pos: place([0, -0.06, 0.09]),
      scale: [0.11 * s, 0.09 * s, 0.12 * s],
      grow: [0.8, 2.2],
      anim: { kind: 'pulse', speed: 2.8, amp: 0.22 },
    },
  ];
}

/**
 * Builds elegant reaching arms with forward-reaching upper arm, forearm,
 * and fine clawed fingers that lengthen with ferocity.
 */
export function humanoidArms(
  idPrefix: string,
  shoulderL: [number, number, number],
  scale = 1.0,
  options?: {
    reachAngle?: [number, number, number];
    silhouette?: boolean;
  }
): Part[] {
  const s = scale;
  const ang = options?.reachAngle || [0.4, 0.2, -0.3];
  const sil = options?.silhouette ?? true;

  return [
    // Upper arms (paired)
    {
      id: `${idPrefix}-arm-upper`,
      shape: 'capsule',
      role: 'body',
      pos: [...shoulderL],
      rot: ang,
      scale: [0.09 * s, 0.42 * s, 0.09 * s],
      repeat: { count: 2, stepPos: [-2 * shoulderL[0], 0, 0], stepRot: [0, -2 * ang[1], -2 * ang[2]] },
      silhouette: sil,
    },
    // Forearms reaching forward (paired)
    {
      id: `${idPrefix}-arm-fore`,
      shape: 'capsule',
      role: 'body',
      pos: [shoulderL[0] + 0.12 * s, shoulderL[1] - 0.32 * s, shoulderL[2] + 0.26 * s],
      rot: [ang[0] + 0.3, ang[1] + 0.15, ang[2]],
      scale: [0.075 * s, 0.38 * s, 0.075 * s],
      repeat: { count: 2, stepPos: [-2 * (shoulderL[0] + 0.12 * s), 0, 0], stepRot: [0, -2 * (ang[1] + 0.15), -2 * ang[2]] },
      silhouette: sil,
    },
    // Elongated claw tips extending from hands
    {
      id: `${idPrefix}-claws`,
      shape: 'blade',
      role: 'accent',
      pos: [shoulderL[0] + 0.18 * s, shoulderL[1] - 0.52 * s, shoulderL[2] + 0.45 * s],
      rot: [ang[0] + 0.5, ang[1], ang[2]],
      scale: [0.03 * s, 0.14 * s, 0.03 * s],
      repeat: { count: 5, stepPos: [-0.02 * s, 0.01 * s, 0.01 * s], stepScale: [-0.002 * s, -0.01 * s, -0.002 * s] },
      grow: [1.0, 2.2],
      fine: true,
    },
  ];
}

/**
 * Creates a pulsating sound wave ring that expands outwards around the sirens choir.
 */
export function soundRing(
  id: string,
  centerPos: [number, number, number],
  radius: number,
  tubeRadius = 0.02,
  appearAt?: number,
  pulseSpeed = 1.6
): Part {
  return {
    id,
    shape: 'torus',
    role: 'accent',
    pos: [...centerPos],
    rot: [Math.PI / 2, 0, 0],
    scale: [radius, radius, tubeRadius],
    appearAt,
    anim: { kind: 'pulse', speed: pulseSpeed, amp: 0.25 },
  };
}


