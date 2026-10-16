'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  WORD_STAGGER_MS,
  batchDelay,
  easeOutExpo,
  formatCount,
  parseCount,
  sequenceDelays,
  splitWords,
  type Count,
} from '@/lib/textMotion';

/**
 * TEXT MOTION
 * -----------
 * The engine behind the site's text entrances. The look lives in CSS (the "Text
 * motion" block in app/globals.css); this decides what moves, and when.
 *
 * Three kinds of text, three entrances, so the page is not one effect repeated:
 *   word   h1/h2 headlines. Each word is lifted out from behind a lintel.
 *   ink    eyebrows. A left-to-right wipe, like a line being written.
 *   sweep  everything else (paragraphs, list items, captions, sub-headings).
 *          A soft edge travels down the block, a few lines at a time.
 * Figures marked `data-count` also count up to their value as they arrive.
 *
 * THE SAFETY CONTRACT (the same one CurtainObserver keeps)
 * --------------------------------------------------------
 *   - Nothing is hidden by CSS alone. Text is lowered only by this script, only
 *     if it is still BELOW the fold when the page settles, and only until it
 *     scrolls in. Whatever is on screen at load stays exactly as rendered.
 *   - It is raised by an IntersectionObserver, which fires on wheel, touch,
 *     anchor jumps and find-in-page alike, with a debounced sweep behind it for
 *     anything the observer misses. Teardown puts every element back.
 *   - The first screen of each route is not handled here. It plays from CSS at
 *     first paint (PageHero, the home hero), so the largest text is never held
 *     back by hydration.
 *   - Reduced motion keeps the lowering and drops the movement: the CSS limits
 *     transitions to opacity, so text fades in, with no travel, no fan-out and
 *     no counting.
 *
 * THE HOME STAGE
 * --------------
 * On the stage one page shows at a time, so scroll position means nothing to the
 * text. There each page's text is lowered while the page is away and raised when
 * HomeStage marks the page `data-state="on"`, and lowered again once the page has
 * faded out, so it plays each time the page is arrived at.
 *
 * Opt out with `data-tx-skip` on any ancestor. Text that animates by CSS at load
 * carries `data-tx-static` so it is left alone here.
 */

type Role = 'word' | 'sweep' | 'ink';

type Item = {
  el: HTMLElement;
  role: Role;
  state: 'idle' | 'down' | 'up';
  /** The element's own text, kept for headlines and counted figures. */
  original: string | null;
  count: Count | null;
  words: number;
  timer: number | null;
  raf: number | null;
};

const DISPLAY = 'h1, h2';
const BLOCKS = 'p, h3, h4, h5, blockquote, figcaption, li, dt, dd';
const CANDIDATES = `${DISPLAY}, ${BLOCKS}, .eyebrow, [data-count]`;

/** Never animated: interactive furniture, hidden text, and anything opted out. */
const SKIP = [
  '[data-tx-skip]',
  '[data-tx-static]',
  'dialog',
  '[role="dialog"]',
  '[aria-hidden="true"]',
  'details',
  'form',
  'button',
  '[data-preloader]',
  '.home-arch',
  '.home-rail-bar',
  '.home-rail-caption',
  '.home-dots',
  '.sr-only',
].join(', ');

/** Lowered text starts to arrive when it is this far up the screen. */
const ENTER_AT = 0.92;

/** Longest headline worth splitting; longer ones sweep like any other text. */
const MAX_WORDS = 14;

const TRANSITION_MS = 1000;
const COUNT_MS = 1500;

/** True when the element sits inside a row that scrolls sideways. */
function inSideScroller(el: HTMLElement, stop: Element): boolean {
  for (let p = el.parentElement; p && p !== stop; p = p.parentElement) {
    if (p.classList.contains('mask-x')) return true;
    const overflowX = getComputedStyle(p).overflowX;
    if ((overflowX === 'auto' || overflowX === 'scroll') && p.scrollWidth > p.clientWidth + 1) return true;
  }
  return false;
}

function splitInto(el: HTMLElement, text: string) {
  const frag = document.createDocumentFragment();
  splitWords(text).forEach((word, i) => {
    if (i > 0) frag.append(' ');
    const clip = document.createElement('span');
    clip.className = 'tx-w';
    const layer = document.createElement('span');
    layer.className = 'tx-wi';
    layer.style.setProperty('--i', String(i));
    layer.textContent = word;
    clip.append(layer);
    frag.append(clip);
  });
  el.replaceChildren(frag);
}

