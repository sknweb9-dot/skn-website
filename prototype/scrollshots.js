/**
 * Capture a page at successive scroll positions, to inspect scroll-linked
 * behaviour that a full-page screenshot cannot show.
 *
 *   node prototype/scrollshots.js sequence.html 10
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.join(__dirname, 'out');
const OUT = path.join(__dirname, 'review');
const PORT = 8124;
const PAGE = process.argv[2] || 'sequence.html';
const FRAMES = Number(process.argv[3] || 10);

const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.json': 'application/json' };

function serve() {
  return http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/index.html';
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
      res.writeHead(404); res.end('nope'); return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  }).listen(PORT);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const server = serve();
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const problems = [];
  page.on('pageerror', (e) => problems.push('[pageerror] ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') problems.push('[console] ' + m.text()); });

  await page.goto(`http://localhost:${PORT}/${PAGE}`, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts && document.fonts.ready);

  const total = await page.evaluate(() => document.body.scrollHeight - window.innerHeight);
  const stem = PAGE.replace(/\.html$/, '');

  for (let i = 0; i < FRAMES; i++) {
    const y = Math.round((total * i) / (FRAMES - 1));
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(220);
    await page.screenshot({ path: path.join(OUT, `scroll-${stem}-${String(i).padStart(2, '0')}.png`) });
  }

  // did the morph actually change the DOM, and is shape-outside applied?
  const probe = await page.evaluate(() => {
    const hands = [...document.querySelectorAll('[data-mudra-shape]')];
    return hands.map((h) => ({
      shape: (getComputedStyle(h).shapeOutside || '').slice(0, 34),
      paths: h.querySelectorAll('path').length,
      hasMask: !!h.querySelector('mask')
    }));
  });

  console.log(`captured ${FRAMES} frames of ${PAGE} (scroll range ${total}px)\n`);
  probe.forEach((p, i) => console.log(
    `  step ${i}: ${p.paths} paths, mask=${p.hasMask}, shape-outside=${p.shape || 'NONE'}`));
  if (problems.length) { console.log('\nPROBLEMS:'); problems.forEach((p) => console.log('  ' + p)); }
  else console.log('\nno page errors');

  await browser.close();
  server.close();
})();
