"""Locate the hand horizontally across Hastas.mp4, so the portrait arch crop is
chosen from the footage rather than guessed.

The backdrop is neutral grey (R ~= G ~= B), the sleeve is green (G > R), and the
hand is skin plus red alta (R clearly > B). Thresholding on R - B therefore
isolates hand and forearm while rejecting both backdrop and sleeve.

For each sampled frame this reports the x-extent of that warm mass, excluding a
small tail of stray pixels. The union across frames is what the crop has to
contain.

Usage:  python _research/hand_extent.py [sample_every_n_frames]
"""

import subprocess
import sys

import numpy as np

SRC = "Hastas.mp4"
W, H = 3840, 2160
# Analyse at reduced width; horizontal placement does not need 4K precision.
AW = 480
AH = 270
STEP = int(sys.argv[1]) if len(sys.argv) > 1 else 15

# R - B above this counts as warm (hand). Grey backdrop sits near 0; the green
# sleeve goes negative.
WARM = 22
# Ignore the outermost 1% of warm mass per side, so a few stray warm pixels in
# the backdrop texture cannot widen the reported extent.
TAIL = 0.01


def frames():
    """Yield downscaled RGB frames from ffmpeg's rawvideo pipe."""
    cmd = [
        "ffmpeg", "-v", "error", "-i", SRC,
        "-vf", f"scale={AW}:{AH}",
        "-f", "rawvideo", "-pix_fmt", "rgb24", "-",
    ]
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, bufsize=10**8)
    size = AW * AH * 3
    idx = 0
    while True:
        buf = proc.stdout.read(size)
        if len(buf) < size:
            break
        if idx % STEP == 0:
            yield idx, np.frombuffer(buf, np.uint8).reshape(AH, AW, 3).astype(np.int16)
        idx += 1
    proc.stdout.close()
    proc.wait()


lo_all, hi_all = [], []
top_all, bot_all = [], []
centres = []
count = 0

for idx, img in frames():
    warm = (img[:, :, 0] - img[:, :, 2]) > WARM
    col = warm.sum(axis=0).astype(float)
    row = warm.sum(axis=1).astype(float)
    total = col.sum()
    if total < 200:  # essentially empty frame
        continue
    count += 1

    cum = np.cumsum(col) / total
    lo = int(np.searchsorted(cum, TAIL))
    hi = int(np.searchsorted(cum, 1 - TAIL))
    rcum = np.cumsum(row) / row.sum()
    top = int(np.searchsorted(rcum, TAIL))
    bot = int(np.searchsorted(rcum, 1 - TAIL))

    lo_all.append(lo)
    hi_all.append(hi)
    top_all.append(top)
    bot_all.append(bot)
    # Centre of mass of the warm pixels, weighted — the hand dominates because
    # the forearm is narrower.
    centres.append((col * np.arange(AW)).sum() / total)

lo_all = np.array(lo_all)
hi_all = np.array(hi_all)
centres = np.array(centres)

print(f"frames analysed: {count} (every {STEP}th)")
print()
print(f"warm-mass left edge   min {lo_all.min():3d}  median {int(np.median(lo_all)):3d}  max {lo_all.max():3d}   (of {AW})")
print(f"warm-mass right edge  min {hi_all.min():3d}  median {int(np.median(hi_all)):3d}  max {hi_all.max():3d}")
print(f"vertical extent       top min {min(top_all):3d}   bottom max {max(bot_all):3d}   (of {AH})")
print()
print(f"centre of mass        min {centres.min():6.1f}  median {np.median(centres):6.1f}  max {centres.max():6.1f}")
print(f"as fraction of width  min {centres.min()/AW:.4f}  median {np.median(centres)/AW:.4f}  max {centres.max()/AW:.4f}")
print()

# The hand (not the forearm) is what must be framed. The forearm runs to the
# right edge in every frame, so the left edge of the warm mass tracks the
# fingertips and is the meaningful bound.
print(f"leftmost fingertip across all frames: x={lo_all.min()} of {AW} = {lo_all.min()/AW:.4f} of width")
print()

RATIO = 0.7215
crop_w_full = round(H * RATIO)
crop_w_analysis = crop_w_full * AW / W
print(f"portrait crop at ratio {RATIO}: {crop_w_full} x {H} full-res")
print(f"  = {crop_w_analysis:.1f} px wide in this {AW}-wide analysis space")
print()

# Try candidate left offsets and report how much margin the hand gets.
print("candidate crops (full-res x offset -> margin around the warm mass):")
for frac in (0.34, 0.36, 0.38, 0.40, 0.42, 0.44):
    x0 = round(W * frac)
    x1 = x0 + crop_w_full
    a0 = x0 * AW / W
    a1 = x1 * AW / W
    left_margin = lo_all.min() - a0
    right_ok = a1 >= hi_all.max()
    covers = left_margin >= 0
    print(
        f"  x={x0:4d}..{x1:4d} (frac {frac:.2f})  "
        f"left margin {left_margin:6.1f}px(analysis)  "
        f"{'contains fingertips' if covers else 'CLIPS FINGERTIPS'}"
        f"{'' if right_ok else '  (right edge inside arm — fine)'}"
    )
