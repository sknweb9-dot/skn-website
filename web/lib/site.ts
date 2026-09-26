/**
 * Single source of truth for Shanti Kala Nikketan.
 *
 * Every fact below is transcribed from the academy's own published material
 * (crawled into ../../_research). Do not add unsourced claims here: this file
 * feeds both the visible copy and the Schema.org JSON-LD, so anything invented
 * becomes a structured-data misrepresentation.
 */

export const SITE = {
  name: 'Shanti Kala Nikketan',
  legalName: 'Shanti Kala Nikketan Academy of Fine Arts',
  tagline: 'Academy of Fine Arts',
  /**
   * The academy's own one-line description, supplied by the director. Used as
   * the home page subtext and the footer line on every page, so it is defined
   * once and cannot drift between them.
   */
  signature: 'Bharatanatyam, Kalakshetra Bani since 2009',
  url: 'https://www.shantikalanikketan.com',
  founded: '2009-04-18',
  email: 'shantikalanikketan@gmail.com',
  phoneDisplay: '+91 98840 22306',
  phoneE164: '+919884022306',
  style: 'Kalakshetra style of Bharatanatyam',
  method: 'Gurukulam',
  logo: '/img/logo-emblem.png',
  ogImage: '/img/hero-home.jpg',
  socials: {
    instagram: 'https://www.instagram.com/shantikalanikketan',
    facebook: 'https://www.facebook.com/shantikalanikketan',
    youtube: 'https://www.youtube.com/channel/UCDGm0LQ-24ZIKG-2DUAn2ew',
  },
} as const;

/** Years of unbroken teaching, derived from the founding date rather than hardcoded. */
export function yearsOfLineage(now: Date = new Date()): number {
  const start = new Date(SITE.founded);
  let years = now.getFullYear() - start.getFullYear();
  const beforeAnniversary =
    now.getMonth() < start.getMonth() ||
    (now.getMonth() === start.getMonth() && now.getDate() < start.getDate());
  if (beforeAnniversary) years -= 1;
  return years;
}

/**
 * Owner-supplied figures. Update here when the academy reports new numbers.
 *
 * There is deliberately no student headcount. The site used to show "324
 * students taught"; the academy asked for it to be removed because exact
 * headcounts are not formally tracked, so it has also been taken out of the
 * Schema.org graph rather than left there as an unsupported claim.
 */
export const METRICS = {
  stages: 20,
  /**
   * Countries where the academy has students: India, Canada, and the USA
   * (online). This is student reach, as the academy counts it — not branches,
   * of which there are two.
   */
  countries: 3,
} as const;

// ---------------------------------------------------------------------------
// Branches
// ---------------------------------------------------------------------------

export type Branch = {
  /** URL segment for /locations/[city] */
  slug: string;
  /** Short label used in navigation */
  label: string;
  /** The city name used in headings and schema addressLocality */
  city: string;
  /** Neighbourhood or campus, when the academy has published one */
  locality?: string;
  region: string;
  regionCode: string;
  country: string;
  countryCode: string;
  postalCode?: string;
  streetAddress?: string;
  /**
   * Coordinates. Present only where the academy has published an address
   * precise enough to place. Locality-level accuracy is noted per branch.
   */
  geo?: { lat: number; lng: number; precision: 'street' | 'locality' };
  /** Head of branch, where named on the academy's own site */
  head?: string;
  /**
   * The branch's own contact line, where it has one. Absent means the academy's
   * main number and email in SITE apply.
   */
  contact?: { phoneDisplay: string; phoneE164: string; email: string };
  isPrimary: boolean;
  /** One-line positioning used in hero copy on the branch page */
  intro: string;
  /**
   * Neighbourhoods students travel from, for `areaServed` and on-page copy.
   *
   * These are catchment areas, NOT venues. The venues are in ./classes.ts, and
   * some of these names now appear in both — Thiruvanmiyur and Medavakkam have
   * real venues as well as being catchment. Do not infer a studio from an entry
   * here.
   */
  areaServed: string[];
  /** Landmarks a local parent would orient by */
  landmarks: string[];
  formats: string[];
  image: string;
};

