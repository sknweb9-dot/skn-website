/**
 * The home page: its sections, the gesture each one lands on, and everything
 * it says.
 *
 * SHAPE
 * -----
 * Seven sections on a stage. The page is a stack of "pages" that appear and
 * disappear in the same place as you scroll (see lib/stage.ts); the arch sits
 * on the left of every page, and the hand in it plays on as you scroll. Each
 * section has its own gesture and its own ground, and the ground changes with a
 * crisp wipe at the cut. Without the script, on a phone, or under reduced
 * motion, the same markup is an ordinary stacked page.
 *
 * WHY THE GESTURES ARE IN THIS ORDER
 * ----------------------------------
 * Hastas.mp4 is one continuous take of the twenty-eight asamyuta hastas in
 * Abhinaya Darpana order, and the stage plays it straight through, so the hand
 * never cuts from one gesture to an unrelated one. That constrains the choice:
 * each section's gesture has to come later in the footage than the one before.
 * The set below was picked for meaning within that constraint, and
 * verifyHome() at the foot of this file refuses any edit that breaks the order.
 * Between sections the hand passes through the gestures in between, and the
 * caption under the arch names whichever one is genuinely on screen.
 *
 * This replaced lib/acts.ts and its six fading cards, and then the pinned-arch
 * scrub that followed. The text lives in the page as ordinary document content,
 * so it can be read, searched and found by crawlers without waiting on a scroll
 * position.
 */

import { mudraByName, type Mudra } from './mudras';
import { batchCount } from './classes';
import { DIRECTOR, FOUNDER } from './lineage';
import { METRICS, SITE } from './site';

// ---------------------------------------------------------------------------
// Tones
// ---------------------------------------------------------------------------

/**
 * Section grounds ("dusk"). Deep tones carry cream text; cream carries ink.
 * Contrast for every pairing is measured by _research/home_tones.py: cream on
 * the deep tones is 12.9-15.9:1, marigold on them 6.0-7.4:1.
 *
 * `niche` is the colour of the arch's window on that ground. It is always warm
 * and always dark, so the lamp glow stays golden; on a light ground the arch
 * shows the footage as filmed, with its own grey, and has no niche.
 */
export type Tone = 'cream' | 'midnight' | 'plum' | 'oxblood' | 'sindoor';

export const TONE_VALUES: Record<Tone, { value: string; dark: boolean; niche: string | null }> = {
  cream: { value: 'var(--color-cream)', dark: false, niche: null },
  midnight: { value: 'var(--color-midnight)', dark: true, niche: 'var(--color-lamp)' },
  plum: { value: 'var(--color-plum)', dark: true, niche: 'var(--color-lamp)' },
  oxblood: { value: 'var(--color-oxblood)', dark: true, niche: 'var(--color-lamp)' },
  sindoor: { value: 'var(--color-kumkum-deep)', dark: true, niche: 'var(--color-lamp-red)' },
};

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

export type HomeSectionId = 'hero' | 'why' | 'story' | 'honours' | 'events' | 'voices' | 'begin';

export type HomeSection = {
  id: HomeSectionId;
  /** Name of the section in the progress dots. */
  label: string;
  /** The gesture the hand arrives at while this section is being read. */
  mudra: Mudra;
  /** Why this gesture, from its documented viniyoga. For maintainers. */
  because: string;
  /**
   * Where the hand rests while the section is read, when that is not the middle
   * of the gesture's frames. The footage opens on a pure Patāka and has already
   * folded into Tripatāka by the middle of its first second, so the hero rests at
   * the start; every other gesture is held through its middle.
   */
  rest?: number;
  tone: Tone;
};

