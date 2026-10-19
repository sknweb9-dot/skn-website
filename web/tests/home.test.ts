import { describe, expect, it } from 'vitest';
import {
  FEATURED_EVENT_TITLE,
  HOME_EVENTS,
  HOME_SECTIONS,
  partitionEvents,
  restingFrame,
  TONE_VALUES,
  VOICES,
  whyFigures,
  type HomeEvent,
} from '@/lib/home';
import { NAV_ROUTES } from '@/lib/site';

const event = (title: string, date: string): HomeEvent => ({
  title,
  date,
  venue: 'Somewhere',
  city: 'Chennai',
  image: { src: '/x.jpg', width: 10, height: 10, alt: title },
});

describe('home sections', () => {
  it('visits the gestures in footage order, so the hand never runs backwards', () => {
    const orders = HOME_SECTIONS.map((s) => s.mudra.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
    expect(new Set(orders).size).toBe(orders.length);
  });

  it('has the seven sections in page order', () => {
    expect(HOME_SECTIONS.map((s) => s.id)).toEqual([
      'hero',
      'why',
      'story',
      'honours',
      'events',
      'voices',
      'begin',
    ]);
  });
});

describe('partitionEvents', () => {
  // Midnight in Chennai is 18:30 UTC the day before, so these instants are
  // chosen to land on either side of it.
  const events = [event('Past', '2026-06-01'), event('Today', '2026-10-14'), event('Soon', '2026-10-20')];

  it('puts events on or after today first, soonest first, and keeps today in the lead', () => {
    const { mode, lead, rest, recent } = partitionEvents(new Date('2026-10-14T08:00:00Z'), events);
    expect(mode).toBe('upcoming');
    expect(lead.title).toBe('Today');
    expect(rest.map((e) => e.title)).toEqual(['Soon']);
    expect(recent.map((e) => e.title)).toEqual(['Past']);
  });

  it('moves an event to "recent" once its day has passed in Chennai', () => {
    // 19:00 UTC on the 14th is 00:30 IST on the 15th.
    const { lead, recent } = partitionEvents(new Date('2026-10-14T19:00:00Z'), events);
    expect(lead.title).toBe('Soon');
    expect(recent.map((e) => e.title)).toEqual(['Today', 'Past']);
  });

  it('falls back to the featured Udaan and the four most recent when nothing is upcoming', () => {
    const { mode, lead, rest, recent } = partitionEvents(new Date('2030-01-01T00:00:00Z'));
    expect(mode).toBe('past');
    expect(lead.title).toBe(FEATURED_EVENT_TITLE);
    expect(rest).toEqual([]);
    expect(recent).toHaveLength(4);
    expect(recent.some((e) => e.title === FEATURED_EVENT_TITLE)).toBe(false);
    // Newest first.
    const dates = recent.map((e) => e.date);
    expect(dates).toEqual([...dates].sort().reverse());
  });

  it('only ever lists events that exist in HOME_EVENTS', () => {
    const { lead, recent } = partitionEvents(new Date('2030-01-01T00:00:00Z'));
    for (const e of [lead, ...recent]) expect(HOME_EVENTS).toContain(e);
  });
});

describe('whyFigures', () => {
  it('states the four confirmed figures', () => {
    const f = whyFigures();
    expect(f.map((x) => x.figure)).toEqual(['1,500+', '20+', '16', '3']);
    expect(f[2].label).toContain('Weekly batches');
    expect(f[3].label).toContain('India, Canada and the USA');
  });
});

describe('tones', () => {
  it('gives every dark tone a warm niche, and no niche to the light one', () => {
    for (const [tone, v] of Object.entries(TONE_VALUES)) {
      if (v.dark) expect(v.niche, tone).toMatch(/lamp/);
      else expect(v.niche, tone).toBeNull();
    }
  });

  it('puts ivory between the dark sections, so every cut is a clear change of light', () => {
    const dark = HOME_SECTIONS.map((s) => TONE_VALUES[s.tone].dark);
    // No two dark sections touch, except the story after the first (blue to plum
    // is the one deliberate dark-to-dark cut).
    const touching = dark.flatMap((d, i) => (d && dark[i + 1] ? [HOME_SECTIONS[i].id] : []));
    expect(touching).toEqual(['why']);
  });
});

describe('voices', () => {
  it('fills two pages of three, and flags any that are still placeholders', () => {
    expect(VOICES.length).toBeGreaterThanOrEqual(6);
    for (const v of VOICES) {
      expect(v.name.trim(), 'name').not.toBe('');
      expect(v.quote.trim(), `${v.name} quote`).not.toBe('');
      // A voice still carrying the placeholder name must say so. Otherwise the
      // build's warning stays silent and the card ships reading "Parent name".
      if (v.name === 'Parent name') expect(v.placeholder, `${v.name} flag`).toBe(true);
    }
  });
});
describe('navigation', () => {
  it('gives every page one name, with no second "short" name to drift from it', () => {
    for (const route of NAV_ROUTES) {
      expect(Object.keys(route).sort()).toEqual(['href', 'label']);
    }
    expect(NAV_ROUTES.map((r) => r.label)).toEqual(['Home', 'Academy', 'Lineage', 'Curriculum', 'Locations', 'Events', 'Gallery']);
  });
});

describe('where the hand rests', () => {
  it('stays inside the gesture the section names, and moves forward through the footage', () => {
    let previous = -Infinity;
    for (const section of HOME_SECTIONS) {
      const frame = restingFrame(section);
      expect(frame).toBeGreaterThanOrEqual(section.mudra.frameStart);
      expect(frame).toBeLessThanOrEqual(section.mudra.frameEnd);
      expect(frame).toBeGreaterThan(previous);
      previous = frame;
    }
  });

  it('rests the hero on the opening frame, where the footage is still a Patāka', () => {
    // By the middle of its first second the hand has already folded toward
    // Tripatāka, so a still taken there contradicts the caption beneath it.
    const hero = HOME_SECTIONS[0];
    expect(hero.mudra.order).toBe(1);
    expect(Math.round(restingFrame(hero))).toBe(1);
  });
});
