import { BRANCHES, FACULTY, FAQS, FOUNDERS, PRIMARY_BRANCH, SITE, type Branch } from './site';
import { TEACHING_PROGRAMMES } from './curriculum';
import { allBatches, areasTaught, offlineVenuesForCity, venuesForCity } from './classes';
import { MUDRAS } from './mudras';
import { PUBLISHABLE_PHOTOS, VIDEOS, videoPoster, youtubeHref } from './events';

/**
 * Schema.org JSON-LD, assembled as a single linked @graph.
 *
 * Everything here resolves to a fact in ./site.ts, ./curriculum.ts or
 * ./classes.ts. One field Google will happily display is deliberately absent
 * because the academy has not published it:
 *
 *   - aggregateRating / review
 *
 * Emitting a fabricated star rating is structured-data misrepresentation and
 * risks a manual action. Fill it in only from genuine, attributable reviews —
 * see components/Testimonials.tsx.
 *
 * openingHoursSpecification is now derived from real batch timings; see
 * `openingHoursFor`.
 */

export type OpeningHours = {
  days: string[];
  opens: string;
  closes: string;
};

/**
 * Kept only for the type export. Hours are derived from ./classes.ts now — do
 * not populate this by hand, or the site will have two disagreeing schedules.
 */
export const HOURS: OpeningHours[] = [];

const abs = (path: string) => new URL(path, SITE.url).toString();

const ID = {
  org: `${SITE.url}/#organization`,
  website: `${SITE.url}/#website`,
  branch: (slug: string) => `${SITE.url}/locations/${slug}#branch`,
  person: (name: string) => `${SITE.url}/#person-${slugify(name)}`,
  course: (id: string) => `${SITE.url}/#course-${id}`,
  faq: `${SITE.url}/#faq`,
};

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function postalAddress(branch: Branch) {
  return {
    '@type': 'PostalAddress',
    ...(branch.streetAddress ? { streetAddress: branch.streetAddress } : {}),
    addressLocality: branch.city,
    ...(branch.locality && branch.locality !== branch.city
      ? { addressSubLocality: branch.locality }
      : {}),
    addressRegion: branch.region,
    ...(branch.postalCode ? { postalCode: branch.postalCode } : {}),
    addressCountry: branch.countryCode,
  };
}

/**
 * Opening hours, derived from the published batch timings in ./classes.ts
 * rather than hand-written.
 *
 * The academy has no reception hours — it has batches. So each branch's
 * specification is the union of its venues' batch slots, merged per weekday into
 * a single earliest-open / latest-close window. That is what the spec is for
 * (when can someone turn up and find us there) and it stays truthful without
 * anyone maintaining a second list.
 *
 * Batches marked `provisionalTiming` are excluded: Canada's slots are
 * placeholders, and publishing a guess as structured data would send a parent to
 * a closed door.
 */
function openingHoursFor(citySlug: string) {
  const slots = venuesForCity(citySlug)
    .filter((v) => v.mode === 'offline')
    .flatMap((v) => v.batches)
    .filter((b) => !b.provisionalTiming);

  if (slots.length === 0) return {};

  const byDay = new Map<string, { opens: string; closes: string }>();
  for (const batch of slots) {
    for (const day of batch.days) {
      const current = byDay.get(day);
      if (!current) {
        byDay.set(day, { opens: batch.opens, closes: batch.closes });
        continue;
      }
      byDay.set(day, {
        opens: batch.opens < current.opens ? batch.opens : current.opens,
        closes: batch.closes > current.closes ? batch.closes : current.closes,
      });
    }
  }

  return {
    openingHoursSpecification: [...byDay.entries()].map(([day, window]) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: `https://schema.org/${day}`,
      opens: window.opens,
      closes: window.closes,
    })),
  };
}

