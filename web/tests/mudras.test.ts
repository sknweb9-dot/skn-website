import { describe, expect, it } from 'vitest';
import { RAMP_FROM, RAMP_TO, SHIFT_AMOUNT, handShiftAtFrame, handShiftAtSeconds } from '@/lib/footage';
import { FRAME_COUNT, MUDRAS, mudraAtFrame } from '@/lib/mudras';

describe('the gestures cover the footage', () => {
  it('run in order from the first frame to the last with no gap or overlap', () => {
    expect(MUDRAS).toHaveLength(28);
    expect(MUDRAS[0].frameStart).toBe(1);
    expect(MUDRAS[MUDRAS.length - 1].frameEnd).toBe(FRAME_COUNT);
    MUDRAS.forEach((m, i) => {
      expect(m.order).toBe(i + 1);
      expect(m.frameEnd).toBeGreaterThanOrEqual(m.frameStart);
      if (i > 0) expect(m.frameStart).toBe(MUDRAS[i - 1].frameEnd + 1);
    });
  });

  it('name the opening gestures when the hand is actually in them', () => {
    // Measured from the frames, not taken from the whole seconds of the guide:
    // by those the caption said Ardhapatāka while the hand was still a
    // Tripatāka, and Kartarimukha while it was an Ardhapatāka.
    const at = (frame: number) => mudraAtFrame(frame).order;
    expect([1, 2].map(at)).toEqual([1, 1]);
    expect([3, 14].map(at)).toEqual([2, 2]);
    expect([15, 27].map(at)).toEqual([3, 3]);
    expect([28, 36].map(at)).toEqual([4, 4]);
    expect(at(37)).toBe(5);
  });
});

describe('the hand correction', () => {
  it('leaves the early frames alone and settles at the full amount', () => {
    expect(handShiftAtFrame(1)).toBe(0);
    expect(handShiftAtFrame(RAMP_FROM)).toBe(0);
    expect(handShiftAtFrame(RAMP_TO)).toBeCloseTo(SHIFT_AMOUNT);
    expect(handShiftAtFrame(FRAME_COUNT)).toBeCloseTo(SHIFT_AMOUNT);
  });

  it('only ever moves one way, and gently', () => {
    let previous = 0;
    for (let f = 1; f <= FRAME_COUNT; f += 0.5) {
      const s = handShiftAtFrame(f);
      expect(s).toBeGreaterThanOrEqual(previous);
      expect(s - previous).toBeLessThan(0.005);
      previous = s;
    }
  });

  it('reads the video in seconds as frames at 6 a second', () => {
    expect(handShiftAtSeconds(0)).toBe(0);
    expect(handShiftAtSeconds((RAMP_TO - 1) / 6)).toBeCloseTo(SHIFT_AMOUNT);
  });
});
