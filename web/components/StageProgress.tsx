import { ACTS } from '@/lib/acts';

/**
 * Chapter progress, for screens too narrow to carry the rail.
 *
 * ChapterRail is `hidden md:flex`, which left phones with no answer to the two
 * questions a long scroll provokes: how much of this is there, and where am I.
 * Six acts is 720svh on a phone, and a reader who cannot see an end to it is a
 * reader who leaves.
 *
 * So: a hairline across the top, filled in marigold as far as the reader has
 * come, ticked at the five internal act boundaries. The ticks are read from the
 * windows rather than spaced evenly — the acts are not equal sixths (see
 * lib/acts.ts) and pretending otherwise would put the marks in the wrong places.
 *
 * Indicative, not interactive. At two pixels tall it is far too small to be a
 * touch target, and offering one that misses would be worse than offering none;
 * the menu is where a phone reader jumps from.
 *
 * WHY IT IS DRIVEN BY A CSS VARIABLE
 * ---------------------------------
 * This has to be a sibling of the masthead, not a child of the stage. The stage's
 * pinned container is `position: sticky`, which creates a stacking context
 * whatever its z-index — so anything nested inside it is sealed below the
 * masthead's z-40, and no z-index on this bar could lift it out. That cost a
 * while to find, because the element measured perfectly correct the whole time:
 * right size, right position, right colours, simply painted underneath.
 *
 * ScrollStage therefore publishes `--stage-progress` (0–1) and `--stage-shown`
 * on the document root, and this reads them. It also means the bar costs no
 * React renders: the scroll loop writes one custom property and CSS does the rest.
 */
export default function StageProgress() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[45] h-0.5 bg-ink/10 opacity-[var(--stage-shown,0)] transition-opacity duration-500 md:hidden"
    >
      <div
        className="h-full origin-left bg-marigold"
        style={{ transform: 'scaleX(var(--stage-progress, 0))' }}
      />

      {ACTS.slice(0, -1).map((act) => (
        <span
          key={act.id}
          className="absolute top-0 h-full w-px bg-ink/30"
          style={{ left: `${act.window.end * 100}%` }}
        />
      ))}
    </div>
  );
}
