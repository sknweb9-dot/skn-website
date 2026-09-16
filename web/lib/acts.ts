/**
 * The six-act scroll spine.
 *
 * PACING
 * ------
 * The gesture sequence in mudra.mp4 runs in fixed Abhinaya Darpana order, so we
 * cannot place an arbitrary gesture at an arbitrary point in the scroll. The act
 * windows below are therefore NOT equal sixths — they are tuned so that each
 * act's anchor gesture is on screen while that act's card is at full opacity.
 *
 * A card fades in over the first 22% of its window and out over the last 22%,
 * so an anchor has to sit inside [0.22, 0.78] of its own window. Act 1 never
 * fades in and act 6 never fades out, so those two may sit outside on the open
 * side. Verified by _research/check_act_windows.py — rerun it after touching any
 * window or anchor:
 *
 *   act 1  [0.000, 0.110]  Patāka       t 0.125  (act 1 has no fade-in)
 *   act 2  [0.110, 0.290]  Ardhacandra  t 0.459
 *   act 3  [0.290, 0.485]  Sūcī         t 0.771
 *   act 4  [0.485, 0.630]  Padmakōśa    t 0.262
 *   act 5  [0.630, 0.800]  Alapadma     t 0.504
 *   act 6  [0.800, 1.000]  Tāmracūḍa    t 0.817  (act 6 has no fade-out)
 *
 * An earlier revision used equal sixths and looked fine in the abstract, but at
 * the centre of act 4 the hand was actually showing Mṛgaśīrṣa while the card
 * said Padmakōśa. Hence the tuning, and hence the checker.
 *
 * The other twenty-two gestures are deliberately unassigned. They flow past as
 * transitions, which is what gives the scroll rhythm instead of turning every
 * gesture into another thing demanding to be read. The live gesture name is
 * captioned under the arch by ScrollStage, so what is on screen is always named
 * correctly even mid-transition.
 *
 * The strongest pairing is acts 4 and 5: Padmakōśa is the lotus bud, the
 * unopened vessel; Alapadma is the same hand in full bloom. Bud to bloom, with
 * the entire curriculum in between.
 */

import { mudraByName, mudraProgress, type Mudra } from './mudras';

/** Where the act's editorial column sits, on desktop. */
export type ActSide = 'left' | 'right' | 'center';

export type Act = {
  /** 1-indexed act number, used in the chapter rail */
  index: number;
  /** Stable id — anchor target and scroll-to destination */
  id: string;
  /** Short label for the chapter rail */
  rail: string;
  /** Normalised scroll window this act occupies */
  window: { start: number; end: number };
  /** The gesture held during this act */
  mudra: Mudra;
  side: ActSide;
  eyebrow: string;
  heading: string;
  /** Body paragraphs. Kept short — depth lives on the sibling routes. */
  body: string[];
  /** Optional deeper route */
  link?: { href: string; label: string };
};

const ACT_COUNT = 6;

/**
 * Copy fade ramps, as a fraction of an act's own window.
 *
 * The ramps are narrow (10% of the window each) and pulled away from the
 * window edges on purpose. That leaves a genuine empty interval either side of
 * every act boundary — the previous act's text is gone by t=0.90 and the next
 * act's has not started by t=0.10 — and the arch travels to its new position
 * inside that gap. Text out, window moves, text in.
 *
 * Narrowing the ramps also widened the fully-visible hold to [0.20, 0.80], so
 * all six anchor gestures still verify against the windows unchanged.
 */
export const TEXT_IN_START = 0.1;
export const TEXT_IN_END = 0.2;
export const TEXT_OUT_START = 0.8;
export const TEXT_OUT_END = 0.9;

