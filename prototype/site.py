"""Build the Shanti Kala Nikketan prototype.

    python prototype/site.py

Writes static HTML into prototype/out/. No dependencies.
"""

import html
import json
import pathlib
import shutil
import sys

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import glyphs                                    # noqa: E402
from data import content as C                    # noqa: E402
from data import mapping as M                    # noqa: E402
from data.hastas import HASTAS, BY_KEY           # noqa: E402

ROOT = HERE.parent
OUT = HERE / 'out'
SITE = 'https://www.shantikalanikketan.com'

FONTS = ('https://fonts.googleapis.com/css2'
         '?family=Fraunces:opsz,wght@9..144,300..700'
         '&family=Inter:wght@300..600'
         '&family=Tiro+Devanagari+Sanskrit'
         '&display=swap')

NAV = [
    ('index.html', 'Home'),
    ('sequence.html', 'A hand, opening'),
    ('gurukulam.html', 'How it works'),
    ('legend.html', 'The gestures'),
    ('enquire.html', 'Enquire'),
]


# ------------------------------------------------------------------ helpers --

def glyph(key, cls=''):
    """Inline the hasta silhouette. Inline rather than <use> so each page is
    self-contained and the mask ids stay unique per occurrence."""
    h = BY_KEY[key]
    svg = glyphs.render(h).strip()
    svg = svg.replace('<svg ', f'<svg class="{cls}" ' if cls else '<svg ')
    return svg


_marker_seq = [0]


def marker(slot, on_ink=False):
    """The site's signature: name the gesture marking this section, and the
    meaning it is being asked to carry."""
    h = M.hasta(slot)
    key = M.key(slot)
    _marker_seq[0] += 1
    uid = f'm{_marker_seq[0]}'
    svg = glyph(key).replace(f'crease-{key}', f'crease-{key}-{uid}')
    return f'''<div class="gesture">
      <div class="gesture__glyph" aria-hidden="true">{svg}</div>
      <p class="gesture__text">
        <span class="gesture__name" lang="sa">{h['deva']}</span>
        <span class="iast">{h['roman']}</span><br>
        <span class="gesture__means">&ldquo;{M.meaning(slot)}&rdquo;</span>
      </p>
    </div>'''


def page(slug, title, description, body, og='assets/img/hero-home.jpg', jsonld='',
         extra_js='', extra_body=''):
    canonical = f'{SITE}/' if slug == 'index.html' else f'{SITE}/{slug[:-5]}'
    nav = '\n        '.join(
        f'<li><a href="{href}"'
        + (' aria-current="page"' if href == slug else '')
        + f'>{label}</a></li>'
        for href, label in NAV)

    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{description}">
<link rel="canonical" href="{canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="{C.ORG['name']}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{description}">
<meta property="og:image" content="{SITE}/{og}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0a1a3f">
<link rel="icon" href="assets/img/logo-mark.png" type="image/png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTS}">
<link rel="stylesheet" href="assets/site.css">
{jsonld}
</head>
<body>
<a class="skip-link" href="#main">Skip to main content</a>

<header class="site-header">
  <div class="wrap site-header__inner">
    <a class="brand" href="index.html">
      <img src="assets/img/logo-mark.png" alt="" width="34" height="29">
      <span class="brand__name">{C.ORG['name']}<small>{C.ORG['tagline']}</small></span>
    </a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
    <nav class="site-nav" id="site-nav" aria-label="Main">
      <ul>
        {nav}
      </ul>
    </nav>
  </div>
</header>

<main id="main">
{body}
</main>

