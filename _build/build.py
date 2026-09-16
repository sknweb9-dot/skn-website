"""Render the Shanti Kala Nikketan static site.

    python _build/build.py

Writes plain .html files to the project root. No runtime dependencies.
"""

import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))

import content as C          # noqa: E402
import layout as L           # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parent.parent


# --------------------------------------------------------------- helpers ---

def paras(items, cls=''):
    attr = f' class="{cls}"' if cls else ''
    return '\n        '.join(f'<p{attr}>{p}</p>' for p in items)


def hero(image, alt, eyebrow, title, lede='', actions='', modifier='hero--center',
         priority=True):
    load = ' fetchpriority="high"' if priority else ' loading="lazy"'
    lede_html = f'\n        <p class="hero__lede">{lede}</p>' if lede else ''
    actions_html = f'\n        <div class="hero__actions">{actions}</div>' if actions else ''
    eyebrow_html = f'\n        <p class="hero__eyebrow">{eyebrow}</p>' if eyebrow else ''
    return f'''  <section class="hero {modifier}">
    <div class="hero__media">
      <img src="{image}" alt="{alt}" width="2000" height="1333"{load} decoding="async">
    </div>
    <div class="wrap">
      <div class="hero__inner">{eyebrow_html}
        <h1>{title}</h1>{lede_html}{actions_html}
      </div>
    </div>
  </section>'''


def section_head(eyebrow, title, sub='', align=''):
    cls = 'section-head' + (f' section-head--{align}' if align else '')
    eb = f'<span class="eyebrow">{eyebrow}</span>' if eyebrow else ''
    sb = f'\n        <p class="section-sub">{sub}</p>' if sub else ''
    return f'''<div class="{cls} reveal">
        {eb}
        <h2 class="section-title">{title}</h2>{sb}
        <div class="rule"></div>
      </div>'''


def card(image, alt, title, text, level='', meta='', media_cls='', step=None,
         link=None, aspect='card__media'):
    step_attr = f' data-step="{step}"' if step is not None else ''
    cls = f'{aspect}{" " + media_cls if media_cls else ""}'
    level_html = f'<span class="card__level">{level}</span>' if level else ''
    meta_html = f'<p class="card__meta">{meta}</p>' if meta else ''
    text_html = f'<p class="card__text">{text}</p>' if text else ''
    link_html = f'<p><a href="{link[1]}">{link[0]}</a></p>' if link else ''
    outer = 'card stage-card' if step is not None else 'card'
    return f'''<article class="{outer} reveal">
          <div class="{cls}"{step_attr}>
            <img src="{image}" alt="{alt}" width="1000" height="667" loading="lazy" decoding="async">
          </div>
          <div class="card__body">
            {level_html}
            <h3 class="card__title">{title}</h3>
            {meta_html}
            {text_html}
            {link_html}
          </div>
        </article>'''


def cta(eyebrow, title, text):
    return f'''  <section class="cta">
    <div class="wrap wrap--narrow">
      <span class="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p>{text}</p>
      <div class="hero__actions">
        <a class="btn" href="contact.html">Register now {L.ARROW}</a>
        <a class="btn btn--ghost" href="tel:{L.PHONE_HREF}">{L.PHONE_TEXT}</a>
      </div>
    </div>
  </section>'''


# ============================================================== index.html ==