export const BRANCHES: Branch[] = [
  {
    slug: 'chennai',
    label: 'Chennai',
    city: 'Chennai',
    locality: 'Sholinganallur',
    region: 'Tamil Nadu',
    regionCode: 'TN',
    country: 'India',
    countryCode: 'IN',
    postalCode: '600119',
    // No street address, on purpose. Every Chennai venue is a residential
    // complex, and the academy asked for the exact building address to come off
    // the public site to avoid trouble with the property. Locality + postcode is
    // what the schema carries now, and it is what a parent needs to judge
    // distance; the venue itself is shared once a trial is booked.
    geo: { lat: 12.901, lng: 80.2279, precision: 'locality' },
    head: 'Smt. Sunitta Menghanaani',
    isPrimary: true,
    intro:
      'Where Shanti Kala Nikketan began in 2009, and now five venues across Thiruvanmiyur, Sholinganallur and Medavakkam — the Kalakshetra style taught in the Gurukulam manner.',
    areaServed: [
      'Sholinganallur',
      'Thiruvanmiyur',
      'Medavakkam',
      'Perungudi',
      'Thoraipakkam',
      'Karapakkam',
      'Navalur',
      'Siruseri',
      'Velachery',
      'Adyar',
      'Pallikaranai',
    ],
    // Kelambakkam and Egattur were removed from this list at the academy's
    // request. The venue-level landmarks were removed with the street address.
    landmarks: ['Off Rajiv Gandhi Salai (OMR)', 'Sholinganallur Junction'],
    formats: ['Group classes', 'Individual classes', 'Online classes', 'Theory and Sanskrit viniyoga'],
    image: '/img/hero-gurukulam.jpg',
  },
  {
    slug: 'scarborough',
    label: 'Scarborough, Canada',
    city: 'Scarborough',
    locality: 'Morningside & Finch',
    region: 'Ontario',
    regionCode: 'ON',
    country: 'Canada',
    countryCode: 'CA',
    // The academy publishes the intersection, not a street address. We do not
    // invent one; schema carries locality + region only.
    geo: { lat: 43.801, lng: -79.2166, precision: 'locality' },
    head: 'S. Kirusanthini',
    // From the academy's International brochure, 2026-27.
    contact: { phoneDisplay: '+1 416 892 4427', phoneE164: '+14168924427', email: 'intlskn@gmail.com' },
    isPrimary: false,
    intro:
      'Our Canadian branch, running individual and group classes at Morningside and Finch under Kalakshetra-trained faculty.',
    areaServed: [
      'Scarborough',
      'Malvern',
      'Morningside Heights',
      'Markham',
      'Pickering',
      'Ajax',
      'North York',
      'Greater Toronto Area',
    ],
    landmarks: ['Morningside Avenue & Finch Avenue East', 'Malvern Town Centre'],
    formats: ['Group classes', 'Individual classes'],
    image: '/img/event-canada.jpg',
  },
  // The Delhi branch is closed. It has been removed rather than marked inactive,
  // per the academy's instruction that it not appear anywhere on the site.
];

export const PRIMARY_BRANCH = BRANCHES[0];

export function branchBySlug(slug: string): Branch | undefined {
  return BRANCHES.find((b) => b.slug === slug);
}

// ---------------------------------------------------------------------------
// Curriculum
// ---------------------------------------------------------------------------
//
// Lives in ./curriculum.ts, transcribed from `Website Contents.docx`.
//
// The `STAGES` array that used to sit here was crawled from the previous
// website and contradicted the docx on the number of levels, the starting age,
// and which repertoire belongs to which level. It has been removed rather than
// kept as a competing source of truth.

// ---------------------------------------------------------------------------
// Faculty
// ---------------------------------------------------------------------------

export type Person = {
  name: string;
  role?: string;
  /** Verbatim from the academy's Founders / Team / Director pages */
  bio: string;
  image: string;
  /**
   * true where the portrait-to-person mapping is confirmed by the source page.
   * See _research/STATUS.txt item 5 — two founder-page portraits were saved
   * without confirmed identities.
   */
  portraitConfirmed: boolean;
  credentials?: string[];
};

