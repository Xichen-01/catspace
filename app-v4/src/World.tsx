import { useEffect, useRef, type CSSProperties, type PointerEvent, type ReactNode } from 'react';
import { asset, zones, type ZoneId } from './content';
import Icon, { type Glyph } from './icons';
import {
  catHome, clamp, ease, framing, guideCat, layoutFor, lifeStyles, mix, neutral, plane, poseAt,
  project, resident, shotFor, timing, zoneOrder, type Layout, type Life, type Point, type SceneFrame
} from './motion';

export type Route = { mode: 'browse' | 'explore'; zone: ZoneId; focused: boolean };
export const zoneIcons: Record<ZoneId, Glyph> = { core: 'spark', archive: 'archive', laboratory: 'lab', constellation: 'stars', unknown: 'signal' };
type WorldProps = {
  route: Route; life: Life; reduced: boolean; guide: boolean;
  onApproach: (near: boolean) => void; onArrival: (zone: ZoneId) => void;
  onFocus: (zone: ZoneId) => void; onWake: () => void; onCat: () => void; children: ReactNode;
};

const corePoint: Point = [.554, .384];
const floorPoint: Point = [.555, .71];
const layerDepths = { sky: .48, planet: .54, hall: .93, gallery: 1.16, rim: 1.64 } as const;
const lamps = [[.262, .534], [.469, .587], [.738, .562], [.867, .445], [.928, .412]] as const;
function ObservatoryPlate({ priority }: { priority?: 'high' }) {
  return <picture><source media="(max-width: 740px)" srcSet={asset('observatory-compact.webp')} />
    <img src={asset('observatory.webp')} fetchPriority={priority} alt="" />
  </picture>;
}
const skyLights = [[.417,.091],[.524,.116],[.582,.216],[.652,.083],[.696,.165],[.747,.117],[.883,.041]] as const;

