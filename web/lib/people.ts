/**
 * The people: the founders and the faculty, as the academy's own pages describe
 * them. Feeds the lineage page and the Schema.org Person nodes.
 */

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
    bio: 'A Bharatanatyam dancer, choreographer, and teacher with strong artistic roots in Sri Lanka. She began her training in the Vazhuvoor style under Smt. Sangeetha Karthikeyan and later studied the Kalakshetra Bani for over nine years under Sunitta Menghanaani, whom she joined in 2017. Her dance and teaching work extends to AIMA in Chennai and the SEED NGO in Sri Lanka.',
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
      'Graded Artist, Doordarshan',
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