def build_index():
    slides = [
        ('assets/img/hero-home.jpg',
         'Students of Shanti Kala Nikketan seated in formation on stage in Bharatanatyam costume.'),
        ('assets/img/ensemble.jpg',
         'A group of dancers holding a synchronised Bharatanatyam pose during a recital.'),
        ('assets/img/embrace-dance.jpg',
         'Dancers mid-performance under warm stage lights.'),
    ]
    slide_html = []
    for i, (src, alt) in enumerate(slides):
        active = ' data-active="true"' if i == 0 else ''
        hidden = 'false' if i == 0 else 'true'
        load = ' fetchpriority="high"' if i == 0 else ' loading="lazy"'
        slide_html.append(
            f'''<div class="slide"{active} role="group" aria-roledescription="slide" '''
            f'''aria-label="{i + 1} of {len(slides)}" aria-hidden="{hidden}">
        <img src="{src}" alt="{alt}" width="2000" height="1333"{load} decoding="async">
      </div>'''
        )

    dots = '\n        '.join(
        f'<li><button type="button"{" aria-current=&quot;true&quot;" if i == 0 else ""}>'
        f'<span class="visually-hidden">Go to slide {i + 1}</span></button></li>'
        for i in range(len(slides))
    ).replace('&quot;', '"')

    body = f'''  <section class="hero hero--tall hero--center slider" data-slider
           aria-roledescription="carousel" aria-label="Shanti Kala Nikketan highlights">
    <div class="hero__media">
      {'\n      '.join(slide_html)}
    </div>

    <div class="wrap">
      <div class="hero__inner">
        <p class="hero__eyebrow">Academy of Fine Arts &middot; Since 2009</p>
        <h1>Let the tradition speak through you</h1>
        <p class="hero__lede">
          Bharatanatyam in the Kalakshetra style, taught the way it was meant to be &mdash;
          through a living Gurukulam, where Guru and Shishya flourish together.
        </p>
        <div class="hero__actions">
          <a class="btn" href="contact.html">Register now {L.ARROW}</a>
          <a class="btn btn--ghost" href="gurukulam.html">Explore the Gurukulam</a>
        </div>
      </div>
    </div>

    <button class="slider__nav slider__nav--prev" type="button">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>
      <span class="visually-hidden">Previous slide</span>
    </button>
    <button class="slider__nav slider__nav--next" type="button">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
      <span class="visually-hidden">Next slide</span>
    </button>

    <ul class="slider__dots">
        {dots}
    </ul>
  </section>

  <section class="section section--white">
    <div class="wrap wrap--narrow">
      {section_head('Now enrolling', 'Shanti Kala Nikketan', 'Academy of Fine Arts')}
      <div class="stack reveal">
        <p class="lede">
          Shanti Kala Nikketan took birth on 18th April 2009. Artistic Director Sunitta
          Menghanaani draws her inspiration from the founder Om&nbsp;&ndash;&nbsp;Guru&nbsp;&ndash;&nbsp;Om&rsquo;s
          vision for a cultural renaissance.
        </p>
        <p>
          The academy nurtures a Gurukulam style of education, where students practise the
          classical art form alongside the much-needed infusion of literature and mythology to
          assist in holistic development. The Kalakshetra style of Bharatanatyam is the adopted
          method of dance modality. We insist on developing a synergy of commitment and
          perseverance, where both the Guru and the Shishya flourish together.
        </p>
        <p>
          We offer both individual and group classes. Join us at Shanti Kala Nikketan, where the
          arts come alive and the spirit of creativity thrives.
        </p>
      </div>
    </div>
  </section>

  <section class="section section--tint">
    <div class="wrap">
      <div class="split reveal">
        <div class="split__media">
          <img src="assets/img/stage-2-foundation.jpg"
               alt="Students of the academy rehearsing together in a group class."
               width="1000" height="667" loading="lazy" decoding="async">
        </div>
        <div class="stack">
          <span class="eyebrow">New branch</span>
          <h2 class="section-title">Now in Scarborough, Canada</h2>
          <p>
            Individual and group classes are running at Scarborough &mdash; Morningside &amp;
            Finch, led by S.&nbsp;Kirusanthini, Head of our Canada branch.
          </p>
          <p>
            For class enquiries, write to
            <a href="mailto:{L.EMAIL}">{L.EMAIL}</a>.
          </p>
          <p><a class="btn btn--navy" href="contact.html">Enquire about classes</a></p>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--white">
    <div class="wrap">
      <dl class="facts reveal">
        <div><dt>2009</dt><dd>Established</dd></div>
        <div><dt>6</dt><dd>Stages of learning</dd></div>
        <div><dt>2</dt><dd>Countries</dd></div>
        <div><dt>8</dt><dd>Teaching faculty</dd></div>
      </dl>
    </div>
  </section>

  <section class="section section--tint">
    <div class="wrap">
      {section_head('Learn &middot; Grow &middot; Spread', 'Where would you like to begin?')}
      <div class="grid grid--3">
        {card('assets/img/stage-1-intro.jpg',
              'A teacher guiding very young children through their first dance steps.',
              'The Gurukulam',
              'Six graded stages, from a gentle introduction at age four through to Arangetram '
              'readiness.',
              link=('See the six stages', 'gurukulam.html'))}
        {card('assets/img/sunitta.jpg',
              'Sunitta Menghanaani, co-founder and Artistic Director of the academy.',
              'Our Founders',
              'The vision of Om Guru Om, carried forward by Artistic Director Sunitta '
              'Menghanaani.',
              link=('Meet the founders', 'founders.html'))}
        {card('assets/img/hero-events.jpg',
              'A moment from one of the academy&rsquo;s annual stage productions.',
              'Events &amp; Udaan',
              'Our annual offering, Arangetrams, and performances across Chennai and abroad.',
              link=('View events', 'events.html'))}
      </div>
    </div>
  </section>

{cta('Tradition follows', 'Learn from the expert',
     'Everyone can learn dance &mdash; the only talent required is a talent to work hard. '
     'Individual and group classes are open in Chennai and Scarborough.')}'''

    return L.page(
        'index.html',
        'Shanti Kala Nikketan | Bharatanatyam Dance Academy in Chennai',
        'Shanti Kala Nikketan, Academy of Fine Arts — a Bharatanatyam school in Sholinganallur, '
        'Chennai teaching the Kalakshetra style through a Gurukulam system of learning. '
        'New branch in Scarborough, Canada.',
        body, jsonld=True)


# ============================================================== about.html ==

