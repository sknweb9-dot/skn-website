'use client';

import Lenis from 'lenis';
import { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';

type ScrollToOptions = {
  offset?: number;
  /** Jump without animating — used for deep links arriving on load. */
  immediate?: boolean;
};

type LenisApi = {
  scrollTo: (target: string | number | HTMLElement, opts?: ScrollToOptions) => void;
  stop: () => void;
  start: () => void;
};

const LenisContext = createContext<LenisApi | null>(null);

/** Lets any component drive the page scroll without importing Lenis itself. */
export function useSmoothScroll(): LenisApi {
  const ctx = useContext(LenisContext);
  return ctx ?? nativeFallback;
}

/** Used when Lenis is disabled (reduced motion) or outside the provider. */
const nativeFallback: LenisApi = {
  scrollTo: (target, opts) => {
    if (typeof window === 'undefined') return;
    const behavior: ScrollBehavior = opts?.immediate ? 'instant' : 'smooth';
    if (typeof target === 'number') {
      window.scrollTo({ top: target + (opts?.offset ?? 0), behavior });
      return;
    }
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY + (opts?.offset ?? 0);
    window.scrollTo({ top, behavior });
  },
  stop: () => {
    if (typeof document !== 'undefined') document.body.style.overflow = 'hidden';
  },
  start: () => {
    if (typeof document !== 'undefined') document.body.style.overflow = '';
  },
};

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const reduced = usePrefersReducedMotion();

  // The API object is stable and reads the instance through a ref, so creating
  // Lenis never has to push new state from inside the effect.
  const api = useMemo<LenisApi>(
    () => ({
      scrollTo: (target, opts) => {
        const lenis = lenisRef.current;
        if (!lenis) return nativeFallback.scrollTo(target, opts);
        lenis.scrollTo(target, {
          offset: opts?.offset ?? 0,
          immediate: opts?.immediate ?? false,
        });
      },
      stop: () => {
        const lenis = lenisRef.current;
        if (!lenis) return nativeFallback.stop();
        lenis.stop();
      },
      start: () => {
        const lenis = lenisRef.current;
        if (!lenis) return nativeFallback.start();
        lenis.start();
      },
    }),
    [],
  );

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    if (reduced) {
      // Native scrolling only. ScrollTrigger still works; nothing to sync.
      ScrollTrigger.refresh();
      return;
    }

    const lenis = new Lenis({
      duration: 1.15,
      // Long, decelerating ease — momentum without the drift.
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      autoRaf: false,
    });
    lenisRef.current = lenis;

    // Drive ScrollTrigger from Lenis rather than the native scroll event, and
    // drive Lenis from GSAP's ticker so both share one rAF loop.
    const onScroll = () => ScrollTrigger.update();
    lenis.on('scroll', onScroll);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    ScrollTrigger.refresh();

    return () => {
      lenis.off('scroll', onScroll);
      gsap.ticker.remove(raf);
      gsap.ticker.lagSmoothing(500, 33);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reduced]);

  return <LenisContext.Provider value={api}>{children}</LenisContext.Provider>;
}
