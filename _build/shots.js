/**
 * Screenshot the built site for visual review.
 *   node _build/shots.js
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, '_research', 'build-shots');
const PORT = 8099;

const PAGES = ['index', 'about', 'shanti-kala-nikketan', 'founders', 'team',
  'logo', 'gurukulam', 'events', 'photos', 'videos', 'contact', '404'];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.xml': 'application/xml',
  '.txt': 'text/plain'
};

function serve() {
  return http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p === '/') p = '/index.html';
    const file = path.join(ROOT, p);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404); res.end('not found'); return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  }).listen(PORT);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const server = serve();
  const browser = await chromium.launch();
  const problems = [];

  for (const vp of [{ n: 'desktop', w: 1440, h: 900 }, { n: 'mobile', w: 390, h: 844 }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h } });
    const page = await ctx.newPage();

    page.on('console', (m) => {
      if (m.type() === 'error') problems.push(`[console] ${page.url()} :: ${m.text()}`);
    });
    page.on('pageerror', (e) => problems.push(`[pageerror] ${page.url()} :: ${e.message}`));
    page.on('requestfailed', (r) => {
      if (!r.url().includes('fonts.g') && !r.url().includes('ytimg') && !r.url().includes('google.com/maps')) {
        problems.push(`[404] ${r.url()}`);
      }
    });

    for (const slug of PAGES) {
      await page.goto(`http://localhost:${PORT}/${slug}.html`, { waitUntil: 'load', timeout: 30000 });
      await page.evaluate(() => new Promise((r) => {
        let y = 0;
        const t = setInterval(() => {
          window.scrollBy(0, 800); y += 800;
          if (y >= document.body.scrollHeight) { clearInterval(t); r(); }
        }, 60);
      }));
      await page.waitForTimeout(600);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(400);
      await page.screenshot({ path: path.join(OUT, `${vp.n}-${slug}.png`), fullPage: true });

      // horizontal overflow check
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (overflow > 2) problems.push(`[overflow] ${vp.n}/${slug}: +${overflow}px horizontal`);
    }
    await ctx.close();
  }

  await browser.close();
  server.close();

  if (problems.length) {
    console.log('PROBLEMS:');
    [...new Set(problems)].forEach((p) => console.log('  ' + p));
  } else {
    console.log('no console errors, failed requests or horizontal overflow');
  }
})();