def build_about():
    body = f'''{hero('assets/img/hero-about.jpg',
                     'Dancers of Shanti Kala Nikketan in performance on a lit stage.',
                     'About us', 'I embrace dance',
                     'An academy built on the belief that the arts are not decoration, but a '
                     'discipline that shapes the whole person.')}

  {L.breadcrumb([('index.html', 'Home'), (None, 'About Us')])}

  <section class="section section--white section--flush-top">
    <div class="wrap wrap--narrow">
      {section_head('Our practice', 'A Sadhana, not a syllabus')}
      <div class="stack reveal">
        <p class="lede">
          At Shanti Kala Nikketan, Bharatanatyam is treated as a Sadhana &mdash; a sustained
          practice that develops character alongside craft.
        </p>
        <p>
          Students learn the Kalakshetra style of Bharatanatyam within a Gurukulam structure. That
          means technique is never taught in isolation: adavus sit alongside the literature and
          mythology that give the movement its meaning, and progression is measured by readiness
          rather than by calendar.
        </p>
        <p>
          We insist on a synergy of commitment and perseverance, where both the Guru and the
          Shishya flourish together. Classes are offered individually and in groups, at our
          studio in Sholinganallur, Chennai and at our branch in Scarborough, Canada.
        </p>
      </div>
    </div>
  </section>

  <section class="section section--tint">
    <div class="wrap">
      {section_head('What guides us', 'Three commitments')}
      <div class="grid grid--3">
        {card('assets/img/stage-5-expression.jpg',
              'A dancer conveying emotion through abhinaya under stage light.',
              'Depth before display',
              'Repertoire is introduced only once the foundation holds. Expression is trained as '
              'carefully as technique.')}
        {card('assets/img/stage-2-foundation.jpg',
              'Students practising adavus together in a group class.',
              'Everyone can learn',
              'Our founding belief: the only talent required is a talent to work hard. There is '
              'no audition to begin.')}
        {card('assets/img/stage-7-arangetram.jpg',
              'A soloist performing before an audience in full costume.',
              'A stage for every dancer',
              'Through Udaan and our recitals, dancers perform at every stage of learning &mdash; '
              'not only at the end of it.')}
      </div>
    </div>
  </section>

  <section class="section section--white">
    <div class="wrap">
      <div class="split split--reverse reveal">
        <div class="split__media">
          <img src="assets/img/embrace-dance.jpg"
               alt="Dancers of the academy mid-performance under stage lights."
               width="1800" height="880" loading="lazy" decoding="async">
        </div>
        <div class="stack">
          <span class="eyebrow">Where to next</span>
          <h2 class="section-title">Read further</h2>
          <p>
            The pages below set out the academy&rsquo;s history, the people who teach here, and
            the six stages a student moves through.
          </p>
          <ul>
            <li><a href="shanti-kala-nikketan.html">Shanti Kala Nikketan</a> &mdash; how the academy began</li>
            <li><a href="founders.html">Founders</a> &mdash; Om Guru Om and Sunitta Menghanaani</li>
            <li><a href="team.html">Our Team</a> &mdash; the teaching faculty</li>
            <li><a href="gurukulam.html">Gurukulam</a> &mdash; the six stages of learning</li>
            <li><a href="logo.html">The Logo</a> &mdash; what the emblem means</li>
          </ul>
        </div>
      </div>
    </div>
  </section>

{cta('Join us', 'Begin your journey',
     'Individual and group classes are open to new students in Chennai and Scarborough.')}'''

    return L.page('about.html', 'About Us | Shanti Kala Nikketan',
                  'Shanti Kala Nikketan treats Bharatanatyam as a Sadhana: the Kalakshetra style '
                  'taught within a Gurukulam structure, in Chennai and Scarborough.',
                  body, og_image='assets/img/hero-about.jpg')


# =============================================== shanti-kala-nikketan.html ==

