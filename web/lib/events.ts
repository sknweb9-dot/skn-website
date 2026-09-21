/**
 * Events and gallery — single source of truth for /events.
 *
 * PROVENANCE
 * ----------
 * The video records below are transcribed from the old site's /events page,
 * reconstructed from `_research/pages/events.html` by DOM order and
 * cross-referenced with `_research/youtube.txt` and `_research/alts.txt`. The
 * page paired each item as a YouTube link immediately followed by its poster
 * image, in these sections:
 *
 *   Udaan          two playlists, preceded by the manifesto copy in UDAAN below
 *   Arangetrams    three videos
 *   Performances   Group (four), then Solo (one)
 *   Outreach       one video
 *
 * Two honesty flags ride along with each record, and both matter:
 *
 *   `titleSource`  Eight of the eleven titles came from og:title because oEmbed
 *                  returned 401 — those videos are unlisted. The titles are
 *                  therefore scraped, not supplied by the academy. Anything
 *                  marked 'og-title' should be confirmed before print.
 *   `pairingUnconfirmed`
 *                  Two image/video pairings look wrong even though the DOM has
 *                  them adjacent: the Maha Shivaratri video sits with
 *                  `Mylapore pgrm.jpg`, and the Samarpanam video with
 *                  `5. Sept Athma Academy.JPG`. Those numeric prefixes — 3., 5.,
 *                  6. — imply an owner-maintained series whose items 1, 2 and 4
 *                  never appeared on the page. The pairing is transcribed
 *                  exactly as found rather than silently reinterpreted.
 *
 * THE PLACEHOLDER POLICY — read before adding anything
 * ---------------------------------------------------
 * lib/site.ts opens with "do not add unsourced claims here", because this data
 * feeds both the visible copy and the Schema.org graph. The photo records break
 * that rule on purpose, under containment, so the globe has enough plates to be
 * worth building before the academy's real albums arrive.
 *
 * `placeholder: true` means THE CAPTION IS INVENTED — the album, the title and
 * the date. The photograph itself is always genuine and always the academy's
 * own; nothing here is stock. Invented albums are drawn only from events we know
 * happened, so the smallest possible fiction is "this photo is from that event"
 * rather than "that event existed".
 *
 * Three mechanisms keep the fiction from escaping:
 *
 *   1. `eventsGraph()` in lib/schema.ts emits no placeholder record, the same
 *      way `openingHoursFor` excludes provisional batch timings.
 *   2. `verifyEvents()` at the foot of this file throws at module load in
 *      production if any placeholder survives, so a deploy fails rather than
 *      publishing invention.
 *   3. `PROTOTYPE_FILL` is a single call. Delete it and the array shrinks to
 *      what is real.
 *
 * TO REPLACE WITH THE REAL ALBUMS
 * -------------------------------
 *   1. Drop the photographs into `web/public/img/gallery/`.
 *   2. Add a REAL_PHOTOS record each, with whatever album/date is known.
 *   3. Delete the PROTOTYPE_FILL spread from PHOTOS.
 *   4. Run `_research/make_globe_plates.ps1` to cut the 512px globe plates.
 */

import { SITE } from './site';

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

/**
 * The old page's own structure. `studio` is the one addition: class and
 * rehearsal photographs that are not from a named performance, which the old
 * site kept on a separate /photos page.
 */
export type EventSection = 'udaan' | 'arangetram' | 'group' | 'solo' | 'outreach' | 'studio';

export type SectionMeta = {
  id: EventSection;
  /** Heading used on the page */
  heading: string;
  eyebrow: string;
  /** Short label for the globe's filter row */
  filter: string;
  lede?: string;
};

export const SECTIONS: SectionMeta[] = [
  {
    id: 'udaan',
    eyebrow: 'Our own showcase',
    heading: 'Udaan — flying high to reach our goals',
    filter: 'Udaan',
    lede: 'Created so that every dancer has a stage, irrespective of their stage of learning. Editions in 2023 and 2025.',
  },
  {
    id: 'arangetram',
    eyebrow: 'The debut',
    heading: 'Arangetrams',
    filter: 'Arangetrams',
    lede: 'The formal debut that the whole curriculum points towards — a full-length solo, danced once.',
  },
  {
    id: 'group',
    eyebrow: 'Performances',
    heading: 'Group',
    filter: 'Group',
    lede: 'Temple festivals, invited programmes, and the annual music and dance season.',
  },
  {
    id: 'solo',
    eyebrow: 'Performances',
    heading: 'Solo',
    filter: 'Solo',
  },
  {
    id: 'outreach',
    eyebrow: 'Beyond Chennai',
    heading: 'Outreach',
    filter: 'Outreach',
    lede: 'Offerings and appearances on the Toronto temple circuit, where our Scarborough branch teaches.',
  },
  {
    id: 'studio',
    eyebrow: 'In the room',
    heading: 'The studio',
    filter: 'Studio',
    lede: 'Long before a stage, there is a wooden floor and a teacher counting aloud.',
  },
];