export const FOUNDERS: Person[] = [
  {
    name: 'Om Guru Om',
    role: 'Founder',
    bio: 'For him, Art is essentially an affirmation, benediction or reverence of the existence — the Divinity. The beautiful experience of every art form is that it takes you closer to God and merge with it. This is the fundamental emotion in the cradle of every art.',
    image: '/img/founder-omguruom.jpg',
    portraitConfirmed: true,
  },
  {
    name: 'Sunitta Menghanaani',
    role: 'Co-founder & Director',
    bio: 'Sunitta Menghanaani, a profound Bharatanatyam artiste and teacher, hails from Pune, but has made her karmabhumi — Chennai. She began her journey into dance at the tender age of 3 under Smt Geeta Nair. The urge to follow her passion brought her down South, where she trained in Bharatanatyam at Kalakshetra Foundation, Rukmini Devi College of Fine Arts, Chennai. Sunitta started dissemination of her artistic knowledge with the firm belief that everyone can learn dance, and the only talent required is a talent to work hard.',
    // Identity confirmed by the academy. The file was originally crawled as
    // "founder-second.jpg"; renamed so the asset says who it is.
    image: '/img/founder-sunitta.jpg',
    portraitConfirmed: true,
    credentials: [
      // Kalakshetra awards its own diplomas, not university degrees, so
      // "Graduate" was wrong. Wording confirmed by the director herself.
      'First Class Diploma, Rukmini Devi College of Fine Arts, Kalakshetra Foundation',
      'M.F.A., Kalai Kaveri College of Fine Arts, Trichy',
      'Best Performer Award, Sri Parthasarathy Swamy Sabha',
      'Exemplar Award, Dorai Foundation, Chennai',
    ],
  },
];

export const FACULTY: Person[] = [
  {
    name: 'S. Kirusanthini',
    role: 'Head, Canada Branch',
    bio: 'A Bharatanatyam dancer, choreographer, and teacher with strong artistic roots in Sri Lanka. She began her training in the Vazhuvoor style under Smt. Sangeetha Karthikeyan and later studied the Kalakshetra style for over nine years under Sunitta Menghanaani, whom she joined in 2017. Her dance and teaching work extends to AIMA in Chennai and the SEED NGO in Sri Lanka.',
    image: '/img/team-kirusanthini.jpg',
    portraitConfirmed: true,
    credentials: [
      // Wording to be verified by the academy before it is standardised.
      'First-Class Grade Levels in Bharatanatyam, Annamalai University',
      'Best Dancer Award, UNIPUN Sri Lanka',
      'BCA and MCA (Computer Applications)',
    ],
  },
  {
    name: 'Tejaswi J',
    role: 'Senior Associate',
    bio: 'A Bharatanatyam dancer, performer, and teacher based in Chennai. She began her Bharatanatyam journey in her late teens and, through dedication and perseverance, has built a strong foundation in the art form — proof that a serious start is possible at any age.',
    // IMG_8826.jpeg from the academy, cropped square to her face. A new file
    // name rather than overwriting team-tejaswi.jpg, because next/image caches
    // optimised images by path and would keep serving the old portrait.
    image: '/img/team-tejaswi-2026.jpg',
    portraitConfirmed: true,
    credentials: [
      'Diploma, Rukmini Devi College of Fine Arts, Kalakshetra Foundation',
      'M.A. Bharatanatyam, Tamil Nadu Dr. J. Jayalalithaa Music and Fine Arts University',
    ],
  },
  {
    name: 'Nandhini',
    bio: 'A Bharatanatyam artist and educator based in Chennai, who began her training at the age of eight under Guru Sri. Mohanan of Kalakshetra. A seasoned performer, she has presented numerous solo recitals and performed at prestigious state-level cultural events.',
    image: '/img/team-nandhini.jpg',
    portraitConfirmed: true,
    credentials: [
      'Diploma, Rukmini Devi College of Fine Arts, Kalakshetra Foundation',
      'M.A. Bharatanatyam, University of Madras',
    ],
  },
  {
    name: 'Anju Parvathi KM',
    bio: 'A dedicated dancer and teacher from Malappuram. She began her dance journey at the age of 10 and received her formal training in Mohiniyattam from Kerala Kalamandalam, later continuing advanced studies at the Rukmini Devi College of Fine Arts.',
    image: '/img/team-anju.jpg',
    portraitConfirmed: true,
    credentials: [
      'Diploma, Rukmini Devi College of Fine Arts, Kalakshetra Foundation',
      'M.A. Bharatanatyam, Tamil Nadu Dr. J. Jayalalithaa Music and Fine Arts University',
      'Graded Artist, Doordarshan',
    ],
  },
  {
    name: 'Pavithra P. Kumar',
    bio: 'A dedicated classical dancer from Alappuzha, Kerala, with over sixteen years of training in Bharatanatyam. She secured Second Place in Bharatanatyam at the Kerala State-Level Kalolsavam in 2020.',
    image: '/img/team-pavithra.jpg',
    portraitConfirmed: true,
    credentials: [
      'Diploma, Rukmini Devi College of Fine Arts, Kalakshetra Foundation',
      "Master's Degree, Tamil Nadu Dr. J. Jayalalithaa Music and Fine Arts University",
    ],
  },
  {
    name: 'Sreelakshmi Anirudhan',
    bio: 'A Bharatanatyam dancer, teacher, and performer trained in the classical tradition, actively engaged in teaching, choreography, and stage performances.',
    image: '/img/team-sreelakshmi.jpg',
    portraitConfirmed: true,
    credentials: [
      'Diploma, Rukmini Devi College of Fine Arts, Kalakshetra Foundation',
      'M.A. Dance, Tamil Nadu Dr. J. Jayalalithaa Music and Fine Arts University',
      'Graded Artist, Doordarshan',
    ],
  },
];

