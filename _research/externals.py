"""Collect off-site references: social profiles, embeds, analytics, form fields.

    python _research/externals.py

Writes _research/externals.txt.
"""

import pathlib
import re
import sys
from html import unescape
from urllib.parse import unquote

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = ROOT / '_research' / 'pages'
OUT = ROOT / '_research' / 'externals.txt'

SOCIAL = re.compile(
    r'https?://(?:www\.)?(?:instagram\.com|facebook\.com|youtube\.com|youtu\.be|'
    r'twitter\.com|linkedin\.com|wa\.me|api\.whatsapp\.com|g\.page|'
    r'maps\.google\.[a-z.]+|goo\.gl)/[^"\'\\ <>)]+')
MAILTO = re.compile(r'mailto:([^"\'\\ <>)]+)')
TEL = re.compile(r'tel:([^"\'\\ <>)]+)')
FIELD = re.compile(r'<(input|textarea|select)\b[^>]*>', re.I)
ATTR = re.compile(r'(\w[\w-]*)\s*=\s*"([^"]*)"')
THIRD_PARTY = ['googletagmanager', 'google-analytics', 'gtag', 'facebook.net',
               'recaptcha', 'hotjar', 'clarity.ms', 'maps.googleapis']

lines = []
social, mails, tels = {}, {}, {}
services = {}
fields = {}

for page in sorted(PAGES.glob('*.html')):
    html = page.read_text(encoding='utf-8', errors='ignore')

    for u in set(SOCIAL.findall(html)):
        social.setdefault(unquote(unescape(u)).rstrip('/'), set()).add(page.stem)
    for u in set(MAILTO.findall(html)):
        mails.setdefault(unquote(unescape(u)), set()).add(page.stem)
    for u in set(TEL.findall(html)):
        tels.setdefault(unquote(unescape(u)), set()).add(page.stem)
    for s in THIRD_PARTY:
        if s in html:
            services.setdefault(s, set()).add(page.stem)

    fs = []
    for m in FIELD.finditer(html):
        a = dict(ATTR.findall(m.group(0)))
        if a.get('type') in ('hidden',):
            continue
        label = a.get('name') or a.get('placeholder') or a.get('aria-label') or a.get('id', '')
        if label:
            fs.append(f'{m.group(1)}[{a.get("type", "-")}] {unescape(label)}')
    if fs:
        fields[page.stem] = sorted(set(fs))


def section(title, mapping):
    lines.append('=' * 78)
    lines.append(title)
    lines.append('=' * 78)
    if not mapping:
        lines.append('  (none found)')
    for k, v in sorted(mapping.items()):
        lines.append(f'  {k}')
        lines.append(f'      pages: {", ".join(sorted(v))}')
    lines.append('')


section('SOCIAL / EXTERNAL PROFILES', social)
section('EMAIL ADDRESSES', mails)
section('PHONE NUMBERS', tels)
section('THIRD-PARTY SERVICES', services)

lines.append('=' * 78)
lines.append('FORM FIELDS')
lines.append('=' * 78)
for page, fs in sorted(fields.items()):
    lines.append(f'  {page}')
    for f in fs:
        lines.append(f'      {f}')
lines.append('')

OUT.write_text('\n'.join(lines) + '\n', encoding='utf-8')
print('\n'.join(lines))
