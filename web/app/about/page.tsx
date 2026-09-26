import type { Metadata } from 'next';
import Image from 'next/image';
import JsonLd from '@/components/JsonLd';
import { PageHero, PageShell, Section } from '@/components/PageShell';
import { ABOUT, EMBLEM } from '@/lib/lineage';
import { METRICS, SITE, yearsOfLineage } from '@/lib/site';
import { batchCount, individualStudentCount } from '@/lib/classes';
import { homeGraph } from '@/lib/schema';

const TITLE = 'About the Academy';
const DESCRIPTION =
  'Founded on 18 April 2009, Shanti Kala Nikketan preserves and promotes Indian classical arts through the Gurukulam tradition and the Kalakshetra bani of Bharatanatyam — in Chennai and internationally.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/about' },
  openGraph: {
    title: `${TITLE} | ${SITE.name}`,
    description: DESCRIPTION,
    url: `${SITE.url}/about`,
    type: 'website',
  },
};

export default function AboutPage() {
  const years = yearsOfLineage();

  return (
    <PageShell>
      <JsonLd data={homeGraph()} />

      <PageHero
        eyebrow={ABOUT.eyebrow}
        title={ABOUT.heading}
        accent={ABOUT.subheading}
        lede={ABOUT.body[0]}
      />

      {/* The institution, in its own words */}
      <Section>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="max-w-2xl space-y-5">
            {ABOUT.body.slice(1).map((para) => (
              <p key={para.slice(0, 40)} className="max-w-measure text-[1rem] leading-relaxed text-ink-soft">
                {para}
              </p>
            ))}
          </div>

          <dl className="space-y-6 lg:border-l lg:border-marigold/25 lg:pl-8">
            {[
              { value: `${years}`, label: 'Years of unbroken teaching' },
              { value: `${batchCount()}`, label: 'Weekly batches' },
              { value: `${individualStudentCount()}`, label: 'Taught one to one' },
              { value: `${METRICS.stages}`, label: 'Stages performed' },
              { value: `${METRICS.countries}`, label: 'Countries with students' },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="block font-display text-[2rem] leading-none font-semibold text-teal-deep">
                    {stat.value}
                  </span>
                  <span className="mt-1.5 block font-sans text-micro tracking-[0.16em] text-ink-faint uppercase">
                    {stat.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </Section>

      {/* Emblem */}
      <Section eyebrow={EMBLEM.eyebrow} heading={EMBLEM.heading} lede={EMBLEM.lead} tinted>
        <div className="grid gap-12 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-16">
          <div className="mx-auto w-56 shrink-0 sm:w-64 lg:mx-0 lg:w-full">
            <Image
              src="/img/logo-emblem.png"
              alt="The emblem of Shanti Kala Nikketan — Lord Ganesha within three interwoven circles and a pair of open palms"
              width={905}
              height={905}
              sizes="(max-width: 1024px) 16rem, 18rem"
              className="h-auto w-full"
            />
          </div>

          <ol className="space-y-8">
            {EMBLEM.elements.map((element, i) => (
              <li key={element.name} className="border-t border-marigold/25 pt-5">
                <p className="font-display text-[0.75rem] tracking-[0.14em] text-nila-700">
                  {String(i + 1).padStart(2, '0')}
                </p>
                <h3 className="mt-2 font-display text-[1.2rem] font-semibold text-teal-deep">
                  {element.name}
                </h3>
                <p className="mt-2.5 max-w-measure text-[0.95rem] leading-relaxed text-ink-soft">
                  {element.body}
                </p>
              </li>
            ))}
          </ol>
        </div>

        <p className="mt-12 max-w-measure border-l-2 border-marigold/50 pl-5 text-[1.05rem] leading-relaxed font-medium text-teal-deep">
          {EMBLEM.close}
        </p>
      </Section>

    </PageShell>
  );
}
