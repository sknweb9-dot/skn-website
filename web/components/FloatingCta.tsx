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
  const { isOpen } = useBooking();

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > window.innerHeight * 0.9);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const shown = visible && !isOpen;

  return (
    <div
      aria-hidden={!shown}
      className={`fixed inset-x-0 bottom-0 z-40 transition-[transform,opacity] duration-500 ${
        shown ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-full opacity-0'
      } sm:inset-x-auto sm:bottom-7 sm:right-7`}
    >
      <div className="flex items-stretch gap-px border-t border-marigold/20 bg-white/85 backdrop-blur-xl sm:gap-3 sm:border sm:border-marigold/20 sm:p-2">
        <a
          href={`tel:${SITE.phoneE164}`}
          tabIndex={shown ? 0 : -1}
          className="flex shrink-0 items-center gap-2 px-5 py-4 font-sans text-sm text-ink-soft transition-colors hover:text-marigold-deep sm:py-2"
        >
          <Phone className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">Call</span>
          <span className="sm:hidden">{SITE.phoneDisplay}</span>
        </a>
        <TrialButton source="floating" className="flex-1 !py-4 sm:!py-3" showArrow={false} />
      </div>
    </div>
  );
}
