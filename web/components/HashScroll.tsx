'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSmoothScroll } from './SmoothScroll';

/**
 * Makes in-page anchors work while Lenis owns the scroll.
 *
 * Two problems this fixes:
 *
 *  1. Lenis maintains its own scroll position. A native hash jump moves the
 *     document underneath it, and Lenis then animates back toward where it
 *     thought it was — so `/curriculum#level-4` either lands in the wrong place
 *     or drifts away a moment after arriving.
 *  2. Even when a native jump lands correctly, it puts the target flush against
 *     the top of the viewport, underneath the fixed masthead.
 *
 * So every same-document anchor is intercepted and handed to Lenis with a header
 * offset, and any hash present on load or after a route change is resolved the
 * same way. The `scroll-margin-top` rule in globals.css covers the case where
 * this component has not hydrated yet; keep the two offsets in step.
 */

/** Clearance for the fixed masthead, in px. Mirrors `[id] { scroll-margin-top }`. */
const HEADER_OFFSET = 104;

export default function HashScroll() {
  const pathname = usePathname();
  const lenis = useSmoothScroll();

  useEffect(() => {
    function scrollToId(rawId: string, immediate: boolean) {
      let id: string;
      try {
        id = decodeURIComponent(rawId);
      } catch {
        id = rawId;
      }
      const target = document.getElementById(id);
      if (!target) return false;

      lenis.scrollTo(target, { offset: -HEADER_OFFSET, immediate });

      // Move focus so keyboard and screen-reader users land where sighted users
      // do. Without tabindex, a non-interactive target cannot take focus.
      if (!target.hasAttribute('tabindex')) {
        target.setAttribute('tabindex', '-1');
        target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
      }
      target.focus({ preventScroll: true });
      return true;
    }

    // A hash present on load or carried through a route change. Deferred because
    // the target may not be in the DOM on the first frame.
    const hash = window.location.hash.slice(1);
    let raf = 0;
    if (hash) {
      raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => scrollToId(hash, true));
      });
    }

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented) return;
      // Let the browser handle modified clicks — new tab, download, etc.
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const anchor = (event.target as Element | null)?.closest?.('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || !href.includes('#')) return;
      if (anchor.hasAttribute('download') || anchor.getAttribute('target') === '_blank') return;

      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Only same-document anchors. Cross-page hashes are left to the router and
      // picked up by the on-load branch above once the new route mounts.
      if (url.pathname !== window.location.pathname) return;
      if (!url.hash || url.hash === '#') return;

      if (scrollToId(url.hash.slice(1), false)) {
        event.preventDefault();
        // Keep the URL shareable without triggering a native jump.
        window.history.pushState(null, '', url.hash);
      }
    }

    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('click', onClick);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [pathname, lenis]);

  return null;
}