export const HOME_SECTIONS: HomeSection[] = [
  { id: 'hero', label: 'Welcome', mudra: mudraByName('Patāka'), because: 'the beginning of dance; benediction', rest: 1, tone: 'cream' },
  { id: 'why', label: 'Why SKN', mudra: mudraByName('Ardhapatāka'), because: 'tender shoots', tone: 'midnight' },
  { id: 'story', label: 'Our story', mudra: mudraByName('Kapittha'), because: 'Lakshmi and Saraswati: learning and the arts', tone: 'plum' },
  { id: 'honours', label: 'Honours', mudra: mudraByName('Siṃhamukha'), because: 'a lotus garland: being honoured', tone: 'cream' },
  { id: 'events', label: 'Udaan and events', mudra: mudraByName('Alapadma'), because: 'the fully bloomed lotus', tone: 'oxblood' },
  { id: 'voices', label: 'In their words', mudra: mudraByName('Catura'), because: 'a promise; sweetness', tone: 'cream' },
  { id: 'begin', label: 'Begin', mudra: mudraByName('Tāmracūḍa'), because: 'the crowing of a cock: the call to begin', tone: 'sindoor' },
];

export function homeSection(id: HomeSectionId): HomeSection {
  // verifyHome() guarantees every id is present.
  return HOME_SECTIONS.find((s) => s.id === id)!;
}

/**
 * Where the hand rests while its section is read: the gesture's middle frame,
 * unless the section says otherwise (the hero, whose gesture the footage leaves
 * almost at once). This is also the frame shown as a still wherever the footage
 * is not playing, so it has to look like the gesture the caption names.
 */