<footer class="site-footer">
  <div class="wrap">
    <div class="site-footer__grid">
      <div>
        <img src="assets/img/logo-mark.png" alt="{C.ORG['name']} logo" width="56" height="48" loading="lazy">
        <p style="margin-top:.9rem"><strong>{C.ORG['name']}</strong><br>{C.ORG['tagline']}</p>
      </div>
      <nav aria-labelledby="f-explore">
        <h2 id="f-explore">Explore</h2>
        <ul>
          <li><a href="gurukulam.html">How the learning works</a></li>
          <li><a href="legend.html">The gestures</a></li>
          <li><a href="enquire.html">Enquire about classes</a></li>
        </ul>
      </nav>
      <div>
        <h2>Visit</h2>
        <address>{'<br>'.join(C.ORG['address'])}</address>
        <p style="margin-top:.7rem">
          <a href="tel:{C.ORG['phone_href']}">{C.ORG['phone']}</a><br>
          <a href="mailto:{C.ORG['email']}">{C.ORG['email']}</a>
        </p>
      </div>
      <div>
        <h2>Elsewhere</h2>
        <ul>
          <li><a href="{C.ORG['instagram']}" rel="noopener">Instagram</a></li>
          <li><a href="{C.ORG['facebook']}" rel="noopener">Facebook</a></li>
          <li><a href="{C.ORG['youtube']}" rel="noopener">YouTube</a></li>
        </ul>
      </div>
    </div>
    <div class="site-footer__bar">
      <p>&copy; <span id="year">2026</span> {C.ORG['name']} &middot; Founded {C.ORG['founded']}</p>
      <button class="sound-toggle" type="button" aria-pressed="false">
        {glyph(M.key('sound')).replace('crease-kangula', 'crease-kangula-snd')}
        <span data-sound-label>Sound off</span>
      </button>
    </div>
  </div>
</footer>

<script src="assets/site.js" defer></script>
{extra_js}
<script>document.getElementById('year').textContent=new Date().getFullYear();</script>
{extra_body}
</body>
</html>
'''


# --------------------------------------------------------------------- home --

def build_home():
    alapadma = BY_KEY['alapadma']
    meanings = json.dumps(alapadma['viniyoga'])
    hand = glyph('alapadma').replace('crease-alapadma', 'crease-alapadma-hero')

    stages_teaser = '\n'.join(
        f'<li><span class="stages__num"></span><div><h3>{n}</h3>'
        f'<p class="stages__ages">{a}</p></div></li>'
        for n, a, _ in C.STAGES[:4])

    lineage = '\n'.join(
        f'''<li data-kind="{p['kind']}">
          <img class="lineage__portrait" src="{p['image']}" alt="Portrait of {p['name']}." loading="lazy" width="72" height="72">
          <div>
            <p class="lineage__name">{p['name']}</p>
            <p class="lineage__role">{p['role']}</p>
            <p>{p['note']}</p>
          </div>
        </li>''' for p in C.LINEAGE['chain'])

    editions = '\n'.join(
        f'''<li><a href="{url}" rel="noopener">
          <span class="editions__title">{t}</span>
          <span class="editions__sub">{s}</span>
          <span class="editions__go">Watch &rarr;</span>
        </a></li>''' for t, s, url in C.UDAAN['editions'])

    branches = '\n'.join(
        f'''<li class="card">
          <p class="card__city">{b['city']}</p>
          <p class="card__region">{b['region']}</p>
          <p>{b['detail']}</p>
        </li>''' for b in C.BRANCHES)

    praise = '\n'.join(
        f'<blockquote class="quote"><p>&ldquo;{q}&rdquo;</p><cite>{who}</cite></blockquote>'
        for q, who in C.PRAISE)

    band_src, band_alt = C.IMAGES['band_home']
    emb_src, emb_alt = C.IMAGES['embrace']
    stg_src, stg_alt = C.IMAGES['stages']
    uda_src, uda_alt = C.IMAGES['udaan']
    brn_src, brn_alt = C.IMAGES['branches']

    body = f'''<section class="hero">
  <div class="wrap">
    <div class="hero__grid">
      <div>
        {marker('opening', on_ink=True)}
        <p class="kicker">{C.HERO['kicker']}</p>
        <h1>{C.HERO['title']}</h1>
        <p class="lead">{C.HERO['lead']}</p>
        <p class="hero__sub">{C.HERO['sub']}</p>
        <div class="btn-row">
          <a class="btn" href="enquire.html">{C.HERO['cta']}</a>
          <a class="btn btn--ghost" href="gurukulam.html">{C.HERO['cta2']}</a>
        </div>
      </div>

      <div class="polysemy" data-polysemy='{meanings}'>
        <div class="polysemy__hand" aria-hidden="true">{hand}</div>
        <p class="polysemy__label">
          <span lang="sa" class="deva">{alapadma['deva']}</span>
          &nbsp;<span class="iast">{alapadma['roman']}</span> can mean
        </p>
        <p class="polysemy__meaning" aria-live="polite"><span></span></p>
        <p class="polysemy__count"></p>
      </div>
    </div>
  </div>
