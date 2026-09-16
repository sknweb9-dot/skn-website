"""Summarise the rendered crawl: typography, palette, headings and the images
that only appear after JavaScript runs.

    python _research/design_summary.py

Writes _research/design_summary.txt and _research/rendered_media.txt.
"""

import collections
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ROOT = pathlib.Path(__file__).resolve().parent.parent
R = json.loads((ROOT / '_research' / 'render_report.json').read_text(encoding='utf-8'))

MEDIA_ID = re.compile(r'/media/([^/?"\s]+?)(?:/v1/|$|\?)')

fonts = collections.Counter()
colors = collections.Counter()
lines = []

lines.append('TYPOGRAPHY AND PALETTE (from rendered pages, 1440x900)')
lines.append('=' * 70)

for page, d in sorted(R.items()):
    for key, n in d.get('fonts', []):
        fonts[key] += n
    for key, n in d.get('colors', []):
        colors[key] += n

lines.append('\nFont families / weights / sizes, by element count across all pages:')
for key, n in fonts.most_common(24):
    lines.append(f'  {n:>6}  {key}')

lines.append('\nColours, by element count (BG = background-color):')
for key, n in colors.most_common(24):
    lines.append(f'  {n:>6}  {key}')

lines.append('\n\nPER PAGE')
lines.append('=' * 70)
for page, d in sorted(R.items()):
    lines.append(f'\n{page}')
    lines.append(f'  title    : {d.get("title")}')
    lines.append(f'  height   : {d.get("height")} px')
    lines.append(f'  images   : {len(d.get("imgs", []))} rendered'
                 f' / {len(d.get("bgs", []))} css backgrounds')
    lines.append(f'  iframes  : {len(d.get("iframes", []))}')
    lines.append(f'  forms    : {d.get("forms")}  inputs: {d.get("inputs")}')
    for h in d.get('headings', []):
        lines.append(f'    {h}')

(ROOT / '_research' / 'design_summary.txt').write_text(
    '\n'.join(lines) + '\n', encoding='utf-8')

# ---- rendered media, and what the static HTML missed --------------------
static = set()
for p in (ROOT / '_research' / 'pages').glob('*.html'):
    static.update(MEDIA_ID.findall(p.read_text(encoding='utf-8', errors='ignore')))

mlines = ['MEDIA VISIBLE ONLY AFTER RENDER (not in the saved static HTML)',
          '=' * 70]
new_total = 0
for page, d in sorted(R.items()):
    rendered = {}
    for img in d.get('imgs', []):
        m = MEDIA_ID.search(img.get('src', ''))
        if m:
            rendered.setdefault(m.group(1), img)
    for bg in d.get('bgs', []):
        m = MEDIA_ID.search(bg)
        if m:
            rendered.setdefault(m.group(1), {'src': bg, 'alt': '(css background)'})

    fresh = {k: v for k, v in rendered.items() if k not in static}
    mlines.append(f'\n{page}: {len(rendered)} media rendered, {len(fresh)} NOT in static HTML')
    for mid, img in sorted(fresh.items()):
        new_total += 1
        alt = img.get('alt') or '<no alt>'
        dims = f'{img.get("w", "?")}x{img.get("h", "?")}'
        mlines.append(f'    {mid}')
        mlines.append(f'      alt {alt}   natural {dims}')

mlines.append(f'\n\nTOTAL newly discovered media references: {new_total}')
(ROOT / '_research' / 'rendered_media.txt').write_text(
    '\n'.join(mlines) + '\n', encoding='utf-8')

print('\n'.join(lines[:60]))
print('\n...full output in design_summary.txt and rendered_media.txt')
print(f'\nnewly discovered media references: {new_total}')
