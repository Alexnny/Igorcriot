// Renderiza o vídeo quadro a quadro (determinístico) em blocos paralelos e gera o MP4.
//
//   node render/render.mjs --fps 30 --workers 3 --out build
//
// Requisitos: servidor HTTP servindo a pasta python-video (ex.: python3 -m http.server 8765),
// Playwright + Chromium e ffmpeg. Blocos prontos são reaproveitados (pode interromper e retomar).
import { createRequire } from 'module';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const { chromium } = createRequire(import.meta.url)('playwright');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const FPS = +arg('fps', 30);
const WORKERS = +arg('workers', 3);
const OUT = arg('out', 'build');
const W = +arg('w', 1920), H = +arg('h', 1080);
const GL = +arg('gl', 0.667);
const CHUNK = +arg('chunk', 20); // segundos por bloco
const PORT = +arg('port', 8765);
const FROM = +arg('from', 0), TO = arg('to', null);
const CRF = arg('crf', '19');
const PRESET = arg('preset', 'medium');

fs.mkdirSync(path.join(OUT, 'chunks'), { recursive: true });
const ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-background-timer-throttling'];

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('[pageerror]', e.message));
  await page.goto(`http://localhost:${PORT}/index.html?render=1&gl=${GL}`);
  await page.waitForFunction(() => window.__ready, null, { timeout: 180000 });
  await page.evaluate(() => window.__ready);
  const cdp = await page.context().newCDPSession(page);
  return { page, cdp };
}

function encoder(file) {
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', PRESET, '-crf', CRF, '-pix_fmt', 'yuv420p', '-threads', '2', '-r', String(FPS), file], { stdio: ['pipe', 'inherit', 'inherit'] });
  return ff;
}

async function renderChunk(ctx, k, t0, t1) {
  const file = path.join(OUT, 'chunks', `c${String(k).padStart(4, '0')}.mp4`);
  const done = file + '.done';
  if (fs.existsSync(done)) return;
  const f0 = Math.round(t0 * FPS), f1 = Math.round(t1 * FPS);
  const ff = encoder(file + '.tmp.mp4');
  const closed = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg ' + c)))));
  const start = Date.now();
  // aquece estado (heróis com interpolação) renderizando alguns quadros antes do bloco
  for (let w = 8; w >= 1; w--) await ctx.page.evaluate((tt) => window.__frame(tt), Math.max(0, (f0 - w) / FPS));
  for (let f = f0; f < f1; f++) {
    await ctx.page.evaluate((tt) => window.__frame(tt), f / FPS);
    const { data } = await ctx.cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 93, optimizeForSpeed: true });
    const buf = Buffer.from(data, 'base64');
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await closed;
  fs.renameSync(file + '.tmp.mp4', file);
  fs.writeFileSync(done, '');
  const sec = (Date.now() - start) / 1000;
  console.log(`bloco ${k} [${t0.toFixed(1)}–${t1.toFixed(1)}s] ${f1 - f0} quadros em ${sec.toFixed(0)}s (${((f1 - f0) / sec).toFixed(2)} fps)`);
}

async function main() {
  const probe = await chromium.launch({ args: ARGS });
  const p = await openPage(probe);
  const tl = await p.page.evaluate(() => window.__timeline);
  await probe.close();
  const duration = TO ? Math.min(+TO, tl.duration) : tl.duration;
  fs.writeFileSync(path.join(OUT, 'timeline.json'), JSON.stringify(tl));
  const chunks = [];
  for (let t = 0, k = 0; t < duration; t += CHUNK, k++) if (t + CHUNK > FROM) chunks.push([k, t, Math.min(duration, t + CHUNK)]);
  console.log(`duração ${duration.toFixed(1)}s · ${chunks.length} blocos · ${WORKERS} workers · ${FPS} fps · ${W}x${H}`);
  const queue = chunks.slice();
  const t0 = Date.now();
  await Promise.all(Array.from({ length: WORKERS }, async (_, wi) => {
    const browser = await chromium.launch({ args: ARGS });
    let ctx = await openPage(browser);
    let n = 0;
    while (queue.length) {
      const [k, a, b] = queue.shift();
      try { await renderChunk(ctx, k, a, b); } catch (e) { console.error('erro no bloco', k, e.message); queue.push([k, a, b]); }
      // recicla a página periodicamente (evita acúmulo de memória)
      if (++n % 6 === 0) { await ctx.page.close(); ctx = await openPage(browser); }
      const left = queue.length;
      console.log(`  [w${wi}] restam ${left} blocos · ${((Date.now() - t0) / 60000).toFixed(1)} min decorridos`);
    }
    await browser.close();
  }));
  // concatena
  const all = fs.readdirSync(path.join(OUT, 'chunks')).filter((f) => f.endsWith('.mp4') && !f.includes('tmp')).sort();
  fs.writeFileSync(path.join(OUT, 'list.txt'), all.map((f) => `file 'chunks/${f}'`).join('\n'));
  console.log('blocos prontos:', all.length);
}

main().catch((e) => { console.error(e); process.exit(1); });