</section>

<figure class="band" style="margin:0">
  <img src="{band_src}" alt="{band_alt}" width="2000" height="1335">
  <figcaption>Students of Shanti Kala Nikketan. Caption and credit to be confirmed.</figcaption>
</figure>

<section>
  <div class="wrap">
    <div class="split split--wide-text" data-reveal>
      <div>
        {marker('offering')}
        <blockquote class="quote"><p>&ldquo;{C.PROMISE['quote']}&rdquo;</p>
          <cite>{C.PROMISE['attrib']} &middot; {C.PROMISE['attrib_role']}</cite></blockquote>
        <div style="margin-top:2rem;max-width:56ch">
          {''.join(f'<p>{p}</p>' for p in C.PROMISE['body'])}
        </div>
        <div class="stat-row">
          <div><span class="stat__n">2009</span><p class="stat__t">Founded</p></div>
          <div><span class="stat__n">3</span><p class="stat__t">Cities</p></div>
          <div><span class="stat__n">7</span><p class="stat__t">Stages of learning</p></div>
        </div>
      </div>
      <figure class="split__img" style="margin:0">
        <img src="{emb_src}" alt="{emb_alt}" loading="lazy" width="1800" height="970">
      </figure>
    </div>
  </div>
</section>

<section class="on-paper-2">
  <div class="wrap">
    <div class="split split--wide-text split--image-first" data-reveal>
      <div>
        {marker('stages')}
        <h2>Six levels, and a gentle way in before them</h2>
        <p class="lead muted" style="max-width:46ch;margin-top:1rem">
          A child of four starts with shlokas and play. A dancer at Level&nbsp;6 is
          preparing for Arangetram. Nobody is rushed.</p>
        <ol class="stages" style="margin-top:2rem">
          {stages_teaser}
        </ol>
        <div class="btn-row">
          <a class="btn btn--ink" href="gurukulam.html">See all seven stages</a>
        </div>
      </div>
      <figure class="split__img" style="margin:0">
        <img src="{stg_src}" alt="{stg_alt}" loading="lazy" width="970" height="700">
      </figure>
    </div>
  </div>
</section>

<section class="on-ink">
  <div class="wrap" data-reveal>
    {marker('teaching', on_ink=True)}
    <h2>The line is unbroken</h2>
    <p class="lead" style="max-width:52ch;margin:1rem 0 2.5rem;color:#cbd8ea">
      {C.LINEAGE['intro']}</p>
    <ul class="lineage" style="max-width:52rem">
      {lineage}
    </ul>
  </div>
</section>

<section class="on-ink" style="padding-top:0">
  <div class="wrap" data-reveal>
    <hr class="rule" style="margin-bottom:clamp(2.5rem,6vw,5rem)">
    <div class="split split--wide-text">
      <div>
        {marker('flight', on_ink=True)}
        <h2>{C.UDAAN['title']} &mdash; <em>{C.UDAAN['meaning']}</em></h2>
        <div style="max-width:54ch;margin-top:1.25rem;color:#cbd8ea">
          {''.join(f'<p>{p}</p>' for p in C.UDAAN['body'])}
        </div>
        <ul class="editions">
          {editions}
        </ul>
      </div>
      <figure class="poster" style="margin:0 0 0 auto">
        <img src="{uda_src}" alt="{uda_alt}" loading="lazy" width="867" height="1300">
      </figure>
    </div>
  </div>
</section>

<section>
  <div class="wrap">
    <div class="split split--image-first" data-reveal>
      <div>
        {marker('branches')}
        <h2>Three cities</h2>
        <p class="lead muted" style="max-width:38ch;margin-top:1rem">
          Chennai, Delhi and Scarborough &mdash; two of them led by dancers who
          learned here.</p>
        <ul class="cards" style="margin-top:2rem;grid-template-columns:1fr">
          {branches}
        </ul>
      </div>
      <figure class="split__img" style="margin:0">
        <img src="{brn_src}" alt="{brn_alt}" loading="lazy" width="1600" height="1067">
      </figure>
    </div>
  </div>
