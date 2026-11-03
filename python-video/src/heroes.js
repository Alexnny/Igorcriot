import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { COLORS, MAT, neon, neonEdges, makeLabel, text3d, rng, glowTexture, screenTexture } from './kit.js';
import { clamp, smooth, easeOutBack, easeInOut, lerp } from './timeline.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const label = (txt, o = {}) => makeLabel(txt, { size: 80, worldH: 0.42, ...o });
const mono = (px) => `700 ${px}px "JetBrains Mono"`;

function halo(color, size = 3, opacity = 0.5) {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  sp.scale.setScalar(size); return sp;
}
function ring(r, tube, color, inten = 3) { return new THREE.Mesh(new THREE.TorusGeometry(r, tube, 12, 128), neon(color, inten)); }
function orbitDots(n, r, color, size = 0.06) {
  const g = new THREE.Group();
  const geo = new THREE.SphereGeometry(size, 10, 10); const m = neon(color, 4);
  for (let i = 0; i < n; i++) { const d = new THREE.Mesh(geo, m); const a = (i / n) * Math.PI * 2; d.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); g.add(d); }
  return g;
}
function pedestal(radius = 1.6) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.1, 0.18, 64), MAT.dark());
  base.position.y = -2.55; g.add(base);
  const r = ring(radius * 1.02, 0.02, COLORS.cyan, 4); r.rotation.x = Math.PI / 2; r.position.y = -2.45; g.add(r);
  return g;
}

// ------------------------------------------------------------------ builders
const B = {};

B.title3d = () => {
  const g = new THREE.Group();
  const word = 'PYTHON';
  const chrome = MAT.chrome();
  const letters = [];
  let x = 0;
  const geos = [...word].map((ch) => { const geo = text3d(ch, { size: 1.55, depth: 0.42 }); const w = geo.boundingBox.max.x - geo.boundingBox.min.x; return { geo, w }; });
  const total = geos.reduce((s, q) => s + q.w + 0.16, -0.16);
  geos.forEach(({ geo, w }, i) => {
    geo.translate(-geo.boundingBox.min.x - w / 2, -0.78, -0.21);
    const m = new THREE.Mesh(geo, chrome);
    const holder = new THREE.Group(); holder.add(m);
    holder.position.x = x - total / 2 + w / 2; x += w + 0.16;
    // contorno neon de cada letra
    const e = neonEdges(geo, i % 2 ? COLORS.mag : COLORS.cyan, 0.012, 2.4, 25); holder.add(e);
    g.add(holder); letters.push(holder);
  });
  const r1 = ring(4.6, 0.025, COLORS.cyan, 3); r1.rotation.x = Math.PI / 2.1; g.add(r1);
  const r2 = ring(5.1, 0.012, COLORS.mag, 3); r2.rotation.x = Math.PI / 1.9; g.add(r2);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(total + 1.2, 0.03, 0.03), neon(COLORS.cyan, 5)); bar.position.y = -1.15; g.add(bar);
  const h = halo(COLORS.violet, 14, 0.35); h.position.z = -2; g.add(h);
  return {
    group: g,
    update(lt, t) {
      letters.forEach((l, i) => {
        const k = easeOutBack((lt - 1.6 - i * 0.12) / 0.9);
        l.position.y = (1 - k) * 6 + Math.sin(t * 1.2 + i * 0.6) * 0.06;
        l.rotation.x = (1 - k) * -2.2;
        l.rotation.y = Math.sin(t * 0.7 + i * 0.5) * 0.12;
        l.scale.setScalar(Math.max(0.001, k));
      });
      const rk = smooth((lt - 2.4) / 1.5);
      r1.scale.setScalar(Math.max(0.001, rk)); r2.scale.setScalar(Math.max(0.001, rk));
      r1.rotation.z = t * 0.3; r2.rotation.z = -t * 0.22;
      bar.scale.x = Math.max(0.001, smooth((lt - 3.2) / 1));
    },
  };
};

B.core = () => {
  const g = new THREE.Group();
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.9, 0), MAT.chrome()); g.add(core);
  const inner = new THREE.Mesh(new THREE.SphereGeometry(0.55, 32, 32), neon(COLORS.cyan, 2.2)); g.add(inner);
  const shellGeo = new THREE.IcosahedronGeometry(1.45, 1);
  const shell = neonEdges(shellGeo, COLORS.cyan, 0.012, 2.2); g.add(shell);
  const rings = [ring(1.9, 0.03, COLORS.cyan), ring(2.2, 0.02, COLORS.mag), ring(2.5, 0.012, COLORS.violet)];
  rings.forEach((r) => g.add(r));
  const dots = orbitDots(14, 2.2, COLORS.cyan, 0.04); g.add(dots);
  const h = halo(COLORS.cyan, 6, 0.22); g.add(h);
  return {
    group: g,
    update(lt, t) {
      core.rotation.set(t * 0.4, t * 0.6, 0);
      shell.rotation.set(-t * 0.15, t * 0.2, 0);
      rings[0].rotation.set(Math.PI / 2 + Math.sin(t * 0.5) * 0.4, t * 0.5, 0);
      rings[1].rotation.set(t * 0.4, Math.PI / 3, t * 0.2);
      rings[2].rotation.set(-t * 0.3, t * 0.25, Math.PI / 4);
      dots.rotation.set(0.5, t * 0.8, 0.2);
      inner.scale.setScalar(1 + Math.sin(t * 3) * 0.06);
      g.position.y += Math.sin(t * 1.1) * 0.08;
    },
  };
};

