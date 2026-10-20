import type { CSSProperties, ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, MessageCircle, Phone, PlayCircle } from 'lucide-react';
import BookButton from '../BookButton';
import ArchFrame from './ArchFrame';
import ScrollCue from '../ScrollCue';
import Words from '../Words';
import { bookHref, whatsappHref, type Audience } from '@/lib/booking';
import {
  BEGIN,
  EVENTS_COPY,
  FRAMERS,
  HERO,
  HONOURS,
  STORY,
  TIMELINE,
  TONE_VALUES,
  VOICES,
  VOICES_COPY,
  WHY,
  formatEventDate,
  homeSection,
  partitionEvents,
  restingFrame,
  whyFigures,
  type HomeEvent,
  type HomeSectionId,
} from '@/lib/home';
import { framePath } from '@/lib/mudras';
import { SITE } from '@/lib/site';

/**
 * THE HOME PAGE'S CONTENT
 * -----------------------
 * Every section is a <section data-home-section> holding one or more pages
 * (<div data-page>). These are server components and ordinary document content:
 * with no script, on a phone, or under reduced motion they stack and read as a
 * normal page, each section on its own ground with its gesture shown as a still
 * arch above it. With script on a large screen, HomeStage turns the same markup
 * into a stage where one page shows at a time (see components/home/HomeStage.tsx
 * and lib/stage.ts). Nothing here depends on which.
 *
 * `data-steps` on a page is how many scroll steps the stage holds it for
 * (default 1; the hero is 0; the timeline is 6, during which its window scrubs).
 * Content must fit one viewport per page in stage mode: use the `staged:`
 * variant (globals.css) for sizes that differ there.
 *
 * TYPE AND CORNERS
 * ----------------
 * Cinzel (font-display) is for the page's headings only: the hero line and each
 * section's h2, plus the numerals. It has no lowercase, so a long title set in
 * it reads as shouting; everything smaller is Mukta in sentence case.
 *
 * Corners come in two sizes, by what they hold, plus the pill and the cutting:
 *   rounded-2xl   photographs and the featured picture
 *   rounded-lg    small thumbnails
 *   rounded-full  portraits and buttons
 *   rounded-sm    newspaper cuttings, which have square corners in print
 * Text sits directly on the ground. There are no boxed cards.
 */

// ---------------------------------------------------------------------------
// Shell
// ---------------------------------------------------------------------------

function Section({ id, labelledBy, children }: { id: HomeSectionId; labelledBy: string; children: ReactNode }) {
  const section = homeSection(id);
  const tone = TONE_VALUES[section.tone];
  return (
    <section
      id={id}
      data-home-section={id}
      aria-labelledby={labelledBy}
      className={`home-section group ${tone.dark ? 'on-dark' : 'text-ink'}`}
      style={{ '--tone': tone.value } as CSSProperties}
    >
      <StackedArch id={id} />
      {children}
    </section>
  );
}

/**
 * The section's gesture as a still, for the stacked layout. Hidden when the
 * stage is on (the live arch takes over), so it costs nothing there but the
 * request, which is lazy for every section below the first.
 */
function StackedArch({ id }: { id: HomeSectionId }) {
  const section = homeSection(id);
  const frame = Math.round(restingFrame(section));
  return (
    <figure className="home-stacked-arch relative m-0" aria-hidden>
      <div className="relative aspect-[720/1000] w-full">
        <div className="arch absolute inset-0 overflow-hidden bg-lamp">
          <Image
            src={framePath(frame)}
            alt=""
            fill
            unoptimized
            preload={id === 'hero'}
            sizes="(min-width: 640px) 16rem, 60vw"
            className="object-cover object-[50%_18%]"
          />
        </div>
        <ArchFrame />
      </div>
      <figcaption className="mt-3 text-center">
        <span className="block font-display text-[0.82rem] tracking-[0.16em] text-kumkum group-[.on-dark]:text-marigold">
          {section.mudra.name}
        </span>
        <span className="mt-0.5 block font-sans text-micro tracking-[0.06em] text-ink-faint group-[.on-dark]:text-cream/80">
          {section.mudra.literal}
        </span>
      </figcaption>
      {id === 'hero' ? <ScrollCue variant="capsule" /> : null}
    </figure>
  );
}

function Page({ steps = 1, className = '', children }: { steps?: number; className?: string; children: ReactNode }) {
  return (
    <div data-page data-steps={steps} className={`home-page ${className}`}>
      <div className="home-page-inner">{children}</div>
    </div>
  );
}

