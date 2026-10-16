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
 * PHOTOGRAPHS
 * -----------
 * The photographs moved to lib/gallery.ts when the gallery got its own page
 * (/gallery). What stays here is the page's editorial content - the sections,
 * the Udaan copy and the eleven recordings - plus the poster plates those
 * recordings carry onto the gallery's globe.
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
    lede: 'Temple festival offerings and community programmes, in Chennai and wherever our Scarborough branch teaches.',
  },
  {
    id: 'studio',
    eyebrow: 'In the room',
    // Renamed from "The studio" at the academy's request: the point of this
    // group is the class itself. The id stays `studio` so anchors and plate
    // records do not churn.
    heading: 'Classes',
    filter: 'Classes',
    lede: 'Long before a stage, there is a wooden floor and a teacher counting aloud.',
  },
];

export function sectionMeta(id: EventSection): SectionMeta {
  const found = SECTIONS.find((s) => s.id === id);
  if (!found) throw new Error(`Unknown event section: ${id}`);
  return found;
}

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
  /**
   * False where the uploader has disabled embedding on YouTube. Checked against
   * each watch page's `playableInEmbed` flag. The inline player would only show
   * "Video unavailable" for these, so VideoFacade opens them on YouTube instead.
   * To restore inline playback: YouTube Studio -> the video -> Show more ->
   * "Allow embedding", then delete the flag here.
   */
  embeddable?: false;
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
    embeddable: false,
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
    embeddable: false,
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
    embeddable: false,
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
    embeddable: false,
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
    embeddable: false,
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
    embeddable: false,
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
    embeddable: false,
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
// Posters
// ---------------------------------------------------------------------------

/**
 * The posters and stills the recordings were paired with on the old page, with
 * their real pixel dimensions. A recording names its poster by key; the globe
 * plate (long edge 512, cut by _research/make_globe_plates.ps1) and the
 * full-size file come from the same entry.
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
];

const SOURCE_BY_KEY = new Map(SOURCES.map((s) => [s.key, s]));

function source(key: string): Source {
  const found = SOURCE_BY_KEY.get(key);
  if (!found) throw new Error(`Unknown poster source: ${key}`);
  return found;
}

/** Globe plate path for a plate key. */
export function platePath(key: string): string {
  return `/img/globe/${key}.webp`;
}

/** Long edge of a globe plate, in pixels. */
export const PLATE_LONG_EDGE = 512;

// ---------------------------------------------------------------------------
// Open Graph
// ---------------------------------------------------------------------------

export const EVENTS_META = {
  title: 'Events & Gallery — Udaan, Arangetrams & Performances',
  description:
    'Udaan, our own showcase created so that every dancer has a stage — with Arangetrams, temple festivals, and outreach programmes. Photographs and recordings from the academy’s own stages.',
  url: `${SITE.url}/events`,
  image: '/img/event-udaan-2025.jpg',
} as const;

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

(function verifyEvents() {
  const ids = new Set<string>();
  for (const video of VIDEOS) {
    if (ids.has(video.id)) throw new Error(`Duplicate video id: ${video.id}`);
    ids.add(video.id);
    if (!SECTIONS.some((s) => s.id === video.section)) {
      throw new Error(`${video.id} has unknown section "${video.section}"`);
    }
    if (!SOURCE_BY_KEY.has(video.plateKey)) {
      throw new Error(`Video ${video.id} names plate key "${video.plateKey}", which is not in SOURCES`);
    }
    if (!video.alt.trim()) throw new Error(`Video ${video.id} has no alt text`);
  }
})();
