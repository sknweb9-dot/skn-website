'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from 'react';
import { HOME_SECTIONS, LOADING_LINES, TONE_VALUES, restingFrame } from '@/lib/home';
import { MUDRAS, mudraAtFrame } from '@/lib/mudras';
import {
  RAIL_QUERY,
  STAGE_QUERY,
  activePage,
  anchorsFor,
  buildPlan,
  frameAt,
  frameToSeconds,
  metricsFor,
  progressThrough,
  sectionAtStep,
  stageScroll,
  stepAt,
  trackHeight,
  yOfSection,
  yOfStep,
} from '@/lib/stage';
import { useIsomorphicLayoutEffect } from '@/lib/useIsomorphicLayoutEffect';
import ArchFrame from './ArchFrame';
import { createArchVideo } from './archVideo';
import { createHandPlayer } from './handPlayer';
import RailEngine from './HomeRail';
import FramePreloader from '../FramePreloader';
import ScrollCue from '../ScrollCue';

/**
 * THE STAGE
 * ---------
 * Wraps the home page's sections. Server-rendered children stay exactly as they
 * are: ordinary content in a stack. When the window is desktop-sized and the
 * visitor has not asked for reduced motion, this component turns that stack into
 * a stage: one page showing at a time, in the same place, while the document
 * scrolls natively underneath (no scroll hijacking, no Lenis; see
 * SmoothScroll). Everything else about the arithmetic is in lib/stage.ts.
 *
 * TWO PRESENTATIONS, TWO MOUNTS
 * -----------------------------
 * The stacked page and the stage are not one component with conditionals. The
 * stage's machinery (the scroll loop, the video, the WebGL canvas, the wipe)
 * lives in <StageEngine>, which is mounted only while the stage is on and
 * unmounts wholesale when it is not. Nothing in the engine checks for reduced
 * motion, because it never mounts under it. This is the same split the home
 * page has always kept between its scrubbing and its still presentations.
 *
 * LAYOUT
 * ------
 * <div .home-track>            as tall as the scroll the stage needs
 *   <div .home-pin>            sticky, one viewport tall; the stage itself
 *     {children}               the sections; each page is absolutely placed
 *     <StageEngine/>           wipes, the live arch, dots, progress
 * After the track ends the pin scrolls away and the footer arrives.
 *
 * Before the script runs, the page's own inline script (app/page.tsx) has
 * already set html[data-stage] from the same media query, so the first paint is
 * the stage's layout with the hero showing and the hero's still arch in the
 * pose the live arch will take, not a stacked page that jumps.
 *
 * ACCESSIBILITY
 * -------------
 * Every page stays in the document and in the accessibility tree; inactive ones
 * are only transparent. A screen reader reads the whole page in order. A
 * keyboard user who tabs into a page that is not showing is carried to it
 * (focusin below). Dots and PageUp/PageDown move between pages.
 */

const R = 0.7215; // arch width / height; see --arch-ratio in globals.css

function subscribe(onChange: () => void) {
  const list = window.matchMedia(STAGE_QUERY);
  list.addEventListener('change', onChange);
  return () => list.removeEventListener('change', onChange);
}

function subscribeRail(onChange: () => void) {
  const list = window.matchMedia(RAIL_QUERY);
  list.addEventListener('change', onChange);
  return () => list.removeEventListener('change', onChange);
}

/** Data Saver or a 2g connection: do not fetch two megabytes of footage for a small arch. */
function savesData(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  if (!connection) return false;
  return Boolean(connection.saveData) || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g';
}

