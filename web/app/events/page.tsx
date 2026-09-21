import type { Metadata } from 'next';
import Image from 'next/image';
import JsonLd from '@/components/JsonLd';
import EventGallery from '@/components/EventGallery';
import { PageHero, PageShell, QuietLink, Section } from '@/components/PageShell';
import TrialButton from '@/components/TrialButton';
import VideoFacade from '@/components/VideoFacade';
import {
  EVENTS_META,
  GLOBE_ITEMS,
  HAS_PLACEHOLDERS,
  PHOTO_COUNT,
  UDAAN,
  VIDEOS,
  sectionMeta,
  videosBySection,
} from '@/lib/events';
import { ARANGETRAM } from '@/lib/curriculum';
import { METRICS, SITE } from '@/lib/site';
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
 * Solo), Outreach. The gallery is new, and sits between the manifesto and the
 * recordings — it is the reason most people will come, and burying it under four
 * screens of copy would be perverse.
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

export default function EventsPage() {
  return (
    <PageShell>
      <JsonLd data={eventsGraph()} />

      <PageHero
        eyebrow="Events & gallery"
        title="Every dancer gets a"
        accent="stage"
        lede="Udaan — flying high to reach our goals — is our own showcase, created so that every dancer has a platform irrespective of their stage of learning. Alongside it: Arangetrams, temple festivals, Nada Sudha, and the Toronto temple circuit."
      >
        <div className="flex flex-wrap gap-3">
          <TrialButton source="events-hero">Schedule a trial session</TrialButton>
          <QuietLink href="/curriculum">The six levels</QuietLink>
        </div>
      </PageHero>

      {/* Prototype notice. Rendered wherever lib/events.ts is still padded with
          invented captions — including production builds of the prototype, which
          is the case that actually needs the warning. It disappears on its own
          the moment PROTOTYPE_FILL is deleted. */}
      {HAS_PLACEHOLDERS ? (
        <div className="border-b border-kumkum/25 bg-kumkum/5">
          <div className="mx-auto max-w-6xl px-5 py-3 sm:px-8">
            <p className="font-sans text-[0.76rem] leading-relaxed text-kumkum">
              <strong className="font-semibold">Prototype data.</strong> The
              photographs are all the academy&rsquo;s own, but {PHOTO_COUNT - 11} of
              the {PHOTO_COUNT} captions — album, title, date — are placeholders so
              the globe has enough plates to judge. They are excluded from the
              structured data and cannot reach production. See the placeholder
              policy at the top of <code>lib/events.ts</code>.
            </p>
          </div>
        </div>
      ) : null}

      {/* --- Where students have danced ---------------------------------- */}
      <Section
        eyebrow="Where our students have danced"
        heading="Beyond the classroom"
        lede="Students perform at Arangetrams, temple festivals and invited events — in Chennai, and on the Toronto temple circuit."
      >
        <dl className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {[
            { value: `${METRICS.stages}`, label: 'Stages performed' },
            { value: 'Udaan', label: 'Our own showcase' },
            { value: 'Nada Sudha', label: '27th annual festival' },
            { value: 'Mylapore', label: 'Bharatiya Vidya Bhavan' },
          ].map((stat) => (
            <div key={stat.label} className="border-t border-marigold/30 pt-4">
              <dt className="sr-only">{stat.label}</dt>
              <dd>
                <span className="foil block font-display text-[clamp(1.3rem,3vw,2rem)] leading-tight font-semibold">
                  {stat.value}
                </span>
                <span className="mt-1.5 block font-sans text-[0.68rem] tracking-[0.14em] text-ink-faint uppercase">
                  {stat.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </Section>

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
                className="mt-3.5 font-display text-[0.98rem] leading-relaxed text-teal-deep"
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

      {/* --- The gallery -------------------------------------------------- */}
      <Section
        eyebrow="The gallery"
        heading="Turn the sphere"
        lede={`${GLOBE_ITEMS.length} plates — photographs and recordings, every one the academy's own. Open it to turn the globe, or read the index below.`}
      >
        <EventGallery />
      </Section>

      {/* --- Arangetrams -------------------------------------------------- */}
      <Section
        id="arangetram"
        eyebrow={sectionMeta('arangetram').eyebrow}
        heading={sectionMeta('arangetram').heading}
        lede={sectionMeta('arangetram').lede}
        tinted
      >
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {videosBySection('arangetram').map((video) => (
            <VideoFacade key={video.id} video={video} />
          ))}
        </div>

        <div className="mt-14 max-w-2xl border-t border-marigold/20 pt-10">
          <p className="eyebrow">{ARANGETRAM.label}</p>
          <h3 className="mt-3 font-display text-[clamp(1.35rem,3vw,1.9rem)] leading-tight font-semibold text-teal-deep">
            The debut that everything points towards
          </h3>
          <p className="mt-4 font-display text-[1.05rem] leading-relaxed text-teal-deep">
            {ARANGETRAM.lead}
          </p>
          <p className="mt-4 text-[1rem] leading-relaxed text-ink-soft">
            {ARANGETRAM.description}
          </p>
          <div className="mt-7">
            <QuietLink href="/curriculum#arangetram">How students get there</QuietLink>
          </div>
        </div>
      </Section>

      {/* --- Performances ------------------------------------------------- */}
      <Section
        id="group"
        eyebrow={sectionMeta('group').eyebrow}
        heading="Performances"
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
          Solo
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
            <p className="text-[1rem] leading-relaxed text-ink-soft">
              Our Scarborough branch teaches at Morningside and Finch, and its
              students perform on the Toronto temple circuit. Chennai and
              Scarborough are one academy, one syllabus, and — allowing for the
              nine and a half hours between them — one set of standards.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <QuietLink href="/locations/scarborough">The Scarborough branch</QuietLink>
            </div>
          </div>
        </div>
      </Section>

      {/* --- Studio ------------------------------------------------------- */}
      <Section
        id="studio"
        eyebrow={sectionMeta('studio').eyebrow}
        heading={sectionMeta('studio').heading}
        lede={sectionMeta('studio').lede}
      >
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <figure className="arch relative aspect-[0.9] overflow-hidden bg-teal-deep">
            <Image
              src="/img/hero-gurukulam.jpg"
              alt="A Bharatanatyam class in progress at Shanti Kala Nikketan"
              width={2000}
              height={1335}
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="h-full w-full object-cover"
            />
          </figure>

          <div className="max-w-xl">
            <p className="text-[1rem] leading-relaxed text-ink-soft">
              Long before a stage, there is a room with a wooden floor and a
              teacher counting aloud. That is the part worth seeing, and it is the
              part a trial session shows you.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <TrialButton source="events-studio">Schedule a trial session</TrialButton>
              <QuietLink href="/locations">Batches and timings</QuietLink>
            </div>
          </div>
        </div>
      </Section>

      {/* --- Close -------------------------------------------------------- */}
      <Section tinted>
        <div className="max-w-2xl">
          <h2 className="font-display text-[clamp(1.5rem,3.4vw,2.2rem)] leading-[1.12] font-semibold text-teal-deep">
            {VIDEOS.length} recordings, and the room they came from
          </h2>
          <p className="mt-4 text-[0.98rem] leading-relaxed text-ink-soft">
            Everything on this page happened on a stage our students stood on.
            Come and watch the class that gets them there.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <TrialButton source="events-footer">Schedule a trial session</TrialButton>
            <QuietLink href="/lineage">Our lineage</QuietLink>
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
