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
 * and scrolls away with the hero rather than being driven by the script. It was
 * desktop-only until the phone layout got a hero arch wide enough to leave a
 * margin for it; the stage hides it (globals.css), which has its own.
 *
 * `vertical` — the desktop stage
 * ------------------------------
 * The word set vertically in ink, reading downward, with an arrow beneath it that
 * bounces a few pixels. The word is still, the arrow moves: the eye follows the
 * direction of travel, and a quiet loop is enough on a large screen where the
 * cue has a lot of empty room to itself. Under reduced motion the arrow rests.
 *
 * It is anchored to the arch's own box with `right-full`, not to the viewport
 * centre: an offset from the centre cannot stay beside the arch, because the
 * arch's width follows its clamped height. It inherits the arch's travel, which
 * costs nothing: it has faded out by 1.2% of scroll progress, and the arch first
 * moves at 10%. Opacity is written by the home arch on every tick, so nothing
 * here should set it.
 */
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
    return (
      <span
        aria-hidden
        className="rail-cue pointer-events-none absolute top-[6%] left-full ml-2.5 flex flex-col items-center gap-2.5"
      >
        <span className="cue-capsule">
          <span className="cue-bead" />
        </span>
        <span className="font-sans text-xs font-semibold tracking-[0.18em] text-teal-deep uppercase">
          Scroll
        </span>
      </span>
    );
  }

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute top-[10%] right-full mr-8 flex flex-col items-center gap-4 lg:mr-12"
    >
      <span className="cue-word">Scroll</span>
      <svg viewBox="0 0 16 40" className="cue-arrow" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 2v34M2 30l6 6 6-6" />
      </svg>
    </div>
  );
}