export const ACTS: Act[] = [
  {
    index: 1,
    id: 'invocation',
    rail: 'Invocation',
    window: { start: 0.000, end: 0.110 },
    mudra: mudraByName('Patāka'),
    side: 'center',
    eyebrow: 'Chennai · Scarborough',
    heading: 'Not just an artform. A way of life.',
    body: [
      'Classical Kalakshetra Bharatanatyam, taught in the Gurukulam tradition since 2009. Cultivating discipline, grace, and spiritual poise.',
    ],
  },
  {
    index: 2,
    id: 'philosophy',
    rail: 'Philosophy',
    window: { start: 0.110, end: 0.290 },
    mudra: mudraByName('Ardhacandra'),
    side: 'left',
    eyebrow: 'About',
    heading: 'Not merely a performing art',
    body: [
      'At SKN, students are encouraged to develop a deeper appreciation of Bharatanatyam by exploring its connection with literature, mythology, music, and philosophy.',
      'The foundation of our teaching lies in the sacred bond between Guru and Shishya — a relationship built on trust, dedication, mutual respect, and lifelong learning.',
    ],
    link: { href: '/about', label: 'The academy' },
  },
  {
    index: 3,
    id: 'vision',
    rail: 'Lineage',
    window: { start: 0.290, end: 0.485 },
    mudra: mudraByName('Sūcī'),
    side: 'right',
    eyebrow: 'Our Founder — Om – Guru – Om',
    heading: 'Art is not ordinary',
    body: [
      'It is the Divine expressing itself through the artist. The formless finds form and reveals itself to the world.',
      'Inspired by that vision, Co-Founder & Director Sunitta Menghanaani has nurtured SKN into an institution where learning extends far beyond mastering dance.',
    ],
    link: { href: '/lineage', label: 'Our lineage' },
  },
  {
    index: 4,
    id: 'path',
    rail: 'Curriculum',
    window: { start: 0.485, end: 0.630 },
    mudra: mudraByName('Padmakōśa'),
    side: 'left',
    eyebrow: 'Our Gurukulam Approach',
    heading: 'Six levels, not six terms',
    body: [
      'A gentle introduction from age three and a half, then six graded levels — Foundation to Mastery — each building naturally upon the last.',
      'Students develop a strong foundation before progressing towards advanced repertoire, and ultimately, the Arangetram.',
    ],
    link: { href: '/curriculum', label: 'The six levels' },
  },
  {
    index: 5,
    id: 'bloom',
    rail: 'Arangetram',
    window: { start: 0.630, end: 0.800 },
    mudra: mudraByName('Alapadma'),
    side: 'right',
    eyebrow: 'Performance & Arangetram',
    heading: 'The bud opens',
    body: [
      'After Level 6 comes a period of intensive rehearsal, stagecraft, and individual mentoring, culminating in the Arangetram — a formal debut as a Bharatanatyam performer.',
      'And before that, Udaan: our own showcase, created so that every dancer has a stage, irrespective of their stage of learning.',
    ],
    link: { href: '/performances', label: 'Performances' },
  },
  {
    index: 6,
    id: 'invitation',
    rail: 'Visit',
    window: { start: 0.800, end: 1.000 },
    mudra: mudraByName('Tāmracūḍa'),
    side: 'center',
    eyebrow: 'Begin',
    heading: "Begin your child's journey",
    body: [
      'Experience one trial session to witness how classical art transforms posture, confidence, and culture.',
    ],
    link: { href: '/locations', label: 'Our schools' },
  },
];

/** Smoothstep. Shared by the visibility ramps and the arch travel easing. */
export function smoothstep(v: number): number {
  const t = v < 0 ? 0 : v > 1 ? 1 : v;
  return t * t * (3 - 2 * t);
}

/**
 * Opacity of an act's copy at a given global progress.
 *
 * Act 1 never fades in — it is already on screen at first paint — and act 6
 * never fades out, so the sequence opens and closes on held copy rather than on
 * emptiness.
 */