export function sectionMeta(id: EventSection): SectionMeta {
  const found = SECTIONS.find((s) => s.id === id);
  if (!found) throw new Error(`Unknown event section: ${id}`);
  return found;
}

/**
 * Filter groups for the globe's control dock.
 *
 * Group and Solo are separate sections on the page, as they were on the old
 * site, but collapse into one filter pill: six pills plus "All" is already the
 * most a phone will carry on one row.
 */
export const GLOBE_FILTERS: { label: string; sections: EventSection[] }[] = [
  { label: 'Udaan', sections: ['udaan'] },
  { label: 'Arangetrams', sections: ['arangetram'] },
  { label: 'Performances', sections: ['group', 'solo'] },
  { label: 'Outreach', sections: ['outreach'] },
  { label: 'Studio', sections: ['studio'] },
];

// ---------------------------------------------------------------------------
// The Udaan manifesto
// ---------------------------------------------------------------------------

/**
 * Verbatim from the old /events page, split into paragraphs at the sentence
 * boundaries the page itself used. Not paraphrased: this copy is the academy's
 * own statement of why Udaan exists, and it is better than anything we would
 * write for it.
 */
export const UDAAN = {
  eyebrow: 'Udaan',
  heading: 'Every dancer deserves a platform',
  body: [
    "Bharatanatyam is a beautiful and intense dance form, believed to be passed on to humans from the Gods! While mastering the art-form requires a 'life-time', every victory in one's path to learning the art should be celebrated.",
    'For us at Shanti Kala Nikketan, Bharatanatyam is a Sadhana that helps in the overall development of one\u2019s character to be a creative and empathetic human being. Every dancer deserves a platform to perform and express themselves, irrespective of their stage of learning!',
    'We are delighted to present \u201cUdaan\u201d as a humble offering to the art-form and as a platform for our dancers at Shanti Kala Nikketan to celebrate their accomplishment of moving one more step closer to learning the art!',
  ],
  /** The second block on the page — why the name. */
  theme: {
    label: 'Why Udaan',
    body: [
      '\u201cUdaan\u201d has been chosen as the theme of our performance to signify \u201cFlying high to reach our goals\u201d. In one\u2019s journey in learning Bharatanatyam, every dancer encounters numerous challenges. These challenges are overcome with more ease in the presence of a Guru.',
      'Like a swan (Hamsa) meticulously separates the milk from a mixture of milk and water, the guiding light of a Guru enables a Sishya to separate and experience the beauty of the art while overcoming challenges, experience freedom to explore and thereby fly to great heights.',
      'Our dancers are ready to enthrall you with their dance! Please have a look at their performance.',
    ],
  },
} as const;

// ---------------------------------------------------------------------------
// Videos
// ---------------------------------------------------------------------------

/** Where a title came from. Only 'academy' is authoritative. */
export type TitleSource = 'oembed' | 'og-title' | 'page-label' | 'academy';

export type EventVideo = {
  /** Stable slug — anchor target and React key */
  id: string;
  section: EventSection;
  title: string;
  titleSource: TitleSource;
  kind: 'video' | 'playlist';
  /** YouTube video id, or playlist id when kind === 'playlist' */
  youtubeId: string;
  /**
   * Unlisted on YouTube: plays when linked or embedded, absent from YouTube
   * search and from the channel's public list. The academy has confirmed these
   * are intended to be publicly reachable.
   */
  unlisted?: boolean;
  /**
   * Poster image, as the old page paired it. Named by SOURCES key rather than
   * by path so the dimensions and the globe plate come from one place — a poster
   * resized or recut then only has to change in SOURCES.
   */
  plateKey: string;
  alt: string;
  /** The DOM pairing of poster to video looks wrong; confirm with the academy */
  pairingUnconfirmed?: boolean;
  /** Shown under the title where there is something worth saying */
  note?: string;
};