// ---------------------------------------------------------------------------
// Gallery — real assets only. No stock photography.
// ---------------------------------------------------------------------------

export type GalleryItem = {
  src: string;
  alt: string;
  width: number;
  height: number;
  caption: string;
  /** Masonry emphasis */
  span: 'tall' | 'wide' | 'square';
};

export const GALLERY: GalleryItem[] = [
  {
    src: '/img/event-udaan-2025.jpg',
    alt: 'Students of Shanti Kala Nikketan on stage at Udaan 2025',
    width: 867,
    height: 1300,
    caption: 'Udaan 2025 — Where Tradition Takes Flight',
    span: 'tall',
  },
  {
    src: '/img/ensemble.jpg',
    alt: 'Full ensemble of Shanti Kala Nikketan dancers in Bharatanatyam costume',
    width: 1600,
    height: 1067,
    caption: 'The ensemble',
    span: 'wide',
  },
  {
    src: '/img/event-arangetram-j.jpg',
    alt: "Kum Jahnavi's Bharatanatyam Arangetram",
    width: 567,
    height: 567,
    caption: 'Jahnavi — Arangetram',
    span: 'square',
  },
  {
    src: '/img/event-mylapore.jpg',
    alt: 'Performance at Bharatiya Vidya Bhavan, Mylapore',
    width: 900,
    height: 900,
    caption: 'Mylapore — Bharatiya Vidya Bhavan',
    span: 'square',
  },
  {
    src: '/img/event-canada.jpg',
    alt: 'Shanti Kala Nikketan students performing in Scarborough, Canada',
    width: 900,
    height: 506,
    caption: 'Scarborough, Canada',
    span: 'wide',
  },
  {
    src: '/img/event-arangetram-k.jpg',
    alt: 'Smt Kirusanthini Bharatanatyam Arangetram',
    width: 567,
    height: 567,
    caption: 'Kirusanthini — Arangetram',
    span: 'square',
  },
  {
    src: '/img/event-nadasudha.jpg',
    alt: 'Nada Sudha 27th Annual Music and Dance Festival',
    width: 900,
    height: 675,
    caption: 'Nada Sudha — 27th Annual Festival',
    span: 'wide',
  },
  {
    src: '/img/event-festival.jpg',
    alt: 'Temple festival offering by Shanti Kala Nikketan dancers',
    width: 900,
    height: 899,
    caption: 'Temple festival offering',
    span: 'square',
  },
  {
    src: '/img/gallery-2.jpg',
    alt: 'Bharatanatyam students in formation during a group item',
    width: 1400,
    height: 1400,
    caption: 'Group item',
    span: 'square',
  },
  {
    src: '/img/event-udaan-2023.jpg',
    alt: 'Udaan 2023 — Flying High, October 2023',
    width: 900,
    height: 600,
    caption: 'Udaan 2023 — Flying High',
    span: 'wide',
  },
  {
    src: '/img/gallery-3.jpg',
    alt: 'Young Bharatanatyam student in araimandi position',
    width: 1400,
    height: 1400,
    caption: 'Araimandi',
    span: 'square',
  },
  {
    src: '/img/event-athma.jpg',
    alt: 'Athma production performance still',
    width: 900,
    height: 675,
    caption: 'Athma',
    span: 'wide',
  },
];

