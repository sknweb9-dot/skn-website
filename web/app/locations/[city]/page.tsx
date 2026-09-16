import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Mail, MapPin, Navigation, Phone } from 'lucide-react';
import BookingModal from '@/components/BookingModal';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import Nav from '@/components/Nav';
import TrialButton from '@/components/TrialButton';
import VenueDirectory from '@/components/VenueDirectory';
import { locationFaqs, locationGraph } from '@/lib/schema';
import { BRANCHES, FACULTY, FOUNDERS, SITE, branchBySlug, yearsOfLineage } from '@/lib/site';
import { TEACHING_PROGRAMMES } from '@/lib/curriculum';
import { areasTaught, offlineVenuesForCity, venuesForCity } from '@/lib/classes';

type Params = { city: string };

export function generateStaticParams(): Params[] {
  return BRANCHES.map((branch) => ({ city: branch.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { city } = await params;
  const branch = branchBySlug(city);
  if (!branch) return {};

  const areas = areasTaught(branch.slug);
  const venueCount = offlineVenuesForCity(branch.slug).length;

  // The root layout appends "| Shanti Kala Nikketan" via its title template,
  // so the site name must not be repeated here.
  const title = `Bharatanatyam Dance Academy in ${branch.city}`;
  const description =
    areas.length > 1
      ? `Kalakshetra-style Bharatanatyam classes at ${venueCount} venues across ${branch.city} — ${areas.join(', ')}. An introductory programme from age 3.5, six graded levels to Arangetram, and adults batches. Book a trial session.`
      : `Kalakshetra-style Bharatanatyam classes in ${branch.city}${
          branch.head ? `, led by ${branch.head}` : ''
        }. Group, individual and adults batches from age 3.5 to Arangetram. Book a trial session.`;

  return {
    title,
    description,
    keywords: [
      `dance academy in ${branch.city}`,
      `classical dance classes in ${branch.city}`,
      `Bharatanatyam classes in ${branch.city}`,
      `Bharatanatyam academy ${branch.locality ?? branch.city}`,
      `Indian classical dance ${branch.city}`,
      `Bharatanatyam for kids ${branch.city}`,
      `Bharatanatyam for adults ${branch.city}`,
      ...areas.map((area) => `Bharatanatyam classes ${area}`),
      ...branch.areaServed.map((area) => `Bharatanatyam classes ${area}`),
    ],
    alternates: { canonical: `/locations/${branch.slug}` },
    openGraph: {
      type: 'website',
      title,
      description,
      url: `${SITE.url}/locations/${branch.slug}`,
      siteName: SITE.name,
      locale: branch.countryCode === 'IN' ? 'en_IN' : 'en_CA',
      images: [
        { url: branch.image, width: 1200, height: 630, alt: `${SITE.name} in ${branch.city}` },
      ],
    },
    twitter: { card: 'summary_large_image', title, description, images: [branch.image] },
    other: {
      'geo.region': `${branch.countryCode}-${branch.regionCode}`,
      'geo.placename': `${branch.locality ?? branch.city}, ${branch.city}`,
      ...(branch.geo
        ? {
            'geo.position': `${branch.geo.lat};${branch.geo.lng}`,
            ICBM: `${branch.geo.lat}, ${branch.geo.lng}`,
          }
        : {}),
    },
  };
}

export default async function LocationPage({ params }: { params: Promise<Params> }) {
  const { city } = await params;
  const branch = branchBySlug(city);
  if (!branch) notFound();

  const faqs = locationFaqs(branch);
  const venues = venuesForCity(branch.slug);
  const areas = areasTaught(branch.slug);

  // Match on the named head of the branch rather than on role text, so the
  // founding school resolves to its Director (who sits in FOUNDERS).
  const localFaculty = [...FOUNDERS, ...FACULTY].filter(
    (person) => branch.head && branch.head.includes(person.name),
  );

  const mapsQuery = encodeURIComponent(
    branch.streetAddress
      ? `${branch.streetAddress}, ${branch.city} ${branch.postalCode ?? ''}`
      : `${SITE.name} ${branch.locality ?? ''} ${branch.city}`,
  );

  return (
    <>
      <JsonLd data={locationGraph(branch)} />
      <Nav />

      <main id="main">
        {/* Hero */}
        <section className="border-b border-marigold/20 pt-[140px] pb-14">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <Link
              href="/locations"
              className="inline-flex items-center gap-1.5 font-sans text-xs tracking-[0.14em] text-ink-faint uppercase transition-colors hover:text-kumkum"
            >
              <ArrowLeft className="size-3.5" aria-hidden /> All locations
            </Link>

            <p className="eyebrow mt-8 flex items-center gap-1.5">
              <MapPin className="size-3.5" aria-hidden />
              {branch.region}, {branch.country}
            </p>

            <h1 className="mt-4 max-w-3xl font-display text-[clamp(2rem,5.5vw,4rem)] leading-[1.02] font-semibold tracking-[-0.02em] text-teal-deep">
              Bharatanatyam in <span className="foil">{branch.city}</span>
            </h1>

            <p className="mt-6 max-w-2xl text-[1.02rem] leading-relaxed text-ink-soft">
              {branch.intro}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <TrialButton source={`location-${branch.slug}`}>
                Schedule a trial session
              </TrialButton>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-teal/25 px-5 py-3.5 font-sans text-sm font-medium text-teal transition-colors hover:border-teal/50 hover:bg-teal/5"
              >
                <Navigation className="size-4" aria-hidden /> Directions
              </a>
            </div>
          </div>
        </section>

        {/* Venues and batches */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <p className="eyebrow">Where and when</p>
            <h2 className="mt-3 max-w-2xl font-display text-[clamp(1.7rem,4vw,2.6rem)] leading-[1.1] font-semibold text-teal-deep">
              {offlineVenuesForCity(branch.slug).length}{' '}
              {offlineVenuesForCity(branch.slug).length === 1 ? 'venue' : 'venues'}
              {venues.length > offlineVenuesForCity(branch.slug).length ? ', plus online' : ''}
            </h2>
            <div className="mt-6">
              <VenueDirectory citySlug={branch.slug} />
            </div>
          </div>
        </section>

        {/* Neighbourhoods */}
        {branch.areaServed.length > 0 ? (
          <section className="border-t border-marigold/20 bg-silk/40 py-16 sm:py-20">
            <div className="mx-auto max-w-6xl px-5 sm:px-8">
              <p className="eyebrow">Who travels to us</p>
              <h2 className="mt-3 max-w-2xl font-display text-[clamp(1.6rem,3.6vw,2.3rem)] leading-[1.12] font-semibold text-teal-deep">
                Families from across {branch.city}
              </h2>
              {areas.length > 0 ? (
                <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-ink-soft">
                  We hold classes in {areas.join(', ')}. Students also travel from the
                  neighbourhoods below — these are catchment areas, not separate venues.
                </p>
              ) : null}
              <ul className="mt-8 flex flex-wrap gap-2">
                {branch.areaServed.map((area) => (
                  <li
                    key={area}
                    className={`rounded-full border px-3.5 py-1.5 font-sans text-[0.8rem] ${
                      areas.includes(area)
                        ? 'border-kumkum/30 bg-kumkum/5 font-medium text-kumkum'
                        : 'border-marigold/30 bg-white/50 text-ink-soft'
                    }`}
                  >
                    {area}
                    {areas.includes(area) ? (
                      <span className="ml-1.5 text-[0.65rem] tracking-[0.1em] uppercase">
                        venue
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>

              {branch.landmarks.length > 0 ? (
                <div className="mt-10">
                  <h3 className="eyebrow">Orient by</h3>
                  <ul className="mt-3 space-y-1.5">
                    {branch.landmarks.map((landmark) => (
                      <li key={landmark} className="text-[0.92rem] text-ink-soft">
                        {landmark}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* Who teaches here */}
        {localFaculty.length > 0 ? (
          <section className="py-16 sm:py-20">
            <div className="mx-auto max-w-6xl px-5 sm:px-8">
              <p className="eyebrow">Who teaches here</p>
              <ul className="mt-8 grid gap-6 lg:grid-cols-2">
                {localFaculty.map((person) => (
                  <li key={person.name} className="glass grain rounded-[1.5rem] p-6 sm:p-7">
                    <div className="flex items-start gap-5">
                      <Image
                        src={person.image}
                        alt={person.name}
                        width={112}
                        height={112}
                        sizes="112px"
                        className="size-24 shrink-0 rounded-full object-cover sm:size-28"
                      />
                      <div className="min-w-0">
                        <h3 className="font-display text-[1.2rem] font-semibold text-teal-deep">
                          {person.name}
                        </h3>
                        {person.role ? (
                          <p className="mt-0.5 font-sans text-[0.7rem] tracking-[0.14em] text-marigold-deep uppercase">
                            {person.role}
                          </p>
                        ) : null}
                        <p className="mt-3 text-[0.9rem] leading-relaxed text-ink-soft">
                          {person.bio}
                        </p>
                      </div>
                    </div>
                    {person.credentials?.length ? (
                      <ul className="mt-5 space-y-1.5 border-t border-marigold/20 pt-4">
                        {person.credentials.map((c) => (
                          <li key={c} className="font-sans text-xs text-ink-faint">
                            {c}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        {/* Progression recap — keeps every location page substantive rather than
            a thin swap of the city name. */}
        <section className="border-t border-marigold/20 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <p className="eyebrow">The progression</p>
            <h2 className="mt-3 max-w-2xl font-display text-[clamp(1.6rem,3.6vw,2.3rem)] leading-[1.12] font-semibold text-teal-deep">
              From first shloka to Arangetram, in {branch.city}
            </h2>
            <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {TEACHING_PROGRAMMES.map((programme, i) => (
                <li
                  key={programme.id}
                  className="rounded-[1.25rem] border border-marigold/25 bg-white/55 p-5"
                >
                  <p className="font-display text-[0.8rem] tracking-[0.12em] text-marigold-deep">
                    {String(i).padStart(2, '0')}
                  </p>
                  <h3 className="mt-2.5 font-display text-[1.02rem] leading-snug font-semibold text-teal-deep">
                    {programme.label}
                    <span className="block font-sans text-[0.7rem] font-normal tracking-[0.1em] text-ink-faint uppercase">
                      {programme.name}
                    </span>
                  </h3>
                  {programme.ages ? (
                    <p className="mt-2 font-sans text-[0.72rem] text-kumkum">{programme.ages}</p>
                  ) : null}
                  <p className="mt-3 text-[0.85rem] leading-relaxed text-ink-soft">
                    {programme.description}
                  </p>
                </li>
              ))}
            </ol>
            <div className="mt-8">
              <Link
                href="/curriculum"
                className="inline-flex items-center gap-1.5 rounded-full border border-teal/25 px-5 py-3 text-sm font-medium text-teal transition-colors hover:border-teal/50 hover:bg-teal/5"
              >
                The full curriculum <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Local FAQ */}
        {faqs.length > 0 ? (
          <section className="border-t border-marigold/20 bg-silk/40 py-16 sm:py-20">
            <div className="mx-auto max-w-6xl px-5 sm:px-8">
              <p className="eyebrow">{branch.city} · Questions</p>
              <dl className="mt-8 divide-y divide-marigold/20 border-t border-marigold/20">
                {faqs.map((faq) => (
                  <div key={faq.q} className="py-6">
                    <dt className="font-display text-[1.08rem] leading-snug font-semibold text-teal-deep">
                      {faq.q}
                    </dt>
                    <dd className="mt-2.5 max-w-3xl text-[0.93rem] leading-relaxed text-ink-soft">
                      {faq.a}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        ) : null}

        {/* Contact */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <div className="glass grain rounded-[1.75rem] px-6 py-10 text-center sm:px-10">
              <h2 className="font-display text-[clamp(1.6rem,3.6vw,2.4rem)] leading-[1.12] font-semibold text-teal-deep">
                Visit us in {branch.city}
              </h2>
              {branch.streetAddress ? (
                <p className="mx-auto mt-4 max-w-md text-[0.95rem] leading-relaxed text-ink-soft">
                  {branch.streetAddress}
                  {branch.postalCode ? `, ${branch.postalCode}` : ''}
                </p>
              ) : null}

              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <TrialButton source={`location-${branch.slug}-footer`}>
                  Schedule a trial session
                </TrialButton>
                <a
                  href={`mailto:${SITE.email}`}
                  className="inline-flex items-center gap-2 rounded-full border border-teal/25 px-5 py-3.5 font-sans text-sm font-medium text-teal transition-colors hover:border-teal/50 hover:bg-teal/5"
                >
                  <Mail className="size-4" aria-hidden /> {SITE.email}
                </a>
                {branch.isPrimary ? (
                  <a
                    href={`tel:${SITE.phoneE164}`}
                    className="inline-flex items-center gap-2 rounded-full border border-teal/25 px-5 py-3.5 font-sans text-sm font-medium text-teal transition-colors hover:border-teal/50 hover:bg-teal/5"
                  >
                    <Phone className="size-4" aria-hidden /> {SITE.phoneDisplay}
                  </a>
                ) : null}
              </div>

              <p className="mt-6 font-sans text-xs text-ink-faint">
                {yearsOfLineage()} years of unbroken teaching · {SITE.style}
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <BookingModal />
    </>
  );
}
