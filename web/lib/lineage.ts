/**
 * Institutional narrative, transcribed from `Website Contents.docx`.
 *
 * This is the authoritative version of the About / Founder / Director / Emblem
 * copy. Where it disagrees with the bios crawled into `site.ts`
 * (FOUNDERS, FACULTY), this file wins — the crawled bios are older drafts.
 *
 * Everything here is verbatim or lightly split into paragraphs. Nothing is
 * paraphrased, because this copy also backs the JSON-LD description fields.
 *
 * ONE DELIBERATE DEVIATION: the docx renamed the section heading from
 * "Our Co-Founder & Artistic Director" to "Our Co-Founder & Director", but left
 * "Co-Founder & Artistic Director" in the About paragraph and the vision
 * attribution. Read as an incomplete edit rather than two real titles, so the
 * shorter form is used throughout. Flagged for the academy to confirm.
 */

export const ABOUT = {
  eyebrow: 'About',
  heading: 'Shanti Kala Nikketan',
  subheading: 'Academy of Fine Arts',
  body: [
    'Founded on 18 April 2009, Shanti Kala Nikketan (SKN) is dedicated to preserving, nurturing, and promoting the rich traditions of Indian classical arts through authentic education and artistic excellence.',
    'Inspired by the vision of Founder Om – Guru – Om, Co-Founder & Director Sunitta Menghanaani has nurtured SKN into an institution where learning extends far beyond mastering dance. Rooted in the timeless Gurukulam tradition and the Kalakshetra bani of Bharatanatyam, the academy cultivates discipline, knowledge, cultural understanding, and artistic excellence through a holistic approach to education.',
    'At SKN, students are encouraged to develop a deeper appreciation of Bharatanatyam by exploring its connection with literature, mythology, music, and philosophy. We believe that classical dance is not merely a performing art but a way of understanding India\u2019s rich cultural heritage and timeless values.',
    'The foundation of our teaching lies in the sacred bond between Guru and Shishya — a relationship built on trust, dedication, mutual respect, and lifelong learning. It is through this philosophy that every student is guided to grow not only as a dancer, but also as a confident, disciplined, and culturally aware individual.',
    'Today, with its headquarters in Chennai and an expanding international presence, Shanti Kala Nikketan proudly nurtures students in India and across the world, continuing its commitment to preserving the timeless traditions of Bharatanatyam while inspiring future generations through the universal language of dance.',
  ],
} as const;

export const FOUNDER = {
  eyebrow: 'Our Founder',
  name: 'Om – Guru – Om',
  image: '/img/founder-omguruom.jpg',
  body: [
    'Om – Guru – Om envisioned art not merely as a discipline to be learned, but as a sacred path towards self-discovery, devotion, and the realization of the Divine.',
    'For him, every art form is an expression of the eternal — one that transcends the boundaries of language, culture, and time. Through sincere practice, Gyan (knowledge) and Bhakti (devotion), the artist discovers not only artistic excellence but also inner transformation.',
    'His philosophy reminds us that art is not simply performance; it is a spiritual journey. Every movement, every note, and every expression becomes an offering that connects the individual with the Divine while inspiring compassion, wisdom, and harmony.',
    'It is this timeless vision that continues to guide Shanti Kala Nikketan, where art is nurtured as a means of personal growth, cultural preservation, and spiritual enrichment.',
  ],
  vision: {
    label: 'His Vision',
    lines: [
      'Art is not ordinary.',
      'It is the Divine expressing itself through the artist.',
      'The formless finds form and reveals itself to the world.',
    ],
  },
} as const;