export const VIDEOS: EventVideo[] = [
  // --- Udaan -------------------------------------------------------------
  {
    id: 'udaan-2025',
    section: 'udaan',
    title: 'UDAAN 2025 : Where Tradition Takes Flight',
    titleSource: 'oembed',
    kind: 'playlist',
    youtubeId: 'PLxyyMzhr0f3HS1_wu0bBvbhbLQolDyjzr',
    plateKey: 'udaan-2025-poster',
    alt: 'Poster for Udaan 2025, Where Tradition Takes Flight',
    note: 'The full 2025 edition, as a playlist.',
  },
  {
    id: 'udaan-2023',
    section: 'udaan',
    title: "UDAAN - FLYING HIGH - October '23",
    titleSource: 'og-title',
    kind: 'playlist',
    youtubeId: 'PLxyyMzhr0f3E-5yEp3Whr3hsbz6wC6GsO',
    unlisted: true,
    plateKey: 'udaan-2023-poster',
    alt: 'Poster for Udaan 2023, Flying High',
    note: 'The first edition. Labelled simply \u201cUdaan 2023\u201d on the old site.',
  },

  // --- Arangetrams -------------------------------------------------------
  {
    id: 'arangetram-aparna',
    section: 'arangetram',
    title: 'Kum Aparna Manu | First Student | Bharatanatyam Arangetram',
    titleSource: 'oembed',
    kind: 'video',
    youtubeId: 'eAIGMW4FPY4',
    plateKey: 'aparna',
    alt: 'Aparna Manu in Bharatanatyam costume for her Arangetram',
    note: 'The academy\u2019s first student to reach her debut.',
  },
  {
    id: 'arangetram-kirusanthini',
    section: 'arangetram',
    title: 'Smt Kirusanthini | Bharatanatyam Arangetram',
    titleSource: 'og-title',
    kind: 'video',
    youtubeId: 'wt4wETJMaXI',
    unlisted: true,
    plateKey: 'arangetram-k',
    alt: 'Invitation for Smt Kirusanthini\u2019s Bharatanatyam Arangetram',
    note: 'Now head of the Scarborough branch.',
  },
  {
    id: 'arangetram-jahnavi',
    section: 'arangetram',
    title: 'Kum Jahnavi | Arangetram | A Journey of Grace, Rhythm & Devotion',
    titleSource: 'og-title',
    kind: 'video',
    youtubeId: 'wmnYYbxA950',
    unlisted: true,
    plateKey: 'arangetram-j',
    alt: 'Invitation for Kum Jahnavi\u2019s Bharatanatyam Arangetram',
  },

  // --- Performances / Group ---------------------------------------------
  {
    id: 'jeevan-utsav-2022',
    section: 'group',
    title: 'Jeevan Utsav 2022 | A Celebration of Life through Dance',
    titleSource: 'oembed',
    kind: 'playlist',
    youtubeId: 'PLxyyMzhr0f3HXB2Wls5HDTlEqUM6oLTUc',
    plateKey: 'festival',
    alt: 'Flyer for a Shanti Kala Nikketan festival programme',
  },
  {
    id: 'maha-shivaratri',
    section: 'group',
    title: 'Offering to Lord Shiva on Maha Shivaratri',
    titleSource: 'og-title',
    kind: 'video',
    youtubeId: 'x_zWuJIvNng',
    unlisted: true,
    pairingUnconfirmed: true,
    plateKey: 'mylapore',
    alt: 'Programme notice for a performance at Bharatiya Vidya Bhavan, Mylapore',
    note: 'Poster and video pairing taken from the old page\u2019s DOM order; the poster names Mylapore.',
  },
  {
    id: 'samarpanam-navratri-2025',
    section: 'group',
    title: 'Samarpanam Festival, Navratri 2025',
    titleSource: 'og-title',
    kind: 'video',
    youtubeId: 'uLpZ8hUFLZY',
    unlisted: true,
    pairingUnconfirmed: true,
    plateKey: 'athma',
    alt: 'Shanti Kala Nikketan dancers performing at an invited programme',
    note: 'Poster and video pairing taken from the old page\u2019s DOM order.',
  },
  {
    id: 'nada-sudha-27',
    section: 'group',
    title: 'Nada Sudha - 27th Annual Music & Dance Festival 2025 - 2026',
    titleSource: 'og-title',
    kind: 'video',
    youtubeId: 'RDW0MOFKFhY',
    unlisted: true,
    plateKey: 'nadasudha',
    alt: 'Shanti Kala Nikketan at the Nada Sudha annual music and dance festival',
  },

  // --- Performances / Solo ----------------------------------------------
  {
    id: 'aparna-solo',
    section: 'solo',
    title: "Aparna Manu's Solo Performance",
    titleSource: 'og-title',
    kind: 'video',
    youtubeId: 'iD-Lf0YD8RY',
    unlisted: true,
    plateKey: 'jun2024',
    alt: 'Aparna Manu performing a Bharatanatyam solo',
  },

  // --- Outreach ----------------------------------------------------------
  {
    id: 'toronto-vinayaka-2025',
    section: 'outreach',
    title: 'Bharatanatyam Offering to Lord Vinayaka | Kirusanthini | Toronto Temple Festival 2025',
    titleSource: 'og-title',
    kind: 'video',
    youtubeId: 'cQS1QZo-Eyk',
    unlisted: true,
    plateKey: 'canada',
    alt: 'Shanti Kala Nikketan dancers at a Toronto temple festival',
  },
];