export function restingFrame(section: HomeSection): number {
  return section.rest ?? (section.mudra.frameStart + section.mudra.frameEnd) / 2;
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

export const HERO = {
  heading: 'Not just an artform. A way of life.',
  body: SITE.signature,
  credentials: ['Since 2009', 'Kalakshetra bani', 'Chennai & Canada'],
  /**
   * Worded as coverage of Udaan, not of the school. The Adyar Times piece names
   * the academy; the Times of India spread covers the evening at Kalakshetra and
   * names Sunitta Menghanaani and Aparna Manu, but not the academy itself.
   */
  press: 'Udaan 2025 in The Times of India · Adyar Times',
} as const;

// ---------------------------------------------------------------------------
// Why SKN
// ---------------------------------------------------------------------------

/**
 * The four figures the second page of the section shows, each with its own
 * numeral. The counts live in lib/site.ts METRICS and lib/classes.ts; the
 * countries are India, Canada and the USA (online), as METRICS records.
 */
export function whyFigures(): { figure: string; label: string }[] {
  return [
    { figure: `${METRICS.studentsTaught.toLocaleString('en-IN')}+`, label: 'Students taught since 2009' },
    { figure: `${METRICS.stages}+`, label: 'Stages performed on' },
    { figure: `${batchCount()}`, label: 'Weekly batches, from children to adults' },
    { figure: `${METRICS.countries}`, label: 'Countries where our students live: India, Canada and the USA' },
  ];
}

export const WHY = {
  heading: 'More than a dance class',
  // Docx FAQ 18 and 6, verbatim.
  lede: 'At SKN, we place equal importance on artistic learning and the overall development of the student.',
  body: 'Through regular practice and learning, students develop discipline, perseverance, confidence, cultural awareness, self-expression, and a deeper connection with themselves.',
  /** Distilled from docx FAQ 9, 16, 15 and 17. */
  care: [
    {
      title: 'No marks, no competition',
      body: 'We look at effort, consistency and the ability to overcome fear.',
    },
    {
      title: 'Parents see the progress',
      body: 'Parents may observe a class once every two months.',
    },
    {
      title: 'A physiotherapist before every Arangetram',
      body: 'A compulsory consultation, so the body is ready for the stage.',
    },
    {
      title: 'Soulful Sunday',
      body: 'Sessions on emotional growth and mindful living, designed by a counsellor who is also a dancer.',
    },
  ],
  photos: [
    { src: '/img/home/why-group.jpg', width: 1600, height: 1067, alt: 'Students of an Appswamy Springs batch with their teachers, in practice saris' },
    { src: '/img/home/why-motion.jpg', width: 1600, height: 1067, alt: 'Young students at Adroit holding a Bharatanatyam pose in a line' },
    { src: '/img/home/why-adults.jpg', width: 1600, height: 1067, alt: 'The adults batch dancing with their teacher' },
  ],
  link: { href: '/about', label: 'Academy' },
} as const;

// ---------------------------------------------------------------------------
// The story
// ---------------------------------------------------------------------------

/**
 * The two voices that frame the timeline. Deliberately separate from it: they
 * are the reason for the story, not entries in it.
 */
export const FRAMERS = [
  {
    name: 'Om – Guru – Om',
    role: 'Founder',
    image: FOUNDER.image,
    quote: FOUNDER.vision.lines.join(' '),
  },
  {
    name: DIRECTOR.name,
    role: 'Co-Founder & Director',
    image: DIRECTOR.image,
    // The opening of her vision statement; the whole of it is on /lineage.
    quote:
      'I believe Bharatanatyam is far more than a performing art or an extracurricular activity — it is a way of life.',
  },
] as const;

export type Milestone = {
  year: string;
  title: string;
  body: string;
  image?: { src: string; width: number; height: number; alt: string };
};

/**
 * Dates and venues from the Events list in `Website Contents.docx` and the
 * academy's own photo folders. One photograph per stage, of different people,
 * starting with the first student. Shown two to a row, each with a small
 * photograph, so the whole history takes about a screen and a half.
 */
export const TIMELINE: Milestone[] = [
  {
    year: '2009',
    title: 'One room, one student',
    body: 'Teaching begins in Besant Nagar under the name Samarppan, with a single student — Aparna.',
    image: { src: '/img/home/story-2009.jpg', width: 1600, height: 1200, alt: 'A young student mirrors her teacher’s hand gesture in an early class, 2009' },
  },
  {
    year: '2013',
    title: 'The teacher on stage',
    body: 'Sunitta Menghanaani presents her first solo recital.',
    image: { src: '/img/home/story-2013.jpg', width: 1503, height: 1344, alt: 'Sunitta Menghanaani in performance at her first solo recital, 2013' },
  },
  {
    year: '2015',
    title: 'Bharat Nritya Utsav',
    body: 'A solo at Sri Parthasarathy Swami Sabha’s festival of dance.',
    image: { src: '/img/home/story-2015.jpg', width: 1068, height: 1600, alt: 'Sunitta Menghanaani on stage beneath the Sri Parthasarathy Swami Sabha Bharat Nritya Utsav banner, 2015' },
  },
  {
    year: '2018',
    title: 'A name, and a first Arangetram',
    body: 'The school takes the name Shanti Kala Nikketan under Om Guru Om, and Aparna Manu presents her Arangetram at Bharatiya Vidya Bhavan.',
    image: { src: '/img/home/story-2018.jpg', width: 1067, height: 1600, alt: 'Aparna Manu at her Arangetram, 2018' },
  },
  {
    year: '2022',
    title: 'Jeevan Utsav',
    body: 'A celebration of life through dance, performed online across six countries.',
    image: { src: '/img/home/story-2022.jpg', width: 1600, height: 1067, alt: 'Young dancers with teachers and guests at Jeevan Utsav, 2022' },
  },
  {
    year: '2023',
    title: 'Udaan takes flight',
    body: 'The academy’s own showcase begins at Narada Gana Sabha, so that every dancer has a stage.',
    image: { src: '/img/home/story-2023.jpg', width: 1600, height: 863, alt: 'A group of students on stage at Udaan, 2023' },
  },
  {
    year: '2024',
    title: 'From student to teacher',
    body: 'S. Kirusanthini, now head of the Canada branch, presents her Arangetram.',
    image: { src: '/img/home/story-2024.jpg', width: 1067, height: 1600, alt: 'S. Kirusanthini at her Arangetram, 2024' },
  },
  {
    year: '2025',
    title: 'On Kalakshetra’s stage',
    body: 'Udaan returns at Kalakshetra Foundation with over forty performers, from children to adults.',
    image: { src: '/img/home/story-2025.jpg', width: 1600, height: 1067, alt: 'Students performing at Udaan 2025, Kalakshetra Foundation' },
  },
  {
    year: '2026',
    title: 'Nada Sudha',
    body: 'Students perform at the 27th Nada Sudha Music & Dance Festival.',
    image: { src: '/img/home/story-2026.jpg', width: 1160, height: 1600, alt: 'Six dancers at Udaan 2025, three standing and three seated together under a single spotlight' },
  },
  {
    year: 'Today',
    title: 'The tradition travels',
    body: `${METRICS.studentsTaught.toLocaleString('en-IN')}+ students taught, in Chennai, in Canada and online.`,
  },
];

export const STORY = {
  eyebrow: 'Since 2009',
  heading: `From one student to ${METRICS.studentsTaught.toLocaleString('en-IN')}+`,
  link: { href: '/lineage', label: 'Lineage' },
} as const;

// ---------------------------------------------------------------------------
// Honours
// ---------------------------------------------------------------------------

export const HONOURS = {
  heading: 'Honoured on stage and in print',
  photo: {
    src: '/img/home/honours-award.jpg',
    width: 1600,
    height: 1542,
    alt: 'Sunitta Menghanaani receiving an award on stage, with Om Guru Om beside her',
    caption: 'Sunitta Menghanaani with Om Guru Om',
  },
  awards: [
    { title: 'Best Performer Award', from: 'Sri Parthasarathy Swami Sabha' },
    { title: 'Exemplar Award', from: 'Dorai Foundation, Chennai' },
  ],
  press: [
    {
      paper: 'The Times of India',
      edition: 'Chennai Times · 26 June 2025',
      headline: 'A mesmerising night of rhythm, tradition and classical dance',
      image: { src: '/img/home/press-toi.jpg', width: 899, height: 1800 },
      alt: 'Times of India photo spread of Udaan 2025 at Kalakshetra, with captions naming Aparna Manu and Sunitta Menghanaani',
    },
    {
      paper: 'Adyar Times',
      edition: '13–19 July 2025',
      headline: 'Over 40 performers, from children to adults',
      image: { src: '/img/home/press-adyar.jpg', width: 1536, height: 1651 },
      alt: 'Adyar Times community page reporting Shanti Kala Nikketan’s Udaan at Kalakshetra Foundation',
    },
  ],
  link: { href: '/lineage', label: 'Lineage' },
} as const;

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

export type HomeEvent = {
  title: string;
  /** ISO date, YYYY-MM-DD. Decides upcoming versus past. */
  date: string;
  venue: string;
  city: string;
  description?: string;
  image: { src: string; width: number; height: number; alt: string };
  /** A recording, where there is one. */
  href?: string;
};

/**
 * EDIT THIS LIST TO ADD AN EVENT.
 *
 * Add upcoming events with a future date and they lead the section on their
 * own: one upcoming event is shown large, several are shown as a row. Once the
 * date passes, an event drops into the "recent" grid without anyone touching it
 * — the page re-renders daily (see `revalidate` in app/page.tsx).
 *
 * With nothing upcoming, the section shows FEATURED_EVENT large and the four
 * most recent past events beside it, so it never looks empty.
 *
 * Past events below are from the Events list in `Website Contents.docx`.
 */
export const HOME_EVENTS: HomeEvent[] = [
  {
    title: 'Nada Sudha — 27th Music & Dance Festival',
    date: '2026-01-24',
    venue: 'Nada Sudha',
    city: 'Chennai',
    image: { src: '/img/home/event-nadasudha-2026.jpg', width: 1600, height: 1200, alt: 'Students performing on stage at Nada Sudha 2026' },
    href: 'https://youtu.be/RDW0MOFKFhY',
  },
  {
    title: 'Samarpanam Festival',
    date: '2025-09-30',
    venue: 'Athma Academy',
    city: 'Chennai',
    image: { src: '/img/home/event-samarpanam-2025.jpg', width: 1200, height: 1600, alt: 'Students on stage at the Samarpanam festival, Athma Academy' },
    href: 'https://youtu.be/uLpZ8hUFLZY',
  },
  {
    title: 'Arangetram — Jahnavi Sivasubramanyam',
    date: '2025-06-22',
    venue: 'Kalakshetra Foundation',
    city: 'Chennai',
    image: { src: '/img/home/event-jahnavi-2025.jpg', width: 1600, height: 1067, alt: 'Jahnavi in a spotlight at her Arangetram' },
    href: 'https://youtu.be/wmnYYbxA950',
  },
  {
    title: 'Udaan 2025 — Where Tradition Takes Flight',
    date: '2025-06-21',
    venue: 'Kalakshetra Foundation',
    city: 'Chennai',
    description:
      'Our own showcase, created so that every dancer has a stage irrespective of their stage of learning. Over forty performers, from children to adults.',
    image: { src: '/img/home/event-udaan-2025.jpg', width: 1600, height: 1067, alt: 'Two dancers mid-performance at Udaan 2025' },
    href: 'https://youtu.be/L4vTYrVB3aw',
  },
  {
    title: 'Maha Shivaratri',
    date: '2024-03-09',
    venue: 'Kapaleeshwarar Temple',
    city: 'Chennai',
    image: { src: '/img/home/event-kapaleeshwarar-2024.jpg', width: 1600, height: 1200, alt: 'Students with their certificates at Kapaleeshwarar Temple' },
    href: 'https://youtu.be/x_zWuJIvNng',
  },
  {
    title: 'Arangetram — S. Kirusanthini',
    date: '2024-01-09',
    venue: 'Black Box',
    city: 'Chennai',
    image: { src: '/img/home/event-kirusanthini-2024.jpg', width: 1067, height: 1600, alt: 'S. Kirusanthini in abhinaya at her Arangetram' },
    href: 'https://youtu.be/wt4wETJMaXI',
  },
  {
    title: 'Udaan — Flying High',
    date: '2023-10-20',
    venue: 'Narada Gana Sabha',
    city: 'Chennai',
    image: { src: '/img/home/event-udaan-2023.jpg', width: 1600, height: 1092, alt: 'A dancer on stage at the first Udaan, 2023' },
    href: 'https://youtu.be/AeFacBa8zL8',
  },
  {
    title: 'Jeevan Utsav',
    date: '2022-01-15',
    venue: 'Online, across six countries',
    city: 'Online',
    image: { src: '/img/home/event-jeevan-2022.jpg', width: 1600, height: 1067, alt: 'A young dancer leaping, Jeevan Utsav 2022' },
    href: 'https://youtu.be/TAU7Yi5rPCE',
  },
];

/** Shown large whenever nothing is upcoming. */
export const FEATURED_EVENT_TITLE = 'Udaan 2025 — Where Tradition Takes Flight';

export const EVENTS_COPY = {
  upcoming: { eyebrow: 'Mark your calendar', heading: 'Coming up' },
  past: { eyebrow: 'On our stages', heading: 'Every dancer gets a stage' },
  link: { href: '/events', label: 'Events' },
} as const;

/** Midnight in Chennai today, as a YYYY-MM-DD string, for comparing ISO dates. */
function todayInChennai(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now);
}

