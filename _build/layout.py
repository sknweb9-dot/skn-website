"""Shared chrome (head, header, footer) for the Shanti Kala Nikketan site.

The site ships as plain static HTML. This module only exists so the header,
navigation and footer live in one place instead of being duplicated across
eleven files.
"""

SITE = 'https://www.shantikalanikketan.com'
EMAIL = 'shantikalanikketan@gmail.com'
PHONE_HREF = '+919884022306'
PHONE_TEXT = '+91&nbsp;98840&nbsp;22306'

INSTAGRAM = 'https://www.instagram.com/shantikalanikketan/'
FACEBOOK = 'https://www.facebook.com/shantikalanikketan'
YOUTUBE = 'https://www.youtube.com/channel/UCDGm0LQ-24ZIKG-2DUAn2ew'

ICON_IG = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.2c3.2 0 3.6 0 4.9.07 '
           '1.2.06 1.8.25 2.2.42.6.22 1 .5 1.4.9.4.4.7.8.9 1.4.17.4.36 1 .42 2.2.06 1.3.07 '
           '1.7.07 4.9s0 3.6-.07 4.9c-.06 1.2-.25 1.8-.42 2.2a3.9 3.9 0 0 1-.9 1.4c-.4.4-.8.7'
           '-1.4.9-.4.17-1 .36-2.2.42-1.3.06-1.7.07-4.9.07s-3.6 0-4.9-.07c-1.2-.06-1.8-.25-2.2'
           '-.42a3.9 3.9 0 0 1-1.4-.9 3.9 3.9 0 0 1-.9-1.4c-.17-.4-.36-1-.42-2.2C2.2 15.6 2.2 '
           '15.2 2.2 12s0-3.6.07-4.9c.06-1.2.25-1.8.42-2.2.22-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4'
           '-.17 1-.36 2.2-.42C8.4 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.1 0-3.5 0-4.8.07-1 .05-1.5.2'
           '-1.8.33-.4.15-.6.32-.9.6-.3.3-.45.5-.6.9-.13.3-.28.8-.33 1.8C3.5 8.5 3.5 8.9 3.5 '
           '12s0 3.5.07 4.8c.05 1 .2 1.5.33 1.8.15.4.3.6.6.9.3.3.5.45.9.6.3.13.8.28 1.8.33 1.3'
           '.07 1.7.07 4.8.07s3.5 0 4.8-.07c1-.05 1.5-.2 1.8-.33.4-.15.6-.3.9-.6.3-.3.45-.5.6'
           '-.9.13-.3.28-.8.33-1.8.07-1.3.07-1.7.07-4.8s0-3.5-.07-4.8c-.05-1-.2-1.5-.33-1.8a2.4 '
           '2.4 0 0 0-.6-.9 2.4 2.4 0 0 0-.9-.6c-.3-.13-.8-.28-1.8-.33C15.5 4 15.1 4 12 4Zm0 '
           '3a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4ZM18.2 '
           '6.9a1.17 1.17 0 1 1-2.34 0 1.17 1.17 0 0 1 2.34 0Z"/></svg>')

ICON_FB = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 21v-8h2.7l.4-3.1h-3.1V7.9'
           'c0-.9.25-1.5 1.55-1.5H16.7V3.6c-.3-.04-1.3-.13-2.5-.13-2.45 0-4.13 1.5-4.13 4.24V9.9'
           'H7.3V13h2.77v8h3.43Z"/></svg>')

ICON_YT = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.6 7.2a2.5 2.5 0 0 0-1.76'
           '-1.77C18.25 5 12 5 12 5s-6.25 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2'
           '.4 4.8a2.5 2.5 0 0 0 1.76 1.77C5.75 19 12 19 12 19s6.25 0 7.84-.43a2.5 2.5 0 0 0 '
           '1.76-1.77C22 15.2 22 12 22 12s0-3.2-.4-4.8ZM10 15.2V8.8l5.2 3.2-5.2 3.2Z"/></svg>')

ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'

