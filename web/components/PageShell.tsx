import type { ReactNode } from 'react';
import Link from 'next/link';
import BookingModal from './BookingModal';
import Footer from './Footer';
import Nav from './Nav';

/**
 * Chrome shared by every non-home route.
 *
 * The home page deliberately does not use this: it is a single pinned canvas and
 * needs its own layout. Everything else is an ordinary document, and repeating
 * the masthead / hero / footer arrangement five times invites them to drift
 * apart.
 */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Nav />
      <main id="main">{children}</main>
      <Footer />
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
  return (
    <section
      id={id}
      className={`border-t border-marigold/20 py-16 sm:py-20 ${tinted ? 'bg-silk/40' : ''}`}
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        {heading ? (
          <h2 className="mt-3 max-w-2xl font-display text-[clamp(1.6rem,3.8vw,2.5rem)] leading-[1.1] font-semibold text-teal-deep">
            {heading}
          </h2>
        ) : null}
        {lede ? (
          <p className="mt-4 max-w-2xl text-[0.98rem] leading-relaxed text-ink-soft">{lede}</p>
        ) : null}
        <div className={eyebrow || heading || lede ? 'mt-10' : ''}>{children}</div>
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
