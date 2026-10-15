'use client';

import { useId, useState } from 'react';
import { Plus } from 'lucide-react';
import { nextOpen } from '@/lib/accordion';

/**
 * Questions shown closed; a click opens the answer.
 *
 * AT MOST TWO OPEN
 * ----------------
 * Opening a third answer closes the one that was opened first, so the list
 * never grows into a wall of text while a parent compares two answers side by
 * side. The academy asked for exactly this. Closing an answer by hand frees its
 * slot; nothing else closes on its own.
 *
 * Built on buttons with aria-expanded rather than <details>, because <details>
 * cannot be told to close another one. Closed answers are `inert` as well as
 * collapsed, so their text is not read out and nothing inside takes focus.
 *
 * The open and close is a grid-rows transition. Under reduced motion the global
 * rule in globals.css limits transitions to colour and opacity, so it snaps.
 */
const MAX_OPEN = 2;

export default function FaqList({ items }: { items: readonly { q: string; a: string }[] }) {
  // Opening order, oldest first. The front of the list is what a third opening evicts.
  const [open, setOpen] = useState<number[]>([]);
  const base = useId();

  function toggle(index: number) {
    setOpen((prev) => nextOpen(prev, index, MAX_OPEN));
  }

  return (
    <ul className="divide-y divide-marigold/25 border-y border-marigold/25">
      {items.map((item, index) => {
        const expanded = open.includes(index);
        const buttonId = `${base}-q${index}`;
        const panelId = `${base}-a${index}`;
        return (
          <li key={item.q}>
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => toggle(index)}
                className="group flex w-full items-start justify-between gap-6 py-5 text-left"
              >
                <span
                  className={`font-sans text-[1.05rem] leading-snug font-semibold transition-colors ${
                    expanded ? 'text-teal-deep' : 'text-ink group-hover:text-teal'
                  }`}
                >
                  {item.q}
                </span>
                <span
                  aria-hidden="true"
                  className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border transition-[transform,background-color,border-color,color] duration-300 ${
                    expanded ? 'rotate-45 border-teal bg-teal text-cream' : 'border-teal/30 text-teal group-hover:border-teal/60'
                  }`}
                >
                  <Plus className="size-4" />
                </span>
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              inert={!expanded}
              className={`grid transition-[grid-template-rows,opacity] duration-500 ease-[var(--ease-temple)] ${
                expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
              }`}
            >
              <div className="overflow-hidden">
                <div className="max-w-measure space-y-3 pb-6 text-[0.98rem] leading-relaxed text-ink-soft">
                  {item.a.split('\n\n').map((paragraph) => (
                    <p key={paragraph.slice(0, 40)}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
