/**
 * Corrections to where the hand sits in Hastas.mp4, applied wherever it is drawn.
 *
 * THE DRIFT
 * ---------
 * The arm enters the frame from the right and never moves, but the performer's
 * hand sits further toward it as the clip goes on. Measured as the horizontal
 * centre of the skin and fingertip colour in each gesture (the arm's far end
 * excluded, then compared across gestures 4-15 and 17-28):
 *
 *   centre of mass     0.559 -> 0.581 of the frame width
 *   far edge of hand   0.351 -> 0.400
 *
 * Sarpaśīrṣa (frames 175-186) is where it settles: its mass is the furthest
 * toward the arm of any gesture (0.606), and everything after it stays there. In
 * the arch that reads as more empty ground on the far side of the hand, the side
 * away from the arm, from the middle of the sequence on.
 *
 * THE CORRECTION
 * --------------
 * Draw the later frames a little toward the far side: nothing before frame
 * RAMP_FROM, then a smooth ramp to SHIFT_AMOUNT by RAMP_TO, then constant. The
 * amount sits between the two measures above (0.022 and 0.049) at 0.03 of the
 * width, about 26px of the 864px frames and 9px in a 300px arch. The ground is
 * smooth, so the strip uncovered at the arm's edge is filled by repeating the
 * last column of pixels, which is the arm itself.
 *
 * The live arch applies this in the shader (components/home/archVideo.ts). The
 * stills in public/frames from RAMP_FROM on were rewritten with the same numbers
 * by _research/shift_frames.py, so a still and the video agree.
 */

/** Frame at which the hand starts to be moved, and the frame at which it is fully moved. */
export const RAMP_FROM = 170;
export const RAMP_TO = 190;

/** How far toward the far side the hand is moved, as a fraction of the frame's width. */
export const SHIFT_AMOUNT = 0.03;

const FRAMES_PER_SECOND = 6;

/** The correction at a (possibly fractional) 1-based frame number: 0 to SHIFT_AMOUNT. */
export function handShiftAtFrame(frame: number): number {
  const t = Math.min(1, Math.max(0, (frame - RAMP_FROM) / (RAMP_TO - RAMP_FROM)));
  return SHIFT_AMOUNT * t * t * (3 - 2 * t);
}

/** The same, at a position in the video in seconds (frame n is at (n - 1) / 6 s). */
export function handShiftAtSeconds(seconds: number): number {
  return handShiftAtFrame(seconds * FRAMES_PER_SECOND + 1);
}
