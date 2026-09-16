import type { Metadata } from 'next';
import Image from 'next/image';
import JsonLd from '@/components/JsonLd';
import { PageHero, PageShell, QuietLink, Section } from '@/components/PageShell';
import TrialButton from '@/components/TrialButton';
import { DIRECTOR, FOUNDER } from '@/lib/lineage';
import { FACULTY, MILESTONES, SITE } from '@/lib/site';
import { homeGraph } from '@/lib/schema';

const TITLE = 'Our Lineage — Founder, Director & Faculty';
const DESCRIPTION =
  'The vision of founder Om – Guru – Om, the Kalakshetra training of Co-Founder & Director Sunitta Menghanaani, and the faculty who teach the Gurukulam tradition at Shanti Kala Nikketan.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/lineage' },
  openGraph: {
    title: `${TITLE} | ${SITE.name}`,
    description: DESCRIPTION,
    url: `${SITE.url}/lineage`,
    type: 'website',
  },
};

export default function LineagePage() {
  return (
    <PageShell>
      <JsonLd data={homeGraph()} />

      <PageHero
        eyebrow="Lineage"
        title="A bond, not a"
        accent="transaction"
        lede="The foundation of our teaching lies in the sacred bond between Guru and Shishya — trust, dedication, mutual respect, and lifelong learning."
      />

      {/* Founder */}
      <Section eyebrow={FOUNDER.eyebrow} heading={FOUNDER.name}>
        <div className="grid gap-10 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-14">
          <figure className="mx-auto w-48 shrink-0 sm:w-56 lg:mx-0 lg:w-full">
            <Image
              src={FOUNDER.image}
              alt={FOUNDER.name}
              width={480}
              height={600}
              sizes="(max-width: 1024px) 14rem, 18rem"
              className="h-auto w-full rounded-[1.25rem] object-cover"
            />
          </figure>

          <div className="max-w-2xl space-y-5">
            {FOUNDER.body.map((para) => (
              <p key={para.slice(0, 40)} className="text-[1rem] leading-relaxed text-ink-soft">
                {para}
              </p>
            ))}

            <blockquote className="glass mt-8 rounded-[1.5rem] px-6 py-7 sm:px-8">
              <p className="eyebrow">{FOUNDER.vision.label}</p>
              <div className="mt-3 space-y-1">
                {FOUNDER.vision.lines.map((line) => (
                  <p
                    key={line}
                    className="font-display text-[clamp(1.15rem,2.6vw,1.6rem)] leading-snug font-semibold text-teal-deep"
                  >
                    {line}
                  </p>
                ))}
              </div>
            </blockquote>
          </div>
        </div>
      </Section>

      {/* Director */}
      <Section eyebrow={DIRECTOR.eyebrow} heading={DIRECTOR.name} tinted>
        <div className="grid gap-10 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-14">
          <figure className="mx-auto w-48 shrink-0 sm:w-56 lg:mx-0 lg:w-full">
            <Image
              src={DIRECTOR.image}
              alt={DIRECTOR.name}
              width={480}
              height={600}
              sizes="(max-width: 1024px) 14rem, 18rem"
              className="h-auto w-full rounded-[1.25rem] object-cover"
            />
            {/* _research/STATUS.txt item 5: this portrait was saved from the
                founders page without a confirmed identity. Flagged in the data,
                so the caption stays factual rather than asserting a name. */}
            {!DIRECTOR.portraitConfirmed ? (
              <figcaption className="mt-2 font-sans text-[0.65rem] leading-relaxed text-ink-faint">
                Portrait pending confirmation by the academy.
              </figcaption>
            ) : null}
          </figure>

          <div className="max-w-2xl space-y-5">
            {DIRECTOR.body.map((para) => (
              <p key={para.slice(0, 40)} className="text-[1rem] leading-relaxed text-ink-soft">
                {para}
              </p>
            ))}

            <div className="mt-8">
              <h3 className="eyebrow">Training and honours</h3>
              <ul className="mt-4 space-y-2 border-t border-marigold/25 pt-4">
                {DIRECTOR.credentials.map((c) => (
                  <li key={c} className="text-[0.92rem] leading-relaxed text-ink-soft">
                    {c}
                  </li>
                ))}
              </ul>
            </div>

            <blockquote className="glass mt-8 rounded-[1.5rem] px-6 py-7 sm:px-8">
              <p className="eyebrow">{DIRECTOR.vision.label}</p>
              <p className="mt-3 font-display text-[1.05rem] leading-relaxed text-teal-deep italic">
                &ldquo;{DIRECTOR.vision.quote}&rdquo;
              </p>
              <footer className="mt-4 font-sans text-xs text-ink-faint">
                {DIRECTOR.vision.attribution}
              </footer>
            </blockquote>
          </div>
        </div>
      </Section>

      {/* Milestones */}
      <Section
        eyebrow="The story so far"
        heading="From one room to two countries"
        lede="Every entry below is drawn from the academy's own record."
      >
        <ol className="relative space-y-8 border-l border-marigold/30 pl-6 sm:pl-8">
          {MILESTONES.map((milestone) => (
            <li key={milestone.title} className="relative">
              <span
                aria-hidden
                className="absolute top-2 -left-[1.9rem] size-2 rounded-full bg-kumkum sm:-left-[2.4rem]"
              />
              <p className="font-display text-[0.8rem] tracking-[0.14em] text-marigold-deep">
                {milestone.year}
              </p>
              <h3 className="mt-1.5 font-display text-[1.2rem] font-semibold text-teal-deep">
                {milestone.title}
              </h3>
              <p className="mt-2 max-w-2xl text-[0.95rem] leading-relaxed text-ink-soft">
                {milestone.body}
              </p>
              <p className="mt-2 font-sans text-[0.7rem] tracking-[0.12em] text-ink-faint uppercase">
                {milestone.place}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      {/* Faculty */}
      <Section
        eyebrow="Who teaches"
        heading="The faculty"
        lede="Kalakshetra-trained teachers, most of them graduates of the Rukmini Devi College of Fine Arts."
        tinted
      >
        <ul className="grid items-start gap-5 md:grid-cols-2">
          {FACULTY.map((person) => (
            <li key={person.name} className="glass grain rounded-[1.5rem] p-6 sm:p-7">
              <div className="flex items-start gap-5">
                <Image
                  src={person.image}
                  alt={person.name}
                  width={112}
                  height={112}
                  sizes="112px"
                  className="size-20 shrink-0 rounded-full object-cover sm:size-24"
                />
                <div className="min-w-0">
                  <h3 className="font-display text-[1.15rem] leading-snug font-semibold text-teal-deep">
                    {person.name}
                  </h3>
                  {person.role ? (
                    <p className="mt-0.5 font-sans text-[0.68rem] tracking-[0.14em] text-marigold-deep uppercase">
                      {person.role}
                    </p>
                  ) : null}
                </div>
              </div>

              <p className="mt-4 text-[0.9rem] leading-relaxed text-ink-soft">{person.bio}</p>

              {person.credentials?.length ? (
                <ul className="mt-4 space-y-1.5 border-t border-marigold/20 pt-4">
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
      </Section>

      <Section>
        <div className="flex flex-wrap items-center gap-3">
          <TrialButton source="lineage-footer">Schedule a trial session</TrialButton>
          <QuietLink href="/curriculum">The six levels</QuietLink>
          <QuietLink href="/hastas">The 28 hastas</QuietLink>
        </div>
      </Section>
    </PageShell>
  );
}