/** The poster, resolved from SOURCES. */
export function videoPoster(video: EventVideo): {
  src: string;
  width: number;
  height: number;
  alt: string;
} {
  const s = source(video.plateKey);
  return { src: s.src, width: s.width, height: s.height, alt: video.alt };
}

/** Watch or playlist URL. Built rather than stored so the shape stays uniform. */
export function youtubeHref(video: EventVideo): string {
  return video.kind === 'playlist'
    ? `https://www.youtube.com/playlist?list=${video.youtubeId}`
    : `https://www.youtube.com/watch?v=${video.youtubeId}`;
}

/**
 * Privacy-preserving embed URL.
 *
 * youtube-nocookie.com does not set tracking cookies until playback begins,
 * which matters on a page about children. `rel=0` keeps the end screen to this
 * channel rather than offering whatever YouTube feels like next.
 */
export function youtubeEmbed(video: EventVideo): string {
  const base = 'https://www.youtube-nocookie.com/embed';
  return video.kind === 'playlist'
    ? `${base}/videoseries?list=${video.youtubeId}&rel=0`
    : `${base}/${video.youtubeId}?rel=0`;
}

export function videosBySection(section: EventSection): EventVideo[] {
  return VIDEOS.filter((v) => v.section === section);
}

// ---------------------------------------------------------------------------
// Photographs
// ---------------------------------------------------------------------------

export type Photo = {
  id: string;
  section: EventSection;
  /** Shown in the hover label and the detail panel */
  title: string;
  album: string;
  /** Year or ISO date. Omitted where genuinely unknown. */
  date?: string;
  /** Full-size source, used in the detail panel */
  src: string;
  width: number;
  height: number;
  alt: string;
  /**
   * 512x512 plate for the globe texture, cut by
   * `_research/make_globe_plates.ps1`. Derived from the source image, so
   * several records may share one plate.
   */
  plate: string;
  /**
   * The CAPTION is invented — album, title, date. The photograph is genuine and
   * the academy's own. See the placeholder policy at the top of this file.
   */
  placeholder?: boolean;
};

/**
 * Every photograph available, with its real pixel dimensions.
 *
 * Kept separate from the Photo records because the prototype fill reuses these
 * sources, and because one source may legitimately appear in more than one
 * album once the real albums land.
 */
type Source = { key: string; src: string; width: number; height: number };

const SOURCES: Source[] = [
  { key: 'udaan-2025-poster', src: '/img/event-udaan-2025.jpg', width: 867, height: 1300 },
  { key: 'udaan-2023-poster', src: '/img/event-udaan-2023.jpg', width: 900, height: 600 },
  { key: 'aparna', src: '/img/event-aparna.jpg', width: 846, height: 900 },
  { key: 'arangetram-k', src: '/img/event-arangetram-k.jpg', width: 567, height: 567 },
  { key: 'arangetram-j', src: '/img/event-arangetram-j.jpg', width: 567, height: 567 },
  { key: 'festival', src: '/img/event-festival.jpg', width: 900, height: 899 },
  { key: 'mylapore', src: '/img/event-mylapore.jpg', width: 900, height: 900 },
  { key: 'athma', src: '/img/event-athma.jpg', width: 900, height: 675 },
  { key: 'nadasudha', src: '/img/event-nadasudha.jpg', width: 900, height: 675 },
  { key: 'jun2024', src: '/img/event-jun2024.jpg', width: 642, height: 900 },
  { key: 'canada', src: '/img/event-canada.jpg', width: 900, height: 506 },
  { key: 'ensemble', src: '/img/ensemble.jpg', width: 1600, height: 1067 },
  { key: 'embrace', src: '/img/embrace-dance.jpg', width: 1800, height: 970 },
  { key: 'gallery-1', src: '/img/gallery-1.jpg', width: 1400, height: 1256 },
  { key: 'gallery-2', src: '/img/gallery-2.jpg', width: 1400, height: 1400 },
  { key: 'gallery-3', src: '/img/gallery-3.jpg', width: 1400, height: 1400 },
  { key: 'stage-1', src: '/img/stage-1-intro.jpg', width: 970, height: 700 },
  { key: 'stage-2', src: '/img/stage-2-foundation.jpg', width: 999, height: 667 },
  { key: 'stage-3', src: '/img/stage-3-strength.jpg', width: 999, height: 666 },
  { key: 'stage-4', src: '/img/stage-4-transition.jpg', width: 1000, height: 667 },
  { key: 'stage-5', src: '/img/stage-5-expression.jpg', width: 1000, height: 627 },
  { key: 'stage-6', src: '/img/stage-6-maturity.jpg', width: 1000, height: 667 },
  { key: 'stage-7', src: '/img/stage-7-arangetram.jpg', width: 1000, height: 666 },
  { key: 'hero-events', src: '/img/hero-events.jpg', width: 2000, height: 1333 },
  { key: 'hero-photos', src: '/img/hero-photos.jpg', width: 2000, height: 1335 },
  { key: 'hero-gurukulam', src: '/img/hero-gurukulam.jpg', width: 2000, height: 1335 },
  { key: 'hero-skn', src: '/img/hero-skn.jpg', width: 1999, height: 1141 },
  { key: 'hero-videos', src: '/img/hero-videos.jpg', width: 2000, height: 1333 },
];