# slug -> (label, parent group or None)
NAV_ABOUT = [
    ('about.html', 'About Us'),
    ('shanti-kala-nikketan.html', 'Shanti Kala Nikketan'),
    ('founders.html', 'Founders'),
    ('team.html', 'Our Team'),
    ('logo.html', 'The Logo'),
]
NAV_GALLERY = [
    ('photos.html', 'Photos'),
    ('videos.html', 'Videos'),
]


def _social(extra_class=''):
    cls = 'social-links' + (' ' + extra_class if extra_class else '')
    return f'''<ul class="{cls}">
        <li><a href="{INSTAGRAM}" target="_blank" rel="noopener noreferrer">{ICON_IG}<span class="visually-hidden">Instagram</span></a></li>
        <li><a href="{FACEBOOK}" target="_blank" rel="noopener noreferrer">{ICON_FB}<span class="visually-hidden">Facebook</span></a></li>
        <li><a href="{YOUTUBE}" target="_blank" rel="noopener noreferrer">{ICON_YT}<span class="visually-hidden">YouTube</span></a></li>
      </ul>'''


def _nav_link(href, label, current):
    mark = ' aria-current="page"' if href == current else ''
    return f'<li><a href="{href}"{mark}>{label}</a></li>'


def _sub(items, current, sub_id, label):
    parts = []
    for href, text in items:
        mark = ' aria-current="page"' if href == current else ''
        parts.append(f'<li><a href="{href}"{mark}>{text}</a></li>')
    links = '\n            '.join(parts)
    return f'''<li class="has-sub">
          <button type="button" aria-expanded="false" aria-controls="{sub_id}">{label}</button>
          <ul class="subnav" id="{sub_id}">
            {links}
          </ul>
        </li>'''


def header(current):
    return f'''<header class="site-header">
  <div class="site-header__inner">
    <a class="brand" href="index.html">
      <img src="assets/img/logo-mark.png" alt="" width="42" height="39">
      <span class="brand__name">Shanti Kala Nikketan</span>
    </a>

    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">
      <span></span>
      <span class="visually-hidden">Menu</span>
    </button>

    <nav class="site-nav" id="site-nav" aria-label="Main">
      <ul>
        {_nav_link('index.html', 'Home', current)}
        {_sub(NAV_ABOUT, current, 'subnav-about', 'About')}
        {_nav_link('gurukulam.html', 'Gurukulam', current)}
        {_nav_link('events.html', 'Events', current)}
        {_sub(NAV_GALLERY, current, 'subnav-gallery', 'Gallery')}
        {_nav_link('contact.html', 'Contact', current)}
      </ul>

      {_social()}
    </nav>
  </div>
</header>'''


FOOTER = f'''<footer class="site-footer">
  <div class="wrap">
    <div class="site-footer__grid">
      <div class="site-footer__brand">
        <img src="assets/img/logo-mark.png" alt="Shanti Kala Nikketan logo" width="64" height="60" loading="lazy">
        <p class="site-footer__name">Shanti Kala Nikketan</p>
        <p>Academy of Fine Arts</p>
        {_social()}
      </div>

      <nav aria-labelledby="footer-explore">
        <h2 id="footer-explore">Explore</h2>
        <ul class="footer-nav">
          <li><a href="about.html">About Us</a></li>
          <li><a href="shanti-kala-nikketan.html">Shanti Kala Nikketan</a></li>
          <li><a href="founders.html">Founders</a></li>
          <li><a href="team.html">Our Team</a></li>
          <li><a href="logo.html">The Logo</a></li>
        </ul>
      </nav>

      <nav aria-labelledby="footer-learn">
        <h2 id="footer-learn">Learn &amp; Watch</h2>
        <ul class="footer-nav">
          <li><a href="gurukulam.html">Gurukulam</a></li>
          <li><a href="events.html">Events</a></li>
          <li><a href="photos.html">Photos</a></li>
          <li><a href="videos.html">Videos</a></li>
          <li><a href="contact.html">Contact</a></li>
        </ul>
      </nav>

      <div>
        <h2>Visit us</h2>
        <p>
          11018, Ground Floor, Tower 11,<br>
          Prestige Courtyard,<br>
          Model School Extension Road,<br>
          Sholinganallur, Chennai 600119
        </p>
        <p>
          <a href="tel:{PHONE_HREF}">{PHONE_TEXT}</a><br>
          <a href="mailto:{EMAIL}">{EMAIL}</a>
        </p>
      </div>
    </div>
  </div>
  <div class="site-footer__bar">
    <div class="wrap">
      <p>&copy; <span id="year">2026</span> Shanti Kala Nikketan &middot; Academy of Fine Arts</p>
    </div>
  </div>
</footer>'''


