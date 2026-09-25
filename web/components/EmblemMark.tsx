/**
 * The emblem's geometry, hand-authored so it can be drawn.
 *
 * WHY NOT THE REAL LOGO SVG
 * -------------------------
 * /img/logo-full.svg cannot be animated. It is a VTracer auto-trace of the raster
 * artwork: 4,436 unnamed <path> elements, no <g>, no viewBox, no structure. There
 * is no "the three circles" or "the palms" in it to draw on, reveal, or rotate —
 * only an undifferentiated cloud of outlines. It is also 330KB, which for a thing
 * whose entire job is to appear before anything else has loaded is self-defeating.
 *
 * So this is not a copy of the logo. It is the two parts of the emblem that are
 * pure geometry, authored from scratch: the three interwoven circles, and the
 * circle that encloses them. lib/lineage.ts records what the academy says each
 * one means — the three for dance, music and the fine arts, "each with its own
 * unique identity, together enriching the artist's journey"; the enclosing circle
 * for "wholeness, continuity, and the lifelong journey of learning".
 *
 * Lord Ganesha and the open palms are deliberately absent. They are figurative,
 * and approximating someone's devotional artwork from memory in thirty lines of
 * SVG would produce something both worse and less honest than leaving it out. The
 * full emblem stays where it belongs: on /about, at a size where it can be seen.
 *
 * Whole thing is about 900 bytes of markup and four <circle> elements.
 */

/** Trefoil geometry, in a 120x120 box centred on (60, 60). */
const CENTRE = 60;
/** Distance from centre to each of the three circle centres. */
const OFFSET = 15;
/** Radius of each of the three. Large enough that they interweave. */
const LOBE = 26;
/** The enclosing circle. Clears the trefoil's reach (OFFSET + LOBE = 41). */
const RING = 50;

/** −90°, 30°, 150°: one lobe up, two below, as the emblem has them. */
const LOBES = [-90, 30, 150].map((deg) => {
  const rad = (deg * Math.PI) / 180;
  return {
    cx: CENTRE + OFFSET * Math.cos(rad),
    cy: CENTRE + OFFSET * Math.sin(rad),
  };
});

/**
 * When each stroke draws, as a window on overall progress.
 *
 * Overlapping rather than sequential, so the mark builds in one continuous
 * gesture instead of four discrete steps. The ring leads — continuity first, then
 * what it contains.
 */
const WINDOWS: [number, number][] = [
  [0, 0.42], // enclosing circle
  [0.26, 0.64], // first lobe
  [0.4, 0.78], // second
  [0.54, 0.92], // third
];

/**
 * WHY NO CSS TRANSITION ON THE DASH OFFSET
 * ----------------------------------------
 * There was one — `transition-[stroke-dashoffset] duration-300` on each circle.
 * It was wrong twice over. `progress` is already driven from a requestAnimationFrame
 * loop, so retargeting a 300ms transition sixty times a second smooths nothing and
 * instead puts the painted stroke ~300ms behind the value. That lag is not cosmetic:
 * FramePreloader decides the draw is finished from the number, so the completion
 * bloom fired and the overlay began fading while the last circle was visibly still
 * closing. Without the transition, the value and the paint are the same instant.
 *
 * A caller stepping `progress` coarsely instead would want its own easing; none does.
 */
function drawnFraction(progress: number, [start, end]: [number, number]): number {
  if (progress <= start) return 0;
  if (progress >= end) return 1;
  const t = (progress - start) / (end - start);
  // Ease out, so each stroke decelerates into place rather than stopping dead.
  return 1 - (1 - t) ** 2;
}

export default function EmblemMark({
  /** 0–1. Omit for a fully drawn mark. */
  progress,
  /** Slow rotation of the trefoil. Ignored under reduced motion by the CSS. */
  spin = false,
  className = '',
  /** Supply when the mark is the only thing conveying something. */
  title,
}: {
  progress?: number;
  spin?: boolean;
  className?: string;
  title?: string;
}) {
  const p = progress ?? 1;
  const complete = p >= 0.999;

  const ring = drawnFraction(p, WINDOWS[0]);

  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      fill="none"
      strokeLinecap="round"
    >
      {/* The undrawn track, for the progress case only.
          `progress` cannot move until something has actually loaded, so on a slow
          connection the mark sits at zero for several seconds. Without a track
          that is a blank cream screen with two lines of type on it and no sign
          that anything is happening — the old percentage bar at least had its
          ink/10 rule. This is that rule, bent into the mark's own outline. It is
          absent when the mark is drawn statically, where there is nothing to
          track. */}
      {progress !== undefined && !complete ? (
        <circle
          cx={CENTRE}
          cy={CENTRE}
          r={RING}
          stroke="var(--color-ink)"
          strokeOpacity={0.1}
          strokeWidth={1.8}
        />
      ) : null}
      {/* The enclosing circle. pathLength=1 lets the dash maths be a plain
          fraction instead of 2πr, at any radius.

          Stroke widths are in user units, so they scale with the artwork rather
          than staying hairlines — which is what a mark rendered at 160px on a
          loading screen wants. Below about 60px the 1.8 ring thins toward a
          sub-pixel line; that is the floor on how small this can usefully go.

          strokeOpacity, not a conditional render, gates the undrawn state: a
          round cap on a zero-length dash still paints — a dot. Left in, a visitor
          on a slow connection sat looking at four stray dots on cream for as long
          as the first frames took to arrive, because `progress` cannot move until
          something has loaded. The element stays in the tree so the browser is not
          re-creating it four times a second. */}
      <circle
        cx={CENTRE}
        cy={CENTRE}
        r={RING}
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - ring}
        strokeOpacity={ring > 0 ? 1 : 0}
        stroke="var(--color-marigold)"
        strokeWidth={1.8}
      />

      <g
        className={spin && complete ? 'animate-emblem-spin' : ''}
        style={{ transformOrigin: `${CENTRE}px ${CENTRE}px` }}
      >
        {LOBES.map((lobe, i) => {
          const drawn = drawnFraction(p, WINDOWS[i + 1]);
          return (
            <circle
              key={i}
              cx={lobe.cx}
              cy={lobe.cy}
              r={LOBE}
              pathLength={1}
              strokeDasharray={1}
              strokeDashoffset={1 - drawn}
              strokeOpacity={drawn > 0 ? 1 : 0}
              stroke="var(--color-teal)"
              strokeWidth={3}
            />
          );
        })}
      </g>

      {/* The centre, where Ganesha sits on the real emblem. A single dot rather
          than an approximation of him — it marks the place without pretending to
          be the thing. Arrives last, once the circles have closed around it. */}
      <circle
        cx={CENTRE}
        cy={CENTRE}
        r={3.4}
        fill="var(--color-marigold-deep)"
        stroke="none"
        style={{ opacity: drawnFraction(p, [0.82, 1]) }}
      />
    </svg>
  );
}
