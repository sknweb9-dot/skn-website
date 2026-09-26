'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import { SITE } from '@/lib/site';

/**
 * Frame preload indicator.
 *
 * WHAT REPLACED WHAT
 * ------------------
 * First a foil percentage counting to 100, then a hand-authored trefoil that drew
 * itself. The academy read the trefoil as a placeholder rather than their mark,
 * which is fair: it was a geometric abstraction of the emblem, not the emblem.
 * Now the real emblem sits at the centre and a single ring draws around it —
 * progress is the ring, and the mark is theirs.
 *
 * The file is /img/logo-emblem.png, the academy's approved emblem and the same
 * file the masthead uses, so the loader costs no extra request.
 *
 * The number has not simply been deleted. It still exists where it is load-bearing
 * — as `aria-valuenow` on a progressbar role, and in a visually-hidden live
 * region — so a screen reader hears "40%" while everyone else watches a line
 * travel. What is gone is the visual counter.
 *
 * WHY THE PROGRESS IS FLOORED IN TIME
 * -----------------------------------
 * On a second visit the 82 frames of the gating pass are already in the HTTP cache
 * and `loaded` reaches `total` almost immediately. Drawn straight, the emblem would
 * snap to complete in a frame or two and the screen would read as a flash of cream —
 * worse than no animation at all. So the drawn fraction is also capped by elapsed
 * time: it can never outrun MIN_DRAW_MS, which means a cached visit still gets the
 * full gesture and a slow connection is still told the truth. It never runs *ahead*
 * of real loading, only behind it.
 *
 * The two limits are kept apart rather than merged into one piece of state. `paced`
 * is the clock alone, so it needs nothing from render and the rAF loop can retire
 * the moment it reaches 1; the min() against real progress happens during render.
 * Under reduced motion `paced` simply never starts and the real figure is used.
 *
 * The stage underneath is usable before this clears: ScrollStage's draw() falls
 * back to the nearest already-loaded frame, so an early scroll degrades to a
 * coarser scrub rather than an empty aperture.
 */

/** The emblem at the centre of the loader. */
const LOGO_SRC = '/img/logo-emblem.png';

/** Shortest time the ring is allowed to take to draw itself. */
const MIN_DRAW_MS = 1500;

/** Fade duration after the draw completes. Matches the CSS transition below. */
const FADE_MS = 800;

export default function FramePreloader({
  loaded,
  total,
  done,
}: {
  loaded: number;
  total: number;
  done: boolean;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const [gone, setGone] = useState(false);
  /** The clock's ceiling on the draw, 0–1. Stays 0 under reduced motion. */
  const [paced, setPaced] = useState(0);

  const actual = total > 0 ? Math.min(1, loaded / total) : 0;

  /**
   * Whichever of real progress and the time budget is further behind. Truthful,
   * and never instantaneous. Under reduced motion there is no draw to pace, so
   * the real figure is used directly.
   */
  const shown = reducedMotion ? actual : Math.min(actual, paced);

  useEffect(() => {
    if (reducedMotion) return;

    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / MIN_DRAW_MS);
      setPaced(t);
      // Nothing left to pace once the budget is spent; real progress takes over.
      if (t < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reducedMotion]);

  const drawn = shown >= 0.999;
  /** Only leave once the frames are in AND the mark has finished drawing. */
  const finished = done && drawn;

  useEffect(() => {
    if (!finished) return;
    const t = setTimeout(() => setGone(true), FADE_MS + 200);
    return () => clearTimeout(t);
  }, [finished]);

  if (gone) return null;

  const pct = Math.round(shown * 100);

  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Loading the gesture sequence"
      aria-hidden={finished}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-cream transition-opacity ease-out ${
        finished ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <div className="relative">
        <div className="relative size-[clamp(7rem,22vw,10.5rem)]">
          {/* The ring: a faint track, and the drawn arc over it. pathLength=1
              lets the dash offset be the progress fraction directly. */}
          <svg viewBox="0 0 120 120" aria-hidden className="absolute inset-0 -rotate-90">
            <circle cx="60" cy="60" r="57" fill="none" stroke="var(--color-marigold)" strokeOpacity={0.22} strokeWidth={1.5} />
            <circle
              cx="60"
              cy="60"
              r="57"
              fill="none"
              stroke="var(--color-marigold)"
              strokeWidth={2}
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - shown}
            />
          </svg>
          <Image
            src={LOGO_SRC}
            alt=""
            width={168}
            height={168}
            priority
            className="absolute inset-[15%] size-[70%] object-contain"
          />
        </div>

        {/* The completion bloom: one expanding ring, once. Keyed on `drawn` so it
            plays at the moment the last circle closes rather than on mount. */}
        {drawn && !reducedMotion ? (
          <span
            aria-hidden
            className="animate-emblem-bloom pointer-events-none absolute inset-0 rounded-full border border-marigold"
          />
        ) : null}
      </div>

      <p className="eyebrow mt-9">{SITE.name}</p>

      <p className="mt-2.5 font-sans text-[0.7rem] tracking-[0.2em] text-ink-faint uppercase">
        Preparing the gestures
      </p>

      {/* The figure, for anyone who cannot see the drawing. */}
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {pct}% loaded
      </span>
    </div>
  );
}
