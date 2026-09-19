import { SITE } from '@/lib/site';

/**
 * Parent testimonials — RESERVED SECTION.
 *
 * Deliberately empty of content. There are no testimonials anywhere in the
 * academy's published material or in `Website Contents.docx`, and inventing
 * social proof for a children's institution is not a thing we do.
 *
 * TO FILL: replace `PLACEHOLDERS` with real entries. Each needs the parent's
 * name, the child's level (matching an id from lib/curriculum.ts), how long they
 * have been enrolled, and the quote. Once populated, wire these into the
 * `review` property of the DanceSchool JSON-LD in lib/schema.ts — but only with
 * genuine, attributable quotes, since review markup is what Google penalises
 * hardest when it is fabricated.
 */

type Testimonial = {
  quote: string;
  parent: string;
  detail: string;
};

const PLACEHOLDERS: Testimonial[] = [];

/** Three slots — enough to show a pattern, few enough to stay readable. */
const SLOTS = 3;

export default function Testimonials() {
  const filled = PLACEHOLDERS.length > 0;

  return (
    <section id="testimonials" className="border-t border-marigold/20 bg-silk/40 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="eyebrow">In their words</p>
          <h2 className="mt-3 font-display text-[clamp(1.7rem,4vw,2.6rem)] leading-[1.1] font-semibold text-balance-tight text-teal-deep">
            What parents say
          </h2>
        </div>

        {filled ? (
          <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {PLACEHOLDERS.map((t) => (
              <li key={t.parent} className="glass grain rounded-[1.5rem] px-6 py-7">
                <blockquote className="font-display text-[1.05rem] leading-relaxed text-ink">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <footer className="mt-5">
                  <p className="font-sans text-sm font-semibold text-teal">{t.parent}</p>
                  <p className="font-sans text-xs text-ink-faint">{t.detail}</p>
                </footer>
              </li>
            ))}
          </ul>
        ) : (
          <>
            <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
              {Array.from({ length: SLOTS }, (_, i) => (
                <li
                  key={i}
                  className="rounded-[1.5rem] border border-dashed border-marigold/40 bg-paper/60 px-6 py-7"
                >
                  <div className="space-y-2.5">
                    <div className="h-2.5 w-full rounded-full bg-marigold/15" />
                    <div className="h-2.5 w-[92%] rounded-full bg-marigold/15" />
                    <div className="h-2.5 w-[78%] rounded-full bg-marigold/15" />
                    <div className="h-2.5 w-[60%] rounded-full bg-marigold/15" />
                  </div>
                  <div className="mt-6 space-y-2">
                    <div className="h-2.5 w-28 rounded-full bg-teal/15" />
                    <div className="h-2 w-20 rounded-full bg-teal/10" />
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-8 max-w-xl font-sans text-sm leading-relaxed text-ink-soft">
              This section is reserved for parent testimonials. Send quotes to{' '}
              <a
                href={`mailto:${SITE.email}`}
                className="font-medium text-teal underline decoration-marigold/50 underline-offset-4 hover:decoration-marigold"
              >
                {SITE.email}
              </a>{' '}
              with the parent&rsquo;s name, their child&rsquo;s current level, and how long they have
              been with the academy.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
