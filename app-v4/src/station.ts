import * as THREE from 'three';
import { asset } from './content';
import { lifeStyles, type SceneFrame } from './motion';
import { nucleusFragment, nucleusVertex } from './shaders';

function ribbon(winding: number, offset: number, minor: number) {
  const geometry = new THREE.PlaneGeometry(1, 1, 220, 48);
  const positions = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < positions.count; i++) {
    const a = uv.getX(i) * Math.PI * 2;
    const b = uv.getY(i) * Math.PI * 2;
    const theta = a * winding + offset;
    const radius = .93 + Math.cos(a * 3 + 1.22 + offset) * .32 + Math.sin(a * 2 + offset) * .15;
    const twist = a * 2 + Math.sin(a * 3 + offset) * .66;
    const width = minor * (.83 + .41 * Math.sin(a * 3 + .8 + offset));
    const spread = Math.cos(b) * width;
    const thickness = Math.sin(b) * (.12 + width * .26);
    const dr = Math.cos(twist) * spread - Math.sin(twist) * thickness;
    const dz = Math.sin(twist) * spread + Math.cos(twist) * thickness;
    const z = Math.sin(a * 3 + offset) * .42 + Math.sin(a + offset) * .17;
    positions.setXYZ(i,
      (radius + dr) * Math.cos(theta) * 1.12 + .13 * Math.cos(a * 3),
      (radius + dr) * Math.sin(theta) * 1.14,
      z + dz
    );
  }
  geometry.computeVertexNormals();
  const normal = geometry.attributes.normal;
  const across = 221;
  const rows = 49;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  function weld(i: number, j: number) {
    a.fromBufferAttribute(normal, i).add(b.fromBufferAttribute(normal, j)).normalize();
    normal.setXYZ(i, a.x, a.y, a.z);
    normal.setXYZ(j, a.x, a.y, a.z);
  }
  for (let y = 0; y < rows; y++) weld(y * across, y * across + across - 1);
  for (let x = 0; x < across; x++) weld(x, x + across * (rows - 1));
  return geometry;
}

