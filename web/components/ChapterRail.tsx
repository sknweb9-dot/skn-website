'use client';

import type { RefObject } from 'react';
import { ACTS } from '@/lib/acts';
import { useSmoothScroll } from './SmoothScroll';

/**
 * Chapter rail.
 *
 * Six acts across ~960svh of scroll is a long way to travel, and a parent
 * hunting for the Sholinganallur address should not have to wade through the
 * whole narrative to find it.
 *
 * Each marker scrolls to the midpoint of its act's window. The windows are not
 * equal sixths (see lib/acts.ts), so the target has to be derived from the
 * window itself rather than from the act's index.
 */
export default function ChapterRail({
  activeIndex,
  sectionRef,
}: {
  activeIndex: number;
  sectionRef: RefObject<HTMLDivElement | null>;
}) {
  const lenis = useSmoothScroll();

  function goToAct(index: number) {
    const section = sectionRef.current;
    if (!section) return;

    const { start, end } = ACTS[index].window;
    const mid = (start + end) / 2;
    // The sticky child is pinned for `scrollHeight - innerHeight` of travel,
    // which is the same span ScrollTrigger reports progress across.
    const travel = section.scrollHeight - window.innerHeight;
    lenis.scrollTo(section.offsetTop + mid * travel);
  }

  return (
    <nav
      aria-label="Chapters"
      className="pointer-events-auto absolute top-1/2 right-3 z-20 hidden -translate-y-1/2 flex-col items-end gap-3 md:flex lg:right-6"
    >
      {ACTS.map((act, i) => {
        const active = i === activeIndex;
        return (
          <button
            key={act.id}
            type="button"
            onClick={() => goToAct(i)}
            aria-current={active ? 'true' : undefined}
            className="group flex items-center gap-2.5 rounded-full py-1 pr-1 pl-2"
          >
            <span
              className={`font-sans text-micro tracking-[0.18em] uppercase transition-all duration-500 ${
                active
                  ? 'text-teal opacity-100'
                  : 'text-ink-faint opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
              }`}
            >
              {act.rail}
            </span>
            <span
              aria-hidden
              className={`block rounded-full transition-all duration-500 ${
                active
                  ? 'h-5 w-[3px] bg-kumkum'
                  : 'h-[3px] w-[3px] bg-ink-faint/50 group-hover:bg-marigold'
              }`}
            />
            <span className="sr-only">
              Act {act.index}: {act.rail}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
