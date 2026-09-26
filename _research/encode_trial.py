"""Measure real WebP cost for the Hastas arch crop at several widths and
qualities, so the export resolution is chosen from bytes, not from a guess.

Measured aperture widths (CSS px) are 294-644 across viewports; at DPR 2 the
common retina case needs ~966 device px and the extreme needs ~1288. The old
720px source under-resolved both. This footage is a smooth grey backdrop with a
single hand, which should compress far better than the old plate, so the
trade-off is worth measuring instead of assuming.

Usage:  python _research/encode_trial.py
"""

import subprocess
import tempfile
from pathlib import Path

SRC = "Hastas.mp4"
CROP = "1558:2160:1546:0"  # w:h:x:y — see hand_extent.py / crop_candidates.py
TOTAL_FRAMES = 324  # 54s at 6fps, see the swap plan

# Sample across the whole video so the average reflects every gesture, not one.
SAMPLE_TIMES = [1.5, 8.5, 13.5, 18.5, 24.5, 28.5, 33.5, 36.5, 42.5, 48.5, 52.5]
WIDTHS = [720, 864, 1000, 1080]
QUALITIES = [70, 76, 82]

rows = []
with tempfile.TemporaryDirectory() as tmp:
    tmpd = Path(tmp)
    for width in WIDTHS:
        for q in QUALITIES:
            total = 0
            for t in SAMPLE_TIMES:
                out = tmpd / f"w{width}_q{q}_{t}.webp"
                subprocess.run(
                    ["ffmpeg", "-y", "-v", "error", "-ss", str(t), "-i", SRC,
                     "-frames:v", "1",
                     "-vf", f"crop={CROP},scale={width}:-2:flags=lanczos",
                     "-c:v", "libwebp", "-lossless", "0",
                     "-quality", str(q), "-compression_level", "6",
                     str(out)],
                    check=True,
                )
                total += out.stat().st_size
            avg = total / len(SAMPLE_TIMES)
            rows.append((width, q, avg, avg * TOTAL_FRAMES))

print(f"crop {CROP}, {TOTAL_FRAMES} frames projected, {len(SAMPLE_TIMES)} samples averaged")
print()
print(f"{'width':>6} {'quality':>8} {'avg KB':>9} {'total MB':>10}   verdict")
print("-" * 58)
OLD_MB = 4.36
for width, q, avg, total in rows:
    kb = avg / 1024
    mb = total / 1024 / 1024
    verdict = "under old budget" if mb <= OLD_MB else f"{mb / OLD_MB:.2f}x old"
    print(f"{width:>6} {q:>8} {kb:>9.1f} {mb:>10.2f}   {verdict}")

print()
print(f"old sequence for reference: 327 frames, 720px wide, {OLD_MB} MB total")
print()
print("device px needed at DPR 2:  1440 logical -> 726,  1920 -> 966,  2560 -> 1288")
