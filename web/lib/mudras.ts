/**
 * The asamyuta hastas (single-hand gestures) shown in Hastas.mp4.
 *
 * FRAME PROVENANCE
 * ----------------
 * Source: Hastas.mp4 — 3840x2160, 30fps, 54.000s, 1620 decodable frames.
 * Extracted with (see _research/extract_frames.ps1):
 *   ffmpeg -i Hastas.mp4 \
 *     -vf "crop=1558:2160:1546:0,fps=6,scale=864:-2:flags=lanczos" \
 *     -an -c:v libwebp -lossless 0 -quality 74 -compression_level 6 \
 *     public/frames/frame_%04d.webp
 *
 * This replaces mudra.mp4, which was 720x1280 portrait. Three consequences:
 *
 * 1. The arm is horizontal in this footage, not vertical, so the plate is a
 *    measured crop rather than a straight scale. x=1546 puts 150px of margin
 *    left of the leftmost fingertip across all 1620 frames and keeps the green
 *    sleeve out of frame; _research/hand_extent.py is the measurement and
 *    _research/crop_candidates.py shows the rejected alternatives. The crop
 *    holds ratio 0.7215, so --arch-ratio, the arch mask, ArchOutline and
 *    CROP_BIAS are all unchanged.
 *
 * 2. 6fps over 54s is exactly 324 frames, and every gesture boundary in
 *    _research/../asamyuta_hastas_reference_guide.md falls on a whole second.
 *    So a gesture spanning seconds [a,b] occupies frames [6a+1, 6(b+1)] with no
 *    rounding, and frameStart/frameEnd below are real frame numbers. The old
 *    LABEL_GRID indirection — which existed because the previous ranges were
 *    transcribed off burned-in labels at a different density — is gone.
 *
 * 3. Hastas.mp4 carries no burned-in gesture labels, so there is nothing to crop
 *    off the bottom of the plate at draw time. VISIBLE_FRAME_HEIGHT is gone too;
 *    the whole plate is visible and VISIBLE_RATIO is simply the frame ratio.
 *
 * 864px wide rather than 720: measured aperture widths are 294-644 CSS px, so a
 * 1920-logical retina desktop needs ~966 device px and 720 under-resolved it.
 *
 * The order is the canonical Abhinaya Darpana sequence of 28 asamyuta hastas.
 * Spellings here are canonical for the codebase — lib/acts.ts resolves anchors
 * by exact name, and three differ from the reference guide (Padmakōśa,
 * Kāṅgūla, Sandaṃśa).
 */

/** Total frames currently exported to public/frames. */
export const FRAME_COUNT = 324;

/** Frames per second of the extraction. Each gesture boundary is a multiple. */
export const FRAMES_PER_SECOND = 6;

/** Zero-padded width used in frame filenames. */
export const FRAME_PAD = 4;

export const FRAME_WIDTH = 864;
export const FRAME_HEIGHT = 1198;

/**
 * Aspect ratio of the plate.
 *
 * The whole plate is visible now, so this is just the frame ratio. It is kept as
 * a named export because StaticActs and the /hastas page size their stills by
 * it, and because --arch-ratio in globals.css must stay in step with it.
 */
export const VISIBLE_RATIO = FRAME_WIDTH / FRAME_HEIGHT;

export function framePath(index: number): string {
  const clamped = Math.min(Math.max(index, 1), FRAME_COUNT);
  return `/frames/frame_${String(clamped).padStart(FRAME_PAD, '0')}.webp`;
}

export type Mudra = {
  order: number;
  /** IAST transliteration */
  name: string;
  /** Literal translation of the gesture's name */
  literal: string;
  /**
   * First and last frame where this gesture is on screen, on the live 324-frame
   * sequence, 1-indexed and inclusive. Derived from the reference guide's
   * whole-second ranges at 6fps: seconds [a,b] -> frames [6a+1, 6(b+1)].
   */
  frameStart: number;
  frameEnd: number;
  /** Canonical viniyoga — the documented uses of the gesture */
  viniyoga: string[];
  /**
   * Sanskrit shloka and word-by-word gloss, transcribed from the academy's own
   * Theory Class lessons. Present only where the academy has published it.
   */
  verse?: { shloka: string[]; gloss: string[]; videoId: string };
  /** Editorial reflection shown on featured cards. Interpretive, not doctrinal. */
  reflection?: string;
  /** Whether this gesture gets a full floating card during the scrub */
  featured: boolean;
};

