export const nucleusVertex = /* glsl */`
  uniform float uTime, uWake, uFlow, uTone;
  uniform vec2 uPointer;
  varying vec3 vNormalW, vWorld, vShape;
  varying vec2 vUV;
  void main() {
    vUV = uv;
    vShape = position;
    float flow = sin(uv.x * 18.85 + uTime * .68 + uv.y * 3.6);
    float breath = sin(uTime * (0.56 + uFlow * 0.69)) * (.013 + uFlow * .011);
    vec3 p = position * (1.0 + breath + .022 * flow);
    p += normal * (.027 + uWake * .068) * sin(uv.x * 31.42 - uTime * 2.0) * sin(uv.y * 6.28 + uTime);
    p.x += uPointer.x * .028 * sin(p.y * 2.8 + uTime);
    vec4 world = modelMatrix * vec4(p, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const nucleusFragment = /* glsl */`
  uniform float uTime, uWake, uFlow, uTone;
  uniform sampler2D uPlate;
  uniform vec2 uResolution, uImageScale, uImageOffset;
  varying vec3 vWorld, vNormalW, vShape;
  varying vec2 vUV;

  vec3 film(float phase) {
    return .56 + .44 * cos(6.28318 * (phase + vec3(.02,.24,.48)));
  }

  float glint(vec3 n, vec3 h, float shine) {
    return pow(max(0., dot(n, h)), shine);
  }

  void main() {
    vec3 viewer = normalize(cameraPosition - vWorld);
    vec3 n = normalize(vNormalW) * (gl_FrontFacing ? 1.0 : -1.0);
    float incidence = clamp(dot(n, viewer), 0., 1.);
    float rim = pow(1. - incidence, 2.75);
    vec2 screen = gl_FragCoord.xy / uResolution;
    vec2 warp = n.xy * (.042 + .044 * rim);
    vec2 baseUV = screen * uImageScale + uImageOffset;
    vec3 transmission = vec3(
      texture2D(uPlate, clamp(baseUV + warp * 1.10, .005, .995)).r,
      texture2D(uPlate, clamp(baseUV + warp * .81, .005, .995)).g,
      texture2D(uPlate, clamp(baseUV + warp * .56, .005, .995)).b
    );
    float fold = sin(vUV.x * 31.4159 + 3.0 * sin(vUV.y * 6.283) - uTime * .49);
    float stream = pow(.5 + .5 * sin(vUV.x * 43.982 - vUV.y * 18.85 - uTime * 1.3 + fold * .8), 15.);
    vec3 spectral = film(incidence * .78 + fold * .13 + vShape.y * .08 + uTime * .06 + uTone);
    vec3 cold = vec3(.38, .50, 1.0);
    vec3 lilac = vec3(.72, .55, .97);
    vec3 pink = vec3(1.0, .45, .74);
    float key = glint(n, normalize(viewer + vec3(-.63,.62,.31)), 22.);
    float blue = glint(n, normalize(viewer + vec3(.64,.05,.29)), 18.);
    float floor = glint(n, normalize(viewer + vec3(.11,-.91,.33)), 27.);
    float fine = pow(max(0., 1. - abs(n.y - .18 - .12 * fold)), 24.);
    vec3 reflected = spectral * (.36 * fine + .38 * rim)
      + key * vec3(.87,.91,1.0) * 1.45
      + blue * cold * .80 + floor * pink * 1.18;
    float energy = stream * (.09 + uWake * .48) * (.45 + .55 * rim);
    vec3 color = transmission * 1.28 + reflected + energy * mix(lilac, vec3(.54,.92,1.), spectral.b);
    color += vec3(.08,.10,.21) * rim + uWake * rim * vec3(.29,.18,.42);
    float alpha = .25 + rim * .61 + key * .34 + blue * .13 + floor * .23 + energy;
    gl_FragColor = vec4(color, min(.96, alpha) * (.025 + uFlow * .048 + uWake * .27));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