ORG_JSONLD = f'''<script type="application/ld+json">
{{
  "@context": "https://schema.org",
  "@type": "PerformingArtsTheater",
  "name": "Shanti Kala Nikketan \\u2014 Academy of Fine Arts",
  "alternateName": "Shanti Kala Nikketan",
  "url": "{SITE}/",
  "logo": "{SITE}/assets/img/logo-mark.png",
  "image": "{SITE}/assets/img/hero-home.jpg",
  "foundingDate": "2009-04-18",
  "email": "{EMAIL}",
  "telephone": "+91-98840-22306",
  "address": {{
    "@type": "PostalAddress",
    "streetAddress": "11018, Ground Floor, Tower 11, Prestige Courtyard, Model School Extension Road",
    "addressLocality": "Sholinganallur, Chennai",
    "postalCode": "600119",
    "addressRegion": "Tamil Nadu",
    "addressCountry": "IN"
  }},
  "areaServed": ["Chennai, India", "Scarborough, Canada"],
  "sameAs": ["{INSTAGRAM}", "{FACEBOOK}", "{YOUTUBE}"]
}}
</script>'''


def breadcrumb(trail):
    """trail: list of (href|None, label). Last item is the current page."""
    if not trail:
        return ''
    items = []
    for i, (href, label) in enumerate(trail):
        if href and i < len(trail) - 1:
            items.append(f'<li><a href="{href}">{label}</a></li>')
        else:
            items.append(f'<li><span aria-current="page">{label}</span></li>')
    return f'''<nav class="breadcrumb" aria-label="Breadcrumb">
    <div class="wrap"><ol>
      {''.join(items)}
    </ol></div>
  </nav>'''


def page(slug, title, description, body, og_image='assets/img/hero-home.jpg',
         extra_head='', jsonld=False, lightbox=False):
    canonical = f'{SITE}/' if slug == 'index.html' else f'{SITE}/{slug[:-5]}'
    ld = '\n' + ORG_JSONLD if jsonld else ''
    lb = ''
    if lightbox:
        lb = '''
<dialog class="lightbox" id="lightbox" aria-label="Image viewer">
  <button class="lightbox__close" type="button" aria-label="Close image viewer">&times;</button>
  <div>
    <img alt="">
    <p class="lightbox__caption"></p>
  </div>
</dialog>'''

    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{description}">
<link rel="canonical" href="{canonical}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Shanti Kala Nikketan">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{description}">
<meta property="og:image" content="{SITE}/{og_image}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0e3355">
<link rel="icon" href="assets/img/logo-mark.png" type="image/png">
<link rel="apple-touch-icon" href="assets/img/logo-mark.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&amp;family=Jost:wght@300;400;500&amp;family=Playfair+Display:wght@700&amp;display=swap">
<link rel="stylesheet" href="assets/css/style.css">{extra_head}{ld}
</head>
<body>
<a class="skip-link" href="#main">Skip to main content</a>

{header(slug)}

<main id="main">
{body}
</main>

{FOOTER}
{lb}
<script src="assets/js/main.js" defer></script>
<script>document.getElementById('year').textContent = new Date().getFullYear();</script>
</body>
</html>
'''