def build_skn():
    body = f'''{hero('assets/img/hero-skn.jpg',
                     'A full ensemble of the academy&rsquo;s dancers on stage.',
                     'Est. 18 April 2009', 'Shanti Kala Nikketan',
                     'Academy of Fine Arts &mdash; Chennai and Scarborough.')}

  {L.breadcrumb([('index.html', 'Home'), ('about.html', 'About Us'),
                 (None, 'Shanti Kala Nikketan')])}

  <section class="section section--white section--flush-top">
    <div class="wrap wrap--narrow">
      <div class="stack reveal">
        <p class="lede">
          Shanti Kala Nikketan, the organisation, took birth on 18th April 2009.
        </p>
        <p>
          Artistic Director Sunitta Menghanaani draws her inspiration from the founder
          Om&nbsp;&ndash;&nbsp;Guru&nbsp;&ndash;&nbsp;Om&rsquo;s vision for a cultural renaissance.
          Shanti Kala Nikketan nurtures a Gurukulam style of education, where students practise
          the classical art form along with the much-needed infusion of literature and mythology,
          to assist in holistic development.
        </p>
        <p>
          The Kalakshetra style of Bharatanatyam is the adopted method of dance modality. We
          insist on developing a synergy of commitment and perseverance, where both the Guru and
          the Shishya flourish together.
        </p>
      </div>
    </div>
  </section>

  <section class="section section--tint">
    <div class="wrap">
      <div class="split reveal">
        <div class="split__media">
          <img src="assets/img/ensemble.jpg"
               alt="Dancers of Shanti Kala Nikketan holding a synchronised pose."
               width="1600" height="1068" loading="lazy" decoding="async">
        </div>
        <div class="stack">
          <span class="eyebrow">Our branches</span>
          <h2 class="section-title">Chennai &amp; Scarborough</h2>
          <p>
            Our home studio is at Prestige Courtyard, Sholinganallur, Chennai.
          </p>
          <p>
            We have also started a branch in Canada. Individual and group classes are happening at
            Scarborough &mdash; Morningside &amp; Finch. For enquiries about classes, please write
            to <a href="mailto:{L.EMAIL}">{L.EMAIL}</a>.
          </p>
          <p><a class="btn btn--navy" href="contact.html">Contact the academy</a></p>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--white">
    <div class="wrap">
      <dl class="facts reveal">
        <div><dt>18.04.2009</dt><dd>Founded</dd></div>
        <div><dt>Kalakshetra</dt><dd>Style of Bharatanatyam</dd></div>
        <div><dt>Gurukulam</dt><dd>Method of teaching</dd></div>
        <div><dt>6</dt><dd>Stages of learning</dd></div>
      </dl>
    </div>
  </section>

{cta('Tradition follows', 'Learn from the expert',
     'Enrolment is open for individual and group classes at both branches.')}'''

    return L.page('shanti-kala-nikketan.html',
                  'Shanti Kala Nikketan | Dance Institute in Sholinganallur, Chennai',
                  'Founded on 18 April 2009, Shanti Kala Nikketan teaches the Kalakshetra style '
                  'of Bharatanatyam through a Gurukulam education, in Chennai and Scarborough.',
                  body, og_image='assets/img/hero-skn.jpg')


# =========================================================== founders.html ==

def build_founders():
    f, d = C.FOUNDER, C.DIRECTOR
    quote = '\n          '.join(f'<p>{line}</p>' for line in f['quote'])

    body = f'''{hero('assets/img/hero-events.jpg',
                     'The academy&rsquo;s dancers on stage during a production.',
                     'Our lineage', 'Founders',
                     'A vision for a cultural renaissance, and the artist who carries it forward.')}

  {L.breadcrumb([('index.html', 'Home'), ('about.html', 'About Us'), (None, 'Founders')])}

  <section class="section section--white section--flush-top">
    <div class="wrap">
      <div class="split split--portrait reveal">
        <div class="split__media">
          <img src="{f['image']}" alt="{f['alt']}" width="800" height="857"
               loading="lazy" decoding="async">
        </div>
        <div class="stack">
          <span class="eyebrow">{f['role']}</span>
          <h2 class="section-title">{f['name']}</h2>
          {paras(f['bio'])}
        </div>
      </div>
    </div>
  </section>

  <section class="section section--tint">
    <div class="wrap wrap--narrow">
      <blockquote class="pull-quote reveal">
          {quote}
        <cite>Om Guru Om</cite>
      </blockquote>
    </div>
  </section>

  <section class="section section--white">
    <div class="wrap">
      <div class="split split--portrait split--reverse reveal">
        <div class="split__media">
          <img src="{d['image']}" alt="{d['alt']}" width="800" height="857"
               loading="lazy" decoding="async">
        </div>
        <div class="stack">
          <span class="eyebrow">{d['role']}</span>
          <h2 class="section-title">{d['name']}</h2>
          {paras(d['bio'])}
          <p><a href="team.html">Meet the teaching faculty</a></p>
        </div>
      </div>
    </div>
  </section>

{cta('Learn with us', 'Study in the Gurukulam tradition',
     'Classes are led by Sunitta Menghanaani and the academy&rsquo;s faculty.')}'''

    return L.page('founders.html', 'Founders | Shanti Kala Nikketan',
                  'Om Guru Om, founder of Shanti Kala Nikketan, and Sunitta Menghanaani, '
                  'co-founder and Artistic Director — a Bharatanatyam artiste trained at '
                  'Kalakshetra Foundation.',
                  body, og_image='assets/img/sunitta.jpg')


# =============================================================== team.html ==

def build_team():
    blocks = []
    for i, m in enumerate(C.TEAM):
        reverse = ' split--reverse' if i % 2 else ''
        tint = 'section--tint' if i % 2 else 'section--white'
        blocks.append(f'''  <section class="section {tint}">
    <div class="wrap">
      <div class="split split--portrait{reverse} reveal">
        <div class="split__media">
          <img src="{m['image']}" alt="Portrait of {m['name']}, {m['role'].lower()} at Shanti Kala Nikketan."
               width="800" height="857" loading="lazy" decoding="async">
        </div>
        <div class="stack">
          <span class="eyebrow">{m['role']}</span>
          <h2 class="section-title">{m['name']}</h2>
          {paras(m['bio'])}
        </div>
      </div>
    </div>
  </section>''')

    body = f'''{hero('assets/img/hero-home.jpg',
                     'The dancers and teachers of Shanti Kala Nikketan on stage.',
                     'Our strength', 'Our Team',
                     'Dancers, choreographers and teachers trained at Kalakshetra Foundation and '
                     'beyond.')}

  {L.breadcrumb([('index.html', 'Home'), ('about.html', 'About Us'), (None, 'Our Team')])}

{chr(10).join(blocks)}

{cta('Join a class', 'Learn from our faculty',
     'Individual and group classes in Chennai and Scarborough, Canada.')}'''

    return L.page('team.html', 'Our Team | Shanti Kala Nikketan',
                  'The teaching faculty of Shanti Kala Nikketan — Bharatanatyam dancers and '
                  'teachers trained at Kalakshetra Foundation, Kerala Kalamandalam and leading '
                  'fine arts universities.',
                  body, og_image='assets/img/team-kirusanthini.jpg')