B.monitor = () => {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new RoundedBoxGeometry(3.6, 2.3, 0.22, 6, 0.12), MAT.dark()); g.add(frame);
  const bez = neonEdges(new THREE.BoxGeometry(3.62, 2.32, 0.24), COLORS.cyan, 0.014, 3); g.add(bez);
  const scr = screenTexture(1024, 640);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(3.32, 2.04), new THREE.MeshBasicMaterial({ map: scr.tex, toneMapped: false }));
  screen.position.z = 0.115; g.add(screen);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 1.1, 24), MAT.chrome()); neck.position.set(0, -1.65, -0.1); g.add(neck);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.85, 0.08, 48), MAT.chrome()); foot.position.set(0, -2.2, -0.1); g.add(foot);
  const fr = ring(0.8, 0.012, COLORS.mag, 4); fr.rotation.x = Math.PI / 2; fr.position.set(0, -2.15, -0.1); g.add(fr);
  const lines = [
    { p: '>>> ', c: '# Meu primeiro HUD' },
    { p: '>>> ', c: 'print("Bem-vindo, jogador!")' },
    { o: 'Bem-vindo, jogador!' },
    { p: '>>> ', c: 'print("Nível", 1)' },
    { o: 'Nível 1' },
    { p: '>>> ', c: '' },
  ];
  let last = -1;
  const draw = (lt) => {
    const n = Math.floor(lt * 12);
    const blink = Math.floor(lt * 2) % 2;
    const key = n * 2 + blink;
    if (key === last) return; last = key;
    const { ctx, c } = scr;
    const gr = ctx.createLinearGradient(0, 0, 0, c.height);
    gr.addColorStop(0, '#04131f'); gr.addColorStop(1, '#0a0420');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = 'rgba(0,229,255,0.06)';
    for (let y = 0; y < c.height; y += 4) ctx.fillRect(0, y, c.width, 1);
    ctx.font = '600 30px "JetBrains Mono"'; ctx.fillStyle = '#5ff2ff';
    ctx.fillText('PYTHON 3.13  ·  TERMINAL INTERATIVO', 40, 56);
    ctx.fillStyle = 'rgba(95,242,255,0.4)'; ctx.fillRect(40, 72, c.width - 80, 2);
    let budget = n, y = 130;
    ctx.font = '500 40px "JetBrains Mono"';
    for (const L of lines) {
      if (budget < 0) break;
      if (L.o) { ctx.fillStyle = '#e8f6ff'; ctx.fillText(L.o, 40, y); y += 64; budget -= 6; continue; }
      ctx.fillStyle = '#ff6be6'; ctx.fillText(L.p, 40, y);
      const shown = L.c.slice(0, Math.max(0, budget));
      ctx.fillStyle = shown.startsWith('#') ? '#6d7da8' : '#b4ffb0'; ctx.fillText(shown, 140, y);
      if (budget <= L.c.length && blink) { const w = ctx.measureText(shown).width; ctx.fillStyle = '#00e5ff'; ctx.fillRect(140 + w + 4, y - 34, 22, 42); }
      budget -= L.c.length + 4; y += 64;
    }
    scr.tex.needsUpdate = true;
  };
  const h = halo(COLORS.cyan, 7, 0.25); h.position.z = -0.6; g.add(h);
  return {
    group: g,
    update(lt, t) { draw(lt % 9); g.rotation.y += Math.sin(t * 0.5) * 0.18; g.rotation.x = Math.sin(t * 0.4) * 0.04; g.position.y += Math.sin(t) * 0.06 + 0.3; },
  };
};

B.crate = () => {
  const g = new THREE.Group();
  const mk = (sz, color) => {
    const cg = new THREE.Group();
    const box = new THREE.Mesh(new RoundedBoxGeometry(sz, sz, sz, 5, sz * 0.08), MAT.glass(color === COLORS.cyan ? 0x9ff6ff : 0xffb8f2)); cg.add(box);
    cg.add(neonEdges(new THREE.BoxGeometry(sz * 1.01, sz * 1.01, sz * 1.01), color, sz * 0.012, 3.2));
    // cantoneiras cromadas
    const cornerGeo = new THREE.BoxGeometry(sz * 0.16, sz * 0.16, sz * 0.16);
    const cm = MAT.chrome();
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz2 of [-1, 1]) { const k = new THREE.Mesh(cornerGeo, cm); k.position.set(sx * sz / 2, sy * sz / 2, sz2 * sz / 2); cg.add(k); }
    return cg;
  };
  const main = mk(1.9, COLORS.cyan); g.add(main);
  const val = label('100', { size: 150, color: '#7ff6ff', worldH: 0.9, glow: 40 }); val.renderOrder = 10; val.material.depthTest = false; main.add(val);
  const tag = label('vida', { font: mono(80), size: 80, color: '#ffffff', bg: 'rgba(0,30,50,0.85)', border: '#00e5ff', worldH: 0.42 });
  tag.position.y = 1.55; main.add(tag);
  const sideA = mk(0.95, COLORS.mag); sideA.position.set(-2.3, -0.6, -0.8); g.add(sideA);
  const la = label('nome = "Kira"', { font: mono(64), size: 64, color: '#ff9cf0', worldH: 0.28 }); la.position.set(-2.3, 0.25, -0.8); g.add(la);
  const sideB = mk(0.95, COLORS.mag); sideB.position.set(2.3, -0.6, -0.8); g.add(sideB);
  const lb = label('nivel = 1', { font: mono(64), size: 64, color: '#ff9cf0', worldH: 0.28 }); lb.position.set(2.3, 0.25, -0.8); g.add(lb);
  const ped = pedestal(1.5); g.add(ped);
  const flash = halo(COLORS.cyan, 3.2, 0); main.add(flash);
  return {
    group: g,
    update(lt, t) {
      const cyc = lt % 6;
      const hit = cyc > 3;
      val.setText(hit ? '75' : '100', hit ? '#ffb15c' : '#7ff6ff');
      lb.setText(hit ? 'nivel = 2' : 'nivel = 1');
      flash.material.opacity = Math.max(0, 1 - Math.abs(cyc - 3) * 3) * 0.9;
      main.rotation.y = Math.sin(t * 0.6) * 0.5; main.rotation.x = Math.sin(t * 0.4) * 0.12;
      main.position.y = Math.sin(t * 1.2) * 0.12 + (hit && cyc < 3.25 ? -0.08 : 0);
      sideA.rotation.y = t * 0.4; sideB.rotation.y = -t * 0.4;
      sideA.position.y = -0.6 + Math.sin(t + 1) * 0.1; sideB.position.y = -0.6 + Math.sin(t + 2) * 0.1;
    },
  };
};

B.crystals = () => {
  const g = new THREE.Group();
  const items = [
    { name: 'int', v: '42', geo: new RoundedBoxGeometry(0.85, 0.85, 0.85, 4, 0.1), mat: MAT.chrome(), c: COLORS.cyan },
    { name: 'float', v: '3.14', geo: new THREE.OctahedronGeometry(0.62), mat: MAT.glass(0xb39dff), c: COLORS.violet },
    { name: 'str', v: '"Mago"', geo: new THREE.TorusGeometry(0.42, 0.16, 24, 64), mat: MAT.gold(), c: COLORS.amber },
    { name: 'bool', v: 'True', geo: new THREE.SphereGeometry(0.52, 48, 48), mat: MAT.glass(0x9dffb8), c: COLORS.lime },
    { name: 'None', v: '∅', geo: new THREE.DodecahedronGeometry(0.55), mat: MAT.holo(0xff2bd6, 0.12), c: COLORS.mag },
  ];
  const nodes = items.map((it, i) => {
    const n = new THREE.Group();
    const m = new THREE.Mesh(it.geo, it.mat); n.add(m);
    n.add(neonEdges(it.geo, it.c, 0.012, 3, 20));
    const l = label(it.name, { size: 72, color: '#' + new THREE.Color(it.c).getHexString(), worldH: 0.34 }); l.position.y = -1.0; n.add(l);
    const v = label(it.v, { font: mono(60), size: 60, color: '#e8f6ff', worldH: 0.26 }); v.position.y = 0.95; n.add(v);
    const a = (i - 2) * 0.62;
    n.position.set(Math.sin(a) * 2.6, 0, Math.cos(a) * 1.2 - 1.2);
    g.add(n);
    return { n, m };
  });
  const r = ring(3.3, 0.015, COLORS.cyan, 3); r.rotation.x = Math.PI / 2; r.position.y = -1.6; r.scale.z = 0.4; g.add(r);
  return {
    group: g,
    update(lt, t) {
      nodes.forEach(({ n, m }, i) => {
        m.rotation.set(t * (0.4 + i * 0.07), t * (0.6 + i * 0.05), 0);
        n.position.y = Math.sin(t * 1.3 + i) * 0.15;
        const pulse = (Math.floor(t / 1.6) % 5) === i ? 1.18 : 1;
        n.scale.lerp(V(pulse, pulse, pulse), 0.2);
      });
    },
  };
};

