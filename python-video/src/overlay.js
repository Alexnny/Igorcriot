import { MISSIONS, COURSE, FINALE } from './content.js';
import { tokenize, renderPartial, inlineMd } from './highlight.js';
import { clamp, smooth, easeOut, easeOutExpo, easeOutBack, prog, lerp } from './timeline.js';

const $ = (root, sel) => root.querySelector(sel);
const pad2 = (n) => String(n).padStart(2, '0');
const fmtXP = (n) => String(Math.round(n)).padStart(4, '0');
const fmtTime = (s) => `${pad2(Math.floor(s / 60))}:${pad2(Math.floor(s % 60))}`;
const css = (el, o) => { if (!el) return; for (const k in o) { const v = o[k]; if (el._c?.[k] !== v) { el.style[k] = v; (el._c ||= {})[k] = v; } } };
const show = (el, k, y = 0, x = 0, s = 1) => css(el, { opacity: String(+k.toFixed(3)), transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) scale(${s.toFixed(4)})`, visibility: k <= 0.001 ? 'hidden' : 'visible' });
const hexIcon = (txt) => `<span class="hex"><svg viewBox="0 0 40 46"><polygon points="20,1 39,12 39,34 20,45 1,34 1,12"/></svg><b>${txt}</b></span>`;

export class Overlay {
  constructor(stage, tl) {
    this.stage = stage; this.tl = tl;
    this.layer = $(stage, '#scene-layer');
    this.hud = $(stage, '#hud');
    this.cur = -1;
    this.buildHud();
  }

  buildHud() {
    const segs = MISSIONS.map((m, i) => `<i data-i="${i}" title="${m.title}"></i>`).join('');
    this.hud.innerHTML = `
      <div class="hud-top">
        <div class="brand">${hexIcon('Py')}<div><b>PY<span>//</span>ACADEMY</b><small>NEURAL LEARNING SYSTEM</small></div></div>
        <div class="segs"><div class="seg-row">${segs}</div><div class="seg-cap"><span id="hud-mission">BRIEFING</span><span id="hud-pct">0%</span></div></div>
        <div class="stats">
          <div class="stat"><small>NÍVEL</small><b id="hud-lvl">01</b></div>
          <div class="stat xp"><small>XP</small><b id="hud-xp">0000</b></div>
          <div class="stat"><small>TEMPO</small><b id="hud-time">00:00</b></div>
        </div>
      </div>
      <div class="hud-bottom">
        <div class="sys"><span class="dot"></span> SISTEMA ONLINE <em>·</em> PYTHON 3.13 <em>·</em> <span id="hud-sys">CARREGANDO</span></div>
        <div class="bars">${Array.from({ length: 24 }, () => '<i></i>').join('')}</div>
        <div class="sys right"><span id="hud-fps">LINK 100%</span> <em>·</em> <span id="hud-hex">0x00FF</span></div>
      </div>
      <div class="corner tl"></div><div class="corner tr"></div><div class="corner bl"></div><div class="corner br"></div>`;
    this.h = {
      segs: [...this.hud.querySelectorAll('.seg-row i')],
      mission: $(this.hud, '#hud-mission'), pct: $(this.hud, '#hud-pct'), lvl: $(this.hud, '#hud-lvl'), xp: $(this.hud, '#hud-xp'),
      time: $(this.hud, '#hud-time'), sys: $(this.hud, '#hud-sys'), fps: $(this.hud, '#hud-fps'), hex: $(this.hud, '#hud-hex'),
      bars: [...this.hud.querySelectorAll('.bars i')], top: $(this.hud, '.hud-top'), bottom: $(this.hud, '.hud-bottom'),
    };
  }

  // ------------------------------------------------------------------ construção por cena
  build(sc) {
    this.layer.innerHTML = '';
    const el = document.createElement('div');
    el.className = `scene scene-${sc.kind}`;
    if (sc.kind === 'opening') el.innerHTML = this.tplOpening();
    if (sc.kind === 'map') el.innerHTML = this.tplMap();
    if (sc.kind === 'mission') el.innerHTML = this.tplMission(sc);
    if (sc.kind === 'finale') el.innerHTML = this.tplFinale(sc);
    this.layer.appendChild(el);
    this.el = el;
    this.refs = {};
    el.querySelectorAll('[data-r]').forEach((n) => { this.refs[n.dataset.r] = n; });
    this.refs.all = (sel) => [...el.querySelectorAll(sel)];
    this.codeCache = {};
  }

  tplOpening() {
    const boot = ['INICIALIZANDO PY//ACADEMY OS v5.0', 'CARREGANDO MÓDULOS NEURAIS ........ OK', 'CALIBRANDO HOLOGRAMAS 3D .......... OK', 'CONECTANDO AO INTERPRETADOR ...... OK', 'MISSÃO: DOMINAR PYTHON ........ PRONTO'];
    return `
      <div class="boot" data-r="boot">${boot.map((b, i) => `<div data-r="b${i}"><span>&gt;</span> ${b}</div>`).join('')}</div>
      <div class="op-center">
        <div class="op-kicker" data-r="kick"><span></span>CURSO COMPLETO PARA INICIANTES<span></span></div>
        <div class="op-sub" data-r="sub">${COURSE.subtitle}</div>
        <div class="op-tag" data-r="tag">${COURSE.tagline}</div>
        <div class="op-start" data-r="start">▶ PRESS START</div>
      </div>
      <div class="op-flash" data-r="flash"></div>`;
  }

  tplMap() {
    const total = MISSIONS.reduce((s, m) => s + m.xp, 0);
    const cards = MISSIONS.map((m, i) => `
      <div class="mcard${i === 0 ? ' next' : ''}" data-r="c${i}">
        <div class="mc-top"><span class="mc-n">${pad2(i + 1)}</span><span class="mc-xp">+${m.xp} XP</span></div>
        <div class="mc-t">${m.title}</div>
        <div class="mc-b">${i === 0 ? '▶ PRÓXIMA' : '🔒 BLOQUEADA'}</div>
      </div>`).join('');
    return `
      <div class="map-head" data-r="head">
        <div class="kicker">SELEÇÃO DE FASE</div>
        <h1>MAPA DA MISSÃO</h1>
        <p>${MISSIONS.length} missões · ${total.toLocaleString('pt-BR')} XP disponíveis · 1 projeto final</p>
      </div>
      <div class="map-grid">${cards}</div>
      <div class="map-go" data-r="go">INICIANDO MISSÃO 01 <span>▸▸▸</span></div>`;
  }

  tplMission(sc) {
    const m = sc.mission, n = sc.index + 1;
    const pts = m.points.map((p, i) => `
      <li data-r="p${i}">${hexIcon(pad2(i + 1))}<div><h4>${inlineMd(p.h)}</h4><p>${inlineMd(p.t)}</p></div></li>`).join('');
    return `
      <div class="tcard" data-r="tcard">
        <div class="tc-k" data-r="tck"><span></span>MISSÃO ${pad2(n)} / ${MISSIONS.length}<span></span></div>
        <div class="tc-t" data-r="tct"><b data-text="${m.title}">${m.title}</b></div>
        <div class="tc-bar" data-r="tcbar"></div>
        <div class="tc-i" data-r="tci">${m.intro}</div>
        <div class="tc-xp" data-r="tcxp">RECOMPENSA: <b>+${m.xp} XP</b> · CONQUISTA <b>${m.badge}</b></div>
      </div>
      <div class="brief panel" data-r="brief">
        <div class="pn-head"><span class="pn-k">MISSÃO ${pad2(n)}</span><span class="pn-line"></span><span class="pn-xp">+${m.xp} XP</span></div>
        <h2>${m.title}</h2>
        <p class="intro">${m.intro}</p>
        <ul class="points">${pts}</ul>
        <div class="tip" data-r="tip">
          <div class="tip-h">${hexIcon('!')}<span>DICA PRO</span><i></i></div>
          <p>${inlineMd(m.tip)}</p>
        </div>
      </div>
      <div class="editor panel" data-r="editor">
        <div class="ed-head">
          <span class="dots"><i></i><i></i><i></i></span>
          <span class="tab">${m.file}</span>
          <span class="ed-label" data-r="exlabel"></span>
          <span class="ed-status" data-r="status">● EDITANDO</span>
          <button class="ed-copy" title="Copiar o código deste exemplo">COPIAR</button>
        </div>
        <div class="ed-body" data-r="edbody">
          <div class="gutter" data-r="gutter"></div>
          <pre class="code" data-r="code"></pre>
          <div class="ed-scan"></div>
        </div>
        <div class="term" data-r="term">
          <div class="term-h"><span>TERMINAL</span><b data-r="cmd">▸ python ${m.file}</b></div>
          <pre class="term-out" data-r="out"></pre>
        </div>
      </div>
      <div class="achieve" data-r="ach">
        <div class="ach-icon">${hexIcon('★')}</div>
        <div class="ach-txt"><small>CONQUISTA DESBLOQUEADA</small><b>${m.badge}</b><span>+${m.xp} XP · MISSÃO ${pad2(n)} COMPLETA</span></div>
        <div class="ach-shine" data-r="achshine"></div>
      </div>`;
  }

  tplFinale(sc) {
    const cards = FINALE.next.map((c, i) => `<div class="ncard" data-r="n${i}"><b>${pad2(i + 1)}</b><h4>${c.h}</h4><p>${c.t}</p></div>`).join('');
    return `
      <div class="fin-top">
        <div class="kicker" data-r="k">PARABÉNS, PROGRAMADOR(A)!</div>
        <h1 data-r="h"><b data-text="${FINALE.title}">${FINALE.title}</b></h1>
        <p data-r="s">${FINALE.subtitle}</p>
      </div>
      <div class="fin-stats" data-r="stats">
        <div><small>XP TOTAL</small><b data-r="xp">0</b></div>
        <div><small>MISSÕES</small><b>${MISSIONS.length}/${MISSIONS.length}</b></div>
        <div><small>RANK</small><b>PYTHONISTA</b></div>
      </div>
      <div class="fin-next" data-r="next"><div class="fin-nh">PRÓXIMAS MISSÕES</div><div class="ncards">${cards}</div></div>
      <div class="fin-end" data-r="end">Obrigado por assistir! Continue praticando — <b>todo expert já foi iniciante.</b></div>`;
  }

  // ------------------------------------------------------------------ atualização por tempo
  update(t, si) {
    const sc = this.tl.scenes[si];
    if (si !== this.cur) { this.cur = si; this.build(sc); }
    const lt = t - sc.start;
    this.updateHud(t, sc, lt);
    if (sc.kind === 'opening') this.upOpening(lt, sc);
    if (sc.kind === 'map') this.upMap(lt, sc);
    if (sc.kind === 'mission') this.upMission(lt, sc);
    if (sc.kind === 'finale') this.upFinale(lt, sc);
  }

  updateHud(t, sc, lt) {
    const H = this.h;
    let hk = 1;
    if (sc.kind === 'opening') hk = smooth((lt - 9.5) / 1.5);
    show(H.top, hk, (1 - hk) * -30); show(H.bottom, hk, (1 - hk) * 30);
    const mi = sc.kind === 'mission' ? sc.index : sc.kind === 'finale' ? MISSIONS.length : -1;
    H.segs.forEach((s, i) => {
      const cls = i < mi ? 'done' : i === mi ? 'cur' : '';
      if (s._cls !== cls) { s.className = cls; s._cls = cls; }
    });
    let xp = 0;
    if (sc.kind === 'mission') xp = lerp(sc.xpBefore, sc.xpAfter, easeOut((lt - sc.achieveAt - 0.3) / 1.4));
    if (sc.kind === 'finale') xp = sc.xpTotal;
    const txt = (el, v) => { if (el._t !== v) { el.textContent = v; el._t = v; } };
    txt(H.xp, fmtXP(xp));
    txt(H.lvl, pad2(Math.max(1, mi + 1 + (sc.kind === 'mission' && lt > sc.achieveAt ? 1 : 0))));
    txt(H.time, fmtTime(t));
    const pct = Math.round((t / this.tl.duration) * 100);
    txt(H.pct, pct + '%');
    txt(H.mission, sc.kind === 'mission' ? `MISSÃO ${pad2(sc.index + 1)} · ${sc.mission.title.toUpperCase()}` : sc.kind === 'map' ? 'MAPA DA MISSÃO' : sc.kind === 'finale' ? 'TODAS AS MISSÕES COMPLETAS' : 'BRIEFING');
    txt(H.sys, sc.kind === 'mission' ? `MÓDULO ${sc.mission.file}` : 'PRONTO');
    const f = Math.floor(t * 4);
    txt(H.fps, `LINK ${96 + (f * 7) % 4}%`);
    txt(H.hex, '0x' + ((f * 2654435761) >>> 0).toString(16).toUpperCase().slice(0, 6));
    H.bars.forEach((b, i) => { const v = 0.25 + 0.75 * Math.abs(Math.sin(t * 2.3 + i * 0.7) * Math.cos(t * 1.1 + i * 0.3)); css(b, { transform: `scaleY(${v.toFixed(2)})` }); });
  }

  upOpening(lt) {
    const R = this.refs;
    for (let i = 0; i < 5; i++) {
      const a = 0.3 + i * 0.75;
      const k = prog(lt, a, 0.25) * (1 - smooth((lt - 5.2) / 0.6));
      show(R['b' + i], k, 0, (1 - prog(lt, a, 0.25)) * -20);
    }
    show(R.flash, Math.max(0, 1 - Math.abs(lt - 2.2) * 3) * 0.0);
    const k1 = easeOut((lt - 5.6) / 1.0), k2 = easeOut((lt - 6.3) / 1.0), k3 = easeOut((lt - 7.2) / 1.0);
    const out = 1 - smooth((lt - 11.2) / 0.7);
    show(R.kick, k1 * out, (1 - k1) * 20);
    show(R.sub, k2 * out, (1 - k2) * 30, 0, 1 + (1 - k2) * 0.05);
    css(R.sub, { letterSpacing: `${lerp(40, 14, k2).toFixed(1)}px` });
    show(R.tag, k3 * out, (1 - k3) * 20);
    const st = lt > 8.4 ? (Math.floor(lt * 2.2) % 2 ? 1 : 0.35) : 0;
    show(R.start, st * out);
  }

  upMap(lt, sc) {
    const R = this.refs;
    const out = 1 - smooth((lt - (sc.dur - 0.9)) / 0.8);
    const kh = easeOut((lt - 0.3) / 0.9);
    show(R.head, kh * out, (1 - kh) * -30);
    MISSIONS.forEach((m, i) => {
      const k = easeOutBack((lt - 1.4 - i * 0.22) / 0.6);
      const o = clamp((lt - 1.4 - i * 0.22) / 0.4);
      show(R['c' + i], o * out, (1 - k) * 40, 0, 0.9 + 0.1 * k);
    });
    const kg = smooth((lt - 7.0) / 0.7);
    show(R.go, kg * out * (Math.floor(lt * 3) % 2 ? 1 : 0.6));
    if (R.c0) css(R.c0, { boxShadow: `0 0 ${(20 + 25 * Math.abs(Math.sin(lt * 3))).toFixed(0)}px rgba(0,229,255,.55), inset 0 0 30px rgba(0,229,255,.2)` });
  }

  upMission(lt, sc) {
    const R = this.refs;
    const m = sc.mission;
    const out = 1 - smooth((lt - sc.outroAt) / 0.8);

    // --- cartão de título
    const tIn = easeOutExpo((lt - 0.35) / 1.1);
    const tOut = 1 - smooth((lt - (sc.panelIn - 0.6)) / 0.6);
    const tk = Math.min(tIn, tOut);
    show(R.tcard, tk, (1 - tOut) * -40);
    show(R.tck, easeOut((lt - 0.3) / 0.6), (1 - easeOut((lt - 0.3) / 0.6)) * 20);
    const g = Math.max(0, 1 - (lt - 0.5) / 0.9);
    css(R.tct, { letterSpacing: `${lerp(30, 2, tIn).toFixed(1)}px`, filter: `blur(${(g * 8).toFixed(1)}px)` });
    css(R.tcbar, { transform: `scaleX(${easeOut((lt - 0.9) / 1.2).toFixed(3)})` });
    show(R.tci, easeOut((lt - 1.4) / 0.8), (1 - easeOut((lt - 1.4) / 0.8)) * 16);
    show(R.tcxp, easeOut((lt - 2.0) / 0.8), (1 - easeOut((lt - 2.0) / 0.8)) * 16);

    // --- painel de briefing
    const bk = easeOutExpo((lt - sc.panelIn) / 1.0);
    show(R.brief, bk * out, 0, (1 - bk) * -120 + (1 - out) * -80);
    const tipK = easeOut((lt - sc.tipAt) / 0.7);
    sc.points.forEach((p, i) => {
      const k = easeOut((lt - p.at) / 0.6);
      const el = R['p' + i];
      const active = lt >= p.at && (i === sc.points.length - 1 ? lt < sc.codeIn : lt < sc.points[i + 1].at);
      const dim = lt > sc.codeIn ? 0.78 : active ? 1 : 0.62;
      show(el, k * lerp(dim, 0.12, tipK), (1 - k) * 18, (1 - k) * -24);
      const cls = active ? 'on' : '';
      if (el._cls !== cls) { el.className = cls; el._cls = cls; }
    });
    show(R.tip, tipK, (1 - tipK) * 60, 0, 0.96 + 0.04 * tipK);

    // --- editor de código
    const ek = easeOutExpo((lt - sc.codeIn) / 1.0);
    show(R.editor, ek * out, 0, (1 - ek) * 160 + (1 - out) * 80);
    if (lt >= sc.codeIn - 0.2) this.upCode(lt, sc);

    // --- conquista
    const ak = easeOutBack((lt - sc.achieveAt) / 0.7);
    const aOut = 1 - smooth((lt - (sc.achieveAt + 4.6)) / 0.6);
    show(R.ach, clamp((lt - sc.achieveAt) / 0.3) * aOut * out, (1 - ak) * -90, 0, 0.9 + 0.1 * clamp(ak, 0, 1.2));
    css(R.achshine, { transform: `translateX(${lerp(-120, 520, clamp((lt - sc.achieveAt - 0.3) / 1.0)).toFixed(0)}px) skewX(-20deg)` });
  }

  upCode(lt, sc) {
    const R = this.refs;
    let ei = 0;
    for (let i = 0; i < sc.examples.length; i++) if (lt >= sc.examples[i].start - 0.35) ei = i;
    const ex = sc.examples[ei];
    if (!ex.toks) {
      ex.toks = tokenize(ex.code);
      ex.codeLines = ex.code.split('\n').length;
      ex.fs = Math.min(26, 640 / (1.55 * ex.codeLines + 1.45 * ex.outLines + 1.2));
      ex.outArr = ex.out.split('\n');
    }
    // transição entre exemplos (fade rápido)
    let fade = 1;
    if (ei > 0) fade = smooth((lt - (ex.start - 0.35)) / 0.35);
    const nextEx = sc.examples[ei + 1];
    if (nextEx) fade = Math.min(fade, 1 - smooth((lt - (nextEx.start - 0.7)) / 0.35));
    css(R.edbody, { opacity: fade.toFixed(3) }); css(R.term, { opacity: fade.toFixed(3) });

    const lbl = `EXEMPLO ${ei + 1}/${sc.examples.length} · ${ex.label}`;
    if (R.exlabel._t !== lbl) { R.exlabel.textContent = lbl; R.exlabel._t = lbl; }
    css(R.edbody, { fontSize: ex.fs.toFixed(1) + 'px' });
    css(R.term, { fontSize: (ex.fs * 0.95).toFixed(1) + 'px' });

    // caracteres digitados
    const rel = lt - ex.typeStart;
    let n = 0;
    if (rel > 0) { let lo = 0, hi = ex.times.length; while (lo < hi) { const mid = (lo + hi) >> 1; if (ex.times[mid] <= rel) lo = mid + 1; else hi = mid; } n = lo; }
    const typing = n < ex.code.length;
    const blink = Math.floor(lt * 2.4) % 2 === 0;
    const key = `${ei}:${n}:${typing || blink ? 1 : 0}`;
    if (this.codeCache.key !== key) {
      this.codeCache.key = key;
      const lines = renderPartial(ex.toks, n);
      const curLine = lines.length - 1;
      const showCursor = typing || blink;
      R.code.innerHTML = lines.map((l, i) => `<div class="ln${i === curLine ? ' cur' : ''}">${l || ''}${i === curLine && showCursor ? '<span class="caret"></span>' : ''}</div>`).join('');
      R.gutter.innerHTML = lines.map((_, i) => `<div>${i + 1}</div>`).join('');
    }
    // status
    const running = lt >= ex.run;
    const st = !running ? (typing ? '● DIGITANDO' : '● PRONTO') : '▶ EXECUTADO';
    if (R.status._t !== st) { R.status.textContent = st; R.status._t = st; R.status.className = 'ed-status' + (running ? ' run' : ''); }
    // saída do terminal
    const nl = running ? Math.floor((lt - ex.run - 0.45) / 0.32) + 1 : 0;
    const shown = clamp(nl, 0, ex.outArr.length);
    const okey = `${ei}:${shown}:${running ? 1 : 0}`;
    if (this.codeCache.okey !== okey) {
      this.codeCache.okey = okey;
      const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const lines = ex.outArr.slice(0, shown).map((l) => `<div>${esc(l).replace(/⟦(.*?)⟧/g, '<span class="usr">$1</span>')}</div>`);
      R.out.innerHTML = (running ? '' : '<div class="wait">aguardando execução…</div>') + lines.join('') + (running && shown >= ex.outArr.length ? '<div class="done">✓ processo finalizado · código 0</div>' : '');
    }
    css(R.cmd, { opacity: running ? '1' : '0.45' });
  }

  upFinale(lt, sc) {
    const R = this.refs;
    const k = easeOutExpo((lt - 0.8) / 1.2);
    show(R.k, easeOut((lt - 0.5) / 0.8));
    show(R.h, k, (1 - k) * 30, 0, 1 + (1 - k) * 0.15);
    css(R.h, { letterSpacing: `${lerp(40, 6, k).toFixed(1)}px` });
    show(R.s, easeOut((lt - 1.8) / 0.8), 0);
    const ks = easeOut((lt - 2.8) / 0.8);
    show(R.stats, ks, (1 - ks) * 30);
    const xp = Math.round(sc.xpTotal * easeOut((lt - 3.0) / 2.5));
    if (R.xp._t !== xp) { R.xp.textContent = xp.toLocaleString('pt-BR'); R.xp._t = xp; }
    show(R.next, easeOut((lt - 6.5) / 0.6));
    FINALE.next.forEach((_, i) => { const kk = easeOutBack((lt - 7 - i * 0.9) / 0.7); show(R['n' + i], clamp((lt - 7 - i * 0.9) / 0.4), (1 - kk) * 40); });
    const ke = easeOut((lt - 12.5) / 1.0);
    show(R.end, ke * (1 - smooth((lt - 20.8) / 1.0)), (1 - ke) * 20);
  }
}