export const MUDRAS: Mudra[] = [
  {
    order: 1,
    name: 'Patāka',
    literal: 'the flag',
    frameStart: 1,
    frameEnd: 6,
    viniyoga: ['the beginning of dance', 'clouds', 'a forest', 'refusal', 'night', 'a river', 'wind', 'benediction'],
    reflection:
      'The first gesture a child is ever taught, and the last one they will ever outgrow. The hand that opens the dance is the same hand that gives the blessing at its end.',
    featured: true,
  },
  {
    order: 2,
    name: 'Tripatāka',
    literal: 'three parts of the flag',
    frameStart: 7,
    frameEnd: 12,
    viniyoga: ['a crown', 'a tree', 'the vajra', 'Indra', 'a lamp', 'rising flames', 'an arrow'],
    featured: false,
  },
  {
    order: 3,
    name: 'Ardhapatāka',
    literal: 'half a flag',
    frameStart: 13,
    frameEnd: 18,
    viniyoga: ['tender shoots', 'a writing tablet', 'a knife', 'a banner', 'a tower', 'a horn', 'a riverbank'],
    featured: false,
  },
  {
    order: 4,
    name: 'Kartarīmukha',
    literal: "the scissors' blades",
    frameStart: 19,
    frameEnd: 36,
    viniyoga: ['separation of man and woman', 'opposition', 'the corner of the eye', 'lightning', 'a creeper', 'falling'],
    featured: false,
  },
  {
    order: 5,
    name: 'Mayūra',
    literal: 'the peacock',
    frameStart: 37,
    frameEnd: 48,
    viniyoga: ["a peacock's beak", 'a creeper', 'a bird', 'wiping away tears', 'the forehead mark', 'parting the hair'],
    featured: false,
  },
  {
    order: 6,
    name: 'Ardhacandra',
    literal: 'the half moon',
    frameStart: 49,
    frameEnd: 60,
    viniyoga: [
      'the moon on the eighth night',
      'a spear',
      'consecrating an image',
      'the waist',
      'anxiety',
      'oneself',
      'meditation',
      'greeting',
      'rising to stand',
    ],
    reflection:
      'One hand holds the moon at half. It is the gesture of the self — of prayer, and of standing up. Children learn very early that the same shape can mean anxiety or devotion, and that the difference is entirely in the eyes.',
    featured: true,
  },
  {
    order: 7,
    name: 'Arāla',
    literal: 'bent',
    frameStart: 61,
    frameEnd: 66,
    viniyoga: ['drinking poison', 'drinking nectar', 'a violent wind'],
    featured: false,
  },
  {
    order: 8,
    name: 'Śukatuṇḍa',
    literal: "the parrot's beak",
    frameStart: 67,
    frameEnd: 78,
    viniyoga: ['shooting an arrow', 'a spear', 'mystery', 'recollection', 'ferocity', 'harsh speech'],
    featured: false,
  },
  {
    order: 9,
    name: 'Muṣṭi',
    literal: 'the closed fist',
    frameStart: 79,
    frameEnd: 90,
    viniyoga: ['steadiness', 'grasping hair', 'holding things', 'wrestling', 'running'],
    reflection:
      'Steadiness, made visible. Before a dancer can express anything, the hand must first learn to hold — and to hold nothing at all without trembling.',
    featured: true,
  },
  {
    order: 10,
    name: 'Śikhara',
    literal: 'the spire',
    frameStart: 91,
    frameEnd: 96,
    viniyoga: ['the god of love', 'a bow', 'a pillar', 'silence', 'a tooth', 'questioning', 'saying no', 'an embrace', 'firmness'],
    featured: false,
  },
  {
    order: 11,
    name: 'Kapittha',
    literal: 'the wood apple',
    frameStart: 97,
    frameEnd: 108,
    viniyoga: ['Lakshmi', 'Saraswati', 'holding cymbals', 'milking a cow', 'holding the end of a garment', 'holding a flower'],
    featured: false,
  },
  {
    order: 12,
    name: 'Kaṭakāmukha',
    literal: 'the opening of a bracelet',
    frameStart: 109,
    frameEnd: 144,
    viniyoga: ['plucking flowers', 'a pearl necklace', 'drawing an arrow', 'speech', 'glances', 'camphor', 'betel'],
    featured: false,
  },
  {
    order: 13,
    name: 'Sūcī',
    literal: 'the needle',
    frameStart: 145,
    frameEnd: 150,
    viniyoga: [
      'the number one',
      'Parabrahman',
      'the sun',
      'a city',
      'the world',
      'saying "thus"',
      'threatening',
      'a wheel',
      'thunder',
      'an umbrella',
      'understanding',
    ],
    reflection:
      'A single finger, and it can mean the number one, the sun, or the absolute. Learning that scale of meaning in one gesture is how a child begins to grasp that precision and imagination are not opposites.',
    featured: true,
  },
  {
    order: 14,
    name: 'Candrakalā',
    literal: 'the digit of the moon',
    frameStart: 151,
    frameEnd: 162,
    viniyoga: ['the moon on the first night', 'the face', "the crescent in Shiva's hair", 'measuring a cubit', 'the Ganga'],
    featured: false,
  },
  {
    order: 15,
    name: 'Padmakōśa',
    literal: 'the lotus bud',
    frameStart: 163,
    frameEnd: 174,
    viniyoga: ['fruit', 'a bell', 'an egg', 'a water lily', 'a cluster of flowers', 'an offering of food'],
    reflection:
      'The hand becomes a vessel — not yet open, not yet given. In the Gurukulam this is the shape of what a student is: holding something that has not bloomed, and learning the patience to let it.',
    featured: true,
  },
  {
    order: 16,
    name: 'Sarpaśīrṣa',
    literal: "the serpent's head",
    frameStart: 175,
    frameEnd: 186,
    viniyoga: ['sandal paste', 'a snake', 'slow movement', 'offering water to the gods', 'nourishing', "an elephant's ears"],
    featured: false,
  },
  {
    order: 17,
    name: 'Mṛgaśīrṣa',
    literal: "the deer's head",
    frameStart: 187,
    frameEnd: 192,
    viniyoga: ['women', 'the cheek', 'a mirror', 'practising steps', 'discussion', 'the number three', 'calling the beloved', 'fear'],
    featured: false,
  },
  {
    order: 18,
    name: 'Siṃhamukha',
    literal: "the lion's face",
    frameStart: 193,
    frameEnd: 204,
    viniyoga: ['the sacred fire offering', 'coral', 'a pearl', 'a lotus garland', 'an elephant', 'sacred grass', 'medicine', 'a tortoise'],
    reflection:
      'Named for the lion, used for the offering into fire. The tradition rarely lets a gesture stay literal for long — the fierce and the devotional share a single hand.',
    featured: true,
  },
  {
    order: 19,
    name: 'Kāṅgūla',
    literal: 'the tail-shaped hand',
    frameStart: 205,
    frameEnd: 216,
    viniyoga: ['the lakuca fruit', 'small bells', 'a great bell', 'the cakora bird', 'a betel nut tree', 'a white water lily', 'a coconut'],
    verse: {
      shloka: [
        'lakucasya phalē bālakiṅkiṇyāṃ ghaṇṭikārthakē I',
        'cakōrē kramukē bālakucē kalhārakē tathā II',
        'cātakē nālikērē ca kāṅgulō yujyatē karaḥ I',
      ],
      gloss: [
        'lakucasya phalē — the lakuca fruit',
        'bālakiṅkiṇyaṃ — small bells',
        'ghaṇṭikārthakē — a huge big bell',
        'cakōrē — a kind of bird',
        'kramukē — a betel nut tree',
        'kalhārakē — a white water lily',
        'cātakē — the cātaka bird',
        'nālikērē — a coconut',
        'kāṅgulō yujyatē karaḥ — are the uses of the Kāṅgūla hasta',
      ],
      videoId: 'Key6fbXDNc0',
    },
    featured: false,
  },
  {
    order: 20,
    name: 'Alapadma',
    literal: 'the fully bloomed lotus',
    frameStart: 217,
    frameEnd: 228,
    viniyoga: [
      'a lotus in full bloom',
      'circular movement',
      'separation',
      'a mirror',
      'the full moon',
      'beauty',
      'a village',
      'a lake',
      'praise',
    ],
    verse: {
      shloka: [
        'vikacābjē kapitthādiphalē cāvartakē kucē I',
        'virahē mukurē pūrṇacandrē saundaryabhāvanē ll',
        'dhammillē candraśālāyāṃ grāmē cōddhṛtakōpayōḥ I',
        'taṭākē śakaṭē cakravākē kalakalāravē II',
        "ślāghanē sō'lapadmaśca kīrtitō bharatāgamē I",
      ],
      gloss: [
        'vikācabjē — a full bloomed lotus',
        'āvartakē — circular movement',
        'virahe — separation',
        'mukurē — a mirror',
        'pūrṇacandrē — the full moon',
        'saundaryabhāvanē — beautiful',
        'grāmē — a village',
        'taṭākē — a lake',
        'ślāghanē — to praise',
        "sō'lapadmaśca kīrtitō bharatāgamē — are the usages of the Alapadma hasta according to Bharata",
      ],
      videoId: 'qn37NYFdRe0',
    },
    reflection:
      'The bud has opened. Separation and the full moon, a lake and a village, praise itself — all held in one spread palm. This is the gesture students reach for when a song turns from describing the world to loving it.',
    featured: true,
  },
  {
    order: 21,
    name: 'Catura',
    literal: 'the clever one',
    frameStart: 229,
    frameEnd: 240,
    viniyoga: ['musk', 'a little', 'gold', 'sorrow', 'taste', 'the eyes', 'a promise', 'sweetness', 'a slow walk', 'the face'],
    verse: {
      shloka: [
        'kastūryāṃ kiñcidarthē ca svarnē tāmrē ca lōhakē II',
        'ārdrē khēdē rasāsvādē lōcanē varṇabhēdanē I',
        'pramāṇē sarasē mandagamanē śakalīkṛtē II',
        'ānanē ghṛtatailādau yujyatē caturaḥ karaḥ I',
      ],
      gloss: [
        'kastūryāṃ — musk',
        "kiñcidarthē — to denote 'a little'",
        'ārdrē — wet',
        'khēdē — sorrow',
        'rasāsvādē — enjoying taste',
        'pramāṇē — a promise',
        'sarasē — sweetness',
        'mandagamanē — slow walk',
        'yujyatē caturaḥ karaḥ — are the uses of the Catura hasta',
      ],
      videoId: 'hOL47OYH_ec',
    },
    featured: false,
  },
  {
    order: 22,
    name: 'Bhramara',
    literal: 'the bee',
    frameStart: 241,
    frameEnd: 246,
    viniyoga: ['a bee', 'a parrot', 'wings', 'a crane', 'the cuckoo'],
    verse: {
      shloka: [
        'bhramērē ca śukē pakṣē sārasē kōkilādiṣu II',
        "bhramarākhyaśca hastō 'yaṃ kirtītō bhratāgamē I",
      ],
      gloss: [
        'bhramērē — a bee',
        'śukē — a parrot',
        'pakṣē — wings',
        'sārasē — a crane',
        'kōkilā — the cuckoo bird',
        "bhramarākhyaśca hastō 'yaṃ kirtītō bhratāgamē — are the uses of the Bhramara hasta according to Bharata",
      ],
      videoId: 'jh3ML6T2RRk',
    },
    featured: false,
  },
  {
    order: 23,
    name: 'Haṃsāsya',
    literal: "the swan's face",
    frameStart: 247,
    frameEnd: 258,
    viniyoga: ['tying the mangalsutra', 'giving instruction', 'certainty', 'a pearl necklace', 'jasmine', 'painting', 'a bite'],
    verse: {
      shloka: [
        'māṅgalyaṃ sūtrabandhē ca upadēśaviniścayē II',
        'rōmāñcē mauktikādau ca dīpavartiprasāraṇē I',
        'nikaṣē mallikādau ca citrē tallēkhanē tathā II',
        'daṃśē ca jalabandhē ca hamsāsyō yujyatē karaḥ I',
      ],
      gloss: [
        'māṅgalyaṃ sūtrabandhē — the tying of the mangalsutra',
        'upadēsa — giving advice or instruction',
        'viniścayē — certainty',
        'rōmāñcē — horripilation',
        'mauktikādau — a necklace of pearls',
        'dīpavartiprasāraṇē — to sharpen the tip of the wick',
        'mallikādau — a jasmine flower',
        'citrē tallēkhanē — to draw or to paint',
        'haṃsāsyō yujyatē karaḥ — are usages of the Haṃsāsya hasta',
      ],
      videoId: '_dBDwVF8Jiw',
    },
    featured: false,
  },
  {
    order: 24,
    name: 'Haṃsapakṣa',
    literal: "the swan's wing",
    frameStart: 259,
    frameEnd: 264,
    viniyoga: ['the number six', 'the building of a bridge', 'writing with the nails', 'covering'],
    verse: {
      shloka: [
        'ṣaṭsaṅkhyāyāṃ sētubandhē nakharēkhāṅkaṇē tathā II',
        "pidhānē haṃsapakṣō'yaṃ katithō bharatāgamē I",
      ],
      gloss: [
        "ṣaṭsaṅkhyā — to denote the number 'six'",
        'sētubandhē — construction of the bridge',
        'nakharēkhāṅkaṇē — putting nail marks on the leaf, or writing a letter with the nails as in the olden days',
        'pidhānē — to cover',
        "haṃsapakṣō'yaṃ katithō bharatāgamē — are the uses of Haṃsapakṣa hasta as said by Bharata",
      ],
      videoId: 'I6bHj5fGtiA',
    },
    reflection:
      'A bridge, and the act of covering. The academy teaches each gesture with its verse — so a nine-year-old learns Sanskrit grammar and the shape of a swan’s wing in the same breath.',
    featured: true,
  },
  {
    order: 25,
    name: 'Sandaṃśa',
    literal: 'the pincers',
    frameStart: 265,
    frameEnd: 276,
    viniyoga: ['the belly', 'an offering to God', 'a wound', 'a worm', 'great fear', 'worship', 'the number five'],
    verse: {
      shloka: [
        'udarē balidānē ca vraṇē kīṭē mahābhayē II',
        'arcanē pañcasaṅkhyāyāṃ sandaṃśākhyō niyujyatē I',
      ],
      gloss: [
        'udarē — the belly',
        'balidānē — making an offering to God',
        'vraṇē — a wound',
        'kīṭē — a worm',
        'mahābhayē — great fear',
        'arcanē — to worship',
        "pañcasaṅkhyā — to denote the number 'five'",
        'sandaṃśākhyō niyujyatē — are the uses of the Sandaṃśa hasta',
      ],
      videoId: 'e39ivEbqBcA',
    },
    featured: false,
  },
  {
    order: 26,
    name: 'Mukula',
    literal: 'the bud',
    frameStart: 277,
    frameEnd: 288,
    viniyoga: ['a water lily', 'eating', 'the five arrows of Manmatha', 'placing religious marks', 'the navel', 'a plantain flower'],
    verse: {
      shloka: [
        'kumudē bhōjanē pañcabaṇē mudrādidhāraṇē II',
        'nābhau ca kadalīpuṣpē yujyatē mukulaḥ karaḥ I',
      ],
      gloss: [
        'kumudē — a water lily',
        'bhōjanē — to eat',
        'pañcabaṇē — the five arrows of Lord Manmatha',
        'mudrādidhāraṇē — placing religious marks',
        'nābhau — the navel',
        'kadalīpuṣpē — a plantain flower',
        'yujyatē mukulaḥ karaḥ — are the uses of the Mukula hasta',
      ],
      videoId: 'LRYJZI7M1bM',
    },
    featured: false,
  },
  {
    order: 27,
    name: 'Tāmracūḍa',
    literal: "the cock's comb",
    frameStart: 289,
    frameEnd: 300,
    viniyoga: ['writing', 'the number twelve', 'the crowing of a cock', 'a calf'],
    reflection:
      'Twenty-eight gestures, learned one at a time, over years. No shortcut exists — which is exactly the lesson. A child who can do this can do anything that asks for patience.',
    featured: true,
  },
  {
    order: 28,
    name: 'Triśūla',
    literal: 'the trident',
    frameStart: 301,
    frameEnd: 324,
    viniyoga: ['a bilva leaf', 'the number three', 'a wood apple leaf'],
    featured: false,
  },
];

