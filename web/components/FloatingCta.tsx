'use client';

import { useEffect, useState } from 'react';
import { Phone } from 'lucide-react';
import { SITE } from '@/lib/site';
import TrialButton from './TrialButton';
import { useBooking } from './BookingProvider';

/**
 * Persistent conversion rail. Appears once the hero CTA has scrolled away and
 * hides itself while the booking modal is open so it cannot sit above the scrim.
 */
export default function FloatingCta() {
  const [visible, setVisible] = useState(false);
  /**
   * True while an in-page booking button is on screen. The bar steps aside then,
   * so a reader never sees two "Book trial" controls at once — the duplication
   * the academy asked to be rid of. See `inline` on TrialButton.
   */
  const [inlineShowing, setInlineShowing] = useState(false);
  const { isOpen } = useBooking();

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > window.innerHeight * 0.9);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onScreen = new Set<Element>();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) onScreen.add(entry.target);
        else onScreen.delete(entry.target);
      }
      setInlineShowing(onScreen.size > 0);
    });
    document.querySelectorAll('[data-trial-inline]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const shown = visible && !isOpen && !inlineShowing;

  return (
    <div
      aria-hidden={!shown}
      className={`fixed inset-x-0 bottom-0 z-40 transition-[transform,opacity] duration-500 ${
        shown ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0'
      } sm:inset-x-auto sm:bottom-7 sm:right-7`}
    >
      {/* Cream, not white. This bar is the same kind of object as the masthead at
          the other edge of the screen, and it carries the same plate: cream/85
          over a blur. It was `bg-white/85` for as long as the component went
          unrendered, and the moment it was mounted it read as a white patch stuck
          to the foot of a cream page.

          95% rather than the masthead's 85%: this bar also passes over the
          teal-deep footer band, where 85% let enough teal through to turn the
          plate a muddy grey. At 95% it stays cream over both grounds. */}
      <div className="flex items-stretch gap-px border-t border-marigold/20 bg-cream/95 backdrop-blur-xl sm:gap-3 sm:border sm:border-marigold/20 sm:p-2">
        <a
          href={`tel:${SITE.phoneE164}`}
          tabIndex={shown ? 0 : -1}
          className="flex shrink-0 items-center gap-2 px-5 py-4 font-sans text-sm text-ink-soft transition-colors hover:text-kumkum sm:py-2"
        >
          <Phone className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Call</span>
          <span className="sm:hidden">{SITE.phoneDisplay}</span>
        </a>
        <TrialButton source="floating" className="flex-1 !py-4 sm:!py-3" showArrow={false} inline={false} />
      </div>
    </div>
  );
}
