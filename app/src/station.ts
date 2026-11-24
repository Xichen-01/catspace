import * as THREE from 'three';
import { asset, getZone, zones, type ZoneId } from './content';
import { nucleusFragment, nucleusVertex } from './shaders';

export type StationState = { mode: 'browse' | 'explore'; zone: ZoneId; focused: boolean; wake: number; reduced: boolean };
type StateReader = () => StationState;

const aspect = 16 / 9;
const fov = 53;
const halfHeight = Math.tan(THREE.MathUtils.degToRad(fov / 2));
const shaderVec = (x: number, y: number) => ({ value: new THREE.Vector2(x, y) });
const at = (x: number, y: number, depth: number) => new THREE.Vector3(
  (x * 2 - 1) * halfHeight * aspect * depth,
  (1 - y * 2) * halfHeight * depth, -depth
);

function plateDepth(x: number, y: number) {
  const center = Math.max(0, 1 - Math.abs(x - .55) / .55);
  const floor = Math.pow(THREE.MathUtils.smoothstep(y, .58, 1), .67);
  const roof = (1 - THREE.MathUtils.smoothstep(x, .13, .40)) * (1 - THREE.MathUtils.smoothstep(y, .16, .57));
  const outer = Math.pow(1 - center, 1.55);
  return 34 - outer * 13 - floor * (19 - outer * 3) - roof * 8;
}

function projectedHall(texture: THREE.Texture) {
  const geometry = new THREE.PlaneGeometry(1, 1, 104, 64);
  const position = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < position.count; i++) {
    const x = uv.getX(i);
    const y = 1 - uv.getY(i);
    const point = at(x, y, plateDepth(x, y));
    position.setXYZ(i, point.x, point.y, point.z);
  }
  geometry.computeBoundingSphere();
  return new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }));
}

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

