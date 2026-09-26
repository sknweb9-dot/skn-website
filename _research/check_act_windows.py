"""
Check where each act's anchor gesture falls inside its act window, and how much
scroll the arch gets to travel between acts.

The copy fade ramps are narrow and pulled away from the window edges (see
lib/acts.ts): text is fully in from t=0.20 and starts leaving at t=0.80, gone by
t=0.90. So an anchor gesture must sit inside [0.20, 0.80] of its own window to be
on screen while its card is at full opacity. Act 1 never fades in and act 6 never
fades out, so those two may sit outside on the open side.

The empty interval either side of each boundary is where the arch moves. It is
reported below in svh so the travel does not become imperceptibly short.

Run this after changing any window, anchor, or fade constant.
"""

import math

FRAME_COUNT = 324
TOTAL_SVH = 960  # 6 acts x ACT_SPAN_SVH in components/ScrollStage.tsx

# name: (frameStart, frameEnd) on the live 324-frame sequence, from lib/mudras.ts.
# These are real frame numbers now — the old 218-frame LABEL_GRID indirection was
# removed when the source became Hastas.mp4, whose gesture boundaries all fall on
# whole seconds and therefore on exact multiples of 6 at the 6fps extraction.
ANCHORS = {
    "Pataka": (1, 6),
    "Ardhacandra": (49, 60),
    "Suci": (145, 150),
    "Padmakosa": (163, 174),
    "Alapadma": (217, 228),
    "Tamracuda": (289, 300),
}

# (window_start, window_end, anchor name)
WINDOWS = [
    (0.000, 0.109, "Pataka"),
    (0.109, 0.338, "Ardhacandra"),
    (0.338, 0.492, "Suci"),
    (0.492, 0.596, "Padmakosa"),
    (0.596, 0.798, "Alapadma"),
    (0.798, 1.000, "Tamracuda"),
]

TEXT_IN_START, TEXT_IN_END = 0.10, 0.20
TEXT_OUT_START, TEXT_OUT_END = 0.80, 0.90


def smoothstep(v: float) -> float:
    t = min(1.0, max(0.0, v))
    return t * t * (3 - 2 * t)


ok = True
total = 0.0

print("ANCHOR VISIBILITY")
for i, (start, end, anchor) in enumerate(WINDOWS):
    first, last = i == 0, i == len(WINDOWS) - 1
    fs, fe = ANCHORS[anchor]
    mid = ((fs - 1) / FRAME_COUNT + fe / FRAME_COUNT) / 2
    span = end - start
    total += span
    t = (mid - start) / span

    rising = 1.0 if first else smoothstep((t - TEXT_IN_START) / (TEXT_IN_END - TEXT_IN_START))
    falling = 1.0 if last else smoothstep((TEXT_OUT_END - t) / (TEXT_OUT_END - TEXT_OUT_START))
    alpha = min(rising, falling)

    flag = "OK  " if alpha > 0.999 else "FAIL"
    if alpha <= 0.999:
        ok = False
    print(
        f"  {flag} act {i + 1}  window [{start:.3f},{end:.3f}] span {span:.3f}  "
        f"{anchor:<12} t {t:.3f}  alpha {alpha:.3f}"
    )

print(f"\n  windows sum to {total:.4f} (must be 1.0)")

print("\nARCH TRAVEL GAPS")
for i in range(len(WINDOWS) - 1):
    s1, e1, _ = WINDOWS[i]
    s2, e2, _ = WINDOWS[i + 1]
    boundary = e1
    gap_start = boundary - (1 - TEXT_OUT_END) * (e1 - s1)
    gap_end = boundary + TEXT_IN_START * (e2 - s2)
    gap = gap_end - gap_start
    svh = gap * TOTAL_SVH
    flag = "OK  " if svh >= 15 else "THIN"
    if svh < 15:
        ok = False
    print(f"  {flag} act {i + 1} -> {i + 2}  gap {gap:.4f} of scroll  = {svh:.1f} svh")

print("\n" + ("all checks passed" if ok else "SOME CHECKS FAILED"))