# =============================================================== logo.html ==

def build_logo():
    body = f'''{hero('assets/img/hero-skn.jpg',
                     'Dancers of Shanti Kala Nikketan on stage.',
                     'Our emblem', 'The Logo',
                     'A symbiosis of dance, music and the fine arts.',
                     modifier='hero--center hero--compact')}

  {L.breadcrumb([('index.html', 'Home'), ('about.html', 'About Us'),
                 (None, 'The Logo')])}

  <section class="section section--white section--flush-top">
    <div class="wrap">
      <div class="split split--portrait reveal">
        <div class="split__media">
          <img src="assets/img/logo-full.png"
               alt="The Shanti Kala Nikketan emblem: a circle enclosing Lord Ganesha above an open palm."
               width="900" height="900" loading="lazy" decoding="async">
        </div>
        <div class="stack">
          <p class="lede">
            The logo of Shanti Kala Nikketan is a symbiosis of dance, music and the fine arts.
          </p>
          <p>
            The <strong>circle</strong> in the logo is the representation of the interconnectivity
            of the various art forms in their journey towards the infinite.
          </p>
          <p>
            <strong>Lord Ganesha</strong>, in the heart of the logo, removes obstacles and
            preserves harmony.
          </p>
          <p>
            The <strong>palm</strong> &mdash; representing love, unity and peace &mdash; forms the
            cornerstone of Shanti Kala Nikketan.
          </p>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--tint">
    <div class="wrap wrap--narrow">
      <blockquote class="pull-quote reveal">
        <p>Shanti &mdash; peace. Kala &mdash; art. Nikketan &mdash; a dwelling.</p>
        <cite>The name</cite>
      </blockquote>
    </div>
  </section>

{cta('Tradition follows', 'Learn from the expert',
     'Enrolment is open for individual and group classes.')}'''

    return L.page('logo.html', 'The Logo | Shanti Kala Nikketan',
                  'The meaning of the Shanti Kala Nikketan emblem — the circle of '
                  'interconnected art forms, Lord Ganesha at its heart, and the open palm of '
                  'love, unity and peace.',
                  body, og_image='assets/img/logo-full.png')


# ========================================================== gurukulam.html ==

def build_gurukulam():
    cards = '\n        '.join(
        card(s['image'], s['alt'], s['level'], s['text'], meta=s['ages'],
             step=(s['step'] if s['step'] != '0' else None))
        for s in C.STAGES
    )

    body = f'''{hero('assets/img/hero-gurukulam.jpg',
                     'Students of the Gurukulam gathered for a class.',
                     'Learn&hellip; Grow&hellip; Spread!', 'Gurukulam',
                     'The six stages of learning &mdash; plus a gentle first step for our '
                     'youngest dancers.')}

  {L.breadcrumb([('index.html', 'Home'), (None, 'Gurukulam')])}

  <section class="section section--white section--flush-top">
    <div class="wrap wrap--narrow">
      <div class="stack reveal">
        <p class="lede">
          Progression at Shanti Kala Nikketan is measured by readiness, not by calendar. Each
          stage builds the technique, theory and expression a dancer needs before the next one
          begins.
        </p>
      </div>
    </div>
  </section>

  <section class="section section--tint section--flush-top">
    <div class="wrap">
      {section_head('The path', 'The Six Stages of Learning')}
      <div class="grid grid--3">
        {cards}
      </div>
    </div>
  </section>

  <section class="section section--white">
    <div class="wrap wrap--narrow">
      {section_head('Practicalities', 'How classes work')}
      <div class="stack reveal">
        <p>
          <strong>Formats.</strong> Both individual and group classes are offered. Group classes
          are arranged by stage so that every dancer works alongside peers at a comparable level.
        </p>
        <p>
          <strong>Locations.</strong> Sholinganallur, Chennai; and Scarborough &mdash; Morningside
          &amp; Finch, Canada.
        </p>
        <p>
          <strong>Starting age.</strong> From four years for the Introductory Stage, and from six
          years for Level&nbsp;1. Adult beginners are welcome &mdash; several of our own faculty
          began their training in their late teens.
        </p>
        <p>
          <strong>Performance.</strong> Dancers at every stage are given a platform, principally
          through our annual production <a href="events.html">Udaan</a>.
        </p>
      </div>
    </div>
  </section>

{cta('Ready to start?', 'Find the right stage for you',
     'Write or call and we will suggest a starting point based on age and prior training.')}'''

    return L.page('gurukulam.html', 'Gurukulam | Shanti Kala Nikketan',
                  'The six stages of learning at Shanti Kala Nikketan, from an introductory '
                  'stage for ages 4–6 through to Performance Readiness and Arangetram.',
                  body, og_image='assets/img/hero-gurukulam.jpg')


