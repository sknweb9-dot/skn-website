import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Mail, Phone, Video } from 'lucide-react';
import BookButton from '@/components/BookButton';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import LocationPhotos from '@/components/LocationPhotos';
import Nav from '@/components/Nav';
import VenueDirectory from '@/components/VenueDirectory';
import { venuesForCity } from '@/lib/classes';
import { locationPhotos } from '@/lib/locationPhotos';
import { onlineGraph } from '@/lib/schema';
import { ONLINE, SITE } from '@/lib/site';

/**
 * /locations/online. A static route, so it takes precedence over the dynamic
 * /locations/[city] and the branch pages are unaffected. It is not a branch: no
 * address, no map, no neighbourhoods, no "who teaches here" (see ONLINE in
 * lib/site.ts for why it is kept out of BRANCHES).
 */

const TITLE = 'Online Bharatanatyam Classes \u2014 Live Group Class';
const DESCRIPTION =
  'A live online Bharatanatyam group class, open to students anywhere: the Kalakshetra Bani syllabus of Shanti Kala Nikketan, taught in the Gurukulam manner over video. See the batch and book a session.';

const PHOTO_ALT = `${ONLINE.title}, Shanti Kala Nikketan`;

export async function generateMetadata(): Promise<Metadata> {
  // The first photograph in the folder is the card's picture on /locations, so
  // it is the one to share. Without one, the site's own image stands in.
  const cover = locationPhotos('online', PHOTO_ALT)[0]?.src ?? SITE.ogImage;
  return {
    title: TITLE,
    description: DESCRIPTION,
    keywords: [
      'online Bharatanatyam classes',
      'online classical dance classes',
      'Bharatanatyam classes online for kids',
      'live Bharatanatyam class',
      'learn Bharatanatyam online',
    ],
    alternates: { canonical: `/locations/${ONLINE.slug}` },
    openGraph: {
      type: 'website',
      title: TITLE,
      description: DESCRIPTION,
      url: `${SITE.url}/locations/${ONLINE.slug}`,
      siteName: SITE.name,
      images: [{ url: cover, width: 1200, height: 630, alt: `${SITE.name}, online classes` }],
    },
    twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: [cover] },
  };
}

export default function OnlinePage() {
  const batches = venuesForCity(ONLINE.slug).flatMap((v) => v.batches).length;

  // The first photograph is the card's; the page shows the others. With only
  // one in the folder, the section is not drawn.
  const photos = locationPhotos('online', PHOTO_ALT).slice(1);

  return (
    <>
      <JsonLd data={onlineGraph()} />
      <Nav />

      <main id="main">
        <section className="border-b border-marigold/20 pt-[140px] pb-14">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <Link
              href="/locations"
              className="inline-flex min-h-11 items-center gap-1.5 font-sans text-sm text-ink-faint transition-colors hover:text-kumkum"
            >
              <ArrowLeft className="size-3.5" aria-hidden /> All locations
            </Link>

            <p className="eyebrow mt-8 flex items-center gap-1.5">
              <Video className="size-3.5" aria-hidden />
              {ONLINE.eyebrow}
            </p>

            <h1 className="mt-4 max-w-3xl font-display text-[clamp(2rem,5.5vw,4rem)] leading-[1.02] font-semibold tracking-[-0.02em] text-teal-deep">
              Bharatanatyam, online
            </h1>

            <p className="mt-6 max-w-measure text-[1.02rem] leading-relaxed text-ink-soft">
              {ONLINE.intro}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <BookButton source="location-online-hero" region="online" />
            </div>
          </div>
        </section>

        {photos.length > 0 ? (
          <section className="border-b border-marigold/20 py-12 sm:py-14">
            <div className="mx-auto max-w-6xl px-5 sm:px-8">
              <LocationPhotos photos={photos} label="Photographs from the online class" />
            </div>
          </section>
        ) : null}

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <p className="eyebrow">Where and when</p>
            <h2 className="mt-3 max-w-2xl font-display text-[clamp(1.7rem,4vw,2.6rem)] leading-[1.1] font-semibold text-teal-deep">
              {batches} weekly {batches === 1 ? 'batch' : 'batches'}, from anywhere
            </h2>
            <p className="mt-4 max-w-measure text-[0.95rem] leading-relaxed text-ink-soft">
              Timings are in {ONLINE.timezoneName} ({ONLINE.timezone}).
            </p>
            <div className="mt-6">
              <VenueDirectory citySlug={ONLINE.slug} />
            </div>
          </div>
        </section>

        <section className="border-t border-marigold/20 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="glass grain rounded-[1.75rem] px-6 py-10 text-center sm:px-10">
              <h2 className="font-display text-[clamp(1.6rem,3.6vw,2.4rem)] leading-[1.12] font-semibold text-teal-deep">
                Join an online class
              </h2>

              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <BookButton source="location-online-footer" region="online" />
                <a
                  href={`mailto:${SITE.email}`}
                  className="inline-flex items-center gap-2 rounded-full border border-teal/25 px-5 py-3.5 font-sans text-sm font-medium text-teal transition-colors hover:border-teal/50 hover:bg-teal/5"
                >
                  <Mail className="size-4" aria-hidden /> {SITE.email}
                </a>
                <a
                  href={`tel:${SITE.phoneE164}`}
                  className="inline-flex items-center gap-2 rounded-full border border-teal/25 px-5 py-3.5 font-sans text-sm font-medium text-teal transition-colors hover:border-teal/50 hover:bg-teal/5"
                >
                  <Phone className="size-4" aria-hidden /> {SITE.phoneDisplay}
                </a>
              </div>

              <p className="mt-6 font-sans text-xs text-ink-faint">{SITE.signature}</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