function branchNode(branch: Branch) {
  return {
    '@type': ['DanceSchool', 'LocalBusiness'],
    '@id': ID.branch(branch.slug),
    name: `${SITE.name} — ${branch.label}`,
    parentOrganization: { '@id': ID.org },
    url: abs(`/locations/${branch.slug}`),
    image: abs(branch.image),
    description: branch.intro,
    address: postalAddress(branch),
    ...(branch.geo
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: branch.geo.lat,
            longitude: branch.geo.lng,
          },
        }
      : {}),
    telephone: branch.contact?.phoneE164 ?? SITE.phoneE164,
    email: branch.contact?.email ?? SITE.email,
    areaServed: branch.areaServed.map((name) => ({ '@type': 'Place', name })),
    ...(branch.head
      ? { employee: { '@type': 'Person', name: branch.head } }
      : {}),
    knowsAbout: ['Bharatanatyam', SITE.style, 'Abhinaya', 'Tala', 'Asamyuta Hasta'],
    ...openingHoursFor(branch.slug),
  };
}

function organizationNode() {
  const founderIds = FOUNDERS.map((f) => ({ '@id': ID.person(f.name) }));
  return {
    '@type': ['DanceSchool', 'EducationalOrganization'],
    '@id': ID.org,
    name: SITE.name,
    legalName: SITE.legalName,
    alternateName: ['Shanti Kala Niketan', 'Shanthi Kala Nikketan'],
    url: SITE.url,
    logo: {
      '@type': 'ImageObject',
      url: abs(SITE.logo),
      width: 320,
      height: 273,
    },
    image: abs(SITE.ogImage),
    foundingDate: SITE.founded,
    slogan: 'Learn... Grow... Spread!',
    description: `${SITE.name} is a Bharatanatyam dance academy teaching the ${SITE.style} through the ${SITE.method} method at five venues across Chennai, with a branch in Scarborough, Canada.`,
    email: SITE.email,
    telephone: SITE.phoneE164,
    address: postalAddress(PRIMARY_BRANCH),
    ...(PRIMARY_BRANCH.geo
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: PRIMARY_BRANCH.geo.lat,
            longitude: PRIMARY_BRANCH.geo.lng,
          },
        }
      : {}),
    founder: founderIds,
    employee: FACULTY.map((f) => ({ '@id': ID.person(f.name) })),
    location: BRANCHES.map((b) => ({ '@id': ID.branch(b.slug) })),
    areaServed: BRANCHES.flatMap((b) => b.areaServed).map((name) => ({ '@type': 'Place', name })),
    sameAs: [SITE.socials.instagram, SITE.socials.facebook, SITE.socials.youtube],
    knowsAbout: [
      'Bharatanatyam',
      'Kalakshetra style',
      'Gurukulam education',
      'Abhinaya',
      'Tala',
      'Adavu',
      'Arangetram',
      'Asamyuta Hasta',
      'Abhinaya Darpana',
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Bharatanatyam programmes',
      itemListElement: TEACHING_PROGRAMMES.map((programme) => ({
        '@type': 'Offer',
        itemOffered: { '@id': ID.course(programme.id) },
      })),
    },
    ...openingHoursFor(PRIMARY_BRANCH.slug),
  };
}

function personNodes() {
  return [...FOUNDERS, ...FACULTY].map((p) => ({
    '@type': 'Person',
    '@id': ID.person(p.name),
    name: p.name,
    ...(p.role ? { jobTitle: p.role } : {}),
    description: p.bio,
    image: abs(p.image),
    worksFor: { '@id': ID.org },
    ...(p.credentials?.length ? { hasCredential: p.credentials } : {}),
  }));
}

function courseNodes() {
  return TEACHING_PROGRAMMES.map((programme) => ({
    '@type': 'Course',
    '@id': ID.course(programme.id),
    name: `${programme.label} — ${programme.name}`,
    description: programme.description,
    ...(programme.ages ? { typicalAgeRange: programme.ages.replace(/^Ages\s*/, '') } : {}),
    inLanguage: 'en',
    teaches: [...programme.repertoire, ...programme.develops],
    educationalLevel: programme.label,
    provider: { '@id': ID.org },
    courseMode: ['onsite', 'online'],
    /**
     * One CourseInstance per real batch, carrying its actual weekly schedule.
     * The previous build emitted one instance per branch with no schedule at
     * all, which told Google nothing a parent could act on.
     *
     * Provisional timings are excluded — see openingHoursFor.
     */
    hasCourseInstance: allBatches()
      .filter(({ programme: p, batch }) => p.id === programme.id && !batch.provisionalTiming)
      .map(({ venue, batch }) => ({
        '@type': 'CourseInstance',
        name: `${programme.label} — ${venue.name} (${batch.code})`,
        courseMode: venue.mode === 'online' ? 'online' : 'onsite',
        courseSchedule: {
          '@type': 'Schedule',
          byDay: batch.days.map((d) => `https://schema.org/${d}`),
          startTime: batch.opens,
          endTime: batch.closes,
          repeatFrequency: 'P1W',
          scheduleTimezone: venue.citySlug === 'scarborough' ? 'America/Toronto' : 'Asia/Kolkata',
        },
        ...(venue.mode === 'online'
          ? {}
          : { location: { '@id': ID.branch(venue.citySlug) } }),
      })),
    /**
     * No `price` here on purpose. The previous build asserted a free trial at
     * price 0, which the academy has never published. An unverified price in
     * Offer markup is exactly the kind of claim that earns a manual action.
     */
    offers: {
      '@type': 'Offer',
      category: 'Trial session',
      availability: 'https://schema.org/InStock',
      url: abs('/#book'),
    },
  }));
}