// ---------------------------------------------------------------------------
// Milestones — the lineage narrative
// ---------------------------------------------------------------------------

export const MILESTONES = [
  {
    year: '2009',
    title: 'One room, one student',
    // Corrected by the academy: teaching began in Besant Nagar, under the name
    // Samarpan, with a single student. The move to Sholinganallur and the name
    // Shanti Kala Nikketan came later - see the 2018 entry.
    body: 'Teaching begins in Besant Nagar under the name Samarpan, with a single student — Aparna. The Kalakshetra style of Bharatanatyam is the method from the first class.',
    place: 'Besant Nagar, Chennai',
  },
  {
    year: '2018',
    title: 'Shanti Kala Nikketan',
    body: "Having moved to Sholinganallur, the school formally takes the name Shanti Kala Nikketan under Om Guru Om, drawing on his vision for a cultural renaissance.",
    place: 'Sholinganallur, Chennai',
  },
  {
    year: 'The Gurukulam',
    title: 'Six levels, not six terms',
    body: 'Students practise the classical art form alongside literature and mythology — a Gurukulam education where Guru and Shishya flourish together, structured across an introductory programme and six graded levels.',
    place: 'Chennai',
  },
  {
    year: 'First Arangetram',
    title: 'Aparna Manu takes the stage',
    body: 'The first student of the school completes her Arangetram — the milestone every level of the syllabus is built towards.',
    place: 'Chennai',
  },
  {
    year: 'Udaan',
    title: 'A platform for every dancer',
    body: 'Udaan — "flying high to reach our goals" — is created so that every dancer has a stage, irrespective of their stage of learning. Editions follow in 2023 and 2025.',
    place: 'Chennai',
  },
  {
    year: 'Today',
    title: 'The tradition travels',
    body: 'Five venues across Thiruvanmiyur, Sholinganallur and Medavakkam, an online batch, and a second branch in Scarborough, Canada at Morningside & Finch.',
    place: 'Chennai · Scarborough',
  },
] as const;

// ---------------------------------------------------------------------------
// FAQ — targets the questions parents actually search
// ---------------------------------------------------------------------------

