"""Move the later hand stills toward the far side of the hand, to match the shader.

The live arch shifts the footage in the shader (components/home/archVideo.ts) by
lib/footage.ts's handShiftAtFrame. The stills in web/public/frames are shown
where the footage is not playing (the stacked page, reduced motion, /hastas), so
they have to agree with it. This rewrites every frame from RAMP_FROM on with the
same correction: shifted left by round(shift * width) pixels, the strip it
uncovers on the arm's side filled by repeating the last column, which is the arm.

It is NOT idempotent: run twice and the frames move twice. It writes
_research/frames_shifted.json when done and refuses to run again while that file
exists. To start over, restore web/public/frames from git (the frames committed
before this change are the unshifted originals) and delete the marker.

    python _research/shift_frames.py            # shift
    python _research/shift_frames.py --dry-run  # list what would move
"""

import json
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
FRAMES = ROOT / 'web' / 'public' / 'frames'
MARKER = ROOT / '_research' / 'frames_shifted.json'
FOOTAGE = (ROOT / 'web' / 'lib' / 'footage.ts').read_text(encoding='utf8')


def constant(name: str) -> float:
    match = re.search(rf'export const {name} = ([0-9.]+);', FOOTAGE)
    if not match:
        raise SystemExit(f'{name} not found in lib/footage.ts')
    return float(match.group(1))


RAMP_FROM = constant('RAMP_FROM')
RAMP_TO = constant('RAMP_TO')
SHIFT_AMOUNT = constant('SHIFT_AMOUNT')


def shift_at(frame: int) -> float:
    t = min(1.0, max(0.0, (frame - RAMP_FROM) / (RAMP_TO - RAMP_FROM)))
    return SHIFT_AMOUNT * t * t * (3 - 2 * t)


def main() -> None:
    dry = '--dry-run' in sys.argv
    if MARKER.exists() and not dry:
        raise SystemExit(f'{MARKER.name} exists: the frames have already been shifted.')

    moved = []
    for path in sorted(FRAMES.glob('frame_*.webp')):
        number = int(path.stem.split('_')[1])
        shift = shift_at(number)
        if shift <= 0:
            continue
        image = Image.open(path).convert('RGB')
        width = image.width
        pixels = round(shift * width)
        if pixels <= 0:
            continue
        moved.append((number, pixels))
        if dry:
            continue
        a = np.asarray(image)
        out = np.concatenate([a[:, pixels:], np.repeat(a[:, -1:], pixels, axis=1)], axis=1)
        # The same settings the frames were exported with (lib/mudras.ts).
        Image.fromarray(out).save(path, 'WEBP', quality=74, method=6)

    print(f'{len(moved)} frames {"would move" if dry else "moved"}; '
          f'first {moved[0] if moved else None}, last {moved[-1] if moved else None}')
    if not dry:
        MARKER.write_text(json.dumps({'from': RAMP_FROM, 'to': RAMP_TO, 'amount': SHIFT_AMOUNT}, indent=2) + '\n')


if __name__ == '__main__':
    main()