</section>

<section class="on-paper-2">
  <div class="wrap" data-reveal>
    {marker('praise')}
    <h2 style="margin-bottom:2rem">What families say</h2>
    <div style="display:grid;gap:2rem;grid-template-columns:repeat(auto-fit,minmax(20rem,1fr))">
      {praise}
    </div>
    <p class="field__hint" style="margin-top:1.5rem">
      Placeholder quotes. Real testimonials to be collected from families.</p>
  </div>
</section>

<section>
  <div class="wrap narrow" style="text-align:center" data-reveal>
    {marker('write')}
    <h2>Come and try a class</h2>
    <p class="lead muted" style="margin:1rem auto 0;max-width:44ch">
      Tell us the dancer&rsquo;s age and your city. We will do the rest.</p>
    <div class="btn-row" style="justify-content:center">
      <a class="btn" href="enquire.html">{C.HERO['cta']}</a>
    </div>
  </div>
</section>'''

    ld = f'''<script type="application/ld+json">
{json.dumps({
  '@context': 'https://schema.org',
  '@type': 'PerformingArtsTheater',
  'name': f"{C.ORG['name']} — {C.ORG['tagline']}",
  'url': f'{SITE}/',
  'logo': f'{SITE}/assets/img/logo-mark.png',
  'foundingDate': C.ORG['founded_iso'],
  'email': C.ORG['email'],
  'telephone': C.ORG['phone'],
  'address': {
      '@type': 'PostalAddress',
      'streetAddress': ', '.join(C.ORG['address'][:3]),
      'addressLocality': 'Chennai', 'postalCode': '600119',
      'addressRegion': 'Tamil Nadu', 'addressCountry': 'IN'},
  'areaServed': ['Chennai, India', 'Delhi, India', 'Scarborough, Canada'],
  'sameAs': [C.ORG['instagram'], C.ORG['facebook'], C.ORG['youtube']],
}, indent=2)}
</script>'''

    return page('index.html',
                f"{C.ORG['name']} — Bharatanatyam in Chennai, Delhi and Scarborough",
                'Kalakshetra-style Bharatanatyam taught the Gurukulam way. '
                'Classes for ages four and up in Chennai, Delhi and Scarborough.',
                body, jsonld=ld)


# ---------------------------------------------------------------- gurukulam --

def build_gurukulam():
    stages = '\n'.join(
        f'''<li><span class="stages__num" aria-hidden="true"></span>
          <div><h3>{n}</h3><p class="stages__ages">{a}</p></div>
          <p>{d}</p></li>''' for n, a, d in C.STAGES)

    body = f'''<section class="section--tight on-ink">
  <div class="wrap">
    {marker('stages', on_ink=True)}
    <h1>How the learning works</h1>
    <p class="lead" style="max-width:48ch;margin-top:1.25rem;color:#dfe8f5">
      Seven stages, from a four-year-old&rsquo;s first shloka to the night before
      an Arangetram.</p>
  </div>
</section>

<section>
  <div class="wrap" data-reveal>
    <ol class="stages">
      {stages}
    </ol>
  </div>
</section>

<section class="on-paper-2">
  <div class="wrap narrow" data-reveal>
    {marker('watch')}
    <h2>Theory is taught, not assumed</h2>
    <p style="margin-top:1rem">Alongside movement, students learn the
      <span lang="sa" class="deva">विनियोग</span> <span class="iast">viniyoga</span>
      &mdash; what each gesture is used to say. The academy has published lessons on
      eight of the twenty-eight single-hand gestures, with the Sanskrit verse and its
      word-by-word meaning.</p>
    <div class="btn-row">
      <a class="btn btn--ink" href="legend.html">See the gesture vocabulary</a>
    </div>
  </div>
</section>

