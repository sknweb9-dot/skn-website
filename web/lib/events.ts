/**
 * Events and gallery: the editorial content of /events.
 *
 * Six sections (Udaan, Arangetrams, Solo, Ensemble, Outreach, and the class
 * photographs under `studio`), each with the academy's own copy, and a dated,
 * placed card for every video. Within a section the videos run newest first.
 * Outreach shows two or three of the academy's seven, on purpose.
 *
 * The photographs live in lib/gallery.ts. What this file adds to the gallery is
 * the poster plate each video carries onto the globe.
 */

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

/**
 * The page's sections. `studio` is for class and rehearsal photographs that are
 * not from a named performance; it has no videos.
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

const SECTIONS: SectionMeta[] = [
  {
    id: 'udaan',
    eyebrow: 'Flying High',
    heading: 'Udaan',
    filter: 'Udaan',
  },
  {
    id: 'arangetram',
    eyebrow: 'The Debut',
    heading: 'Arangetrams',
    filter: 'Arangetrams',
  },
  {
    id: 'solo',
    eyebrow: 'Beyond the Debut',
    heading: 'Solo',
    filter: 'Solo',
    lede: 'A platform for dancers to present individual performances, explore diverse repertoire, and establish their own artistic identity.',
  },
  {
    id: 'group',
    eyebrow: 'Together in Harmony',
    heading: 'Ensemble',
    filter: 'Ensemble',
    lede: 'SKN Ensemble brings dancers together to celebrate Bharatanatyam through temple festivals, cultural celebrations, and invited performances. Rooted in tradition, teamwork, and devotion, these experiences nurture confidence, artistic expression, and the joy of performing together.',
  },
  {
    id: 'outreach',
    eyebrow: 'Beyond Boundaries',
    heading: 'Outreach',
    filter: 'Outreach',
    lede: 'Through SKN Outreach, we share the joy of Bharatanatyam with diverse communities through NGOs, special schools, temples, and cultural initiatives. These meaningful experiences nurture empathy, inclusivity, and compassion, reminding our dancers that art is not only about performing, but also about connecting and giving back.',
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
 * The page's own words, supplied by the academy in 2026. Each block is a micro
 * heading (the eyebrow) over a heading, as the academy set them out: the
 * subtitle is the small blue line, the name of the section is the heading.
 * Apostrophes and dashes follow the rest of the site.
 */
export const EVENTS_INTRO = {
  eyebrow: 'A Stage for All',
  heading: 'Events',
  body: [
    'Bharatanatyam is a beautiful and profound art form, traditionally believed to have divine origins. While mastering this art is a lifelong journey, every milestone along the way deserves to be celebrated.',
    'At Shanti Kala Nikketan, we believe Bharatanatyam is a Sadhana \u2014 a path of discipline, self-discovery, and personal growth that nurtures creativity, confidence, and empathy. We believe every dancer deserves a platform to perform, express themselves, and celebrate their progress, regardless of their stage of learning.',
    'Through our events, we create meaningful opportunities for every student to experience the joy of performing and grow as both an artist and an individual.',
  ],
} as const;

export const UDAAN = {
  eyebrow: 'Flying High',
  heading: 'Udaan',
  /** The small label over the second column. */
  why: 'Why Udaan',
  body: [
    'Udaan, meaning \u201cflight,\u201d is Shanti Kala Nikketan\u2019s celebration of artistic growth and a humble offering to the timeless art of Bharatanatyam. It provides a platform for our dancers to celebrate their achievements and take another step forward in their lifelong journey of learning.',
    'Every dancer encounters challenges along this journey, but with the guidance of a Guru, these challenges become opportunities for growth. Just as the Hamsa (swan) is traditionally believed to separate milk from water, a Guru helps the Shishya develop the wisdom to recognise the essence of the art, overcome limitations, and discover the freedom to explore.',
    'Through Udaan, our dancers spread their wings, embrace new possibilities, and aspire to greater heights \u2014 guided by tradition, dedication, and the joy of dance.',
  ],
} as const;

export const ARANGETRAMS = {
  body: [
    'An Arangetram marks a significant milestone in a Bharatanatyam dancer\u2019s journey \u2014 their formal debut as a performer, reflecting years of dedication, discipline, perseverance, and artistic growth.',
    'At Shanti Kala Nikketan, we believe an Arangetram is not merely a grand performance, but a celebration of the student\u2019s transformation as both an artist and an individual. It is a journey of self-discovery, confidence, responsibility, and deeper understanding of the art, nurtured through the guidance of the Guru.',
    'For us, an Arangetram is not the culmination of learning, but the beginning of a new chapter \u2014 one that inspires the dancer to continue exploring, evolving, and growing with humility and devotion.',
  ],
} as const;

/**
 * The closing words of the outreach section, and the playlist that holds the
 * rest of the academy's outreach work.
 *
 * The section shows three of the programmes; the playlist is where the others
 * are kept, so a parent can see the reach of the work without the page
 * carrying every link to it.
 */
