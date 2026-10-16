/**
 * The home stage's arithmetic: which page is showing at a scroll position, and
 * which moment of the footage the hand is on. Pure functions, so they can be
 * tested without a browser (tests/stage.test.ts); components/home/HomeStage.tsx
 * does the DOM work around them.
 *
 * HOW THE STAGE READS
 * -------------------
 * The home page is a stack of "pages" that appear and disappear in the same
 * place. Each page is a `[data-page]` element in the document, in order, with an
 * optional `data-steps` (default 1): how many scroll steps it holds. A step is
 * PAGE_VH of the viewport's height. The hero is step 0 and is HERO_VH tall; it
 * is declared with `data-steps="0"`.
 *
 * The hero's length is the length of its hand-over, not of a pause. It was 0.8
 * of a screen, of which the arch's glide to the left used only the first 0.56,
 * and the last stretch was the hero's text standing alone in a screen the arch
 * had left. It is now 0.5, and the glide is 1.2 times the hero (HomeStage), so
 * the first section arrives while the arch is still settling into its dock.
 *
 *   scroll position  ->  step  ->  page        (stepAt, activePage)
 *   scroll position  ->  moment of the footage (frameAt)
 *
 * The timeline is one page that holds several steps and scrubs its own window
 * while it does, so "more pages = more hand" holds without a special case: the
 * hand's time is spread over whatever the plan gives each section.
 */

export const HERO_VH = 0.5;
export const PAGE_VH = 0.7;
/** After the last page, the stage holds this many steps before the footer arrives. */
export const TAIL_STEPS = 0.6;

/**
 * When the stage is on: a desktop-sized window, and no request for reduced
 * motion. Anywhere else (a phone, a small window, reduced motion, no script)
 * the same markup is the ordinary stacked page. Used by HomeStage, and by the
 * inline script in app/page.tsx that sets the layout before first paint.
 */
export const STAGE_QUERY = '(min-width: 1024px) and (min-height: 600px) and (prefers-reduced-motion: no-preference)';

/**
 * The phone and tablet layout: the same page, stacked, with the arch pinned small
 * at the top and the hand playing as you scroll. Anything that is neither this
 * nor the stage (reduced motion, a short landscape window, no script, Save-Data)
 * is the plain stacked page.
 */
export const RAIL_QUERY = '(max-width: 1023.98px) and (min-height: 500px) and (prefers-reduced-motion: no-preference)';

export type PageSpec = { section: string; steps: number };

export type StagePage = PageSpec & {
  /** First step this page is showing at. The hero is 0; the next page is 1. */
  first: number;
};

export type StagePlan = {
  pages: StagePage[];
  sections: { id: string; first: number; last: number }[];
  /** The last step. The hero is step 0, so this is also the count of steps after it. */
  last: number;
};

export function buildPlan(specs: PageSpec[]): StagePlan {
  if (specs.length === 0) throw new Error('A stage needs at least one page.');
  const pages: StagePage[] = [];
  const sections: StagePlan['sections'] = [];
  let step = 1;
  for (const spec of specs) {
    if (!Number.isInteger(spec.steps) || spec.steps < 0) {
      throw new Error(`Page in "${spec.section}" has steps=${spec.steps}; use a whole number, 0 or more.`);
    }
    const first = spec.steps === 0 ? 0 : step;
    pages.push({ ...spec, first });
    const lastStep = spec.steps === 0 ? 0 : step + spec.steps - 1;
    const open = sections[sections.length - 1];
    if (open && open.id === spec.section) open.last = Math.max(open.last, lastStep);
    else sections.push({ id: spec.section, first, last: lastStep });
    step += spec.steps;
  }
  return { pages, sections, last: step - 1 };
}

export type Metrics = { hero: number; page: number; viewport: number };

export function metricsFor(viewportHeight: number): Metrics {
  return { hero: HERO_VH * viewportHeight, page: PAGE_VH * viewportHeight, viewport: viewportHeight };
}

/**
 * Height of the scroll track the stage is pinned inside. The pin is one
 * viewport tall and is stuck for the track's height minus that, so the viewport
 * is added back: the stuck distance is exactly the hero, every page, and the
 * tail, and the footer arrives only after the last page has had its hold.
 */
export function trackHeight(plan: StagePlan, m: Metrics): number {
  return m.viewport + m.hero + plan.last * m.page + TAIL_STEPS * m.page;
}

/** The furthest the stage scrolls before the pin lets go. */
export function stageScroll(plan: StagePlan, m: Metrics): number {
  return trackHeight(plan, m) - m.viewport;
}

