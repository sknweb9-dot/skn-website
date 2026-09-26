/**
 * The invitation to scroll, set beside the arch.
 *
 * WHY IT MOVED HERE
 * -----------------
 * It used to be the last line inside act 1's card — uppercase ink-faint at
 * 0.62rem, under a red button, inside a panel already carrying an eyebrow, a
 * headline, a paragraph and a call to action. It was the least visible thing on
 * the most important screen. Out here it has a whole column to itself and
 * nothing to compete with.
 *
 * FORM
 * ----
 * Letters stacked one per line rather than a rotated word. `writing-mode:
 * vertical-rl` would be fewer lines of CSS, but it lays Latin capitals on their
 * side and reads as browser chrome; a column of upright letters reads as an
 * inscription, which is the register the rest of the page is in.
 *
 * The rule beneath is the moving part. A brighter marigold segment travels down
 * a static hairline — the eye follows the direction of travel, which is the whole
 * job of the thing. The arrow drifts a few pixels on the same cycle. Both are
 * CSS keyframes rather than GSAP: this is decoration, and it should not be
 * another subscriber to the scroll position.
 *
 * Desktop only. On phones the arch is now 84vw wide and the margin either side
 * is too narrow to hold a legible column — and a phone reader does not need to
 * be told that a page scrolls.
 *
 * POSITION
 * --------
 * Anchored to the arch's own box with `right-full`, not to the viewport centre.
 * An offset measured from the centre cannot stay beside the arch, because the
 * arch's width follows its height and its height is clamped by the card reserve —
 * so the same offset that sat 35px from the edge at 1440x900 sat *inside* the
 * aperture at 1024x800.
 *
 * The cost is that the cue is inside the arch's transform group and inherits its
 * travel and scale dip. That is free in practice: it has faded out by 1.2% of
 * scroll progress, and the first time the arch moves is at 10%.
 *
 * Opacity is written by ScrollStage on every tick, alongside the act panels, so
 * the cue retires the moment the journey it is inviting actually begins. Nothing
 * here should set opacity, or the two will fight.
 */
export default function ScrollCue({ ref }: { ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute top-[7%] right-full mr-7 hidden flex-col items-center gap-3 sm:flex lg:mr-10"
    >
      <span className="flex flex-col items-center font-sans text-micro leading-[1.9] font-semibold tracking-[0.14em] text-ink uppercase">
        {'Scroll'.split('').map((letter, i) => (
          <span key={`${letter}-${i}`}>{letter}</span>
        ))}
      </span>

      {/* The travelling segment is a gradient taller than its track, animated by
          background-position. Transform would be smoother still but would need a
          second element; at this size and speed the difference is invisible. */}
      <span className="cue-rule" />

      <span className="font-sans text-[0.7rem] text-ink motion-safe:animate-cue-arrow">↓</span>
    </div>
  );
}