export const OUTREACH = {
  body: 'These are three of the academy’s outreach programmes. The rest are gathered in one playlist on YouTube.',
  playlist: 'https://www.youtube.com/playlist?list=PLxyyMzhr0f3HAWlYCWp-ll5-0_5SX-OIE',
  playlistLabel: 'SKN Outreach Moments',
} as const;

// ---------------------------------------------------------------------------
// Videos
// ---------------------------------------------------------------------------

export type EventVideo = {
  /** Stable slug — anchor target and React key */
  id: string;
  section: EventSection;
  /** The headline of the card: an event, an organisation or a dancer. */
  title: string;
  /** A second line where the title alone does not say enough (who danced, which edition). */
  detail?: string;
  /** When it happened, YYYY-MM-DD. */
  date: string;
  /** Where, as the academy gives it: a venue and a city, or just a city or country. */
  place?: string;
  kind: 'video' | 'playlist';
  /** YouTube video id, or playlist id when kind === 'playlist' */
  youtubeId: string;
  /**
   * Poster image. Named by SOURCES key rather than
   * by path so the dimensions and the globe plate come from one place — a poster
   * resized or recut then only has to change in SOURCES.
   */
  plateKey: string;
  alt: string;
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
    embeddable: false,
    section: 'udaan',
    title: 'Udaan 2025',
    date: '2025-06-21',
    place: 'Kalakshetra Foundation, Chennai',
    kind: 'video',
    youtubeId: 'L4vTYrVB3aw',
    plateKey: 'udaan-2025-poster',
    alt: 'Poster for Udaan 2025, Where Tradition Takes Flight',
  },
  {
    id: 'udaan-2023',
    embeddable: false,
    section: 'udaan',
    title: 'Udaan 2023',
    date: '2023-10-20',
    place: 'Narada Gana Sabha, Chennai',
    kind: 'playlist',
    youtubeId: 'PLxyyMzhr0f3E-5yEp3Whr3hsbz6wC6GsO',
    plateKey: 'udaan-2023-poster',
    alt: 'Poster for Udaan 2023, Flying High',
  },

  // --- Arangetrams -------------------------------------------------------
  {
    id: 'arangetram-jahnavi',
    embeddable: false,
    section: 'arangetram',
    title: 'Jahnavi Sivasubramanyam',
    date: '2025-06-22',
    place: 'Kalakshetra Foundation, Chennai',
    kind: 'video',
    youtubeId: 'wmnYYbxA950',
    plateKey: 'arangetram-j',
    alt: 'Invitation for Kum Jahnavi\u2019s Bharatanatyam Arangetram',
  },
  {
    id: 'arangetram-kirusanthini',
    embeddable: false,
    section: 'arangetram',
    title: 'Kirusanthini',
    date: '2024-01-09',
    place: 'Black Box, Chennai',
    kind: 'video',
    youtubeId: 'wt4wETJMaXI',
    plateKey: 'arangetram-k',
    alt: 'Invitation for Smt Kirusanthini\u2019s Bharatanatyam Arangetram',
    note: 'Now head of the Scarborough branch.',
  },
  {
    id: 'arangetram-aparna',
    section: 'arangetram',
    title: 'Aparna Manu',
    date: '2018-06-16',
    place: 'Bharatiya Vidya Bhavan, Chennai',
    kind: 'video',
    youtubeId: 'eAIGMW4FPY4',
    plateKey: 'aparna',
    alt: 'Aparna Manu in Bharatanatyam costume for her Arangetram',
    note: 'The academy\u2019s first student to reach her debut.',
  },

  // --- Solo --------------------------------------------------------------
  {
    id: 'aparna-solo',
    embeddable: false,
    section: 'solo',
    title: 'Aparna Manu',
    date: '2024-07-05',
    place: 'Music Academy, Chennai',
    kind: 'video',
    youtubeId: 'iD-Lf0YD8RY',
    plateKey: 'jun2024',
    alt: 'Aparna Manu performing a Bharatanatyam solo',
  },

  // --- Ensemble ----------------------------------------------------------
  {
    id: 'nada-sudha-27',
    embeddable: false,
    section: 'group',
    title: 'Nada Sudha',
    detail: '27th Annual Music & Dance Festival',
    date: '2026-01-24',
    place: 'Chennai',
    kind: 'video',
    youtubeId: 'RDW0MOFKFhY',
    plateKey: 'nadasudha',
    alt: 'Shanti Kala Nikketan at the Nada Sudha annual music and dance festival',
  },
  {
    id: 'samarpanam-navratri-2025',
    embeddable: false,
    section: 'group',
    title: 'Samarpanam Festival',
    date: '2025-09-30',
    place: 'Athma Academy, Chennai',
    kind: 'video',
    youtubeId: 'uLpZ8hUFLZY',
    // The poster and the video were paired by position on the old site and the
    // pairing has not been confirmed with the academy.
    plateKey: 'athma',
    alt: 'Shanti Kala Nikketan dancers performing at an invited programme',
  },
  {
    id: 'maha-shivaratri',
    embeddable: false,
    section: 'group',
    title: 'Maha Shivaratri',
    date: '2024-03-09',
    place: 'Kapaleeshwarar Temple, Chennai',
    kind: 'video',
    youtubeId: 'x_zWuJIvNng',
    // The poster is a programme notice for Bharatiya Vidya Bhavan, Mylapore, and
    // the video is from Kapaleeshwarar Temple: they may not belong together.
    plateKey: 'mylapore',
    alt: 'Programme notice for a performance at Bharatiya Vidya Bhavan, Mylapore',
  },
  {
    id: 'jeevan-utsav-2022',
    embeddable: false,
    section: 'group',
    title: 'Jeevan Utsav',
    date: '2022-01-15',
    place: 'Online, 6 countries',
    kind: 'video',
    youtubeId: 'TAU7Yi5rPCE',
    plateKey: 'festival',
    alt: 'Flyer for the Jeevan Utsav festival programme',
    note: 'The promo for the festival.',
  },

  // --- Outreach ----------------------------------------------------------
  // Three of the seven the academy listed: a community programme in Chennai, a
  // partner's festival and the Toronto temple, so the page shows the range
  // without becoming a list. The others can be added back here.
  {
    id: 'deaf-women-2026',
    embeddable: false,
    section: 'outreach',
    title: 'Foundation of Deaf Women',
    detail: 'SKN Teachers',
    date: '2026-03-29',
    place: 'Chennai',
    kind: 'video',
    youtubeId: 'frel0kYJvM8',
    plateKey: 'outreach-teachers',
    alt: 'Shanti Kala Nikketan teachers dancing on stage at the Foundation of Deaf Women\u2019s International Women\u2019s Day event',
  },
  {
    id: 'dorai-jahnavi-2025',
    embeddable: false,
    section: 'outreach',
    title: 'Dorai Foundation',
    detail: 'Jahnavi Sivasubramanyam',
    date: '2025-10-04',
    place: 'Chennai',
    kind: 'video',
    youtubeId: '3YjSOxFNlKY',
    plateKey: 'outreach-dorai',
    alt: 'Jahnavi Sivasubramanyam dancing a Meera bhajan for the Dorai Foundation',
  },
  {
    id: 'toronto-vinayaka-2025',
    embeddable: false,
    section: 'outreach',
    title: 'Toronto Temple Festival',
    detail: 'Kirusanthini',
    date: '2025-06-15',
    place: 'Canada',
    kind: 'video',
    youtubeId: 'cQS1QZo-Eyk',
    plateKey: 'canada',
    alt: 'Shanti Kala Nikketan dancers at a Toronto temple festival',
  },
];

