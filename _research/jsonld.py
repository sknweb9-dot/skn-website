"""Extract every application/ld+json block from the crawled pages.

    python _research/jsonld.py

Writes _research/jsonld.json (raw, per page) and _research/videos.json
(flattened video list: id, title, description, duration, upload date).

The Wix pages are client-rendered, so the visible copy is not in the saved
HTML -- but the JSON-LD blocks are, and they carry the gallery titles,
video titles and the full theory text for the Videos page.
"""

import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

PAGES = pathlib.Path('_research/pages')
OUT = pathlib.Path('_research')

BLOCK = re.compile(r'<script[^>]+type="application/ld\+json"[^>]*>(.*?)</script>', re.S)


def iso_to_secs(d):
    m = re.match(r'PT(?:(\d+)M)?(?:(\d+)S)?', d or '')
    if not m:
        return None
    return int(m.group(1) or 0) * 60 + int(m.group(2) or 0)


def main():
    raw = {}
    videos = []

    for page in sorted(PAGES.glob('*.html')):
        html = page.read_text(encoding='utf-8', errors='ignore')
        blocks = []

        for m in BLOCK.finditer(html):
            try:
                blocks.append(json.loads(m.group(1)))
            except json.JSONDecodeError as e:
                blocks.append({'_parse_error': str(e), '_raw': m.group(1)[:500]})

        if blocks:
            raw[page.stem] = blocks

        for b in blocks:
            for item in b.get('itemListElement', []) if isinstance(b, dict) else []:
                if item.get('@type') != 'VideoObject':
                    continue
                vid = re.search(r'/embed/([A-Za-z0-9_-]{11})', item.get('embedUrl', ''))
                videos.append({
                    'page': page.stem,
                    'id': vid.group(1) if vid else None,
                    'position': item.get('position'),
                    'title': item.get('name'),
                    'description': item.get('description'),
                    'duration': item.get('duration'),
                    'seconds': iso_to_secs(item.get('duration')),
                    'uploaded': item.get('uploadDate'),
                    'thumbnail': item.get('thumbnailUrl'),
                })

    (OUT / 'jsonld.json').write_text(
        json.dumps(raw, indent=2, ensure_ascii=False), encoding='utf-8')
    (OUT / 'videos.json').write_text(
        json.dumps(videos, indent=2, ensure_ascii=False), encoding='utf-8')

    print(f'jsonld.json: {len(raw)} pages with JSON-LD '
          f'({sum(len(v) for v in raw.values())} blocks)')
    print(f'videos.json: {len(videos)} videos\n')
    for v in videos:
        print(f'  {v["id"]}  {v["duration"]:>7}  {v["title"]}')

    types = {}
    for page, blocks in raw.items():
        for b in blocks:
            t = b.get('@type', '?') if isinstance(b, dict) else '?'
            types.setdefault(t, []).append(page)
    print('\nJSON-LD types found:')
    for t, pages in sorted(types.items()):
        print(f'  {t}: {", ".join(sorted(set(pages)))}')


if __name__ == '__main__':
    main()