export function actVisibility(act: Act, progress: number): number {
  const { start, end } = act.window;
  const t = (progress - start) / (end - start);
  if (t < -0.4 || t > 1.4) return 0;

  const isFirst = act.index === 1;
  const isLast = act.index === ACTS.length;
  const rising = isFirst ? 1 : smoothstep((t - TEXT_IN_START) / (TEXT_IN_END - TEXT_IN_START));
  const falling = isLast ? 1 : smoothstep((TEXT_OUT_END - t) / (TEXT_OUT_END - TEXT_OUT_START));
  return Math.min(rising, falling);
}

/**
 * The intervals of global progress during which no copy is on screen, one per
 * act boundary. Precomputed because the windows are fixed.
 */
const TRAVELS = ACTS.slice(0, -1).map((act, i) => {
  const next = ACTS[i + 1];
  const boundary = act.window.end;
  return {
    from: i,
    to: i + 1,
    start: boundary - (1 - TEXT_OUT_END) * (act.window.end - act.window.start),
    end: boundary + TEXT_IN_START * (next.window.end - next.window.start),
  };
});

/**
 * Where the arch should be, and how far through a move it is.
 *
 * `side` is the act whose position the arch is currently holding or heading
 * toward; `travel` runs 0 -> 1 across a boundary gap and is 0 whenever the arch
 * is parked. Callers use `travel` to drive the scale dip, and `lerp` to place it.
 *
 * Derived purely from progress, so scrolling backwards runs the whole
 * choreography in reverse with no extra work.
 */
export function archState(progress: number): {
  fromSide: ActSide;
  toSide: ActSide;
  lerp: number;
  travel: number;
} {
  for (const t of TRAVELS) {
    if (progress >= t.start && progress <= t.end) {
      const raw = (progress - t.start) / (t.end - t.start);
      return {
        fromSide: ACTS[t.from].side,
        toSide: ACTS[t.to].side,
        lerp: smoothstep(raw),
        // Bell curve: 0 at both ends of the move, 1 at its midpoint.
        travel: Math.sin(Math.PI * (raw < 0 ? 0 : raw > 1 ? 1 : raw)),
      };
    }
  }
  const act = actAtProgress(progress);
  return { fromSide: act.side, toSide: act.side, lerp: 0, travel: 0 };
}

if (ACTS.length !== ACT_COUNT) {
  throw new Error(`ACTS must contain exactly ${ACT_COUNT} entries`);
}

/**
 * Fail loudly at module load if the windows have drifted.
 *
 * Two invariants:
 *   1. Windows tile [0, 1] with no gap or overlap.
 *   2. Every anchor gesture is on screen while its card is at full opacity.
 *
 * The second one is the reason this exists. It is easy to retune a window for
 * pacing and silently end up with a card naming a gesture that left the screen
 * two acts ago, which is exactly what happened with the first equal-sixths cut.
 */
(function verifyActs() {
  ACTS.forEach((act, i) => {
    const previousEnd = i === 0 ? 0 : ACTS[i - 1].window.end;
    if (Math.abs(act.window.start - previousEnd) > 1e-9) {
      throw new Error(
        `Act ${act.index} (${act.id}) starts at ${act.window.start}, expected ${previousEnd}`,
      );
    }

    const { mid } = mudraProgress(act.mudra);
    const alpha = actVisibility(act, mid);

    if (alpha < 0.999) {
      const { start, end } = act.window;
      const t = ((mid - start) / (end - start)).toFixed(3);
      throw new Error(
        `Act ${act.index} (${act.id}) anchors ${act.mudra.name}, which sits at t=${t} ` +
          `of its window — outside the fully-visible hold. Retune the window or pick another gesture, ` +
          `then rerun _research/check_act_windows.py.`,
      );
    }
  });

  const last = ACTS[ACTS.length - 1].window.end;
  if (Math.abs(last - 1) > 1e-9) {
    throw new Error(`Act windows must end at 1, got ${last}`);
  }
})();

/** Which act is active at a given normalised scroll progress. */
export function actAtProgress(progress: number): Act {
  const clamped = Math.min(1, Math.max(0, progress));
  return ACTS.find((a) => clamped >= a.window.start && clamped < a.window.end) ?? ACTS[ACTS.length - 1];
}
