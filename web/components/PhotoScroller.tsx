'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { LocationPhoto } from '@/lib/locationPhotos';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';

/**
 * A strip of photographs, two in view at a time (one, with a peek of the next,
 * on a phone), that snaps from photograph to photograph.
 *
 * It is a plain scrolling row, not a script-driven slider: a finger, a trackpad
 * or the arrow keys (the row takes focus) move it natively, and the two buttons
 * are for people with a mouse. Nothing advances on its own, so there is nothing
 * to pause (WCAG 2.2.2) and no motion to suppress beyond the smooth step the
 * buttons take, which becomes an instant jump under reduced motion.
 *
 * Every photograph is in the document the whole time, so none is hidden from a
 * screen reader or a search engine because it is currently out of view.
 */

/** Matches `gap-4` below, in pixels. */
const GAP = 16;

export default function PhotoScroller({
  photos,
  label,
}: {
  photos: LocationPhoto[];
  /** Names the strip for assistive technology, e.g. "Photographs from Chennai". */
  label: string;
}) {
  const reduced = usePrefersReducedMotion();
  const track = useRef<HTMLUListElement>(null);
  const [state, setState] = useState({ first: 0, last: 0, atStart: true, atEnd: false });

  const measure = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const slide = el.firstElementChild as HTMLElement | null;
    if (!slide) return;
    const step = slide.offsetWidth + GAP;
    const first = Math.round(el.scrollLeft / step);
    // How many whole slides fit in view: two on a laptop, one on a phone.
    const fit = Math.max(1, Math.floor((el.clientWidth + GAP) / step));
    const next = {
      first,
      last: Math.min(photos.length - 1, first + fit - 1),
      atStart: el.scrollLeft <= 2,
      atEnd: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2,
    };
    setState((prev) =>
      prev.first === next.first &&
      prev.last === next.last &&
      prev.atStart === next.atStart &&
      prev.atEnd === next.atEnd
        ? prev
        : next,
    );
  }, [photos.length]);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  function step(direction: 1 | -1) {
    const el = track.current;
    const slide = el?.firstElementChild as HTMLElement | null;
    if (!el || !slide) return;
    el.scrollBy({
      left: direction * (slide.offsetWidth + GAP),
      behavior: reduced ? 'auto' : 'smooth',
    });
  }

  const range =
    state.first === state.last
      ? `${state.first + 1} of ${photos.length}`
      : `${state.first + 1}\u2013${state.last + 1} of ${photos.length}`;

  return (
    <div role="group" aria-roledescription="carousel" aria-label={label}>
      <div className="mb-4 flex items-center justify-end gap-3">
        <p className="mr-auto font-sans text-xs text-ink-faint" aria-live="polite">
          {range}
        </p>
        {(
          [
            { dir: -1, Icon: ChevronLeft, name: 'Previous photograph', disabled: state.atStart },
            { dir: 1, Icon: ChevronRight, name: 'Next photograph', disabled: state.atEnd },
          ] as const
        ).map(({ dir, Icon, name, disabled }) => (
          <button
            key={name}
            type="button"
            onClick={() => step(dir)}
            disabled={disabled}
            aria-label={name}
            className="glass grid size-11 place-items-center rounded-full text-teal transition-colors hover:text-kumkum disabled:pointer-events-none disabled:opacity-35"
          >
            <Icon className="size-5" aria-hidden />
          </button>
        ))}
      </div>

      <ul
        ref={track}
        onScroll={measure}
        // The row scrolls, so it has to be reachable from the keyboard.
        tabIndex={0}
        aria-label={label}
        className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain rounded-[1.25rem] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal"
      >
        {photos.map((photo, i) => (
          <li
            key={photo.src}
            className="relative aspect-[3/2] shrink-0 basis-[84%] snap-start overflow-hidden rounded-[1.25rem] bg-silk sm:basis-[calc((100%-1rem)/2)]"
          >
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(max-width: 640px) 84vw, (max-width: 1152px) 46vw, 560px"
              className="object-cover"
              priority={i < 2}
              // Five or six small photographs: fetch them all up front, so
              // tapping "next" never shows an empty frame while one loads.
              loading={i < 2 ? undefined : 'eager'}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
