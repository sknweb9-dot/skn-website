"""Copy for the prototype.

Transcribed from the academy's own pages where the text exists, corrected where
the source is defective, and newly written where the source has nothing. Every
block is tagged so the client review knows what to check.

  SOURCE  verbatim or lightly edited from shantikalanikketan.com
  FIXED   from the source, with a factual or grammatical error corrected
  NEW     written for this prototype, needs approval

Normalisations applied throughout: the school is "Shanti Kala Nikketan" (the
live site also has "Shanthi Kala Niketan" and "Shanti Ka la Nikketan"); the
director is "Sunitta Menghanaani" (the live site's /director page has "Sunita");
"Jahnavi" per the YouTube title (the photos page has "Jhanvi's").
"""

ORG = {
    'name': 'Shanti Kala Nikketan',
    'tagline': 'Academy of Fine Arts',
    'founded': '18 April 2009',
    'founded_iso': '2009-04-18',
    'email': 'shantikalanikketan@gmail.com',
    'phone_href': '+919884022306',
    'phone': '+91 98840 22306',
    'address': ['11018, Ground Floor, Tower 11', 'Prestige Courtyard',
                'Model School Extension Road', 'Sholinganallur, Chennai 600119'],
    'instagram': 'https://www.instagram.com/shantikalanikketan',
    'facebook': 'https://www.facebook.com/shantikalanikketan',
    'youtube': 'https://www.youtube.com/channel/UCDGm0LQ-24ZIKG-2DUAn2ew',
}

# --------------------------------------------------------------------- home --

HERO = {
    # NEW -- the concept, stated as an invitation rather than a lecture
    'kicker': 'Bharatanatyam in Chennai since 2009',
    'title': 'One hand.<br>Seventeen meanings.',
    'lead': 'In Bharatanatyam a single gesture can be a lotus, a mirror, the full '
            'moon, a village, or unmistakable anger. Nothing about the hand '
            'changes. Only what it is asked to say.',
    'sub': 'This is what your child learns here &mdash; not steps, but a language.',
    'cta': 'Enquire about classes',
    'cta2': 'How the learning works',
}

# SOURCE -- Sunitta's own words, and the most reassuring sentence on the site
PROMISE = {
    'quote': 'Everyone can learn dance. The only talent required is a talent to '
             'work hard.',
    'attrib': 'Sunitta Menghanaani',
    'attrib_role': 'Co-founder &amp; Artistic Director',
    # SOURCE, condensed from the home and /shanti-kala-nikketan pages
    'body': [
        'Shanti Kala Nikketan was born on 18th April 2009. We nurture the '
        'Gurukulam style of education, where students practise the classical art '
        'form alongside the literature and mythology that give it meaning.',
        'The Kalakshetra style of Bharatanatyam is our adopted method. We insist '
        'on a synergy of commitment and perseverance, where Guru and Shishya '
        'flourish together.',
    ],
}

# SOURCE -- the seven stages as published on /gurukulam, verbatim text
STAGES = [
    ('Introductory Stage', 'Ages 4&ndash;6',
     'A gentle introduction to rhythm, movement and expression through shlokas, '
     'playful adavus and creative learning that builds comfort with the art form.'),
    ('Foundation Stage', 'Level 1 &middot; Ages 6+',
     'Building strong roots in Bharatanatyam through basic adavus, rhythm '
     'awareness, foundational theory and simple abhinaya.'),
    ('Strengthening Stage', 'Level 2',
     'Developing stability and control through advanced adavus, deeper theory '
     'understanding and introduction to structured repertoire.'),
    ('Transition Stage', 'Level 3',
     'Moving into classical repertoire with Alarippu, Jatiswaram and Shabdam, '
     'while beginning to understand the history and context of Bharatanatyam.'),
    ('Expression Stage', 'Level 4',
     'Expanding emotional depth through Keerthanams, Bhajans and Thillana, along '
     'with exposure to the stories of dance and culture.'),
    ('Maturity Stage', 'Level 5',
     'Refining expressive and technical mastery through Varnam and Padam, with '
     'deeper exploration of abhinaya and composers.'),
    ('Performance Readiness Stage', 'Level 6',
     'The final stage of preparation towards Arangetram &mdash; stamina, '
     'refinement, confidence and independent stage presence.'),
]

