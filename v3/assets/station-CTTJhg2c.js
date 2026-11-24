import{W as Ce}from"./three-renderer-kEa7fYqa.js";import{a as he,z as Ee,g as Ue}from"./index-C86NuMx7.js";import{c4 as Ae,S as we,c5 as Ie,P as Re,c6 as H,ak as xe,D as Le,an as S,c7 as Fe,bJ as Me,bq as ee,c8 as De,c9 as _e,V as w,ca as te,cb as be,cc as ke,au as ne,cd as Be,C as Ge,al as Oe,ce as Xe,cf as Ye,cg as qe,ch as He,ci as Ne,cj as Ze,ck as $e,g as ae,cl as L}from"./three-core-Dw86yCeE.js";const Je=`
  uniform float uTime, uWake;
  uniform vec2 uPointer;
  varying vec3 vNormalW, vWorld, vShape;
  varying vec2 vUV;
  void main() {
    vUV = uv;
    vShape = position;
    float flow = sin(uv.x * 18.85 + uTime * .68 + uv.y * 3.6);
    float breath = sin(uTime * 1.06) * .023;
    vec3 p = position * (1.0 + breath + .022 * flow);
    p += normal * (.027 + uWake * .068) * sin(uv.x * 31.42 - uTime * 2.0) * sin(uv.y * 6.28 + uTime);
    p.x += uPointer.x * .028 * sin(p.y * 2.8 + uTime);
    vec4 world = modelMatrix * vec4(p, 1.0);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`,Ke=`
  uniform float uTime, uWake;
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
    vec3 spectral = film(incidence * .78 + fold * .13 + vShape.y * .08 + uTime * .06);
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
    gl_FragColor = vec4(color, min(.96, alpha) * (.17 + uWake * .70));
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`,q=16/9,Se=53,ge=Math.tan(L.degToRad(Se/2)),Y=(s,n)=>({value:new ae(s,n)}),R=(s,n,u)=>new w((s*2-1)*ge*q*u,(1-n*2)*ge*u,-u);function We(s,n){const u=Math.max(0,1-Math.abs(s-.55)/.55),i=Math.pow(L.smoothstep(n,.58,1),.67),l=(1-L.smoothstep(s,.13,.4))*(1-L.smoothstep(n,.16,.57)),c=Math.pow(1-u,1.55);return 34-c*13-i*(19-c*3)-l*8}function Qe(s){const n=new ne(1,1,104,64),u=n.attributes.position,i=n.attributes.uv;for(let l=0;l<u.count;l++){const c=i.getX(l),o=1-i.getY(l),t=R(c,o,We(c,o));u.setXYZ(l,t.x,t.y,t.z)}return n.computeBoundingSphere(),new S(n,new Me({map:s,toneMapped:!1}))}function ye(s,n,u){const i=new ne(1,1,220,48),l=i.attributes.position,c=i.attributes.uv;for(let a=0;a<l.count;a++){const d=c.getX(a)*Math.PI*2,V=c.getY(a)*Math.PI*2,W=d*s+n,y=.93+Math.cos(d*3+1.22+n)*.32+Math.sin(d*2+n)*.15,v=d*2+Math.sin(d*3+n)*.66,U=u*(.83+.41*Math.sin(d*3+.8+n)),h=Math.cos(V)*U,C=Math.sin(V)*(.12+U*.26),F=Math.cos(v)*h-Math.sin(v)*C,_=Math.sin(v)*h+Math.cos(v)*C,x=Math.sin(d*3+n)*.42+Math.sin(d+n)*.17;l.setXYZ(a,(y+F)*Math.cos(W)*1.12+.13*Math.cos(d*3),(y+F)*Math.sin(W)*1.14,x+_)}i.computeVertexNormals();const o=i.attributes.normal,t=221,m=49,f=new w,p=new w;function T(a,d){f.fromBufferAttribute(o,a).add(p.fromBufferAttribute(o,d)).normalize(),o.setXYZ(a,f.x,f.y,f.z),o.setXYZ(d,f.x,f.y,f.z)}for(let a=0;a<m;a++)T(a*t,a*t+t-1);for(let a=0;a<t;a++)T(a,a+t*(m-1));return i}function je(s,n,u){const i=new ne(6.35,5.8,76,68),l=new xe({uniforms:{uImage:{value:s},uTime:n,uWake:u},vertexShader:`
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
      }`,fragmentShader:`
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
      }`,transparent:!0,depthWrite:!1}),c=new S(i,l);return c.renderOrder=1,c}function et(){const s=new H,n=[{rx:2.39,ry:.76,angle:-.24,x:.99,y:.2,color:10991359},{rx:2.21,ry:1.47,angle:.86,x:-.51,y:.76,color:15849727},{rx:2.24,ry:.72,angle:-.85,x:-.22,y:-.34,color:13285631}],u=[],i=document.createElement("canvas");i.width=64,i.height=64;const l=i.getContext("2d"),c=l.createRadialGradient(32,32,0,32,32,32);c.addColorStop(0,"white"),c.addColorStop(.13,"rgba(241,228,255,.91)"),c.addColorStop(.37,"rgba(156,162,255,.20)"),c.addColorStop(1,"rgba(144,128,241,0)"),l.fillStyle=c,l.fillRect(0,0,64,64);const o=new Be(i);return n.forEach((t,m)=>{const f=new H;f.rotation.set(t.x,t.y,t.angle);const p=Array.from({length:181},(W,y)=>{const v=y/180*Math.PI*2;return new w(Math.cos(v)*t.rx,Math.sin(v)*t.ry,0)}),T=p.flatMap((W,y)=>{const v=y/180*Math.PI*2,U=.14+.63*Math.pow(.5+.5*Math.cos(v*2+m),6),h=new Ge(t.color).multiplyScalar(U);return[h.r,h.g,h.b]}),a=new Oe().setFromPoints(p);a.setAttribute("color",new Xe(T,3));const d=new te(a,new Ye({vertexColors:!0,transparent:!0,opacity:.38,blending:ee,depthWrite:!1}));f.add(d);const V=new be(new ke({map:o,color:t.color,blending:ee,transparent:!0,depthWrite:!1}));V.scale.setScalar(.3),f.add(V),s.add(f),u.push({point:V,index:m,radius:[t.rx,t.ry]})}),{orbits:s,sparks:u}}function tt(){const s=new H,n=new qe({color:1052697,emissive:591890,shininess:38}),u=new He(1,20,12);function i(c,o,t=0){const m=new S(u,n);m.position.set(...c),m.scale.set(...o),m.rotation.z=t,s.add(m)}i([-.04,.19,0],[.155,.234,.104],-.23),i([.025,.31,0],[.093,.153,.088],-.32),i([.069,.432,.004],[.098,.094,.084],-.15),i([.107,.398,.002],[.064,.044,.067]),i([.055,.08,.046],[.033,.094,.031],-.12),i([.084,.036,.043],[.059,.03,.037]);for(const[c,o,t]of[[.023,-.037,.2],[.097,.038,-.23]]){const m=new S(new Ne(.047,.105,5),n);m.position.set(c,.511,o),m.rotation.z=t,s.add(m)}const l=new Ze([new w(-.14,.07,0),new w(-.25,.036,.011),new w(-.38,.033,.026),new w(-.48,.044,.063),new w(-.49,.065,.09)]);return s.add(new S(new $e(l,30,.023,8),n)),s}async function rt(s,n,u){const i=new Ae,[l,c]=await Promise.all([i.loadAsync(he("observatory.webp")),i.loadAsync(he("nucleus.webp"))]);l.colorSpace=we,c.colorSpace=we;const o=new Ce({canvas:n.canvas,context:n,alpha:!0,antialias:!1});o.setClearColor(0,0),o.domElement.setAttribute("aria-hidden","true");const t=new Ie,m=new Re(Se,q,.1,100),f=Qe(l);l.anisotropy=Math.min(4,o.capabilities.getMaxAnisotropy()),t.add(f);const p=new H,T=R(.555,.385,13);p.position.copy(T),t.add(p);const a={uTime:{value:0},uWake:{value:0},uPlate:{value:l},uPointer:Y(0,0),uResolution:Y(1,1),uImageScale:Y(1,1),uImageOffset:Y(0,0)},d=new xe({uniforms:a,vertexShader:Je,fragmentShader:Ke,transparent:!0,side:Le,depthWrite:!1,forceSinglePass:!0}),V=je(c,a.uTime,a.uWake);p.add(V);const W=new S(ye(1,.64,.68),d);W.rotation.set(.67,-.46,.26),W.scale.set(1.22,1.26,1.09),W.renderOrder=2,p.add(W);const y=new S(ye(2,1.84,.4),d);y.rotation.set(-.48,.82,-.4),y.scale.set(.94,.86,.94),y.renderOrder=3,p.add(y);const{orbits:v,sparks:U}=et();v.position.copy(T),t.add(v);const h=new S(new Fe(.975,1,128),new Me({color:14797311,transparent:!0,opacity:0,blending:ee,depthWrite:!1}));h.position.copy(R(.555,.711,16.3)),h.rotation.x=-1.4,h.visible=!1,t.add(h);const C=tt(),F=R(.551,.746,13.7);C.position.copy(F),C.scale.setScalar(1.12),C.rotation.y=-.56,t.add(C,new De(11385087,2630200,.9));const _=new _e(15195135,1.4);_.position.set(-3,4,-11),t.add(_);const x=s.closest(".station"),Pe=new Map(Ee.map(e=>[e.id,{point:R(e.marker[0],e.marker[1],e.id==="core"?13:We(e.marker[0],e.marker[1])-1),element:x.querySelector(`[data-marker="${e.id}"]`)}])),Te=x.querySelector('[data-marker="cat"]'),Ve=x.querySelector('[data-marker="life"]'),oe=new ae,A=new ae,re=new w(0,0,-20),se=re.clone(),I=new w,B=new w,N=new w,ze=new w(-.04,.3,0).add(F),Z=performance.now();let E=Z,ie=-1/0,ce=u().wake,G=0,g=1,z=1;function le(){g=s.clientWidth||1,z=s.clientHeight||1;const e=Math.max(g,z*q),r=e/q,M=g<740?.59:.54,O=(e-g)*M,b=(r-z)*.5;m.setViewOffset(e,r,O,b,g,z),o.setPixelRatio(Math.min(devicePixelRatio,g<740?1.3:1.55)),o.setSize(g,z),o.getDrawingBufferSize(a.uResolution.value),a.uImageScale.value.set(g/e,z/r),a.uImageOffset.value.set(O/e,b/r)}function me(e){if(e.pointerType==="touch")return;const r=s.getBoundingClientRect();oe.set(L.clamp((e.clientX-r.x)/g*2-1,-1,1),L.clamp(1-(e.clientY-r.y)/z*2,-1,1))}function $(e,r){e&&(N.copy(r).project(m),e.style.setProperty("--mx",`${(N.x+1)*50}%`),e.style.setProperty("--my",`${(1-N.y)*50}%`))}function J(e){G=requestAnimationFrame(J);const r=u();if(r.mode==="browse"||document.hidden){E=e;return}if(E!==Z&&g<740&&e-E<27)return;const M=(e-Z)/1e3,O=Math.min((e-E)/1e3,.055);E=e;const b=r.reduced?.9:M;r.wake!==ce&&(ce=r.wake,ie=M);const X=Math.max(0,M-ie),P=r.reduced?0:(1-Math.exp(-X*9))*Math.exp(-X*1),Q=r.reduced?1:1-Math.exp(-O*3.2);if(A.lerp(oe,r.reduced?0:Q*.67),I.set(0,0,0),B.copy(re),r.focused){const k=Ue(r.zone);if(k.id==="core")I.set(.06,.01,-.8),B.set(.27,.16,-20);else{I.fromArray(k.camera);const D=R(k.point[0],k.point[1],20);B.set(D.x*.3,D.y*.18,-19)}}I.x+=A.x*.23,I.y+=A.y*.13,m.position.lerp(I,Q),se.lerp(B,Q),m.lookAt(se),m.updateMatrixWorld(),a.uTime.value=b,a.uWake.value=P,a.uPointer.value.copy(A),p.position.y=T.y+Math.sin(b*.71)*.066+P*.12,p.rotation.x=Math.sin(b*.28)*.15+A.y*.13,p.rotation.y=Math.sin(b*.23)*.24+A.x*.21+P*.18,p.rotation.z=Math.sin(b*.21)*.076+.04;const fe=g<740?Math.min(1,g*.76/(z*.5)):1;p.scale.setScalar(fe*(1+P*.064)),h.visible=P>.012,h.material.opacity=P*.5,h.scale.setScalar(1.1+(Number.isFinite(X)?Math.min(X*2,3.4):0)),v.rotation.z=Math.sin(b*.17)*.14+P*.1,v.scale.setScalar(fe*(1+P*.145)),U.forEach(({point:k,index:D,radius:ve})=>{const j=b*(.38+D*.075)+D*1.9+.3;k.position.set(Math.cos(j)*ve[0],Math.sin(j)*ve[1],0),k.scale.setScalar(.23+P*.22+(Math.sin(j*2)+1)*.04)});for(const k of Pe.values())$(k.element,k.point);$(Te,ze),$(Ve,p.position),o.render(t,m)}let K=!1;function ue(e){e.preventDefault(),K=!0,x.dataset.renderer="fallback",o.domElement.hidden=!0,cancelAnimationFrame(G)}function de(){K&&(K=!1,x.dataset.renderer="webgl",o.domElement.hidden=!1,E=performance.now(),G=requestAnimationFrame(J))}s.append(o.domElement),x.dataset.renderer="webgl";const pe=new ResizeObserver(le);return pe.observe(s),x.addEventListener("pointermove",me),o.domElement.addEventListener("webglcontextlost",ue),o.domElement.addEventListener("webglcontextrestored",de),le(),J(E),()=>{cancelAnimationFrame(G),pe.disconnect(),x.removeEventListener("pointermove",me),o.domElement.removeEventListener("webglcontextlost",ue),o.domElement.removeEventListener("webglcontextrestored",de);const e=new Set([l,c]);t.traverse(r=>{if((r instanceof S||r instanceof te)&&e.add(r.geometry),r instanceof S||r instanceof te||r instanceof be){const M=r.material;e.add(M),M instanceof ke&&M.map&&e.add(M.map)}}),e.forEach(r=>r.dispose()),o.dispose(),o.domElement.remove()}}export{rt as mountStation};
