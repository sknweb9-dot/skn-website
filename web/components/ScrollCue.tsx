import type { CSSProperties } from 'react';

/**
 * The invitation to scroll, set beside the arch. Two forms, one for each
 * presentation of the home page.
 *
 * `capsule` — phones and tablets (the rail), and the stacked page
 * ----------------------------------------------------------------
 * A capsule with a marigold bead travelling down it, and the word beneath. This
 * replaced a column of stacked 11px capitals over a hairline. That was the
 * quieter object, and the academy's feedback was that it was too quiet: people
 * did not realise the page scrolls, which on a page whose whole content is the
 * scroll is the one thing that must not be missed. The capsule is the most
 * widely understood "scroll" affordance there is.
 *
 * It is server-rendered into the hero's still arch, so it sits in the document
 * and scrolls away with the hero rather than being driven by the script. The
 * stage hides it (app/styles/scroll-cue.css), which has its own.
 *
 * `vertical` — the desktop stage
 * ------------------------------
 * The word set vertically in ink, in the display face, reading downward, with an
 * arrow beneath it. Each letter and then the arrow dips and springs back in turn,
 * a few pixels each, so a small wave runs down the word and off the end of the
 * arrow: the direction the page is asked to go. The spring is a damped
 * oscillation sampled into a CSS `linear()` curve (see `cue-spring` in
 * app/styles/scroll-cue.css), so the letters overshoot and settle rather than easing back.
 * Then it rests for most of the cycle. Under reduced motion it all sits still.
 *
 * It is centred on the arch's left edge, where the side is straight, rather than
 * hung from the dome's shoulder. It is anchored to the arch's own box with
 * `right-full`, not to the viewport centre: an offset from the centre cannot
 * stay beside the arch, because the arch's width follows its clamped height. It
 * inherits the arch's travel, which costs nothing: it has faded out by 1.2% of
 * scroll progress, and the arch first moves at 10%. Opacity is written by the
 * home arch on every tick, so nothing here should set it.
 */
const WORD = 'Scroll';

export default function ScrollCue({
  variant,
  ref,
}: {
  variant: 'capsule' | 'vertical';
  ref?: React.Ref<HTMLDivElement>;
}) {
  if (variant === 'capsule') {
    // A span, not a div: the hero still's own rules address its `> div` (to hide
    // the picture once the live arch is up), and this must not be caught by them.
    // The figure is the picture plus its two-line caption, so half of it sits
    // 1.5rem below the middle of the arch; the offset puts the cue on the arch.
    return (
      <span
        aria-hidden
        className="rail-cue pointer-events-none absolute top-[calc(50%-1.5rem)] left-full ml-1 flex -translate-y-1/2 flex-col items-center gap-2.5"
      >
        <span className="cue-capsule">
          <span className="cue-bead" />
        </span>
        <span className="font-display text-micro font-semibold tracking-[0.04em] text-teal-deep uppercase">
          {WORD}
        </span>
      </span>
    );
  }

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute top-1/2 right-full mr-8 flex -translate-y-1/2 flex-col items-center gap-3.5 lg:mr-12"
    >
      <span className="cue-word">
        {WORD.split('').map((letter, i) => (
          <span key={i} className="cue-letter" style={{ '--i': i } as CSSProperties}>
            {letter}
          </span>
        ))}
      </span>
      <svg
        viewBox="0 0 16 40"
        className="cue-arrow"
        style={{ '--i': WORD.length } as CSSProperties}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 2v34M2 30l6 6 6-6" />
      </svg>
    </div>
  );
}
