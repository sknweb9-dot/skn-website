"""Sanity-check the rendered crawl: does each report entry match its screenshot?

    python _research/verify_crawl.py
"""

import json
import pathlib
import struct
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ROOT = pathlib.Path(__file__).resolve().parent.parent
SHOTS = ROOT / '_research' / 'shots'
R = json.loads((ROOT / '_research' / 'render_report.json').read_text(encoding='utf-8'))


def png_size(p):
    d = pathlib.Path(p).read_bytes()
    if d[:8] != b'\x89PNG\r\n\x1a\n':
        return None
    return struct.unpack('>II', d[16:24])


hdr = ('page', 'report_h', 'desktop shot', 'mobile shot', 'imgs', 'bgs', 'hdgs')
print(f'{hdr[0]:24}{hdr[1]:>9}{hdr[2]:>15}{hdr[3]:>14}{hdr[4]:>6}{hdr[5]:>5}{hdr[6]:>6}')
print('-' * 79)

suspect = []
for k in sorted(R):
    d = R[k]
    ds = png_size(SHOTS / f'desktop-{k}.png')
    ms = png_size(SHOTS / f'mobile-{k}.png')
    dtxt = f'{ds[0]}x{ds[1]}' if ds else 'MISSING'
    mtxt = f'{ms[0]}x{ms[1]}' if ms else 'MISSING'
    print(f'{k:24}{d["height"]:>9}{dtxt:>15}{mtxt:>14}'
          f'{len(d["imgs"]):>6}{len(d["bgs"]):>5}{len(d["headings"]):>6}')
    # a full-page shot much taller than the reported body height means the
    # measurement was taken before layout finished
    if ds and ds[1] > d['height'] * 1.5:
        suspect.append((k, d['height'], ds[1]))

if suspect:
    print('\nHEIGHT MISMATCH (report measured before layout settled):')
    for k, rh, sh in suspect:
        print(f'  {k}: report {rh}px vs screenshot {sh}px')
else:
    print('\nheights consistent with screenshots')