function faqNode() {
  return {
    '@type': 'FAQPage',
    '@id': ID.faq,
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

function websiteNode() {
  return {
    '@type': 'WebSite',
    '@id': ID.website,
    url: SITE.url,
    name: SITE.name,
    inLanguage: 'en',
    publisher: { '@id': ID.org },
  };
}

/** The graph emitted on the home page. */
export function homeGraph() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      organizationNode(),
      websiteNode(),
      ...BRANCHES.map(branchNode),
      ...personNodes(),
      ...courseNodes(),
      faqNode(),
    ],
  };
}

/**
 * The graph emitted on /hastas.
 *
 * A DefinedTermSet is the honest shape for this page: twenty-eight named
 * gestures, each with a documented set of uses drawn from the Abhinaya Darpana.
 * It is also the one page on the site with genuine reference value, so it is
 * worth describing precisely rather than as another WebPage.
 */
export function hastasGraph() {
  const url = abs('/hastas');

  return {
    '@context': 'https://schema.org',
    '@graph': [
      organizationNode(),
      websiteNode(),
      {
        '@type': 'DefinedTermSet',
        '@id': `${url}#termset`,
        name: 'The twenty-eight asamyuta hastas of Bharatanatyam',
        description:
          'The single-hand gestures of Bharatanatyam in the canonical Abhinaya Darpana sequence, with their documented viniyoga as taught at Shanti Kala Nikketan.',
        url,
        inLanguage: ['en', 'sa'],
        publisher: { '@id': ID.org },
        hasDefinedTerm: MUDRAS.map((m) => ({
          '@type': 'DefinedTerm',
          '@id': `${url}#${slugify(m.name)}`,
          name: m.name,
          alternateName: m.literal,
          description: `${m.literal}. Used for: ${m.viniyoga.join(', ')}.`,
          inDefinedTermSet: { '@id': `${url}#termset` },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
          { '@type': 'ListItem', position: 2, name: 'The 28 hastas', item: url },
        ],
      },
    ],
  };
}

export type Faq = { q: string; a: string };

/**
 * The graph emitted on /events.
 *
 * WHAT IS DELIBERATELY NOT HERE
 * -----------------------------
 * `Event` nodes, and `VideoObject` nodes. Both want dates we do not have.
 *
 * Most of these performances are recorded only as a YouTube title, and eight of
 * those titles came from og:title because the videos are unlisted and oEmbed
 * refused them — so there is no reliable `startDate` for an Event and no
 * `uploadDate` for a VideoObject. Emitting either with a guessed date is the same
 * category of mistake as the fabricated star rating this file already refuses to
 * carry, and it would be worse here, because a wrong Event date can put a
 * performance in Google's event listings on a day nothing happens.
 *
 * So the page describes itself honestly: a CollectionPage holding an ItemList of
 * the works it shows. Add VideoObject when the academy confirms upload dates and
 * durations, and Event only for performances still to come.
 *
 * Placeholder photo records are excluded, the same way `openingHoursFor` excludes
 * provisional batch timings — see the policy at the top of lib/events.ts.
 */
export function eventsGraph() {
  const url = abs('/events');

  const photos = PUBLISHABLE_PHOTOS.map((photo, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    item: {
      '@type': 'ImageObject',
      '@id': `${url}#${photo.id}`,
      contentUrl: abs(photo.src),
      name: photo.title,
      description: photo.alt,
      caption: photo.album,
      width: photo.width,
      height: photo.height,
      creditText: SITE.name,
      ...(photo.date ? { datePublished: photo.date } : {}),
    },
  }));

  const recordings = VIDEOS.map((video, i) => ({
    '@type': 'ListItem',
    position: photos.length + i + 1,
    item: {
      '@type': 'CreativeWork',
      '@id': `${url}#video-${video.id}`,
      name: video.title,
      url: youtubeHref(video),
      thumbnailUrl: abs(videoPoster(video).src),
      author: { '@id': ID.org },
      inLanguage: 'en',
    },
  }));

  return {
    '@context': 'https://schema.org',
    '@graph': [
      organizationNode(),
      websiteNode(),
      {
        '@type': ['CollectionPage', 'ImageGallery'],
        '@id': `${url}#collection`,
        url,
        name: 'Events & Gallery',
        description:
          'Udaan, the academy\u2019s own showcase, with Arangetrams, temple festivals and performances \u2014 photographs and recordings from Shanti Kala Nikketan\u2019s own stages.',
        isPartOf: { '@id': ID.website },
        publisher: { '@id': ID.org },
        about: { '@id': ID.org },
        mainEntity: {
          '@type': 'ItemList',
          '@id': `${url}#items`,
          numberOfItems: photos.length + recordings.length,
          itemListOrder: 'https://schema.org/ItemListUnordered',
          itemListElement: [...photos, ...recordings],
        },
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
          { '@type': 'ListItem', position: 2, name: 'Events & gallery', item: url },
        ],
      },
    ],
  };
}

