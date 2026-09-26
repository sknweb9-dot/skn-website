import Image from 'next/image';
import Link from 'next/link';
import { ACTS } from '@/lib/acts';
import { FRAME_HEIGHT, FRAME_WIDTH, VISIBLE_RATIO, framePath, liveFrames } from '@/lib/mudras';
import Heading from './Heading';
import TrialButton from './TrialButton';

/**
 * The reduced-motion presentation.
 *
 * Not a degraded version of the scrub — a different, complete document. Each
 * act becomes an ordinary section with one still frame taken from the midpoint
 * of its anchor gesture, so the reader still sees the hand that the copy is
 * talking about. No pinning, no canvas, no preload: six images, lazily loaded.
 */
export default function StaticActs() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
      {ACTS.map((act, i) => {
        const { start, end } = liveFrames(act.mudra);
        const still = Math.round((start + end) / 2);

        return (
          <section
            key={act.id}
            id={act.id}
            className={`flex flex-col items-center gap-8 border-marigold/20 py-16 sm:gap-12 lg:flex-row lg:gap-16 ${
              i > 0 ? 'border-t' : ''
            } ${act.side === 'right' ? 'lg:flex-row-reverse' : ''}`}
          >
            {/* object-top + the cropped ratio hides the burned-in label, which
                next/image cannot crop for us. */}
            <div
              className="arch relative w-48 shrink-0 overflow-hidden bg-teal-deep sm:w-56 lg:w-64"
              style={{ aspectRatio: String(VISIBLE_RATIO) }}
            >
              <Image
                src={framePath(still)}
                alt={`The ${act.mudra.name} hasta — ${act.mudra.literal}`}
                width={FRAME_WIDTH}
                height={FRAME_HEIGHT}
                sizes="(max-width: 640px) 12rem, 16rem"
                className="h-full w-full object-cover object-top"
              />
            </div>

            <div className="max-w-2xl">
              <p className="eyebrow">{act.eyebrow}</p>
              {/* Act 1 carries the h1 here too, so the reduced-motion document
                  has the same heading structure as the scrubbed one. */}
              <Heading
                level={act.index === 1 ? 1 : 2}
                className="mt-3 font-display text-[clamp(1.6rem,4vw,2.5rem)] leading-[1.1] font-semibold text-balance-tight text-teal-deep"
              >
                {act.heading}
              </Heading>

              <div className="mt-4 space-y-3">
                {act.body.map((para) => (
                  <p key={para.slice(0, 32)} className="max-w-measure leading-relaxed text-ink-soft">
                    {para}
                  </p>
                ))}
              </div>

              <div className="mt-6 flex items-center gap-3">
                <span aria-hidden className="rule-fade w-8 shrink-0" />
                <p className="font-display text-xs tracking-[0.14em] text-kumkum">
                  {act.mudra.name}
                  <span className="ml-2 font-sans text-[0.7rem] tracking-normal text-ink-faint">
                    {act.mudra.literal}
                  </span>
                </p>
              </div>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                {act.index === 1 || act.index === 6 ? (
                  <TrialButton source={`static-act-${act.index}`}>
                    Schedule a trial session
                  </TrialButton>
                ) : null}
                {act.link ? (
                  <Link
                    href={act.link.href}
                    className="inline-flex items-center gap-1.5 rounded-full border border-teal/25 px-4 py-2 text-sm font-medium text-teal transition-colors hover:border-teal/50 hover:bg-teal/5"
                  >
                    {act.link.label}
                    <span aria-hidden>→</span>
                  </Link>
                ) : null}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}
