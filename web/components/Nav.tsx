'use client';

import Image from 'next/image';
import Link from 'next/link';
import { SITE } from '@/lib/site';
import TrialButton from './TrialButton';

/**
 * Floating masthead.
 *
 * Sits above the sticky stage with no background of its own — the arch is
 * centred and the cream ground is uniform behind the bar, so a plate would only
 * add a seam. The wrapper ignores pointer events; each control opts back in, so
 * a drag or wheel over the header still scrolls the stage underneath.
 */
export default function Nav() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-4 sm:px-7 sm:py-5">
        <Link
          href="/"
          className="pointer-events-auto flex items-center gap-3"
          aria-label={`${SITE.name} — home`}
        >
          <Image
            src="/img/logo-full.svg"
            alt=""
            width={900}
            height={900}
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

        <div className="flex items-center gap-2 sm:gap-5">
          <p className="pointer-events-auto hidden font-sans text-[0.68rem] tracking-[0.18em] text-ink-soft uppercase md:block">
            Chennai
            <span aria-hidden className="mx-2 text-marigold">
              ·
            </span>
            Global
          </p>
          <TrialButton source="nav" className="pointer-events-auto !px-5 !py-2.5" showArrow={false}>
            Book trial
          </TrialButton>
        </div>
      </div>
    </header>
  );
}
