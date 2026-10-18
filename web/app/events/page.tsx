import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import InstagramRail from '@/components/InstagramRail';
import BlankGlobe from '@/components/gallery/BlankGlobe';
import { PageShell, PageHero, QuietLink, Section } from '@/components/PageShell';
import VideoFacade from '@/components/VideoFacade';
import {
  EVENTS_META,
  UDAAN,
  sectionMeta,
  videosBySection,
} from '@/lib/events';
import { ARANGETRAM } from '@/lib/curriculum';
import { fetchInstagramPosts } from '@/lib/instagram';
import { SITE } from '@/lib/site';
import { ALL_ITEMS } from '@/lib/gallery';
import { eventsGraph } from '@/lib/schema';

/**
 * Events & gallery — the merge of the old site's /events and /photos pages, and
 * of this site's former /performances route.
 *
 * WHY ONE PAGE AND NOT THREE
 * --------------------------
 * /performances had drifted into saying the same things as this: the Udaan hero
 * copy, a photograph grid, the Arangetram block. Two near-identical pages compete
 * with each other in search rather than adding up, so it folded in and
 * next.config.ts 308s the old path. /photos on the old Wix site is redirected here
 * too — its albums were served from Wix's pro-gallery API and were never
 * captured, so there is nothing to preserve but the URL.
 *
 * STRUCTURE
 * ---------
 * The section order is the old /events page's own, reconstructed from DOM order
 * in _research/pages/events.html: Udaan, Arangetrams, Performances (Group then
 * Solo), Outreach. The gallery is new. It was first placed between the manifesto
 * and the recordings; it sits after them now, with a blank globe as its teaser,
 * and the Instagram rail follows. The page ends there, without a closing call to
 * action: the masthead already carries one.
 */

export const metadata: Metadata = {
  title: EVENTS_META.title,
  description: EVENTS_META.description,
  alternates: { canonical: '/events' },
  keywords: [
    'Udaan Shanti Kala Nikketan',
    'Bharatanatyam Arangetram Chennai',
    'Bharatanatyam performance Chennai',
    'Nada Sudha festival',
    'Bharatanatyam Scarborough Toronto',
    'dance academy gallery Chennai',
  ],
  openGraph: {
    title: `${EVENTS_META.title} | ${SITE.name}`,
    description: EVENTS_META.description,
    url: EVENTS_META.url,
    type: 'website',
    images: [
      { url: EVENTS_META.image, width: 867, height: 1300, alt: 'Udaan 2025' },
    ],
  },
};

