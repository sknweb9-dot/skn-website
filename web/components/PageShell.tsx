import type { ReactNode } from 'react';
import Link from 'next/link';
import BookingModal from './BookingModal';
import FloatingCta from './FloatingCta';
import Footer from './Footer';
import Nav from './Nav';
import Reveal from './Reveal';

/**
 * Chrome shared by every non-home route.
 *
 * The home page deliberately does not use this: it is a single pinned canvas and
 * needs its own layout. Everything else is an ordinary document, and repeating
 * the masthead / hero / footer arrangement five times invites them to drift
 * apart.
 *
 * FloatingCta lives here rather than in the shared layout. These are long
 * documents whose hero CTA scrolls out of reach within one screen, which is
 * exactly the gap it was written for. The home page does not get it: the acts
 * carry their own calls to action, the masthead returns on any upward scroll
 * with `Book trial` in it, and on a phone the bar would sit over the foot of the
 * act cards.
 */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Nav />
      <main id="main">{children}</main>
      <Footer />
      <FloatingCta />
      <BookingModal />
    </>
  );
}

/**
 * Page hero. `lede` is intentionally a single paragraph — anything longer
 * belongs in the body, where it can be read at a comfortable measure.
 */
export function PageHero({
  eyebrow,
  title,
  accent,
  lede,
  children,
}: {
  eyebrow: string;
  title: string;
  /** Rendered in the gold-to-kumkum foil treatment, after the title */
  accent?: string;
  lede?: string;
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-marigold/20 pt-[140px] pb-14 sm:pb-16">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        {/* Staggered so the eyebrow, headline and lede arrive in reading order
            rather than as one block. */}
        <Reveal stagger y={22}>
          <p className="eyebrow">{eyebrow}</p>
          <h1 className="mt-4 max-w-3xl font-display text-[clamp(2rem,5.5vw,4rem)] leading-[1.02] font-semibold tracking-[-0.02em] text-teal-deep">
            {title}
            {accent ? (
              <>
                {' '}
                <span className="foil">{accent}</span>
              </>
            ) : null}
          </h1>
          {lede ? (
            <p className="mt-6 max-w-2xl text-[1.02rem] leading-relaxed text-ink-soft">{lede}</p>
          ) : null}
          {children ? <div className="mt-8">{children}</div> : null}
        </Reveal>
      </div>
    </section>
  );
}

/** Standard section wrapper, so vertical rhythm is identical across routes. */
export function Section({
  eyebrow,
  heading,
  lede,
  tinted = false,
  children,
  id,
}: {
  eyebrow?: string;
  heading?: string;
  lede?: string;
  /** Alternating silk wash, used to separate adjacent sections */
  tinted?: boolean;
  children: ReactNode;
  id?: string;
}) {
  const hasHeader = Boolean(eyebrow || heading || lede);

  return (
    <section
      id={id}
      className={`border-t border-marigold/20 py-16 sm:py-20 ${tinted ? 'bg-silk/40' : ''}`}
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        {hasHeader ? (
          <Reveal stagger y={20}>
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            {heading ? (
              <h2 className="mt-3 max-w-2xl font-display text-[clamp(1.6rem,3.8vw,2.5rem)] leading-[1.1] font-semibold text-teal-deep">
                {heading}
              </h2>
            ) : null}
            {lede ? (
              <p className="mt-4 max-w-2xl text-[0.98rem] leading-relaxed text-ink-soft">{lede}</p>
            ) : null}
          </Reveal>
        ) : null}
        {/* The body is revealed as one block. Staggering an unknown number of
            children — twenty-eight hasta cards, twelve gallery images — reads as
            a slow cascade rather than an entrance. */}
        <Reveal className={hasHeader ? 'mt-10' : ''} delay={hasHeader ? 0.08 : 0}>
          {children}
        </Reveal>
      </div>
    </section>
  );
}

/** Pill link used for cross-navigation between the deeper routes. */
export function QuietLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-full border border-teal/25 px-5 py-3 font-sans text-sm font-medium text-teal transition-colors hover:border-teal/50 hover:bg-teal/5"
    >
      {children} <span aria-hidden>→</span>
    </Link>
  );
}
