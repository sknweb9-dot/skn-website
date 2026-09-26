'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ACTS,
  archState,
  actVisibility,
  type ActSide,
} from '@/lib/acts';
import {
  FRAME_COUNT,
  framePath,
  mudraAtProgress,
} from '@/lib/mudras';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import { useIsomorphicLayoutEffect } from '@/lib/useIsomorphicLayoutEffect';
import ActPanel from './ActPanel';
import ArchOutline from './ArchOutline';
import ChapterRail from './ChapterRail';
import FramePreloader from './FramePreloader';
import ScrollCue from './ScrollCue';
import StaticActs from './StaticActs';

/**
 * Simultaneous image requests. Keeps the connection pool from thrashing while
 * still saturating a decent link.
 */
const PRELOAD_CONCURRENCY = 8;

/**
 * Frame loading is two passes, and only the first one gates the page.
 *
 * All 324 frames are about 6.8 MB. Waiting for every one of them behind a
 * full-screen preloader is a long stare on mobile data, for a scrub that
 * degrades gracefully anyway: draw() already falls back to the nearest loaded
 * frame at or before the one requested.
 *
 * So every fourth frame is fetched first — 81 files, about 1.7 MB — and the
 * preloader clears on that. The remaining three quarters stream in behind it and
 * the scrub sharpens as they land, which on any reasonable connection happens
 * before the reader has finished the first act.
 *
 * Dropping the other three quarters altogether was the obvious alternative and
 * the wrong one: at 324 frames the desktop scrub is about 17px of scroll per
 * frame (see ACT_SPAN_SVH); a quarter of the frames would put it near 70, well
 * past the ~30px steppiness threshold in lib/mudras.ts, and the gesture would
 * stutter. The bytes are not the problem; blocking on them was.
 */
const COARSE_STEP = 4;

/**
 * Indices of the coarse pass, then everything else, in fetch order. Computed
 * once at module scope: both FRAME_COUNT and COARSE_STEP are constants, so this
 * is not per-instance work and the gating total is knowable before first render.
 */
const LOAD_ORDER = (() => {
  const coarse: number[] = [];
  const refine: number[] = [];
  for (let i = 1; i <= FRAME_COUNT; i += 1) {
    if ((i - 1) % COARSE_STEP === 0) coarse.push(i);
    else refine.push(i);
  }
  return { coarse, refine };
})();

const COARSE_TOTAL = LOAD_ORDER.coarse.length;

/**
 * Honour Data Saver by stopping after the coarse pass. A reader who has asked
 * their browser to spend less deserves a steppier scrub, not a silent 6.8 MB.
 */
function prefersLessData(): boolean {
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
  ).connection;
  if (!connection) return false;
  return Boolean(connection.saveData) || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g';
}

/**
 * Scroll distance allotted to each act, in svh.
 *
 * WHY 120, NOT 160
 * ----------------
 * 160 was set for mudra.mp4 (45s of footage, sampled at 7.2fps). Hastas.mp4 is
 * 54s and holds each gesture longer, so at the same scroll length the hand sat
 * still for longer stretches and the scrub read as slower — reported as "it
 * takes more scrolling to change what's shown". The frame count barely moved
 * (327 -> 324); the pacing of the footage did.
 *
 * 120 on a pointer device is 25% less scroll for the same 28 gestures, and as a
 * side effect a smoother scrub: 324 frames over 720svh is about 17px of scroll
 * per frame at 1440x900, well inside the ~30px steppiness threshold documented
 * in lib/mudras.ts. Phones drop in the same proportion, 120 -> 90.
 *
 * Neither number touches the act windows, which are normalised to 0-1. Keep
 * TOTAL_SVH in _research/check_act_windows.py equal to 6 x ACT_SPAN_SVH, or the
 * travel gaps it reports in svh will be wrong.
 */
const ACT_SPAN_SVH = 120;
const ACT_SPAN_SVH_PHONE = 90;

