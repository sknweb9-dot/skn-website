'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { NAV_ROUTES, SITE } from '@/lib/site';
import { usePrefersReducedMotion } from '@/lib/usePrefersReducedMotion';
import MobileMenu from './MobileMenu';
import TrialButton from './TrialButton';

/**
 * Masthead.
 *
 * AUTO-HIDE
 * ---------
 * The home page is one ~960svh pinned canvas, and a bar parked over the arch for
 * the whole of it competes with the thing it is framing. So the masthead retires
 * on the way down and returns on the way up — the gesture sequence gets the
 * screen while you are reading forward, and the way out is one flick away at any
 * point.
 *
 * Read from the native scroll position rather than from Lenis. Lenis writes the
 * real scroll offset as it animates, so `window.scrollY` is already the smoothed
 * value; subscribing to Lenis instead would mean widening the context API in
 * SmoothScroll for no gain.
 *
 * State flips only when the boolean actually changes, not on every tick, so this
 * costs one re-render per direction change rather than one per frame.
 *
 * BACKGROUND
 * ----------
 * Transparent at rest, because the ground behind it is uniform cream and a plate
 * would only add a seam. Once scrolled it takes a translucent cream plate and a
 * marigold hairline — without it the six route links would sit directly on the
 * artwork and on the act cards.
 */

/** Scrolled past this, the bar is allowed to hide. Above it, always shown. */
const REVEAL_ZONE = 90;
/** Ignore direction changes smaller than this, or a trackpad jitters the bar. */
const HYSTERESIS = 8;

export default function Nav() {
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  /**
   * The menu records the route it was opened on. Comparing that against the live
   * pathname closes it on navigation by derivation, with no effect that writes
   * state — which also covers back/forward, where no link was clicked.
   */
  const [menu, setMenu] = useState<{ open: boolean; at: string | null }>({
    open: false,
    at: null,
  });
  const pathname = usePathname();
  const reduced = usePrefersReducedMotion();

  const menuOpen = menu.open && menu.at === pathname;

  const lastYRef = useRef(0);
  const hiddenRef = useRef(false);
  const scrolledRef = useRef(false);

  useEffect(() => {
    lastYRef.current = window.scrollY;

    function onScroll() {
      const y = window.scrollY;
      const delta = y - lastYRef.current;

      if (Math.abs(delta) > HYSTERESIS) {
        // Retiring is conditional on being clear of the top; returning never is.
        const next = delta > 0 && y > REVEAL_ZONE;
        if (next !== hiddenRef.current) {
          hiddenRef.current = next;
          setHidden(next);
        }
        lastYRef.current = y;
      }

      const isScrolled = y > 24;
      if (isScrolled !== scrolledRef.current) {
        scrolledRef.current = isScrolled;
        setScrolled(isScrolled);
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // A route change closes the menu. Without this, tapping a link navigates
  // underneath an overlay that never goes away. Handled by the `menuOpen`
  // derivation above rather than by an effect.

  // Never hide while the menu is open, and never hide at all for anyone who has
  // asked for reduced motion — for them the bar would teleport rather than slide.
  const retired = hidden && !menuOpen && !reduced;

  return (
    <>
      <header
        className={`pointer-events-none fixed inset-x-0 top-0 z-40 transition-transform duration-500 ease-[var(--ease-temple)] ${
          retired ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        <div
          className={`transition-colors duration-500 ${
            scrolled && !menuOpen
              ? 'border-b border-marigold/20 bg-cream/85 backdrop-blur-xl'
              : 'border-b border-transparent'
          }`}
        >
          <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-7 sm:py-5">
            <Link
              href="/"
              className="pointer-events-auto flex items-center gap-3"
              aria-label={`${SITE.name} — home`}
            >
              {/* The PNG, not logo-full.svg, deliberately.
                  next/image treats an `.svg` src as `unoptimized` automatically,
                  so the SVG ships all 338KB of its 4,436 auto-traced paths to
                  render a 44px square in the masthead of every page. The PNG goes
                  through the optimizer and arrives as a couple of KB of webp. The
                  SVG stays on /about, where it is rendered large enough for vector
                  crispness to be the point.

                  width/height are the rendered size, not the source's 900x900:
                  next/image builds the srcset from `width`, so declaring 900 had
                  the browser fetch a 1080px-wide render for a 44px box. */}
              <Image
                src="/img/logo-full.png"
                alt=""
                width={44}
                height={44}
                priority
                className="size-9 sm:size-11"
              />
              <span className="hidden leading-tight sm:block">
                <span className="block font-display text-[0.95rem] font-semibold tracking-wide text-teal-deep">
                  {SITE.name}
                </span>
                <span className="block font-sans text-[0.6rem] tracking-[0.2em] text-ink-faint uppercase">
                  {SITE.tagline}
                </span>
              </span>
            </Link>

            {/* Inline routes only from `lg`. At `md` the six of them plus the
                wordmark and the booking control crowd into each other, so
                anything narrower gets the full-screen menu instead. */}
            <nav aria-label="Pages" className="pointer-events-auto hidden lg:block">
              <ul className="flex items-center gap-1">
                {NAV_ROUTES.map((route) => {
                  const active = pathname === route.href || pathname.startsWith(`${route.href}/`);
                  return (
                    <li key={route.href}>
                      <Link
                        href={route.href}
                        aria-current={active ? 'page' : undefined}
                        className={`relative block rounded-full px-3.5 py-2 font-sans text-[0.8rem] tracking-wide transition-colors ${
                          active ? 'text-kumkum' : 'text-ink-soft hover:text-kumkum'
                        }`}
                      >
                        {route.short}
                        {/* Marigold underscore for the current route. A filled
                            pill would read as a button among five links. */}
                        <span
                          aria-hidden
                          className={`absolute inset-x-3.5 -bottom-0.5 h-px bg-marigold transition-opacity duration-300 ${
                            active ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <TrialButton
                source="nav"
                className="pointer-events-auto !px-5 !py-2.5"
                showArrow={false}
              >
                Book trial
              </TrialButton>

              <button
                type="button"
                onClick={() => setMenu({ open: true, at: pathname })}
                aria-label="Open menu"
                aria-expanded={menuOpen}
                className="pointer-events-auto -mr-2 grid size-11 place-items-center rounded-full text-ink-soft transition-colors hover:bg-teal/5 hover:text-ink lg:hidden"
              >
                <Menu className="size-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {menuOpen ? <MobileMenu onClose={() => setMenu({ open: false, at: null })} /> : null}
    </>
  );
}