B.operators = () => {
  const g = new THREE.Group();
  const center = new THREE.Mesh(new THREE.SphereGeometry(0.75, 64, 64), MAT.chrome()); g.add(center);
  g.add(halo(COLORS.violet, 4.5, 0.5));
  const syms = ['+', '-', '*', '/', '%', '**', '//', '='];
  const chrome = MAT.chrome();
  const objs = syms.map((s, i) => {
    const geo = text3d(s, { size: 0.62, depth: 0.2 });
    const bb = geo.boundingBox; geo.translate(-(bb.max.x + bb.min.x) / 2, -(bb.max.y + bb.min.y) / 2, -0.1);
    const m = new THREE.Group();
    m.add(new THREE.Mesh(geo, chrome));
    m.add(neonEdges(geo, i % 2 ? COLORS.mag : COLORS.cyan, 0.01, 3, 25));
    g.add(m); return m;
  });
  const r = ring(2.35, 0.012, COLORS.cyan); r.rotation.x = Math.PI / 2 - 0.25; g.add(r);
  const res = label('17 % 5 = 2', { font: mono(72), size: 72, color: '#ffffff', bg: 'rgba(30,0,40,0.8)', border: '#ff2bd6', worldH: 0.36 }); res.position.y = -1.95; g.add(res);
  const eqs = ['17 + 5 = 22', '17 * 5 = 85', '17 / 5 = 3.4', '17 // 5 = 3', '17 % 5 = 2', '2 ** 10 = 1024'];
  return {
    group: g,
    update(lt, t) {
      objs.forEach((o, i) => {
        const a = (i / objs.length) * Math.PI * 2 + t * 0.35;
        o.position.set(Math.cos(a) * 2.35, Math.sin(a) * 2.35 * 0.25 + Math.sin(t + i) * 0.1, Math.sin(a) * 2.35);
        o.rotation.y = Math.sin(t + i) * 0.4;
      });
      center.rotation.y = t * 0.5;
      res.setText(eqs[Math.floor(lt / 2.2) % eqs.length]);
    },
  };
};

B.letters = () => {
  const g = new THREE.Group();
  const word = 'PYTHON';
  const cubes = [...word].map((ch, i) => {
    const sc = screenTexture(256, 256);
    const ctx = sc.ctx;
    const gr = ctx.createLinearGradient(0, 0, 256, 256); gr.addColorStop(0, '#0b1730'); gr.addColorStop(1, '#1c0a33');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = i % 2 ? '#ff2bd6' : '#00e5ff'; ctx.lineWidth = 10; ctx.strokeRect(10, 10, 236, 236);
    ctx.font = '900 170px Orbitron'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 30; ctx.fillStyle = '#ffffff'; ctx.fillText(ch, 128, 140);
    sc.tex.needsUpdate = true;
    const mats = [MAT.dark(), MAT.dark(), MAT.dark(), MAT.dark(), new THREE.MeshStandardMaterial({ map: sc.tex, emissive: 0xffffff, emissiveMap: sc.tex, emissiveIntensity: 1.3, roughness: 0.3, metalness: 0.2 }), MAT.dark()];
    const cube = new THREE.Mesh(new RoundedBoxGeometry(0.9, 0.9, 0.9, 4, 0.08), mats);
    const holder = new THREE.Group(); holder.add(cube);
    holder.position.x = (i - 2.5) * 1.08;
    const ip = label(String(i), { font: mono(70), size: 70, color: '#5ff2ff', worldH: 0.3 }); ip.position.y = -0.85; holder.add(ip);
    const ineg = label(String(i - 6), { font: mono(54), size: 54, color: '#ff7be9', worldH: 0.22 }); ineg.position.y = 0.82; holder.add(ineg);
    g.add(holder);
    return holder;
  });
  const bracket = new THREE.Mesh(new THREE.BoxGeometry(1, 0.04, 0.04), neon(COLORS.lime, 4)); bracket.position.y = -1.25; g.add(bracket);
  const sl = label('texto[0:3]  →  "PYT"', { font: mono(64), size: 64, color: '#c6ff8f', worldH: 0.3 }); sl.position.y = -1.7; g.add(sl);
  const slices = [[0, 3, 'texto[0:3]  →  "PYT"'], [2, 6, 'texto[2:]  →  "THON"'], [5, 6, 'texto[-1]  →  "N"'], [0, 6, 'len(texto)  →  6']];
  return {
    group: g,
    update(lt, t) {
      const k = Math.floor(lt / 3) % slices.length;
      const [a, b, txt] = slices[k];
      sl.setText(txt);
      const cx = ((a + b - 1) / 2 - 2.5) * 1.08;
      bracket.position.x = lerp(bracket.position.x, cx, 0.15);
      bracket.scale.x = lerp(bracket.scale.x, (b - a) * 1.08, 0.15);
      cubes.forEach((c, i) => {
        const sel = i >= a && i < b;
        c.position.y = lerp(c.position.y, sel ? 0.25 : -0.05, 0.12) + Math.sin(t * 2 + i * 0.5) * 0.01;
        c.rotation.y = Math.sin(t * 0.8 + i * 0.4) * 0.35;
        c.rotation.x = Math.sin(t * 0.6 + i) * 0.08;
      });
    },
  };
};

