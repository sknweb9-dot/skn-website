import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import BookingModal from '@/components/BookingModal';
import Footer from '@/components/Footer';
import JsonLd from '@/components/JsonLd';
import Nav from '@/components/Nav';
import TrialButton from '@/components/TrialButton';
import { BRANCHES, SITE } from '@/lib/site';
import {
  INDIVIDUAL_TEACHING,
  areasTaught,
  batchCount,
  individualStudentCount,
  offlineVenuesForCity,
  openBatches,
} from '@/lib/classes';
import { homeGraph } from '@/lib/schema';

const TITLE = 'Our Locations — Bharatanatyam Classes in Chennai & Scarborough';
const DESCRIPTION =
  'Shanti Kala Nikketan teaches Kalakshetra-style Bharatanatyam at five venues across Chennai — Thiruvanmiyur, Sholinganallur and Medavakkam — plus an online batch and a branch at Morningside & Finch in Scarborough, Canada.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/locations' },
  openGraph: {
    title: `${TITLE} | ${SITE.name}`,
    description: DESCRIPTION,
    url: `${SITE.url}/locations`,
    type: 'website',
  },
};

export default function LocationsPage() {
  const open = openBatches().length;
  const chennaiAreas = areasTaught('chennai');

  return (
    <>
      <JsonLd data={homeGraph()} />
      <Nav />

      <main id="main">
        <section className="border-b border-marigold/20 pt-[140px] pb-16">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <p className="eyebrow">Locations</p>
            <h1 className="mt-5 max-w-3xl font-display text-[clamp(2rem,5.5vw,4rem)] leading-[1.02] font-semibold tracking-[-0.02em] text-teal-deep">
              Many rooms. <span className="foil">One syllabus.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-[1.02rem] leading-relaxed text-ink-soft">
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
            <ul className="grid gap-6 lg:grid-cols-2">
              {BRANCHES.map((branch) => {
                const venues = offlineVenuesForCity(branch.slug);
                return (
                  <li key={branch.slug}>
                    <Link
                      href={`/locations/${branch.slug}`}
                      className="glass grain group block overflow-hidden rounded-[1.75rem]"
                    >
                      <div className="relative aspect-[16/9] overflow-hidden">
                        <Image
                          src={branch.image}
                          alt={`Shanti Kala Nikketan in ${branch.city}`}
                          fill
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                        />
                      </div>
                      <div className="px-6 py-6 sm:px-7">
                        <p className="flex items-center gap-1.5 font-sans text-[0.68rem] tracking-[0.16em] text-marigold-deep uppercase">
                          <MapPin className="size-3.5" aria-hidden />
                          {branch.region}, {branch.country}
                        </p>
                        <h2 className="mt-2.5 font-display text-[1.5rem] font-semibold text-teal-deep">
                          {branch.city}
                          {branch.isPrimary ? (
                            <span className="ml-2.5 align-middle font-sans text-[0.6rem] tracking-[0.14em] text-kumkum uppercase">
                              Founding school
                            </span>
                          ) : null}
                        </h2>
                        <p className="mt-3 text-[0.93rem] leading-relaxed text-ink-soft">
                          {branch.intro}
                        </p>
                        <p className="mt-4 font-sans text-xs text-ink-faint">
                          {venues.length} {venues.length === 1 ? 'venue' : 'venues'}
                          {branch.head ? ` · Led by ${branch.head}` : ''}
                        </p>
                        <span className="mt-5 inline-flex items-center gap-1.5 font-sans text-sm font-medium text-teal">
                          Batches and timings <span aria-hidden>→</span>
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* One-to-one teaching */}
        <section className="border-t border-marigold/20 bg-silk/40 py-16 sm:py-20">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <p className="eyebrow">One to one</p>
            <h2 className="mt-3 max-w-2xl font-display text-[clamp(1.6rem,3.6vw,2.4rem)] leading-[1.12] font-semibold text-teal-deep">
              {individualStudentCount()} students taught individually
            </h2>
            <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-ink-soft">
              Alongside the group batches, the Gurukulam runs one to one — in person in
              Chennai, and online wherever a student happens to be.
            </p>

            <dl className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
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
              <TrialButton source="locations-index">Schedule a trial session</TrialButton>
              <Link
                href="/curriculum"
                className="inline-flex items-center gap-1.5 rounded-full border border-teal/25 px-5 py-3.5 text-sm font-medium text-teal transition-colors hover:border-teal/50 hover:bg-teal/5"
              >
                The six levels <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <BookingModal />
    </>
  );
}
