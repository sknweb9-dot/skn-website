/**
 * Screenshot generated prototype pages for visual review.
 *
 *   $env:NODE_PATH = "$env:LOCALAPPDATA\npm-cache\_npx\e78b33305587cb7c\node_modules"
 *   node prototype/shots.js [page.html ...]
 *
 * Serves prototype/out over http so relative asset paths resolve, then writes
 * full-page screenshots to prototype/review/. Reports console errors, failed
 * requests and horizontal overflow.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.join(__dirname, 'out');
const OUT = path.join(__dirname, 'review');
const PORT = 8123;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.json': 'application/json', '.xml': 'application/xml'
};

const args = process.argv.slice(2);
const pages = args.length ? args : fs.readdirSync(ROOT).filter((f) => f.endsWith('.html'));
const VIEWPORTS = process.env.MOBILE
  ? [{ n: 'mobile', w: 390, h: 844, scale: 2 }]
  : [{ n: 'desktop', w: 1440, h: 900, scale: 1 }];

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

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.w, height: vp.h },
      deviceScaleFactor: vp.scale,
      isMobile: vp.n === 'mobile',
      hasTouch: vp.n === 'mobile'
    });
    const page = await ctx.newPage();
    page.on('console', (m) => {
      if (m.type() === 'error') problems.push(`[console] ${m.text()}`);
    });
    page.on('pageerror', (e) => problems.push(`[pageerror] ${e.message}`));
    page.on('requestfailed', (r) => {
      if (!/fonts\.g|ytimg|youtube/.test(r.url())) problems.push(`[failed] ${r.url()}`);
    });

    for (const f of pages) {
      const slug = f.replace(/\.html$/, '');
      await page.goto(`http://localhost:${PORT}/${f}`, { waitUntil: 'load', timeout: 30000 });
      await page.evaluate(() => document.fonts && document.fonts.ready);
      await page.evaluate(() => new Promise((r) => {
        let y = 0;
        const t = setInterval(() => {
          window.scrollBy(0, 900); y += 900;
          if (y >= document.body.scrollHeight) { clearInterval(t); r(); }
        }, 30);
      }));
      await page.waitForTimeout(350);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(250);
      await page.screenshot({ path: path.join(OUT, `${vp.n}-${slug}.png`), fullPage: true });

      const over = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (over > 2) problems.push(`[overflow] ${vp.n}/${slug}: +${over}px`);
      console.log(`shot ${vp.n}-${slug}`);
    }
    await ctx.close();
  }

  await browser.close();
  server.close();
  if (problems.length) {
    console.log('\nPROBLEMS:');
    [...new Set(problems)].forEach((p) => console.log('  ' + p));
  } else {
    console.log('\nno console errors, failed requests or horizontal overflow');
  }
})();