export default async function EventsPage() {
  /**
   * Fetched on the server so the access token never reaches the browser, and
   * cached for an hour by lib/instagram.ts — see REVALIDATE_SECONDS there. Returns
   * an empty list when unconfigured or when the token has lapsed, which the rail
   * renders as a follow prompt rather than a broken row, so this never fails the
   * page.
   */
  const instagramPosts = await fetchInstagramPosts();

  return (
    <PageShell>
      <JsonLd data={eventsGraph()} />

      <PageHero
        eyebrow="Events"
        title="Every dancer gets a"
        accent="stage"
        lede="Udaan — flying high to reach our goals — is our own showcase, created so that every dancer has a platform irrespective of their stage of learning. Alongside it: Arangetrams, temple festivals, and outreach programmes."
      />

      {/* --- Udaan, in the academy's own words ---------------------------- */}
      <Section id="udaan" eyebrow={UDAAN.eyebrow} heading={UDAAN.heading} tinted>
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-2xl">
            {UDAAN.body.map((paragraph) => (
              <p
                key={paragraph.slice(0, 32)}
                className="mt-4 text-[1rem] leading-relaxed text-ink-soft first:mt-0"
              >
                {paragraph}
              </p>
            ))}
          </div>

          <div className="border-l border-marigold/25 pl-6">
            <p className="eyebrow">{UDAAN.theme.label}</p>
            {UDAAN.theme.body.map((paragraph) => (
              <p
                key={paragraph.slice(0, 32)}
                className="mt-3.5 text-[1rem] leading-relaxed text-teal-deep"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-7 sm:grid-cols-2">
          {videosBySection('udaan').map((video) => (
            <VideoFacade key={video.id} video={video} />
          ))}
        </div>
      </Section>

      {/* --- Arangetrams --------------------------------------------------
          One section. It used to be two: the videos under "The debut", and
          under them a second block (its own label, its own headline) saying
          the same thing about the programme. Now the words come first, then the
          recordings, then the way in. */}
      <Section
        id="arangetram"
        eyebrow={sectionMeta('arangetram').eyebrow}
        heading={sectionMeta('arangetram').heading}
        tinted
      >
        <div className="max-w-2xl">
          <p className="max-w-measure text-[1.05rem] leading-relaxed font-medium text-teal-deep">
            {ARANGETRAM.lead}
          </p>
          <p className="mt-4 max-w-measure text-[1rem] leading-relaxed text-ink-soft">
            {ARANGETRAM.description}
          </p>
        </div>

        <div className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {videosBySection('arangetram').map((video) => (
            <VideoFacade key={video.id} video={video} />
          ))}
        </div>

        <div className="mt-10">
          <QuietLink href="/curriculum#arangetram">How students get there</QuietLink>
        </div>
      </Section>

      {/* --- Performances ------------------------------------------------- */}
      <Section
        id="group"
        eyebrow={sectionMeta('group').eyebrow}
        heading="Ensemble"
        lede={sectionMeta('group').lede}
      >
        <h3 className="font-display text-[1.1rem] font-semibold text-teal-deep">Group</h3>
        <div className="mt-6 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {videosBySection('group').map((video) => (
            <VideoFacade key={video.id} video={video} />
          ))}
        </div>

        <h3
          id="solo"
          className="mt-14 scroll-mt-28 font-display text-[1.1rem] font-semibold text-teal-deep"
        >
          Solo - Beyond the Debut
        </h3>
        <div className="mt-6 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {videosBySection('solo').map((video) => (
            <VideoFacade key={video.id} video={video} />
          ))}
        </div>
      </Section>

      {/* --- Outreach ----------------------------------------------------- */}
      <Section
        id="outreach"
        eyebrow={sectionMeta('outreach').eyebrow}
        heading={sectionMeta('outreach').heading}
        lede={sectionMeta('outreach').lede}
        tinted
      >
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-1">
            {videosBySection('outreach').map((video) => (
              <VideoFacade key={video.id} video={video} />
            ))}
          </div>

          <div className="max-w-xl">
            <p className="max-w-measure text-[1rem] leading-relaxed text-ink-soft">
              Our Scarborough branch teaches at Morningside and Finch. Chennai and
              Scarborough are one academy, one syllabus, and — allowing for the
              nine and a half hours between them — one set of standards.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <QuietLink href="/locations/scarborough">The Scarborough branch</QuietLink>
            </div>
          </div>
        </div>
      </Section>

      {/* --- The gallery --------------------------------------------------
          The words on the left; on the right a blank globe, turning, as a
          teaser for the page it opens. It is not a picture of the gallery and
          does not pretend to be one (components/gallery/BlankGlobe.tsx). */}
      <section id="gallery" className="border-t border-marigold/20 py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,19rem)] lg:gap-20">
            <div>
              <p className="eyebrow">The gallery</p>
              <h2 className="mt-3 max-w-2xl font-display text-[clamp(1.6rem,3.8vw,2.5rem)] leading-[1.1] font-semibold text-teal-deep">
                Every class, every stage
              </h2>
              <p className="mt-4 max-w-measure text-[0.98rem] leading-relaxed text-ink-soft">
                {ALL_ITEMS.length} photographs and recordings, from every class and batch to Udaan, the
                Arangetrams and the festivals. Explore the globe, or find your child by venue and batch.
              </p>
              <div className="mt-8">
                <QuietLink href="/gallery">Open the gallery</QuietLink>
              </div>
            </div>

            <Link href="/gallery" tabIndex={-1} aria-hidden className="mx-auto block w-full max-w-[15rem] lg:max-w-none">
              <BlankGlobe />
            </Link>
          </div>
        </div>
      </section>

      {/* --- Instagram ---------------------------------------------------- */}
      <Section
        id="instagram"
        eyebrow="As it happens"
        heading="From the academy’s Instagram"
        lede="The gallery is the record. This is the week — rehearsals, costume days, and whatever happened last night."
        tinted
      >
        <InstagramRail posts={instagramPosts} />
      </Section>
    </PageShell>
  );
}
