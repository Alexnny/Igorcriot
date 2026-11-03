// Motor de tempo determinístico: tudo no vídeo é função do tempo t.
import { MISSIONS } from './content.js';

export const TITLE_DUR = 4.4;     // cartão de título da missão
const PANEL_IN = 0.9;
const TYPE_CPS = 30;              // caracteres por segundo digitando
const OUT_LINE = 0.32;            // intervalo entre linhas da saída
const TIP_DUR = 7.5;
const OUTRO = 1.1;

export const readTime = (s) => 1.5 + s.length / 19;

function charSchedule(code) {
  // tempo (relativo) em que cada caractere aparece; indentação é instantânea
  const times = new Float32Array(code.length);
  let t = 0, lineStart = true;
  for (let i = 0; i < code.length; i++) {
    const c = code[i];
    if (c === '\n') { t += 0.16; lineStart = true; }
    else if (c === ' ' && lineStart) { /* indentação instantânea */ }
    else { lineStart = false; t += 1 / TYPE_CPS; }
    times[i] = t;
  }
  return { times, dur: t };
}

export function buildTimeline() {
  const scenes = [];
  const events = [];
  let T = 0;
  const ev = (t, type, extra) => events.push({ t: +t.toFixed(3), type, ...extra });

  // ---- Abertura
  scenes.push({ kind: 'opening', hero: 'title3d', start: T, dur: 12 });
  ev(T + 0.2, 'boot'); ev(T + 2.2, 'impact'); ev(T + 5.0, 'whoosh'); ev(T + 6.4, 'title');
  T += 12;

  // ---- Mapa das missões
  const mapDur = 13;
  scenes.push({ kind: 'map', hero: 'core', start: T, dur: mapDur });
  ev(T, 'whoosh');
  MISSIONS.forEach((m, i) => ev(T + 1.4 + i * 0.22, 'blip', { soft: 1 }));
  T += mapDur;

  // ---- Missões
  let xpTotal = 0;
  MISSIONS.forEach((m, mi) => {
    const s = { kind: 'mission', mission: m, index: mi, hero: m.hero, start: T };
    let lt = 0;
    ev(T + lt, 'whoosh'); ev(T + 0.5, 'title');
    lt = TITLE_DUR;
    s.panelIn = lt;
    lt += PANEL_IN;
    s.points = m.points.map((p) => {
      const at = lt;
      const r = readTime(p.h + ' ' + p.t);
      ev(T + at, 'point');
      lt += r;
      return { at, dur: r };
    });
    lt += 0.4;
    s.codeIn = lt;
    ev(T + lt, 'swoosh');
    lt += PANEL_IN;
    s.examples = m.examples.map((e, ei) => {
      const ex = { label: e.label, code: e.code, out: e.out };
      ex.start = lt;
      const sch = charSchedule(e.code);
      ex.typeStart = lt + 0.5;
      ex.times = sch.times;
      ex.typeEnd = ex.typeStart + sch.dur;
      for (let i = 0; i < e.code.length; i += 1) {
        const c = e.code[i];
        if (c !== ' ' && c !== '\n' && i % 2 === 0) ev(T + ex.typeStart + sch.times[i], 'key');
      }
      ex.run = ex.typeEnd + 0.55;
      ev(T + ex.run, 'run');
      const outLines = e.out.split('\n');
      ex.outLines = outLines.length;
      outLines.forEach((_, li) => ev(T + ex.run + 0.45 + li * OUT_LINE, 'line'));
      const codeLines = e.code.split('\n').length;
      ex.end = ex.run + 0.45 + outLines.length * OUT_LINE + 2.4 + outLines.length * 0.35 + codeLines * 0.22;
      lt = ex.end;
      if (ei < m.examples.length - 1) lt += 0.7; // transição entre exemplos
      return ex;
    });
    s.tipAt = lt;
    ev(T + lt, 'tip');
    s.achieveAt = lt + 1.0;
    ev(T + s.achieveAt, 'achieve');
    xpTotal += m.xp;
    s.xpAfter = xpTotal;
    s.xpBefore = xpTotal - m.xp;
    lt += TIP_DUR;
    s.outroAt = lt;
    lt += OUTRO;
    s.dur = lt;
    scenes.push(s);
    T += lt;
  });

  // ---- Final
  scenes.push({ kind: 'finale', hero: 'trophy', start: T, dur: 22, xpTotal });
  ev(T, 'whoosh'); ev(T + 0.8, 'impact'); ev(T + 1.6, 'fanfare');
  [0, 1, 2, 3].forEach((i) => ev(T + 7 + i * 0.9, 'point'));
  T += 22;

  return { scenes, events, duration: T, xpTotal };
}

export function sceneAt(tl, t) {
  const { scenes } = tl;
  let lo = 0, hi = scenes.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (scenes[mid].start <= t) lo = mid; else hi = mid - 1;
  }
  return lo;
}

// ---------- utilidades de animação
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, k) => a + (b - a) * k;
export const smooth = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
export const easeOut = (x) => 1 - Math.pow(1 - clamp(x), 3);
export const easeOutExpo = (x) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(x)));
export const easeInOut = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const easeOutBack = (x) => { x = clamp(x); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
// progresso de entrada (0→1) iniciando em a com duração d
export const prog = (t, a, d) => clamp((t - a) / d);
// janela: entra em a, sai em b
export const win = (t, a, b, fin = 0.5, fout = 0.5) => Math.min(smooth((t - a) / fin), 1 - smooth((t - (b - fout)) / fout));