export function stepAt(y: number, plan: StagePlan, m: Metrics): number {
  if (y < m.hero) return 0;
  return Math.min(plan.last, 1 + Math.floor((y - m.hero) / m.page));
}

/** The page showing at a step: the one whose steps include it. */
export function activePage(step: number, plan: StagePlan): number {
  if (step === 0) return plan.pages.findIndex((p) => p.steps === 0) >= 0 ? plan.pages.findIndex((p) => p.steps === 0) : 0;
  const i = plan.pages.findIndex((p) => p.steps > 0 && step >= p.first && step < p.first + p.steps);
  return i === -1 ? plan.pages.length - 1 : i;
}

export function sectionAtStep(step: number, plan: StagePlan): string {
  const s = plan.sections.find((sec) => step >= sec.first && step <= sec.last);
  return (s ?? plan.sections[plan.sections.length - 1]).id;
}

/** Scroll position at which a step begins. */
export function yOfStep(step: number, m: Metrics): number {
  return step <= 0 ? 0 : m.hero + (step - 1) * m.page;
}

export function yOfSection(id: string, plan: StagePlan, m: Metrics): number {
  const s = plan.sections.find((sec) => sec.id === id);
  return s ? yOfStep(s.first, m) : 0;
}

/**
 * 0..1 through a page that holds more than one step, for the timeline window.
 * Clamped, so it rests at either end before and after the page.
 */
export function progressThrough(page: StagePage, y: number, m: Metrics): number {
  if (page.steps <= 0) return 0;
  const start = yOfStep(page.first, m);
  return Math.min(1, Math.max(0, (y - start) / (page.steps * m.page)));
}

// ---------------------------------------------------------------------------
// The hand
// ---------------------------------------------------------------------------

export type Anchor = { y: number; frame: number };

/**
 * One anchor per section: the middle of the section's scroll range, paired with
 * the middle frame of its gesture. The hero's is half way through the hero.
 * `frames` is in section order and must match the plan's sections one-to-one.
 */
export function anchorsFor(plan: StagePlan, m: Metrics, frames: number[]): Anchor[] {
  if (frames.length !== plan.sections.length) {
    throw new Error(`The plan has ${plan.sections.length} sections but ${frames.length} gestures were given.`);
  }
  return plan.sections.map((s, i) => ({
    y: i === 0 && s.first === 0 ? m.hero * 0.5 : m.hero + ((s.first - 1 + s.last) / 2) * m.page,
    frame: frames[i],
  }));
}

/**
 * The frame the hand should be on at a scroll position: straight lines between
 * anchors, and a short run past the last so it does not freeze on arrival.
 */
export function frameAt(y: number, anchors: Anchor[], m: Metrics, runOut = 2): number {
  const first = anchors[0];
  if (y <= first.y) return first.frame * (0.2 + (0.8 * Math.max(0, y)) / first.y);
  for (let i = 1; i < anchors.length; i += 1) {
    if (y <= anchors[i].y) {
      const a = anchors[i - 1];
      const b = anchors[i];
      return a.frame + ((b.frame - a.frame) * (y - a.y)) / (b.y - a.y);
    }
  }
  const last = anchors[anchors.length - 1];
  return last.frame + runOut * Math.min(1, (y - last.y) / (0.8 * m.page));
}

/** Frame number (1-based, 6 per second of the 54 s clip) to a time in seconds. */
export function frameToSeconds(frame: number): number {
  return (frame - 1) / 6;
}

// ---------------------------------------------------------------------------
// The rail (phones and tablets)
// ---------------------------------------------------------------------------

/**
 * Anchors for the stacked layout, where sections have whatever height their
 * content gives them. A section is "being read" when its middle sits in the
 * middle of the visible area under the pinned arch; the hero's anchor is a
 * little way into the first screen. Anchors are forced to increase, so a very
 * short section can never make the hand run backwards.
 *
 * `sections` are in page coordinates (top and bottom from the top of the
 * document); `barBottom` is the pinned arch's lower edge in viewport pixels.
 */
export function railAnchors(
  sections: { top: number; bottom: number }[],
  viewport: number,
  barBottom: number,
  frames: number[],
): Anchor[] {
  if (frames.length !== sections.length) {
    throw new Error(`There are ${sections.length} sections but ${frames.length} gestures were given.`);
  }
  const visibleMiddle = barBottom + (viewport - barBottom) / 2;
  let previous = 0;
  return sections.map((s, i) => {
    const raw = i === 0 ? Math.max(1, (s.bottom - s.top) * 0.4) : (s.top + s.bottom) / 2 - visibleMiddle;
    const y = Math.max(raw, previous + 1);
    previous = y;
    return { y, frame: frames[i] };
  });
}