# ============================================================= events.html ==

def build_events():
    udaan = '\n        '.join(
        card(e['image'], e['alt'], e['title'], e['text'], media_cls='card__media--poster')
        for e in C.UDAAN_EDITIONS
    )
    arangetrams = '\n        '.join(
        card(e['image'], e['alt'], e['title'], e['text'], media_cls='card__media--square')
        for e in C.ARANGETRAMS
    )
    performances = '\n        '.join(
        card(p['image'], p['alt'], p['title'], '', meta=p['meta'],
             media_cls='card__media--square')
        for p in C.PERFORMANCES
    )

    body = f'''{hero('assets/img/hero-events.jpg',
                     'A large ensemble of dancers on stage during an academy production.',
                     'On stage', 'Events',
                     'Udaan, Arangetrams, and performances across Chennai and abroad.')}

  {L.breadcrumb([('index.html', 'Home'), (None, 'Events')])}

  <section class="section section--white section--flush-top">
    <div class="wrap wrap--narrow">
      {section_head('Our annual offering', 'Udaan',
                    'Flying high to reach our goals')}
      <div class="stack reveal">
        {paras(C.UDAAN_INTRO)}
      </div>
    </div>
  </section>

  <section class="section section--tint section--flush-top">
    <div class="wrap">
      <div class="grid grid--2">
        {udaan}
      </div>
    </div>
  </section>

  <section class="section section--white">
    <div class="wrap">
      {section_head('Debut recitals', 'Arangetrams')}
      <div class="grid grid--2">
        {arangetrams}
      </div>
    </div>
  </section>

  <section class="section section--tint">
    <div class="wrap">
      {section_head('Group, solo &amp; outreach', 'Performances')}
      <div class="grid grid--3">
        {performances}
      </div>
    </div>
  </section>

  <section class="section section--white">
    <div class="wrap wrap--narrow">
      <div class="section-head reveal">
        <span class="eyebrow">See more</span>
        <h2 class="section-title">Photos &amp; videos</h2>
        <div class="rule"></div>
      </div>
      <div class="hero__actions reveal" style="justify-content:center">
        <a class="btn btn--navy" href="photos.html">Photo gallery</a>
        <a class="btn btn--navy" href="videos.html">Video gallery</a>
      </div>
    </div>
  </section>

{cta('Perform with us', 'Every dancer deserves a stage',
     'Students at every stage of learning take part in our annual production.')}'''

    return L.page('events.html', 'Events | Shanti Kala Nikketan',
                  'Udaan, the annual production of Shanti Kala Nikketan, alongside Arangetrams '
                  'and group, solo and outreach performances in Chennai and Canada.',
                  body, og_image='assets/img/hero-events.jpg')


# ============================================================= photos.html ==

def build_photos():
    items = '\n        '.join(
        f'''<li>
          <button type="button" data-lightbox="{src}" data-alt="{alt}" data-caption="{alt}">
            <img src="{src}" alt="{alt}" width="700" height="700" loading="lazy" decoding="async">
            <span class="visually-hidden">Open larger image</span>
          </button>
        </li>'''
        for src, alt in C.GALLERY
    )

    body = f'''{hero('assets/img/hero-photos.jpg',
                     'A performance photograph from the academy archive.',
                     'Gallery', 'Photos',
                     'Moments from classes, rehearsals and the stage.',
                     modifier='hero--center hero--compact')}

  {L.breadcrumb([('index.html', 'Home'), (None, 'Photos')])}

  <section class="section section--white section--flush-top">
    <div class="wrap">
      <p class="form__note reveal" style="text-align:center;margin-bottom:2rem">
        Select any photograph to view it larger.
      </p>
      <ul class="gallery reveal">
        {items}
      </ul>
    </div>
  </section>

{cta('Be part of it', 'Join a class',
     'Individual and group classes in Chennai and Scarborough, Canada.')}'''

    return L.page('photos.html', 'Photos | Shanti Kala Nikketan',
                  'Photographs from classes, rehearsals, recitals and productions at Shanti Kala '
                  'Nikketan, Academy of Fine Arts.',
                  body, og_image='assets/img/hero-photos.jpg', lightbox=True)


# ============================================================= videos.html ==

