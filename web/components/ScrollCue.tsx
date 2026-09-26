/**
 * The invitation to scroll, set beside the arch.
 *
 * FORM
 * ----
 * A capsule with a marigold bead travelling down it, and the word beneath.
 *
 * This replaced a column of stacked 11px capitals over a hairline. That was the
 * quieter object, and the academy's feedback was that it was too quiet: people
 * did not realise the page scrolls, which on a page whose whole content is the
 * scroll is the one thing that must not be missed. The capsule is the most
 * widely understood "scroll" affordance there is, so it is used plainly here,
 * at a size that reads from across a room.
 *
 * The bead is the moving part — the eye follows the direction of travel. It is a
 * CSS keyframe rather than GSAP: this is decoration and should not be another
 * subscriber to the scroll position. Under reduced motion the bead simply sits
 * at the top of the capsule; the shape still says "scroll".
 *
 * Desktop only. On phones the arch is 84vw wide and the margins cannot hold it,
 * and a touch reader discovers scrolling with their first gesture.
 *
 * POSITION
 * --------
 * Anchored to the arch's own box with `right-full`, not to the viewport centre:
 * an offset from the centre cannot stay beside the arch, because the arch's
 * width follows its clamped height. It inherits the arch's travel and scale dip,
 * which costs nothing — it has faded out by 1.2% of scroll progress, and the arch
 * first moves at 10%.
 *
 * Opacity is written by ScrollStage on every tick. Nothing here should set it.
 */
export default function ScrollCue({ ref }: { ref?: React.Ref<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute top-[10%] right-full mr-8 hidden flex-col items-center gap-3 sm:flex lg:mr-12"
    >
      <span className="cue-capsule">
        <span className="cue-bead" />
      </span>
      <span className="font-sans text-xs font-semibold tracking-[0.18em] text-teal-deep uppercase">
        Scroll
      </span>
    </div>
  );
}
