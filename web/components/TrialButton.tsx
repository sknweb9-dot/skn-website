'use client';

import { useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useBooking } from './BookingProvider';

type Variant = 'solid' | 'outline' | 'ghost';

/**
 * Kumkum red carries the primary action. On a cream ground it is the highest
 * contrast the palette offers, and it reads as ceremonial rather than as a
 * generic "buy" button — which marigold, being closer to the background in
 * luminance, would not.
 */
const VARIANTS: Record<Variant, string> = {
  solid: 'bg-kumkum text-cream hover:bg-kumkum-lit shadow-[0_10px_30px_-12px_rgba(168,32,26,0.55)]',
  outline: 'border border-teal/30 text-teal hover:border-teal/60 hover:bg-teal/5',
  ghost: 'text-teal hover:text-kumkum',
};

/**
 * The single conversion control. Every instance opens the same modal and tags
 * itself with a source so we can see which act earns the click.
 */
export default function TrialButton({
  source = 'site',
  variant = 'solid',
  className = '',
  children = 'Book a trial session',
  showArrow = true,
}: {
  source?: string;
  variant?: Variant;
  className?: string;
  children?: React.ReactNode;
  showArrow?: boolean;
}) {
  const { open } = useBooking();
  const ref = useRef<HTMLButtonElement>(null);

  // Subtle magnetic pull toward the cursor. Skipped for touch and for anyone
  // who has asked for reduced motion.
  function handleMove(event: React.MouseEvent<HTMLButtonElement>) {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce), (pointer: coarse)').matches) return;

    const rect = el.getBoundingClientRect();
    const dx = (event.clientX - (rect.left + rect.width / 2)) / rect.width;
    const dy = (event.clientY - (rect.top + rect.height / 2)) / rect.height;
    el.style.transform = `translate3d(${dx * 5}px, ${dy * 4}px, 0)`;
  }

  function handleLeave() {
    if (ref.current) ref.current.style.transform = '';
  }

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => open(source)}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 font-sans text-sm font-semibold tracking-wide transition-[background-color,color,border-color,transform,box-shadow] duration-300 ${VARIANTS[variant]} ${className}`}
    >
      {children}
      {showArrow ? (
        <ArrowUpRight
          className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          aria-hidden="true"
        />
      ) : null}
    </button>
  );
}
