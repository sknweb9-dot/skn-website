'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { BOOK_LABEL, bookHref, type BookPrefill } from '@/lib/booking';

type Variant = 'solid' | 'outline' | 'ghost' | 'cream';

/**
 * Kumkum red carries the primary action. On a cream ground it is the highest
 * contrast the palette offers, and it reads as ceremonial rather than as a
 * generic "buy" button — which marigold, being closer to the background in
 * luminance, would not.
 *
 * Hover and active go DARKER, not lighter, so contrast never drops when someone
 * interacts with the control: 6.86:1 at rest, 8.83:1 and 9.83:1 after.
 */
const VARIANTS: Record<Variant, string> = {
  solid:
    'bg-kumkum text-cream hover:bg-kumkum-hover active:bg-kumkum-active shadow-[0_10px_30px_-12px_rgba(168,32,26,0.55)]',
  outline: 'border border-teal/30 text-teal hover:border-teal/60 hover:bg-teal/5',
  ghost: 'text-teal hover:text-kumkum',
  // For the deep home grounds, where a kumkum button would sink into
  // kumkum-deep and fight the others. Teal-deep on cream is 12.1:1.
  cream: 'bg-cream text-teal-deep hover:bg-silk active:bg-silk-deep',
};

/**
 * The single conversion control. Every instance links to /book and tags itself
 * with a source, so the academy can see which button earned the enquiry.
 *
 * It is a link, not a button that opens a modal. The enquiry is now a page of
 * its own (app/book), which means it can be shared, bookmarked, opened in a new
 * tab, and reached with JavaScript off. Whatever this button already knows —
 * "Enquire about Adroit" knows the venue — travels in the query string and is
 * pre-filled there.
 *
 * ONE NAME FOR ONE ACTION
 * -----------------------
 * The label lives in lib/booking.ts as BOOK_LABEL and is the default here, so a
 * new instance cannot drift. Contextual labels are still passed as children
 * where the button carries extra intent.
 *
 * `inline` marks a button that sits in page content. FloatingCta hides while
 * any inline button is on screen, so two booking controls are never shown side
 * by side. The masthead, menu and floating bar pass `inline={false}`.
 */
export default function BookButton({
  source = 'site',
  variant = 'solid',
  className = '',
  children = BOOK_LABEL,
  showArrow = true,
  audience,
  region,
  venue,
  inline = true,
  onClick,
}: {
  source?: string;
  variant?: Variant;
  className?: string;
  children?: React.ReactNode;
  showArrow?: boolean;
  inline?: boolean;
  onClick?: () => void;
} & Omit<BookPrefill, 'source'>) {
  const ref = useRef<HTMLAnchorElement>(null);

  // Subtle magnetic pull toward the cursor. Skipped for touch and for anyone
  // who has asked for reduced motion.
  function handleMove(event: React.MouseEvent<HTMLAnchorElement>) {
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
    <Link
      ref={ref}
      href={bookHref({ source, audience, region, venue })}
      onClick={onClick}
      data-book-inline={inline ? '' : undefined}
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
    </Link>
  );
}
