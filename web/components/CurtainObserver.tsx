'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Raises the `.curtain` on editorial photographs — see the curtain block in
 * app/globals.css for the design and the safety contract.
 *
 * Mounted once in the root layout and re-run on every route change, so pages
 * stay server components and only mark their photographs with a class.
 */

/** How much of the picture must be on screen before the curtain lifts. */
const THRESHOLD = 0.35;

export default function CurtainObserver() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!('IntersectionObserver' in window)) return;

    const els = Array.from(document.querySelectorAll<HTMLElement>('.curtain'));
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const onScreen = entry.intersectionRect.height;
          // Either enough of the picture, or — for one taller than the
          // viewport, whose ratio can never reach THRESHOLD — enough screen.
          if (entry.intersectionRatio >= THRESHOLD || onScreen >= window.innerHeight * 0.4) {
            (entry.target as HTMLElement).dataset.curtain = 'up';
            observer.unobserve(entry.target);
          }
        }
      },
      // Several steps so a tall picture still reports as it fills the screen.
      { threshold: [0, 0.1, 0.2, THRESHOLD, 0.6] },
    );

    for (const el of els) {
      // Lower only what the reader cannot see yet. Anything already on screen
      // at load stays exactly as rendered: hiding a visible photograph in
      // order to reveal it would be a flash, not an entrance.
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) continue;
      el.dataset.curtain = 'down';
      observer.observe(el);
    }

    return () => {
      observer.disconnect();
      // Never leave a picture lowered behind a torn-down observer.
      for (const el of els) delete el.dataset.curtain;
    };
  }, [pathname]);

  return null;
}
