import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Video } from 'lucide-react';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import Nav from '@/components/Nav';
import BookButton from '@/components/BookButton';
import OnlinePlaceholder from '@/components/OnlinePlaceholder';
import { BRANCHES, ONLINE } from '@/lib/branches';
import { SITE } from '@/lib/site';
import {
  INDIVIDUAL_TEACHING,
  areasTaught,
  batchCount,
  individualStudentCount,
  offlineVenuesForCity,
  openBatches,
  venuesForCity,
} from '@/lib/classes';
import { locationPhotos } from '@/lib/locationPhotos';
import { homeGraph } from '@/lib/schema';
import { PAGE_SEO, pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata(PAGE_SEO.locations);

/** What a card on this page needs, whether it is a branch or the online class. */
type LocationCardData = {
  slug: string;
  eyebrow: string;
  title: string;
  badge?: string;
  intro: string;
  meta: string;
  /** null draws the placeholder, which only the online card ever needs. */
  image: { src: string; alt: string } | null;
};

export default function LocationsPage() {
  const open = openBatches().length;
  const chennaiAreas = areasTaught('chennai');

  // The online card shows the first photograph in public/img/locations/online/
  // and a drawn placeholder until there is one.
  const onlineCover = locationPhotos('online', `${ONLINE.title}, Shanti Kala Nikketan`)[0] ?? null;
  const onlineBatches = venuesForCity(ONLINE.slug).flatMap((v) => v.batches).length;
  const individualPhotos = locationPhotos('individual', 'A student in a one-to-one Bharatanatyam class');

  const cards: LocationCardData[] = [
    ...BRANCHES.map((branch) => {
      const venues = offlineVenuesForCity(branch.slug);
      return {
        slug: branch.slug,
        eyebrow: `${branch.region}, ${branch.country}`,
        title: branch.city,
        badge: branch.isPrimary ? 'Founding school' : undefined,
        intro: branch.intro,
        meta: `${venues.length} ${venues.length === 1 ? 'venue' : 'venues'}${branch.head ? ` · Led by ${branch.head}` : ''}`,
        image: { src: branch.image, alt: `Shanti Kala Nikketan in ${branch.city}` },
      };
    }),
    {
      slug: ONLINE.slug,
      eyebrow: ONLINE.eyebrow,
      title: ONLINE.title,
      intro: ONLINE.intro,
      meta: `${onlineBatches} weekly ${onlineBatches === 1 ? 'batch' : 'batches'}, open to everyone`,
      image: onlineCover,
    },
  ];

  return (
    <>
      <JsonLd data={homeGraph()} />
      <Nav />

      <main id="main">
        <section className="border-b border-marigold/20 pt-[140px] pb-16">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <p className="eyebrow">Locations</p>
            <h1 className="mt-5 max-w-3xl font-display text-[clamp(2rem,5.5vw,4rem)] leading-[1.02] font-semibold tracking-[-0.02em] text-teal-deep">
              Many rooms. One syllabus.
            </h1>
            <p className="mt-6 max-w-measure text-[1.02rem] leading-relaxed text-ink-soft">
              The {SITE.style} is taught identically wherever we teach, in the {SITE.method}{' '}
              manner — {batchCount()} weekly batches across {chennaiAreas.length} Chennai
              neighbourhoods, an online batch, and our Canadian branch.
            </p>

            {open > 0 ? (
              <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-kumkum/30 bg-kumkum/5 px-4 py-2 font-sans text-sm font-medium text-kumkum">
                <span aria-hidden>●</span>
                {open} batches taking admissions now
              </p>
            ) : null}
          </div>
        </section>

        {/* Branch cards */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {cards.map((card) => (
                <li key={card.slug}>
                  <Link
                    href={`/locations/${card.slug}`}
                    className="glass grain group block h-full overflow-clip rounded-[1.75rem]"
                  >
                    <div className="curtain relative aspect-[16/9] overflow-hidden">
                      {card.image ? (
                        <Image
                          src={card.image.src}
                          alt={card.image.alt}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1152px) 50vw, 360px"
                          className="object-cover"
                        />
                      ) : (
                        <OnlinePlaceholder />
                      )}
                    </div>
                    <div className="px-6 py-6 sm:px-7">
                      <p className="flex items-center gap-1.5 font-sans text-micro tracking-[0.16em] text-nila-700 uppercase">
                        {card.slug === ONLINE.slug ? <Video className="size-3.5" aria-hidden /> : <MapPin className="size-3.5" aria-hidden />}
                        {card.eyebrow}
                      </p>
                      <h2 className="mt-2.5 font-display text-[1.5rem] font-semibold text-teal-deep transition-colors duration-200 group-hover:text-kumkum">
                        {card.title}
                        {card.badge ? (
                          <span className="ml-2.5 align-middle font-sans text-micro tracking-[0.14em] text-kumkum uppercase">
                            {card.badge}
                          </span>
                        ) : null}
                      </h2>
                      <p className="max-w-measure mt-3 text-[0.93rem] leading-relaxed text-ink-soft">
                        {card.intro}
                      </p>
                      <p className="mt-4 font-sans text-xs text-ink-faint">{card.meta}</p>
                      <span className="mt-5 inline-flex items-center gap-1.5 font-sans text-sm font-medium text-teal">
                        Batches and timings <span aria-hidden>→</span>
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* One-to-one teaching */}
        <section className="border-t border-marigold/20 bg-silk/40 py-16 sm:py-20">
          <div
            className={`mx-auto max-w-6xl px-5 sm:px-8 ${
              individualPhotos.length > 0 ? 'grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16' : ''
            }`}
          >
            <div>
              <p className="eyebrow">One to one</p>
              <h2 className="mt-3 max-w-2xl font-display text-[clamp(1.6rem,3.6vw,2.4rem)] leading-[1.12] font-semibold text-teal-deep">
                {individualStudentCount()} students taught individually
              </h2>
              <p className="mt-4 max-w-measure text-[0.95rem] leading-relaxed text-ink-soft">
                Alongside the group batches, the Gurukulam runs one to one — in person in
                Chennai, and online wherever a student happens to be.
              </p>

              <dl className={`mt-10 grid grid-cols-2 gap-6 ${individualPhotos.length > 0 ? '' : 'sm:grid-cols-4'}`}>
                {INDIVIDUAL_TEACHING.map((entry) => (
                  <div key={entry.place} className="border-t border-marigold/30 pt-4">
                    <dt className="font-display text-[1.05rem] font-semibold text-teal-deep">
                      {entry.place}
                    </dt>
                    <dd className="mt-1 font-sans text-sm text-ink-soft">
                      {entry.students} {entry.students === 1 ? 'student' : 'students'}
                      {entry.mode ? (
                        <span className="block text-xs text-ink-faint capitalize">{entry.mode}</span>
                      ) : null}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* The portraits stand to the side, the second dropped a little so the
                pair reads as two pictures rather than one block. Absent entirely
                when public/img/locations/individual/ is empty. */}
            {individualPhotos.length > 0 ? (
              <ul aria-label="Students in one-to-one classes" className="grid grid-cols-2 gap-4">
                {individualPhotos.slice(0, 2).map((photo, i) => (
                  <li
                    key={photo.src}
                    className={`relative aspect-[2/3] overflow-hidden rounded-[1.25rem] bg-silk ${i === 1 ? 'mt-10' : ''}`}
                  >
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      fill
                      sizes="(max-width: 1024px) 45vw, 260px"
                      className="object-cover"
                    />
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 text-center sm:px-8">
            <h2 className="font-display text-[clamp(1.6rem,3.6vw,2.4rem)] leading-[1.12] font-semibold text-teal-deep">
              Not sure which batch fits?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[0.95rem] leading-relaxed text-ink-soft">
              Tell us your child&rsquo;s age and where you are, and we will suggest the
              nearest batch at the right level.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              <BookButton source="locations-index" />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