export const FAQS = [
  {
    q: 'At what age can my child begin Bharatanatyam?',
    a: 'Our Introductory Programme takes children from ages 3.5 to 6, where rhythm, coordination, concentration and cultural values are developed through Sanskrit shlokas, storytelling, creative movement and rhythm exercises. Formal Bharatanatyam training begins at Level 1. There is no upper limit — our Senior Associate Tejaswi J began her own training in her late teens.',
  },
  {
    q: 'Do you offer online classes for international students?',
    a: 'Yes. Alongside our Chennai venues and our Canadian branch in Scarborough, we run an online group batch and teach individual students online — currently in Bangalore, Odisha and the USA. Write to shantikalanikketan@gmail.com with your time zone and we will match you to a batch.',
  },
  {
    q: 'What is the Kalakshetra style of Bharatanatyam?',
    a: 'The Kalakshetra style was codified at the Kalakshetra Foundation in Chennai, founded by Rukmini Devi Arundale. It is known for geometric clarity of line, restrained and dignified abhinaya, and a strong grounding in Sanskrit theory. Our Director Sunitta Menghanaani is a graduate of the Rukmini Devi College of Fine Arts, Kalakshetra Foundation, and it is the method the school teaches.',
  },
  {
    q: 'What is the Gurukulam method, and how is it different from a regular dance class?',
    a: 'In the Gurukulam manner, students learn the classical art form alongside literature and mythology, so that technique arrives together with meaning. The relationship is a long one — we insist on a synergy of commitment and perseverance where both Guru and Shishya flourish together, rather than a fixed-term course.',
  },
  {
    q: 'Where exactly in Chennai do you teach?',
    a: 'We run classes at five venues: Appswamy Springs in Thiruvanmiyur, Adroit and Prestige Courtyards in Sholinganallur, and Casagrand Riviera and Casagrand Tranquil in Medavakkam. The exact venue is shared when your trial is booked.',
  },
  {
    q: 'Do you teach adults, or only children?',
    a: 'Both. Alongside the children\u2019s batches we run a dedicated adults batch in Chennai and an adults batch at our Scarborough branch, working through the same graded syllabus. Our Senior Associate Tejaswi J began her own training in her late teens — a serious start is possible at any age.',
  },
  {
    q: 'How long does it take to reach Arangetram?',
    a: 'Arangetram follows the successful completion of six graded levels — Foundation, Technique Development, Margam Preparation, Repertoire & Expression, Advanced Artistry, and Mastery — and it is reached by progression rather than by a calendar. After Level 6, students enter a dedicated Performance & Arangetram Programme of intensive rehearsals, stagecraft, orchestra rehearsals and individual mentoring. It is a years-long Sadhana, and every level is celebrated on its own terms at our Udaan showcase.',
  },
  {
    q: 'Do you hold performances for students?',
    a: 'Yes. Udaan is our own showcase, created so that every dancer has a platform irrespective of their stage of learning, with editions in 2023 and 2025. Students also perform at Arangetrams, temple festivals, and events such as Nada Sudha and the Samarpanam Festival.',
  },
  {
    q: 'What should my child bring to a trial session?',
    a: 'Nothing but comfortable clothing they can move and sit on the floor in. No costume, no ghungroo and no prior experience is needed for a trial.',
  },
] as const;

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

/**
 * The site's routes, in narrative order: who we are, where we came from, what
 * is taught, the stage, the address.
 *
 * Canonical for both the masthead and the footer. `label` is the editorial name
 * used where there is room; `short` is for the header bar, where the items plus
 * a logo plus the booking control have to share one line.
 *
 * TWO ROUTES LEFT THIS LIST, and neither was deleted:
 *
 *   /hastas       still resolves and still carries all twenty-eight gestures,
 *                 but is unlinked and noindexed at the academy's request. See
 *                 the note at the top of app/hastas/page.tsx before reviving it.
 *   /performances folded into /events, which now carries the Udaan copy, the
 *                 Arangetrams and the gallery. next.config.ts 308s the old path
 *                 so inbound links still land.
 *
 * The list is therefore five items rather than six, which the masthead is
 * happier with.
 */
export const NAV_ROUTES = [
  { href: '/about', label: 'The academy', short: 'Academy' },
  { href: '/lineage', label: 'Our lineage', short: 'Lineage' },
  { href: '/curriculum', label: 'Curriculum', short: 'Curriculum' },
  // Locations before Events, at the academy's request: a parent reading the
  // levels on /curriculum is looking for a batch next, not a gallery.
  { href: '/locations', label: 'Locations', short: 'Locations' },
  { href: '/events', label: 'Events & gallery', short: 'Events' },
] as const;

// ---------------------------------------------------------------------------
// Booking
// ---------------------------------------------------------------------------

/**
 * Replace with the academy's Google Form URL to hand submissions straight to
 * Sheets. While unset, the modal posts to /api/enquiry.
 */
export const GOOGLE_FORM_URL: string | null = null;