function glassMembrane(image: THREE.Texture, time: { value: number }, wake: { value: number }) {
  const geometry = new THREE.PlaneGeometry(6.35, 5.80, 76, 68);
  const material = new THREE.ShaderMaterial({
    uniforms: { uImage: { value: image }, uTime: time, uWake: wake },
    vertexShader: /* glsl */`
      uniform float uTime, uWake;
      varying vec2 vUV;
      void main() {
        vUV = uv;
        vec3 p = position;
        float shape = sin(uv.x * 7.1 + uv.y * 5.5 - uTime * .39);
        p.z += .63 * (1.0 - dot(uv - .5, uv - .5) * 4.0) + .21 * shape;
        p.x += (.049 + uWake * .14) * sin(p.y * 1.55 - uTime * .88);
        p.y += (.056 + uWake * .16) * sin(p.x * 1.43 + uTime * .64);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uImage;
      uniform float uTime, uWake;
      varying vec2 vUV;
      void main() {
        vec4 glass = texture2D(uImage, vUV);
        if (glass.a < .012) discard;
        float tide = sin(vUV.x * 9.0 - vUV.y * 14.0 - uTime * .95);
        float ion = pow(max(tide, 0.), 8.0);
        vec3 tint = mix(vec3(.76,.61,1.), vec3(.64,.87,1.), tide * .5 + .5);
        glass.rgb = glass.rgb * (.87 + .12 * ion) + tint * ion * (.09 + uWake * .38);
        gl_FragColor = glass;
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false
  });
  const membrane = new THREE.Mesh(geometry, material);
  membrane.renderOrder = 1;
  return membrane;
}

function paths() {
  const orbits = new THREE.Group();
  const specs = [
    { rx: 2.39, ry: .76, angle: -.24, x: .99, y: .2, color: 0xa7b6ff },
    { rx: 2.21, ry: 1.47, angle: .86, x: -.51, y: .76, color: 0xf1d8ff },
    { rx: 2.24, ry: .72, angle: -.85, x: -.22, y: -.34, color: 0xcab8ff }
  ];
  const sparks: Array<{ point: THREE.Sprite; index: number; radius: [number, number] }> = [];
  const spriteCanvas = document.createElement('canvas');
  spriteCanvas.width = 64;
  spriteCanvas.height = 64;
  const context = spriteCanvas.getContext('2d')!;
  const glow = context.createRadialGradient(32, 32, 0, 32, 32, 32);
  glow.addColorStop(0, 'white');
  glow.addColorStop(.13, 'rgba(241,228,255,.91)');
  glow.addColorStop(.37, 'rgba(156,162,255,.20)');
  glow.addColorStop(1, 'rgba(144,128,241,0)');
  context.fillStyle = glow;
  context.fillRect(0, 0, 64, 64);
  const spriteTexture = new THREE.CanvasTexture(spriteCanvas);
  specs.forEach((spec, index) => {
    const orbit = new THREE.Group();
    orbit.rotation.set(spec.x, spec.y, spec.angle);
    const points = Array.from({ length: 181 }, (_, step) => {
      const a = step / 180 * Math.PI * 2;
      return new THREE.Vector3(Math.cos(a) * spec.rx, Math.sin(a) * spec.ry, 0);
    });
    const colors = points.flatMap((_, step) => {
      const a = step / 180 * Math.PI * 2;
      const power = .14 + .63 * Math.pow(.5 + .5 * Math.cos(a * 2 + index), 6);
      const found = new THREE.Color(spec.color).multiplyScalar(power);
      return [found.r, found.g, found.b];
    });
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true, opacity: .38, blending: THREE.AdditiveBlending, depthWrite: false
    }));
    orbit.add(line);
    const point = new THREE.Sprite(new THREE.SpriteMaterial({
      map: spriteTexture, color: spec.color, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false
    }));
    point.scale.setScalar(.30);
    orbit.add(point);
    orbits.add(orbit);
    sparks.push({ point, index, radius: [spec.rx, spec.ry] });
  });
  return { orbits, sparks };
}

function catModel() {
  const cat = new THREE.Group();
  const material = new THREE.MeshPhongMaterial({ color: 0x101019, emissive: 0x090812, shininess: 38 });
  const sphere = new THREE.SphereGeometry(1, 20, 12);
  function shape(position: [number, number, number], scale: [number, number, number], angle = 0) {
    const mesh = new THREE.Mesh(sphere, material);
    mesh.position.set(...position);
    mesh.scale.set(...scale);
    mesh.rotation.z = angle;
    cat.add(mesh);
  }
  shape([-.04, .19, 0], [.155, .234, .104], -.23);
  shape([.025, .31, 0], [.093, .153, .088], -.32);
  shape([.069, .432, .004], [.098, .094, .084], -.15);
  shape([.107, .398, .002], [.064, .044, .067]);
  shape([.055, .08, .046], [.033, .094, .031], -.12);
  shape([.084, .036, .043], [.059, .03, .037]);
  for (const [x, z, angle] of [[.023, -.037, .2], [.097, .038, -.23]]) {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(.047, .105, 5), material);
    ear.position.set(x, .511, z);
    ear.rotation.z = angle;
    cat.add(ear);
  }
  const tail = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-.14,.07,0), new THREE.Vector3(-.25,.036,.011), new THREE.Vector3(-.38,.033,.026),
    new THREE.Vector3(-.48,.044,.063), new THREE.Vector3(-.49,.065,.09)
  ]);
  cat.add(new THREE.Mesh(new THREE.TubeGeometry(tail, 30, .023, 8), material));
  return cat;
}

export async function mountStation(host: HTMLElement, context: WebGL2RenderingContext, state: StateReader) {
  const loader = new THREE.TextureLoader();
  const [plate, nucleusImage] = await Promise.all([
    loader.loadAsync(asset('observatory.webp')),
    loader.loadAsync(asset('nucleus.webp'))
  ]);
  plate.colorSpace = THREE.SRGBColorSpace;
  nucleusImage.colorSpace = THREE.SRGBColorSpace;
  const renderer = new THREE.WebGLRenderer({
    canvas: context.canvas as HTMLCanvasElement, context, alpha: true, antialias: false
  });
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, aspect, .1, 100);
  const hall = projectedHall(plate);
  plate.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  scene.add(hall);

  const core = new THREE.Group();
  const corePoint = at(.555, .385, 13);
  core.position.copy(corePoint);
  scene.add(core);
  const uniforms = {
    uTime: { value: 0 }, uWake: { value: 0 }, uPlate: { value: plate }, uPointer: shaderVec(0, 0),
    uResolution: shaderVec(1, 1), uImageScale: shaderVec(1, 1), uImageOffset: shaderVec(0, 0)
  };
  const material = new THREE.ShaderMaterial({
    uniforms, vertexShader: nucleusVertex, fragmentShader: nucleusFragment,
    transparent: true, side: THREE.DoubleSide, depthWrite: false, forceSinglePass: true
  });
  const membrane = glassMembrane(nucleusImage, uniforms.uTime, uniforms.uWake);
  core.add(membrane);
  const primary = new THREE.Mesh(ribbon(1, .64, .68), material);
  primary.rotation.set(.67, -.46, .26);
  primary.scale.set(1.22, 1.26, 1.09);
  primary.renderOrder = 2;
  core.add(primary);
  const secondary = new THREE.Mesh(ribbon(2, 1.84, .40), material);
  secondary.rotation.set(-.48, .82, -.40);
  secondary.scale.set(.94, .86, .94);
  secondary.renderOrder = 3;
  core.add(secondary);
  const { orbits, sparks } = paths();
  orbits.position.copy(corePoint);
  scene.add(orbits);
  const ring = new THREE.Mesh(new THREE.RingGeometry(.975, 1.0, 128), new THREE.MeshBasicMaterial({
    color: 0xe1c9ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false
  }));
  ring.position.copy(at(.555, .711, 16.3));
  ring.rotation.x = -1.4;
  ring.visible = false;
  scene.add(ring);

  const cat = catModel();
  const catPoint = at(.551, .746, 13.7);
  cat.position.copy(catPoint);
  cat.scale.setScalar(1.12);
  cat.rotation.y = -.56;
  scene.add(cat, new THREE.HemisphereLight(0xadb8ff, 0x282238, .9));
  const catRim = new THREE.DirectionalLight(0xe7dbff, 1.4);
  catRim.position.set(-3, 4, -11);
  scene.add(catRim);

  const markerHost = host.closest<HTMLElement>('.station')!;
  const markers = new Map(zones.map(zone => [zone.id, {
    point: at(zone.marker[0], zone.marker[1], zone.id === 'core' ? 13 : plateDepth(zone.marker[0], zone.marker[1]) - 1),
    element: markerHost.querySelector<HTMLElement>(`[data-marker="${zone.id}"]`)
  }]));
  const catMarker = markerHost.querySelector<HTMLElement>('[data-marker="cat"]');
  const coreMarker = markerHost.querySelector<HTMLElement>('[data-marker="life"]');
  const pointer = new THREE.Vector2();
  const calmPointer = new THREE.Vector2();
  const neutral = new THREE.Vector3(0, 0, -20);
  const aim = neutral.clone();
  const dest = new THREE.Vector3();
  const destAim = new THREE.Vector3();
  const point = new THREE.Vector3();
  const catLabel = new THREE.Vector3(-.04, .30, 0).add(catPoint);
  const start = performance.now();
  let last = start;
  let wakeTime = -Infinity;
  let lastWake = state().wake;
  let frame = 0;
  let width = 1;
  let height = 1;

  function resize() {
    width = host.clientWidth || 1;
    height = host.clientHeight || 1;
    const fullWidth = Math.max(width, height * aspect);
    const fullHeight = fullWidth / aspect;
    const bias = width < 740 ? .59 : .54;
    const offsetX = (fullWidth - width) * bias;
    const offsetY = (fullHeight - height) * .5;
    camera.setViewOffset(fullWidth, fullHeight, offsetX, offsetY, width, height);
    renderer.setPixelRatio(Math.min(devicePixelRatio, width < 740 ? 1.3 : 1.55));
    renderer.setSize(width, height);
    renderer.getDrawingBufferSize(uniforms.uResolution.value);
    uniforms.uImageScale.value.set(width / fullWidth, height / fullHeight);
    uniforms.uImageOffset.value.set(offsetX / fullWidth, offsetY / fullHeight);
  }

  function follow(event: PointerEvent) {
    if (event.pointerType === 'touch') return;
    const rect = host.getBoundingClientRect();
    pointer.set(THREE.MathUtils.clamp((event.clientX - rect.x) / width * 2 - 1, -1, 1),
      THREE.MathUtils.clamp(1 - (event.clientY - rect.y) / height * 2, -1, 1));
  }

  function positionMarker(element: HTMLElement | null, world: THREE.Vector3) {
    if (!element) return;
    point.copy(world).project(camera);
    element.style.setProperty('--mx', `${(point.x + 1) * 50}%`);
    element.style.setProperty('--my', `${(1 - point.y) * 50}%`);
  }

  function draw(now: number) {
    frame = requestAnimationFrame(draw);
    const current = state();
    if (current.mode === 'browse' || document.hidden) {
      last = now;
      return;
    }
    if (last !== start && width < 740 && now - last < 27) return;
    const elapsed = (now - start) / 1000;
    const delta = Math.min((now - last) / 1000, .055);
    last = now;
    const t = current.reduced ? .9 : elapsed;
    if (current.wake !== lastWake) {
      lastWake = current.wake;
      wakeTime = elapsed;
    }
    const pulse = Math.max(0, elapsed - wakeTime);
    const wake = current.reduced ? 0 : (1 - Math.exp(-pulse * 9)) * Math.exp(-pulse * 1.0);
    const lerp = current.reduced ? 1 : 1 - Math.exp(-delta * 3.2);
    calmPointer.lerp(pointer, current.reduced ? 0 : lerp * .67);
    dest.set(0, 0, 0);
    destAim.copy(neutral);
    if (current.focused) {
      const zone = getZone(current.zone);
      if (zone.id === 'core') {
        dest.set(.06, .01, -.8);
        destAim.set(.27, .16, -20);
      } else {
        dest.fromArray(zone.camera);
        const location = at(zone.point[0], zone.point[1], 20);
        destAim.set(location.x * .30, location.y * .18, -19);
      }
    }
    dest.x += calmPointer.x * .23;
    dest.y += calmPointer.y * .13;
    camera.position.lerp(dest, lerp);
    aim.lerp(destAim, lerp);
    camera.lookAt(aim);
    camera.updateMatrixWorld();

    uniforms.uTime.value = t;
    uniforms.uWake.value = wake;
    uniforms.uPointer.value.copy(calmPointer);
    core.position.y = corePoint.y + Math.sin(t * .71) * .066 + wake * .12;
    core.rotation.x = Math.sin(t * .28) * .15 + calmPointer.y * .13;
    core.rotation.y = Math.sin(t * .23) * .24 + calmPointer.x * .21 + wake * .18;
    core.rotation.z = Math.sin(t * .21) * .076 + .04;
    const compactScale = width < 740 ? Math.min(1, width * .76 / (height * .50)) : 1;
    core.scale.setScalar(compactScale * (1 + wake * .064));
    ring.visible = wake > .012;
    ring.material.opacity = wake * .50;
    ring.scale.setScalar(1.1 + (Number.isFinite(pulse) ? Math.min(pulse * 2, 3.4) : 0));
    orbits.rotation.z = Math.sin(t * .17) * .14 + wake * .10;
    orbits.scale.setScalar(compactScale * (1 + wake * .145));
    sparks.forEach(({ point: spark, index, radius }) => {
      const angle = t * (.38 + index * .075) + index * 1.9 + .3;
      spark.position.set(Math.cos(angle) * radius[0], Math.sin(angle) * radius[1], 0);
      spark.scale.setScalar(.23 + wake * .22 + (Math.sin(angle * 2) + 1) * .04);
    });
    for (const marker of markers.values()) positionMarker(marker.element, marker.point);
    positionMarker(catMarker, catLabel);
    positionMarker(coreMarker, core.position);
    renderer.render(scene, camera);
  }

  let lost = false;
  function contextLost(event: Event) {
    event.preventDefault();
    lost = true;
    markerHost.dataset.renderer = 'fallback';
    renderer.domElement.hidden = true;
    cancelAnimationFrame(frame);
  }
  function contextRestored() {
    if (!lost) return;
    lost = false;
    markerHost.dataset.renderer = 'webgl';
    renderer.domElement.hidden = false;
    last = performance.now();
    frame = requestAnimationFrame(draw);
  }

  host.append(renderer.domElement);
  markerHost.dataset.renderer = 'webgl';
  const observer = new ResizeObserver(resize);
  observer.observe(host);
  markerHost.addEventListener('pointermove', follow);
  renderer.domElement.addEventListener('webglcontextlost', contextLost);
  renderer.domElement.addEventListener('webglcontextrestored', contextRestored);
  resize();
  draw(last);
  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    markerHost.removeEventListener('pointermove', follow);
    renderer.domElement.removeEventListener('webglcontextlost', contextLost);
    renderer.domElement.removeEventListener('webglcontextrestored', contextRestored);
    const resources = new Set<THREE.BufferGeometry | THREE.Material | THREE.Texture>([plate, nucleusImage]);
    scene.traverse(object => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Line) resources.add(object.geometry);
      if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Sprite) {
        const mat = object.material as THREE.Material;
        resources.add(mat);
        if (mat instanceof THREE.SpriteMaterial && mat.map) resources.add(mat.map);
      }
    });
    resources.forEach(resource => resource.dispose());
    renderer.dispose();
    renderer.domElement.remove();
  };
}