/** A card's full name, for labels, structured data and the gallery. */
export function videoLabel(video: EventVideo): string {
  const context =
    video.detail ?? (video.section === 'arangetram' ? 'Arangetram' : video.section === 'solo' ? 'Solo' : undefined);
  return context ? `${video.title}, ${context}` : video.title;
}

/** 9 Jan 2024, the way the home page writes dates. */
export function formatVideoDate(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${iso}T00:00:00Z`),
  );
}

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
 * The posters and stills the videos carry, with their real pixel dimensions. A video names its poster by key; the globe
 * plate (long edge 512, cut by _research/make_globe_plates.ps1) and the
 * full-size file come from the same entry.
 */
type Source = { key: string; src: string; width: number; height: number };

const SOURCES: Source[] = [
  { key: 'udaan-2025-poster', src: '/img/event-udaan-2025.jpg', width: 867, height: 1300 },
  { key: 'udaan-2023-poster', src: '/img/event-udaan-2023.jpg', width: 1000, height: 1000 },
  { key: 'aparna', src: '/img/event-aparna.jpg', width: 846, height: 900 },
  { key: 'arangetram-k', src: '/img/event-arangetram-k.jpg', width: 567, height: 567 },
  { key: 'arangetram-j', src: '/img/event-arangetram-j.jpg', width: 567, height: 567 },
  { key: 'festival', src: '/img/event-festival.jpg', width: 900, height: 899 },
  { key: 'mylapore', src: '/img/event-mylapore.jpg', width: 900, height: 900 },
  { key: 'athma', src: '/img/event-athma.jpg', width: 900, height: 675 },
  { key: 'nadasudha', src: '/img/event-nadasudha.jpg', width: 900, height: 675 },
  { key: 'jun2024', src: '/img/event-jun2024.jpg', width: 642, height: 900 },
  { key: 'canada', src: '/img/event-canada.jpg', width: 900, height: 506 },
  { key: 'outreach-teachers', src: '/img/event-outreach-teachers.jpg', width: 900, height: 506 },
  { key: 'outreach-dorai', src: '/img/event-outreach-dorai.jpg', width: 900, height: 506 },
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
    if (!/^\d{4}-\d{2}-\d{2}$/.test(video.date) || Number.isNaN(Date.parse(video.date))) {
      throw new Error(`Video ${video.id} has date "${video.date}"; use YYYY-MM-DD.`);
    }
  }
})();