B.portal = () => {
  const g = new THREE.Group();
  const outer = new THREE.Mesh(new THREE.TorusGeometry(1.8, 0.18, 32, 128), MAT.chrome()); g.add(outer);
  const inner = ring(1.6, 0.035, COLORS.cyan, 4); g.add(inner);
  const inner2 = ring(1.35, 0.015, COLORS.mag, 4); g.add(inner2);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.6, 64), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, toneMapped: false,
    uniforms: { uT: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: `varying vec2 vUv; uniform float uT; void main(){ vec2 p=vUv-0.5; float r=length(p)*2.0; float a=atan(p.y,p.x);
      float s = sin(a*6.0 + r*14.0 - uT*4.0)*0.5+0.5; float glow = smoothstep(1.0,0.0,r);
      vec3 c = mix(vec3(0.0,0.9,1.0), vec3(1.0,0.17,0.84), s) * (0.25 + 0.75*s) * glow; gl_FragColor=vec4(c*1.2, glow*0.8);} `,
  }));
  g.add(disc);
  const cube = new THREE.Mesh(new RoundedBoxGeometry(0.6, 0.6, 0.6, 4, 0.06), MAT.gold()); g.add(cube);
  const sph = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4, 3), MAT.chrome()); g.add(sph);
  const lc = label('"17"  str', { font: mono(64), size: 64, color: '#ffd27a', worldH: 0.28 }); g.add(lc);
  const ls = label('17  int', { font: mono(64), size: 64, color: '#7ff6ff', worldH: 0.28 }); g.add(ls);
  const lp = label('int( )', { font: mono(80), size: 80, color: '#ffffff', worldH: 0.36 }); lp.position.y = 2.35; g.add(lp);
  return {
    group: g,
    update(lt, t) {
      disc.material.uniforms.uT.value = t;
      inner.rotation.z = t; inner2.rotation.z = -t * 1.4;
      g.rotation.y += -0.45;
      const c = (lt % 4) / 4;
      const x = lerp(-3.4, 3.4, easeInOut(c));
      const before = x < 0;
      cube.visible = before; sph.visible = !before;
      cube.position.set(x, 0, 0); sph.position.set(x, 0, 0);
      cube.rotation.set(t, t * 1.3, 0); sph.rotation.y = t;
      const pop = 1 - Math.exp(-Math.abs(x) * 3);
      cube.scale.setScalar(Math.max(0.01, pop)); sph.scale.setScalar(Math.max(0.01, pop));
      lc.position.set(x, -0.75, 0); ls.position.set(x, -0.75, 0);
      lc.visible = before; ls.visible = !before;
    },
  };
};

B.logic = () => {
  const g = new THREE.Group();
  const mkNode = (x, txt) => {
    const n = new THREE.Group();
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.42, 48, 48), MAT.glass(0xffffff)); n.add(m);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 24), neon(COLORS.lime, 4)); n.add(core);
    const l = label(txt, { font: mono(60), size: 60, color: '#ffffff', worldH: 0.26 }); l.position.y = -0.75; n.add(l);
    n.position.x = x; g.add(n); return { n, core, l };
  };
  const A = mkNode(-2.4, 'A'), Bn = mkNode(-2.4, 'B');
  A.n.position.y = 0.8; Bn.n.position.y = -0.8;
  const gate = new THREE.Mesh(new RoundedBoxGeometry(1.5, 1.2, 0.5, 5, 0.12), MAT.dark()); g.add(gate);
  g.add(neonEdges(new THREE.BoxGeometry(1.52, 1.22, 0.52), COLORS.violet, 0.012, 3));
  const gl = label('and', { font: mono(84), size: 84, color: '#c8b6ff', worldH: 0.42 }); gl.position.z = 0.3; g.add(gl);
  const out = mkNode(2.4, 'resultado');
  const wires = [];
  const wire = (a, b) => {
    const curve = new THREE.CatmullRomCurve3([a, V((a.x + b.x) / 2, a.y, 0), V((a.x + b.x) / 2, b.y, 0), b]);
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.025, 8), neon(COLORS.cyan, 2));
    g.add(m); wires.push(m); return m;
  };
  wire(V(-2, 0.8, 0), V(-0.75, 0.25, 0)); wire(V(-2, -0.8, 0), V(-0.75, -0.25, 0)); wire(V(0.75, 0, 0), V(2, 0, 0));
  const states = [[1, 1, 'and'], [1, 0, 'and'], [1, 0, 'or'], [0, 0, 'or'], [1, 1, 'not A']];
  const col = (v) => (v ? COLORS.lime : COLORS.red);
  return {
    group: g,
    update(lt, t) {
      const [a, b, op] = states[Math.floor(lt / 2.4) % states.length];
      const r = op === 'and' ? a && b : op === 'or' ? a || b : !a;
      A.core.material.color.set(col(a)).multiplyScalar(4); A.l.setText(a ? 'True' : 'False', a ? '#b6ff7a' : '#ff7a8f');
      Bn.core.material.color.set(col(b)).multiplyScalar(4); Bn.l.setText(b ? 'True' : 'False', b ? '#b6ff7a' : '#ff7a8f');
      Bn.n.visible = op !== 'not A';
      out.core.material.color.set(col(r)).multiplyScalar(5); out.l.setText(r ? 'True' : 'False', r ? '#b6ff7a' : '#ff7a8f');
      gl.setText(op);
      const p = 1 + Math.sin(t * 6) * 0.06;
      out.core.scale.setScalar(p);
      g.rotation.y += Math.sin(t * 0.5) * 0.25;
    },
  };
};

B.branches = () => {
  const g = new THREE.Group();
  const start = V(-3, -0.2, 0), fork = V(-0.8, -0.2, 0);
  const ends = [V(2.8, 1.5, -0.4), V(2.8, -0.2, 0.3), V(2.8, -1.9, -0.4)];
  const names = [['if', '#5ff2ff'], ['elif', '#ff7be9'], ['else', '#c8b6ff']];
  const colors = [COLORS.cyan, COLORS.mag, COLORS.violet];
  const trunk = new THREE.LineCurve3(start, fork);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(trunk, 8, 0.05, 10), neon(COLORS.white, 2.5)));
  const paths = ends.map((e, i) => {
    const curve = new THREE.CubicBezierCurve3(fork, V(0.4, -0.2, 0), V(1.0, e.y, e.z), e);
    const mat = neon(colors[i], 1.2);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.045, 10), mat); g.add(tube);
    const node = new THREE.Mesh(new THREE.OctahedronGeometry(0.32), MAT.chrome()); node.position.copy(e); g.add(node);
    const l = label(names[i][0], { font: mono(80), size: 80, color: names[i][1], worldH: 0.36 }); l.position.copy(e).add(V(0, 0.55, 0)); g.add(l);
    return { curve, mat, node, c: colors[i] };
  });
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 24, 24), neon(COLORS.white, 6)); g.add(orb);
  const orbHalo = halo(COLORS.cyan, 1.6, 0.9); orb.add(orbHalo);
  const cond = label('vida = 35', { font: mono(64), size: 64, color: '#ffffff', bg: 'rgba(0,20,40,0.85)', border: '#00e5ff', worldH: 0.3 }); cond.position.copy(start).add(V(0, 0.6, 0)); g.add(cond);
  const scen = [['vida = 0', 0], ['vida = 35', 1], ['vida = 90', 2]];
  return {
    group: g,
    update(lt, t) {
      const cyc = lt / 3.2; const k = Math.floor(cyc) % 3; const f = cyc % 1;
      cond.setText(scen[k][0]);
      const target = [2, 1, 0][scen[k][1]] === undefined ? 0 : scen[k][1];
      const choose = target === 0 ? 0 : target === 1 ? 1 : 2;
      // vida 0 → if (GAME OVER); 35 → elif; 90 → else
      const branch = paths[choose];
      if (f < 0.35) orb.position.lerpVectors(start, fork, f / 0.35);
      else orb.position.copy(branch.curve.getPoint(Math.min(1, (f - 0.35) / 0.55)));
      orbHalo.material.color.set(branch.c);
      paths.forEach((p, i) => { p.mat.color.set(p.c).multiplyScalar(i === choose && f > 0.3 ? 4.5 : 0.9); p.node.rotation.y = t * (i === choose ? 3 : 0.6); });
      g.rotation.y += Math.sin(t * 0.4) * 0.15;
    },
  };
};

