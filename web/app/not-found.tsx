import type { Metadata } from 'next';
import BookButton from '@/components/BookButton';
import { PageHero, PageShell, QuietLink } from '@/components/PageShell';

/**
 * Next adds `noindex` to this page itself. The explicit robots entry replaces the
 * layout's `index, follow` (which would otherwise sit beside it and contradict
 * it), and the canonical is dropped: a missing page is not the home page.
 */
export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: true },
  alternates: { canonical: null },
};

export default function NotFound() {
  return (
    <PageShell>
      <PageHero
        eyebrow="Page not found"
        title="That page is not here."
        lede="The link may be old, or the page may have moved. These are the places most people are looking for."
      >
        <div className="flex flex-wrap gap-3">
          <QuietLink href="/">Home</QuietLink>
          <QuietLink href="/curriculum">Curriculum</QuietLink>
          <QuietLink href="/locations">Locations</QuietLink>
          <QuietLink href="/events">Events</QuietLink>
          <BookButton source="not-found" />
        </div>
      </PageHero>
    </PageShell>
  );
}
