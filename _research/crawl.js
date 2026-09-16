/**
 * Rendered crawl of the live Wix site: full-page screenshots per viewport plus
 * a computed-style / asset report that the static HTML cannot give us.
 *
 *   $env:NODE_PATH = "$env:LOCALAPPDATA\npm-cache\_npx\e78b33305587cb7c\node_modules"
 *   node _research/crawl.js
 *
 * Resumable and concurrent. Screenshots that already exist are skipped, and
 * render_report.json is merged + rewritten after every page, so an interrupted
 * run never loses work. Set CONCURRENCY=1 to serialise for debugging.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'https://www.shantikalanikketan.com';
const PAGES = ['/', '/about', '/shanti-kala-nikketan', '/founder', '/director', '/team',
               '/logo', '/gurukulam', '/events', '/photos', '/videos', '/contact'];

const OUT = path.join(__dirname, 'shots');
const REPORT = path.join(__dirname, 'render_report.json');
const CONCURRENCY = Number(process.env.CONCURRENCY || 3);

const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
                   '(KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
// Wix serves its desktop layout unless the UA is genuinely mobile -- with a
// desktop UA at 390px the page just overflows horizontally to ~1164px.
const MOBILE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) ' +
                  'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, ua: DESKTOP_UA, mobile: false, scale: 1 },
  { name: 'mobile', width: 390, height: 844, ua: MOBILE_UA, mobile: true, scale: 2 }
];

fs.mkdirSync(OUT, { recursive: true });

const report = fs.existsSync(REPORT) ? JSON.parse(fs.readFileSync(REPORT, 'utf8')) : {};
const saveReport = () =>
  fs.writeFileSync(REPORT, JSON.stringify(report, null, 2));

const slugOf = (p) => (p === '/' ? 'home' : p.replace(/\//g, ''));

/** Jump-scroll to trigger lazy loading. Much faster than a timed interval. */
async function settle(page) {
  await page.evaluate(async () => {
    const step = Math.max(600, window.innerHeight);
    for (let y = 0; y < document.body.scrollHeight + 1500; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 40)));
    }
    window.scrollTo(0, 0);
  });
  // let newly-triggered image requests land
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(400);
}

async function collect(page) {
  return page.evaluate(() => {
    const imgs = [...document.querySelectorAll('img')]
      .filter((i) => i.naturalWidth > 120)
      .map((i) => ({ src: i.currentSrc || i.src, alt: i.alt, w: i.naturalWidth, h: i.naturalHeight }));
    const bgs = [...document.querySelectorAll('*')]
      .map((e) => getComputedStyle(e).backgroundImage)
      .filter((v) => v && v.includes('url('))
      .map((v) => (v.match(/url\(["']?(.*?)["']?\)/) || [])[1])
      .filter(Boolean);
    const fonts = {};
    const colors = {};
    [...document.querySelectorAll('h1,h2,h3,h4,p,span,a,li,div')].slice(0, 4000).forEach((e) => {
      const s = getComputedStyle(e);
      if (e.textContent && e.textContent.trim().length > 1) {
        const k = `${s.fontFamily.split(',')[0]} | ${s.fontWeight} | ${s.fontSize}`;
        fonts[k] = (fonts[k] || 0) + 1;
        colors[s.color] = (colors[s.color] || 0) + 1;
        const bg = s.backgroundColor;
        if (bg && bg !== 'rgba(0, 0, 0, 0)') colors['BG ' + bg] = (colors['BG ' + bg] || 0) + 1;
      }
    });
    return {
      title: document.title,
      height: document.body.scrollHeight,
      imgs,
      bgs: [...new Set(bgs)],
      headings: [...document.querySelectorAll('h1,h2,h3')]
        .map((h) => h.tagName + ': ' + h.innerText.trim().slice(0, 120))
        .filter((x) => x.length > 5),
      fonts: Object.entries(fonts).sort((a, b) => b[1] - a[1]).slice(0, 12),
      colors: Object.entries(colors).sort((a, b) => b[1] - a[1]).slice(0, 14),
      iframes: [...document.querySelectorAll('iframe')].map((f) => f.src).filter(Boolean),
      forms: document.querySelectorAll('form').length,
      inputs: [...document.querySelectorAll('input,textarea,select')]
        .map((i) => i.name || i.placeholder || i.type)
    };
  });
}

/** Build the work list, skipping anything already on disk. */
function tasks() {
  const list = [];
  for (const vp of VIEWPORTS) {
    for (const p of PAGES) {
      const slug = slugOf(p);
      const shot = path.join(OUT, `${vp.name}-${slug}.png`);
      const needShot = !fs.existsSync(shot);
      const needData = vp.name === 'desktop' && !report[slug];
      if (needShot || needData) list.push({ vp, p, slug, shot, needShot, needData });
    }
  }
  return list;
}

async function run(browser, task) {
  const ctx = await browser.newContext({
    viewport: { width: task.vp.width, height: task.vp.height },
    deviceScaleFactor: task.vp.scale,
    isMobile: task.vp.mobile,
    hasTouch: task.vp.mobile,
    userAgent: task.vp.ua
  });
  const page = await ctx.newPage();
  const label = `${task.vp.name}/${task.slug}`;
  const t0 = Date.now();

  try {
    try {
      await page.goto(BASE + task.p, { waitUntil: 'load', timeout: 60000 });
    } catch {
      await page.goto(BASE + task.p, { waitUntil: 'domcontentloaded', timeout: 45000 });
    }
    await settle(page);

    if (task.needShot) {
      await page.screenshot({ path: task.shot, fullPage: true });
    }
    if (task.needData) {
      report[task.slug] = await collect(page);
      saveReport();
    }
    const secs = ((Date.now() - t0) / 1000).toFixed(0);
    console.log(`OK   ${label.padEnd(28)} ${secs}s` +
                `${task.needShot ? ' shot' : ''}${task.needData ? ' data' : ''}`);
  } catch (e) {
    console.log(`FAIL ${label.padEnd(28)} ${e.message.split('\n')[0]}`);
  } finally {
    await ctx.close();
  }
}

(async () => {
  const queue = tasks();
  if (!queue.length) {
    console.log('nothing to do - all screenshots and report entries present');
    return;
  }
  console.log(`${queue.length} task(s) outstanding, concurrency ${CONCURRENCY}\n`);

  const browser = await chromium.launch();
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
      while (next < queue.length) await run(browser, queue[next++]);
    })
  );
  await browser.close();
  saveReport();

  const missing = tasks();
  console.log(`\nreport entries: ${Object.keys(report).length}/${PAGES.length}`);
  console.log(missing.length ? `STILL OUTSTANDING: ${missing.length}` : 'DONE - nothing outstanding');
})();
