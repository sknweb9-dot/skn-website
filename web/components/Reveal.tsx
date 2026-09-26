'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Stagger direct children instead of animating the wrapper as one block. */
  stagger?: boolean;
  delay?: number;
  /** Distance travelled, in px. */
  y?: number;
  as?: 'div' | 'section' | 'ul' | 'ol' | 'header' | 'figure';
};

/**
 * Scroll-triggered entrance. Elements start at their final position in the DOM
 * and are offset by GSAP after mount, so nothing shifts layout and the content
 * is present for crawlers and for users with JS disabled.
 */
export default function Reveal({
  children,
  className,
  stagger = false,
  delay = 0,
  y = 28,
  as: Tag = 'div',
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const targets = stagger ? Array.from(el.children) : [el];
    if (targets.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          // 0.7s with a 0.07s step: four children land inside ~0.9s. The old
          // 1s + 0.09 put the hero's buttons past 1.2s, which on a page that
          // replays this on every navigation reads as waiting.
          duration: 0.7,
          delay,
          ease: 'power3.out',
          stagger: stagger ? 0.07 : 0,
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            once: true,
          },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [stagger, delay, y]);

  return (
    <Tag
      ref={ref as React.RefObject<HTMLDivElement & HTMLElement & HTMLUListElement & HTMLOListElement>}
      className={className}
    >
      {children}
    </Tag>
  );
}
