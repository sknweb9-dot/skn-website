'use client';

import { forwardRef } from 'react';
import Link from 'next/link';
import type { Act } from '@/lib/acts';
import Heading from './Heading';
import TrialButton from './TrialButton';

/**
 * One act's editorial column, docked to the arch.
 *
 * POSITIONING
 * -----------
 * These panels are children of the arch's transform group, so `100%` here means
 * the arch's own width and height, and the card travels with the aperture as a
 * single composed object rather than as a separate layer that happens to move at
 * the same time.
 *
 *  - Side acts dock to the arch's outer edge and overlap it by 2.5rem, so the
 *    two visibly touch. The overlap lands on the arch's lower flank, which is
 *    backdrop and forearm rather than the gesture itself.
 *  - Centre acts sit flush beneath the arch — top edge meeting its foot, not
 *    overlapping it. The arch's bottom fade dissolves into cream, so a card
 *    butted against it appears to rise out of the mist, and crucially the
 *    gesture caption in that bottom strip stays uncovered. An earlier cut
 *    overlapped the arch's bottom 12% and buried the caption.
 *  - Below `sm` there is no room to dock sideways, so every act uses the centre
 *    arrangement.
 *
 * Opacity and the vertical offset are written by ScrollStage on every scroll
 * tick, and the card is fully transparent while the arch is travelling. Nothing
 * here should set either, or the two will fight.
 */
const ActPanel = forwardRef<HTMLDivElement, { act: Act }>(function ActPanel({ act }, ref) {
  const isCenter = act.side === 'center';

  // `top-[100%]` puts the card's top edge exactly on the arch's foot. The -mt-px
  // closes the sub-pixel hairline that rounding can leave at some zoom levels.
  const centred = 'left-1/2 top-[100%] -mt-px w-[min(92vw,32rem)] -translate-x-1/2';

  const docked =
    act.side === 'left'
      ? 'sm:top-auto sm:bottom-[8%] sm:left-auto sm:right-[calc(100%-2.5rem)] sm:w-[min(34vw,23rem)] sm:translate-x-0 xl:w-[26rem]'
      : 'sm:top-auto sm:bottom-[8%] sm:right-auto sm:left-[calc(100%-2.5rem)] sm:w-[min(34vw,23rem)] sm:translate-x-0 xl:w-[26rem]';

  const position = isCenter ? `${centred} sm:w-[min(80vw,34rem)]` : `${centred} ${docked}`;

  return (
    <div ref={ref} className="absolute inset-0" style={{ opacity: 0 }}>
      <div className={`absolute ${position}`}>
        <article
          className={`glass grain rounded-[1.75rem] px-6 py-6 sm:px-7 sm:py-7 ${
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
            className={`mt-2.5 font-display font-semibold text-balance-tight text-teal-deep ${
              act.index === 1
                ? 'text-[clamp(1.45rem,3.4vw,2.3rem)] leading-[1.08]'
                : 'text-[clamp(1.3rem,2.9vw,1.95rem)] leading-[1.14]'
            }`}
          >
            {act.heading}
          </Heading>

          <div className="mt-3.5 space-y-2.5">
            {act.body.map((para) => (
              <p key={para.slice(0, 32)} className="text-[0.9rem] leading-relaxed text-ink-soft">
                {para}
              </p>
            ))}
          </div>

          <div
            className={`pointer-events-auto mt-5 flex flex-wrap items-center gap-2.5 ${
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

          {/* Inside the card rather than below it: the card is docked to the arch
              and already reaches near the foot of the viewport, so an external
              line had nowhere to sit. */}
          {act.index === 1 ? (
            <p className="mt-5 font-sans text-[0.62rem] tracking-[0.2em] text-ink-faint uppercase">
              Scroll to begin the journey <span aria-hidden>↓</span>
            </p>
          ) : null}
        </article>
      </div>
    </div>
  );
});

export default ActPanel;