/**
 * How far the arch slides away from an act's editorial column, as a fraction of
 * viewport width. Side acts push the aperture to the opposite side so the card
 * never covers the hand; centre acts leave it centred.
 *
 * Applied only from the `sm` breakpoint up. On narrow screens the cards sit
 * below the arch, so there is nothing to make room for.
 */
const ARCH_SHIFT = 0.13;
const SHIFT_BREAKPOINT = 640;

/**
 * Vertical placement.
 *
 * The arch's CSS top was a fixed 5svh, which left the composition pinned to the
 * top of the screen — under the masthead, in fact — with 180-350px of empty
 * wash beneath it. Side acts were worst: their card docks inside the arch's
 * height, so everything below the arch's foot was empty.
 *
 * So each act now has a resting vertical offset that centres whatever that act
 * shows: the arch alone for side acts, the arch plus its card for centre acts.
 * It is computed from measured heights (card height is content-driven, and the
 * arch height is clamped by the viewport), cached, and interpolated across the
 * same travel as the horizontal move, so the arch glides between the two.
 *
 * Two limits, in priority order: never clip the bottom of a centre act's card
 * (the stage is overflow-hidden, and a cut-off call to action is the worst
 * outcome), and otherwise keep the top clear of the masthead.
 *
 * Phones use the same centring, with every act treated as stacked (arch over
 * card), which is how they lay out. The arch's height budget on phones is still
 * the hand-tuned one in the wrapper's classes; this only moves the block, and
 * the bottom limit above means a short phone can never be pushed into clipping.
 */
const EDGE_GAP = 16;

type StageLayout = {
  /** The arch wrapper's CSS top, in px. Unaffected by the transform. */
  archTop: number;
  archHeight: number;
  /** Height of each act's card, by act index. */
  cardHeights: number[];
  /** Lowest the arch's top may sit, to clear the masthead. */
  minTop: number;
  viewport: number;
};

/**
 * Where the crop sits when the aperture is broader than the footage.
 *
 * 0 keeps the top of the plate, 0.5 centres, 1 keeps the bottom. On phones the
 * aperture is widened to ~0.89 (see --arch-ratio-phone) and cover-fit then has
 * ~19% of the plate's height to discard. Centring it would cut the fingertips,
 * which is the whole subject; the bottom of the plate is forearm and bangles.
 * So the crop is biased upward and the loss is taken off the bottom.
 *
 * Where the aperture ratio matches the source — every breakpoint from `sm` up —
 * the drawn height equals the canvas height and this term multiplies zero. No
 * breakpoint logic is needed in JS.
 */
const CROP_BIAS = 0.18;

/**
 * Scroll progress over which the cue fades out. Deliberately short: the cue has
 * said its piece the moment the page starts moving, and a hint that lingers
 * reads as an instruction the reader has failed to follow.
 */
const CUE_FADE = 0.012;

function archOffsetFor(side: ActSide): number {
  if (side === 'left') return ARCH_SHIFT;
  if (side === 'right') return -ARCH_SHIFT;
  return 0;
}

/**
 * Two presentations, two distinct keys.
 *
 * `reduced` comes from a media-query store whose server snapshot is always
 * false, and the user can toggle the OS setting mid-session. Distinct keys make
 * React unmount one subtree wholesale and mount the other, so it never tries to
 * reconcile across the two very different DOM shapes.
 */
export default function ScrollStage() {
  const reduced = usePrefersReducedMotion();
  return reduced ? <StaticActs key="acts-static" /> : <ScrubStage key="acts-scrub" />;
}

/**
 * Visibility of an act at a given global progress.
 *
 * Act 1 never fades in (it is already on screen at first paint) and act 6 never
 * fades out (it holds the call to action at the end of the scroll), so the
 * sequence opens and closes on a held frame rather than on emptiness.
 */
// ---------------------------------------------------------------------------
// Interactive: sticky stage, scrubbed frame sequence
// ---------------------------------------------------------------------------

