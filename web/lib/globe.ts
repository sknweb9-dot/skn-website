/**
 * Layout maths for the gallery globe.
 *
 * PROVENANCE
 * ----------
 * The Fibonacci sphere and the ring band are adapted from the reference
 * implementation in `globefolio-3d-image-animation/src/data/portfolioData.ts`
 * (`calculateItemTransform`), which carries an Apache-2.0 header. The golden
 * angle distribution there is correct and is kept as-is; what changed is that
 * the counts are derived rather than tuned for exactly 120 items, the spiral
 * layout is gone, and the ring now doubles as the reduced-capability fallback.
 *
 * WHY THE GOLDEN ANGLE
 * --------------------
 * Placing N points on a sphere by stepping latitude and longitude on a grid
 * crowds them at the poles — you get two dense caps and a sparse equator. The
 * golden angle φ = π(3 − √5) ≈ 137.508° advances the azimuth by an irrational
 * fraction of a turn at each step, so no two points ever line up and the density
 * is even everywhere. It is the same reason a sunflower head packs its seeds that
 * way, which is a pleasant thing to have underneath a page about classical dance.
 *
 * All functions here are pure and take no three.js types, so the maths can be
 * unit-tested and read without a WebGL context.
 */

export type GlobeShape = 'sphere' | 'ring';

export type Vec3 = [number, number, number];

export type PlateTransform = {
  position: Vec3;
  /**
   * The point each plate faces. Always radially outward from the centre, so a
   * plate's face is tangent to the sphere and its back is toward the core.
   */
  lookAt: Vec3;
};

/** π(3 − √5) — one turn divided by the golden ratio, in radians. */
export const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/**
 * Even distribution over a full sphere.
 *
 * `index` runs 0..total-1. The half-step in `v` keeps the first and last points
 * off the exact poles, where a tangent plate would be seen edge-on from every
 * orbit position and read as a sliver.
 */
export function fibonacciSphere(index: number, total: number, radius: number): PlateTransform {
  const v = (index + 0.5) / total;
  const theta = GOLDEN_ANGLE * index;
  const y = 1 - 2 * v;
  const r = Math.sqrt(Math.max(0, 1 - y * y));

  const x = Math.cos(theta) * r * radius;
  const z = Math.sin(theta) * r * radius;
  const fy = y * radius;

  return { position: [x, fy, z], lookAt: [x * 2, fy * 2, z * 2] };
}

/**
 * A stack of concentric rings — a cylinder rather than a sphere.
 *
 * Kept for two reasons. It is the layout the control dock offers as an
 * alternative, and it is what low-capability devices get: rows are upright and
 * foreshortening is horizontal only, so plate text survives at smaller sizes and
 * fewer plates are needed before it looks deliberate.
 *
 * Row count is derived from the item count rather than fixed, so the band keeps
 * roughly square proportions whether it is carrying 40 plates or 400.
 */
export function ringBand(index: number, total: number, radius: number): PlateTransform {
  // Fewer, taller rows than a naive √N split. At six rows the band came out as a
  // small squat disc that used none of the viewport; five rows on a wider barrel
  // reads as a cylinder you are standing inside the mouth of.
  const rows = Math.max(3, Math.round(Math.sqrt(total) / 2.2));
  const perRow = Math.ceil(total / rows);
  const row = Math.floor(index / perRow);
  const col = index % perRow;

  // Offset alternate rows by half a step so plates do not stack into columns.
  const stagger = row % 2 === 0 ? 0 : 0.5;
  const theta = ((col + stagger) / perRow) * Math.PI * 2;

  const rowGap = (radius * 2.1) / rows;
  const y = (row - (rows - 1) / 2) * rowGap;
  // Wider than the sphere it replaces, so the band subtends about the same angle
  // at the camera as the sphere did and neither layout needs its own distance.
  const r = radius * 1.5;

  const x = Math.cos(theta) * r;
  const z = Math.sin(theta) * r;

  return { position: [x, y, z], lookAt: [x * 2, y, z * 2] };
}

export function plateTransform(
  shape: GlobeShape,
  index: number,
  total: number,
  radius: number,
): PlateTransform {
  return shape === 'ring'
    ? ringBand(index, total, radius)
    : fibonacciSphere(index, total, radius);
}

/**
 * Plate dimensions in world units, for a plate of a given aspect ratio.
 *
 * Every plate gets the same AREA rather than the same edge length, so a wide
 * landscape photograph and a tall invitation card carry equal visual weight on
 * the sphere. Sizing them by a shared edge instead would make the posters tower
 * over the photographs.
 *
 * Area is set by target coverage rather than by tiling. Each plate on a sphere of
 * radius R owns 4πR²/N of surface; asking plates to actually fill that area makes
 * them collide, because a flat rectangle inscribed on a curved shell pokes
 * through its neighbours at the corners. COVERAGE is the fraction of the shell
 * the plates are allowed to occupy.
 *
 * Arrived at by looking at it. At 0.8 the plates clip through each other badly
 * enough to read as wreckage; at 0.16 they read as confetti with no sense of a
 * surface. Just under 0.4 is where they hold together as a mosaic with visible
 * mortar, while the gaps still let the far side of the sphere show through, which
 * is where the depth comes from.
 *
 * The cap on the long edge matters at low counts: with the teaser's forty-odd
 * plates the area formula alone asks for tiles a third of the radius across,
 * which on a small window is a handful of billboards rather than a globe.
 */
const COVERAGE = 0.38;
const LONG_EDGE_CAP = 0.34;

export type PlateExtent = { width: number; height: number };

export function plateExtent(total: number, radius: number, aspect: number): PlateExtent {
  const area = ((4 * Math.PI * radius * radius) / Math.max(1, total)) * COVERAGE;
  const safeAspect = aspect > 0 ? aspect : 1;

  // width * height = area, width / height = aspect
  let height = Math.sqrt(area / safeAspect);
  let width = safeAspect * height;

  const cap = radius * LONG_EDGE_CAP;
  const longest = Math.max(width, height);
  if (longest > cap) {
    const k = cap / longest;
    width *= k;
    height *= k;
  }

  return { width, height };
}

/** Linear interpolation, clamped. Used for the reveal and the focus lerps. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * Math.min(1, Math.max(0, t));
}
