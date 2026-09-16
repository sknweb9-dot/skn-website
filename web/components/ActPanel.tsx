'use client';

import { forwardRef } from 'react';
import Link from 'next/link';
import type { Act } from '@/lib/acts';
import Heading from './Heading';
import TrialButton from './TrialButton';

/**
 * One act's editorial column.
 *
 * Placement rules, and why they are what they are:
 *
 *  - On desktop, `left` and `right` acts sit beside the arch so the hand is
 *    never obscured. `center` acts overlay the bottom third of the arch, which
 *    is the wrist and forearm — the least expressive part of the frame — so the
 *    gesture itself stays legible behind a frosted panel.
 *  - On mobile there is no room beside the arch, so every act overlays the
 *    bottom. The arch is short enough at 62svh that the fingers stay clear.
 *
 * Opacity and transform are written directly by ScrollStage on every scroll
 * tick. Nothing here should set either, or the two will fight.
 */
const ActPanel = forwardRef<HTMLDivElement, { act: Act }>(function ActPanel({ act }, ref) {
  const isCenter = act.side === 'center';

  /**
   * Centre acts sit in the clear cream below the arch. Side acts sit beside it
   * on desktop, and drop to that same low position on mobile where there is no
   * room beside.
   *
   * Right-hand acts carry an extra gutter (`+3rem`) so the card never runs under
   * the chapter rail, which is anchored to the same edge.
   */
  const columnPosition = isCenter
    ? 'bottom-[4svh] left-1/2 w-[min(92vw,36rem)] -translate-x-1/2'
    : act.side === 'left'
      ? 'bottom-[4svh] left-1/2 w-[min(92vw,36rem)] -translate-x-1/2 sm:bottom-auto sm:left-[4vw] sm:top-[24svh] sm:w-[min(36vw,25rem)] sm:translate-x-0 lg:left-[7vw] xl:w-[28rem]'
      : 'bottom-[4svh] left-1/2 w-[min(92vw,36rem)] -translate-x-1/2 sm:bottom-auto sm:left-auto sm:right-[calc(4vw+3rem)] sm:top-[24svh] sm:w-[min(36vw,25rem)] sm:translate-x-0 lg:right-[calc(7vw+3rem)] xl:w-[28rem]';

  return (
    <div ref={ref} className="absolute inset-0" style={{ opacity: 0 }}>
      <div className={`absolute ${columnPosition}`}>
        <article
          className={`glass grain rounded-[1.75rem] px-6 py-7 sm:px-8 sm:py-8 ${
            isCenter ? 'text-center' : ''
          }`}
        >
          <p className="eyebrow">{act.eyebrow}</p>

          {/*
            Act 1 carries the page's only h1. The home page is a single pinned
            canvas with no conventional hero, so without this the most important
            URL on the site ships with no top-level heading at all.
          */}
          <Heading
            level={act.index === 1 ? 1 : 2}
            className={`mt-3 font-display font-semibold text-balance-tight text-teal-deep ${
              act.index === 1
                ? 'text-[clamp(1.5rem,3.6vw,2.45rem)] leading-[1.08]'
                : 'text-[clamp(1.4rem,3.1vw,2.1rem)] leading-[1.14]'
            }`}
          >
            {act.heading}
          </Heading>

          <div className="mt-4 space-y-3">
            {act.body.map((para) => (
              <p key={para.slice(0, 32)} className="text-[0.93rem] leading-relaxed text-ink-soft">
                {para}
              </p>
            ))}
          </div>

          <div
            className={`pointer-events-auto mt-6 flex flex-wrap items-center gap-3 ${
              isCenter ? 'justify-center' : ''
            }`}
          >
            {act.index === 1 || act.index === 6 ? (
              <TrialButton source={`act-${act.index}-${act.id}`}>
                Schedule a trial session
              </TrialButton>
            ) : null}
            {act.link ? (
              <Link
                href={act.link.href}
                className="inline-flex items-center gap-1.5 rounded-full border border-teal/25 px-4 py-2 font-sans text-sm font-medium text-teal transition-colors hover:border-teal/50 hover:bg-teal/5"
              >
                {act.link.label}
                <span aria-hidden>→</span>
              </Link>
            ) : null}
          </div>
        </article>

        {act.index === 1 ? (
          <p className="mt-4 text-center font-sans text-[0.65rem] tracking-[0.2em] text-ink-faint uppercase">
            Scroll to begin the journey <span aria-hidden>↓</span>
          </p>
        ) : null}
      </div>
    </div>
  );
});

export default ActPanel;