function run(): () => void {
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const staged = root.dataset.stage === 'on';

  const scopes = [document.querySelector('main'), document.querySelector('footer')].filter(
    (n): n is HTMLElement => n instanceof HTMLElement,
  );

  const items = new Map<HTMLElement, Item>();
  /** Stage only: the text of each home page, in reading order. */
  const pages = new Map<HTMLElement, Item[]>();
  /** Stage only: which page an element belongs to. */
  const pageOf = new Map<HTMLElement, HTMLElement>();
  const pageTimers = new Map<HTMLElement, number>();

  // ---- collecting -----------------------------------------------------------

  const roleOf = (el: HTMLElement): { role: Role; words: number } => {
    if (el.matches('.eyebrow')) return { role: 'ink', words: 0 };
    if (!reduced && el.matches(DISPLAY) && el.childNodes.length === 1 && el.firstChild?.nodeType === Node.TEXT_NODE) {
      const words = splitWords(el.textContent ?? '').length;
      if (words > 0 && words <= MAX_WORDS) return { role: 'word', words };
    }
    return { role: 'sweep', words: 0 };
  };

  const collect = (scope: HTMLElement) => {
    for (const el of scope.querySelectorAll<HTMLElement>(CANDIDATES)) {
      if (items.has(el) || el.closest(SKIP)) continue;
      // Animate the leaf, not the box around it.
      if (el.querySelector(CANDIDATES)) continue;
      if (!(el.textContent ?? '').trim()) continue;
      if (el.getClientRects().length === 0) continue;
      if (getComputedStyle(el).display === 'inline') continue;
      if (inSideScroller(el, scope)) continue;

      const { role, words } = roleOf(el);
      const raw = el.textContent ?? '';
      items.set(el, {
        el,
        role,
        state: 'idle',
        original: role === 'word' || el.hasAttribute('data-count') ? raw : null,
        count: el.hasAttribute('data-count') && !reduced ? parseCount(raw) : null,
        words,
        timer: null,
        raf: null,
      });
    }
  };
  scopes.forEach(collect);

  // ---- states ---------------------------------------------------------------

  const prepare = (it: Item) => {
    const { el } = it;
    if (el.dataset.tx) return;
    el.dataset.tx = it.role;
    if (it.role === 'word' && it.original !== null) splitInto(el, it.original);
    if (it.role === 'ink' && getComputedStyle(el).textAlign === 'center') el.dataset.txCenter = '';
  };

  const lower = (it: Item) => {
    prepare(it);
    if (it.timer !== null) window.clearTimeout(it.timer);
    if (it.raf !== null) cancelAnimationFrame(it.raf);
    it.timer = it.raf = null;
    it.state = 'down';
    it.el.dataset.txState = 'down';
    it.el.style.removeProperty('--tx-d');
    if (it.count && it.original !== null) it.el.textContent = it.original;
  };

  const showCount = (it: Item, value: number) => {
    const { count, el } = it;
    if (count) el.textContent = `${count.prefix}${formatCount(value, count.grouped)}${count.suffix}`;
  };

  /** Counts a figure up to its value, starting after `delay` ms. */
  const countUp = (it: Item, delay: number) => {
    const { count } = it;
    if (!count) return;
    const t0 = performance.now() + delay;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - t0) / COUNT_MS));
      showCount(it, count.target * easeOutExpo(t));
      it.raf = t < 1 ? requestAnimationFrame(tick) : null;
    };
    it.raf = requestAnimationFrame(tick);
  };

  const raise = (it: Item, delay: number) => {
    if (it.state === 'up') return;
    prepare(it);
    if (it.timer !== null) window.clearTimeout(it.timer);
    if (it.raf !== null) cancelAnimationFrame(it.raf);
    const wait = reduced ? 0 : delay;
    it.state = 'up';
    it.el.style.setProperty('--tx-d', `${wait}ms`);
    // The element must have been painted as "down" before it can transition to
    // "up"; it was lowered when collected, but not if it is being raised on the
    // spot (the sweep, or a stage page that was already showing).
    if (!it.el.dataset.txState) it.el.dataset.txState = 'down';
    showCount(it, 0);
    it.raf = requestAnimationFrame(() => {
      it.el.dataset.txState = 'up';
      it.raf = null;
      countUp(it, wait);
    });
    const span = TRANSITION_MS + it.words * WORD_STAGGER_MS + (it.count ? COUNT_MS - TRANSITION_MS : 0);
    it.timer = window.setTimeout(() => {
      // Settled: hand the element back to its natural styles.
      it.timer = null;
      delete it.el.dataset.txState;
      it.el.style.removeProperty('--tx-d');
      if (it.count && it.original !== null) it.el.textContent = it.original;
    }, wait + span + 200);
  };

  // ---- the stage: a page at a time -------------------------------------------

  const syncPage = (page: HTMLElement) => {
    const group = pages.get(page);
    if (!group) return;
    const pending = pageTimers.get(page);
    if (pending !== undefined) {
      window.clearTimeout(pending);
      pageTimers.delete(page);
    }
    if (page.dataset.state === 'on') {
      // The page itself fades in after 120ms; the text follows it.
      const delays = sequenceDelays(group, { base: 180, step: 55, cap: 520 });
      group.forEach((it, i) => raise(it, delays[i]));
    } else {
      // Wait for the page to finish fading out before resetting its text, or
      // the words would vanish a beat before their page does.
      pageTimers.set(
        page,
        window.setTimeout(() => {
          pageTimers.delete(page);
          if (page.dataset.state !== 'on') group.forEach(lower);
        }, 380),
      );
    }
  };

  // ---- the document: a block at a time ---------------------------------------

  let queue: HTMLElement[] = [];
  let flushing = false;

  const flush = () => {
    flushing = false;
    const batch = queue;
    queue = [];
    batch.sort((a, b) => {
      const ra = a.getBoundingClientRect();
      const rb = b.getBoundingClientRect();
      return ra.top - rb.top || ra.left - rb.left;
    });
    const live = batch.map((el) => items.get(el)).filter((it): it is Item => !!it && it.state === 'down');
    const delays = sequenceDelays(live);
    live.forEach((it, i) => raise(it, delays[i]));
  };

  const observer =
    'IntersectionObserver' in window
      ? new IntersectionObserver(
          (entries, self) => {
            for (const entry of entries) {
              if (!entry.isIntersecting) continue;
              self.unobserve(entry.target);
              queue.push(entry.target as HTMLElement);
            }
            if (queue.length && !flushing) {
              flushing = true;
              requestAnimationFrame(flush);
            }
          },
          { rootMargin: `0px 0px -${Math.round((1 - ENTER_AT) * 100)}% 0px` },
        )
      : null;

  const inView = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    return r.height > 0 && r.top < window.innerHeight * 0.97 && r.bottom > 0;
  };

  /** Anything the observer missed (a quirk, a layout shift) but that is on screen. */
  const sweep = () => {
    let i = 0;
    for (const it of items.values()) {
      if (it.state !== 'down' || pageOf.has(it.el)) continue;
      if (!inView(it.el)) continue;
      observer?.unobserve(it.el);
      raise(it, batchDelay(i++));
    }
  };

  // ---- wiring ---------------------------------------------------------------

  const pageObserver = staged
    ? new MutationObserver((records) => {
        for (const r of records) syncPage(r.target as HTMLElement);
      })
    : null;

  for (const it of items.values()) {
    const page = staged ? it.el.closest<HTMLElement>('[data-page]') : null;
    if (page) {
      pageOf.set(it.el, page);
      const group = pages.get(page) ?? [];
      group.push(it);
      pages.set(page, group);
      lower(it);
      continue;
    }
    // Lower only what the reader cannot see yet; anything on screen stays as
    // rendered, because hiding a visible line in order to reveal it is a flash.
    const rect = it.el.getBoundingClientRect();
    if (rect.top < window.innerHeight * ENTER_AT) continue;
    lower(it);
    observer?.observe(it.el);
  }

  if (pageObserver) {
    for (const page of pages.keys()) {
      pageObserver.observe(page, { attributes: true, attributeFilter: ['data-state'] });
      if (page.dataset.state === 'on') syncPage(page);
    }
  }

  let sweepTimer: number | null = null;
  const queueSweep = () => {
    if (sweepTimer !== null) window.clearTimeout(sweepTimer);
    sweepTimer = window.setTimeout(sweep, 280);
  };
  window.addEventListener('scroll', queueSweep, { passive: true });
  window.addEventListener('resize', queueSweep);
  const settle = window.setTimeout(sweep, 1400);

  return () => {
    observer?.disconnect();
    pageObserver?.disconnect();
    window.removeEventListener('scroll', queueSweep);
    window.removeEventListener('resize', queueSweep);
    window.clearTimeout(settle);
    if (sweepTimer !== null) window.clearTimeout(sweepTimer);
    pageTimers.forEach((t) => window.clearTimeout(t));
    for (const it of items.values()) {
      if (it.timer !== null) window.clearTimeout(it.timer);
      if (it.raf !== null) cancelAnimationFrame(it.raf);
      const { el } = it;
      delete el.dataset.tx;
      delete el.dataset.txState;
      delete el.dataset.txCenter;
      el.style.removeProperty('--tx-d');
      // Put split headlines and counted figures back exactly as rendered.
      if (it.original !== null && el.isConnected && (it.role === 'word' || it.count)) el.textContent = it.original;
    }
  };
}

export default function TextMotion() {
  const pathname = usePathname();

  useEffect(() => {
    // The gallery is a tool, not a page to read: its globe, filters and index
    // change under the reader's hands, so its text stays still.
    if (pathname.startsWith('/gallery')) return;

    const root = document.documentElement;
    let mode = root.dataset.stage;
    let stop = run();

    // The home page changes presentation (stage, rail, stacked) with the window.
    // Each one reads its text differently, so start over when it does.
    const watch = new MutationObserver(() => {
      if (root.dataset.stage === mode) return;
      mode = root.dataset.stage;
      stop();
      stop = run();
    });
    watch.observe(root, { attributes: true, attributeFilter: ['data-stage'] });

    return () => {
      watch.disconnect();
      stop();
    };
  }, [pathname]);

  return null;
}
