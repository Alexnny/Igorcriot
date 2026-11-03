import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import fontJson from 'three/examples/fonts/helvetiker_bold.typeface.json';

export const COLORS = { cyan: 0x00e5ff, mag: 0xff2bd6, violet: 0x7c4dff, lime: 0x8dff3b, amber: 0xffb020, red: 0xff3355, white: 0xffffff };

export function rng(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

let _glow;
export function glowTexture() {
  if (_glow) return _glow;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  _glow = new THREE.CanvasTexture(c);
  return _glow;
}

export function neon(color, intensity = 3, extra = {}) {
  return new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), toneMapped: false, ...extra });
}

export const MAT = {
  chrome: () => new THREE.MeshPhysicalMaterial({ color: 0xe6ecff, metalness: 1, roughness: 0.13, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1.25 }),
  gold: () => new THREE.MeshPhysicalMaterial({ color: 0xffc35a, metalness: 1, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.3 }),
  dark: () => new THREE.MeshPhysicalMaterial({ color: 0x141a2e, metalness: 0.85, roughness: 0.28, clearcoat: 0.8, clearcoatRoughness: 0.2 }),
  // vidro "falso" (sem passe de transmissão): reflexos fortes do ambiente + transparência — muito mais leve
  glass: (tint = 0x9ff6ff) => new THREE.MeshPhysicalMaterial({ color: tint, metalness: 0.1, roughness: 0.03, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 2.2, transparent: true, opacity: 0.3, emissive: tint, emissiveIntensity: 0.05, depthWrite: false, side: THREE.DoubleSide }),
  holo: (color = 0x00e5ff, opacity = 0.22) => new THREE.MeshPhysicalMaterial({ color, metalness: 0.2, roughness: 0.1, transparent: true, opacity, clearcoat: 1, envMapIntensity: 1.6, depthWrite: false, side: THREE.DoubleSide, emissive: color, emissiveIntensity: 0.25 }),
};

// Arestas grossas e brilhantes (cilindros em cada aresta) — leem muito bem com bloom
export function neonEdges(geometry, color = COLORS.cyan, radius = 0.025, intensity = 3.2, thresholdAngle = 1) {
  intensity *= 0.75;
  const edges = new THREE.EdgesGeometry(geometry, thresholdAngle);
  const pos = edges.attributes.position;
  const g = new THREE.Group();
  const mat = neon(color, intensity);
  const cyl = new THREE.CylinderGeometry(radius, radius, 1, 6, 1, true);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const count = pos.count / 2;
  const inst = new THREE.InstancedMesh(cyl, mat, count);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), mid = new THREE.Vector3(), dir = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    a.fromBufferAttribute(pos, i * 2); b.fromBufferAttribute(pos, i * 2 + 1);
    mid.addVectors(a, b).multiplyScalar(0.5); dir.subVectors(b, a);
    const len = dir.length(); dir.normalize();
    q.setFromUnitVectors(up, dir); s.set(1, len, 1);
    m.compose(mid, q, s); inst.setMatrixAt(i, m);
  }
  g.add(inst);
  // pontos de luz nos vértices
  return g;
}

// Sprite de texto (CanvasTexture) — com brilho opcional; texto pode ser atualizado
export function makeLabel(text, { size = 96, color = '#e9fbff', font, glow = 24, bg = null, border = null, pad = 28, worldH = 0.5 } = {}) {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false });
  const sp = new THREE.Sprite(mat);
  const f = font || `700 ${size}px Orbitron`;
  sp.setText = (txt, col = color) => {
    if (sp._txt === txt && sp._col === col) return;
    sp._txt = txt; sp._col = col;
    ctx.font = f;
    const w = Math.ceil(ctx.measureText(txt).width) + pad * 2 + glow * 2;
    const h = Math.ceil(size * 1.35) + pad + glow * 2;
    c.width = w; c.height = h;
    ctx.font = f; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (bg) {
      ctx.fillStyle = bg;
      const r = 18, x0 = glow, y0 = glow, ww = w - glow * 2, hh = h - glow * 2;
      ctx.beginPath(); ctx.roundRect(x0, y0, ww, hh, r); ctx.fill();
      if (border) { ctx.strokeStyle = border; ctx.lineWidth = 4; ctx.stroke(); }
    }
    ctx.shadowColor = col; ctx.shadowBlur = glow;
    ctx.fillStyle = col;
    ctx.fillText(txt, w / 2, h / 2 + size * 0.04);
    ctx.shadowBlur = 0; ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.55;
    ctx.fillText(txt, w / 2, h / 2 + size * 0.04);
    ctx.globalAlpha = 1;
    tex.needsUpdate = true;
    const aspect = w / h;
    sp.scale.set(worldH * aspect, worldH, 1);
  };
  sp.setText(text);
  return sp;
}

let _font;
export function font3d() { if (!_font) _font = new FontLoader().parse(fontJson); return _font; }
export function text3d(str, { size = 1, depth = 0.3, bevel = true, curve = 6 } = {}) {
  const g = new TextGeometry(str, {
    font: font3d(), size, depth, curveSegments: curve,
    bevelEnabled: bevel, bevelThickness: size * 0.06, bevelSize: size * 0.035, bevelSegments: 4,
  });
  g.computeBoundingBox();
  return g;
}

// textura de canvas com texto multi-linha (telas holográficas)
export function screenTexture(w = 1024, h = 640) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  return { c, ctx, tex };
}