<section>
  <div class="wrap narrow" style="text-align:center" data-reveal>
    {marker('write')}
    <h2>Which stage suits your dancer?</h2>
    <p class="lead muted" style="margin:1rem auto 0;max-width:42ch">
      Tell us their age and any previous training and we will place them.</p>
    <div class="btn-row" style="justify-content:center">
      <a class="btn" href="enquire.html">Enquire about classes</a>
    </div>
  </div>
</section>'''

    return page('gurukulam.html',
                f"How the learning works — {C.ORG['name']}",
                'Seven stages of Bharatanatyam training, from ages four to '
                'Arangetram preparation, in the Gurukulam tradition.',
                body, og='assets/img/hero-gurukulam.jpg')


# ------------------------------------------------------------------- legend --

def build_legend():
    used = M.by_hasta()
    cards = []
    for h in HASTAS:
        uses = used.get(h['key'], [])
        uid = f"lg-{h['key']}"
        svg = glyph(h['key']).replace(f"crease-{h['key']}", f"crease-{uid}")
        use_html = ''
        if uses:
            rows = '\n'.join(
                f'<li><span class="legend-card__slot">{slot}</span> &mdash; '
                f'&ldquo;{mean}&rdquo;<br><span class="muted">{why}</span></li>'
                for slot, mean, why in uses)
            use_html = f'<ul class="legend-card__uses">{rows}</ul>'
        tag = ('<span class="tag tag--verified">text verified</span>'
               if h['source'] == 'school'
               else '<span class="tag">needs sign-off</span>')
        cards.append(f'''<li class="legend-card{' legend-card--used' if uses else ''}">
          <div class="legend-card__head">
            <div class="legend-card__glyph" aria-hidden="true">{svg}</div>
            <div>
              <span class="legend-card__deva" lang="sa">{h['deva']}</span>
              <span class="legend-card__iast">{h['roman']}</span><br>
              <span class="muted" style="font-size:.8125rem">{h['gloss']}</span>
            </div>
          </div>
          {use_html}
          <p class="legend-card__all"><strong>All meanings:</strong>
            {'; '.join(h['viniyoga'])}.</p>
          {tag}
        </li>''')

    n_used = len(used)
    n_slots = len(M.SLOTS)

    body = f'''<section class="section--tight on-ink">
  <div class="wrap">
    {marker('single', on_ink=True)}
    <h1>The gestures</h1>
    <p class="lead" style="max-width:54ch;margin-top:1.25rem;color:#dfe8f5">
      This site is written in hastas. Each section is marked by the hand whose
      traditional meaning is what that section is for &mdash; and the same hand
      says different things in different rooms.</p>
  </div>
</section>

<section>
  <div class="wrap" data-reveal>
    <div class="narrow" style="margin-inline:0">
      <h2>How to read it</h2>
      <p style="margin-top:1rem">Bharatanatyam has twenty-eight single-hand gestures
        (<span class="iast">asamyuta hasta</span>). Each carries a fixed list of
        meanings &mdash; its <span class="iast">viniyoga</span> &mdash; set down in the
        <em>Abhinaya Darpana</em>. Nothing about the hand changes between them.</p>
      <p><strong>{n_slots} places</strong> on this site are marked with a gesture,
        drawn from <strong>{n_used} of the twenty-eight</strong>. Cards outlined in
        cyan are the ones in use; the meaning quoted under each is the one being
        invoked.</p>
      <p class="field__hint">The eight gestures marked &ldquo;text verified&rdquo; are
        transcribed from the academy&rsquo;s own published lessons. The other twenty
        are supplied from the Abhinaya Darpana tradition and need Sunitta
        Menghanaani&rsquo;s sign-off. Every silhouette is schematic notation generated
        from finger-position data, standing in for photography still to be shot.</p>
    </div>
    <ul class="legend-grid">
      {''.join(cards)}
    </ul>
  </div>
