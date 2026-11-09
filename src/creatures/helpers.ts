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