export async function mountEffects(
  host: HTMLElement, context: WebGL2RenderingContext, state: SceneFrame, visible: () => boolean
) {
  const texture = host.clientWidth < 740 ? 'observatory-compact.webp' : 'observatory.webp';
  const image = await new THREE.TextureLoader().loadAsync(asset(texture));
  image.colorSpace = THREE.SRGBColorSpace;
  const renderer = new THREE.WebGLRenderer({ canvas: context.canvas as HTMLCanvasElement, context, alpha: true, antialias: false });
  renderer.setClearColor(0x000000, 0);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 1000);
  camera.position.z = 180;
  const scene = new THREE.Scene();
  const uniforms = {
    uTime: { value: 0 }, uWake: { value: 0 }, uPlate: { value: image },
    uFlow: { value: 0 }, uTone: { value: 0 },
    uPointer: { value: new THREE.Vector2() }, uResolution: { value: new THREE.Vector2(1, 1) },
    uImageScale: { value: new THREE.Vector2(1, 1) }, uImageOffset: { value: new THREE.Vector2() }
  };
  const iridescent = new THREE.ShaderMaterial({
    uniforms, vertexShader: nucleusVertex, fragmentShader: nucleusFragment, transparent: true,
    depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true
  });
  const primary = new THREE.Mesh(ribbon(1, .64, .68), iridescent);
  primary.rotation.set(.67, -.46, .26);
  primary.scale.set(1.22, 1.26, 1.09);
  const secondary = new THREE.Mesh(ribbon(2, 1.84, .40), iridescent);
  secondary.rotation.set(-.48, .82, -.40);
  secondary.scale.set(.94, .86, .94);
  const core = new THREE.Group();
  core.add(primary, secondary);
  scene.add(core);

  const foil = new THREE.Group();
  const foilMaterial = new THREE.MeshBasicMaterial({
    color: 0xc7b6fb, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending, opacity: 0
  });
  const foilGeometry = new THREE.RingGeometry(.954, 1.0, 100);
  for (const angle of [.35, -.91]) {
    const ring = new THREE.Mesh(foilGeometry, foilMaterial);
    ring.scale.set(2.25, .81, 1);
    ring.rotation.set(.24, .51, angle);
    foil.add(ring);
  }
  core.add(foil);

  let width = 0;
  let height = 0;
  let frame = 0;
  let previous = 0;
  let lost = false;
  const surface = renderer.domElement;
  const stage = host.closest<HTMLElement>('.station');
  function size() {
    width = Math.max(host.clientWidth, 1);
    height = Math.max(host.clientHeight, 1);
    renderer.setPixelRatio(Math.min(devicePixelRatio, width < 740 ? 1.06 : 1.26));
    renderer.setSize(width, height);
    renderer.getDrawingBufferSize(uniforms.uResolution.value);
    camera.left = -width * .5;
    camera.right = width * .5;
    camera.top = height * .5;
    camera.bottom = -height * .5;
    camera.updateProjectionMatrix();
  }
  function draw(now: number) {
    frame = requestAnimationFrame(draw);
    const step = now - previous;
    if (document.hidden || !visible() || step < (width < 740 ? 36 : 20)) return;
    previous = now;
    const x = state.core[0] - width * .5;
    const y = height * .5 - state.core[1];
    const profile = lifeStyles[state.life];
    const flow = state.energy;
    const pulse = state.impulse;
    const body = Math.min(width * (width < 740 ? .75 : .355), height * (width < 740 ? .40 : .54));
    const scale = body * .18 * profile.span;
    const t = state.clock;
    core.position.set(x, y + Math.sin(t * 1.24) * 5, 0);
    core.scale.setScalar(scale);
    core.rotation.set(Math.sin(t * .48) * .19, state.px * 5 + Math.sin(t * .36) * .22, profile.roll * .028 + Math.sin(t * .35) * .055);
    foil.rotation.z = t * .21 + pulse * .45;
    foilMaterial.opacity = .037 * flow + pulse * .14;
    uniforms.uTime.value = t;
    uniforms.uWake.value = pulse;
    uniforms.uFlow.value = flow;
    uniforms.uTone.value = profile.tint * .008;
    uniforms.uPointer.value.set(state.px * 30, state.py * 30);
    uniforms.uImageScale.value.set(width / state.layout.w, height / state.layout.h);
    uniforms.uImageOffset.value.set(-state.layout.left / state.layout.w, -state.layout.top / state.layout.h);
    renderer.render(scene, camera);
  }
  function contextLost(event: Event) {
    event.preventDefault();
    lost = true;
    if (stage) stage.dataset.renderer = 'layers';
    surface.hidden = true;
    cancelAnimationFrame(frame);
  }
  function contextRestored() {
    if (!lost) return;
    lost = false;
    surface.hidden = false;
    if (stage) stage.dataset.renderer = 'layered-webgl';
    frame = requestAnimationFrame(draw);
  }
  const observer = new ResizeObserver(size);
  host.append(surface);
  surface.addEventListener('webglcontextlost', contextLost);
  surface.addEventListener('webglcontextrestored', contextRestored);
  observer.observe(host);
  size();
  if (stage) stage.dataset.renderer = 'layered-webgl';
  frame = requestAnimationFrame(draw);
  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    surface.removeEventListener('webglcontextlost', contextLost);
    surface.removeEventListener('webglcontextrestored', contextRestored);
    primary.geometry.dispose();
    secondary.geometry.dispose();
    iridescent.dispose();
    foilGeometry.dispose();
    foilMaterial.dispose();
    image.dispose();
    renderer.dispose();
    surface.remove();
    if (stage) stage.dataset.renderer = 'layers';
  };
}