/**
 * Split the list by date. An event is upcoming on its own day too, so it stays
 * in the lead until it has happened.
 */
export function partitionEvents(now: Date = new Date(), events: HomeEvent[] = HOME_EVENTS) {
  const today = todayInChennai(now);
  const upcoming = events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const past = events.filter((e) => e.date < today).sort((a, b) => b.date.localeCompare(a.date));

  if (upcoming.length > 0) return { mode: 'upcoming' as const, lead: upcoming[0], rest: upcoming.slice(1), recent: past.slice(0, 3) };

  const featured = past.find((e) => e.title === FEATURED_EVENT_TITLE) ?? past[0];
  return { mode: 'past' as const, lead: featured, rest: [], recent: past.filter((e) => e !== featured).slice(0, 4) };
}

export function formatEventDate(iso: string): string {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${iso}T00:00:00Z`),
  );
}

// ---------------------------------------------------------------------------
// Parents' words
// ---------------------------------------------------------------------------

export type Voice = {
  name: string;
  /** e.g. "Parent, Level 2". Optional. */
  context?: string;
  quote: string;
  image: { src: string; alt: string };
  /** True until the academy's real quote replaces it. */
  placeholder?: boolean;
};

/**
 * Five parents' and one student's own words, taken from the academy's Google
 * Business Profile and cut to length here. The last of the six came later, in
 * the reviewer's own words, and is the shortest of them: it needed no cutting.
 *
 * LENGTH. The reviews run to several hundred words each and three of them past
 * a thousand. A card is three inches wide and a page holds three across, so the
 * full text would be several screens of scrolling for six sentences of meaning.
 * Each is cut to the claim and the outcome, in the writer's own voice and order;
 * nothing is rewritten. Lakshmi K's loses the incident about the other girl,
 * Yamini Siva's the "Kudos to all participants" opening, Balaji P's the four
 * years his daughter has been dancing.
 *
 * No `context`. It claimed a level or a relation the reviews do not state, and
 * three of these six are about the studio rather than about one child's progress.
 *
 * The photographs are the academy's own, numbered in the order they were sent
 * and matched to the reviews by that number. The alt text is empty because the
 * card already carries the name beside it; describing a family photograph would
 * say nothing the figcaption has not already said.
 */
export const VOICES: Voice[] = [
  {
    name: 'Lakshmi K',
    quote:
      'I am proud to say that my daughter, Aparna Manu is the first student of Shanti Kala Niketan since the age of 5. Sunitta Ma’am promised her she would never stop teaching her, and that promise has held till date — we are more like a family. She has not only shaped Aparna into a beautiful dancer but made her a confident person ready to face the world, and with good values. We are very lucky to be associated with SKN. I wish SKN all the best!',
    image: { src: '/img/home/voice-1.jpg', alt: '' },
  },
  {
    name: 'Sanghamitra M',
    quote:
      'It has been a wonderful experience re-learning Bharatanatyam systematically under the training and guidance of Guru Sunita Menghanaani. The way she breaks down tough modules into easy to grasp sections is amazing. She truly promotes the philosophy that everyone with the right mindset and passion can dance beautifully with practice and dedication.',
    image: { src: '/img/home/voice-2.jpg', alt: '' },
  },
  {
    name: 'Mayuri’s parents',
    quote:
      'One of the best decisions we made for Mayuri was enrolling her at Shanti Kala Nikketan under Sunitta Ma’am’s guidance. Seeing Sunitta Ma’am carry forward the pure Kalakshetra legacy with such dedication, love, and discipline is a blessing. It has taught our daughter not just how to dance, but how to respect, persevere, and connect deeply with our culture.',
    image: { src: '/img/home/voice-3.jpg', alt: '' },
  },
  {
    name: 'Balaji P',
    quote:
      'Excellent teachers. I will highly recommend SKN for people of all ages who are interested in Bharatanatyam. For students from age 5 to 50 they adapt the teaching based on one’s strength and capabilities. We parents also started learning Bharatanatyam, and truly enjoy the journey with SKN.',
    image: { src: '/img/home/voice-4.jpg', alt: '' },
  },
  {
    name: 'Yamini Siva',
    quote:
      'Excellent program, well planned and executed. Teachers in the institution are very kind and committed in taking the dance form to the students. My daughter Jahnavi performed a shabdam in this program. I have watched a few classes and am amazed at the way Sunitta Maam teaches the dance — she explains the meaning of the lyrics and asks her to show expressions in her own way. Very fortunate to be with SKN, which makes a kid believe in herself.',
    image: { src: '/img/home/voice-5.jpg', alt: '' },
  },
  {
    name: 'Prachi Goel',
    quote:
      'Both my daughters are learning with Shanti kala niketan. My daughters are enjoying learning with teachers. We are very happy with teachers and their teaching techniques.',
    image: { src: '/img/home/voice-6.jpg', alt: '' },
  },
];

export const VOICES_COPY = { heading: 'In their words' } as const;

// ---------------------------------------------------------------------------
// Begin
// ---------------------------------------------------------------------------

export const BEGIN = {
  heading: 'Who are the classes for?',
  note: 'You are welcome to observe one of our ongoing classes by getting in touch with us in advance',
} as const;

// ---------------------------------------------------------------------------
// Loading screen
// ---------------------------------------------------------------------------

/** From "Bharatanatyam - Loading Screen Hooks" in `Website Contents.docx`. */
export const LOADING_LINES = [
  "Dancers stain fingertips and soles with red Alta dye to magnify subtle gestures and footwork for the audience.",
  "An Arangetram ('ascending the stage') marks a dancer's first full solo performance after years of training.",
  "Dancers wear 50 to 100 tuned bronze bells on each ankle, functioning as live percussionists.",
  "The core stance, Araimandi, is built entirely on equilateral triangles formed by the hips, knees, and feet.",
  "With 52 classical hand mudras, dancers can narrate entire epics without uttering a word.",
  "Before moving to the modern stage, Bharatanatyam flourished in temple sanctums as Sadir Attam.",
  "All 108 foundational poses (karanas) are sculpted into the granite towers of Chidambaram Temple.",
  "Classical texts dictate: 'Where the hands go, the eyes must follow; where the eyes go, the mind follows.'",
  "Recitals open with Alarippu ('to bloom'), a movement sequence that systematically awakens every joint.",
  "A single Varnam can demand up to 45 to 60 continuous minutes of synchronized footwork and storytelling."
] as const;

// ---------------------------------------------------------------------------
// Guards
// ---------------------------------------------------------------------------

(function verifyHome() {
  const ids: HomeSectionId[] = ['hero', 'why', 'story', 'honours', 'events', 'voices', 'begin'];
  if (HOME_SECTIONS.map((s) => s.id).join() !== ids.join()) {
    throw new Error(`HOME_SECTIONS must be exactly ${ids.join(', ')}, in that order.`);
  }

  // The scrub plays the footage forwards; a gesture earlier than the last one
  // would make the hand run backwards between two sections.
  for (let i = 1; i < HOME_SECTIONS.length; i += 1) {
    const prev = HOME_SECTIONS[i - 1].mudra;
    const next = HOME_SECTIONS[i].mudra;
    if (next.order <= prev.order) {
      throw new Error(
        `Home section "${HOME_SECTIONS[i].id}" lands on ${next.name} (#${next.order}), which comes before ` +
          `${prev.name} (#${prev.order}) in the footage. Pick a later gesture.`,
      );
    }
  }

  for (const e of HOME_EVENTS) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(e.date) || Number.isNaN(Date.parse(e.date))) {
      throw new Error(`Home event "${e.title}" has date "${e.date}"; use YYYY-MM-DD.`);
    }
    if (!e.image.alt.trim()) throw new Error(`Home event "${e.title}" has no alt text.`);
  }
  if (!HOME_EVENTS.some((e) => e.title === FEATURED_EVENT_TITLE)) {
    throw new Error(`FEATURED_EVENT_TITLE "${FEATURED_EVENT_TITLE}" is not in HOME_EVENTS.`);
  }

  // Same policy as the gallery's invented captions: allowed, but never silent.
  const placeholders = VOICES.filter((v) => v.placeholder).length;
  if (placeholders > 0 && typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
    console.warn(`[home] ${placeholders} parent quotes are still placeholders. Replace them in lib/home.ts before launch.`);
  }
})();