export const FEATURED_MUDRAS = MUDRAS.filter((m) => m.featured);

/**
 * Fail loudly at module load if the gesture schedule and the exported sequence
 * have drifted apart.
 *
 * The frame numbers above are real indices into public/frames, derived from the
 * reference guide at 6fps. That is only true while the extraction is 6fps over
 * 54s. A re-extraction at another density would leave every range silently
 * pointing at the wrong gesture — the homepage would caption the hand
 * incorrectly and the act anchors in lib/acts.ts would drift with it, which is
 * exactly the class of bug the checker there exists to catch.
 *
 * So assert the invariant directly: the 28 ranges must tile 1..FRAME_COUNT with
 * no gap and no overlap. If this throws, rerun _research/extract_frames.ps1 and
 * _research/retime_mudras.py rather than editing the numbers by hand.
 */
(function verifyFrameSchedule() {
  let expected = 1;
  for (const m of MUDRAS) {
    if (m.frameStart !== expected) {
      throw new Error(
        `Mudra ${m.order} (${m.name}) starts at frame ${m.frameStart}, expected ${expected}. ` +
          `The gesture schedule no longer tiles the exported sequence.`,
      );
    }
    if (m.frameEnd < m.frameStart) {
      throw new Error(`Mudra ${m.order} (${m.name}) ends before it starts`);
    }
    expected = m.frameEnd + 1;
  }
  if (expected - 1 !== FRAME_COUNT) {
    throw new Error(
      `Gesture schedule covers ${expected - 1} frames but FRAME_COUNT is ${FRAME_COUNT}. ` +
        `Re-extract at ${FRAMES_PER_SECOND}fps or recompute the ranges.`,
    );
  }
})();