export const DIRECTOR = {
  eyebrow: 'Our Co-Founder & Director',
  name: 'Sunitta Menghanaani',
  /** Identity confirmed by the academy. Renamed from the crawled filename. */
  image: '/img/founder-sunitta.jpg',
  portraitConfirmed: true,
  body: [
    'Sunitta Menghanaani is a Bharatanatyam artiste, educator, and choreographer whose journey reflects a lifelong dedication to the preservation and dissemination of Indian classical arts.',
    'Originally from Pune, she chose Chennai as her karmabhumi to pursue advanced training in Bharatanatyam. She began learning dance at the age of three under Smt. Geeta Nair and later trained in Bharatanatyam at the prestigious Kalakshetra Foundation, Rukmini Devi College of Fine Arts, Chennai.',
    'Following her training at Kalakshetra, she further refined her artistic and teaching experience through her training and association with Sahrdaya Foundation, Chennai, enriching her journey as a performer, teacher, and choreographer.',
    'For over a decade and a half, she has dedicated herself to training students of all ages, mentoring aspiring dancers, choreographing original productions, and nurturing Shanti Kala Nikketan into a vibrant institution committed to excellence in Bharatanatyam education.',
    'Guided by the belief that every individual has the potential to learn Bharatanatyam, Sunitta believes that true progress is achieved not through innate talent alone, but through sincerity, discipline, perseverance, and consistent practice. Through the Gurukulam tradition, she strives to nurture not only skilled dancers but also individuals grounded in culture, values, and lifelong learning.',
  ],
  credentials: [
    // Kalakshetra awards its own diplomas, not degrees, so "Graduate" was wrong.
    // Wording confirmed by the director herself.
    'First Class Diploma, Rukmini Devi College of Fine Arts, Kalakshetra Foundation',
    'M.F.A., Kalai Kaveri College of Fine Arts, Tiruchirappalli',
    'B.Com., University of Pune',
    'Best Performer Award, Sri Parthasarathy Swami Sabha',
    'Exemplar Award, Dorai Foundation, Chennai',
  ],
  vision: {
    label: 'Her Vision',
    quote:
      'I believe Bharatanatyam is far more than a performing art or an extracurricular activity — it is a way of life. Through dance, we learn to connect with ourselves, cultivate discipline, embrace our culture, and grow into compassionate, confident, and grounded individuals. My vision is to create a nurturing environment where every student is welcomed without judgement, encouraged to discover their own potential, and inspired to experience the transformative power of Bharatanatyam — not just as dancers, but as better human beings.',
    attribution: 'Sunitta Menghanaani, Co-Founder & Director',
  },
} as const;

/**
 * The emblem, element by element. /img/logo-emblem.png is the approved artwork
 * artwork; these are the meanings the academy assigns to each part.
 */
export const EMBLEM = {
  eyebrow: 'Our Emblem',
  heading: 'Read the mark',
  lead: "The emblem of Shanti Kala Nikketan is a visual reflection of the institution's philosophy, bringing together spirituality, artistic excellence, and the timeless values of the Guru–Shishya tradition.",
  elements: [
    {
      name: 'Lord Ganesha',
      body: 'At its heart is Lord Ganesha, the remover of obstacles and the embodiment of wisdom, auspicious beginnings, and harmony. His presence reminds us that every artistic journey begins with humility, devotion, and the pursuit of knowledge.',
    },
    {
      name: 'The three interwoven circles',
      body: "The three interwoven circles symbolize the harmony and interconnectedness of dance, music, and the fine arts. Though each discipline has its own unique identity, together they enrich the artist's journey towards creativity, self-discovery, and the infinite.",
    },
    {
      name: 'The open palms',
      body: 'The open palms represent love, unity, peace, and selfless guidance — the values that form the foundation of Shanti Kala Nikketan. They reflect the nurturing bond between Guru and Shishya, where knowledge is shared with compassion and every learner is encouraged to grow with confidence and integrity.',
    },
    {
      name: 'The enclosing circle',
      body: 'The enclosing circle signifies wholeness, continuity, and the lifelong journey of learning. It reminds us that the pursuit of art is not merely about mastering a skill, but about continuous growth, inner transformation, and the preservation of tradition.',
    },
  ],
  close:
    'Together, these elements embody the spirit of Shanti Kala Nikketan — where the arts are nurtured with authenticity, discipline, and devotion, inspiring individuals to grow not only as accomplished artists but also as compassionate human beings.',
} as const;