</section>'''

    return page('legend.html', f"The gestures — {C.ORG['name']}",
                'The twenty-eight single-hand gestures of Bharatanatyam, and how '
                'this site uses them to say what it means.',
                body)


# ------------------------------------------------------------------ enquire --

def build_enquire():
    branches = '\n'.join(f'<option>{b}</option>' for b in C.ENQUIRE['branches'])
    levels = '\n'.join(f'<option>{l}</option>' for l in C.ENQUIRE['levels'])
    ok_glyph = glyph(M.key('committed')).replace('crease-hamsasya', 'crease-hamsasya-ok')

    body = f'''<section class="section--tight on-ink">
  <div class="wrap">
    {marker('write', on_ink=True)}
    <h1>{C.ENQUIRE['title']}</h1>
    <p class="lead" style="max-width:46ch;margin-top:1.25rem;color:#dfe8f5">
      {C.ENQUIRE['lead']}</p>
  </div>
</section>

<section>
  <div class="wrap narrow">
    <div class="form-success" id="enquiry-success" role="status">
      <div aria-hidden="true">{ok_glyph}</div>
      <div>
        <h2 style="font-size:1.5rem">{C.ENQUIRE['success']}</h2>
        <p style="margin-top:.4rem">{C.ENQUIRE['success_note']}</p>
        <p class="field__hint" style="margin-top:.6rem">
          Marked by <span class="iast">haṃsāsya</span> &mdash;
          &ldquo;the tying of the auspicious thread&rdquo;.</p>
      </div>
    </div>

    <form class="form" id="enquiry-form" method="post" action="#" novalidate>
      <div class="form__row">
        <div class="field">
          <label for="dancer">Dancer&rsquo;s name</label>
          <input id="dancer" name="dancer" type="text" autocomplete="name" required>
        </div>
        <div class="field">
          <label for="age">Age</label>
          <input id="age" name="age" type="number" min="3" max="99" inputmode="numeric" required>
        </div>
      </div>

      <div class="form__row">
        <div class="field">
          <label for="city">City</label>
          <select id="city" name="city" required>{branches}</select>
        </div>
        <div class="field">
          <label for="level">Experience</label>
          <select id="level" name="level" required>{levels}</select>
        </div>
      </div>

      <div class="form__row">
        <div class="field">
          <label for="email">Your email</label>
          <input id="email" name="email" type="email" autocomplete="email" required>
        </div>
        <div class="field">
          <label for="phone">Phone <span class="muted">(optional)</span></label>
          <input id="phone" name="phone" type="tel" autocomplete="tel">
        </div>
      </div>

      <div class="field">
        <label for="message">Anything we should know?</label>
        <textarea id="message" name="message"></textarea>
        <p class="field__hint">{C.ENQUIRE['note']}</p>
      </div>

      <div class="btn-row" style="margin-top:.5rem">
        <button class="btn" type="submit">Send enquiry</button>
      </div>
      <p class="field__hint">
        Prototype only &mdash; this form does not send anything yet. A live version
        needs a server-side handler, validation and spam protection.</p>
    </form>
  </div>
</section>'''

    return page('enquire.html', f"Enquire about classes — {C.ORG['name']}",
                'Enquire about Bharatanatyam classes in Chennai, Delhi or '
                'Scarborough. Ages four and up, all levels.',
                body)


# ----------------------------------------------------------------- sequence --

def build_sequence():
    """Scroll-linked gesture narrative. Each step is server-rendered at its own
    pose so the page works without JavaScript; the script then morphs between
    them and reflows the text around the changing silhouette."""
    import pose as P

    # only the poses this page needs
    keys = sorted({s['key'] for s in C.SEQUENCE})
    poses = {k: P.derive(BY_KEY[k]) for k in keys}
    payload = {k: {**{d: [round(v, 4) for v in vals] for d, vals in p.items()
                     if d != '_conv'},
                   '_conv': [round(v, 4) for v in p['_conv']]}
               for k, p in poses.items()}

    steps = []
    for i, s in enumerate(C.SEQUENCE):
        h = BY_KEY[s['key']]
        if s['meaning'] not in h['viniyoga']:
            raise AssertionError(
                f"sequence step {i} invokes {s['meaning']!r}, which is not in "
                f"{h['roman']}'s viniyoga")
        prev = C.SEQUENCE[i - 1]['key'] if i else s['key']
        # server-rendered at the resting pose for this step
        inner = P.body(poses[s['key']], f'seq-{i}')
        paras = '\n        '.join(
            f'<p{" class=\"mudra-step__lead\"" if j == 0 else ""}>{t}</p>'
            for j, t in enumerate(s['body']))
        steps.append(f'''<article class="mudra-step" data-mudra="{s['key']}"
         data-mudra-from="{prev}">
        <div class="mudra-step__hand" data-mudra-shape>
          <svg viewBox="0 0 {P.W} {P.H}" data-mudra-svg role="img"
               aria-label="The {h['roman']} hasta.">{inner}</svg>
        </div>
        <p class="mudra-step__name">
          <span class="deva" lang="sa">{h['deva']}</span>
          <span class="iast">{h['roman']}</span>
          &mdash; &ldquo;{s['meaning']}&rdquo;</p>
        <h2>{s['heading']}</h2>
        {paras}
      </article>''')

    body = f'''<section class="section--tight on-ink">
  <div class="wrap">
    {marker('opening', on_ink=True)}
    <h1>{C.SEQUENCE_INTRO['title']}</h1>
    <p class="lead mudra-intro" style="margin-top:1.25rem;color:#dfe8f5">
      {C.SEQUENCE_INTRO['lead']}</p>
  </div>
