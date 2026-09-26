import type { Metadata } from 'next';
import Image from 'next/image';
import { CirclePlay } from 'lucide-react';
import JsonLd from '@/components/JsonLd';
import { PageHero, PageShell, QuietLink, Section } from '@/components/PageShell';
import TrialButton from '@/components/TrialButton';
import { FRAME_HEIGHT, FRAME_WIDTH, MUDRAS, VERSE_MUDRAS, framePath, liveFrames } from '@/lib/mudras';
import { SITE } from '@/lib/site';
import { hastasGraph, slugify } from '@/lib/schema';

/**
 * UNLINKED AND NOINDEXED — read this before reviving the page.
 *
 * The academy asked for this route to be taken off the site. It has not been
 * deleted, because the content is real work with genuine reference value: all
 * twenty-eight gestures in Abhinaya Darpana order, each with its literal
 * meaning, documented viniyoga, and where published, its Sanskrit shloka and
 * word-by-word gloss. Nothing else on the site would earn a link from outside
 * the academy's own catchment.
 *
 * So the route still resolves and still renders. What changed:
 *
 *   - removed from NAV_ROUTES in lib/site.ts, which covers the masthead, the
 *     mobile menu and the footer in one edit;
 *   - removed from app/sitemap.ts;
 *   - the two QuietLinks on /curriculum and /lineage now point at /events;
 *   - `robots` below tells crawlers not to index or follow it.
 *
 * To bring it back: undo those four things. lib/mudras.ts was NOT touched and
 * must not be — the home page's ScrollStage and StaticActs depend on
 * framePath, liveFrames, mudraAtProgress and FRAME_COUNT, and lib/acts.ts on
 * mudraByName. Only `MUDRAS` itself is used solely by this page and by
 * hastasGraph() in lib/schema.ts.
 */
const TITLE = 'The 28 Asamyuta Hastas of Bharatanatyam';
const DESCRIPTION =
  'A reference to the twenty-eight single-hand gestures of Bharatanatyam in the canonical Abhinaya Darpana order — each with its literal meaning, documented viniyoga, and where published, its Sanskrit shloka with a word-by-word gloss.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/hastas' },
  /**
   * Unlinked at the academy's request, so also unindexed. `follow: false`
   * because the only outbound links here go to pages already in the sitemap —
   * there is no crawl path that needs preserving through this page.
   */
  robots: { index: false, follow: false },
  keywords: [
    'asamyuta hastas',
    'Bharatanatyam mudras list',
    '28 hastas Abhinaya Darpana',
    'Bharatanatyam hand gestures meaning',
    'viniyoga hastas',
    'Bharatanatyam theory class',
    ...MUDRAS.map((m) => `${m.name} hasta`),
  ],
  openGraph: {
    title: `${TITLE} | ${SITE.name}`,
    description: DESCRIPTION,
    url: `${SITE.url}/hastas`,
    type: 'article',
  },
};