const SOURCE_BY_KEY = new Map(SOURCES.map((s) => [s.key, s]));

function source(key: string): Source {
  const found = SOURCE_BY_KEY.get(key);
  if (!found) throw new Error(`Unknown photo source: ${key}`);
  return found;
}

/** Globe plate path for a source key. Cut by make_globe_plates.ps1. */
export function platePath(key: string): string {
  return `/img/globe/${key}.webp`;
}

/** Plate edge, in pixels. Square and power-of-two so mipmaps are clean. */
export const PLATE_SIZE = 512;

/** Every distinct plate the globe may need to fetch. */
export const PLATE_KEYS = SOURCES.map((s) => s.key);

/**
 * Photographs whose album and subject are known from the old site.
 *
 * These are the eleven posters and stills that /events itself published, so the
 * album and the title are the academy's own words. No placeholder flag.
 */
const REAL_PHOTOS: Photo[] = [
  {
    id: 'p-udaan-2025-poster',
    section: 'udaan',
    title: 'Where Tradition Takes Flight',
    album: 'Udaan 2025',
    date: '2025',
    alt: 'Poster for Udaan 2025, Where Tradition Takes Flight',
    ...plate('udaan-2025-poster'),
  },
  {
    id: 'p-udaan-2023-poster',
    section: 'udaan',
    title: 'Flying High',
    album: 'Udaan 2023',
    date: '2023-10',
    alt: 'Poster for Udaan 2023, Flying High',
    ...plate('udaan-2023-poster'),
  },
  {
    id: 'p-aparna',
    section: 'arangetram',
    title: 'Aparna Manu — the academy’s first Arangetram',
    album: 'Arangetrams',
    alt: 'Aparna Manu in Bharatanatyam costume for her Arangetram',
    ...plate('aparna'),
  },
  {
    id: 'p-arangetram-k',
    section: 'arangetram',
    title: 'Smt Kirusanthini — Arangetram',
    album: 'Arangetrams',
    alt: 'Invitation for Smt Kirusanthini’s Bharatanatyam Arangetram',
    ...plate('arangetram-k'),
  },
  {
    id: 'p-arangetram-j',
    section: 'arangetram',
    title: 'Kum Jahnavi — Arangetram',
    album: 'Arangetrams',
    alt: 'Invitation for Kum Jahnavi’s Bharatanatyam Arangetram',
    ...plate('arangetram-j'),
  },
  {
    id: 'p-festival',
    section: 'group',
    title: 'Festival programme',
    album: 'Performances',
    alt: 'Flyer for a Shanti Kala Nikketan festival programme',
    ...plate('festival'),
  },
  {
    id: 'p-mylapore',
    section: 'group',
    title: 'Bharatiya Vidya Bhavan, Mylapore',
    album: 'Performances',
    alt: 'Programme notice for a performance at Bharatiya Vidya Bhavan, Mylapore',
    ...plate('mylapore'),
  },
  {
    id: 'p-athma',
    section: 'group',
    title: 'Invited programme',
    album: 'Performances',
    alt: 'Shanti Kala Nikketan dancers performing at an invited programme',
    ...plate('athma'),
  },
  {
    id: 'p-nadasudha',
    section: 'group',
    title: 'Nada Sudha — 27th Annual Music & Dance Festival',
    album: 'Performances',
    date: '2025',
    alt: 'Shanti Kala Nikketan at the Nada Sudha annual music and dance festival',
    ...plate('nadasudha'),
  },
  {
    id: 'p-jun2024',
    section: 'solo',
    title: 'Aparna Manu — solo',
    album: 'Performances',
    alt: 'Aparna Manu performing a Bharatanatyam solo',
    ...plate('jun2024'),
  },
  {
    id: 'p-canada',
    section: 'outreach',
    title: 'Toronto temple festival',
    album: 'Outreach',
    date: '2025',
    alt: 'Shanti Kala Nikketan dancers at a Toronto temple festival',
    ...plate('canada'),
  },
];