</section>

<div class="on-ink">
  <div class="wrap">
    {''.join(steps)}
  </div>
</div>

<section>
  <div class="wrap narrow" style="text-align:center">
    {marker('write')}
    <h2>Start at the beginning</h2>
    <p class="lead muted" style="margin:1rem auto 0;max-width:40ch">
      Ages four and up, in Chennai, Delhi and Scarborough.</p>
    <div class="btn-row" style="justify-content:center">
      <a class="btn" href="enquire.html">Enquire about classes</a>
    </div>
  </div>
</section>'''

    data = (f'<script type="application/json" id="mudra-poses">'
            f'{json.dumps(payload, separators=(",", ":"))}</script>')

    return page('sequence.html', f"A hand, opening — {C.ORG['name']}",
                'The arc of a Bharatanatyam dancer, told through the gestures '
                'themselves: a bud opens, blooms, is taught, and takes wing.',
                body,
                extra_js='<script src="assets/mudra.js" defer></script>',
                extra_body=data)


# ---------------------------------------------------------------------- 404 --

def build_404():
    body = f'''<section class="on-ink" style="min-height:60vh;display:flex;align-items:center">
  <div class="wrap narrow" style="text-align:center">
    <div style="width:8rem;margin:0 auto 2rem;color:var(--cyan)" aria-hidden="true">
      {glyph('alapadma').replace('crease-alapadma', 'crease-alapadma-404')}
    </div>
    <h1 style="font-size:clamp(2rem,1.4rem+2.5vw,3.25rem)">Separation</h1>
    <p class="lead" style="margin:1.25rem auto 0;max-width:38ch;color:#dfe8f5">
      This page is not here. The gesture above is
      <span lang="sa" class="deva">अलपद्म</span> <span class="iast">alapadma</span>,
      which among its meanings carries <em>separation</em>.</p>
    <div class="btn-row" style="justify-content:center">
      <a class="btn" href="index.html">Back to the beginning</a>
    </div>
  </div>
</section>'''
    return page('404.html', f"Not found — {C.ORG['name']}",
                'That page could not be found.', body)


# -------------------------------------------------------------------- build --

PAGES = {
    'index.html': build_home,
    'sequence.html': build_sequence,
    'gurukulam.html': build_gurukulam,
    'legend.html': build_legend,
    'enquire.html': build_enquire,
    '404.html': build_404,
}


def main():
    M.assert_valid()
    OUT.mkdir(parents=True, exist_ok=True)
    assets = OUT / 'assets'
    assets.mkdir(exist_ok=True)

    for name in ('site.css', 'site.js', 'mudra.js'):
        shutil.copy2(HERE / 'assets' / name, assets / name)

    img_src = ROOT / 'assets' / 'img'
    if img_src.exists():
        shutil.copytree(img_src, assets / 'img', dirs_exist_ok=True)

    glyphs.main()

    for slug, fn in PAGES.items():
        (OUT / slug).write_text(fn(), encoding='utf-8')
        print(f'  {slug}')

    print(f'\nbuilt {len(PAGES)} pages into {OUT}')


if __name__ == '__main__':
    main()
