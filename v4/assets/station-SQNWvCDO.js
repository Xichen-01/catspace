import{W as q}from"./three-renderer-B8EzjbcX.js";import{a as X,l as Y}from"./index-CiipOtw_.js";import{c4 as Z,S as j,bI as H,c5 as J,ak as K,D as B,g as T,an as I,c6 as C,bJ as Q,bq as $,c7 as ee,au as te,e as E}from"./three-core-DoeP__i_.js";const oe=`
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
`,ae=`
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
`;function G(m,s,o){const d=new te(1,1,220,48),P=d.attributes.position,p=d.attributes.uv;for(let e=0;e<P.count;e++){const t=p.getX(e)*Math.PI*2,w=p.getY(e)*Math.PI*2,g=t*m+s,S=.93+Math.cos(t*3+1.22+s)*.32+Math.sin(t*2+s)*.15,n=t*2+Math.sin(t*3+s)*.66,l=o*(.83+.41*Math.sin(t*3+.8+s)),v=Math.cos(w)*l,W=Math.sin(w)*(.12+l*.26),h=Math.cos(n)*v-Math.sin(n)*W,c=Math.sin(n)*v+Math.cos(n)*W,u=Math.sin(t*3+s)*.42+Math.sin(t+s)*.17;P.setXYZ(e,(S+h)*Math.cos(g)*1.12+.13*Math.cos(t*3),(S+h)*Math.sin(g)*1.14,u+c)}d.computeVertexNormals();const i=d.attributes.normal,r=221,x=49,a=new E,M=new E;function f(e,t){a.fromBufferAttribute(i,e).add(M.fromBufferAttribute(i,t)).normalize(),i.setXYZ(e,a.x,a.y,a.z),i.setXYZ(t,a.x,a.y,a.z)}for(let e=0;e<x;e++)f(e*r,e*r+r-1);for(let e=0;e<r;e++)f(e,e+r*(x-1));return d}async function le(m,s,o,d){const P=m.clientWidth<740?"observatory-compact.webp":"observatory.webp",p=await new Z().loadAsync(X(P));p.colorSpace=j;const i=new q({canvas:s.canvas,context:s,alpha:!0,antialias:!1});i.setClearColor(0,0);const r=new H(-1,1,1,-1,.1,1e3);r.position.z=180;const x=new J,a={uTime:{value:0},uWake:{value:0},uPlate:{value:p},uFlow:{value:0},uTone:{value:0},uPointer:{value:new T},uResolution:{value:new T(1,1)},uImageScale:{value:new T(1,1)},uImageOffset:{value:new T}},M=new K({uniforms:a,vertexShader:oe,fragmentShader:ae,transparent:!0,depthWrite:!1,side:B,forceSinglePass:!0}),f=new I(G(1,.64,.68),M);f.rotation.set(.67,-.46,.26),f.scale.set(1.22,1.26,1.09);const e=new I(G(2,1.84,.4),M);e.rotation.set(-.48,.82,-.4),e.scale.set(.94,.86,.94);const t=new C;t.add(f,e),x.add(t);const w=new C,g=new Q({color:13088507,transparent:!0,depthWrite:!1,side:B,blending:$,opacity:0}),S=new ee(.954,1,100);for(const y of[.35,-.91]){const z=new I(S,g);z.scale.set(2.25,.81,1),z.rotation.set(.24,.51,y),w.add(z)}t.add(w);let n=0,l=0,v=0,W=0,h=!1;const c=i.domElement,u=m.closest(".station");function R(){n=Math.max(m.clientWidth,1),l=Math.max(m.clientHeight,1),i.setPixelRatio(Math.min(devicePixelRatio,n<740?1.06:1.26)),i.setSize(n,l),i.getDrawingBufferSize(a.uResolution.value),r.left=-n*.5,r.right=n*.5,r.top=l*.5,r.bottom=-l*.5,r.updateProjectionMatrix()}function F(y){v=requestAnimationFrame(F);const z=y-W;if(document.hidden||!d()||z<(n<740?36:20))return;W=y;const O=o.core[0]-n*.5,_=l*.5-o.core[1],k=Y[o.life],L=o.energy,V=o.impulse,N=Math.min(n*(n<740?.75:.355),l*(n<740?.4:.54))*.18*k.span,b=o.clock;t.position.set(O,_+Math.sin(b*1.24)*5,0),t.scale.setScalar(N),t.rotation.set(Math.sin(b*.48)*.19,o.px*5+Math.sin(b*.36)*.22,k.roll*.028+Math.sin(b*.35)*.055),w.rotation.z=b*.21+V*.45,g.opacity=.037*L+V*.14,a.uTime.value=b,a.uWake.value=V,a.uFlow.value=L,a.uTone.value=k.tint*.008,a.uPointer.value.set(o.px*30,o.py*30),a.uImageScale.value.set(n/o.layout.w,l/o.layout.h),a.uImageOffset.value.set(-o.layout.left/o.layout.w,-o.layout.top/o.layout.h),i.render(x,r)}function U(y){y.preventDefault(),h=!0,u&&(u.dataset.renderer="layers"),c.hidden=!0,cancelAnimationFrame(v)}function A(){h&&(h=!1,c.hidden=!1,u&&(u.dataset.renderer="layered-webgl"),v=requestAnimationFrame(F))}const D=new ResizeObserver(R);return m.append(c),c.addEventListener("webglcontextlost",U),c.addEventListener("webglcontextrestored",A),D.observe(m),R(),u&&(u.dataset.renderer="layered-webgl"),v=requestAnimationFrame(F),()=>{cancelAnimationFrame(v),D.disconnect(),c.removeEventListener("webglcontextlost",U),c.removeEventListener("webglcontextrestored",A),f.geometry.dispose(),e.geometry.dispose(),M.dispose(),S.dispose(),g.dispose(),p.dispose(),i.dispose(),c.remove(),u&&(u.dataset.renderer="layers")}}export{le as mountEffects};
