import { World } from './world.js';
import { Overlay } from './overlay.js';
import { buildTimeline, sceneAt } from './timeline.js';
import { MISSIONS } from './content.js';

const params = new URLSearchParams(location.search);
const RENDER = params.has('render');
document.body.classList.toggle('render', RENDER);

const tl = buildTimeline();
const stage = document.getElementById('stage');
const canvas = document.getElementById('gl');
const world = new World(canvas, { render: RENDER });
const overlay = new Overlay(stage, tl);

// ---------------------------------------------------------------- layout (palco 1920x1080 escalado)
let scale = 1;
function layout() {
  const W = window.innerWidth, H = window.innerHeight;
  scale = Math.min(W / 1920, H / 1080);
  stage.style.transform = `translate(${(W - 1920 * scale) / 2}px, ${(H - 1080 * scale) / 2}px) scale(${scale})`;
  const dpr = RENDER ? (parseFloat(params.get('gl')) || 1) : Math.min(window.devicePixelRatio || 1, 1.5);
  const q = RENDER ? 1 : quality;
  const pw = Math.round(1920 * scale * dpr * q), ph = Math.round(1080 * scale * dpr * q);
  world.resize(pw, ph);
  canvas.style.width = '1920px'; canvas.style.height = '1080px';
}
let quality = 1;
window.addEventListener('resize', layout);

function frame(t) {
  const si = sceneAt(tl, t);
  overlay.update(t, si);
  world.update(t, tl, si);
  world.render();
}

async function prewarm() {
  await document.fonts.ready;
  await Promise.all(['700 64px Orbitron', '900 64px Orbitron', '700 64px "JetBrains Mono"', '500 40px "JetBrains Mono"', '600 30px "JetBrains Mono"', '600 24px Rajdhani', '900 64px "Exo 2"', '700 20px "Exo 2"', '800 20px "Exo 2"', '600 20px "Exo 2"', '500 20px "Exo 2"'].map((f) => document.fonts.load(f)));
  const keys = [...new Set(tl.scenes.map((s) => s.hero))];
  keys.forEach((k) => world.hero(k));
  world.renderer.compile(world.scene, world.camera);
}

// ---------------------------------------------------------------- MODO RENDER (exportação de vídeo)
if (RENDER) {
  layout();
  window.__timeline = { duration: tl.duration, events: tl.events, chapters: chapters() };
  window.__ready = prewarm().then(() => { frame(0); return true; });
  window.__frame = (t) => { frame(t); return true; };
  window.__world = world;
} else {
  startPlayer();
}

function chapters() {
  return tl.scenes.map((s) => ({
    t: s.start,
    title: s.kind === 'opening' ? 'Abertura' : s.kind === 'map' ? 'Mapa da missão' : s.kind === 'finale' ? 'Conclusão e próximos passos' : `${String(s.index + 1).padStart(2, '0')} · ${s.mission.title}`,
  }));
}

