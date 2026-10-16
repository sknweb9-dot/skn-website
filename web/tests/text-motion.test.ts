import { describe, expect, it } from 'vitest';
import {
  BATCH_CAP_MS,
  batchDelay,
  easeOutExpo,
  formatCount,
  parseCount,
  sequenceDelays,
  splitWords,
} from '@/lib/textMotion';

describe('splitWords', () => {
  it('splits on any whitespace and drops empties', () => {
    expect(splitWords('  Every stage,\n every   class ')).toEqual(['Every', 'stage,', 'every', 'class']);
  });

  it('returns nothing for blank text', () => {
    expect(splitWords('   ')).toEqual([]);
  });
});

describe('batchDelay', () => {
  it('fans out in steps and stops at the cap', () => {
    expect(batchDelay(0)).toBe(0);
    expect(batchDelay(2)).toBe(120);
    expect(batchDelay(50)).toBe(BATCH_CAP_MS);
  });

  it('never goes negative', () => {
    expect(batchDelay(-3)).toBe(0);
  });
});

describe('sequenceDelays', () => {
  it('steps through the group in order', () => {
    expect(sequenceDelays([{ words: 0 }, { words: 0 }, { words: 0 }])).toEqual([0, 60, 120]);
  });

  it('holds back what follows a headline by its word count', () => {
    // A 5-word headline lands over ~350ms of stagger, so the next block waits.
    expect(sequenceDelays([{ words: 5 }, { words: 0 }, { words: 0 }])).toEqual([0, 60 + 200, 120 + 200]);
  });

  it('applies a base, and caps the step but not the hold', () => {
    const delays = sequenceDelays(Array.from({ length: 30 }, () => ({ words: 0 })), { base: 180, cap: 420 });
    expect(delays[0]).toBe(180);
    expect(delays[29]).toBe(180 + BATCH_CAP_MS);
  });
});

describe('parseCount', () => {
  it('reads a grouped figure with a suffix', () => {
    expect(parseCount('1,500+')).toEqual({ target: 1500, prefix: '', suffix: '+', grouped: true });
  });

  it('reads a plain number', () => {
    expect(parseCount('7')).toEqual({ target: 7, prefix: '', suffix: '', grouped: false });
  });

  it('refuses labels and mixed text', () => {
    expect(parseCount('students taught since 2009')).toBeNull();
    expect(parseCount('12 to 15')).toBeNull();
    expect(parseCount('')).toBeNull();
  });
});

describe('formatCount', () => {
  it('uses Indian grouping when the final figure did', () => {
    expect(formatCount(150000, true)).toBe('1,50,000');
    expect(formatCount(1499.6, true)).toBe('1,500');
  });

  it('leaves ungrouped figures alone', () => {
    expect(formatCount(7.4, false)).toBe('7');
  });
});

describe('easeOutExpo', () => {
  it('is pinned at both ends and front-loaded in between', () => {
    expect(easeOutExpo(0)).toBe(0);
    expect(easeOutExpo(1)).toBe(1);
    expect(easeOutExpo(0.2)).toBeGreaterThan(0.2);
  });
});
