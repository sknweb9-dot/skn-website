import { describe, expect, it } from 'vitest';
import {
  activePage,
  anchorsFor,
  buildPlan,
  frameAt,
  frameToSeconds,
  metricsFor,
  progressThrough,
  railAnchors,
  sectionAtStep,
  stageScroll,
  stepAt,
  TAIL_STEPS,
  trackHeight,
  yOfSection,
  yOfStep,
} from '@/lib/stage';

// The same shape as the home page: a hero, then sections of one or more pages,
// with one page (the timeline) holding six steps.
const plan = buildPlan([
  { section: 'hero', steps: 0 },
  { section: 'why', steps: 1 },
  { section: 'why', steps: 1 },
  { section: 'story', steps: 1 },
  { section: 'story', steps: 6 },
  { section: 'honours', steps: 1 },
  { section: 'honours', steps: 1 },
  { section: 'events', steps: 1 },
  { section: 'voices', steps: 1 },
  { section: 'voices', steps: 1 },
  { section: 'begin', steps: 1 },
]);
const m = metricsFor(1000); // hero HERO_VH of that (500px), page 700px

describe('buildPlan', () => {
  it('numbers steps from the hero at 0 and counts the rest', () => {
    expect(plan.pages.map((p) => p.first)).toEqual([0, 1, 2, 3, 4, 10, 11, 12, 13, 14, 15]);
    expect(plan.last).toBe(15);
  });

  it('groups consecutive pages into sections with their step ranges', () => {
    expect(plan.sections).toEqual([
      { id: 'hero', first: 0, last: 0 },
      { id: 'why', first: 1, last: 2 },
      { id: 'story', first: 3, last: 9 },
      { id: 'honours', first: 10, last: 11 },
      { id: 'events', first: 12, last: 12 },
      { id: 'voices', first: 13, last: 14 },
      { id: 'begin', first: 15, last: 15 },
    ]);
  });

  it('refuses a bad step count', () => {
    expect(() => buildPlan([{ section: 'x', steps: 1.5 }])).toThrow();
    expect(() => buildPlan([{ section: 'x', steps: -1 }])).toThrow();
    expect(() => buildPlan([])).toThrow();
  });
});

describe('stepAt and activePage', () => {
  it('holds the hero for HERO_VH of the viewport, then a page per PAGE_VH', () => {
    expect(stepAt(0, plan, m)).toBe(0);
    expect(stepAt(m.hero - 1, plan, m)).toBe(0);
    expect(stepAt(m.hero, plan, m)).toBe(1);
    expect(stepAt(m.hero + 699, plan, m)).toBe(1);
    expect(stepAt(m.hero + 700, plan, m)).toBe(2);
  });

  it('never runs past the last step', () => {
    expect(stepAt(1e9, plan, m)).toBe(plan.last);
  });

  it('shows the timeline page for all six of its steps', () => {
    const timeline = plan.pages.findIndex((p) => p.steps === 6);
    for (let s = 4; s <= 9; s += 1) expect(activePage(s, plan)).toBe(timeline);
    expect(activePage(3, plan)).toBe(timeline - 1);
    expect(activePage(10, plan)).toBe(timeline + 1);
  });

  it('shows the hero at step 0', () => {
    expect(activePage(0, plan)).toBe(0);
  });

  it('names the section at a step', () => {
    expect(sectionAtStep(0, plan)).toBe('hero');
    expect(sectionAtStep(2, plan)).toBe('why');
    expect(sectionAtStep(9, plan)).toBe('story');
    expect(sectionAtStep(15, plan)).toBe('begin');
  });
});

