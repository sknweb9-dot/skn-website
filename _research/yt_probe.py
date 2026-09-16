"""Fallback resolver for YouTube links that oEmbed refuses (401 -- typically
unlisted videos). Reads og:title from the watch/playlist page and merges the
result back into _research/youtube.json + youtube.txt.

    python _research/yt_probe.py
"""

import json
import pathlib
import re
import sys
import time
import urllib.request
from html import unescape

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ROOT = pathlib.Path(__file__).resolve().parent.parent
JSON_PATH = ROOT / '_research' / 'youtube.json'
TXT_PATH = ROOT / '_research' / 'youtube.txt'

UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
                    '(KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9'}


def og_title(url):
    try:
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=30) as resp:
            html = resp.read().decode('utf-8', 'ignore')
    except Exception as e:
        return None, f'fetch failed: {e}'
    m = re.search(r'<meta property="og:title" content="([^"]*)"', html)
    return (unescape(m.group(1)) if m else None), None


records = json.loads(JSON_PATH.read_text(encoding='utf-8'))

for r in records:
    if not r.get('error'):
        continue
    if r.get('video_id'):
        url = f'https://www.youtube.com/watch?v={r["video_id"]}'
    elif r.get('playlist_id'):
        url = f'https://www.youtube.com/playlist?list={r["playlist_id"]}'
    else:
        url = r['url']

    title, err = og_title(url)
    if title:
        r['title'] = title
        r['title_source'] = 'og:title (oEmbed returned ' + r['error'] + ')'
        r['error'] = None
        print(f'  resolved  {r.get("video_id") or r.get("playlist_id")}  {title}')
    else:
        r['title_source'] = err or 'no og:title'
        print(f'  UNRESOLVED  {url}  ({err or "no og:title"})')
    time.sleep(0.5)

JSON_PATH.write_text(json.dumps(records, indent=2, ensure_ascii=False), encoding='utf-8')

lines = [f'{len(records)} YouTube links referenced by the site', '']
for r in records:
    lines.append(f'{r["kind"].upper():8} {r["title"] or r["error"] or "UNRESOLVED"}')
    lines.append(f'         url   : {r["url"]}')
    lines.append(f'         pages : {", ".join(r["pages"])}')
    if r.get('link_text'):
        lines.append(f'         label : {" | ".join(r["link_text"])}')
    if r.get('title_source'):
        lines.append(f'         note  : {r["title_source"]}')
    lines.append('')
TXT_PATH.write_text('\n'.join(lines), encoding='utf-8')
print(f'\nupdated {JSON_PATH.name} and {TXT_PATH.name}')