function itemMesh(kind) {
  const g = new THREE.Group();
  if (kind === 'espada') {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.9, 0.03), MAT.chrome()); blade.position.y = 0.2; g.add(blade);
    g.add(neonEdges(new THREE.BoxGeometry(0.1, 0.9, 0.03), COLORS.cyan, 0.006, 3)).position.y = 0.2;
    const guard = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.07, 0.08), MAT.gold()); guard.position.y = -0.27; g.add(guard);
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.26, 12), MAT.dark()); grip.position.y = -0.43; g.add(grip);
    g.rotation.z = 0.6;
  } else if (kind === 'escudo') {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.08, 6), MAT.chrome()); s.rotation.x = Math.PI / 2; g.add(s);
    const e = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 8, 6), neon(COLORS.mag, 3)); e.position.z = 0.05; g.add(e);
  } else if (kind === 'poção') {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.28, 32, 32), MAT.glass(0xff7be9)); g.add(b);
    const liq = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 24), neon(COLORS.mag, 3)); liq.position.y = -0.05; g.add(liq);
    const n = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.22, 16), MAT.glass(0xffffff)); n.position.y = 0.33; g.add(n);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.07, 16), MAT.gold()); c.position.y = 0.46; g.add(c);
  } else {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 0.02), MAT.gold()); g.add(p);
    const x = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.03), neon(COLORS.red, 4)); x.position.set(0.12, 0.05, 0.02); g.add(x);
    const r1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 12), MAT.chrome()); r1.rotation.z = 0; r1.position.x = -0.32; g.add(r1);
    const r2 = r1.clone(); r2.position.x = 0.32; g.add(r2);
  }
  return g;
}

B.slots = () => {
  const g = new THREE.Group();
  const items = ['espada', 'escudo', 'poção', 'mapa'];
  const slots = items.map((it, i) => {
    const s = new THREE.Group();
    const frame = new THREE.Mesh(new RoundedBoxGeometry(1.15, 1.15, 0.35, 4, 0.08), MAT.holo(0x00e5ff, 0.12)); s.add(frame);
    s.add(neonEdges(new THREE.BoxGeometry(1.16, 1.16, 0.36), i === 3 ? COLORS.lime : COLORS.cyan, 0.012, 3));
    const item = itemMesh(it); s.add(item);
    const idx = label(`[${i}]`, { font: mono(64), size: 64, color: '#5ff2ff', worldH: 0.28 }); idx.position.y = -0.85; s.add(idx);
    const nm = label(it, { font: mono(54), size: 54, color: '#ffffff', worldH: 0.22 }); nm.position.y = 0.85; s.add(nm);
    s.position.x = (i - 1.5) * 1.45;
    g.add(s);
    return { s, item };
  });
  const title = label('inventario.append("mapa")', { font: mono(64), size: 64, color: '#c6ff8f', worldH: 0.3 }); title.position.y = -1.65; g.add(title);
  return {
    group: g,
    update(lt, t) {
      const c = (lt % 6) / 6;
      slots.forEach(({ s, item }, i) => {
        item.rotation.y = t * 0.9 + i;
        s.position.y = Math.sin(t * 1.2 + i * 0.7) * 0.08;
        if (i === 3) {
          const k = easeOutBack((c - 0.1) / 0.25);
          s.position.y += (1 - k) * 2.8; s.scale.setScalar(Math.max(0.01, k));
        }
      });
      title.material.opacity = smooth((c - 0.1) / 0.15);
    },
  };
};

B.tupleset = () => {
  const g = new THREE.Group();
  // tupla: cubos travados
  const tup = new THREE.Group(); tup.position.x = -1.9; g.add(tup);
  ['10', '25'].forEach((v, i) => {
    const c = new THREE.Mesh(new RoundedBoxGeometry(0.85, 0.85, 0.85, 4, 0.08), MAT.chrome()); c.position.x = (i - 0.5) * 1.0; tup.add(c);
    const l = label(v, { size: 72, color: '#ffffff', worldH: 0.34 }); l.position.set((i - 0.5) * 1.0, 0, 0.55); tup.add(l);
  });
  const lock = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.05, 16, 64), MAT.gold()); lock.scale.y = 0.62; tup.add(lock);
  tup.add(neonEdges(new THREE.BoxGeometry(2.2, 1.2, 1.1), COLORS.amber, 0.01, 3));
  const lt1 = label('tupla ( )  ·  imutável', { font: mono(54), size: 54, color: '#ffd27a', worldH: 0.24 }); lt1.position.y = -1.15; tup.add(lt1);
  // set: esferas únicas flutuando
  const st = new THREE.Group(); st.position.x = 2.0; g.add(st);
  const names = ['boss', 'speedrun', 'sem_dano'];
  const balls = names.map((n, i) => {
    const b = new THREE.Group();
    b.add(new THREE.Mesh(new THREE.SphereGeometry(0.36, 40, 40), MAT.glass(i === 1 ? 0x9ff6ff : 0xff9cf0)));
    b.add(new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), neon(i === 1 ? COLORS.cyan : COLORS.mag, 4)));
    const l = label(n, { font: mono(50), size: 50, color: '#ffffff', worldH: 0.2 }); l.position.y = -0.52; b.add(l);
    st.add(b); return b;
  });
  const dup = new THREE.Group();
  dup.add(new THREE.Mesh(new THREE.SphereGeometry(0.36, 40, 40), MAT.glass(0x9ff6ff)));
  const dl = label('speedrun  ✕ repetido', { font: mono(46), size: 46, color: '#ff7a8f', worldH: 0.2 }); dl.position.y = 0.55; dup.add(dl);
  st.add(dup);
  const bubble = new THREE.Mesh(new THREE.SphereGeometry(1.45, 48, 32), MAT.holo(0xff2bd6, 0.08)); st.add(bubble);
  const lt2 = label('set { }  ·  valores únicos', { font: mono(54), size: 54, color: '#ff9cf0', worldH: 0.24 }); lt2.position.y = -1.75; st.add(lt2);
  return {
    group: g,
    update(lt, t) {
      tup.rotation.y = Math.sin(t * 0.6) * 0.35; lock.rotation.z = t * 0.2;
      balls.forEach((b, i) => { const a = t * 0.6 + (i / 3) * Math.PI * 2; b.position.set(Math.cos(a) * 0.75, Math.sin(a * 1.3) * 0.35, Math.sin(a) * 0.75); });
      const c = (lt % 5) / 5;
      dup.position.set(lerp(2.4, 1.2, smooth(c / 0.4)), 0.9, 0);
      const k = c < 0.45 ? 1 : 1 - smooth((c - 0.45) / 0.25);
      dup.scale.setScalar(Math.max(0.01, k));
    },
  };
};

