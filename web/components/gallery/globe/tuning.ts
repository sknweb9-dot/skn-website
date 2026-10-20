/** The gallery globe's numbers: geometry, camera, opacity and easing. */

/** World-space sphere radius. Everything else is expressed relative to this. */
export const RADIUS = 1.25;

/**
 * Plates displayed in teaser mode.
 *
 * Small enough that its distinct textures are a fraction of the full set — the
 * teaser costs roughly a third of the plate bytes — and large enough that the
 * window reads as a globe. Below about thirty it reads as a handful of cards
 * floating near each other instead.
 */
export const TEASER_COUNT = 44;

/** Camera distance, as a multiple of RADIUS. 0.34 is inside the shell. */
export const DIST = { inside: 0.34, teaser: 3.35, full: 3.35, min: 1.45, max: 9 };

/**
 * Clearance left around the sphere once it has been fitted to the frame.
 *
 * 1 would have the sphere exactly touching the tighter edge. On a wide window
 * this term does nothing — the base distance already clears the vertical fit —
 * so it only shapes the portrait case, where the binding axis is horizontal and
 * the slack it buys sits above and below the sphere, which is where the header
 * and the dock live anyway.
 */
export const FIT_MARGIN = 1.06;

/**
 * Focused-plate framing, as a multiple of the plate's edge length.
 *
 * Derived rather than fixed, because plate size falls as the item count rises —
 * a constant distance that framed 44 plates nicely put the camera inside the
 * shell at 107. At 2.6x the plate fills roughly half the frame height at this
 * field of view, with the rest of the sphere legible behind it.
 */
export const FOCUS_GAP = 2.6;

/** Hover and focus growth, as a multiplier over a plate's resting size. */
export const POP = { rest: 1, hover: 1.18, focus: 1.34 };

/**
 * Opacity of plates filtered out.
 *
 * Applied instead of the facing dim rather than on top of it. Multiplying the
 * two took filtered plates on the far side to 0.04, which is nothing — pick a
 * section with eight members and the other ninety-nine vanish, so the sphere
 * stops being a sphere and the filter reads as a bug. Held flat, the unselected
 * plates stay legible as structure while the selected ones clearly carry the
 * image.
 */
export const DIM = 0.16;

/**
 * Opacity floor for plates on the far side of the sphere.
 *
 * Plates face radially outward, so the ones on the back are seen from behind.
 * Culling them with FrontSide would be cheapest and would remove the mirrored
 * text, but the reveal begins with the camera inside the shell, where every
 * plate faces away — the entrance would be a blank screen. Dimming by facing
 * instead keeps the reveal, kills the mirrored-poster artifact, and gives the
 * sphere the depth cue that a flat wall of plates lacks: near plates read
 * forward, the silhouette edge falls away, the far side is a faint suggestion
 * seen through the gaps.
 *
 * 0.14 was too severe — the back went to nothing and the sphere stopped reading
 * as a solid. Just under a third keeps it legible as the other side of something.
 */
export const BACK_DIM = 0.32;

/**
 * Shapes the falloff between BACK_DIM and full.
 *
 * Below 1 it lifts the middle, which is what this needs, and it needs it harder
 * than seems reasonable. The facing term is computed against the true view
 * vector, so perspective already pushes plates at the silhouette down to about
 * 0.36 before any curve applies — and a photograph at 65% over a cream ground
 * loses most of its contrast, so the sphere washed out to a ghost with only the
 * few plates at dead centre reading properly. At 0.45 the whole near hemisphere
 * stays crisp and the falloff is spent where it belongs, on the far side.
 */
export const FACING_CURVE = 0.45;

/** Per-frame lerp rates. Higher is snappier; these are tuned for 60fps. */
export const EASE = { scale: 0.16, position: 0.08, opacity: 0.12, distance: 0.09 };

/** How many plates are mid-fade at once during the reveal sweep. */
export const REVEAL_FEATHER = 14;

/** Texture long edge. Matches the prep script in _research. */
export const TEX_LONG = 512;

export const COLOR = {
  marigold: '#ec9a29',
  cream: '#fbf8f1',
  silk: '#f4ebd9',
  teal: '#0f4c5c',
  ink: '#2b1e16',
};