describe('positions', () => {
  it('maps steps and sections back to scroll positions', () => {
    expect(yOfStep(0, m)).toBe(0);
    expect(yOfStep(1, m)).toBe(m.hero);
    expect(yOfStep(3, m)).toBe(m.hero + 2 * 700);
    expect(yOfSection('story', plan, m)).toBe(yOfStep(3, m));
    expect(stepAt(yOfSection('honours', plan, m), plan, m)).toBe(10);
  });

  it('can reach the last step, and holds it for the tail before the pin lets go', () => {
    expect(trackHeight(plan, m)).toBe(stageScroll(plan, m) + m.viewport);
    for (const vh of [500, 720, 900, 1080, 1440, 2160]) {
      const mm = metricsFor(vh);
      const maxScroll = stageScroll(plan, mm);
      expect(stepAt(maxScroll, plan, mm)).toBe(plan.last);
      // The last page is on screen for its whole step plus the tail.
      expect(maxScroll - yOfStep(plan.last, mm)).toBeCloseTo(mm.page * (1 + TAIL_STEPS));
    }
  });

  it('scrubs a multi-step page from 0 to 1 and rests at the ends', () => {
    const timeline = plan.pages.find((p) => p.steps === 6)!;
    expect(progressThrough(timeline, yOfStep(4, m) - 500, m)).toBe(0);
    expect(progressThrough(timeline, yOfStep(4, m), m)).toBe(0);
    expect(progressThrough(timeline, yOfStep(4, m) + 3 * 700, m)).toBeCloseTo(0.5);
    expect(progressThrough(timeline, yOfStep(10, m) + 900, m)).toBe(1);
  });
});

describe('the hand', () => {
  const frames = [3.5, 15.5, 102.5, 198.5, 222.5, 234.5, 294.5];
  const anchors = anchorsFor(plan, m, frames);

  it('puts each anchor in the middle of its section', () => {
    expect(anchors[0].y).toBe(m.hero * 0.5);
    // why: steps 1..2 -> the hero, then 1 page
    expect(anchors[1].y).toBe(m.hero + 700);
    // story: steps 3..9 -> centre at (2 + 9) / 2 pages
    expect(anchors[2].y).toBe(m.hero + 5.5 * 700);
  });

  it('reaches each gesture exactly at its anchor and plays forwards between them', () => {
    anchors.forEach((a) => expect(frameAt(a.y, anchors, m)).toBeCloseTo(a.frame));
    let prev = -1;
    for (let y = 0; y <= anchors[6].y + 2000; y += 37) {
      const f = frameAt(y, anchors, m);
      expect(f).toBeGreaterThanOrEqual(prev);
      prev = f;
    }
  });

  it('plays a little past the last gesture, then stops', () => {
    const last = anchors[6];
    expect(frameAt(last.y + 10000, anchors, m)).toBeCloseTo(last.frame + 2);
  });

  it('refuses a mismatch between sections and gestures', () => {
    expect(() => anchorsFor(plan, m, [1, 2, 3])).toThrow();
  });

  it('converts frames to seconds at 6 per second', () => {
    expect(frameToSeconds(1)).toBe(0);
    expect(frameToSeconds(7)).toBe(1);
    expect(frameToSeconds(324)).toBeCloseTo(53.83, 1);
  });
});

describe('the rail', () => {
  const frames = [3.5, 15.5, 102.5];

  it('puts each anchor where the section is in the middle of the visible area', () => {
    const sections = [
      { top: 0, bottom: 900 },
      { top: 900, bottom: 2100 },
      { top: 2100, bottom: 3500 },
    ];
    const a = railAnchors(sections, 800, 200, frames);
    // visible middle = 200 + (800 - 200) / 2 = 500
    expect(a[0].y).toBeCloseTo(360);
    expect(a[1].y).toBeCloseTo(1500 - 500);
    expect(a[2].y).toBeCloseTo(2800 - 500);
    expect(a.map((x) => x.frame)).toEqual(frames);
  });

  it('never lets the anchors go backwards, whatever the section heights', () => {
    const squashed = [
      { top: 0, bottom: 100 },
      { top: 100, bottom: 120 },
      { top: 120, bottom: 140 },
    ];
    const a = railAnchors(squashed, 800, 200, frames);
    expect(a[1].y).toBeGreaterThan(a[0].y);
    expect(a[2].y).toBeGreaterThan(a[1].y);
  });

  it('refuses a mismatch between sections and gestures', () => {
    expect(() => railAnchors([{ top: 0, bottom: 10 }], 800, 200, frames)).toThrow();
  });
});