export default function World(props: WorldProps) {
  const { route, life, reduced, guide, onFocus, onWake, onCat, children } = props;
  const current = useRef(props);
  current.current = props;
  const root = useRef<HTMLElement>(null);
  const canvasHost = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0, look: 0, touch: 0 });
  const drag = useRef<{ id: number; x: number; y: number; horizontal: boolean } | null>(null);
  const lastSwipe = useRef(-Infinity);
  const touchCore = useRef<number | null>(null);
  const queueResize = useRef<(() => void) | null>(null);
  const scene = useRef<SceneFrame>({
    clock: 0, px: 0, py: 0, core: [0, 0], floor: [0, 0],
    layout: layoutFor(1, 1), energy: 0, impulse: 0, life: 'dormant'
  });
  const profile = lifeStyles[life.phase];
  const active = route.mode === 'explore';

  useEffect(() => {
    if (!active || reduced || !root.current) return;
    const stage = root.current;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    if (memory && memory <= 2) return;
    const host = canvasHost.current;
    if (!host || new URLSearchParams(location.search).has('still')) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;
    const delay = window.setTimeout(async () => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('webgl2', { alpha: true, antialias: false, powerPreference: 'low-power' });
      if (!context) return;
      try {
        const { mountEffects } = await import('./station');
        if (!disposed) cleanup = await mountEffects(host, context, scene.current, () => current.current.route.mode === 'explore');
        if (disposed) cleanup?.();
      } catch {
        stage.dataset.renderer = 'layers';
      }
    }, 1050);
    return () => { disposed = true; clearTimeout(delay); cleanup?.(); };
  }, [active, reduced]);

  useEffect(() => {
    if (!active || !root.current) return;
    const stage = root.current;
    const layers = [...stage.querySelectorAll<HTMLElement>('[data-plane]')];
    const anchors = [...stage.querySelectorAll<HTMLElement>('[data-anchor]')];
    const nucleus = stage.querySelector<HTMLElement>('.world-nucleus')!;
    const cat = stage.querySelector<HTMLElement>('.resident')!;
    const catControl = stage.querySelector<HTMLElement>('[data-cat-control]')!;
    let layout: Layout = layoutFor(stage.clientWidth || 1, stage.clientHeight || 1);
    let target: ZoneId | null | undefined;
    let base = neutral;
    let from = neutral;
    let destination = neutral;
    let started = 0;
    let arrival = true;
    let duration = timing.fly as number;
    let frameId = 0;
    let last = 0;
    let clock = scene.current.clock;
    let panX = 0;
    let panY = 0;
    let guideAt = -1;
    let guideFrom = catHome;
    let catLast = catHome;
    let returnStart = -1;
    let nextNoticeAt = 0;
    let near = false;

    function resize() {
      const next = layoutFor(stage.clientWidth || 1, stage.clientHeight || 1);
      if (layout.width !== next.width || layout.height !== next.height) {
        layout = next;
        const resolved = target ?? null;
        if (arrival) base = shotFor(resolved, layout);
        destination = shotFor(resolved, layout);
      }
      stage.style.setProperty('--plane-w', `${layout.w}px`);
      stage.style.setProperty('--plane-h', `${layout.h}px`);
    }

    function put(node: HTMLElement, [x, y]: Point) {
      node.style.setProperty('--screen-x', `${x.toFixed(2)}px`);
      node.style.setProperty('--screen-y', `${y.toFixed(2)}px`);
    }

    function update(now: number, force = false) {
      const value = current.current;
      const step = last ? Math.max(0, now - last) : 16;
      if (!force && document.hidden) {
        last = now;
        return;
      }
      if (!force && layout.compact && step < 28) return;
      last = now;
      const elapsed = Math.min(step, 64);
      const still = value.reduced;
      if (!still) clock += step * .001;
      const destinationZone = value.route.focused ? value.route.zone : null;
      if (destinationZone !== target) {
        from = base;
        target = destinationZone;
        destination = shotFor(target, layout);
        duration = target ? timing.fly : timing.return;
        started = now;
        arrival = false;
        stage.dataset.flight = 'moving';
      }
      const fraction = still ? 1 : clamp((now - started) / duration, 0, 1);
      base = poseAt(from, destination, fraction, target ? framing[target].curve : -.018);
      if (!arrival && fraction >= timing.contactAt) {
        arrival = true;
        stage.dataset.flight = 'arrived';
        if (target) value.onArrival(target);
      }
      stage.style.setProperty('--flight', `${Math.round(ease(fraction) * 100)}%`);

      const damp = still ? 1 : 1 - Math.exp(-elapsed / 150);
      const input = pointer.current;
      panX = mix(panX, still ? 0 : input.x * (layout.compact ? 0 : .013) + input.touch, damp);
      panY = mix(panY, still ? 0 : input.y * -.013, damp);
      const breathing = still ? 0 : Math.sin(clock * .44) * .0025;
      const pose = { x: base.x + panX, y: base.y + panY, zoom: base.zoom + (still ? 0 : .009) + breathing, roll: base.roll + panX * 5 };
      const point = project(corePoint, .78, pose, layout);
      const floor = project(floorPoint, 1.09, pose, layout);
      const coreProfile = lifeStyles[value.life.phase];
      const age = now - value.life.since;
      const crest = value.life.phase === 'awakening' || value.life.phase === 'resonance';
      const impulse = crest && !still ? Math.sin(Math.PI * clamp(age / 1740, 0, 1)) : 0;
      const energy = coreProfile.flow;
      const pointerNear = input.look > .5 && Math.hypot((input.x * .5 + .5) * layout.width - point[0], (input.y * .5 + .5) * layout.height - point[1]) < clamp(layout.height * .22, 100, 205);
      if (pointerNear !== near && now >= nextNoticeAt) {
        near = pointerNear;
        nextNoticeAt = now + 135;
        value.onApproach(near);
      }

      for (const layer of layers) {
        const name = layer.dataset.plane as keyof typeof layerDepths;
        const depth = layerDepths[name];
        const local = name === 'planet' && !still ? { ...pose, x: pose.x + Math.sin(clock * .109) * .006, y: pose.y + Math.sin(clock * .073) * .005 } : pose;
        const view = plane(depth, local, layout);
        layer.style.transform = `translate3d(${view.x.toFixed(2)}px,${view.y.toFixed(2)}px,0) rotate(${view.roll.toFixed(3)}deg) scale(${view.scale.toFixed(4)})`;
      }

      const closeFocus = target === 'core' ? fraction : 0;
      put(nucleus, point);
      nucleus.style.setProperty('--core-size', `${Math.min(layout.width * (layout.compact ? .75 : .355), layout.height * (layout.compact ? .40 : .54)) * (1 + pose.zoom * .78)}px`);
      nucleus.style.setProperty('--reaction-x', `${(near ? input.x * 12 : 0).toFixed(1)}deg`);
      nucleus.style.setProperty('--reaction-y', `${(near ? -input.y * 9 : 0).toFixed(1)}deg`);
      nucleus.style.setProperty('--impulse', impulse.toFixed(3));
      nucleus.style.setProperty('--focus-core', closeFocus.toFixed(2));
      stage.style.setProperty('--core-x', `${point[0].toFixed(2)}px`);
      stage.style.setProperty('--core-y', `${point[1].toFixed(2)}px`);
      stage.style.setProperty('--floor-x', `${floor[0].toFixed(2)}px`);
      stage.style.setProperty('--floor-y', `${floor[1].toFixed(2)}px`);
      stage.style.setProperty('--echo', impulse.toFixed(3));

      if (value.guide && guideAt < 0) {
        guideAt = now;
        guideFrom = catLast;
        returnStart = -1;
      }
      if (!value.guide && guideAt >= 0) {
        guideAt = -1;
        guideFrom = catLast;
        returnStart = now;
      }
      let residentFrame = resident(clock, value.life.phase);
      if (value.guide) residentFrame = guideCat(guideFrom, guideAt, still ? guideAt + 3200 : now, layout.compact);
      else if (returnStart >= 0) {
        const progress = still ? 1 : clamp((now - returnStart - 1700) / 3200, 0, 1);
        const destination = residentFrame.position;
        residentFrame = { ...residentFrame, position: [mix(guideFrom[0], destination[0], ease(progress)), mix(guideFrom[1], destination[1], ease(progress))], phase: progress < .01 ? 'watch' : progress < 1 ? 'walk' : residentFrame.phase };
        if (progress >= 1) returnStart = -1;
      } else if (still) residentFrame = { phase: 'rest', position: catHome, direction: 1, progress: 1 };

      catLast = residentFrame.position;
      const footprints = project(catLast, 1.22, pose, layout);
      put(cat, footprints);
      put(catControl, footprints);
      cat.dataset.behavior = residentFrame.phase;
      cat.style.setProperty('--direction', String(residentFrame.direction));
      const onscreen = footprints[0] > 22 && footprints[0] < layout.width - 22;
      catControl.toggleAttribute('data-offscreen', !onscreen);
      catControl.tabIndex = onscreen ? 0 : -1;

      for (const anchor of anchors) {
        const id = anchor.dataset.anchor;
        if (id === 'core-label') {
          const widthBias = layout.compact ? .20 : .100;
          put(anchor, [clamp(point[0] + layout.width * widthBias, 92, layout.width - 72), point[1] + layout.height * (layout.compact ? .132 : .11)]);
        } else if (id === 'core-hit') put(anchor, point);
        else if (id?.startsWith('lamp-')) put(anchor, project(lamps[Number(id.slice(5))], 1.01, pose, layout));
        else if (id?.startsWith('star-')) put(anchor, project(skyLights[Number(id.slice(5))], .50, pose, layout));
        else {
          const zone = zones.find(z => z.id === id);
          if (!zone) continue;
          const anchorPoint = project(zone.marker, 1.03, pose, layout);
          put(anchor, anchorPoint);
          const visible = anchorPoint[0] > 78 && anchorPoint[0] < layout.width - 78;
          anchor.toggleAttribute('data-offscreen', !visible);
          if (anchor instanceof HTMLButtonElement) anchor.tabIndex = visible ? 0 : -1;
        }
      }
      const anchorZone = target && zones.find(zone => zone.id === target);
      if (anchorZone) {
        const f = project(anchorZone.marker, 1.04, pose, layout);
        stage.style.setProperty('--destination-x', `${clamp(f[0], 40, layout.width - 40)}px`);
        stage.style.setProperty('--destination-y', `${clamp(f[1], 100, layout.height - 145)}px`);
      }
      Object.assign(scene.current, { clock, px: panX, py: panY, layout, core: point, floor, impulse, energy, life: value.life.phase });
    }

    function animate(now: number) {
      update(now);
      if (!current.current.reduced) frameId = requestAnimationFrame(animate);
    }
    function render() {
      resize();
      if (current.current.reduced) update(performance.now(), true);
    }
    const observer = new ResizeObserver(render);
    const resumeClock = () => { last = performance.now(); };
    observer.observe(stage);
    document.addEventListener('visibilitychange', resumeClock);
    queueResize.current = render;
    resize();
    update(performance.now(), true);
    if (!reduced) frameId = requestAnimationFrame(animate);
    return () => {
      queueResize.current = null;
      observer.disconnect();
      document.removeEventListener('visibilitychange', resumeClock);
      cancelAnimationFrame(frameId);
    };
  }, [active, reduced]);

  useEffect(() => { if (reduced) queueResize.current?.(); }, [route.zone, route.focused, life.phase, reduced, guide]);

  function move(event: PointerEvent<HTMLElement>) {
    const stage = event.currentTarget;
    const bounds = stage.getBoundingClientRect();
    const input = pointer.current;
    if (event.pointerType !== 'touch') {
      input.x = clamp((event.clientX - bounds.left) / bounds.width * 2 - 1, -1, 1);
      input.y = clamp((event.clientY - bounds.top) / bounds.height * 2 - 1, -1, 1);
      input.look = event.target instanceof Element && !event.target.closest('aside,.station-footer,.intro-actions,.guide-strip') ? 1 : 0;
    }
    const gesture = drag.current;
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
    if (!gesture.horizontal && Math.abs(dx) > 16 && Math.abs(dx) > Math.abs(dy) * 1.42) {
      gesture.horizontal = true;
      stage.setPointerCapture(event.pointerId);
    }
    if (gesture.horizontal) input.touch = clamp(dx / bounds.width * .075, -.05, .05);
  }

  function press(event: PointerEvent<HTMLElement>) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (event.pointerType === 'touch' && target.closest('.life-hit,.marker--core')) {
      touchCore.current = event.pointerId;
      props.onApproach(true);
    }
    if (event.currentTarget.clientWidth >= 740 ||
        target.closest('aside,a,.dock,.intro-actions,.guide-strip') ||
        (target.closest('button') && !target.closest('.life-hit'))) return;
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, horizontal: false };
  }

  function release(event: PointerEvent<HTMLElement>) {
    if (touchCore.current === event.pointerId) {
      touchCore.current = null;
      props.onApproach(false);
    }
    const gesture = drag.current;
    if (!gesture || gesture.id !== event.pointerId) return;
    drag.current = null;
    pointer.current.touch = 0;
    if (!gesture.horizontal || event.type === 'pointercancel') return;
    lastSwipe.current = performance.now();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    const dx = event.clientX - gesture.x;
    if (Math.abs(dx) < 52) return;
    const index = zoneOrder.indexOf(route.focused ? route.zone : 'core');
    const nextIndex = clamp(index + (dx < 0 ? 1 : -1), 0, zoneOrder.length - 1);
    if (nextIndex !== index) onFocus(zoneOrder[nextIndex]);
  }

  return <main id="explore-main" className={`station station-v4 ${route.focused ? 'station--focused' : ''}`} ref={root}
    data-zone={route.zone} data-life={life.phase} data-guide={guide ? 'on' : undefined} data-reduced={reduced ? 'true' : undefined}
    onPointerDown={press} onPointerMove={move} onPointerUp={release} onPointerCancel={release}
    onPointerLeave={() => { pointer.current.x = 0; pointer.current.y = 0; pointer.current.look = 0; if (!drag.current?.horizontal) drag.current = null; props.onApproach(false); }}
    onClickCapture={event => { if (performance.now() - lastSwipe.current < 350 && event.target instanceof Element && event.target.closest('.life-hit')) { event.preventDefault(); event.stopPropagation(); } }}>
    <div className="world-layers" aria-hidden="true">
      <div className="world-matte world-sky" data-plane="sky"><ObservatoryPlate priority="high" /></div>
      <div className="world-matte world-planet" data-plane="planet"><ObservatoryPlate /></div>
      <div className="world-matte world-hall" data-plane="hall"><ObservatoryPlate /></div>
      <div className="world-matte world-gallery" data-plane="gallery"><ObservatoryPlate /></div>
      <div className="world-matte world-rim" data-plane="rim"><ObservatoryPlate /></div>
    </div>
    <div className="environment" aria-hidden="true">
      {skyLights.map((_, index) => <i className="sky-glint" data-anchor={`star-${index}`} style={{ '--stagger': index * -1.69 } as CSSProperties} key={index} />)}
      {lamps.map((_, index) => <i className="hall-lamp" data-anchor={`lamp-${index}`} style={{ '--stagger': index * -1.40 } as CSSProperties} key={index} />)}
      <span className="floor-light" /><span className="station-sweep" /><span className="wake-wave" /><span className="wake-wave wake-wave--echo" />
      <span className="dust-group"><i /><i /><i /><i /><i /></span>
    </div>
    <div className="world-nucleus" aria-hidden="true" style={{
      '--life-lum': profile.lum, '--life-span': profile.span, '--life-roll': `${profile.roll}deg`,
      '--life-tilt': `${profile.tilt}deg`, '--life-tint': `${profile.tint}deg`, '--life-flow': profile.flow,
      '--life-breath': profile.breath, '--nucleus-mask': `url("${asset('nucleus.webp')}")`
    } as CSSProperties}>
      <div className="core-halo" />
      <div className="core-membrane">
        <div className="core-breath"><img src={asset('nucleus.webp')} alt="" width="760" height="694" fetchPriority="high" /><i /></div>
      </div>
      <span className="core-orbit" /><span className="core-orbit core-orbit--cross" />
    </div>
    <div ref={canvasHost} className="station-canvas" aria-hidden="true" />
    <div className="resident" aria-hidden="true">
      <span className="resident-shadow" />
      <span className="resident-figure"><i className="resident-tail" /><i className="resident-body" /><i className="resident-chest" /><i className="resident-head" /><i className="resident-paw" /><i className="resident-paw resident-paw--rear" /><i className="resident-eye" /></span>
    </div>
    <div className="station-grade" />
    <div className="station-markers">
      {zones.filter(zone => zone.id !== 'core').map(zone => <button key={zone.id} type="button" className={`marker marker--${zone.id}`} data-anchor={zone.id}
        aria-label={`聚焦${zone.zh}`} onClick={() => onFocus(zone.id)}>
        <span className="marker-line" aria-hidden="true"><i /><b /></span>
        <span className="marker-body"><Icon name={zoneIcons[zone.id]} /><span><strong>{zone.zh}</strong><small>{zone.en}</small></span></span>
      </button>)}
      <button className="life-hit" data-anchor="core-hit" aria-label="唤醒数字生命" onClick={onWake}
        onFocus={() => props.onApproach(true)} onBlur={() => props.onApproach(false)} />
      <button className="marker marker--core" data-anchor="core-label" onClick={onWake} aria-label="感应数字生命" aria-describedby="core-phase">
        <span className="marker-line" aria-hidden="true"><i /><b /></span>
        <span className="marker-body"><Icon name="spark" /><span><strong>Nucleus</strong><small id="core-phase">{lifeStyles[life.phase].label}</small></span></span>
      </button>
      <button className="cat-hit" data-cat-control aria-label={guide ? '跟随值班猫' : '与观测站的小黑猫互动'} onClick={onCat}><span>{guide ? '跟上我' : '值班猫'}</span></button>
    </div>
    {children}
  </main>;
}