/** Location-specific questions, generated from the branch's own facts. */
export function locationFaqs(branch: Branch): Faq[] {
  const venues = offlineVenuesForCity(branch.slug);
  const areas = areasTaught(branch.slug);
  const catchmentOnly = branch.areaServed.filter((a) => !areas.includes(a));

  return [
    {
      q: `Where is your Bharatanatyam class in ${branch.city}?`,
      a:
        venues.length > 1
          ? `We teach at ${venues.length} venues across ${branch.city}: ${venues
              .map((v) => `${v.name}${v.area ? ` (${v.area})` : ''}`)
              .join(', ')}. The exact venue is shared when your trial is booked.`
          : branch.streetAddress
            ? `Our ${branch.city} school is at ${branch.streetAddress}, ${branch.city} ${branch.postalCode ?? ''}. ${branch.landmarks.length ? `Look for ${branch.landmarks[0]}.` : ''}`.trim()
            : `We teach in ${branch.city}${branch.locality ? ` at ${branch.locality}` : ''}. Write to ${SITE.email} for the current venue and batch timings.`,
    },
    {
      q: `Which areas around ${branch.city} do your students come from?`,
      a:
        areas.length > 0
          ? `We hold classes in ${areas.join(', ')}. Students also travel to us from ${catchmentOnly.join(', ')} — those are catchment neighbourhoods rather than venues.`
          : `Students travel to us from ${branch.areaServed.join(', ')}.`,
    },
    {
      q: `What style of Bharatanatyam is taught in ${branch.city}?`,
      a: `The ${SITE.style}, taught through the ${SITE.method} method — identical to our founding school in Chennai${branch.head ? `, under ${branch.head}` : ''}.`,
    },
    {
      q: `Can my child start Bharatanatyam in ${branch.city} with no experience?`,
      a: `Yes. Our Introductory Programme assumes nothing at all and takes children from age 3.5, and adults are welcome as beginners too. Bring comfortable clothes to a trial — no costume and no ghungroo needed.`,
    },
  ];
}

/** The graph emitted on a location page. */
export function locationGraph(branch: Branch) {
  const url = abs(`/locations/${branch.slug}`);

  return {
    '@context': 'https://schema.org',
    '@graph': [
      organizationNode(),
      websiteNode(),
      branchNode(branch),
      {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE.url },
          { '@type': 'ListItem', position: 2, name: 'Locations', item: abs('/locations') },
          { '@type': 'ListItem', position: 3, name: branch.label, item: url },
        ],
      },
      {
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        mainEntity: locationFaqs(branch).map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  };
}
