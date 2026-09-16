"""Extract per-page <img> alt text plus the original upload filename that Wix
keeps as the last path segment of its media URLs.

    python _research/alts.py

Writes _research/alts.txt. Useful for authoring honest alt text and for
recognising what each media id actually is.
"""

import pathlib
import re
import sys
from html import unescape

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = ROOT / '_research' / 'pages'
OUT = ROOT / '_research' / 'alts.txt'

IMG = re.compile(r'<img\b[^>]*>', re.I)
ATTR = re.compile(r'(\w[\w-]*)\s*=\s*"([^"]*)"')
# .../media/<id>/v1/<transform>/<original-filename>
# Greedy on the transform part: the filename is the LAST path segment.
ORIG = re.compile(r'static\.wixstatic\.com/media/([^/"\s]+)/v1/[^"\s]*/'
                  r'([^/"\s?]+\.(?:jpe?g|JPG|JPEG|png|PNG|gif|webp|avif))')

lines = []

for page in sorted(PAGES.glob('*.html')):
    html = page.read_text(encoding='utf-8', errors='ignore')
    lines.append('=' * 78)
    lines.append(page.stem)
    lines.append('=' * 78)

    seen = set()
    for tag in IMG.finditer(html):
        a = dict(ATTR.findall(tag.group(0)))
        src = a.get('src', '')
        if 'wixstatic' not in src:
            continue
        m = ORIG.search(src)
        mid = m.group(1) if m else '?'
        orig = unescape(m.group(2)) if m else '?'
        alt = unescape(a.get('alt', '<no alt>')) or '<empty alt>'
        key = (mid, alt)
        if key in seen:
            continue
        seen.add(key)
        lines.append(f'  alt : {alt}')
        lines.append(f'  file: {orig}')
        lines.append(f'  id  : {mid}')
        lines.append('')

    # background images carry the original filename too
    bgs = set()
    for m in ORIG.finditer(html):
        if m.group(2) not in ('x.jpg', 'x.png'):
            bgs.add((m.group(1), unescape(m.group(2))))
    if bgs:
        lines.append('  -- filenames seen anywhere on page (incl. backgrounds) --')
        for mid, orig in sorted(bgs, key=lambda t: t[1]):
            lines.append(f'     {orig:36} {mid}')
        lines.append('')

OUT.write_text('\n'.join(lines) + '\n', encoding='utf-8')
print('\n'.join(lines))
