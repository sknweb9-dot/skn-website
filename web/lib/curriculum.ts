/**
 * The academy's curriculum, transcribed from `Website Contents.docx`.
 *
 * This file supersedes the `STAGES` export that was crawled from the previous
 * website. The two disagree materially and the docx is authoritative:
 *
 *   - The old data described seven "stages". The real structure is an
 *     Introductory Programme, six numbered Levels, and a Performance &
 *     Arangetram Programme that is explicitly NOT a teaching level.
 *   - The Introductory Programme takes children from 3.5, not 4.
 *   - Repertoire was attributed to the wrong levels. The old data placed
 *     Alarippu, Jatiswaram and Shabdam together at Level 3; in fact Alarippu
 *     belongs to Level 3 alongside Tevaram and Divya Prabandham, while
 *     Jatiswaram and Shabdam belong to Level 4.
 *
 * Descriptions are transcribed, not paraphrased. `develops` is parent-facing
 * framing derived from the description — presentational, and deliberately kept
 * out of the JSON-LD.
 */

export type Programme = {
  /** Stable id used for anchors and scroll targets */
  id: string;
  /** Display label, e.g. "Level 1" */
  label: string;
  /** The name of the level */
  name: string;
  /** Age guidance, where the academy publishes one */
  ages?: string;
  /** Transcribed from Website Contents.docx */
  description: string;
  /** Repertoire introduced at this level, as named in the docx */
  repertoire: string[];
  /** Parent-facing developmental framing. Interpretive, not doctrinal. */
  develops: string[];
  image: string;
};

/**
 * The gentle entry point. Formal Bharatanatyam training begins at Level 1;
 * this programme deliberately precedes it.
 */
export const INTRODUCTORY: Programme = {
  id: 'introductory',
  label: 'Introductory Programme',
  name: 'Introduction to the Arts',
  ages: 'Ages 3.5 – 6 years',
  description:
    'A gentle and joyful introduction designed for young children to develop rhythm, coordination, concentration, confidence, and cultural values. Through Sanskrit shlokas, devotional themes, storytelling, creative movement, rhythm exercises, and expressive dance activities, children are introduced to Indian culture in an engaging and age-appropriate manner before beginning formal Bharatanatyam training.',
  repertoire: ['Sanskrit shlokas', 'Devotional themes', 'Storytelling', 'Rhythm exercises'],
  develops: ['Listening and attention', 'Gross motor coordination', 'Comfort in front of others'],
  image: '/img/stage-1-intro.jpg',
};

/** The six graded levels of formal training. */
export const LEVELS: Programme[] = [
  {
    id: 'level-1',
    label: 'Level 1',
    name: 'Foundation',
    description:
      'Students establish a strong technical foundation through basic Adavus, Hastas, rhythm training, introductory theory, and devotional compositions such as Mallari and Nottuswaram.',
    repertoire: ['Basic Adavus', 'Hastas', 'Mallari', 'Nottuswaram'],
    develops: ['Posture and alignment', 'Counting and rhythm (tala)', 'Following multi-step instruction'],
    image: '/img/stage-2-foundation.jpg',
  },
  {
    id: 'level-2',
    label: 'Level 2',
    name: 'Technique Development',
    description:
      'Building strength, precision, and coordination through advanced Adavus while expanding theoretical knowledge and introducing traditional repertoire including Kauthuvam and Todayamangalam.',
    repertoire: ['Advanced Adavus', 'Kauthuvam', 'Todayamangalam'],
    develops: ['Core strength and stamina', 'Balance and spatial control', 'Sustained practice habits'],
    image: '/img/stage-3-strength.jpg',
  },
  {
    id: 'level-3',
    label: 'Level 3',
    name: 'Margam Preparation',
    description:
      'Students begin their journey into the classical Margam, learning foundational performance pieces such as Alarippu, while continuing to strengthen technique and musical understanding through Tevaram and Divya Prabandham.',
    repertoire: ['Alarippu', 'Tevaram', 'Divya Prabandham'],
    develops: ['Memory for long sequences', 'Musical understanding', 'Independent self-correction'],
    image: '/img/stage-4-transition.jpg',
  },
  {
    id: 'level-4',
    label: 'Level 4',
    name: 'Repertoire & Expression',
    description:
      "Students expand their artistic vocabulary through Jatiswaram, Shabdam, Keerthanam, and Virutham, while developing expressive storytelling, abhinaya, and a deeper appreciation of Bharatanatyam's cultural heritage.",
    repertoire: ['Jatiswaram', 'Shabdam', 'Keerthanam', 'Virutham'],
    develops: ['Emotional articulation (abhinaya)', 'Narrative interpretation', 'Cultural literacy'],
    image: '/img/stage-5-expression.jpg',
  },
  {
    id: 'level-5',
    label: 'Level 5',
    name: 'Advanced Artistry',
    description:
      'Technical excellence is refined through Thillana, Ashtapadi, Bhajan, and Javali, alongside advanced study of theory, literature, composers, and expressive interpretation.',
    repertoire: ['Thillana', 'Ashtapadi', 'Bhajan', 'Javali'],
    develops: ['Technical precision', 'Interpretive judgement', 'Knowledge of composers and texts'],
    image: '/img/stage-6-maturity.jpg',
  },
  {
    id: 'level-6',
    label: 'Level 6',
    name: 'Mastery',
    description:
      'The final academic level focuses on the most demanding elements of the Bharatanatyam repertoire, including Varnam, Padam, and Swarajathi, cultivating technical maturity, artistic excellence, and independent performance ability.',
    repertoire: ['Varnam', 'Padam', 'Swarajathi'],
    develops: ['Technical maturity', 'Artistic excellence', 'Independent performance ability'],
    image: '/img/stage-7-arangetram.jpg',
  },
];

/**
 * Not a teaching level. The docx is explicit about this, and the distinction
 * matters: it is a period of preparation entered after Level 6, not a seventh
 * rung on the ladder.
 */
export const ARANGETRAM = {
  id: 'arangetram',
  label: 'Performance & Arangetram',
  name: 'The Debut',
  lead: 'Following successful completion of Level 6, students enter a dedicated Performance & Arangetram Programme.',
  description:
    "This is not a teaching level but a period of intensive rehearsals, stagecraft, performance refinement, stamina building, orchestra rehearsals, and individual mentoring, culminating in the student's Arangetram — a significant milestone marking their formal debut as a Bharatanatyam performer.",
  includes: [
    'Intensive rehearsals',
    'Stagecraft and performance refinement',
    'Stamina building',
    'Orchestra rehearsals',
    'Individual mentoring',
  ],
  image: '/img/stage-7-arangetram.jpg',
} as const;

/** Introductory + six levels, in teaching order. Excludes Arangetram by design. */
export const TEACHING_PROGRAMMES: Programme[] = [INTRODUCTORY, ...LEVELS];

/** Transcribed framing for the curriculum as a whole. */
export const CURRICULUM_INTRO = {
  eyebrow: 'Our Gurukulam Approach',
  heading: 'Six levels, not six terms',
  body: [
    'At SKN, Bharatanatyam is not simply taught — it is experienced as a lifelong journey of learning, discipline, and self-discovery.',
    'Rooted in the timeless Gurukulam tradition and the Kalakshetra bani, our curriculum has been thoughtfully designed to guide every student through a structured progression of technical excellence, artistic expression, theoretical understanding, and stage confidence.',
    'Each level builds naturally upon the previous one, ensuring that students develop a strong foundation before progressing towards advanced repertoire and ultimately, the Arangetram.',
  ],
} as const;
