/**
 * Which answers are open after a click, for components/FaqList.tsx.
 *
 * `open` is in the order answers were opened, oldest first. Clicking an open
 * one closes it. Clicking a closed one opens it, and if that makes more than
 * `max` open, the oldest closes — so a third opening hides the first.
 */
export function nextOpen(open: readonly number[], index: number, max: number): number[] {
  if (open.includes(index)) return open.filter((i) => i !== index);
  return [...open, index].slice(-max);
}
