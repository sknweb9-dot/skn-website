"""Sample the logo artwork for a palette rooted in the school's own identity.

    python _research/palette.py
"""

import collections
import colorsys
import pathlib
import sys

from PIL import Image

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ROOT = pathlib.Path(__file__).resolve().parent.parent
IMG = ROOT / 'assets' / 'img'


def sample(name, top=14):
    im = Image.open(IMG / name).convert('RGBA')
    im.thumbnail((400, 400))
    counts = collections.Counter()
    for r, g, b, a in im.getdata():
        if a < 200:
            continue
        # quantise so near-identical shades collapse together
        counts[(r // 16 * 16, g // 16 * 16, b // 16 * 16)] += 1

    total = sum(counts.values()) or 1
    print(f'\n{name}  ({im.width}x{im.height} sampled, {total} opaque px)')
    print('-' * 62)
    for (r, g, b), n in counts.most_common(top):
        h, l, s = colorsys.rgb_to_hls(r / 255, g / 255, b / 255)
        print(f'  #{r:02x}{g:02x}{b:02x}  {n / total * 100:5.1f}%   '
              f'hue {h * 360:5.0f}  sat {s * 100:3.0f}%  light {l * 100:3.0f}%')


for f in ['logo-full.png', 'logo-mark.png', 'logo-business.png']:
    if (IMG / f).exists():
        sample(f)

# a couple of photographs, to see what the palette has to live alongside
for f in ['hero-home.jpg', 'event-udaan-2025.jpg']:
    if (IMG / f).exists():
        sample(f, top=8)