/** Spreads a source's src/width/height/plate into a Photo record. */
function plate(key: string): Pick<Photo, 'src' | 'width' | 'height' | 'plate'> {
  const s = source(key);
  return { src: s.src, width: s.width, height: s.height, plate: platePath(key) };
}

// ---------------------------------------------------------------------------
// Prototype fill — DELETE WHEN THE REAL ALBUMS ARRIVE
// ---------------------------------------------------------------------------

/**
 * Enough plates for the sphere to read as a sphere.
 *
 * Below roughly sixty, a Fibonacci sphere looks like a scattering rather than a
 * globe, and the whole point of the layout is even density. Ninety-six is
 * comfortable at the radius the globe uses and still cheap: the plates are
 * shared across records, so this costs texture memory for twenty-eight images,
 * not ninety-six.
 */
const FILL_TARGET = 96;

/**
 * Albums for invented captions.
 *
 * Every album named here is an event we have evidence actually happened — from
 * the old /events page or `_research/youtube.txt`. The invention is only which
 * photograph belongs to which, which is why the flag is on the record and not on
 * the album list. The studio entries describe what is visibly in the frame and
 * claim no event at all.
 */
const FILL_ALBUMS: { album: string; section: EventSection; date?: string; titles: string[] }[] = [
  {
    album: 'Udaan 2025',
    section: 'udaan',
    date: '2025',
    titles: ['Curtain up', 'Alarippu', 'The full ensemble', 'Jatiswaram', 'Finale', 'Taking the stage'],
  },
  {
    album: 'Udaan 2023',
    section: 'udaan',
    date: '2023-10',
    titles: ['Opening invocation', 'Shabdam', 'Group formation', 'The youngest dancers', 'Curtain call'],
  },
  {
    album: 'Arangetrams',
    section: 'arangetram',
    titles: ['Varnam', 'Padam', 'Alankāram before the stage', 'The Guru’s blessing', 'Thillana'],
  },
  {
    album: 'Jeevan Utsav 2022',
    section: 'group',
    date: '2022',
    titles: ['A Celebration of Life through Dance', 'Ensemble', 'Nattuvangam and orchestra'],
  },
  {
    album: 'Nada Sudha Festival',
    section: 'group',
    date: '2025',
    titles: ['27th Annual Music & Dance Festival', 'On the Nada Sudha stage'],
  },
  {
    album: 'Maha Shivaratri',
    section: 'group',
    titles: ['Offering to Lord Shiva', 'Night of the offering'],
  },
  {
    album: 'Samarpanam, Navratri',
    section: 'group',
    date: '2025',
    titles: ['Navratri offering', 'Samarpanam Festival'],
  },
  {
    album: 'Bharatiya Vidya Bhavan, Mylapore',
    section: 'group',
    titles: ['Mylapore programme', 'Before the lamp'],
  },
  {
    album: 'Solo performances',
    section: 'solo',
    titles: ['Abhinaya', 'A held pose', 'Araimandi'],
  },
  {
    album: 'Toronto Temple Festival',
    section: 'outreach',
    date: '2025',
    titles: ['Offering to Lord Vinayaka', 'Scarborough dancers', 'On the temple circuit'],
  },
  {
    album: 'In the studio',
    section: 'studio',
    titles: [
      'Adavu practice',
      'Counting aloud',
      'Araimandi, held',
      'Hasta drill',
      'The wooden floor',
      'Correction in progress',
      'Tala on the palm',
      'Barefoot, first position',
      'Learning the shloka',
      'Class in session',
    ],
  },
];

/**
 * Pads the real records out to FILL_TARGET, cycling the available photographs
 * and the album list. Deterministic — no randomness — so the sphere is
 * identical between server render and hydration, and between builds.
 */
function prototypeFill(realCount: number): Photo[] {
  const needed = Math.max(0, FILL_TARGET - realCount);
  const out: Photo[] = [];

  // Flatten the album list into (album, title) pairs so captions do not repeat
  // until every title in every album has been used once.
  const captions = FILL_ALBUMS.flatMap((a) =>
    a.titles.map((title) => ({ album: a.album, section: a.section, date: a.date, title })),
  );

  for (let i = 0; i < needed; i += 1) {
    const caption = captions[i % captions.length];
    // Offset the source cycle against the caption cycle so the same photograph
    // does not land under the same caption on every lap.
    const src = SOURCES[(i * 7 + 3) % SOURCES.length];
    const lap = Math.floor(i / captions.length);

    out.push({
      id: `fill-${i.toString().padStart(3, '0')}`,
      section: caption.section,
      title: lap === 0 ? caption.title : `${caption.title} (${lap + 1})`,
      album: caption.album,
      ...(caption.date ? { date: caption.date } : {}),
      src: src.src,
      width: src.width,
      height: src.height,
      plate: platePath(src.key),
      alt: `Shanti Kala Nikketan — ${caption.title}`,
      placeholder: true,
    });
  }

  return out;
}