def build_videos():
    items = []
    for vid, title in C.VIDEOS:
        items.append(f'''<li class="reveal">
          <div class="video-embed" data-youtube="{vid}" data-title="{title}">
            <img src="https://i.ytimg.com/vi/{vid}/hqdefault.jpg"
                 alt="" width="480" height="360" loading="lazy" decoding="async">
            <button type="button">
              <span class="visually-hidden">Play video: {title}</span>
            </button>
          </div>
          <h2 class="card__title" style="margin-top:.85rem;font-size:1.25rem">{title}</h2>
        </li>''')

    body = f'''{hero('assets/img/hero-videos.jpg',
                     'A dancer of the academy captured mid-performance.',
                     'Gallery', 'Videos',
                     'Recordings from Udaan, Arangetrams and student recitals.',
                     modifier='hero--center hero--compact')}

  {L.breadcrumb([('index.html', 'Home'), (None, 'Videos')])}

  <section class="section section--white section--flush-top">
    <div class="wrap">
      <p class="form__note reveal" style="text-align:center;margin-bottom:2rem">
        Videos load from YouTube only after you press play, so nothing is requested from
        YouTube until you choose to watch.
      </p>
      <ul class="video-grid">
        {'\n        '.join(items)}
      </ul>
      <p style="text-align:center;margin-top:2.5rem">
        <a class="btn btn--navy" href="{L.YOUTUBE}" target="_blank" rel="noopener noreferrer">
          Visit our YouTube channel</a>
      </p>
    </div>
  </section>

{cta('Tradition follows', 'Learn from the expert',
     'Enrolment is open for individual and group classes at both branches.')}'''

    return L.page('videos.html', 'Videos | Shanti Kala Nikketan',
                  'Video recordings of Bharatanatyam performances by students of Shanti Kala '
                  'Nikketan, including the annual Udaan production and Arangetrams.',
                  body, og_image='assets/img/hero-videos.jpg')


# ============================================================ contact.html ==

def build_contact():
    icon_pin = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 '
                '5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 '
                '0 0 1 0 5Z"/></svg>')
    icon_phone = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8a15.5 15.5 0 '
                  '0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25c1.1.37 2.3.57 3.5.57a1 1 0 0 1 1 1V20a1 '
                  '1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.2.2 2.4.57 '
                  '3.5a1 1 0 0 1-.25 1L6.6 10.8Z"/></svg>')
    icon_mail = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 '
                 '2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4.2-8 5-8-5V6l8 5 8-5v2.2Z"/></svg>')
    icon_clock = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 1 0 0 20 10 '
                  '10 0 0 0 0-20Zm1 11h-4v-2h2V7h2v6Z"/></svg>')

    body = f'''{hero('assets/img/hero-contact.jpg',
                     'Dancers of the academy in performance.',
                     'Get in touch', 'Contact',
                     'Enquire about individual or group classes in Chennai and Scarborough.',
                     modifier='hero--center hero--compact')}

  {L.breadcrumb([('index.html', 'Home'), (None, 'Contact')])}

  <section class="section section--white section--flush-top">
    <div class="wrap">
      <div class="split reveal">
        <div class="stack">
          <span class="eyebrow">Shanti Kala Nikketan</span>
          <h2 class="section-title">Academy of Fine Arts</h2>

          <dl class="contact-list">
            <div>
              {icon_pin}
              <div>
                <dt>Studio</dt>
                <dd>
                  11018, Ground Floor, Tower 11, Prestige Courtyard,<br>
                  Model School Extension Road, Sholinganallur,<br>
                  Chennai 600119, Tamil Nadu, India
                </dd>
              </div>
            </div>
            <div>
              {icon_phone}
              <div>
                <dt>Phone</dt>
                <dd><a href="tel:{L.PHONE_HREF}">{L.PHONE_TEXT}</a></dd>
              </div>
            </div>
            <div>
              {icon_mail}
              <div>
                <dt>Email</dt>
                <dd><a href="mailto:{L.EMAIL}">{L.EMAIL}</a></dd>
              </div>
            </div>
            <div>
              {icon_clock}
              <div>
                <dt>Canada branch</dt>
                <dd>Scarborough &mdash; Morningside &amp; Finch.<br>
                    Enquiries by email to <a href="mailto:{L.EMAIL}">{L.EMAIL}</a>.</dd>
              </div>
            </div>
          </dl>
        </div>

        <div>
          <h2 class="section-title" style="font-size:clamp(1.6rem,3vw,2.1rem)">Send an enquiry</h2>
          <p class="form__note" style="margin-bottom:1.5rem">
            Fields marked <span class="req">*</span> are required.
          </p>

          <div class="form-status" id="form-status" role="status" aria-live="polite" hidden></div>

          <form class="form" id="enquiry-form" data-mailto="{L.EMAIL}"
                action="mailto:{L.EMAIL}" method="post" enctype="text/plain" novalidate>
            <div class="form__row">
              <div class="field">
                <label for="name">Name <span class="req" aria-hidden="true">*</span></label>
                <input id="name" name="name" type="text" autocomplete="name" required>
                <p class="field__error" aria-live="polite"></p>
              </div>
              <div class="field">
                <label for="email">Email <span class="req" aria-hidden="true">*</span></label>
                <input id="email" name="email" type="email" autocomplete="email" required>
                <p class="field__error" aria-live="polite"></p>
              </div>
            </div>

            <div class="form__row">
              <div class="field">
                <label for="phone">Phone</label>
                <input id="phone" name="phone" type="tel" autocomplete="tel">
                <p class="field__error" aria-live="polite"></p>
              </div>
              <div class="field">
                <label for="location">Preferred branch</label>
                <select id="location" name="location">
                  <option>Sholinganallur, Chennai</option>
                  <option>Scarborough, Canada</option>
                  <option>Online / not sure yet</option>
                </select>
              </div>
            </div>

            <div class="field">
              <label for="interest">I am enquiring about</label>
              <select id="interest" name="interest">
                <option>Group classes</option>
                <option>Individual classes</option>
                <option>Introductory stage (ages 4&ndash;6)</option>
                <option>Adult beginner</option>
                <option>Performance or collaboration</option>
                <option>Something else</option>
              </select>
            </div>

            <div class="field">
              <label for="message">Message <span class="req" aria-hidden="true">*</span></label>
              <textarea id="message" name="message" required
                        placeholder="Tell us the student&rsquo;s age and any previous training."></textarea>
              <p class="field__error" aria-live="polite"></p>
            </div>

            <div>
              <button class="btn" type="submit">Send enquiry {L.ARROW}</button>
            </div>

            <p class="form__note">
              This site is static, so submitting opens your email app with the enquiry filled in.
              You can also write to <a href="mailto:{L.EMAIL}">{L.EMAIL}</a> directly.
            </p>
          </form>
        </div>
      </div>
    </div>
  </section>

  <section class="section section--tint section--flush-top">
    <div class="wrap">
      {section_head('Find us', 'Sholinganallur, Chennai')}
      <div class="map-frame reveal">
        <iframe
          title="Map showing Shanti Kala Nikketan at Prestige Courtyard, Sholinganallur, Chennai"
          src="https://www.google.com/maps?q=Prestige+Courtyard,+Model+School+Extension+Road,+Sholinganallur,+Chennai+600119&amp;output=embed"
          loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
      </div>
    </div>
  </section>'''

    return L.page('contact.html', 'Contact | Shanti Kala Nikketan',
                  'Contact Shanti Kala Nikketan, Academy of Fine Arts — Prestige Courtyard, '
                  'Sholinganallur, Chennai 600119. Phone +91 98840 22306. Branch in '
                  'Scarborough, Canada.',
                  body, og_image='assets/img/hero-contact.jpg')