B.keyvalue = () => {
  const g = new THREE.Group();
  const rows = [['"nome"', '"Kira"'], ['"classe"', '"Arqueira"'], ['"vida"', '100'], ['"ouro"', '50']];
  const pulses = [];
  rows.forEach(([k, v], i) => {
    const y = 1.35 - i * 0.9;
    const key = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 1.3, 8, 24), MAT.chrome()); key.rotation.z = Math.PI / 2; key.position.set(-2.1, y, 0); g.add(key);
    const kl = label(k, { font: mono(60), size: 60, color: '#ff8cef', worldH: 0.26 }); kl.position.set(-2.1, y, 0.3); g.add(kl);
    const val = new THREE.Mesh(new RoundedBoxGeometry(1.7, 0.55, 0.4, 4, 0.08), MAT.holo(0x00e5ff, 0.18)); val.position.set(1.9, y, 0); g.add(val);
    const ve = neonEdges(new THREE.BoxGeometry(1.71, 0.56, 0.41), COLORS.cyan, 0.008, 3); ve.position.copy(val.position); g.add(ve);
    const vl = label(v, { font: mono(60), size: 60, color: '#ffffff', worldH: 0.26 }); vl.position.set(1.9, y, 0.3); g.add(vl);
    const link = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 2.1, 6), neon(COLORS.violet, 3)); link.rotation.z = Math.PI / 2; link.position.set(-0.1, y, 0); g.add(link);
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), neon(COLORS.white, 6)); p.position.y = y; g.add(p); pulses.push(p);
    const colon = label(':', { size: 70, color: '#c8b6ff', worldH: 0.3 }); colon.position.set(-0.95, y, 0.2); g.add(colon);
  });
  const br1 = label('{', { size: 300, color: '#5ff2ff', worldH: 3.6, font: '300 300px Orbitron', glow: 30 }); br1.position.set(-3.55, 0, 0); g.add(br1);
  const br2 = label('}', { size: 300, color: '#5ff2ff', worldH: 3.6, font: '300 300px Orbitron', glow: 30 }); br2.position.set(3.35, 0, 0); g.add(br2);
  return {
    group: g,
    update(lt, t) {
      pulses.forEach((p, i) => { const f = ((t * 0.6 + i * 0.25) % 1); p.position.x = lerp(-1.15, 0.95, f); });
      g.rotation.y += Math.sin(t * 0.45) * 0.2;
    },
  };
};

B.ring = () => {
  const g = new THREE.Group();
  const N = 8, R = 2.0;
  const nodes = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2;
    const n = new THREE.Group();
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 2), MAT.chrome()); n.add(m);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), neon(COLORS.cyan, 1)); n.add(core);
    const l = label(String(i), { font: mono(60), size: 60, color: '#9ff8ff', worldH: 0.26 }); l.position.set(Math.cos(a) * 0.55, -Math.sin(a) * 0.55, 0); n.add(l);
    n.position.set(Math.cos(a) * R, -Math.sin(a) * R, 0); g.add(n); nodes.push({ n, core, a });
  }
  const track = ring(R, 0.018, COLORS.violet, 2.5); g.add(track);
  const pulse = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 16), neon(COLORS.white, 6)); g.add(pulse);
  pulse.add(halo(COLORS.cyan, 1.3, 1));
  const c1 = label('for i in range(8):', { font: mono(56), size: 56, color: '#ff8cef', worldH: 0.26 }); c1.position.y = 0.2; g.add(c1);
  const c2 = label('i = 0', { size: 90, color: '#ffffff', worldH: 0.46 }); c2.position.y = -0.35; g.add(c2);
  return {
    group: g,
    update(lt, t) {
      const f = lt * 1.6; const i = Math.floor(f) % N; const fr = f % 1;
      const a0 = nodes[i].a, a1 = a0 + (Math.PI * 2) / N;
      const a = lerp(a0, a1, easeInOut(Math.min(1, fr * 1.6)));
      pulse.position.set(Math.cos(a) * R, -Math.sin(a) * R, 0);
      nodes.forEach((nd, k) => { const on = k === i; nd.core.material.color.set(on ? COLORS.lime : COLORS.cyan).multiplyScalar(on ? 6 : 1.2); nd.n.scale.setScalar(on ? 1.25 : 1); nd.n.rotation.y = t + k; });
      c2.setText(`i = ${i}`);
      g.rotation.x = -0.15; g.rotation.y += Math.sin(t * 0.4) * 0.25;
    },
  };
};

B.loop = () => {
  const g = new THREE.Group();
  const p = 2, q = 3;
  const knotGeo = new THREE.TorusKnotGeometry(1.35, 0.17, 280, 32, p, q);
  const knot = new THREE.Mesh(knotGeo, MAT.chrome()); g.add(knot);
  const cr = 1.35;
  const pt = (u) => { const qu = u * q, pu = u * p; const r = cr * (2 + Math.cos(qu)) * 0.5; return V(r * Math.cos(pu), r * Math.sin(pu), cr * Math.sin(qu) * 0.5); };
  const runners = [0, 1, 2, 3, 4, 5].map((i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16), neon(i % 2 ? COLORS.mag : COLORS.cyan, 6)); m.add(halo(i % 2 ? COLORS.mag : COLORS.cyan, 1.0, 0.9)); knot.add(m); return m; });
  const lbl = label('while rodando:', { font: mono(64), size: 64, color: '#ffffff', bg: 'rgba(20,0,40,0.85)', border: '#ff2bd6', worldH: 0.32 }); lbl.position.y = -2.15; g.add(lbl);
  const steps = ['ler controles', 'atualizar', 'desenhar tela'];
  const st = label(steps[0], { font: mono(56), size: 56, color: '#5ff2ff', worldH: 0.26 }); st.position.y = 2.15; g.add(st);
  return {
    group: g,
    update(lt, t) {
      knot.rotation.set(t * 0.25, t * 0.35, 0);
      runners.forEach((r, i) => r.position.copy(pt(((t * 0.18 + i / 6) % 1) * Math.PI * 2)));
      st.setText(`▸ ${steps[Math.floor(lt / 1.3) % 3]}`);
    },
  };
};

