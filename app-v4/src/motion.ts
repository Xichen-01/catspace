import type { ZoneId } from './content';

export const timing = {
  fly: 1260, return: 1060, awake: 1450, curiosity: 740,
  sustain: 10600, resonance: 4400, recover: 2350, restAfter: 34000,
  press: 150, reveal: 430, exit: 235, contactAt: .88
} as const;

export type LifePhase = 'dormant' | 'standby' | 'sense' | 'curious' | 'awakening' | 'resonance' | 'recover';
export type Life = { phase: LifePhase; since: number; near: boolean; activity: number };
export type LifeEvent = 'near' | 'leave' | 'activate' | 'resonate' | 'depart' | 'tick';

export const lifeStyles = {
  dormant: { label: '休眠', lum: .77, span: .93, roll: -.5, tilt: -2, flow: .20, tint: -9, breath: .38 },
  standby: { label: '待机', lum: 1, span: 1, roll: 0, tilt: 0, flow: .48, tint: 0, breath: 1 },
  sense: { label: '感知', lum: 1.08, span: 1.018, roll: 1.4, tilt: 4, flow: .74, tint: -9, breath: .82 },
  curious: { label: '好奇', lum: 1.16, span: 1.046, roll: -3.8, tilt: 8, flow: 1, tint: -19, breath: .67 },
  awakening: { label: '苏醒', lum: 1.23, span: 1.04, roll: 3.4, tilt: -4, flow: 1.24, tint: 12, breath: 1.12 },
  resonance: { label: '共鸣', lum: 1.27, span: 1.073, roll: -2.4, tilt: 3, flow: 1.6, tint: 24, breath: .88 },
  recover: { label: '恢复', lum: .92, span: .974, roll: 1.6, tilt: -5, flow: .53, tint: -4, breath: .56 }
} as const;

export function initialLife(at: number): Life {
  return { phase: 'dormant', since: at, activity: at, near: false };
}

export function nextLife(life: Life, event: LifeEvent, now: number): Life {
  const age = now - life.since;
  const shift = (phase: LifePhase, near = life.near) => ({ phase, since: now, near, activity: phase === 'standby' ? now : life.activity });
  switch (event) {
    case 'near':
      if (life.near) return life;
      if (life.phase === 'standby' || life.phase === 'dormant') return shift('sense', true);
      return { ...life, near: true };
    case 'leave':
      if (!life.near) return life;
      if (life.phase === 'sense' || life.phase === 'curious') return shift('recover', false);
      return { ...life, near: false };
    case 'activate':
      if (life.phase === 'resonance' || (life.phase === 'awakening' && age < timing.awake)) return life;
      return shift(life.phase === 'awakening' ? 'resonance' : 'awakening');
    case 'resonate':
      return life.phase === 'resonance' ? life : shift('resonance');
    case 'depart':
      if (life.phase === 'standby' || life.phase === 'dormant' || life.phase === 'recover') return life;
      return shift('recover', false);
    case 'tick':
      if (life.phase === 'dormant' && age >= 1320 && life.activity === life.since) return shift('standby');
      if (life.phase === 'standby' && now - life.activity >= timing.restAfter) return { ...shift('dormant'), activity: life.activity };
      if (life.phase === 'sense' && age >= timing.curiosity) return shift('curious');
      if (life.phase === 'awakening' && age >= timing.sustain) return shift('recover');
      if (life.phase === 'resonance' && age >= timing.resonance) return shift('recover');
      if (life.phase === 'recover' && age >= timing.recover) return shift(life.near ? 'sense' : 'standby');
      return life;
  }
}

export type Point = readonly [number, number];
type Pose = { x: number; y: number; zoom: number; roll: number };
type Framing = { target: Point; zoom: number; rise: number; side: number; curve: number };
export const framing: Record<ZoneId, Framing> = {
  core: { target: [.553, .405], zoom: .075, rise: -.028, side: 1, curve: .014 },
  archive: { target: [.351, .365], zoom: .108, rise: -.045, side: -1, curve: .031 },
  laboratory: { target: [.815, .345], zoom: .122, rise: -.065, side: 1, curve: .033 },
  constellation: { target: [.763, .595], zoom: .117, rise: .045, side: 1, curve: .026 },
  unknown: { target: [.343, .681], zoom: .135, rise: .054, side: -1, curve: .023 }
};

