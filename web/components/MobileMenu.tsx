'use client';

import { useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X } from 'lucide-react';
import { NAV_ROUTES, SITE } from '@/lib/site';
import { FacebookIcon, InstagramIcon, YoutubeIcon } from './SocialIcons';
import { useSmoothScroll } from './SmoothScroll';
import TrialButton from './TrialButton';

/**
 * Full-screen navigation for phones and small tablets.
 *
 * A drawer sliding in from the edge would be the conventional choice and the
 * wrong one here: the site's whole argument is that a gesture is worth looking
 * at slowly, and six routes on a cream field set in the display face reads as a
 * temple board rather than as an app menu. It also means the routes can be typed
 * at a size a parent can actually hit.
 *
 * Ordered by NAV_ROUTES — narrative order, not alphabetical — and numbered, so
 * the list reads as a sequence rather than a bag of links.
 */
const SOCIALS = [
  { name: 'Instagram', href: SITE.socials.instagram, Icon: InstagramIcon },
  { name: 'Facebook', href: SITE.socials.facebook, Icon: FacebookIcon },
  { name: 'YouTube', href: SITE.socials.youtube, Icon: YoutubeIcon },
] as const;

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function MobileMenu({ onClose }: { onClose: () => void }) {
  const scroll = useSmoothScroll();
  const panelRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  // Hold the page still behind the overlay and hand focus back on close, the
  // same contract BookingModal keeps.
  useEffect(() => {
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    scroll.stop();

    const raf = requestAnimationFrame(() => firstLinkRef.current?.focus());

    return () => {
      cancelAnimationFrame(raf);
      scroll.start();
      returnFocusRef.current?.focus?.();
    };
  }, [scroll]);

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!nodes || nodes.length === 0) return;

      const list = Array.from(nodes);
      const first = list[0];
      const last = list[list.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label="Site navigation"
      onKeyDown={onKeyDown}
      // Sits above the masthead (z-40) and below the booking modal (z-90), so
      // choosing "Book a trial" from here layers correctly.
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-cream lg:hidden"
    >
      {/* Same warm wash as the home stage, so the menu belongs to the site
          rather than arriving as a flat white sheet. */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(120%_80%_at_50%_0%,var(--color-silk)_0%,var(--color-cream)_55%,var(--color-silk-deep)_100%)]"
      />

      <div className="relative flex items-center justify-between px-4 py-4 sm:px-7 sm:py-5">
        <Link href="/" onClick={onClose} className="flex items-center gap-3" aria-label={`${SITE.name} — home`}>
          <Image src="/img/logo-full.svg" alt="" width={900} height={900} className="size-9 sm:size-11" />
          <span className="leading-tight">
            <span className="block font-display text-[0.95rem] font-semibold tracking-wide text-teal-deep">
              {SITE.name}
            </span>
            <span className="block font-sans text-[0.6rem] tracking-[0.2em] text-ink-faint uppercase">
              {SITE.tagline}
            </span>
          </span>
        </Link>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="-mr-2 grid size-11 place-items-center rounded-full text-ink-soft transition-colors hover:bg-teal/5 hover:text-ink"
        >
          <X className="size-6" aria-hidden="true" />
        </button>
      </div>

      <nav aria-label="Pages" className="relative mt-4 px-4 sm:px-7">
        <ul>
          {NAV_ROUTES.map((route, i) => (
            <li key={route.href} className="border-b border-marigold/20">
              {/* Staggered so the board assembles in reading order. The delay is
                  inline because it is per-item data, not a design token. */}
              <Link
                ref={i === 0 ? firstLinkRef : undefined}
                href={route.href}
                onClick={onClose}
                style={{ animationDelay: `${0.04 + i * 0.045}s` }}
                className="animate-rise group flex items-baseline gap-4 py-4 transition-colors hover:text-kumkum"
              >
                <span
                  aria-hidden
                  className="w-5 shrink-0 font-sans text-[0.65rem] tracking-[0.1em] text-marigold-deep tabular-nums"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="font-display text-[clamp(1.6rem,7vw,2.25rem)] leading-tight font-semibold text-teal-deep transition-colors group-hover:text-kumkum">
                  {route.label}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* mt-auto pins this block to the foot on tall screens and lets it flow
          naturally on short ones, so nothing is ever unreachable. */}
      <div className="relative mt-auto px-4 pt-10 pb-8 sm:px-7">
        {/* Wrapping the control means the menu closes on the way to the modal:
            the button's own handler opens the booking dialog, then the click
            bubbles to here. */}
        <div onClick={onClose}>
          <TrialButton source="menu" className="w-full !py-4">
            Book a trial session
          </TrialButton>
        </div>

        <div className="mt-7 flex flex-col gap-2 font-sans text-sm text-ink-soft">
          <a href={`tel:${SITE.phoneE164}`} className="transition-colors hover:text-kumkum">
            {SITE.phoneDisplay}
          </a>
          <a href={`mailto:${SITE.email}`} className="transition-colors hover:text-kumkum">
            {SITE.email}
          </a>
        </div>

        <div className="mt-6 flex items-center gap-4">
          {SOCIALS.map(({ name, href, Icon }) => (
            <a
              key={name}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${SITE.name} on ${name}`}
              className="text-ink-faint transition-colors hover:text-kumkum"
            >
              <Icon className="size-5" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
