import re, pathlib, json, sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

P = pathlib.Path('_research/pages')

def load(name):
    return (P / name).read_text(encoding='utf-8', errors='ignore')

# --- videos ---
h = load('videos.html')
ids = set(re.findall(r'youtube\.com/(?:watch\?v=|embed/)([A-Za-z0-9_-]{11})', h))
ids |= set(re.findall(r'youtu\.be/([A-Za-z0-9_-]{11})', h))
ids |= set(re.findall(r'"videoId":"([A-Za-z0-9_-]{11})"', h))
ids |= set(re.findall(r'i\.ytimg\.com/vi/([A-Za-z0-9_-]{11})/', h))
print('=== YT IDS', len(ids))
for i in sorted(ids):
    print(i)

print('=== VIDEO TITLES')
for m in sorted(set(re.findall(r'"title":"([^"]{4,90})"', h))):
    print(m)

# --- galleries: wix media ids (full size, no /v1/) ---
for name in ['photos.html', 'events.html']:
    h = load(name)
    med = sorted(set(re.findall(r'([0-9a-f]{6}_[0-9a-f]{32}~mv2(?:_d_\d+_\d+_s_\d+(?:_\d+)?)?\.(?:jpg|jpeg|png))', h)))
    print('===', name, 'MEDIA', len(med))
    for m in med:
        print(m)
    print('===', name, 'HEADINGS/LABELS')
    for m in sorted(set(re.findall(r'"(?:title|description|name)":"([^"]{3,70})"', h))):
        print(m)
