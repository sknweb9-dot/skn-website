'use client';

import { useEffect, useState } from 'react';

/**
 * Frame preload indicator.
 *
 * Stays mounted through a fade-out so the cream ground does not snap away, then
 * unmounts entirely — it must not linger as an invisible layer over the stage.
 *
 * The stage underneath is usable before this clears: ScrollStage's draw() falls
 * back to the nearest already-loaded frame, so an early scroll degrades to a
 * coarser scrub rather than an empty aperture.
 */
export default function FramePreloader({
  loaded,
  total,
  done,
}: {
  loaded: number;
  total: number;
  done: boolean;
}) {
  const [gone, setGone] = useState(false);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setGone(true), 900);
    return () => clearTimeout(t);
  }, [done]);

  if (gone) return null;

  const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;

  return (
    <div
      aria-hidden={done}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-cream transition-opacity duration-700 ${
        done ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      <p className="eyebrow">Shanti Kala Nikketan</p>

      <p
        className="mt-5 font-display text-[clamp(2.5rem,9vw,4.5rem)] leading-none font-semibold foil"
        aria-live="polite"
        aria-atomic="true"
      >
        {pct}
        <span className="text-[0.4em] align-super">%</span>
      </p>

      <div className="mt-6 h-px w-56 overflow-hidden bg-ink/10 sm:w-72">
        <div
          className="h-full bg-marigold transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="mt-5 font-sans text-[0.7rem] tracking-[0.2em] text-ink-faint uppercase">
        Preparing the gestures
      </p>
    </div>
  );
}
