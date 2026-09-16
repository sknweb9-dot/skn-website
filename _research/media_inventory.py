"""Inventory every Wix media asset referenced by the crawled pages and
cross-check it against the download manifest in fetch_media.py.

    python _research/media_inventory.py

Writes _research/media_inventory.txt.
"""

import pathlib
import re
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = ROOT / '_research' / 'pages'
OUT = ROOT / '_research' / 'media_inventory.txt'

MEDIA = re.compile(
    r'([0-9a-f]{6}_[0-9a-f]{32}~mv2(?:_d_\d+_\d+_s_\d+(?:_\d+)?)?\.(?:jpe?g|png|gif))')

# Wix chrome / template assets that are not site content.
CHROME_PREFIXES = ('11062b_',)

lines = []
per_page = {}
all_ids = {}

for page in sorted(PAGES.glob('*.html')):
    html = page.read_text(encoding='utf-8', errors='ignore')
    ids = sorted(set(MEDIA.findall(html)))
    per_page[page.stem] = ids
    for i in ids:
        all_ids.setdefault(i, []).append(page.stem)

manifest = (ROOT / '_research' / 'fetch_media.py').read_text(encoding='utf-8')
wanted = set(MEDIA.findall(manifest))

lines.append(f'{len(all_ids)} unique Wix media assets across {len(per_page)} pages')
lines.append(f'{len(wanted)} referenced by fetch_media.py manifest\n')

lines.append('=' * 78)
lines.append('PER PAGE')
lines.append('=' * 78)
for page, ids in per_page.items():
    content_ids = [i for i in ids if not i.startswith(CHROME_PREFIXES)]
    lines.append(f'\n{page}  ({len(content_ids)} content assets, '
                 f'{len(ids) - len(content_ids)} wix chrome)')
    for i in content_ids:
        flag = '   ' if i in wanted else 'NEW'
        lines.append(f'  {flag}  {i}')

lines.append('\n' + '=' * 78)
lines.append('IN MANIFEST BUT NOT FOUND IN ANY SAVED PAGE')
lines.append('=' * 78)
for i in sorted(wanted - set(all_ids)):
    lines.append(f'  {i}')

lines.append('\n' + '=' * 78)
lines.append('FOUND IN PAGES BUT MISSING FROM MANIFEST')
lines.append('=' * 78)
for i in sorted(set(all_ids) - wanted):
    if i.startswith(CHROME_PREFIXES):
        continue
    lines.append(f'  {i}   [{", ".join(all_ids[i])}]')

OUT.write_text('\n'.join(lines) + '\n', encoding='utf-8')
print('\n'.join(lines))