const PROTOTYPE_FILL = prototypeFill(REAL_PHOTOS.length);

/** Every plate on the globe, real records first. */
export const PHOTOS: Photo[] = [...REAL_PHOTOS, ...PROTOTYPE_FILL];

/** Records safe to publish as a claim — used by eventsGraph(). */
export const PUBLISHABLE_PHOTOS: Photo[] = PHOTOS.filter((p) => !p.placeholder);

export function photosBySection(section: EventSection): Photo[] {
  return PHOTOS.filter((p) => p.section === section);
}

/** Distinct album names, in first-appearance order. */
export function albums(): string[] {
  return [...new Set(PHOTOS.map((p) => p.album))];
}

export const PHOTO_COUNT = PHOTOS.length;

/** True while any caption on the page is invented. Drives the dev-only notice. */
export const HAS_PLACEHOLDERS = PHOTOS.some((p) => p.placeholder);

// ---------------------------------------------------------------------------
// The globe's view of all this
// ---------------------------------------------------------------------------

/**
 * One flat list of everything the sphere carries.
 *
 * Photographs and videos sit on the same globe because a visitor spinning it is
 * looking for "what has the academy done", not sorting media types. What keeps
 * that honest is `kind`: a video plate is drawn with a play glyph and its hover
 * label says so, because a plate that zooms and a plate that leaves for YouTube
 * must not look identical.
 */
export type GlobeItem = {
  id: string;
  kind: 'photo' | 'video';
  section: EventSection;
  title: string;
  /** Album name for a photograph; the destination for a video. */
  subtitle: string;
  /** 512px square texture */
  plate: string;
  /** Full-size image for the detail panel */
  src: string;
  width: number;
  height: number;
  alt: string;
  /** Present only on videos */
  href?: string;
  /** Anchor for the matching entry in the page's editorial sections */
  anchor: string;
  placeholder?: boolean;
};

/**
 * Videos are spread through the photographs rather than grouped at the front.
 *
 * Fibonacci index determines position on the sphere, so a contiguous block of
 * videos would land as a contiguous patch — eleven play glyphs clustered on one
 * face, and none anywhere else. Interleaving at a regular stride scatters them
 * evenly, which is both better looking and more useful: whichever way the sphere
 * is turned, there is something to watch in view.
 */
export function globeItems(): GlobeItem[] {
  const photos: GlobeItem[] = PHOTOS.map((p) => ({
    id: p.id,
    kind: 'photo' as const,
    section: p.section,
    title: p.title,
    subtitle: p.date ? `${p.album} · ${p.date}` : p.album,
    plate: p.plate,
    src: p.src,
    width: p.width,
    height: p.height,
    alt: p.alt,
    anchor: `#${p.section}`,
    ...(p.placeholder ? { placeholder: true as const } : {}),
  }));

  const videos: GlobeItem[] = VIDEOS.map((v) => {
    const poster = videoPoster(v);
    return {
      id: `v-${v.id}`,
      kind: 'video' as const,
      section: v.section,
      title: v.title,
      subtitle: v.kind === 'playlist' ? 'Playlist — opens YouTube' : 'Video — opens YouTube',
      plate: platePath(v.plateKey),
      src: poster.src,
      width: poster.width,
      height: poster.height,
      alt: poster.alt,
      href: youtubeHref(v),
      anchor: `#video-${v.id}`,
    };
  });

  if (videos.length === 0) return photos;

  const stride = Math.max(1, Math.floor((photos.length + videos.length) / videos.length));
  const out: GlobeItem[] = [];
  let nextVideo = 0;

  photos.forEach((photo, i) => {
    out.push(photo);
    if (nextVideo < videos.length && (i + 1) % stride === 0) {
      out.push(videos[nextVideo]);
      nextVideo += 1;
    }
  });
  // Anything left over — short photo list, or a stride that did not divide
  // evenly — goes on the end rather than being dropped.
  out.push(...videos.slice(nextVideo));

  return out;
}

export const GLOBE_ITEMS = globeItems();

/** Distinct plate URLs the globe will fetch, for preloading. */
export const GLOBE_PLATES = [...new Set(GLOBE_ITEMS.map((i) => i.plate))];