export default function HastasPage() {
  return (
    <PageShell>
      <JsonLd data={hastasGraph()} />

      <PageHero
        eyebrow="Reference"
        title="Twenty-eight gestures, in"
        accent="order"
        lede="The asamyuta hastas — single-hand gestures — in the sequence the Abhinaya Darpana sets down, and the sequence our students learn them in. Each carries a literal meaning and a documented set of uses, and one gesture may serve a dozen unrelated ideas."
      >
        <div className="flex flex-wrap gap-3">
          <TrialButton source="hastas-hero">Learn them properly</TrialButton>
          <QuietLink href="/curriculum">The six levels</QuietLink>
        </div>
      </PageHero>

      {/* Jump list. 28 entries is a lot to scroll past to reach one gesture. */}
      <Section eyebrow="Jump to" heading="The sequence">
        <ul className="flex flex-wrap gap-1.5">
          {MUDRAS.map((m) => (
            <li key={m.order}>
              <a
                href={`#${slugify(m.name)}`}
                className="inline-flex items-baseline gap-1.5 rounded-full border border-marigold/30 bg-paper/60 px-3 py-1.5 font-sans text-[0.8rem] text-ink-soft transition-colors hover:border-kumkum/40 hover:bg-kumkum/5 hover:text-kumkum"
              >
                <span className="font-display text-micro text-nila-700">
                  {String(m.order).padStart(2, '0')}
                </span>
                {m.name}
              </a>
            </li>
          ))}
        </ul>

        <p className="mt-8 max-w-measure text-[0.95rem] leading-relaxed text-ink-soft">
          The stills below are taken from our own teaching footage, which carries the
          gesture name in frame — {VERSE_MUDRAS.length} of the twenty-eight also have
          their Sanskrit verse transcribed from the academy&rsquo;s Theory Class lessons.
        </p>
      </Section>

      {/* The gestures */}
      <Section tinted>
        <ol className="grid items-start gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {MUDRAS.map((mudra) => {
            const { start, end } = liveFrames(mudra);
            const still = Math.round((start + end) / 2);

            return (
              <li
                key={mudra.order}
                id={slugify(mudra.name)}
                className="glass grain scroll-mt-28 overflow-hidden rounded-[1.5rem]"
              >
                {/* Full frame, uncropped: the burned-in label is a liability on
                    the home page but the whole point on a reference page. */}
                <Image
                  src={framePath(still)}
                  alt={`The ${mudra.name} hasta — ${mudra.literal}`}
                  width={FRAME_WIDTH}
                  height={FRAME_HEIGHT}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="h-auto w-full bg-teal-deep object-cover"
                  loading={mudra.order <= 3 ? 'eager' : 'lazy'}
                />

                <div className="px-5 py-5 sm:px-6">
                  <p className="font-display text-[0.7rem] tracking-[0.16em] text-nila-700">
                    {String(mudra.order).padStart(2, '0')}
                  </p>
                  <h3 className="mt-1.5 font-display text-[1.3rem] leading-snug font-semibold text-teal-deep">
                    {mudra.name}
                  </h3>
                  <p className="mt-0.5 font-sans text-[0.82rem] text-ink-faint italic">
                    {mudra.literal}
                  </p>

                  <h4 className="eyebrow mt-5">Viniyoga</h4>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {mudra.viniyoga.map((use) => (
                      <li
                        key={use}
                        className="rounded-full border border-marigold/25 bg-paper/60 px-2.5 py-0.5 font-sans text-[0.75rem] text-ink-soft"
                      >
                        {use}
                      </li>
                    ))}
                  </ul>

                  {mudra.reflection ? (
                    <p className="max-w-measure mt-5 border-l-2 border-marigold/45 pl-3.5 text-[0.88rem] leading-relaxed text-ink-soft italic">
                      {mudra.reflection}
                    </p>
                  ) : null}

                  {mudra.verse ? (
                    <details className="mt-5 border-t border-marigold/25 pt-4">
                      <summary className="cursor-pointer font-sans text-[0.8rem] font-medium text-teal marker:text-nila-700">
                        Shloka and gloss
                      </summary>

                      <div className="mt-3.5">
                        <ul className="space-y-1">
                          {mudra.verse.shloka.map((line) => (
                            <li
                              key={line}
                              className="font-display text-[0.86rem] leading-relaxed text-teal-deep"
                            >
                              {line}
                            </li>
                          ))}
                        </ul>

                        <dl className="mt-4 space-y-1 border-t border-marigold/20 pt-3">
                          {mudra.verse.gloss.map((entry) => (
                            <dd
                              key={entry}
                              className="font-sans text-[0.76rem] leading-relaxed text-ink-faint"
                            >
                              {entry}
                            </dd>
                          ))}
                        </dl>

                        <a
                          href={`https://www.youtube.com/watch?v=${mudra.verse.videoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex items-center gap-1.5 font-sans text-[0.8rem] font-medium text-kumkum hover:underline"
                        >
                          <CirclePlay className="size-4" aria-hidden /> Theory Class
                        </a>
                      </div>
                    </details>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </Section>

      <Section>
        <div className="max-w-2xl">
          <h2 className="font-display text-[clamp(1.5rem,3.4vw,2.2rem)] leading-[1.12] font-semibold text-teal-deep">
            Learning them is not memorising them
          </h2>
          <p className="max-w-measure mt-4 text-[0.98rem] leading-relaxed text-ink-soft">
            A gesture is only useful when the eyes, the neck and the rhythm arrive with
            it. That is what the six levels are for — and why the same hand can mean
            anxiety or devotion depending on nothing but the gaze.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <TrialButton source="hastas-footer">Schedule a trial session</TrialButton>
            <QuietLink href="/curriculum">The six levels</QuietLink>
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