/** Gestures whose Sanskrit verse the academy has published as a Theory Class. */
export const VERSE_MUDRAS = MUDRAS.filter((m) => m.verse);

/**
 * The gesture's frame range on the live sequence, 1-indexed and inclusive.
 *
 * frameStart/frameEnd are already live frame numbers, so this is now a plain
 * accessor. It is kept because ScrollStage, StaticActs and the /hastas page all
 * call it, and because it is the right place to put any future remap if the
 * extraction density ever stops being 6fps.
 */
export function liveFrames(m: Mudra): { start: number; end: number } {
  return { start: m.frameStart, end: m.frameEnd };
}

/**
 * Normalised scroll progress (0–1) spanned by a gesture.
 *
 * Frame n covers progress [(n-1)/FRAME_COUNT, n/FRAME_COUNT], so an inclusive
 * range [start, end] spans from (start-1)/FRAME_COUNT to end/FRAME_COUNT.
 */
export function mudraProgress(m: Mudra): { start: number; end: number; mid: number } {
  const start = (m.frameStart - 1) / FRAME_COUNT;
  const end = m.frameEnd / FRAME_COUNT;
  return { start, end, mid: (start + end) / 2 };
}

/** Which gesture is on screen at a given normalised scroll progress. */
export function mudraAtProgress(progress: number): Mudra {
  const clamped = Math.min(1, Math.max(0, progress));
  const frame = Math.min(FRAME_COUNT, Math.floor(clamped * FRAME_COUNT) + 1);
  return MUDRAS.find((m) => frame >= m.frameStart && frame <= m.frameEnd) ?? MUDRAS[0];
}

/** Look up a gesture by IAST name. Throws at module load if the name is wrong. */
export function mudraByName(name: string): Mudra {
  const found = MUDRAS.find((m) => m.name === name);
  if (!found) throw new Error(`Unknown mudra: ${name}`);
  return found;
}
