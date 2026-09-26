"""Solve for an ink-faint that clears AA on every ground token, including
silk-deep, which is the darkest stop of the home page radial wash and was the
ground the previous fix (#7a6556) missed at 4.16:1.

Keeps the warm hue by scaling the existing channel ratios toward black, then
reports the first value that clears the target on the worst ground.

Run from repo root:  python _research/solve_ink_faint.py
"""


def lin(c: float) -> float:
    c /= 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def lum(rgb) -> float:
    r, g, b = rgb
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)


def ratio(fg, bg) -> float:
    a, b = sorted((lum(fg), lum(bg)))
    return (b + 0.05) / (a + 0.05)


def hexv(h):
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


def tohex(rgb):
    return "#" + "".join(f"{round(c):02x}" for c in rgb)


GROUNDS = {
    "paper #fefdfa": hexv("#fefdfa"),
    "cream #fbf8f1": hexv("#fbf8f1"),
    "silk #f4ebd9": hexv("#f4ebd9"),
    "silk-deep #ebdfc6": hexv("#ebdfc6"),
}
WORST = GROUNDS["silk-deep #ebdfc6"]

CURRENT = hexv("#7a6556")
TARGET = 4.5

print(f"current #7a6556 on silk-deep: {ratio(CURRENT, WORST):.2f}  (need {TARGET})")
print()

# Scale toward black in 1% steps, preserving the warm channel ratios.
best = None
for i in range(0, 60):
    k = 1 - i / 100
    cand = tuple(c * k for c in CURRENT)
    if ratio(cand, WORST) >= TARGET:
        best = cand
        break

print(f"first passing scale: {tohex(best)}  (darkened {round((1 - best[0] / CURRENT[0]) * 100)}%)")
print()

# Report the chosen candidate and a slightly safer neighbour on every ground.
CANDIDATES = {
    "#7a6556 (current)": hexv("#7a6556"),
    tohex(best) + " (solved)": best,
    "#6f5b4d (safer)": hexv("#6f5b4d"),
    "#5c4a3d (ink-soft, for reference)": hexv("#5c4a3d"),
}

W = max(len(k) for k in CANDIDATES) + 2
print(f"{'candidate':<{W}}" + "".join(f"{g:>20}" for g in GROUNDS))
print("-" * (W + 20 * len(GROUNDS)))
for name, rgb in CANDIDATES.items():
    row = f"{name:<{W}}"
    for g in GROUNDS.values():
        r = ratio(rgb, g)
        row += f"{r:>14.2f} {'AA' if r >= 4.5 else 'FAIL':<5}"
    print(row)