# FIXED -- the lineage. Aparna Manu is absent from the previous build entirely,
# though she is the only person on the live /director page.
LINEAGE = {
    'intro': 'Guru to shishya, and then shishya to guru. Two of the people who now '
             'lead Shanti Kala Nikketan learned to dance here.',
    'chain': [
        {'name': 'Om Guru Om', 'role': 'Founder',
         'note': 'The philosophical origin of the academy. &ldquo;Art is not common; '
                 'it is the divine expression which reveals itself.&rdquo;',
         'kind': 'origin', 'image': 'assets/img/founder-omguruom.jpg'},
        {'name': 'Sunitta Menghanaani', 'role': 'Co-founder &amp; Artistic Director',
         'note': 'Trained from the age of three; graduated in Bharatanatyam from '
                 'Kalakshetra Foundation, Rukmini Devi College of Fine Arts. '
                 'Awarded the Exemplar Award by the Dorai Foundation.',
         'kind': 'guru', 'image': 'assets/img/sunitta.jpg'},
        {'name': 'Aparna Manu', 'role': 'Head, Delhi Branch',
         'note': 'Fifteen years a student of Sunitta &mdash; the academy&rsquo;s '
                 'first student. Now teaching in Delhi.',
         'kind': 'shishya', 'image': 'assets/img/event-aparna.jpg'},
        {'name': 'S. Kirusanthini', 'role': 'Head, Canada Branch',
         'note': 'Seven years in the Kalakshetra style under Sunitta. Best Dancer '
                 'Award, UNIPUN Sri Lanka. Now teaching in Scarborough.',
         'kind': 'shishya', 'image': 'assets/img/team-kirusanthini.jpg'},
    ],
}

# Photography. Alt text is drawn from what the images actually show; the Wix
# originals carried filenames rather than descriptions, so these are new and
# should be checked by someone who was in the room.
IMAGES = {
    'band_home': ('assets/img/hero-home.jpg',
                  'A large group of students in bright performance costume, '
                  'photographed outdoors.'),
    'stages': ('assets/img/stage-1-intro.jpg',
               'A teacher guiding a young dancer, both in full costume and jewellery.'),
    'udaan': ('assets/img/event-udaan-2025.jpg',
              'Poster artwork for Udaan 2025, showing a swan beneath the '
              'production title.'),
    'branches': ('assets/img/ensemble.jpg',
                 'Students in matching teal costume moving together outdoors.'),
    'embrace': ('assets/img/gallery-3.jpg',
                'A dancer holding an expressive Bharatanatyam pose.'),
}

# SOURCE -- Udaan, condensed from /events
UDAAN = {
    'title': 'Udaan',
    'meaning': 'flying high to reach our goals',
    'body': [
        'Every dancer deserves a platform, whatever stage of learning they are at. '
        'Udaan is our annual offering to the art form, and to our students.',
        'Like a swan separating milk from water, the guiding light of a Guru lets a '
        'shishya find the beauty in the art while overcoming its difficulties '
        '&mdash; and so fly to great heights.',
    ],
    'editions': [
        ('UDAAN 2025', 'Where Tradition Takes Flight',
         'https://youtube.com/playlist?list=PLxyyMzhr0f3HS1_wu0bBvbhbLQolDyjzr'),
        ('UDAAN 2023', 'Flying High &mdash; October &rsquo;23',
         'https://youtube.com/playlist?list=PLxyyMzhr0f3E-5yEp3Whr3hsbz6wC6GsO'),
        ('JEEVAN UTSAV 2022', 'A Celebration of Life through Dance',
         'https://www.youtube.com/playlist?list=PLxyyMzhr0f3HXB2Wls5HDTlEqUM6oLTUc'),
    ],
}

BRANCHES = [
    {'city': 'Chennai', 'region': 'Tamil Nadu, India',
     'detail': 'Sholinganallur. Individual and group classes.', 'lead': None},
    {'city': 'Delhi', 'region': 'India',
     'detail': 'Led by Aparna Manu.', 'lead': 'Aparna Manu'},
    {'city': 'Scarborough', 'region': 'Ontario, Canada',
     'detail': 'Morningside &amp; Finch. Individual and group classes.',
     'lead': 'S. Kirusanthini'},
]

# NEW -- placeholders, clearly marked. Real quotes must come from families.
PRAISE = [
    ('My daughter walked in at five, shy of everyone. Last month she held a stage '
     'for four minutes on her own.', 'Parent, Sholinganallur'),
    ('They teach the meaning behind every movement. She comes home and explains '
     'the stories to us.', 'Parent, Chennai'),
]

