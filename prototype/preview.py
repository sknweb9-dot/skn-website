"""Downscale review screenshots to something inspectable.

    python prototype/preview.py [name ...]

Full-page mobile shots at DPR2 run to several megabytes; this writes capped
JPEGs into prototype/review/small/ instead.
"""

import pathlib
import sys

from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
SRC = HERE / 'review'
DST = SRC / 'small'
TARGET_W = 820          # readable width
SEG_H = 2600            # max height per segment before splitting


def save(im, out):
    q = 72
    im.save(out, 'JPEG', quality=q, optimize=True)
    while out.stat().st_size > 4_400_000 and q > 35:
        q -= 12
        im.save(out, 'JPEG', quality=q, optimize=True)
    print(f'{out.name:38} {im.size[0]}x{im.size[1]}  '
          f'{out.stat().st_size // 1024} KB  q{q}')


def main():
    DST.mkdir(parents=True, exist_ok=True)
    wanted = sys.argv[1:]

    for f in sorted(SRC.glob('*.png')):
        if wanted and not any(w in f.name for w in wanted):
            continue
        im = Image.open(f).convert('RGB')
        w, h = im.size
        scale = min(TARGET_W / w, 1.0)
        if scale < 1.0:
            im = im.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
        w, h = im.size

        if h <= SEG_H:
            save(im, DST / (f.stem + '.jpg'))
            continue

        parts = (h + SEG_H - 1) // SEG_H
        for i in range(parts):
            top = i * SEG_H
            seg = im.crop((0, top, w, min(h, top + SEG_H)))
            save(seg, DST / f'{f.stem}-{i + 1}of{parts}.jpg')


if __name__ == '__main__':
    main()