export default function HomeStage({ children }: { children: ReactNode }) {
  const stage = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(STAGE_QUERY).matches,
    () => false,
  );
  const rail = useSyncExternalStore(
    subscribeRail,
    () => window.matchMedia(RAIL_QUERY).matches && !savesData(),
    () => false,
  );
  // If the video cannot load, drop back to the stacked page rather than leaving
  // an empty arch.
  const [failed, setFailed] = useState(false);
  const mode = failed ? null : stage ? 'on' : rail ? 'rail' : null;

  const trackRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const root = document.documentElement;
    if (mode) root.dataset.stage = mode;
    else {
      delete root.dataset.stage;
      delete root.dataset.stageLive;
    }
    // The hero's text waits for the loading screen, which only the stage has
    // (FramePreloader clears this when it goes). First loads are covered by the
    // inline script in app/page.tsx; this is the client-side arrival, where that
    // script does not run. During hydration `mode` is briefly null even on a
    // desktop, so only let go of the hold if the stage is really not wanted.
    let failsafe: number | undefined;
    if (mode === 'on') {
      if (!root.dataset.intro) {
        root.dataset.intro = 'wait';
        failsafe = window.setTimeout(() => delete root.dataset.intro, 14000);
      }
    } else if (failed || !window.matchMedia(STAGE_QUERY).matches) {
      delete root.dataset.intro;
    }
    return () => {
      window.clearTimeout(failsafe);
      delete root.dataset.stage;
      delete root.dataset.stageLive;
    };
  }, [mode, failed]);

  // Leaving the page must never leave the hold behind: the next route's
  // headline would sit on its first frame for good.
  useEffect(() => {
    const root = document.documentElement;
    return () => {
      delete root.dataset.intro;
    };
  }, []);

  return (
    <div ref={trackRef} className="home-track">
      <div ref={pinRef} className="home-pin">
        {children}
        {mode === 'on' ? (
          <StageEngine key="stage" trackRef={trackRef} pinRef={pinRef} onFail={() => setFailed(true)} />
        ) : null}
        {mode === 'rail' ? <RailEngine key="rail" onFail={() => setFailed(true)} /> : null}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const smooth = (v: number) => {
  const t = Math.min(1, Math.max(0, v));
  return t * t * (3 - 2 * t);
};

type Pose = { left: number; top: number; width: number; height: number };

// ---------------------------------------------------------------------------
// The engine
// ---------------------------------------------------------------------------

function StageEngine({
  trackRef,
  pinRef,
  onFail,
}: {
  trackRef: RefObject<HTMLDivElement | null>;
  pinRef: RefObject<HTMLDivElement | null>;
  onFail: () => void;
}) {
  const wipeA = useRef<HTMLDivElement>(null);
  const wipeB = useRef<HTMLDivElement>(null);
  const archRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);
  const literalRef = useRef<HTMLSpanElement>(null);
  const cueRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLElement>(null);

  const [loaded, setLoaded] = useState(0);
  const [ready, setReady] = useState(false);
  const [line] = useState(() => LOADING_LINES[Math.floor(Math.random() * LOADING_LINES.length)]);
  const onFailRef = useRef(onFail);
  useEffect(() => {
    onFailRef.current = onFail;
  });

  // A plain effect, not a layout effect: this engine can mount in the same
  // commit as HomeStage (a client-side navigation to "/"), and a child's layout
  // effects run before its parent's DOM refs are attached, so track and pin
  // would still be null.
  useEffect(() => {
    const track = trackRef.current;
    const pin = pinRef.current;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const arch = archRef.current;
    const wa = wipeA.current;
    const wb = wipeB.current;
    if (!track || !pin || !canvas || !video || !arch || !wa || !wb) return;

    const root = document.documentElement;
    const av = createArchVideo(canvas, video);
    if (!av.ok) {
      // No WebGL: show the footage as filmed, uncut, in every section.
      arch.dataset.gl = 'off';
    }

    // ---- the plan, read from the document --------------------------------
    const pageEls = Array.from(pin.querySelectorAll<HTMLElement>('[data-page]'));
    const plan = buildPlan(
      pageEls.map((el) => ({
        section: el.closest<HTMLElement>('[data-home-section]')!.dataset.homeSection!,
        steps: Number(el.dataset.steps ?? 1),
      })),
    );
    const frames = HOME_SECTIONS.map(restingFrame);
    if (plan.sections.map((s) => s.id).join() !== HOME_SECTIONS.map((s) => s.id).join()) {
      throw new Error('The home page markup and HOME_SECTIONS list different sections.');
    }

    const timelineEl = pin.querySelector<HTMLElement>('[data-scrub-window]');
    const timelineTrack = pin.querySelector<HTMLElement>('[data-scrub-track]');
    const timelinePage = plan.pages.findIndex((p) => p.steps > 1);
    const dots = dotsRef.current;
    const dotEls = Array.from(dots?.querySelectorAll<HTMLButtonElement>('button') ?? []);
    const heroStill = pin.querySelector<HTMLElement>('[data-home-section="hero"] .home-stacked-arch');
    // The hero's headline, line and button block, which leave with the arch.
    const heroPieces = Array.from(
      pin.querySelectorAll<HTMLElement>('[data-home-section="hero"] .home-page-inner > *'),
    );

    // ---- state -------------------------------------------------------------
    let vh = window.innerHeight;
    let m = metricsFor(vh);
    let anchors = anchorsFor(plan, m, frames);
    let hero: Pose = { left: 0, top: 0, width: 0, height: 0 };
    let dock: Pose = { left: 0, top: 0, width: 0, height: 0 };
    let timelineRange = 0;

    let y = 0;
    let section = 'hero';
    let activeIdx = -1;
    let captioned = -1;
    let wiping = false;
    let pending: string | null = null;
    let disposed = false;

    const toneOf = (id: string) => TONE_VALUES[HOME_SECTIONS.find((s) => s.id === id)!.tone];

    // ---- geometry ----------------------------------------------------------
    const measure = () => {
      vh = window.innerHeight;
      m = metricsFor(vh);
      anchors = anchorsFor(plan, m, frames);
      track.style.height = `${trackHeight(plan, m)}px`;

      const pinRect = pin.getBoundingClientRect();
      const stillRect = heroStill?.getBoundingClientRect();
      hero = stillRect
        ? { left: stillRect.left - pinRect.left, top: stillRect.top - pinRect.top, width: stillRect.width, height: stillRect.height }
        : { left: 0, top: 0, width: 0, height: 0 };

      const vw = window.innerWidth;
      const mast = parseFloat(getComputedStyle(root).getPropertyValue('--masthead')) * 16 || 88;
      const stageH = vh - mast;
      const capH = 52;
      let w = 0.21 * vw;
      let h = w / R;
      if (h > stageH - capH - 40) {
        h = stageH - capH - 40;
        w = h * R;
      }
      const left = Math.min(Math.max(28, 0.03 * vw), 52);
      dock = { left, top: mast + (stageH - h - capH) / 2, width: w, height: h };
      pin.style.setProperty('--dock-col', `${left + w}px`);

      const bigH = Math.max(hero.height, dock.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = Math.round(bigH * R * dpr);
      const ch = Math.round(bigH * dpr);
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
      }
      av.draw(true);

      // How far the track can travel: its whole height (padding included, so the
      // first entry rests clear of the top fade and the last clear of the
      // bottom one) less the window's.
      timelineRange = timelineTrack && timelineEl ? Math.max(0, timelineTrack.offsetHeight - timelineEl.clientHeight) : 0;
    };

    // ---- colour wipe -------------------------------------------------------
    const skin = (id: string) => {
      const tone = toneOf(id);
      pin.style.setProperty('--niche', tone.niche ?? 'var(--color-lamp)');
      pin.style.setProperty('--glow-opacity', tone.dark ? '1' : '0');
      av.setRaw(tone.dark ? 0 : 1);
      arch.dataset.dark = String(tone.dark);
      kick();
    };
    wa.style.background = toneOf('hero').value;
    pin.style.setProperty('--niche', 'var(--color-lamp)');
    pin.style.setProperty('--glow-opacity', '0');
    av.setRaw(1, true);
    arch.dataset.dark = 'false';

    const wipeTo = (next: string) => {
      if (next === section) return;
      if (wiping) {
        pending = next;
        return;
      }
      const forward = HOME_SECTIONS.findIndex((s) => s.id === next) > HOME_SECTIONS.findIndex((s) => s.id === section);
      wiping = true;
      wb.style.transition = 'none';
      wb.style.background = toneOf(next).value;
      wb.style.clipPath = forward ? 'inset(100% 0 0 0)' : 'inset(0 0 100% 0)';
      void wb.offsetHeight;
      wb.style.transition = 'clip-path 0.8s cubic-bezier(0.65, 0, 0.35, 1)';
      wb.style.clipPath = 'inset(0 0 0 0)';
      section = next;
      skin(next);
      window.setTimeout(() => {
        if (disposed) return;
        wa.style.background = toneOf(next).value;
        wb.style.transition = 'none';
        wb.style.clipPath = 'inset(100% 0 0 0)';
        wiping = false;
        const p = pending;
        pending = null;
        if (p && p !== section) wipeTo(p);
      }, 820);
    };

    // ---- the scroll --------------------------------------------------------
    const update = () => {
      const maxScroll = Math.max(1, stageScroll(plan, m));
      y = Math.min(maxScroll, Math.max(0, -track.getBoundingClientRect().top));

      // Arch: hero pose -> dock pose. The glide is a fifth longer than the hero,
      // so the first section arrives when the arch is about 93% of the way: its
      // right edge has already cleared the column the section's text sits in,
      // and the last few pixels of settling happen under the arriving words.
      const e = smooth(y / (m.hero * 1.2));
      const lerp = (a: number, b: number) => a + (b - a) * e;
      arch.style.left = `${lerp(hero.left, dock.left)}px`;
      arch.style.top = `${lerp(hero.top, dock.top)}px`;
      arch.style.width = `${lerp(hero.width, dock.width)}px`;
      arch.style.height = `${lerp(hero.height, dock.height)}px`;
      if (cueRef.current) cueRef.current.style.opacity = String(1 - Math.min(1, y / 120));

      // The hero's text leaves with the arch: each piece drifts up and fades on
      // the scroll, headline first, so by the time the arch is half way there is
      // only the arch crossing a clean ground. Opacity and a shift, never
      // display or visibility: the text stays in the page and the reading order.
      heroPieces.forEach((el, i) => {
        const t = smooth((y / m.hero - (0.04 + i * 0.08)) / 0.5);
        el.style.opacity = t > 0 ? String(1 - t) : '';
        el.style.translate = t > 0 ? `0 ${(-2.4 * t).toFixed(2)}rem` : '';
      });

      // Which page.
      const step = stepAt(y, plan, m);
      const idx = activePage(step, plan);
      if (idx !== activeIdx) {
        activeIdx = idx;
        pageEls.forEach((el, i) => {
          el.dataset.state = i === idx ? 'on' : i < idx ? 'before' : 'after';
        });
      }
      wipeTo(sectionAtStep(step, plan));

      // The timeline's window.
      if (timelineTrack && timelinePage >= 0 && timelineRange) {
        const p = progressThrough(plan.pages[timelinePage], y, m);
        timelineTrack.style.transform = `translate3d(0, ${(-p * timelineRange).toFixed(1)}px, 0)`;
      }

      // Dots and progress.
      dotEls.forEach((b) => {
        const on = b.dataset.section === sectionAtStep(step, plan);
        b.dataset.active = String(on);
        if (on) b.setAttribute('aria-current', 'true');
        else b.removeAttribute('aria-current');
      });
      if (barRef.current) barRef.current.style.width = `${(100 * y) / maxScroll}%`;

      player.setTarget(frameToSeconds(frameAt(y, anchors, m)));
    };

    // ---- the glide (components/home/handPlayer.ts) --------------------------
    const player = createHandPlayer(video, av, (frame) => {
      const mudra = mudraAtFrame(frame);
      if (mudra.order !== captioned) {
        captioned = mudra.order;
        if (nameRef.current) nameRef.current.textContent = mudra.name;
        if (literalRef.current) literalRef.current.textContent = mudra.literal;
      }
    });
    const kick = player.kick;

    // ---- video readiness ---------------------------------------------------
    const progress = () => {
      const dur = video.duration;
      if (dur && video.buffered.length) {
        setLoaded(Math.round((100 * video.buffered.end(video.buffered.length - 1)) / dur));
      }
      if (video.readyState >= 3) become();
    };
    let became = false;
    const become = () => {
      if (became || disposed) return;
      became = true;
      setLoaded(100);
      setReady(true);
      player.reset(Math.max(0.05, player.target()));
      root.dataset.stageLive = '1';
    };
    const onError = () => onFailRef.current();
    const onSeeked = () => {
      av.draw(true);
      kick();
    };
    video.addEventListener('progress', progress);
    video.addEventListener('canplay', progress);
    video.addEventListener('loadeddata', progress);
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);
    const lastSource = video.querySelector('source:last-of-type');
    lastSource?.addEventListener('error', onError);
    const giveUp = window.setTimeout(become, 9000);
    video.load();

    // ---- keyboard, focus, deep links ---------------------------------------
    const go = (top: number) => window.scrollTo({ top, behavior: 'instant' });
    const stepNow = () => stepAt(y, plan, m);
    const onFocusIn = (ev: FocusEvent) => {
      const el = (ev.target as Element | null)?.closest<HTMLElement>('[data-page]');
      if (!el) return;
      const idx = pageEls.indexOf(el);
      if (idx === -1 || idx === activeIdx) return;
      const page = plan.pages[idx];
      go(page.steps === 0 ? 0 : yOfStep(page.first, m) + 2);
    };
    const onKey = (ev: KeyboardEvent) => {
      if (ev.altKey || ev.ctrlKey || ev.metaKey) return;
      const t = ev.target as HTMLElement | null;
      if (t && t !== document.body && t !== root) return;
      const forward = ev.key === 'PageDown' || (ev.key === ' ' && !ev.shiftKey);
      const backward = ev.key === 'PageUp' || (ev.key === ' ' && ev.shiftKey);
      if (!forward && !backward) return;
      ev.preventDefault();
      const s = stepNow();
      const next = Math.min(plan.last, Math.max(0, s + (forward ? 1 : -1)));
      go(next === 0 ? 0 : yOfStep(next, m) + 2);
    };
    const onGoto = (ev: Event) => {
      const id = (ev as CustomEvent<{ id: string }>).detail?.id;
      if (id) go(yOfSection(id, plan, m) + 2);
    };
    const onDot = (ev: MouseEvent) => {
      const b = (ev.target as Element).closest<HTMLButtonElement>('button[data-section]');
      if (b) window.scrollTo({ top: yOfSection(b.dataset.section!, plan, m) + 2, behavior: 'smooth' });
    };
    pin.addEventListener('focusin', onFocusIn);
    window.addEventListener('keydown', onKey);
    window.addEventListener('stage:goto', onGoto);
    dots?.addEventListener('click', onDot);

    // ---- go ----------------------------------------------------------------
    const onScroll = () => requestAnimationFrame(update);
    const onResize = () => {
      measure();
      update();
    };
    measure();
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    // Fonts and images change heights after first paint.
    const ro = new ResizeObserver(onResize);
    ro.observe(pin);
    let fontsDone = false;
    document.fonts?.ready.then(() => {
      if (!fontsDone && !disposed) onResize();
    });

    return () => {
      disposed = true;
      fontsDone = true;
      player.dispose();
      window.clearTimeout(giveUp);
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('stage:goto', onGoto);
      pin.removeEventListener('focusin', onFocusIn);
      dots?.removeEventListener('click', onDot);
      video.removeEventListener('progress', progress);
      video.removeEventListener('canplay', progress);
      video.removeEventListener('loadeddata', progress);
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
      lastSource?.removeEventListener('error', onError);
      av.dispose();
      track.style.height = '';
      pageEls.forEach((el) => delete el.dataset.state);
      heroPieces.forEach((el) => {
        el.style.opacity = '';
        el.style.translate = '';
      });
      if (timelineTrack) timelineTrack.style.transform = '';
    };
  }, [trackRef, pinRef]);

  return (
    <>
      <FramePreloader loaded={loaded} total={100} done={ready} line={line} />
      <div ref={wipeA} aria-hidden className="home-wipe" />
      <div ref={wipeB} aria-hidden className="home-wipe" style={{ clipPath: 'inset(100% 0 0 0)' }} />

      <div ref={archRef} className="home-arch group" data-dark="false">
        <ScrollCue ref={cueRef} variant="vertical" />
        <div className="home-arch-box">
          <div className="home-arch-shape arch">
            <canvas
              ref={canvasRef}
              className="home-arch-canvas"
              role="img"
              aria-label="A dancer's hand forming the asamyuta hastas of Bharatanatyam, one gesture flowing into the next"
            />
            {/* Read by the shader; shown directly only if WebGL is missing. */}
            <video ref={videoRef} muted playsInline preload="auto" aria-hidden tabIndex={-1} className="home-arch-video">
              <source src="/video/hastas.webm" type="video/webm" />
              <source src="/video/hastas.mp4" type="video/mp4" />
            </video>
          </div>
          <ArchFrame />
        </div>
        {/* Named from the frame actually on screen, so it stays truthful through
            the gestures between sections. Ink on light grounds, cream on dark
            ones. Written imperatively: re-rendering on every scroll tick would
            drop frames. */}
        <p className="home-arch-caption">
          <span
            ref={nameRef}
            className="block font-display text-[0.82rem] tracking-[0.16em] text-kumkum transition-colors duration-500 group-data-[dark=true]:text-marigold"
          >
            {MUDRAS[0].name}
          </span>
          <span
            ref={literalRef}
            className="mt-0.5 block font-sans text-micro tracking-[0.06em] text-ink-faint transition-colors duration-500 group-data-[dark=true]:text-cream/80"
          >
            {MUDRAS[0].literal}
          </span>
        </p>
      </div>

      <nav ref={dotsRef} aria-label="Sections of this page" className="home-dots">
        {HOME_SECTIONS.map((s) => (
          <button key={s.id} type="button" data-section={s.id} data-active="false" aria-label={s.label} title={s.label} />
        ))}
      </nav>
      <div ref={barRef} aria-hidden className="home-bar" />
    </>
  );
}