export const zoneOrder = ['unknown', 'archive', 'core', 'laboratory', 'constellation'] as const;
export const neutral: Pose = { x: 0, y: 0, zoom: 0, roll: 0 };
export const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const ease = (n: number) => { const t = clamp(n, 0, 1); return t * t * t * (t * (6 * t - 15) + 10); };

export type Layout = { width: number; height: number; w: number; h: number; left: number; top: number; compact: boolean };
export function layoutFor(width: number, height: number): Layout {
  const w = Math.max(width, height * (1672 / 941));
  const h = w * (941 / 1672);
  const compact = width < 740;
  return { width, height, w, h, left: (width - w) * (compact ? .574 : .54), top: (height - h) * .5, compact };
}

export function shotFor(zone: ZoneId | null, layout: Layout): Pose {
  if (!zone) return neutral;
  const shot = framing[zone];
  const center = (layout.width * .5 - layout.left) / layout.w;
  const sideTravel = (center - shot.target[0]) * (layout.compact ? 1.0 : .51);
  return {
    x: sideTravel,
    y: shot.rise,
    zoom: shot.zoom + (layout.compact ? .026 : .018),
    roll: shot.side * (layout.compact ? .14 : .29)
  };
}

export function poseAt(from: Pose, to: Pose, phase: number, curve: number): Pose {
  const e = ease(phase);
  const arc = Math.sin(Math.PI * phase) ** 2;
  return {
    x: mix(from.x, to.x, e), y: mix(from.y, to.y, e) + arc * curve,
    zoom: mix(from.zoom, to.zoom, e) + arc * .039,
    roll: mix(from.roll, to.roll, e) + arc * (to.x > from.x ? .38 : -.38)
  };
}

export function plane(depth: number, pose: Pose, layout: Layout) {
  const scale = 1 + pose.zoom * depth;
  const spareX = Math.max(0, (layout.w * scale - layout.width) * .5);
  const spareY = Math.max(0, (layout.h * scale - layout.height) * .5);
  return {
    scale,
    x: clamp(pose.x * layout.w * depth + (layout.left + (layout.w - layout.width) * .5) * scale, -spareX, spareX),
    y: clamp(pose.y * layout.h * depth, -spareY, spareY),
    roll: pose.roll * depth
  };
}

export function project(position: Point, depth: number, pose: Pose, layout: Layout): Point {
  const transform = plane(depth, pose, layout);
  const angle = transform.roll * Math.PI / 180;
  const x = (position[0] - .5) * layout.w * transform.scale;
  const y = (position[1] - .5) * layout.h * transform.scale;
  return [
    layout.width * .5 + transform.x + x * Math.cos(angle) - y * Math.sin(angle),
    layout.height * .5 + transform.y + y * Math.cos(angle) + x * Math.sin(angle)
  ];
}

export type CatPhase = 'rest' | 'walk' | 'watch' | 'guide';
export type CatFrame = { phase: CatPhase; position: Point; direction: 1 | -1; progress: number };
export const catHome: Point = [.551, .744];

function catAlong(from: Point, to: Point, p: number, phase: CatPhase): CatFrame {
  const s = ease(p);
  return { phase, position: [mix(from[0], to[0], s), mix(from[1], to[1], s) + Math.sin(s * Math.PI) * .005], direction: to[0] > from[0] ? 1 : -1, progress: p };
}

export function resident(t: number, life: LifePhase): CatFrame {
  const f = t % 27;
  const perch: Point = [.593, .728];
  if (f >= 3.0 && f < 7.3) return catAlong(catHome, perch, (f - 3) / 4.3, 'walk');
  if (f >= 18 && f < 23) return catAlong(perch, catHome, (f - 18) / 5, 'walk');
  const position = f < 7.3 || f >= 23 ? catHome : perch;
  const observing = life === 'sense' || life === 'curious' || life === 'awakening' || life === 'resonance' || (f > 9 && f < 14);
  return { phase: observing ? 'watch' : 'rest', position, direction: position === catHome ? 1 : -1, progress: 1 };
}

export function guideCat(from: Point, fromTime: number, now: number, compact: boolean): CatFrame {
  const p = clamp((now - fromTime) / 3200, 0, 1);
  const result = catAlong(from, compact ? [.493, .748] : [.403, .738], p, p === 1 ? 'watch' : 'guide');
  return result;
}

export type SceneFrame = {
  clock: number; px: number; py: number;
  layout: Layout; core: Point; floor: Point; impulse: number; energy: number; life: LifePhase;
};
