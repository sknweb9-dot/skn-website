import { describe, expect, it } from 'vitest';
import { VIDEOS, videoLabel, videosBySection, type EventSection } from '@/lib/events';

const SECTION_IDS: EventSection[] = ['udaan', 'arangetram', 'solo', 'group', 'outreach'];

describe('events videos', () => {
  it('has unique ids', () => {
    const ids = VIDEOS.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('stores valid ISO dates', () => {
    for (const v of VIDEOS) {
      expect(v.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(v.date))).toBe(false);
    }
  });

  it('lists each section newest first', () => {
    for (const id of SECTION_IDS) {
      const dates = videosBySection(id).map((v) => v.date);
      expect(dates).toEqual([...dates].sort().reverse());
    }
  });

  it('keeps outreach to three videos at most', () => {
    expect(videosBySection('outreach').length).toBeLessThanOrEqual(3);
  });

  it('labels a video with its detail, else its Arangetram or Solo context, else its title', () => {
    for (const v of VIDEOS) {
      const label = videoLabel(v);
      if (v.detail) expect(label).toBe(`${v.title}, ${v.detail}`);
      else if (v.section === 'arangetram') expect(label).toBe(`${v.title}, Arangetram`);
      else if (v.section === 'solo') expect(label).toBe(`${v.title}, Solo`);
      else expect(label).toBe(v.title);
    }
  });
});
