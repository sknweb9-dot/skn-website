'use client';

import Link from 'next/link';
import { SITE } from '@/lib/site';

/**
 * Shown when a page throws while rendering. It sits inside the root layout, so
 * the page behind it is gone but the fonts and colours are still there.
 *
 * It does not use the page chrome (the masthead and footer are client components
 * that could be what failed), and it names the academy's number because at this
 * point the site has not helped, and a parent should not be left with only a
 * "try again".
 */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center px-5 py-24 sm:px-8">
      <p className="eyebrow">Something went wrong</p>
      <h1 className="mt-4 font-display text-[clamp(2rem,5.5vw,3.4rem)] leading-[1.05] font-semibold text-teal-deep">
        This page did not load.
      </h1>
      <p className="mt-6 max-w-measure text-[1.02rem] leading-relaxed text-ink-soft">
        It is on our side, not yours. Try again, and if it persists you can reach the academy directly on{' '}
        <a href={`tel:${SITE.phoneE164}`} className="font-medium text-teal underline underline-offset-4">
          {SITE.phoneDisplay}
        </a>{' '}
        or at{' '}
        <a href={`mailto:${SITE.email}`} className="font-medium text-teal underline underline-offset-4">
          {SITE.email}
        </a>
        .
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-11 items-center rounded-full bg-kumkum px-6 py-3 font-sans text-sm font-semibold text-cream transition-colors hover:bg-kumkum-hover"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-full border border-teal/25 px-6 py-3 font-sans text-sm font-medium text-teal transition-colors hover:border-teal/50 hover:bg-teal/5"
        >
          Back to the home page
        </Link>
      </div>
    </main>
  );
}
