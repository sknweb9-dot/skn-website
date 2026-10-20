/**
 * The questions a parent asks, with the academy's own answers. Feeds /book and
 * the FAQPage structured data.
 */

/**
 * Ten of the twenty questions in the FAQ of `Website Contents.docx`, chosen for
 * what moves a parent who is deciding, and transcribed verbatim. Answers keep
 * the docx's paragraph breaks as blank lines. Shown on /book, where a parent
 * pauses before enquiring, and emitted as FAQPage markup only there: FAQ
 * structured data must match questions visible on the same page.
 *
 * Left out, on purpose: progression through the levels, the Kalakshetra Bani,
 * Gurukulam, literature and theory, "is it extracurricular", practice at home,
 * classes outside Chennai, Arangetram being optional, what makes SKN
 * different, and how to join. Each is covered by /curriculum, /about,
 * /locations or the booking flow itself; the docx is the place to restore any.
 *
 * This replaced an earlier set of nine written for search. Those answers named
 * a residential complex the academy asked to keep off the site, called the
 * director a "graduate" where Kalakshetra awards diplomas, and promised a trial
 * class that does not exist.
 */
const p = (...paragraphs: string[]) => paragraphs.join('\n\n');

export const FAQS = [
  {
    q: 'At what age can students begin Bharatanatyam at SKN? Do they need prior experience?',
    a: p(
      'Students can begin at different ages and do not need prior dance experience. Our students range from 3.5 years to 60+ years, including adults who have started their journey after the age of 35.',
      'Young children may begin with our Introductory Programme, while formal Bharatanatyam training begins at Level 1. What matters most is the willingness to learn, practise, and grow.',
    ),
  },
  {
    q: 'Does a student need natural talent to learn Bharatanatyam?',
    a: 'No. We believe that anyone willing to work sincerely, practise consistently, and persevere can learn Bharatanatyam. Talent may differ, but dedication and commitment make the real difference.',
  },
  {
    q: 'Can adults learn Bharatanatyam at SKN?',
    a: 'Absolutely. SKN welcomes adult learners, whether they are beginning for the first time or returning to dance after many years. Our students include adults who have started their journey well into their 30s, 40s, and beyond.',
  },
  {
    q: 'Does SKN conduct programmes within residential communities?',
    a: p(
      "Yes. Taking Bharatanatyam closer to where families live is an important part of SKN's outreach.",
      'We conduct classes within residential communities and apartment complexes, making it easier for children to learn without parents having to travel long distances after increasingly demanding school schedules and working hours.',
      'SKN brings the same structured curriculum, discipline, teaching standards, and artistic values to community-based classes.',
      'Communities interested in starting a group can contact SKN. A minimum of 5 participants is required.',
    ),
  },
  {
    q: "Can parents watch their child's classes?",
    a: p(
      'At SKN, parents, students, and teachers work as a team.',
      "To help parents understand their child's progress and learning journey, parents are permitted to observe classes once every two months. This allows them to see their child's development while also maintaining the focused learning environment of the class.",
    ),
  },
  {
    q: 'How are students assessed at SKN?',
    a: p(
      "Assessment at SKN is not about marks or competition. We look at the student's understanding, presentation, effort, consistency, hard work, ability to overcome fear, and overall growth.",
      'Examinations are also conducted at appropriate stages as part of the structured learning journey.',
    ),
  },
  {
    q: 'What does SKN do for the overall development of students?',
    a: p(
      'At SKN, we believe education should nurture the individual, not just the skill.',
      "Alongside Bharatanatyam, we create opportunities for students to understand themselves, build emotional awareness, and develop mindful ways of living. Our Soulful Sunday series, specially designed by a counsellor who is also a Bharatanatyam dancer and SKN's first student, explores emotional growth and mindful living.",
      'We also conduct sessions and activities that encourage students to reflect, understand themselves better, and grow with confidence.',
    ),
  },
  {
    q: 'What performance opportunities are available for students?',
    a: p(
      'Students may participate in SKN productions, Udaan, Udaan Rising Artist, ensembles, workshops, and other institutional performances, depending on their level and readiness.',
      'Our Outreach Programmes also take Bharatanatyam into the community, including special performances and interactions for children with special needs.',
    ),
  },
  {
    q: 'How does SKN prepare students for an Arangetram?',
    a: p(
      "Arangetram preparation at SKN looks beyond performance alone. Along with artistic and technical preparation, we consider the student's physical wellbeing, stamina, confidence, and overall readiness.",
      "A consultation with a physiotherapist is compulsory as part of the process, helping us understand the student's physical requirements and take appropriate measures to prevent injury.",
    ),
  },
  {
    q: 'Are there additional costs apart from regular class fees?',
    a: 'The regular programme fee covers the applicable teaching programme. Certain activities such as examinations, costumes, performances, workshops, or special programmes may involve additional costs when applicable. These will always be communicated in advance.',
  },
] as const;
