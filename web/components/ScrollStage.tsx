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
  FRAME_HEIGHT,
  VISIBLE_FRAME_HEIGHT,
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
 * All 327 frames are 4.4 MB. Waiting for every one of them behind a full-screen
 * preloader is a long stare at a percentage on mobile data, for a scrub that
 * degrades gracefully anyway: draw() already falls back to the nearest loaded
 * frame at or before the one requested.
 *
 * So every fourth frame is fetched first — 82 files, about 1.1 MB — and the
 * preloader clears on that. The remaining three quarters stream in behind it and
 * the scrub sharpens as they land, which on any reasonable connection happens
 * before the reader has finished the first act.
 *
 * Dropping the other three quarters altogether was the obvious alternative and
 * the wrong one: at 327 frames the desktop scrub is already at ~27.5px of scroll
 * per frame, against a documented steppiness threshold of ~30 (see lib/mudras.ts).
 * A quarter of the frames would put it at 110 and the gesture would stutter. The
 * bytes are not the problem; blocking on them was.
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
 * their browser to spend less deserves a steppier scrub, not a silent 4.4 MB.
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
 * 160 on a pointer device gives the scrub room to breathe: 327 frames over six
 * acts is about 27.5px of scroll per frame at 1440x900, just inside the ~30px
 * steppiness threshold documented in lib/mudras.ts.
 *
 * Phones get 120. A thumb covers less ground than a wheel, and 960svh is a long
 * way to flick — while the shorter span actually *improves* the scrub, because
 * the same 327 frames are spread over less distance: about 18.6px per frame on a
 * 390x844 screen. Less work, smoother result.
 *
 * Neither number touches the act windows, which are normalised to 0–1, so the
 * pacing checker in _research/check_act_windows.py is unaffected.
 */
const ACT_SPAN_SVH = 160;
const ACT_SPAN_SVH_PHONE = 120;

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

    // Crop the burned-in label off the bottom of the plate, then cover-fit what
    // remains. Scaling the crop height by the image's own natural height keeps
    // this correct even if the frames are ever re-exported at another size.
    const cropH = img.naturalHeight * (VISIBLE_FRAME_HEIGHT / FRAME_HEIGHT);
    const scale = Math.max(canvas.width / img.naturalWidth, canvas.height / cropH);
    const w = img.naturalWidth * scale;
    const h = cropH * scale;

    ctx.drawImage(
      img,
      0,
      0,
      img.naturalWidth,
      cropH,
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

    // Cap DPR at 2 — beyond that the memory cost buys nothing visible, and the
    // source is only 720px wide regardless.
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

    const onUpdate = (progress: number) => {
      // Frame scrub. Only touch the canvas when the integer frame changes.
      const frame = Math.min(FRAME_COUNT, Math.floor(progress * (FRAME_COUNT - 1)) + 1);
      if (frame !== paintedRef.current) {
        paintedRef.current = frame;
        draw(frame);
      }

      // Copy layers. Written directly — re-rendering React 327 times per pass
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
        const { fromSide, toSide, lerp, travel } = archState(progress);
        const wide = window.innerWidth >= SHIFT_BREAKPOINT;
        const from = wide ? archOffsetFor(fromSide) : 0;
        const to = wide ? archOffsetFor(toSide) : 0;
        const shift = (from + (to - from) * lerp) * window.innerWidth;

        // A shallow dip mid-journey, so the aperture reads as stepping back to
        // move rather than sliding flatly across the page. Opacity is left alone
        // — fading it would wash the video out against the cream ground.
        const scale = 1 - 0.045 * travel;
        const lift = -10 * travel;
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
      onUpdate(trigger.progress);
    };
    window.addEventListener('resize', onResize);

    onUpdate(0);

    return () => {
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
      className="relative h-[var(--stage-span)] sm:h-[var(--stage-span-wide)]"
      style={
        {
          '--stage-span': `${ACTS.length * ACT_SPAN_SVH_PHONE}svh`,
          '--stage-span-wide': `${ACTS.length * ACT_SPAN_SVH}svh`,
        } as React.CSSProperties
      }
    >
      <FramePreloader loaded={coarseLoaded} total={COARSE_TOTAL} done={ready} />

      <div className="sticky top-0 h-svh w-full overflow-hidden">
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
                className="arch relative h-full aspect-[var(--arch-ratio-phone)] overflow-hidden bg-teal-deep shadow-[0_40px_120px_-50px_rgba(20,54,66,0.75)] sm:aspect-[var(--arch-ratio)]"
              >
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
                {/* Dissolve the foot of the arch into the page. Without this the
                    mask ends on a hard horizontal cut, which reads as clipping
                    rather than as a window. */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-[22%] bg-gradient-to-b from-transparent to-cream"
                />
              </div>

              <ArchOutline />

              {/*
                Live gesture caption — dark kumkum on the arch's own bottom fade,
                which has resolved to cream by this height. No plate behind it: a
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
                    className="mt-0.5 block font-sans text-[0.6rem] tracking-[0.06em] text-ink-faint sm:text-[0.65rem]"
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
