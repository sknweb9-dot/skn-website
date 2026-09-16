import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { PageHero, PageShell, QuietLink, Section } from '@/components/PageShell';
import TrialButton from '@/components/TrialButton';
import { ARANGETRAM, CURRICULUM_INTRO, INTRODUCTORY, LEVELS } from '@/lib/curriculum';
import { SITE } from '@/lib/site';
import { adultBatches, allBatches, formatBatchTime } from '@/lib/classes';
import { homeGraph } from '@/lib/schema';

const TITLE = 'Curriculum — Six Graded Levels to Arangetram';
const DESCRIPTION =
  'An Introductory Programme from age 3.5, then six graded levels — Foundation, Technique Development, Margam Preparation, Repertoire & Expression, Advanced Artistry and Mastery — followed by a dedicated Performance & Arangetram Programme.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/curriculum' },
  openGraph: {
    title: `${TITLE} | ${SITE.name}`,
    description: DESCRIPTION,
    url: `${SITE.url}/curriculum`,
    type: 'website',
  },
};

/** Batches currently running at a given programme, for the "running now" note. */
function batchesFor(programmeId: string) {
  return allBatches().filter(({ programme }) => programme.id === programmeId);
}

export default function CurriculumPage() {
  const adults = adultBatches();

  return (
    <PageShell>
      <JsonLd data={homeGraph()} />

      <PageHero
        eyebrow={CURRICULUM_INTRO.eyebrow}
        title="Six levels, not"
        accent="six terms"
        lede={CURRICULUM_INTRO.body[0]}
      >
        <div className="flex flex-wrap gap-3">
          <TrialButton source="curriculum-hero">Schedule a trial session</TrialButton>
          <QuietLink href="/locations">Batches and timings</QuietLink>
        </div>
      </PageHero>

      <Section>
        <div className="max-w-3xl space-y-5">
          {CURRICULUM_INTRO.body.slice(1).map((para) => (
            <p key={para.slice(0, 40)} className="text-[1rem] leading-relaxed text-ink-soft">
              {para}
            </p>
          ))}
        </div>
      </Section>

      {/* Introductory Programme */}
      <Section
        eyebrow={INTRODUCTORY.label}
        heading={INTRODUCTORY.name}
        lede={INTRODUCTORY.ages}
        tinted
        id={INTRODUCTORY.id}
      >
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-14">
          <div className="max-w-2xl">
            <p className="text-[1rem] leading-relaxed text-ink-soft">
              {INTRODUCTORY.description}
            </p>
            <p className="mt-5 border-l-2 border-marigold/50 pl-4 font-display text-[0.98rem] leading-relaxed text-teal-deep">
              Formal Bharatanatyam training begins from Level 1.
            </p>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="eyebrow">Introduced through</h3>
                <ul className="mt-3 space-y-1.5 border-t border-marigold/25 pt-3">
                  {INTRODUCTORY.repertoire.map((item) => (
                    <li key={item} className="text-[0.9rem] text-ink-soft">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="eyebrow">What it develops</h3>
                <ul className="mt-3 space-y-1.5 border-t border-marigold/25 pt-3">
                  {INTRODUCTORY.develops.map((item) => (
                    <li key={item} className="text-[0.9rem] text-ink-soft">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <figure className="overflow-hidden rounded-[1.5rem]">
            <Image
              src={INTRODUCTORY.image}
              alt="Young children in an introductory Bharatanatyam class"
              width={800}
              height={600}
              sizes="(max-width: 1024px) 100vw, 22rem"
              className="h-auto w-full object-cover"
            />
          </figure>
        </div>
      </Section>

      {/* The six levels */}
      <Section
        eyebrow="The six levels of learning"
        heading="Each level builds on the last"
        lede="Progression is by readiness, not by calendar. A level is complete when the technique underneath it is secure."
      >
        <ol className="space-y-5">
          {LEVELS.map((level) => {
            const batches = batchesFor(level.id);
            return (
              <li
                key={level.id}
                id={level.id}
                className="glass grain rounded-[1.5rem] px-6 py-7 sm:px-8"
              >
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-10">
                  <div>
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-display text-[0.78rem] tracking-[0.16em] text-marigold-deep">
                        {level.label}
                      </span>
                      <h3 className="font-display text-[1.35rem] leading-snug font-semibold text-teal-deep">
                        {level.name}
                      </h3>
                    </div>
                    <p className="mt-3 max-w-2xl text-[0.96rem] leading-relaxed text-ink-soft">
                      {level.description}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-1.5">
                      {level.repertoire.map((item) => (
                        <span
                          key={item}
                          className="rounded-full border border-marigold/30 bg-white/50 px-3 py-1 font-sans text-[0.78rem] text-ink-soft"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="lg:border-l lg:border-marigold/25 lg:pl-8">
                    <h4 className="eyebrow">What it develops</h4>
                    <ul className="mt-3 space-y-1.5">
                      {level.develops.map((item) => (
                        <li key={item} className="text-[0.86rem] leading-snug text-ink-soft">
                          {item}
                        </li>
                      ))}
                    </ul>

                    {/* Ties the syllabus to what is actually running, so the page
                        is a timetable as well as a prospectus.

                        Capped at three: Level 1 runs at eight venues, and listing
                        them all made the card several times taller than its own
                        prose column. The rest live on /locations, which is the
                        page built for comparing batches anyway. */}
                    {batches.length > 0 ? (
                      <div className="mt-5 border-t border-marigold/25 pt-4">
                        <h4 className="eyebrow">Running now</h4>
                        <ul className="mt-2.5 space-y-2">
                          {batches.slice(0, 3).map(({ venue, batch }) => (
                            <li key={batch.code} className="font-sans text-[0.78rem] text-ink-faint">
                              <span className="text-ink-soft">
                                {venue.name}
                                {batch.audience === 'adults' ? ' · adults' : ''}
                              </span>
                              <span className="block">
                                {formatBatchTime(batch)}
                                {batch.provisionalTiming ? ' (provisional)' : ''}
                              </span>
                              {batch.admissionOpen ? (
                                <span className="mt-0.5 inline-block font-semibold text-kumkum">
                                  Admission open
                                </span>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                        {batches.length > 3 ? (
                          <Link
                            href="/locations"
                            className="mt-3 inline-block font-sans text-[0.78rem] font-medium text-teal hover:underline"
                          >
                            + {batches.length - 3} more{' '}
                            {batches.length - 3 === 1 ? 'batch' : 'batches'} elsewhere
                          </Link>
                        ) : null}
                      </div>
                    ) : (
                      <p className="mt-5 border-t border-marigold/25 pt-4 font-sans text-[0.78rem] leading-relaxed text-ink-faint">
                        Taught one to one at present. Write to us for availability.
                      </p>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </Section>

      {/* Arangetram */}
      <Section eyebrow={ARANGETRAM.label} heading={ARANGETRAM.name} tinted id={ARANGETRAM.id}>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-14">
          <div className="max-w-2xl">
            <p className="font-display text-[1.1rem] leading-relaxed text-teal-deep">
              {ARANGETRAM.lead}
            </p>
            <p className="mt-4 text-[1rem] leading-relaxed text-ink-soft">
              {ARANGETRAM.description}
            </p>

            <div className="mt-8">
              <h3 className="eyebrow">The programme covers</h3>
              <ul className="mt-3 grid gap-1.5 border-t border-marigold/25 pt-3 sm:grid-cols-2">
                {ARANGETRAM.includes.map((item) => (
                  <li key={item} className="text-[0.9rem] text-ink-soft">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <figure className="overflow-hidden rounded-[1.5rem]">
            <Image
              src={ARANGETRAM.image}
              alt="A student's Arangetram — her formal debut as a Bharatanatyam performer"
              width={800}
              height={600}
              sizes="(max-width: 1024px) 100vw, 22rem"
              className="h-auto w-full object-cover"
            />
          </figure>
        </div>
      </Section>

      {/* Adults */}
      {adults.length > 0 ? (
        <Section
          eyebrow="Not only for children"
          heading="Adults follow the same syllabus"
          lede="Beginning late changes the pace, not the path. Adults work through the same graded levels, in batches of their own."
        >
          <ul className="grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {adults.map(({ venue, batch, programme }) => (
              <li
                key={batch.code}
                className="rounded-[1.25rem] border border-marigold/30 bg-white/55 px-5 py-5"
              >
                <p className="font-display text-[0.72rem] tracking-[0.14em] text-marigold-deep">
                  {batch.code}
                </p>
                <h3 className="mt-2 font-display text-[1.05rem] leading-snug font-semibold text-teal-deep">
                  {programme.label} — {programme.name}
                </h3>
                <p className="mt-1.5 font-sans text-sm text-ink-soft">{venue.name}</p>
                <p className="mt-0.5 font-sans text-xs text-ink-faint">
                  {formatBatchTime(batch)}
                  {batch.provisionalTiming ? ' (provisional)' : ''}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <TrialButton source="curriculum-adults">Enquire about adult batches</TrialButton>
          </div>
        </Section>
      ) : null}

      <Section>
        <div className="flex flex-wrap items-center gap-3">
          <TrialButton source="curriculum-footer">Schedule a trial session</TrialButton>
          <QuietLink href="/hastas">The 28 hastas</QuietLink>
          <QuietLink href="/locations">Batches and timings</QuietLink>
        </div>
      </Section>
    </PageShell>
  );
}