B.machine = () => {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(1.9, 1.6, 1.4, 6, 0.16), MAT.dark()); g.add(body);
  g.add(neonEdges(new THREE.BoxGeometry(1.92, 1.62, 1.42), COLORS.violet, 0.012, 3));
  const face = label('def', { font: mono(110), size: 110, color: '#c8b6ff', worldH: 0.52 }); face.position.set(0, 0.2, 0.75); g.add(face);
  const face2 = label('calcular_dano()', { font: mono(50), size: 50, color: '#ffffff', worldH: 0.2 }); face2.position.set(0, -0.35, 0.75); g.add(face2);
  const rail = new THREE.Mesh(new THREE.BoxGeometry(8, 0.06, 0.5), MAT.chrome()); rail.position.y = -0.95; g.add(rail);
  const railGlow = new THREE.Mesh(new THREE.BoxGeometry(8, 0.02, 0.04), neon(COLORS.cyan, 4)); railGlow.position.set(0, -0.9, 0.26); g.add(railGlow);
  const gear = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.08, 8, 12), MAT.gold()); gear.position.set(0, 1.05, 0); gear.rotation.x = Math.PI / 2; g.add(gear);
  const ins = [0, 1, 2].map(() => { const m = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.42, 0.42, 3, 0.05), MAT.chrome()); g.add(m); return m; });
  const outs = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 24), neon(COLORS.lime, 3.5)); g.add(m); return m; });
  const inL = label('(50, 20)', { font: mono(56), size: 56, color: '#5ff2ff', worldH: 0.24 }); inL.position.set(-3, 0.1, 0); g.add(inL);
  const outL = label('return 30', { font: mono(56), size: 56, color: '#b6ff7a', worldH: 0.24 }); outL.position.set(3, 0.1, 0); g.add(outL);
  return {
    group: g,
    update(lt, t) {
      gear.rotation.z = t * 2;
      ins.forEach((m, i) => { const f = ((t * 0.35 + i / 3) % 1); m.position.set(lerp(-3.9, -0.4, f), -0.68, 0); m.visible = f < 0.97; m.rotation.y = t; });
      outs.forEach((m, i) => { const f = ((t * 0.35 + i / 3 + 0.5) % 1); m.position.set(lerp(0.4, 3.9, f), -0.68, 0); });
      g.rotation.y += Math.sin(t * 0.4) * 0.22;
    },
  };
};

B.shield = () => {
  const g = new THREE.Group();
  const geo = new THREE.IcosahedronGeometry(1.9, 2);
  const shell = new THREE.Mesh(geo, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false,
    uniforms: { uT: { value: 0 }, uHit: { value: new THREE.Vector3(0, 0, 1) }, uK: { value: 0 } },
    vertexShader: 'varying vec3 vN; varying vec3 vP; varying vec3 vV; void main(){ vN=normalize(normalMatrix*normal); vP=position; vec4 mv=modelViewMatrix*vec4(position,1.0); vV=-mv.xyz; gl_Position=projectionMatrix*mv; }',
    fragmentShader: `varying vec3 vN; varying vec3 vP; varying vec3 vV; uniform float uT; uniform vec3 uHit; uniform float uK;
      void main(){ float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
        float hex = abs(sin(vP.x*9.0+uT)*sin(vP.y*9.0)*sin(vP.z*9.0)); float lines = smoothstep(0.92,1.0,1.0-hex)*0.0;
        float d = distance(normalize(vP), normalize(uHit)); float wave = uK * smoothstep(0.6, 0.0, d) * (0.6+0.4*sin(d*40.0 - uT*20.0));
        vec3 c = vec3(0.0,0.75,1.0)*f*1.2 + vec3(1.0,0.2,0.5)*wave*2.0;
        gl_FragColor = vec4(c, clamp(f*0.9 + wave, 0.0, 1.0)); }`,
  }));
  g.add(shell);
  const wire = new THREE.LineSegments(new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.92, 1)), new THREE.LineBasicMaterial({ color: new THREE.Color(COLORS.cyan).multiplyScalar(1.5), transparent: true, opacity: 0.35, toneMapped: false }));
  g.add(wire);
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 0), MAT.chrome()); g.add(core);
  const coreGlow = new THREE.Mesh(new THREE.SphereGeometry(0.35, 24, 24), neon(COLORS.lime, 3)); g.add(coreGlow);
  const lt1 = label('try:', { font: mono(64), size: 64, color: '#5ff2ff', worldH: 0.3 }); lt1.position.set(0, 2.35, 0); g.add(lt1);
  const errs = ['ValueError', 'ZeroDivisionError', 'TypeError', 'KeyError'];
  const proj = new THREE.Mesh(new THREE.OctahedronGeometry(0.16), neon(COLORS.red, 6)); g.add(proj);
  proj.add(halo(COLORS.red, 1.2, 0.9));
  const el = label('ValueError', { font: mono(54), size: 54, color: '#ff7a8f', worldH: 0.24 }); g.add(el);
  const ex = label('except: tratado ✓', { font: mono(54), size: 54, color: '#b6ff7a', worldH: 0.26 }); ex.position.set(0, -2.35, 0); g.add(ex);
  return {
    group: g,
    update(lt, t) {
      const c = (lt % 2.6) / 2.6; const k = Math.floor(lt / 2.6);
      const ang = k * 2.1; const dir = V(Math.cos(ang), Math.sin(ang * 0.7) * 0.5, Math.sin(ang) * 0.6 + 0.5).normalize();
      const dist = c < 0.5 ? lerp(5, 1.95, c / 0.5) : lerp(1.95, 4.5, (c - 0.5) / 0.5);
      proj.position.copy(dir).multiplyScalar(dist);
      if (c >= 0.5) proj.position.add(V(0, -(c - 0.5) * 2, 0));
      el.position.copy(proj.position).add(V(0, 0.4, 0)); el.setText(errs[k % errs.length]);
      el.material.opacity = proj.material.opacity = c < 0.85 ? 1 : 1 - (c - 0.85) / 0.15;
      shell.material.uniforms.uT.value = t;
      shell.material.uniforms.uHit.value.copy(dir);
      shell.material.uniforms.uK.value = c > 0.48 ? Math.max(0, 1 - (c - 0.48) * 3) : 0;
      ex.material.opacity = c > 0.5 ? Math.min(1, (c - 0.5) * 5) : 0.25;
      core.rotation.set(t * 0.5, t * 0.7, 0); wire.rotation.y = t * 0.1;
    },
  };
};

