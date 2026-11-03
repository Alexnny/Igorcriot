import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { buildHero } from './heroes.js';
import { rng, glowTexture, makeLabel, neon, COLORS } from './kit.js';
import { clamp, smooth, lerp, easeInOut, easeOutBack } from './timeline.js';

// Passe final único: tone mapping ACES + sRGB + antialias leve + aberração cromática + vinheta + granulação
const FinalShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uGlitch: { value: 0 }, uRes: { value: new THREE.Vector2(1920, 1080) }, uExposure: { value: 1.05 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uTime; uniform float uGlitch; uniform vec2 uRes; uniform float uExposure; varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    vec3 aces(vec3 x){ x *= uExposure * 0.6; return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }
    vec3 toSRGB(vec3 c){ return mix(c*12.92, 1.055*pow(c, vec3(1.0/2.4)) - 0.055, step(0.0031308, c)); }
    float luma(vec3 c){ return dot(c, vec3(0.299,0.587,0.114)); }
    void main(){
      vec2 uv = vUv;
      float band = floor(uv.y * 24.0 + floor(uTime*20.0));
      float g = uGlitch * step(0.72, h(vec2(band, floor(uTime*30.0))));
      uv.x += (h(vec2(band, 3.0)) - 0.5) * 0.08 * g;
      vec2 c = uv - 0.5; float d = dot(c, c);
      float ca = 0.0012 + 0.003 * d + 0.012 * uGlitch;
      vec3 col;
      col.r = texture2D(tDiffuse, uv + c * ca * 2.0).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - c * ca * 2.0).b;
      col = aces(col);
      // antialias leve: mistura com vizinhos diagonais quando há contraste
      vec2 px = 1.0 / uRes;
      vec3 a = aces(texture2D(tDiffuse, uv + px * vec2(-0.5, -0.5)).rgb);
      vec3 b = aces(texture2D(tDiffuse, uv + px * vec2( 0.5, -0.5)).rgb);
      vec3 e = aces(texture2D(tDiffuse, uv + px * vec2(-0.5,  0.5)).rgb);
      vec3 f = aces(texture2D(tDiffuse, uv + px * vec2( 0.5,  0.5)).rgb);
      float lmin = min(min(luma(a), luma(b)), min(luma(e), luma(f)));
      float lmax = max(max(luma(a), luma(b)), max(luma(e), luma(f)));
      float edge = smoothstep(0.06, 0.3, lmax - lmin);
      col = mix(col, (a + b + e + f) * 0.25, edge * 0.65);
      col = toSRGB(col);
      col *= mix(1.0, 0.45, smoothstep(0.08, 0.62, d));
      float n = h(vUv * uRes + fract(uTime) * 100.0) - 0.5;
      col += n * 0.006;
      gl_FragColor = vec4(col, 1.0);
    }`,
};

export class World {
  constructor(canvas, { render = false } = {}) {
    this.canvas = canvas;
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: render });
    r.setPixelRatio(1);
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    r.outputColorSpace = THREE.SRGBColorSpace;

    const scene = this.scene = new THREE.Scene();
    scene.background = new THREE.Color(0x03040c);
    scene.fog = new THREE.FogExp2(0x060718, 0.018);

    this.camera = new THREE.PerspectiveCamera(42, 16 / 9, 0.1, 600);
    this.camera.position.set(0, 0.6, 10);

    this.mouse = new THREE.Vector2();
    this.heroes = new Map();
    this.buildEnvironment();
    this.buildBackdrop();
    this.buildPost();
  }

  buildEnvironment() {
    // Ambiente de reflexo: sala escura com painéis neon → metal cromado com reflexos coloridos
    const pm = new THREE.PMREMGenerator(this.renderer);
    const env = new THREE.Scene();
    env.background = new THREE.Color(0x05060c);
    const box = new THREE.BoxGeometry(1, 1, 1);
    const panel = (color, inten, pos, scale) => {
      const m = new THREE.Mesh(box, new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(inten) }));
      m.position.set(...pos); m.scale.set(...scale); env.add(m);
    };
    panel(0x00e5ff, 6, [-6, 2, -2], [0.4, 8, 6]);
    panel(0xff2bd6, 6, [6, 1, -1], [0.4, 7, 6]);
    panel(0xffffff, 3.5, [0, 7, 0], [10, 0.3, 4]);
    panel(0x7c4dff, 4, [0, -1, -7], [12, 2, 0.4]);
    panel(0x88aaff, 1.2, [0, -6, 0], [14, 0.2, 14]);
    panel(0xffb020, 2.5, [-2, 3, 7], [3, 3, 0.3]);
    this.scene.environment = pm.fromScene(env, 0.035).texture;
    this.scene.environmentIntensity = 1.0;

    // Luzes
    const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(3, 6, 6); this.scene.add(key);
    this.cyanLight = new THREE.PointLight(0x00e5ff, 40, 30, 1.6); this.scene.add(this.cyanLight);
    this.magLight = new THREE.PointLight(0xff2bd6, 40, 30, 1.6); this.scene.add(this.magLight);
    this.scene.add(new THREE.AmbientLight(0x223355, 0.35));
  }

  buildBackdrop() {
    const s = this.scene;
    const R = rng(7);

    // ---- céu gradiente
    const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
      fragmentShader: `varying vec3 vP; uniform float uTime;
        void main(){ float y = normalize(vP).y;
          vec3 top = vec3(0.004,0.006,0.03); vec3 mid = vec3(0.03,0.01,0.09); vec3 hor = vec3(0.32,0.03,0.28);
          vec3 c = mix(hor, mid, smoothstep(-0.02, 0.12, y)); c = mix(c, top, smoothstep(0.12, 0.6, y));
          c += vec3(0.0,0.25,0.35) * exp(-abs(y+0.01)*60.0) * 0.6;
          gl_FragColor = vec4(c, 1.0);} `,
    }));
    s.add(sky);

    // ---- sol synthwave ao fundo
    const sun = new THREE.Mesh(new THREE.CircleGeometry(38, 64), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, fog: false, toneMapped: false,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
      fragmentShader: `varying vec2 vUv; uniform float uTime;
        void main(){ vec2 p = vUv; vec3 c = mix(vec3(1.4,0.15,0.6), vec3(1.6,0.8,0.15), p.y);
          float stripes = step(0.5, fract(p.y*14.0 - uTime*0.15)) ; float cut = mix(1.0, stripes, smoothstep(0.62, 0.2, p.y));
          float r = length(p-0.5)*2.0; float a = smoothstep(1.0, 0.97, r) * cut;
          gl_FragColor = vec4(c*0.9, a*0.85);} `,
    }));
    sun.position.set(0, 12, -260);
    this.sun = sun; s.add(sun);

    // ---- piso grid neon (shader com antialias por derivadas)
    const gridMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, extensions: { derivatives: true },
      uniforms: { uTime: { value: 0 }, uC1: { value: new THREE.Color(0x00e5ff) }, uC2: { value: new THREE.Color(0xff2bd6) }, uSpeed: { value: 0 } },
      vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
      fragmentShader: `varying vec3 vW; uniform float uTime; uniform vec3 uC1; uniform vec3 uC2; uniform float uSpeed;
        float line(float x, float w){ float d = abs(fract(x - 0.5) - 0.5) / fwidth(x); return 1.0 - min(d / w, 1.0); }
        void main(){ vec2 p = vW.xz * 0.5; p.y += uSpeed;
          float g = max(line(p.x, 1.2), line(p.y, 1.2));
          float g2 = max(line(p.x*0.2, 1.6), line(p.y*0.2, 1.6));
          float dist = length(vW.xz - vec2(0.0, 0.0));
          float fade = exp(-dist*0.022);
          vec3 col = mix(uC1, uC2, smoothstep(10.0, 90.0, -vW.z + 20.0));
          float pulse = 0.5 + 0.5*sin(dist*0.35 - uTime*2.0);
          vec3 c = col * (g*0.55 + g2*0.9) * fade * (0.75 + 0.35*pulse) * 1.8;
          float glow = exp(-abs(vW.x)*0.05) * 0.04 * fade;
          gl_FragColor = vec4(c + col*glow, clamp((g*0.6 + g2)*fade + glow, 0.0, 1.0));
        }`,
    });
    const grid = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), gridMat);
    grid.rotation.x = -Math.PI / 2; grid.position.y = -2.8;
    this.grid = grid; s.add(grid);
    // piso escuro refletivo por baixo do grid
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshBasicMaterial({ color: 0x03040a }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -2.82; s.add(floor);

    // ---- cidade cyberpunk (torres instanciadas)
    const wc = document.createElement('canvas'); wc.width = 128; wc.height = 512;
    const wx = wc.getContext('2d');
    const bgG = wx.createLinearGradient(0, 0, 0, 512); bgG.addColorStop(0, '#0b0d1c'); bgG.addColorStop(1, '#04050c');
    wx.fillStyle = bgG; wx.fillRect(0, 0, 128, 512);
    const WR = rng(3);
    for (let y = 6; y < 500; y += 7) for (let x = 5; x < 124; x += 6) {
      if (WR() < 0.3) { const h = WR(); wx.fillStyle = h < 0.5 ? '#38e8ff' : h < 0.8 ? '#ff4fe0' : '#ffd27a'; wx.globalAlpha = 0.25 + WR() * 0.75; wx.fillRect(x, y, 3, 3); }
    }
    // faixas verticais neon nas arestas
    wx.globalAlpha = 0.9; wx.fillStyle = '#00e5ff'; wx.fillRect(0, 0, 2, 512); wx.fillStyle = '#ff2bd6'; wx.fillRect(126, 0, 2, 512);
    wx.globalAlpha = 1;
    const wtex = new THREE.CanvasTexture(wc); wtex.colorSpace = THREE.SRGBColorSpace;
    wtex.magFilter = THREE.NearestFilter;
    wtex.magFilter = THREE.LinearFilter;
    const towerMat = new THREE.MeshBasicMaterial({ map: wtex, color: new THREE.Color(1.5, 1.5, 1.6) });
    const N = 170;
    const towers = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), towerMat, N);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), pos = new THREE.Vector3();
    for (let i = 0; i < N; i++) {
      const side = i % 2 ? 1 : -1;
      const x = side * (16 + R() * 70);
      const z = -30 - R() * 140;
      const w = 3 + R() * 6, h = 8 + Math.pow(R(), 1.6) * 55, d = 3 + R() * 6;
      pos.set(x, -2.8 + h / 2, z); sc.set(w, h, d); q.setFromEuler(new THREE.Euler(0, R() * 0.6, 0));
      m4.compose(pos, q, sc); towers.setMatrixAt(i, m4);
    }
    s.add(towers);
    // antenas/luzes de topo
    const beaconGeo = new THREE.SphereGeometry(0.35, 8, 8);
    for (let i = 0; i < 26; i++) {
      const b = new THREE.Mesh(beaconGeo, neon(i % 2 ? COLORS.mag : COLORS.cyan, 4));
      const side = i % 2 ? 1 : -1;
      b.position.set(side * (18 + R() * 60), 10 + R() * 40, -40 - R() * 120); s.add(b);
    }

    // ---- colunas de dados (chuva de luz)
    const rainN = 90;
    const rainGeo = new THREE.BoxGeometry(0.03, 2.6, 0.03);
    const rainMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    this.rain = new THREE.InstancedMesh(rainGeo, rainMat, rainN);
    this.rainData = [];
    const col = new THREE.Color();
    for (let i = 0; i < rainN; i++) {
      const side = R() < 0.5 ? -1 : 1;
      this.rainData.push({ x: side * (5 + R() * 30), z: -6 - R() * 50, sp: 1.5 + R() * 4, ph: R() * 40 });
      col.set(R() < 0.6 ? COLORS.cyan : R() < 0.5 ? COLORS.mag : COLORS.violet).multiplyScalar(2.2);
      this.rain.setColorAt(i, col);
    }
    s.add(this.rain);

    // ---- partículas
    const PN = 1400;
    const pg = new THREE.BufferGeometry();
    const parr = new Float32Array(PN * 3), pcol = new Float32Array(PN * 3);
    for (let i = 0; i < PN; i++) {
      parr[i * 3] = (R() - 0.5) * 90; parr[i * 3 + 1] = -2 + R() * 30; parr[i * 3 + 2] = -60 + R() * 70;
      col.set(R() < 0.55 ? COLORS.cyan : R() < 0.6 ? COLORS.mag : 0xffffff);
      pcol[i * 3] = col.r; pcol[i * 3 + 1] = col.g; pcol[i * 3 + 2] = col.b;
    }
    pg.setAttribute('position', new THREE.BufferAttribute(parr, 3));
    pg.setAttribute('color', new THREE.BufferAttribute(pcol, 3));
    this.particles = new THREE.Points(pg, new THREE.PointsMaterial({ size: 0.22, map: glowTexture(), vertexColors: true, transparent: true, opacity: 0.85, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
    s.add(this.particles);

    // ---- glifos de código flutuando
    const glyphs = ['def', 'if', 'for', 'while', 'print()', 'import', '{ }', '[ ]', '0101', 'True', 'None', 'return', '==', '+=', '</>', '>>>', 'elif', 'range()', 'f"{x}"', 'try:', 'λ', '# py', 'len()', 'int'];
    this.glyphs = glyphs.map((g, i) => {
      const sp = makeLabel(g, { size: 64, color: i % 3 === 0 ? '#ff6be6' : i % 3 === 1 ? '#5ff2ff' : '#b39dff', font: '700 64px "JetBrains Mono"', glow: 18 });
      sp.material.opacity = 0.0;
      const side = i % 2 ? 1 : -1;
      sp.userData = { x: side * (7 + R() * 14), y: -1 + R() * 9, z: -12 - R() * 26, sp: 0.2 + R() * 0.4, ph: R() * 10, base: 0.25 + R() * 0.25 };
      sp.scale.multiplyScalar(1.4 + R());
      s.add(sp);
      return sp;
    });

    // ---- anel holográfico gigante no chão
    const ringG = new THREE.RingGeometry(5.6, 5.75, 128);
    this.floorRing = new THREE.Mesh(ringG, neon(COLORS.cyan, 2.5, { transparent: true, opacity: 0.6, side: THREE.DoubleSide }));
    this.floorRing.rotation.x = -Math.PI / 2; this.floorRing.position.y = -2.75;
    s.add(this.floorRing);
    this.floorRing2 = new THREE.Mesh(new THREE.RingGeometry(3.6, 3.66, 6), neon(COLORS.mag, 2.5, { transparent: true, opacity: 0.6, side: THREE.DoubleSide }));
    this.floorRing2.rotation.x = -Math.PI / 2; this.floorRing2.position.y = -2.74;
    s.add(this.floorRing2);
    this.heroAnchor = new THREE.Group();
    s.add(this.heroAnchor);
  }

  buildPost() {
    const size = new THREE.Vector2(1280, 720);
    const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 0 });
    this.composer = new EffectComposer(this.renderer, rt);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(size, 0.62, 0.5, 0.88);
    this.composer.addPass(this.bloom);
    this.final = new ShaderPass(FinalShader);
    this.composer.addPass(this.final);
  }

  resize(w, h) {
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.bloom.resolution.set(w, h);
    this.final.uniforms.uRes.value.set(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  hero(key) {
    if (!this.heroes.has(key)) {
      const h = buildHero(key);
      h.group.visible = false;
      this.heroAnchor.add(h.group);
      this.heroes.set(key, h);
    }
    return this.heroes.get(key);
  }

  // pose do herói ao longo da cena (posição, escala, presença)
  heroPose(sc, lt) {
    const P = { x: 0, y: 0.5, z: 0, s: 1, k: 1, rotY: 0 };
    const enter = easeOutBack((lt - 0.15) / 1.3);
    const exit = 1 - smooth((lt - (sc.dur - 1.0)) / 0.9);
    if (sc.kind === 'opening') { P.y = 0.9; P.s = 1; P.k = Math.min(1, exit); return P; }
    if (sc.kind === 'map') { P.x = 0; P.y = 0.6; P.z = -9; P.s = 1.5; P.k = Math.min(enter, exit); return P; }
    if (sc.kind === 'finale') { P.x = 0; P.y = -0.35; P.z = -1.5; P.s = 0.72; P.k = Math.min(enter, 1); return P; }
    // missão
    const toPts = easeInOut((lt - (sc.panelIn - 0.3)) / 1.3);
    const toCode = easeInOut((lt - (sc.codeIn - 0.2)) / 1.4);
    P.x = lerp(lerp(0, 3.45, toPts), 0.4, toCode);
    P.y = lerp(lerp(1.55, 0.4, toPts), 0.9, toCode);
    P.z = lerp(lerp(0, -0.6, toPts), -9, toCode);
    P.s = lerp(lerp(0.68, 0.86, toPts), 1.45, toCode);
    P.k = Math.min(enter, exit);
    return P;
  }

  update(t, tl, si, dt = 1 / 30) {
    const sc = tl.scenes[si];
    const lt = t - sc.start;

    // fundo
    this.grid.material.uniforms.uTime.value = t;
    this.grid.material.uniforms.uSpeed.value = t * 0.45;
    this.sun.material.uniforms.uTime.value = t;
    this.floorRing.rotation.z = t * 0.12;
    this.floorRing2.rotation.z = -t * 0.2;
    const ringPulse = 0.4 + 0.3 * Math.sin(t * 2.0);
    this.floorRing.material.opacity = ringPulse;
    const m4 = new THREE.Matrix4();
    this.rainData.forEach((r, i) => {
      const y = ((r.ph + t * r.sp) % 26) - 4;
      m4.makeTranslation(r.x, y, r.z); this.rain.setMatrixAt(i, m4);
    });
    this.rain.instanceMatrix.needsUpdate = true;
    this.particles.rotation.y = Math.sin(t * 0.03) * 0.15;
    this.particles.position.y = Math.sin(t * 0.2) * 0.3;
    this.glyphs.forEach((g) => {
      const u = g.userData;
      g.position.set(u.x + Math.sin(t * 0.1 + u.ph) * 1.2, u.y + ((t * u.sp + u.ph) % 10) * 0.5 - 2, u.z);
      const f = ((t * u.sp + u.ph) % 10) / 10;
      g.material.opacity = u.base * Math.sin(f * Math.PI);
    });

    // câmera
    const cam = this.camera;
    let cx = Math.sin(t * 0.13) * 0.5 + this.mouse.x * 0.8;
    let cy = 0.7 + Math.sin(t * 0.17) * 0.18 + this.mouse.y * 0.4;
    let cz = 10;
    if (sc.kind === 'opening') {
      const k = easeInOut(lt / 6);
      cz = lerp(17, 10.5, k); cy = lerp(3.4, 0.9, k) + this.mouse.y * 0.4;
      cx += Math.sin(lt * 0.4) * 0.6 * (1 - k);
    }
    if (sc.kind === 'finale') { cz = 10 - smooth(lt / 6) * 0.8; }
    cam.position.set(cx, cy, cz);
    cam.lookAt(cx * 0.25, 0.35, 0);

    // luzes orbitando
    this.cyanLight.position.set(Math.cos(t * 0.6) * 6, 3, Math.sin(t * 0.6) * 6 + 2);
    this.magLight.position.set(Math.cos(t * 0.6 + Math.PI) * 6, -1, Math.sin(t * 0.6 + Math.PI) * 6 + 2);

    // heróis: o da cena atual (e o anterior saindo já foi tratado pelo "exit")
    for (const [, h] of this.heroes) h.group.visible = false;
    const h = this.hero(sc.hero);
    const P = this.heroPose(sc, lt);
    h.group.visible = P.k > 0.002;
    h.group.position.set(P.x, P.y, P.z);
    h.group.scale.setScalar(Math.max(0.0001, P.s * P.k));
    h.group.rotation.y = (1 - P.k) * 1.4;
    h.update(lt, t, sc);
    // pré-aquecimento: constrói o herói da próxima cena com antecedência
    const next = tl.scenes[si + 1];
    if (next && lt > sc.dur - 6) this.hero(next.hero);

    // glitch nas transições entre cenas
    const toEnd = sc.dur - lt;
    let glitch = 0;
    if (lt < 0.45) glitch = 1 - lt / 0.45;
    if (toEnd < 0.3) glitch = Math.max(glitch, 1 - toEnd / 0.3);
    this.final.uniforms.uGlitch.value = glitch * 0.9;
    this.final.uniforms.uTime.value = t;
    this.bloom.strength = 0.6 + 0.3 * glitch;
  }

  render() { this.composer.render(); }
}
