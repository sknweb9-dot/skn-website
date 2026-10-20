import type { Metadata } from 'next';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import JsonLd from '@/components/JsonLd';
import InstagramRail from '@/components/InstagramRail';
import BlankGlobe from '@/components/gallery/BlankGlobe';
import { PageShell, PageHero, QuietLink, Section } from '@/components/PageShell';
import VideoFacade from '@/components/VideoFacade';
import {
  ARANGETRAMS,
  EVENTS_INTRO,
  OUTREACH,
  UDAAN,
  sectionMeta,
  videosBySection,
} from '@/lib/events';
import { fetchInstagramPosts } from '@/lib/instagram';
import { ALL_ITEMS } from '@/lib/gallery';
import { eventsGraph } from '@/lib/schema';
import { PAGE_SEO, pageMetadata } from '@/lib/seo';

/**
 * Events & gallery. Each section is a micro heading (the eyebrow) over a heading,
 * as the academy wrote them: the small blue line is the subtitle, the section's
 * name is the heading. In order: Events (the hero), Udaan, Arangetrams (with
 * Solo, "Beyond the Debut", as a sub-heading under it), Ensemble, Outreach. The
 * gallery follows, with a blank globe as its teaser, then the Instagram rail; the
 * page ends there without a closing call to action, since the masthead already
 * carries one.
 *
 * /performances and the old /photos redirect here (next.config.ts).
 */

export const metadata: Metadata = pageMetadata(PAGE_SEO.events);

export default async function EventsPage() {
  /**
   * Fetched on the server so the access token never reaches the browser, and
   * cached for an hour by lib/instagram.ts — see REVALIDATE_SECONDS there. Returns
   * an empty list when unconfigured or when the token has lapsed, which the rail
   * renders as a follow prompt rather than a broken row, so this never fails the
   * page.
   */
  const instagramPosts = await fetchInstagramPosts();

  const solo = sectionMeta('solo');
  const ensemble = sectionMeta('group');
  const outreach = sectionMeta('outreach');

  return (
    <PageShell>
      <JsonLd data={eventsGraph()} />

      {/* The first paragraph is the hero's lede; the other two follow it. */}
      <PageHero eyebrow={EVENTS_INTRO.eyebrow} title={EVENTS_INTRO.heading} lede={EVENTS_INTRO.body[0]}>
        <div className="max-w-measure space-y-4 text-[1.02rem] leading-relaxed text-ink-soft">
          <p>{EVENTS_INTRO.body[1]}</p>
          <p>{EVENTS_INTRO.body[2]}</p>
        </div>
      </PageHero>

      {/* --- Udaan -------------------------------------------------------- */}
      <Section id="udaan" eyebrow={UDAAN.eyebrow} heading={UDAAN.heading} tinted>
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-2xl">
            <p className="text-[1rem] leading-relaxed text-ink-soft">{UDAAN.body[0]}</p>
          </div>

          <div className="border-l border-marigold/25 pl-6">
            <p className="eyebrow">{UDAAN.why}</p>
            <p className="mt-3.5 text-[1rem] leading-relaxed text-teal-deep">{UDAAN.body[1]}</p>
            <p className="mt-3.5 text-[1rem] leading-relaxed text-teal-deep">{UDAAN.body[2]}</p>
          </div>
        </div>

        <div className="mt-12 grid gap-7 sm:grid-cols-2">
          {videosBySection('udaan').map((video) => (
            <VideoFacade key={video.id} video={video} />
          ))}
        </div>
      </Section>

      {/* --- Arangetrams ----------------------------------------------------
          The words, then the videos, then the way in. */}
      <Section
        id="arangetram"
        eyebrow={sectionMeta('arangetram').eyebrow}
        heading={sectionMeta('arangetram').heading}
      >
        <div className="max-w-2xl">
          <p className="max-w-measure text-[1.05rem] leading-relaxed font-medium text-teal-deep">
            {ARANGETRAMS.body[0]}
          </p>
          <p className="mt-4 max-w-measure text-[1rem] leading-relaxed text-ink-soft">{ARANGETRAMS.body[1]}</p>
          <p className="mt-4 max-w-measure text-[1rem] leading-relaxed text-ink-soft">{ARANGETRAMS.body[2]}</p>
        </div>

        <div className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {videosBySection('arangetram').map((video) => (
            <VideoFacade key={video.id} video={video} />
          ))}
        </div>

        <div className="mt-10">
          <QuietLink href="/curriculum#arangetram">How students get there</QuietLink>
        </div>

        {/* Solo is not a section of its own: it is what comes after the debut,
            so it sits under it, as a sub-heading, with its one video lined up
            under the first of the Arangetram cards. */}
        <div id="solo" className="mt-16 scroll-mt-28 border-t border-marigold/20 pt-12">
          <p className="eyebrow">{solo.eyebrow}</p>
          <h3 className="mt-3 font-display text-[1.5rem] leading-[1.1] font-semibold text-teal-deep">
            {solo.heading}
          </h3>
          <div className="mt-8 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {videosBySection('solo').map((video) => (
              <VideoFacade key={video.id} video={video} />
            ))}
            <p className="max-w-measure text-[1.05rem] leading-relaxed text-teal-deep sm:col-span-1 lg:col-span-2">
              {solo.lede}
            </p>
          </div>
        </div>
      </Section>

      {/* --- Ensemble ----------------------------------------------------- */}
      <Section id="group" eyebrow={ensemble.eyebrow} heading={ensemble.heading} lede={ensemble.lede} tinted>
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {videosBySection('group').map((video) => (
            <VideoFacade key={video.id} video={video} />
          ))}
        </div>
      </Section>

      {/* --- Outreach: a few, not all ------------------------------------- */}
      <Section id="outreach" eyebrow={outreach.eyebrow} heading={outreach.heading} lede={outreach.lede}>
        <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {videosBySection('outreach').map((video) => (
            <VideoFacade key={video.id} video={video} />
          ))}
        </div>

        <div className="mt-12 max-w-xl border-t border-marigold/20 pt-8">
          <p className="max-w-measure text-[1rem] leading-relaxed text-ink-soft">{OUTREACH.body}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href={OUTREACH.playlist}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 rounded-full border border-teal/25 px-5 py-3 font-sans text-sm font-medium text-teal transition-colors hover:border-teal/50 hover:bg-teal/5"
            >
              {OUTREACH.playlistLabel}
              <ExternalLink aria-hidden className="h-3.5 w-3.5" />
            </a>
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
                {ALL_ITEMS.length} photographs and videos, from every class and batch to Udaan, the
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
