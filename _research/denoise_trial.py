"""Does denoising the backdrop pay for itself?

The grey backdrop carries sensor noise and a soft vignette. Lossy WebP spends
real bytes encoding that noise, and on a scroll-scrubbed sequence it also shows
up as frame-to-frame shimmer in what should be a still background. hqdn3d's
temporal terms are well suited here: the backdrop is static and only the hand
moves.

This measures bytes for several strengths and writes one frame of each for
visual inspection, because denoise that smears the alta edges is not acceptable
however well it compresses.

Usage:  python _research/denoise_trial.py
"""

import subprocess
from pathlib import Path

SRC = "Hastas.mp4"
CROP = "1558:2160:1546:0"
WIDTH = 864
QUALITY = 70
TOTAL_FRAMES = 324
OUT = Path("_research/hastas_probe/denoise")
OUT.mkdir(parents=True, exist_ok=True)

# luma_spatial:chroma_spatial:luma_tmp:chroma_tmp
VARIANTS = {
    "none": None,
    "light": "hqdn3d=1.5:1.0:4:3",
    "moderate": "hqdn3d=3:2:6:4.5",
    "strong": "hqdn3d=5:3.5:8:6",
}

# A short run of consecutive frames, so temporal denoise has neighbours to work
# with and the byte figure is realistic rather than measured on isolated stills.
START = 36.0
DURATION = 1.0  # at 6fps -> 6 frames

print(f"crop {CROP}, width {WIDTH}, quality {QUALITY}, {TOTAL_FRAMES} frames projected")
print()
print(f"{'variant':<10} {'avg KB':>9} {'total MB':>10}   {'vs none':>8}")
print("-" * 48)

baseline = None
for name, vf in VARIANTS.items():
    d = OUT / name
    if d.exists():
        for f in d.glob("*.webp"):
            f.unlink()
    d.mkdir(exist_ok=True)
    chain = f"crop={CROP}"
    if vf:
        chain += f",{vf}"
    chain += f",fps=6,scale={WIDTH}:-2:flags=lanczos"
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-ss", str(START), "-t", str(DURATION),
         "-i", SRC, "-vf", chain,
         "-an", "-c:v", "libwebp", "-lossless", "0",
         "-quality", str(QUALITY), "-compression_level", "6",
         str(d / "f_%03d.webp")],
        check=True,
    )
    files = sorted(d.glob("*.webp"))
    avg = sum(f.stat().st_size for f in files) / len(files)
    mb = avg * TOTAL_FRAMES / 1024 / 1024
    if baseline is None:
        baseline = mb
        delta = "—"
    else:
        delta = f"{(mb / baseline - 1) * 100:+.0f}%"
    print(f"{name:<10} {avg / 1024:>9.1f} {mb:>10.2f}   {delta:>8}")

print()
print(f"frames written to {OUT} for visual comparison ({len(files)} per variant)")