// ---------------------------------------------------------------------------
// Open Graph
// ---------------------------------------------------------------------------

export const EVENTS_META = {
  title: 'Events & Gallery — Udaan, Arangetrams & Performances',
  description:
    'Udaan, our own showcase created so that every dancer has a stage — with Arangetrams, temple festivals, Nada Sudha, and the Toronto temple circuit. Photographs and recordings from the academy’s own stages.',
  url: `${SITE.url}/events`,
  image: '/img/event-udaan-2025.jpg',
} as const;

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

/**
 * Fail loudly at module load rather than publishing invention.
 *
 * The production check is the important one: a placeholder caption reaching a
 * live page would put an invented album name next to a real photograph of a real
 * child, and the whole point of lib/site.ts's "no unsourced claims" rule is that
 * this data is also structured data. Better a failed deploy than a quiet lie.
 *
 * It is an opt-out rather than a hard stop because the prototype has to be
 * buildable — `next build` runs with NODE_ENV=production, so a hard throw would
 * block the very thing being demonstrated. ALLOW_PLACEHOLDER_GALLERY=true is the
 * deliberate switch; it lives in .env.local and is documented in .env.example,
 * and it must NOT be set in the hosting platform's production environment.
 *
 * Everything else here is the ordinary sort of invariant — unique ids, plates
 * that resolve to a known source, sections that exist.
 */
(function verifyEvents() {
  const ids = new Set<string>();
  for (const record of [...PHOTOS, ...VIDEOS]) {
    if (ids.has(record.id)) throw new Error(`Duplicate events id: ${record.id}`);
    ids.add(record.id);
    if (!SECTIONS.some((s) => s.id === record.section)) {
      throw new Error(`${record.id} has unknown section "${record.section}"`);
    }
  }

  const plateKeys = new Set(PLATE_KEYS.map(platePath));
  for (const photo of PHOTOS) {
    if (!plateKeys.has(photo.plate)) {
      throw new Error(`${photo.id} references plate ${photo.plate}, which no source produces`);
    }
    if (!photo.alt.trim()) throw new Error(`${photo.id} has no alt text`);
  }

  for (const video of VIDEOS) {
    if (!PLATE_KEYS.includes(video.plateKey)) {
      throw new Error(`Video ${video.id} names plate key "${video.plateKey}", which is not in SOURCES`);
    }
    if (!video.alt.trim()) throw new Error(`Video ${video.id} has no alt text`);
  }

  // The interleave must not lose or duplicate anything.
  if (GLOBE_ITEMS.length !== PHOTOS.length + VIDEOS.length) {
    throw new Error(
      `globeItems() returned ${GLOBE_ITEMS.length} items for ${PHOTOS.length} photos ` +
        `and ${VIDEOS.length} videos`,
    );
  }

  // Every section named in a filter must exist, or a pill silently filters to
  // nothing.
  for (const filter of GLOBE_FILTERS) {
    for (const id of filter.sections) {
      if (!SECTIONS.some((s) => s.id === id)) {
        throw new Error(`Filter "${filter.label}" names unknown section "${id}"`);
      }
    }
  }

  /**
   * Server-side only, deliberately.
   *
   * This module is imported by client components, so the guard ships to the
   * browser too — and there only NEXT_PUBLIC_* variables are inlined, meaning
   * the browser sees NODE_ENV=production with ALLOW_PLACEHOLDER_GALLERY
   * undefined and throws on every page load. Making the switch public to work
   * around that would be backwards: a safety flag has no business being
   * readable by the page.
   *
   * Restricting it to the server loses nothing. What this guard exists to stop
   * is a deploy, and every path that matters — `next build` prerendering these
   * pages, and server-rendering them on request — evaluates the module on the
   * server. A browser that has already been served the page is far too late to
   * be the place we find out.
   */
  const onServer = typeof window === 'undefined';
  const allowed = process.env.ALLOW_PLACEHOLDER_GALLERY === 'true';
  if (onServer && process.env.NODE_ENV === 'production' && HAS_PLACEHOLDERS && !allowed) {
    const count = PHOTOS.filter((p) => p.placeholder).length;
    throw new Error(
      `lib/events.ts contains ${count} invented photo captions and must not ship.\n` +
        `  To go live: add the academy's real albums to REAL_PHOTOS, then delete the\n` +
        `  PROTOTYPE_FILL spread from PHOTOS. See the placeholder policy at the top of\n` +
        `  that file.\n` +
        `  To build the prototype anyway: set ALLOW_PLACEHOLDER_GALLERY=true. Never set\n` +
        `  it in the production environment.`,
    );
  }
})();