# ================================================================= 404.html ==

def build_404():
    body = f'''  <section class="section section--white" style="min-height:52vh;display:grid;place-items:center">
    <div class="wrap wrap--narrow" style="text-align:center">
      <span class="eyebrow">Error 404</span>
      <h1 class="section-title">This page could not be found</h1>
      <div class="rule"></div>
      <p style="margin-top:1.5rem">
        The page you were looking for may have moved. Try one of these instead:
      </p>
      <div class="hero__actions" style="justify-content:center">
        <a class="btn btn--navy" href="index.html">Home</a>
        <a class="btn btn--navy" href="gurukulam.html">Gurukulam</a>
        <a class="btn btn--navy" href="contact.html">Contact</a>
      </div>
    </div>
  </section>'''
    return L.page('404.html', 'Page not found | Shanti Kala Nikketan',
                  'The requested page could not be found on the Shanti Kala Nikketan website.',
                  body)


# =================================================== sitemap and robots.txt ==

PAGES = [
    ('index.html', build_index, '1.0'),
    ('about.html', build_about, '0.8'),
    ('shanti-kala-nikketan.html', build_skn, '0.8'),
    ('founders.html', build_founders, '0.7'),
    ('team.html', build_team, '0.7'),
    ('logo.html', build_logo, '0.5'),
    ('gurukulam.html', build_gurukulam, '0.9'),
    ('events.html', build_events, '0.8'),
    ('photos.html', build_photos, '0.6'),
    ('videos.html', build_videos, '0.6'),
    ('contact.html', build_contact, '0.9'),
    ('404.html', build_404, None),
]


def build_sitemap():
    import datetime
    today = datetime.date.today().isoformat()
    urls = []
    for slug, _, priority in PAGES:
        if priority is None:
            continue
        loc = f'{L.SITE}/' if slug == 'index.html' else f'{L.SITE}/{slug[:-5]}'
        urls.append(f'''  <url>
    <loc>{loc}</loc>
    <lastmod>{today}</lastmod>
    <priority>{priority}</priority>
  </url>''')
    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            + '\n'.join(urls) + '\n</urlset>\n')


def build_robots():
    return f'User-agent: *\nAllow: /\n\nSitemap: {L.SITE}/sitemap.xml\n'


def main():
    written = []
    for slug, fn, _ in PAGES:
        html = fn()
        (ROOT / slug).write_text(html, encoding='utf-8')
        written.append((slug, len(html)))

    (ROOT / 'sitemap.xml').write_text(build_sitemap(), encoding='utf-8')
    (ROOT / 'robots.txt').write_text(build_robots(), encoding='utf-8')

    for slug, size in written:
        print(f'  {slug:30} {size / 1024:6.1f} KB')
    print(f'  {"sitemap.xml":30}')
    print(f'  {"robots.txt":30}')
    print(f'\n{len(written) + 2} files written to {ROOT}')


if __name__ == '__main__':
    main()
