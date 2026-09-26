"""Rewrite the frameStart/frameEnd values in web/lib/mudras.ts for Hastas.mp4.

The gesture boundaries come from asamyuta_hastas_reference_guide.md, which gives
each gesture an inclusive whole-second range. The export is 6fps over 54s (324
frames), so a gesture spanning seconds [a,b] occupies 1-indexed frames
[6a+1, 6(b+1)] exactly — no rounding, and no LABEL_GRID indirection.

Done as a script rather than 26 hand edits so the mapping is auditable and the
surrounding verse/gloss content is never retyped.

The repo's spellings are canonical where they differ from the guide
(Padmakōśa/Kāṅgūla/Sandaṃśa vs Padmakośa/Kāṅgula/Saṃdaṃśa), because
lib/acts.ts resolves anchors by exact name.

Usage:  python _research/retime_mudras.py [--check]
"""

import re
import sys
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

TARGET = Path("web/lib/mudras.ts")
FPS = 6
TOTAL = 324

# order: (repo name, first second, last second) — inclusive, from the guide.
SECONDS = [
    ("Patāka", 0, 0),
    ("Tripatāka", 1, 1),
    ("Ardhapatāka", 2, 2),
    ("Kartarīmukha", 3, 5),
    ("Mayūra", 6, 7),
    ("Ardhacandra", 8, 9),
    ("Arāla", 10, 10),
    ("Śukatuṇḍa", 11, 12),
    ("Muṣṭi", 13, 14),
    ("Śikhara", 15, 15),
    ("Kapittha", 16, 17),
    ("Kaṭakāmukha", 18, 23),
    ("Sūcī", 24, 24),
    ("Candrakalā", 25, 26),
    ("Padmakōśa", 27, 28),
    ("Sarpaśīrṣa", 29, 30),
    ("Mṛgaśīrṣa", 31, 31),
    ("Siṃhamukha", 32, 33),
    ("Kāṅgūla", 34, 35),
    ("Alapadma", 36, 37),
    ("Catura", 38, 39),
    ("Bhramara", 40, 40),
    ("Haṃsāsya", 41, 42),
    ("Haṃsapakṣa", 43, 43),
    ("Sandaṃśa", 44, 45),
    ("Mukula", 46, 47),
    ("Tāmracūḍa", 48, 49),
    ("Triśūla", 50, 53),
]


def frames(a: int, b: int) -> tuple[int, int]:
    return a * FPS + 1, (b + 1) * FPS


# Verify the schedule tiles the sequence before touching the file.
expected = 1
for name, a, b in SECONDS:
    fs, fe = frames(a, b)
    if fs != expected:
        raise SystemExit(f"gap or overlap before {name}: expected frame {expected}, got {fs}")
    expected = fe + 1
if expected - 1 != TOTAL:
    raise SystemExit(f"schedule ends at frame {expected - 1}, expected {TOTAL}")
print(f"schedule verified: 28 gestures tile frames 1..{TOTAL} with no gap or overlap")

src = TARGET.read_text(encoding="utf-8")
out = src
changed = 0

for name, a, b in SECONDS:
    fs, fe = frames(a, b)
    # Anchor on the name so each replacement is unambiguous.
    pattern = re.compile(
        r"(name: '" + re.escape(name) + r"',\n"
        r"(?:.*?\n)??"           # literal, and anything else before the frames
        r"\s*frameStart: )(\d+)(,\n\s*frameEnd: )(\d+)(,)",
        re.DOTALL,
    )
    m = pattern.search(out)
    if not m:
        raise SystemExit(f"could not locate frameStart/frameEnd for {name}")
    old = (int(m.group(2)), int(m.group(4)))
    if old != (fs, fe):
        changed += 1
    out = out[: m.start()] + f"{m.group(1)}{fs}{m.group(3)}{fe}{m.group(5)}" + out[m.end():]
    print(f"  {name:<14} seconds {a:>2}-{b:<2}  {old[0]:>3}-{old[1]:<3} -> {fs:>3}-{fe:<3}"
          f"{'' if old != (fs, fe) else '   (unchanged)'}")

print()
print(f"{changed} of {len(SECONDS)} ranges changed")

if "--check" in sys.argv:
    print("--check given, not writing")
else:
    TARGET.write_text(out, encoding="utf-8")
    print(f"wrote {TARGET}")
