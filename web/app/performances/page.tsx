import type { Metadata } from 'next';
import Image from 'next/image';
import JsonLd from '@/components/JsonLd';
import { PageHero, PageShell, QuietLink, Section } from '@/components/PageShell';
import TrialButton from '@/components/TrialButton';
import { ARANGETRAM } from '@/lib/curriculum';
import { GALLERY, METRICS, SITE } from '@/lib/site';
import { homeGraph } from '@/lib/schema';

const TITLE = 'Performances, Udaan & Arangetram';
const DESCRIPTION =
  'Udaan — our own showcase, created so that every dancer has a stage irrespective of their stage of learning — alongside Arangetrams, temple festivals, and appearances at Nada Sudha and Bharatiya Vidya Bhavan.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/performances' },
  openGraph: {
    title: `${TITLE} | ${SITE.name}`,
    description: DESCRIPTION,
    url: `${SITE.url}/performances`,
    type: 'website',
    images: [{ url: '/img/event-udaan-2025.jpg', width: 867, height: 1300, alt: 'Udaan 2025' }],
  },
};

/**
 * Masonry column spans. `tall` items claim two rows, `wide` two columns, so the
 * grid reads as a hung wall rather than a uniform contact sheet.
 */
const SPAN: Record<string, string> = {
  tall: 'sm:row-span-2',
  wide: 'sm:col-span-2',
  square: '',
};

export default function PerformancesPage() {
  return (
    <PageShell>
      <JsonLd data={homeGraph()} />

      <PageHero
        eyebrow="On stage"
        title="Every dancer gets a"
        accent="stage"
        lede="Udaan — flying high to reach our goals — is our own showcase, created so that every dancer has a platform irrespective of their stage of learning. Editions have followed in 2023 and 2025."
      >
        <div className="flex flex-wrap gap-3">
          <TrialButton source="performances-hero">Schedule a trial session</TrialButton>
          <QuietLink href="/curriculum">The six levels</QuietLink>
        </div>
      </PageHero>

      {/* Where students perform */}
      <Section
        eyebrow="Where our students have danced"
        heading="Beyond the classroom"
        lede="Students perform at Arangetrams, temple festivals, and invited events — in Chennai and on the Toronto temple circuit."
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
                <span className="block font-display text-[clamp(1.3rem,3vw,2rem)] leading-tight font-semibold foil">
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

      {/* Gallery */}
      <Section
        eyebrow="The record"
        heading="Photographs from our own stages"
        lede="Every image here is the academy's own. No stock photography."
        tinted
      >
        <ul className="grid auto-rows-[minmax(0,auto)] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GALLERY.map((item, i) => (
            <li
              key={item.src}
              className={`group overflow-hidden rounded-[1.25rem] border border-marigold/25 bg-paper/60 ${SPAN[item.span] ?? ''}`}
            >
              <figure className="h-full">
                <div className="overflow-hidden">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    width={item.width}
                    height={item.height}
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="h-auto w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    loading={i < 3 ? 'eager' : 'lazy'}
                  />
                </div>
                <figcaption className="px-4 py-3 font-sans text-[0.78rem] text-ink-soft">
                  {item.caption}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </Section>

      {/* Arangetram */}
      <Section eyebrow={ARANGETRAM.label} heading="The debut that everything points towards">
        <div className="max-w-2xl">
          <p className="font-display text-[1.1rem] leading-relaxed text-teal-deep">
            {ARANGETRAM.lead}
          </p>
          <p className="mt-4 text-[1rem] leading-relaxed text-ink-soft">
            {ARANGETRAM.description}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <QuietLink href="/curriculum#arangetram">How students get there</QuietLink>
          </div>
        </div>
      </Section>

      <Section tinted>
        <div className="max-w-2xl">
          <h2 className="font-display text-[clamp(1.5rem,3.4vw,2.2rem)] leading-[1.12] font-semibold text-teal-deep">
            Come and watch a class first
          </h2>
          <p className="mt-4 text-[0.98rem] leading-relaxed text-ink-soft">
            Long before a stage, there is a room with a wooden floor and a teacher
            counting aloud. That is the part worth seeing.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <TrialButton source="performances-footer">Schedule a trial session</TrialButton>
            <QuietLink href="/locations">Batches and timings</QuietLink>
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
