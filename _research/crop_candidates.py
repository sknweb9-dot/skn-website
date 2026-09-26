"""Render candidate arch crops from real frames so the framing decision is made
by looking, not by arithmetic.

The footage is landscape with a horizontal arm; the measured subject bbox is
x 1696-3232, y 384-1584 of 3840x2160. A portrait aperture therefore cannot
contain the whole arm and also fill vertically. Each candidate below trades
those off differently. Cutting the forearm on the right is acceptable — the
subject is the hand — so candidates are anchored on the fingertips.

Usage:  python _research/crop_candidates.py
"""

import subprocess
from pathlib import Path

from PIL import Image, ImageDraw

SRC = "Hastas.mp4"
OUT = Path("_research/hastas_probe")
OUT.mkdir(parents=True, exist_ok=True)

W, H = 3840, 2160

# Measured subject extents (full-res), from hand_extent.py.
SUBJ_L, SUBJ_R = 1696, 3232
SUBJ_T, SUBJ_B = 384, 1584

# Representative moments: a leftward point, a wide bloom, and a compact fist.
SAMPLES = {
    "suci": 24.5,      # Sūcī, index extended left
    "alapadma": 36.5,  # Alapadma, widest spread
    "musti": 13.5,     # Muṣṭi, most compact
}

# (label, ratio, crop_height, x_anchor_mode)
# x_anchor_mode "tip" puts a fixed margin left of the fingertips.
TIP_MARGIN = 150
CANDIDATES = [
    ("A_0.7215_full",  0.7215, 2160),
    ("B_0.7215_tight", 0.7215, 1750),
    ("C_0.79_full",    0.79,   2160),
    ("D_0.89_full",    0.89,   2160),
    ("E_0.89_tight",   0.89,   1750),
]


def grab(t: float) -> Image.Image:
    """Single full-resolution frame at time t as a PIL image."""
    png = OUT / f"raw_{t}.png"
    if not png.exists():
        subprocess.run(
            ["ffmpeg", "-y", "-v", "error", "-ss", str(t), "-i", SRC,
             "-frames:v", "1", str(png)],
            check=True,
        )
    return Image.open(png).convert("RGB")


def crop_box(ratio: float, ch: int) -> tuple[int, int, int, int]:
    """Crop rectangle of the given ratio and height, anchored on the fingertips
    horizontally and centred on the subject vertically, clamped to the frame."""
    cw = round(ch * ratio)
    x0 = SUBJ_L - TIP_MARGIN
    # Prefer showing forearm rather than empty backdrop: if the crop is wider
    # than needed, it extends right from the fingertip anchor.
    x0 = max(0, min(x0, W - cw))
    subj_cy = (SUBJ_T + SUBJ_B) // 2
    y0 = subj_cy - ch // 2
    y0 = max(0, min(y0, H - ch))
    return (x0, y0, x0 + cw, y0 + ch)


# One comparison sheet per sample moment.
for name, t in SAMPLES.items():
    frame = grab(t)
    tiles = []
    for label, ratio, ch in CANDIDATES:
        box = crop_box(ratio, ch)
        tile = frame.crop(box).resize((432, round(432 / ratio)), Image.LANCZOS)
        tiles.append((label, ratio, box, tile))

    pad = 12
    maxh = max(t_[3].height for t_ in tiles)
    sheet = Image.new("RGB", (sum(t_[3].width + pad for t_ in tiles) + pad, maxh + 60), (251, 248, 241))
    d = ImageDraw.Draw(sheet)
    x = pad
    for label, ratio, box, tile in tiles:
        sheet.paste(tile, (x, 44))
        d.text((x + 2, 6), label, fill=(20, 54, 66))
        d.text((x + 2, 22), f"{box[2]-box[0]}x{box[3]-box[1]}", fill=(111, 91, 77))
        x += tile.width + pad
    path = OUT / f"candidates_{name}.png"
    sheet.save(path)
    print(f"wrote {path}  ({len(tiles)} candidates)")

print()
print("crop rectangles (full-res):")
for label, ratio, ch in CANDIDATES:
    x0, y0, x1, y1 = crop_box(ratio, ch)
    cw = x1 - x0
    print(
        f"  {label:<16} ratio {ratio:.4f}  {cw}x{ch}  x {x0}-{x1}  y {y0}-{y1}   "
        f"subject fills {100*(SUBJ_R-SUBJ_L)/cw:5.1f}% W, {100*(SUBJ_B-SUBJ_T)/ch:5.1f}% H"
        f"{'   (forearm clipped)' if x1 < SUBJ_R else ''}"
    )