function ScrubStage() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /** The arch wrapper. Slides laterally to make room for each act's column. */
  const archRef = useRef<HTMLDivElement>(null);
  /**
   * The fixed-ratio arch aperture the canvas fills. Cover maths must be
   * computed against this box, not the viewport, or the frames stretch.
   */
  const apertureRef = useRef<HTMLDivElement>(null);

  const panelsRef = useRef<(HTMLDivElement | null)[]>([]);
  const cueRef = useRef<HTMLDivElement>(null);
  const mudraNameRef = useRef<HTMLSpanElement>(null);
  const mudraLiteralRef = useRef<HTMLSpanElement>(null);
  /** Order of the gesture last written to the caption. Guards redundant writes. */
  const captionedRef = useRef(-1);
  const framesRef = useRef<(HTMLImageElement | null)[]>([]);
  const loadedRef = useRef<boolean[]>([]);
  /** Last frame actually painted. Guards against redundant draws. */
  const paintedRef = useRef(-1);
  const activeActRef = useRef(-1);
  /** Cached measurements for the vertical centring. See StageLayout. */
  const layoutRef = useRef<StageLayout | null>(null);

  /** Progress of the gating pass only — see COARSE_STEP. */
  const [coarseLoaded, setCoarseLoaded] = useState(0);
  const [activeAct, setActiveAct] = useState(0);

  // -------------------------------------------------------------------------
  // Painting
  // -------------------------------------------------------------------------
  function draw(frame: number) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Nearest loaded frame at or before the requested one, so scrubbing during
    // the preload holds the last good image instead of flashing empty.
    let source = frame;
    while (source >= 1 && !loadedRef.current[source]) source -= 1;
    if (source < 1) {
      source = loadedRef.current.findIndex(Boolean);
      if (source === -1) return;
    }

    const img = framesRef.current[source];
    if (!img) return;

    // Cover-fit the whole plate. Hastas.mp4 carries no burned-in labels, so
    // unlike the previous source there is nothing to crop off the bottom.
    const scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;

    ctx.drawImage(
      img,
      0,
      0,
      img.naturalWidth,
      img.naturalHeight,
      (canvas.width - w) / 2,
      // Biased rather than centred, so a broader-than-source aperture loses the
      // forearm at the bottom instead of the fingertips at the top.
      (canvas.height - h) * CROP_BIAS,
      w,
      h,
    );
  }

  function resizeCanvas() {
    const canvas = canvasRef.current;
    const box = apertureRef.current;
    if (!canvas || !box) return;

    const rect = box.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    // Cap DPR at 2 — beyond that the memory cost buys nothing visible. The
    // source plate is 864px wide, which covers a 1440-logical retina aperture
    // outright and upscales about 12% at 1920-logical.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.round(rect.width * dpr);
    const height = Math.round(rect.height * dpr);
    if (canvas.width === width && canvas.height === height) return;

    canvas.width = width;
    canvas.height = height;
    // Resizing clears the backing store, so the current frame must be repainted.
    const painted = paintedRef.current;
    paintedRef.current = -1;
    draw(painted < 1 ? 1 : painted);
    paintedRef.current = painted;
  }

  /**
   * Measure once, not per tick: reading offsetHeight inside the scroll handler,
   * right after writing styles, would force a layout on every frame.
   */
  function measureLayout() {
    const arch = archRef.current;
    if (!arch) return;
    const header = document.querySelector('header');
    layoutRef.current = {
      archTop: arch.offsetTop,
      archHeight: arch.offsetHeight,
      cardHeights: panelsRef.current.map((el) => el?.querySelector('article')?.offsetHeight ?? 0),
      minTop: (header?.getBoundingClientRect().height ?? 0) + 8,
      viewport: window.innerHeight,
    };
  }

  /** Vertical offset, in px, that centres act `index` on screen. */
  function restingOffset(index: number): number {
    const layout = layoutRef.current;
    if (!layout) return 0;
    const act = ACTS[index];
    const card = layout.cardHeights[index];
    // Below sm every act docks its card under the arch, whatever its side.
    const stacked = act.side === 'center' || window.innerWidth < SHIFT_BREAKPOINT;
    // A side card docks with its foot at 92% of the arch's height (ActPanel's
    // bottom-[8%]). On a short viewport the arch is clamped small and the card
    // can be taller than that, standing proud of the arch's top; count it.
    const overhang = stacked ? 0 : Math.max(0, card - 0.92 * layout.archHeight);
    const block = stacked ? layout.archHeight + card : layout.archHeight + overhang;
    const centred = (layout.viewport - block) / 2;
    const clearOfMasthead = Math.max(centred, layout.minTop);
    const blockTop = Math.max(EDGE_GAP, Math.min(clearOfMasthead, layout.viewport - block - EDGE_GAP));
    return blockTop + overhang - layout.archTop;
  }

  // -------------------------------------------------------------------------
  // Preload
  // -------------------------------------------------------------------------
  useEffect(() => {
    framesRef.current = new Array(FRAME_COUNT + 1).fill(null);
    loadedRef.current = new Array(FRAME_COUNT + 1).fill(false);

    const { coarse, refine } = LOAD_ORDER;
    const queue = prefersLessData() ? coarse : coarse.concat(refine);

    let cancelled = false;
    let coarseSettled = 0;
    let cursor = 0;

    function pump() {
      if (cancelled || cursor >= queue.length) return;
      const index = queue[cursor];
      cursor += 1;
      const isCoarse = (index - 1) % COARSE_STEP === 0;

      const img = new Image();
      img.decoding = 'async';
      img.src = framePath(index);
      framesRef.current[index] = img;

      const done = (ok: boolean) => {
        if (cancelled) return;
        loadedRef.current[index] = ok;
        // Counted separately rather than inferred from the total: with eight
        // requests in flight the completion order is not the queue order, so a
        // plain tally would clear the preloader with coarse frames still missing.
        if (isCoarse) {
          coarseSettled += 1;
          setCoarseLoaded(coarseSettled);
        }
        // First frame in: paint immediately so the aperture is never empty.
        if (index === 1 && ok) draw(1);
        pump();
      };

      img.onload = () => done(true);
      img.onerror = () => done(false);
    }

    for (let i = 0; i < PRELOAD_CONCURRENCY; i += 1) pump();

    return () => {
      cancelled = true;
    };
  }, []);

  // -------------------------------------------------------------------------
  // Scroll wiring
  // -------------------------------------------------------------------------
  useIsomorphicLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const section = sectionRef.current;
    if (!section) return;

    const root = document.documentElement;

    resizeCanvas();
    measureLayout();

    const onUpdate = (progress: number) => {
      // Frame scrub. Only touch the canvas when the integer frame changes.
      const frame = Math.min(FRAME_COUNT, Math.floor(progress * (FRAME_COUNT - 1)) + 1);
      if (frame !== paintedRef.current) {
        paintedRef.current = frame;
        draw(frame);
      }

      // Copy layers. Written directly — re-rendering React 324 times per pass
      // would drop frames.
      let leader = 0;
      let leaderAlpha = -1;

      for (let i = 0; i < ACTS.length; i += 1) {
        const el = panelsRef.current[i];
        if (!el) continue;

        const alpha = actVisibility(ACTS[i], progress);
        el.style.opacity = String(alpha);
        el.style.transform = `translate3d(0, ${(1 - alpha) * 22}px, 0)`;

        // Inactive panels stay in the DOM for crawlers but leave the tab order
        // and the accessibility tree, so nobody tabs into invisible copy.
        if (alpha < 0.02) el.setAttribute('inert', '');
        else el.removeAttribute('inert');

        if (alpha > leaderAlpha) {
          leaderAlpha = alpha;
          leader = i;
        }
      }

      // The arch travels through the gap the copy leaves behind: it holds
      // position while an act is being read, then moves once that act's text has
      // gone and arrives before the next act's text appears.
      const arch = archRef.current;
      if (arch) {
        const { fromSide, toSide, fromIndex, toIndex, lerp, travel } = archState(progress);
        const wide = window.innerWidth >= SHIFT_BREAKPOINT;
        const from = wide ? archOffsetFor(fromSide) : 0;
        const to = wide ? archOffsetFor(toSide) : 0;
        const shift = (from + (to - from) * lerp) * window.innerWidth;

        // A shallow dip mid-journey, so the aperture reads as stepping back to
        // move rather than sliding flatly across the page. Opacity is left alone
        // — fading it would wash the video out against the cream ground.
        const scale = 1 - 0.045 * travel;
        const fromY = restingOffset(fromIndex);
        const lift = fromY + (restingOffset(toIndex) - fromY) * lerp - 10 * travel;
        arch.style.transform = `translate3d(calc(-50% + ${shift.toFixed(1)}px), ${lift.toFixed(1)}px, 0) scale(${scale.toFixed(4)})`;
      }

      if (leader !== activeActRef.current) {
        activeActRef.current = leader;
        setActiveAct(leader);
      }

      // The cue retires as soon as the page moves at all. Written here rather
      // than held in React state so it shares the panels' single style pass.
      const cue = cueRef.current;
      if (cue) {
        cue.style.opacity = String(1 - Math.min(1, progress / CUE_FADE));
      }

      // Chapter progress for the phone indicator, published as a custom property
      // on the root rather than written to an element here.
      //
      // StageProgress cannot live inside this stage: `position: sticky` creates a
      // stacking context whatever its z-index, so anything nested under the
      // sticky container is sealed below the masthead's own z-40 and no z-index
      // on the bar itself can lift it out. A variable on the root lets the bar be
      // rendered as a sibling of the masthead while still being driven from here.
      root.style.setProperty('--stage-progress', progress.toFixed(4));

      // Caption whatever gesture is genuinely on screen.
      const live = mudraAtProgress(progress);
      if (live.order !== captionedRef.current) {
        captionedRef.current = live.order;
        if (mudraNameRef.current) mudraNameRef.current.textContent = live.name;
        if (mudraLiteralRef.current) mudraLiteralRef.current.textContent = live.literal;
      }
    };

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => onUpdate(self.progress),
      onRefresh: (self) => onUpdate(self.progress),
      // onUpdate does not fire outside the range, so the indicator would
      // otherwise stay parked at full width over the testimonials and footer.
      onToggle: (self) => root.style.setProperty('--stage-shown', self.isActive ? '1' : '0'),
    });

    const onResize = () => {
      resizeCanvas();
      measureLayout();
      onUpdate(trigger.progress);
    };
    window.addEventListener('resize', onResize);

    // Card heights change when the web fonts arrive, so measure again then.
    let disposed = false;
    document.fonts?.ready.then(() => {
      if (disposed) return;
      measureLayout();
      onUpdate(trigger.progress);
    });

    onUpdate(0);

    return () => {
      disposed = true;
      window.removeEventListener('resize', onResize);
      trigger.kill();
      root.style.removeProperty('--stage-progress');
      root.style.removeProperty('--stage-shown');
    };
  }, []);

  const ready = coarseLoaded >= COARSE_TOTAL;

  return (
    <div
      ref={sectionRef}
      // bg-silk-deep is a backstop, not decoration. The sticky child covers this
      // completely in normal operation, so it is only ever seen if the child
      // under-covers the viewport again on some browser that reports `lvh` short.
      // Matching the wash's own bottom edge means such a gap blends instead of
      // flashing cream, which is how the last one announced itself.
      className="relative bg-silk-deep h-[var(--stage-span)] sm:h-[var(--stage-span-wide)]"
      style={
        {
          '--stage-span': `${ACTS.length * ACT_SPAN_SVH_PHONE}svh`,
          '--stage-span-wide': `${ACTS.length * ACT_SPAN_SVH}svh`,
        } as React.CSSProperties
      }
    >
      <FramePreloader loaded={coarseLoaded} total={COARSE_TOTAL} done={ready} />

      {/*
        `lvh`, not `svh` — the large viewport height, measured as if the mobile
        toolbar were hidden.

        With `h-svh` this box was sized for the toolbar being *visible*. The
        moment Chrome or Safari retracted the toolbar the viewport grew, the
        pinned stage stopped reaching the bottom of the screen, and the strip
        below it exposed the page's cream against this stage's `silk-deep`
        gradient edge — a hard seam about 110px up from the foot of the screen,
        reported as a white patch stuck to the bottom while scrolling.

        `lvh` overshoots instead: when the toolbar *is* showing, the last ~56px of
        the wash sits below the fold, which costs nothing because that region is
        empty vignette. Everything inside is positioned in svh from the top, or
        relative to the arch, so nothing moves.

        The principle, worth keeping: size CONTENT against svh, because the
        toolbar can reappear at any moment and the act card must not clip when it
        does; size the BACKDROP against lvh, because it must cover the largest the
        viewport can get. The arch's own height budget stays in svh for exactly
        that reason.

        Deliberately not `dvh`. That would track the viewport exactly, but it
        changes height mid-scroll as the toolbar slides, resizing a sticky element
        during the one interaction this whole page exists to serve.

        NOTE FOR ANYONE VERIFYING THIS: it does not reproduce in DevTools device
        emulation. There is no retractable toolbar there, so svh, lvh and dvh all
        collapse to the same value and the seam cannot appear. Check on a real
        phone, scrolled far enough down that the browser has hidden its chrome.
      */}
      <div className="sticky top-0 h-lvh w-full overflow-hidden">
        {/* Warm jewel-tone wash behind the arch, so the frame's dark backdrop
            reads as a lit cinematic window rather than a hole in the page. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_18%,var(--color-silk)_0%,var(--color-cream)_46%,var(--color-silk-deep)_100%)]"
        />

        <div className="relative h-full w-full">
          {/*
            The arch sits above centre rather than dead centre. Patāka and most
            of the other gestures fill the plate top to bottom, so there is no
            dead zone inside the aperture to put a card over — the centre acts
            need clear cream below the arch to sit on. Everything below is
            measured in svh so the same proportions hold on any viewport.

            SIZING, AND WHY THE TWO BREAKPOINTS DISAGREE
            -------------------------------------------
            From `sm` up the arch is sized by HEIGHT and its width follows from
            the source aspect ratio. `max-h` reserves room beneath it for the
            card: centre acts dock flush at 100% of the arch height, and the
            card's height is content-driven in px, not svh, so without the cap a
            tall arch on a short viewport pushed the card past the foot of the
            stage where `overflow-hidden` clipped it.

            On phones that arrangement failed. Sizing by height meant the 0.72
            portrait ratio also throttled the width — 219px of an available
            390px — while the card sat at 92vw and ran to 393px tall. The image
            ended up a fifth of the composition by area and read as an accessory
            above a block of text.

            So below `sm` the arch is sized by WIDTH instead, against a broader
            aperture (--arch-ratio-phone). The `min()` still honours a height
            budget for the card, which is what keeps short viewports from
            clipping; it is simply no longer the only term. The 1.1236 factor is
            1 / 0.89, so when the width term wins the arch lands at exactly
            84vw.

            Verify after touching any of these numbers: the card must not reach
            the foot of the stage at 360x800, 390x844 or 375x667, which is the
            tightest of the three. The `phone-short` variant relaxes the reserve
            from 23rem to 19rem, which is only safe because that variant also
            drops the trailing paragraph from every act — the two numbers are a
            pair and must move together.

            Centring is done in the inline transform, NOT with -translate-x-1/2.
            Tailwind v4 compiles translate utilities to the standalone `translate`
            property, which composes with `transform` rather than being
            overridden by it — using both shifted the arch by -100% instead of
            -50%. The inline default keeps it centred before the first scroll tick.
          */}
          <div
            ref={archRef}
            style={{ transform: 'translate3d(-50%, 0, 0)' }}
            className="absolute top-[8svh] left-1/2 h-[min(calc(84vw*1.1236),calc(92svh-23rem))] phone-short:h-[min(calc(84vw*1.1236),calc(92svh-19rem))] sm:top-[5svh] sm:h-[56svh] sm:max-h-[calc(95svh-22rem)] lg:h-[62svh]"
          >
            <figure className="relative m-0 h-full">
              {/* Inside the arch's transform group so it stays beside the
                  aperture at every size — see the note in ScrollCue. */}
              <ScrollCue ref={cueRef} />

              <div
                ref={apertureRef}
                className="arch-fade relative h-full aspect-[var(--arch-ratio-phone)] overflow-hidden bg-teal-deep sm:aspect-[var(--arch-ratio)]"
              >
                {/*
                  The picture and its tints. The fade at the foot is part of the
                  aperture's own mask (arch-fade in globals.css), so the arch
                  dissolves into whatever the page is behind it.

                  It used to fade to flat cream with an overlay. That only
                  matched while the arch sat high on the stage; once it was
                  centred vertically its foot landed on the darker lower half of
                  the radial wash, and a cream fade there read as a pale
                  rectangle stuck under the arch.
                */}
                <div className="absolute inset-0">
                  <canvas
                    ref={canvasRef}
                    className="block h-full w-full"
                    role="img"
                    aria-label="A dancer's hand forming the asamyuta hastas of Bharatanatyam, one gesture flowing into the next"
                  />

                  {/* The footage was shot on a neutral grey backdrop. Tinting the
                      hue toward peacock teal without touching luminance makes the
                      aperture read as a lit cinematic window rather than a grey
                      hole punched in a cream page.

                      Both layers are kept light on purpose: the dancer's fingers
                      are alta-stained a deep red, and at heavier settings they
                      went muddy against the teal. */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-teal opacity-25 mix-blend-color"
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-[radial-gradient(85%_60%_at_50%_30%,transparent_0%,rgba(20,54,66,0.28)_100%)]"
                  />
                </div>
              </div>

              {/* The stroke fades with the picture, so the foot dissolves instead of
                  ending on two hairlines that stop in mid-air. */}
              <ArchOutline className="[mask-image:linear-gradient(to_bottom,black_68%,transparent_92%)]" />

              {/*
                Live gesture caption — dark kumkum on the arch's own bottom fade,
                which is transparent by this height, so the caption sits on the
                page's wash (kumkum 5.5:1 and ink-faint 4.85:1 even on silk-deep,
                the wash's darkest stop). No plate behind it: a
                frosted pill was tried and it read as a UI chip stuck on the
                artwork rather than as part of the composition.

                This position is only legible because nothing covers it. The
                centre acts dock their card flush *below* the arch rather than
                overlapping its foot, precisely to keep this strip clear — see
                ActPanel. If a card is ever moved back over the arch's bottom, the
                caption has to move with it.

                Named from the frame actually on screen rather than from the act's
                anchor, so it stays truthful through the twenty-two transition
                gestures the acts do not claim. Written imperatively for the same
                reason the panels are.
              */}
              <figcaption className="pointer-events-none absolute inset-x-0 bottom-[2%] flex items-center justify-center gap-2.5">
                <span aria-hidden className="rule-fade w-5 shrink-0 sm:w-8" />
                <span className="text-center">
                  <span
                    ref={mudraNameRef}
                    className="block font-display text-[0.75rem] tracking-[0.16em] text-kumkum sm:text-[0.8rem]"
                  />
                  <span
                    ref={mudraLiteralRef}
                    className="mt-0.5 block font-sans text-micro tracking-[0.06em] text-ink-faint sm:text-micro"
                  />
                </span>
                <span aria-hidden className="rule-fade w-5 shrink-0 sm:w-8" />
              </figcaption>
            </figure>

            {/*
              The editorial cards live inside the arch's transform group, so they
              are carried by the same translate and scale as the aperture. That is
              what makes the arch and its text read as one object rather than two
              layers that happen to move together.

              The container ignores pointer events; individual controls opt back
              in, so a wheel gesture over a card still scrolls the stage.
            */}
            <div className="pointer-events-none absolute inset-0">
              {ACTS.map((act, i) => (
                <ActPanel
                  key={act.id}
                  act={act}
                  ref={(el) => {
                    panelsRef.current[i] = el;
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <ChapterRail activeIndex={activeAct} sectionRef={sectionRef} />
      </div>
    </div>
  );
}