function Heading({ id, eyebrow, children, dark }: { id: string; eyebrow?: string; children: ReactNode; dark?: boolean }) {
  return (
    <div>
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h2
        id={id}
        className={`${eyebrow ? 'mt-4' : ''} max-w-[22ch] font-display text-[clamp(2rem,4.2vw,3.6rem)] leading-[1.04] font-semibold tracking-[-0.02em] ${
          dark ? 'text-cream' : 'text-teal-deep'
        }`}
      >
        {children}
      </h2>
    </div>
  );
}

/** "Lineage →": the page named, with the arrow, as elsewhere on the site. */
function PageLink({ href, label, dark }: { href: string; label: string; dark?: boolean }) {
  return (
    <Link
      href={href}
      className={`group mt-8 inline-flex min-h-11 items-center gap-2 border-b pb-1 font-sans text-[0.95rem] font-semibold tracking-wide transition-colors ${
        dark
          ? 'border-marigold/60 text-cream hover:border-marigold hover:text-marigold'
          : 'border-marigold text-teal-deep hover:text-kumkum'
      }`}
    >
      {label}
      <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
        →
      </span>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// 1. Hero
// ---------------------------------------------------------------------------

export function HomeHero() {
  return (
    <Section id="hero" labelledBy="hero-heading">
      <Page steps={0} className="home-hero">
        {/* The focal moment of the site. Played by CSS from first paint, held on
            its first frame while the loading screen is up (html[data-intro]),
            then: the headline is lifted into place word by word, the line under
            it is swept in, and the button and credentials follow. Nothing here
            is touched by TextMotion (data-tx-static). */}
        <h1
          id="hero-heading"
          data-tx-static
          style={{ '--tx-base': '0.3s' } as CSSProperties}
          className="tx-wl max-w-[18ch] font-display text-[clamp(1.9rem,3.8vw,3.2rem)] leading-[1.04] font-semibold tracking-[-0.02em] text-teal-deep"
        >
          <Words text={HERO.heading} />
        </h1>
        <p
          data-tx-static
          style={{ '--tx-base': '1.05s' } as CSSProperties}
          className="tx-sweep-l mt-3 font-sans text-[1.05rem] text-ink-soft"
        >
          {HERO.body}
        </p>

        <div
          data-tx-static
          style={{ '--tx-base': '1.35s' } as CSSProperties}
          className="tx-rise-l mt-6 flex flex-col items-center gap-4"
        >
          <BookButton source="home-hero" />
          <p className="font-sans text-sm text-ink-faint">
            {HERO.credentials.join(' · ')}
            <span className="block sm:inline">
              <span aria-hidden className="hidden sm:inline"> · </span>
              {HERO.press}
            </span>
          </p>
        </div>
      </Page>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// 2. Why SKN
// ---------------------------------------------------------------------------

export function HomeWhy() {
  const figures = whyFigures();
  const [noMarks] = WHY.care;
  return (
    <Section id="why" labelledBy="why-heading">
      <Page>
        <Heading id="why-heading" eyebrow="Why families choose SKN" dark>
          {WHY.heading}
        </Heading>
        <p className="mt-6 max-w-measure text-[1.15rem] leading-relaxed text-cream/90">{WHY.lede}</p>
        <p className="mt-3 max-w-measure text-[1rem] leading-relaxed text-cream/75">
          {WHY.body} {noMarks.title}: {noMarks.body.charAt(0).toLowerCase()}
          {noMarks.body.slice(1)}
        </p>
        <PageLink href={WHY.link.href} label={WHY.link.label} dark />
      </Page>

      <Page>
        <p className="eyebrow">Since 2009</p>
        <ul className="mt-5 grid max-w-[46rem] gap-x-12 gap-y-9 sm:grid-cols-2">
          {figures.map((f) => (
            <li key={f.label} className="border-t-2 border-marigold pt-4">
              <p
                data-count
                className="font-display text-[clamp(2.6rem,5vw,4.2rem)] leading-none font-semibold text-marigold"
              >
                {f.figure}
              </p>
              <p className="mt-3 max-w-[18rem] text-[1.05rem] leading-snug text-cream/90">{f.label}</p>
            </li>
          ))}
        </ul>
      </Page>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// 3. The story
// ---------------------------------------------------------------------------

export function HomeStory() {
  return (
    <Section id="story" labelledBy="story-heading">
      {/* The two who frame the story, set as plain type either side of a rule.
          Apart from the timeline: they are why it happened, not things that
          happened. */}
      <Page>
        <Heading id="story-heading" eyebrow={STORY.eyebrow} dark>
          {STORY.heading}
        </Heading>
        <div className="mt-10 grid max-w-[54rem] gap-10 md:grid-cols-2 md:gap-0 md:divide-x md:divide-marigold/50">
          {FRAMERS.map((f, i) => (
            <figure key={f.name} className={i === 0 ? 'md:pr-9' : 'md:pl-9'}>
              <blockquote className="text-[clamp(1.1rem,1.6vw,1.3rem)] leading-snug font-medium text-cream">
                <p>&ldquo;{f.quote}&rdquo;</p>
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3.5">
                <Image
                  src={f.image}
                  alt=""
                  width={96}
                  height={96}
                  className="size-12 rounded-full object-cover ring-2 ring-marigold"
                />
                <span>
                  <span className="block font-sans text-[0.98rem] font-semibold text-cream">{f.name}</span>
                  <span className="block font-sans text-sm text-cream/75">{f.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
        <PageLink href={STORY.link.href} label={STORY.link.label} dark />
      </Page>

      {/* The timeline. Stacked, a two-column list. On the stage, a window four
          entries tall whose track scrubs with the scroll while the page is
          showing: the top entries fade as new ones arrive. Entry height is
          --entry-h so both agree. */}
      <Page steps={6} className="home-timeline">
        <h3 className="sr-only">Timeline</h3>
        <div data-scrub-window className="home-timeline-window">
          <ol data-scrub-track className="home-timeline-track grid gap-x-12 gap-y-9 sm:grid-cols-2">
            {TIMELINE.map((m) => (
              <li key={m.year} className="home-timeline-entry border-t border-marigold/60 pt-5">
                <div className={`grid gap-x-5 ${m.image ? 'grid-cols-[minmax(0,1fr)_6.5rem]' : ''}`}>
                  <div>
                    <p className="font-display text-[1.5rem] leading-none font-semibold text-marigold">{m.year}</p>
                    <h4 className="mt-2 font-sans text-[1.1rem] leading-snug font-semibold text-cream">{m.title}</h4>
                    <p className="mt-1.5 text-[0.95rem] leading-relaxed text-cream/80">{m.body}</p>
                  </div>
                  {m.image ? (
                    <figure className="relative aspect-[4/5] w-[6.5rem] self-start overflow-hidden rounded-lg">
                      <Image src={m.image.src} alt={m.image.alt} fill sizes="104px" className="object-cover" />
                    </figure>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </Page>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// 4. Honours
// ---------------------------------------------------------------------------

export function HomeHonours() {
  return (
    <Section id="honours" labelledBy="honours-heading">
      <Page>
        <Heading id="honours-heading">{HONOURS.heading}</Heading>
        <div className="mt-8 grid items-center gap-8 md:grid-cols-[auto_minmax(0,1fr)] md:gap-10">
          <figure>
            <div className="relative aspect-[1600/1542] w-full overflow-hidden rounded-2xl md:w-[clamp(15rem,28vw,22rem)] staged:md:w-[min(24rem,calc(40svh*1.04))]">
              <Image
                src={HONOURS.photo.src}
                alt={HONOURS.photo.alt}
                fill
                sizes="(min-width: 1024px) 24rem, 100vw"
                className="object-cover"
              />
            </div>
            <figcaption className="mt-3 font-sans text-sm text-ink-faint">{HONOURS.photo.caption}</figcaption>
          </figure>

          <ul className="space-y-6">
            {HONOURS.awards.map((a) => (
              <li key={a.title} className="border-t-2 border-marigold pt-4">
                <p className="font-sans text-[1.3rem] leading-snug font-semibold text-teal-deep">{a.title}</p>
                <p className="mt-1 font-sans text-[0.98rem] text-ink-soft">{a.from}</p>
              </li>
            ))}
          </ul>
        </div>
      </Page>

      <Page>
        <p className="eyebrow">In the papers</p>
        <div className="mt-5 grid max-w-[54rem] items-start gap-8 sm:grid-cols-2">
          {HONOURS.press.map((p, i) => (
            <figure key={p.paper} className="staged:flex staged:items-start staged:gap-5">
              {/* Printed matter: a cream mat and a slight turn, so it reads as a
                  cutting rather than another photograph. */}
              <div
                className={`shrink-0 rounded-sm bg-white p-2.5 shadow-[0_24px_50px_-26px_rgba(43,30,22,0.55)] ${
                  i % 2 === 0 ? 'rotate-[-0.6deg]' : 'rotate-[0.6deg]'
                }`}
              >
                <Image
                  src={p.image.src}
                  alt={p.alt}
                  width={p.image.width}
                  height={p.image.height}
                  sizes="(min-width: 1024px) 14rem, (min-width: 640px) 45vw, 100vw"
                  className="h-auto max-h-[34rem] w-full object-cover object-top staged:max-h-[min(46svh,26rem)] staged:w-auto"
                />
              </div>
              <figcaption className="mt-5 staged:mt-1 staged:max-w-[14rem]">
                <span className="block text-[1.05rem] leading-snug font-medium text-teal-deep">&ldquo;{p.headline}&rdquo;</span>
                <span className="mt-1 block font-sans text-sm text-ink-faint">
                  {p.paper} · {p.edition}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Page>
    </Section>
  );
}

// ---------------------------------------------------------------------------
// 5. Udaan and events
// ---------------------------------------------------------------------------

/**
 * Upcoming events lead when there are any; otherwise the featured Udaan. Three
 * more sit beneath it: whatever else is upcoming, then the most recent. Decided
 * on the server at render time. The page re-renders daily (app/page.tsx), so an
 * event moves from "coming up" to "recent" on its own, and the layout never
 * swaps after the page has loaded.
 */
export function HomeEvents({ now }: { now: Date }) {
  const { mode, lead, rest, recent } = partitionEvents(now);
  const copy = mode === 'upcoming' ? EVENTS_COPY.upcoming : EVENTS_COPY.past;
  const more = [...rest, ...recent].slice(0, 3);

  return (
    <Section id="events" labelledBy="events-heading">
      <Page>
        <Heading id="events-heading" eyebrow={copy.eyebrow} dark>
          {copy.heading}
        </Heading>

        <article className="mt-7 grid items-center gap-x-8 gap-y-5 md:grid-cols-[minmax(0,19rem)_minmax(0,1fr)]">
          <div className="relative aspect-[3/2] overflow-hidden rounded-2xl">
            <Image
              src={lead.image.src}
              alt={lead.image.alt}
              fill
              sizes="(min-width: 1024px) 19rem, 100vw"
              className="object-cover"
            />
          </div>
          <div className="max-w-[36rem]">
            <p className="font-sans text-sm font-semibold text-marigold">
              {mode === 'upcoming' ? 'Coming up · ' : ''}
              {formatEventDate(lead.date)} · {lead.venue}
            </p>
            <h3 className="mt-1.5 font-sans text-[clamp(1.3rem,2.2vw,1.7rem)] leading-tight font-semibold text-cream">
              {lead.title}
            </h3>
            {lead.description ? (
              <p className="mt-2.5 text-[1rem] leading-relaxed text-cream/80">{lead.description}</p>
            ) : null}
            {lead.href ? <WatchLink href={lead.href} /> : null}
          </div>
        </article>

        {more.length > 0 ? <EventRow events={more} /> : null}

        <PageLink href={EVENTS_COPY.link.href} label={EVENTS_COPY.link.label} dark />
      </Page>
    </Section>
  );
}

function EventRow({ events }: { events: HomeEvent[] }) {
  return (
    <ul className="mt-8 grid max-w-[56rem] gap-x-6 gap-y-5 border-t border-cream/25 pt-6 sm:grid-cols-3">
      {events.map((e) => (
        <li key={e.title} className="grid grid-cols-[4.75rem_minmax(0,1fr)] items-center gap-3.5">
          <div className="relative size-[4.75rem] overflow-hidden rounded-lg">
            <Image src={e.image.src} alt={e.image.alt} fill sizes="76px" className="object-cover" />
          </div>
          <div>
            <p className="font-sans text-xs font-semibold text-marigold">{formatEventDate(e.date)}</p>
            <h4 className="mt-0.5 font-sans text-[0.98rem] leading-snug font-semibold text-cream">{e.title}</h4>
          </div>
        </li>
      ))}
    </ul>
  );
}

function WatchLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-2 inline-flex min-h-11 items-center gap-2 font-sans text-[0.95rem] font-semibold text-cream hover:text-marigold"
    >
      <PlayCircle className="size-4" aria-hidden="true" />
      Watch on YouTube
      <span className="sr-only">(opens YouTube)</span>
    </a>
  );
}

// ---------------------------------------------------------------------------
// 6. Parents' words
// ---------------------------------------------------------------------------

/**
 * Three quotes a page, as plain type with a rule between them: no boxes. The
 * section opens on the words themselves.
 */
function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

export function HomeVoices() {
  const groups = chunk(VOICES, 3);
  return (
    <Section id="voices" labelledBy="voices-heading">
      {groups.map((group, g) => (
        <Page key={g}>
          {g === 0 ? (
            <Heading id="voices-heading">{VOICES_COPY.heading}</Heading>
          ) : (
            <p className="eyebrow" aria-hidden>
              {VOICES_COPY.heading}
            </p>
          )}
          <ul className="mt-9 grid max-w-[60rem] gap-y-9 md:grid-cols-3 md:gap-y-0">
            {group.map((v, i) => (
              <li
                key={`${g}-${i}`}
                className="md:px-7 md:first:pl-0 md:last:pr-0 md:[&:not(:first-child)]:border-l md:[&:not(:first-child)]:border-marigold/50"
              >
                <figure>
                  <Image
                    src={v.image.src}
                    alt={v.image.alt}
                    width={192}
                    height={192}
                    className="size-[4.5rem] rounded-full object-cover ring-2 ring-marigold"
                  />
                  <blockquote className="mt-5 mb-4 text-[1.1rem] leading-relaxed text-ink">
                    <p>&ldquo;{v.quote}&rdquo;</p>
                  </blockquote>
                  <figcaption>
                    <span className="block font-sans text-[1rem] font-semibold text-ink">{v.name}</span>
                    {v.context ? <span className="block font-sans text-sm text-ink-faint">{v.context}</span> : null}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </Page>
      ))}
    </Section>
  );
}

// ---------------------------------------------------------------------------
// 7. Begin
// ---------------------------------------------------------------------------

const BEGIN_CHOICES: { audience: Audience; title: string; detail: string }[] = [
  { audience: 'child', title: 'My child', detail: 'From three and a half to seventeen.' },
  { audience: 'adult', title: 'Myself', detail: 'Beginning, or returning after years away.' },
  { audience: 'community', title: 'A batch in my community', detail: 'We teach inside apartment complexes.' },
];

export function HomeBegin() {
  return (
    <Section id="begin" labelledBy="begin-heading">
      <Page>
        <Heading id="begin-heading" dark>
          {BEGIN.heading}
        </Heading>
        <p className="mt-5 max-w-measure text-[1.05rem] leading-relaxed text-cream/80">
          Choose one, and we will take it from there on the next page.
        </p>

        {/* The first step of /book, on the home page. Each choice carries its
            answer across, so the flow opens on the next question. Set as a list
            of choices to pick from, not three tiles. */}
        <ul className="mt-8 max-w-[42rem] divide-y divide-cream/25 border-y border-cream/25">
          {BEGIN_CHOICES.map((c) => (
            <li key={c.audience}>
              <Link
                href={bookHref({ audience: c.audience, source: 'home-begin' })}
                className="group -mx-3 flex items-center justify-between gap-6 rounded-lg px-3 py-4 transition-colors hover:bg-cream/[0.07]"
              >
                <span>
                  <span className="block font-sans text-[clamp(1.3rem,2.2vw,1.65rem)] leading-tight font-semibold text-cream">
                    {c.title}
                  </span>
                  <span className="mt-1 block text-[1rem] text-cream/75">{c.detail}</span>
                </span>
                <ArrowUpRight
                  className="size-7 shrink-0 text-marigold transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
                  aria-hidden="true"
                />
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-6 max-w-measure text-[0.98rem] leading-relaxed text-cream/80">{BEGIN.note}</p>

        <div className="mt-3 flex flex-wrap gap-x-7 gap-y-1">
          <a
            href={whatsappHref(SITE.phoneE164)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 font-sans text-[0.95rem] font-semibold text-cream hover:text-marigold"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            WhatsApp us
            <span className="sr-only">(opens WhatsApp)</span>
          </a>
          <a
            href={`tel:${SITE.phoneE164}`}
            className="inline-flex min-h-11 items-center gap-2 font-sans text-[0.95rem] font-semibold text-cream hover:text-marigold"
          >
            <Phone className="size-4" aria-hidden="true" />
            {SITE.phoneDisplay}
          </a>
        </div>
      </Page>
    </Section>
  );
}