ENQUIRE = {
    'title': 'Enquire about classes',
    'lead': 'Tell us a little about the dancer and we will write back with class '
            'times, levels and fees for your city.',
    'note': 'We usually reply within two working days.',
    'branches': ['Chennai', 'Delhi', 'Scarborough, Canada'],
    'levels': ['Ages 4&ndash;6 (Introductory)', 'Ages 6+ (beginner)',
               'Has learned before', 'Not sure yet'],
    'success': 'Your enquiry is with us.',
    'success_note': 'We will write back within two working days.',
}


# ------------------------------------------------------- the scroll sequence --
# NEW. A narrative arc told through the gestures themselves: a bud arrives, it
# opens, it blooms, it is taught, it takes wing. Every 'meaning' is verbatim
# from that hasta's viniyoga list, so the sequence is grounded, not decorative.

SEQUENCE_INTRO = {
    'title': 'A hand, opening',
    'lead': 'Scroll, and the gesture changes. This is the arc of a dancer here '
            '&mdash; told in the only vocabulary that can tell it properly.',
}

SEQUENCE = [
    {'key': 'pataka', 'meaning': 'the beginning of a dance',
     'heading': 'It starts with a flag',
     'body': ['Every performance opens with <span class="iast">patāka</span> &mdash; '
              'the flat, open hand. Nothing has happened yet. Everything is about '
              'to.',
              'A child arrives at four or five, usually holding a parent&rsquo;s '
              'hand, and is taught first how to stand and how to greet the floor '
              'she will dance on.']},
    {'key': 'mukula', 'meaning': 'a water lily',
     'heading': 'Closed, and full of it',
     'body': ['Five fingertips gathered to a point. <span class="iast">Mukula</span> '
              'is a bud &mdash; a water lily before light gets to it.',
              'The first year is shlokas, rhythm and play. Very little looks like '
              'dancing yet. Everything that comes later is being folded in.']},
    {'key': 'padmakosha', 'meaning': 'a lotus bud',
     'heading': 'The first opening',
     'body': ['<span class="iast">Padmakośa</span> is the same bud with air inside '
              'it &mdash; fingers spread and cupped, holding a shape without '
              'closing on it.',
              'Levels one and two. Adavus become reliable, rhythm becomes '
              'countable, and a student begins to notice she is being understood '
              'when she moves.']},
    {'key': 'alapadma', 'meaning': 'a full-bloomed lotus',
     'heading': 'Full bloom',
     'body': ['<span class="iast">Alapadma</span>. Every finger turned out, nothing '
              'held back. It is the gesture sitting inside the academy&rsquo;s own '
              'logo, in the pair of open hands.',
              'It also means a mirror, the full moon, a village, a lake, and '
              'unmistakable anger. By now a dancer can make one hand say any of '
              'them, and an audience will know which.']},
    {'key': 'hamsapaksha', 'meaning': 'to denote the number six',
     'heading': 'Six levels, counted on one hand',
     'body': ['<span class="iast">Haṃsapakṣa</span> &mdash; the swan&rsquo;s wing '
              '&mdash; is the gesture used to say <em>six</em>. The Gurukulam has '
              'six levels above its introductory stage.',
              'Alarippu and Jatiswaram at three. Keerthanam and Thillana at four. '
              'Varnam and Padam at five. At six, a dancer is being prepared for a '
              'stage of her own.']},
    {'key': 'hamsasya', 'meaning': 'giving instruction',
     'heading': 'And then she teaches',
     'body': ['The same swan, its face this time. <span class="iast">Haṃsāsya</span> '
              'is the gesture for giving instruction &mdash; thumb and two fingers '
              'meeting, the shape of a point being made carefully.',
              'Aparna Manu was the first student here. She now leads the Delhi '
              'branch. Kirusanthini trained under Sunitta for seven years and now '
              'teaches in Scarborough. The line closes.']},
    {'key': 'bhramara', 'meaning': 'wings',
     'heading': 'Udaan',
     'body': ['<span class="iast">Bhramara</span> is the bee, and it is also, simply, '
              '<em>wings</em>.',
              '<em>Udaan</em> means flying high to reach our goals. It is what the '
              'annual production is called, and it is the last thing this sequence '
              'has to say.']},
]
