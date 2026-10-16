import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { Suspense } from 'react';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import Nav from '@/components/Nav';
import Words from '@/components/Words';
import BookingFlowFromUrl from '@/components/BookingFlowFromUrl';
import BookingFlow from '@/components/BookingFlow';
import FaqList from '@/components/FaqList';
import { bookGraph } from '@/lib/schema';
import { FAQS, SITE } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Book a session',
  description:
    'Tell us who the classes are for and where suits you, and we will suggest a batch. Children from age 3.5, adults, online classes, Scarborough, and new batches in residential communities.',
  alternates: { canonical: '/book' },
  openGraph: {
    title: `Book a session | ${SITE.name}`,
    url: `${SITE.url}/book`,
    type: 'website',
  },
};

/**
 * The admissions enquiry.
 *
 * Its own chrome rather than PageShell: no FloatingCta, because a bar offering
 * "Book a session" on the page where you are booking one is noise, and no
 * PageHero, because the flow should start above the fold on a phone.
 *
 * STATIC, WITH THE PREFILL READ IN THE BROWSER
 * --------------------------------------------
 * Buttons elsewhere pass what they know in the query string (?for=adult,
 * ?venue=adroit). Reading it through the page's `searchParams` prop would make
 * this route render on every request. Instead the page is prerendered, and the
 * query is read with useSearchParams inside a Suspense boundary, which is what
 * the Next 16 docs require for a static route (use-search-params.md,
 * "Prerendering"). The fallback is the same flow with nothing prefilled, so
 * the HTML is a working first step even before hydration.
 */
export default function BookPage() {
  return (
    <>
      <JsonLd data={bookGraph()} />
      <Nav />
      <main id="main" className="pt-[112px] pb-20 sm:pt-[128px]">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <header className="max-w-2xl" data-tx-static>
            <p className="eyebrow tx-ink-l w-fit" style={{ '--tx-base': '0.05s' } as CSSProperties}>
              Admissions
            </p>
            <h1
              className="tx-wl mt-3 font-display text-[clamp(1.9rem,4.6vw,3.1rem)] leading-[1.05] font-semibold tracking-[-0.02em] text-teal-deep"
              style={{ '--tx-base': '0.14s' } as CSSProperties}
            >
              <Words text="Book a session" />
            </h1>
            <p
              className="tx-sweep-l mt-4 max-w-measure text-[1.02rem] leading-relaxed text-ink-soft"
              style={{ '--tx-base': '0.5s' } as CSSProperties}
            >
              Tell us a little about who is learning and where suits you. We will find the right batch and
              reply on WhatsApp.
            </p>
          </header>

          {/* The form is left still: it is a task, and the Suspense boundary
              hydrates on its own schedule, so the text engine stays out of it. */}
          <div className="mt-10" data-tx-skip>
            <Suspense fallback={<BookingFlow />}>
              <BookingFlowFromUrl />
            </Suspense>
          </div>

          <section id="faq" aria-labelledby="faq-heading" className="mt-20 grid gap-8 lg:grid-cols-[19rem_minmax(0,1fr)] lg:gap-12">
            <div>
              <h2
                id="faq-heading"
                className="font-display text-[clamp(1.5rem,3.4vw,2.1rem)] leading-tight font-semibold text-teal-deep"
              >
                Questions parents ask
              </h2>
              <p className="mt-3 max-w-measure text-[0.98rem] leading-relaxed text-ink-soft">
                In the academy&rsquo;s own words. Anything else, ask us when we message you.
              </p>
            </div>
            <FaqList items={FAQS} />
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
