"""Resolve the YouTube links found on the Events page.

    python _research/yt_titles.py

Reads the crawled pages, collects every YouTube video/playlist URL, resolves
its title through YouTube's public oEmbed endpoint, and writes
_research/youtube.json + _research/youtube.txt.
"""

import json
import pathlib
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from html import unescape

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ROOT = pathlib.Path(__file__).resolve().parent.parent
PAGES = ROOT / '_research' / 'pages'

UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                    '(KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'}

ANCHOR = re.compile(r'<a\b([^>]*)>(.*?)</a>', re.S | re.I)
ATTR = re.compile(r'(\w[\w-]*)\s*=\s*"([^"]*)"')
TAGS = re.compile(r'<[^>]+>')
YT = re.compile(r'(?:youtube\.com|youtu\.be)')


def anchor_text(inner):
    return re.sub(r'\s+', ' ', unescape(TAGS.sub(' ', inner))).strip()


def oembed(url):
    q = urllib.parse.urlencode({'url': url, 'format': 'json'})
    req = urllib.request.Request(f'https://www.youtube.com/oembed?{q}', headers=UA)
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        return {'error': f'HTTP {e.code}'}
    except Exception as e:
        return {'error': str(e)}


def canonical(url):
    """Strip tracking/extra params -- oEmbed rejects some combinations."""
    vid = re.search(r'(?:[?&]v=|youtu\.be/|embed/)([A-Za-z0-9_-]{11})', url)
    if vid:
        return f'https://www.youtube.com/watch?v={vid.group(1)}'
    plist = re.search(r'[?&]list=([A-Za-z0-9_-]+)', url)
    if plist:
        return f'https://www.youtube.com/playlist?list={plist.group(1)}'
    return url


def resolve(url):
    info = oembed(url)
    if info.get('error'):
        alt = canonical(url)
        if alt != url:
            time.sleep(0.4)
            retry = oembed(alt)
            if not retry.get('error'):
                retry['_resolved_via'] = alt
                return retry
            info = retry
    return info


def main():
    found = {}
    for page in sorted(PAGES.glob('*.html')):
        html = page.read_text(encoding='utf-8', errors='ignore')
        for m in ANCHOR.finditer(html):
            attrs = dict(ATTR.findall(m.group(1)))
            href = unescape(attrs.get('href', ''))
            if not href or not YT.search(href):
                continue
            rec = found.setdefault(href, {'url': href, 'pages': set(), 'link_text': set()})
            rec['pages'].add(page.stem)
            txt = anchor_text(m.group(2)) or attrs.get('aria-label', '')
            if txt:
                rec['link_text'].add(txt)

    results = []
    for href, rec in sorted(found.items()):
        info = resolve(href)
        kind = 'playlist' if 'list=' in href and 'watch?v=' not in href else 'video'
        vid = re.search(r'(?:v=|youtu\.be/|embed/)([A-Za-z0-9_-]{11})', href)
        plist = re.search(r'list=([A-Za-z0-9_-]+)', href)
        results.append({
            'url': href,
            'kind': kind,
            'video_id': vid.group(1) if vid else None,
            'playlist_id': plist.group(1) if plist else None,
            'title': info.get('title'),
            'author': info.get('author_name'),
            'error': info.get('error'),
            'pages': sorted(rec['pages']),
            'link_text': sorted(rec['link_text']),
        })
        time.sleep(0.2)

    (ROOT / '_research' / 'youtube.json').write_text(
        json.dumps(results, indent=2, ensure_ascii=False), encoding='utf-8')

    lines = [f'{len(results)} YouTube links referenced by the site', '']
    for r in results:
        lines.append(f'{r["kind"].upper():8} {r["title"] or r["error"]}')
        lines.append(f'         url   : {r["url"]}')
        lines.append(f'         pages : {", ".join(r["pages"])}')
        if r['link_text']:
            lines.append(f'         label : {" | ".join(r["link_text"])}')
        lines.append('')
    (ROOT / '_research' / 'youtube.txt').write_text('\n'.join(lines), encoding='utf-8')
    print('\n'.join(lines))


if __name__ == '__main__':
    main()
