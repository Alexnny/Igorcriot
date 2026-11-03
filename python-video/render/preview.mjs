// Gera capturas de tela em tempos específicos (para conferência visual).
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [,, outDir = 'preview', ...times] = process.argv;
const W = +(process.env.W || 1920), H = +(process.env.H || 1080);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.log('[console]', m.type(), m.text()); });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));
await page.goto(`http://localhost:${process.env.PORT || 8765}/index.html?render=1`);
await page.waitForFunction(() => window.__ready, null, { timeout: 120000 });
await page.evaluate(() => window.__ready);
const info = await page.evaluate(() => ({ d: window.__timeline.duration, ch: window.__timeline.chapters }));
console.log('duration', info.d.toFixed(1), 's =', (info.d / 60).toFixed(2), 'min');
if (process.env.CH) console.log(info.ch.map((c) => `${c.t.toFixed(1)} ${c.title}`).join('\n'));
const fs = await import('fs'); fs.mkdirSync(outDir, { recursive: true });
for (const t of times) {
  const t0 = Date.now();
  await page.evaluate((tt) => window.__frame(tt), +t);
  await page.screenshot({ path: `${outDir}/t${String(t).padStart(7, '0')}.jpg`, type: 'jpeg', quality: 88 });
  console.log('t', t, 'ms', Date.now() - t0);
}
await browser.close();
