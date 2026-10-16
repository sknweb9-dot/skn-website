/**
 * Pure helpers for the text motion system (components/TextMotion.tsx and
 * components/Words.tsx). Kept free of the DOM so they can be tested.
 */

/** Gap between one headline word and the next, in ms. Mirrors `* 70ms` in globals.css. */
export const WORD_STAGGER_MS = 70;

/** Longest a group of siblings entering together will fan out over, in ms. */
export const BATCH_CAP_MS = 420;

/** The words of a headline, in order. */
export function splitWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

/**
 * Delay for the nth element of a group that enters at once. Capped, because a
 * fan-out that grows with the list turns into waiting.
 */
export function batchDelay(index: number, step = 60, cap = BATCH_CAP_MS): number {
  return Math.min(Math.max(0, index) * step, cap);
}

/**
 * Delays for a group of text that arrives together, in reading order.
 *
 * Each item steps in after the one before it, up to `cap`. A headline that is
 * lifted word by word takes longer to land than a block that is swept in, so
 * everything after it is held back by a share of its word count (`lead` ms per
 * word); otherwise the paragraph under a heading finishes before the heading
 * does, and the page reads out of order.
 */
export function sequenceDelays(
  items: { words: number }[],
  { base = 0, step = 60, cap = BATCH_CAP_MS, lead = 40 }: { base?: number; step?: number; cap?: number; lead?: number } = {},
): number[] {
  let held = 0;
  return items.map((item, i) => {
    const delay = base + batchDelay(i, step, cap) + held;
    held += item.words * lead;
    return delay;
  });
}

export type Count = {
  target: number;
  prefix: string;
  suffix: string;
  /** The final figure carries thousands separators, so the count should too. */
  grouped: boolean;
};

/**
 * Reads a figure such as "1,500+" or "7" into something that can be counted up
 * to. Returns null for anything that is not a single number with optional
 * surrounding symbols, so a label is never mistaken for a figure.
 */
export function parseCount(text: string): Count | null {
  // Symbols only around the digits ("1,500+", "₹500"): a label that merely
  // contains a number ("since 2009") is not a figure.
  const match = /^([^\p{L}\d\s]*)(\d[\d,]*)([^\p{L}\d\s]*)$/u.exec(text.trim());
  if (!match) return null;
  const digits = match[2].replace(/,/g, '');
  if (digits.length === 0) return null;
  return {
    target: Number(digits),
    prefix: match[1],
    suffix: match[3],
    grouped: match[2].includes(','),
  };
}

/** Indian digit grouping, as the figures are rendered on the server. */
export function formatCount(value: number, grouped: boolean): string {
  const whole = Math.round(value);
  return grouped ? whole.toLocaleString('en-IN') : String(whole);
}

/** Fast out of the gate, long settle: the site's ease, in JS for the counter. */
export function easeOutExpo(t: number): number {
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return 1 - Math.pow(2, -10 * t);
}