B.modules = () => {
  const g = new THREE.Group();
  const names = ['math', 'random', 'time', 'json', 'os', 'datetime', 'pygame', 'sys'];
  const cubes = [];
  let i = 0;
  for (const x of [-0.5, 0.5]) for (const y of [-0.5, 0.5]) for (const z of [-0.5, 0.5]) {
    const c = new THREE.Group();
    const m = new THREE.Mesh(new RoundedBoxGeometry(0.92, 0.92, 0.92, 4, 0.08), i % 3 === 0 ? MAT.gold() : MAT.chrome()); c.add(m);
    c.add(neonEdges(new THREE.BoxGeometry(0.93, 0.93, 0.93), i % 2 ? COLORS.mag : COLORS.cyan, 0.01, 3));
    const l = label(names[i], { font: mono(54), size: 54, color: '#ffffff', bg: 'rgba(5,10,30,0.8)', worldH: 0.24 }); l.position.z = 0.5; c.add(l);
    c.userData.home = V(x, y, z); c.userData.l = l;
    g.add(c); cubes.push(c); i++;
  }
  const im = label('import', { font: mono(80), size: 80, color: '#5ff2ff', worldH: 0.38 }); im.position.y = 1.95; g.add(im);
  return {
    group: g,
    update(lt, t) {
      const c = (lt % 5) / 5;
      const spread = c < 0.5 ? smooth(c / 0.25) : 1 - easeOutBack((c - 0.6) / 0.3) * 1.0;
      cubes.forEach((cu, k) => {
        const h = cu.userData.home;
        cu.position.copy(h).multiplyScalar(1 + Math.max(0, spread) * 1.9);
        cu.rotation.set(spread * Math.sin(k) * 0.8, spread * Math.cos(k) * 0.8, 0);
        cu.userData.l.material.opacity = 0.2 + Math.max(0, spread) * 0.8;
      });
      g.rotation.y += t * 0.3; g.rotation.x = 0.35;
    },
  };
};

B.d20 = () => {
  const g = new THREE.Group();
  const geo = new THREE.IcosahedronGeometry(1.35, 0);
  const die = new THREE.Group();
  die.add(new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: 0x6a3cff, metalness: 0.4, roughness: 0.08, clearcoat: 1, envMapIntensity: 2, transparent: true, opacity: 0.55, emissive: 0x3a1080, emissiveIntensity: 0.6, flatShading: true })));
  die.add(neonEdges(geo, COLORS.mag, 0.02, 3.5));
  const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 0), neon(COLORS.cyan, 3)); die.add(core);
  g.add(die);
  const num = label('13', { size: 160, color: '#ffffff', worldH: 0.8, glow: 40 }); num.position.set(0, 0, 1.6); g.add(num);
  const tl = label('random.randint(1, 20)', { font: mono(56), size: 56, color: '#ff8cef', worldH: 0.26 }); tl.position.y = -2.0; g.add(tl);
  const ped = pedestal(1.4); g.add(ped);
  const sparks = orbitDots(18, 2.1, COLORS.amber, 0.04); g.add(sparks);
  return {
    group: g,
    update(lt, t) {
      const c = (lt % 4.5) / 4.5;
      const roll = c < 0.55;
      const sp = roll ? 1 - c / 0.55 : 0;
      die.rotation.x += 0; die.rotation.set(t * 0.3 + sp * sp * 8 * c, t * 0.4 + sp * 6 * c, 0);
      die.position.y = roll ? Math.abs(Math.sin(c * 14)) * 0.5 * (1 - c / 0.55) : 0;
      const r = rng(Math.floor(lt * 18) + 3)();
      num.setText(roll ? String(1 + Math.floor(r * 20)) : String([13, 7, 20, 4][Math.floor(lt / 4.5) % 4]), roll ? '#9fbcff' : '#ffffff');
      num.material.opacity = roll ? 0.6 : 1;
      sparks.rotation.y = t * 0.6; sparks.rotation.x = 0.4;
    },
  };
};

B.trophy = () => {
  const g = new THREE.Group();
  const pts = [];
  const prof = [[0, -1.6], [0.95, -1.6], [0.95, -1.4], [0.35, -1.3], [0.22, -0.9], [0.2, -0.35], [0.35, -0.2], [0.85, 0.2], [1.05, 0.9], [1.08, 1.4], [1.02, 1.42], [0.96, 0.92], [0.78, 0.3], [0, 0.1]];
  prof.forEach(([x, y]) => pts.push(new THREE.Vector2(x, y)));
  const cup = new THREE.Mesh(new THREE.LatheGeometry(pts, 96), MAT.gold()); g.add(cup);
  const hand = (s) => { const h = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.07, 16, 48, Math.PI * 1.2), MAT.gold()); h.position.set(s * 1.05, 0.75, 0); h.rotation.z = s > 0 ? -Math.PI * 0.6 : Math.PI * 1.6; if (s < 0) h.rotation.y = Math.PI; g.add(h); };
  hand(1); hand(-1);
  const base = new THREE.Mesh(new RoundedBoxGeometry(1.7, 0.4, 1.7, 4, 0.06), MAT.dark()); base.position.y = -1.85; g.add(base);
  const be = neonEdges(new THREE.BoxGeometry(1.72, 0.42, 1.72), COLORS.cyan, 0.012, 3.5); be.position.y = -1.85; g.add(be);
  const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.32), neon(COLORS.amber, 2.5)); star.position.y = 2.0; g.add(star);
  star.add(halo(COLORS.amber, 2.0, 0.4));
  const r1 = ring(2.3, 0.02, COLORS.cyan, 3); r1.rotation.x = Math.PI / 2; g.add(r1);
  const r2 = ring(2.6, 0.012, COLORS.mag, 3); r2.rotation.x = Math.PI / 2.3; g.add(r2);
  const sparks = orbitDots(30, 2.4, COLORS.amber, 0.04); g.add(sparks);
  g.add(halo(COLORS.amber, 6, 0.1));
  return {
    group: g,
    update(lt, t) {
      cup.rotation.y = t * 0.5; star.rotation.y = t * 2; star.position.y = 2.0 + Math.sin(t * 2) * 0.1;
      r1.rotation.z = t * 0.4; r2.rotation.z = -t * 0.3; sparks.rotation.y = -t * 0.5; sparks.rotation.x = Math.sin(t * 0.3) * 0.3;
    },
  };
};

export function buildHero(key) {
  const fn = B[key] || B.core;
  const h = fn();
  const g = h.group;
  const outer = new THREE.Group(); outer.add(g);
  return {
    group: outer,
    update(lt, t, sc) {
      // alguns heróis somam deslocamentos em g: zera a base a cada quadro (determinístico)
      g.position.set(0, 0, 0); g.rotation.set(0, 0, 0);
      h.update(lt, t, sc);
    },
  };
}