// ---------------------------------------------------------------- PLAYER INTERATIVO
function startPlayer() {
  layout();
  const ui = document.getElementById('ui');
  const audio = document.getElementById('music');
  const chs = chapters();
  const $ = (s) => ui.querySelector(s);
  let t = parseFloat(params.get('t') || '0') || 0;
  let playing = false, speed = 1, last = performance.now(), muted = false;
  let started = false;

  // marcadores de capítulos
  const bar = $('.pbar'), fill = $('.pfill'), knob = $('.pknob'), tip = $('.ptip');
  chs.forEach((c) => { const i = document.createElement('i'); i.style.left = (c.t / tl.duration) * 100 + '%'; bar.appendChild(i); });
  const list = $('.chlist');
  list.innerHTML = chs.map((c, i) => `<button data-i="${i}"><span>${fmt(c.t)}</span>${c.title}</button>`).join('');
  list.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; seek(chs[+b.dataset.i].t + 0.01); list.classList.remove('open'); if (!playing) play(); });

  function fmt(s) { return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`; }
  function seek(nt) {
    t = Math.max(0, Math.min(tl.duration - 0.01, nt));
    if (audio && audio.readyState > 0) { try { audio.currentTime = t; } catch (e) { /* */ } }
  }
  function play() {
    playing = true; started = true; document.body.classList.add('started');
    ui.classList.add('playing');
    last = performance.now();
    if (audio) { audio.playbackRate = speed; try { audio.currentTime = t; } catch (e) { /* */ } audio.play().catch(() => {}); }
  }
  function pause() { playing = false; ui.classList.remove('playing'); audio?.pause(); }
  const toggle = () => (playing ? pause() : play());
  const curChapter = () => { let k = 0; chs.forEach((c, i) => { if (t >= c.t - 0.05) k = i; }); return k; };

  document.getElementById('start').addEventListener('click', () => { document.getElementById('start').classList.add('gone'); play(); });
  $('.b-play').addEventListener('click', toggle);
  $('.b-prev').addEventListener('click', () => { const k = curChapter(); seek(t - chs[k].t > 2 ? chs[k].t : chs[Math.max(0, k - 1)].t); });
  $('.b-next').addEventListener('click', () => { const k = curChapter(); if (k < chs.length - 1) seek(chs[k + 1].t + 0.01); });
  $('.b-ch').addEventListener('click', (e) => { e.stopPropagation(); list.classList.toggle('open'); });
  $('.b-mute').addEventListener('click', () => { muted = !muted; if (audio) audio.muted = muted; $('.b-mute').classList.toggle('off', muted); });
  $('.b-speed').addEventListener('click', () => { const sp = [1, 1.25, 1.5, 0.75]; speed = sp[(sp.indexOf(speed) + 1) % sp.length]; $('.b-speed').textContent = speed + 'x'; if (audio) audio.playbackRate = speed; });
  $('.b-full').addEventListener('click', () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.(); });
  $('.b-hq').addEventListener('click', () => { quality = quality === 1 ? 0.66 : 1; $('.b-hq').textContent = quality === 1 ? 'HD' : 'SD'; layout(); });

  const posFrom = (e) => { const r = bar.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); };
  let drag = false;
  bar.addEventListener('pointerdown', (e) => { drag = true; bar.setPointerCapture(e.pointerId); seek(posFrom(e) * tl.duration); });
  bar.addEventListener('pointermove', (e) => {
    const p = posFrom(e); const tt = p * tl.duration; let k = 0; chs.forEach((c, i) => { if (tt >= c.t) k = i; });
    tip.textContent = `${fmt(tt)} · ${chs[k].title}`; tip.style.left = p * 100 + '%';
    if (drag) seek(tt);
  });
  bar.addEventListener('pointerup', () => { drag = false; });

  // copiar código do exemplo atual
  stage.addEventListener('click', (e) => {
    const b = e.target.closest('.ed-copy'); if (!b) return;
    const sc = tl.scenes[sceneAt(tl, t)]; if (sc.kind !== 'mission') return;
    const lt = t - sc.start; let ex = sc.examples[0]; sc.examples.forEach((x) => { if (lt >= x.start - 0.35) ex = x; });
    navigator.clipboard?.writeText(ex.code).then(() => { b.textContent = 'COPIADO ✓'; setTimeout(() => { b.textContent = 'COPIAR'; }, 1500); });
  });

  // teclado
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.key === 'k') { e.preventDefault(); if (!started) document.getElementById('start').click(); else toggle(); }
    if (e.key === 'ArrowRight') seek(t + 5);
    if (e.key === 'ArrowLeft') seek(t - 5);
    if (e.key === 'n' || e.key === 'N' || e.key === 'PageDown') $('.b-next').click();
    if (e.key === 'p' || e.key === 'P' || e.key === 'PageUp') $('.b-prev').click();
    if (e.key === 'f' || e.key === 'F') $('.b-full').click();
    if (e.key === 'm' || e.key === 'M') $('.b-mute').click();
  });

  // auto-ocultar controles
  let idle;
  const wake = () => { ui.classList.add('awake'); clearTimeout(idle); idle = setTimeout(() => ui.classList.remove('awake'), 2600); };
  window.addEventListener('pointermove', (e) => {
    wake();
    world._mx = (e.clientX / window.innerWidth) * 2 - 1; world._my = -((e.clientY / window.innerHeight) * 2 - 1);
  });
  document.addEventListener('click', () => list.classList.remove('open'));

  // medição de desempenho → reduz resolução automaticamente se necessário
  let slow = 0;
  prewarm().then(() => {
    document.getElementById('start').classList.add('ready');
    const loop = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      if (playing) {
        if (audio && !audio.paused && audio.readyState >= 2 && !muted && Math.abs(audio.currentTime - t) < 1.5) t = audio.currentTime;
        else t += dt * speed;
        if (t >= tl.duration) { t = tl.duration - 0.01; pause(); }
        if (dt > 0.05) slow++; else slow = Math.max(0, slow - 1);
        if (slow > 90 && quality === 1) { quality = 0.66; $('.b-hq').textContent = 'SD'; layout(); slow = 0; }
      }
      world.mouse.x += ((world._mx || 0) - world.mouse.x) * 0.04;
      world.mouse.y += ((world._my || 0) - world.mouse.y) * 0.04;
      frame(t);
      const p = t / tl.duration;
      fill.style.width = p * 100 + '%'; knob.style.left = p * 100 + '%';
      $('.ptime').textContent = `${fmt(t)} / ${fmt(tl.duration)}`;
      $('.pch').textContent = chs[curChapter()].title;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
  window.__player = { seek, play, pause, get t() { return t; } };
}

export { tl, MISSIONS };
