import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import Footer from './Footer';
import Nav from './Nav';
import Words from './Words';

/** Where in the hero's sequence a piece starts: `--tx-base`, read by the tx-* classes. */
const at = (seconds: number) => ({ '--tx-base': `${seconds}s` }) as CSSProperties;

/**
 * Chrome shared by every non-home route.
 *
 * The home page deliberately does not use this: it is a single pinned canvas and
 * needs its own layout. Everything else is an ordinary document, and repeating
 * the masthead / hero / footer arrangement five times invites them to drift
 * apart.
 *
 * There is no floating booking bar. One was tried and removed as excessive: the
 * masthead returns on any upward scroll with `Book a session` in it, and the
 * phone number is in the footer and the menu.
 */
export function PageShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Nav />
      <main id="main">{children}</main>
      <Footer />
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
  /**
   * The second half of the headline, set in the same colour as the first.
   *
   * This used to be picked out in a marigold-to-kumkum gradient. That measured
   * 1.5-3.1:1 on cream, under the 3:1 large-text floor, and colouring one phrase
   * of every headline was template chrome rather than emphasis. It is kept as a
   * separate prop only so the page copy does not have to be re-joined.
   */
  accent?: string;
  lede?: string;
  children?: ReactNode;
}) {
  return (
    <section className="border-b border-marigold/20 pt-[140px] pb-14 sm:pb-16">
      <div className="mx-auto max-w-6xl px-5 sm:px-8" data-tx-static>
        {/* The one authored entrance on an inner route, played by CSS at first
            paint so none of it waits for the page to hydrate: the eyebrow is
            written in, the headline is lifted into place word by word, then the
            lede is swept in and the actions rise. Roughly a second and a half
            end to end; each piece is `backwards`-filled, so it holds its first
            frame through its delay and leaves no styles behind. Below the hero,
            text arrives as it is scrolled to (components/TextMotion.tsx). */}
        <p className="eyebrow tx-ink-l w-fit" style={at(0.05)}>
          {eyebrow}
        </p>
        <h1
          className="tx-wl mt-4 max-w-3xl font-display text-[clamp(2rem,5.5vw,4rem)] leading-[1.02] font-semibold tracking-[-0.02em] text-teal-deep"
          style={at(0.14)}
        >
          <Words text={accent ? `${title} ${accent}` : title} />
        </h1>
        {lede ? (
          <p className="tx-sweep-l mt-6 max-w-measure text-[1.02rem] leading-relaxed text-ink-soft" style={at(0.55)}>
            {lede}
          </p>
        ) : null}
        {children ? (
          <div className="tx-rise-l mt-8" style={at(0.8)}>
            {children}
          </div>
        ) : null}
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
          <div>
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            {heading ? (
              <h2 className="mt-3 max-w-2xl font-display text-[clamp(1.6rem,3.8vw,2.5rem)] leading-[1.1] font-semibold text-teal-deep">
                {heading}
              </h2>
            ) : null}
            {lede ? (
              <p className="mt-4 max-w-measure text-[0.98rem] leading-relaxed text-ink-soft">{lede}</p>
            ) : null}
          </div>
        ) : null}
        {/* Scroll entrance: text-only, by components/TextMotion.tsx.

            An earlier version faded and rose the whole section over a second as
            it entered view, and held it at opacity 0 until a scroll trigger
            fired, so find-in-page, anchor jumps and fast scrolls landed on
            blank space. This one lowers only text that is still below the fold,
            raises it from an IntersectionObserver backed by a sweep, and leaves
            the section's boxes, rules and pictures alone. */}
        <div className={hasHeader ? 'mt-10' : ''}>{children}</div>
      </div>
    </section>
  );
}

/** Pill link used for cross-navigation between the deeper routes. */
export function QuietLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1.5 rounded-full border border-teal/25 px-5 py-3 font-sans text-sm font-medium text-teal transition-colors hover:border-teal/50 hover:bg-teal/5"
    >
      {children}{' '}
      <span aria-hidden className="transition-transform duration-300 ease-[var(--ease-temple)] group-hover:translate-x-1">
        →
      </span>
    </Link>
  );
}
