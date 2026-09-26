"""Solve the six act windows for the Hastas.mp4 gesture timings.

Why this is needed: the windows in lib/acts.ts were tuned against mudra.mp4's
gesture ordering. Hastas.mp4 has different per-gesture durations, so every
anchor's midpoint moves and the old windows no longer satisfy the load-time
validator in lib/acts.ts.

Hard constraints, all taken from lib/acts.ts:
  * windows tile [0,1] with no gap or overlap
  * an anchor sits in [0.20, 0.80] of its own window (the fully-visible hold),
    so the card is at full opacity while its gesture is on screen
  * act 1 has no fade-in and act 6 no fade-out, so each is bounded one side only
  * the arch-travel gap at each boundary is 0.1*(span_i + span_i+1) of 960 svh
    and must clear 15 svh, i.e. adjacent spans must sum to >= 0.15625

Two-stage objective. Maximising the minimum anchor margin alone produces a
lopsided result — it will shrink act 1 to its floor to buy margin for acts 2-3,
which is wrong because act 1 carries the hero heading and would flash past. So
stage one finds the best achievable margin, and stage two takes the most
balanced window set that still clears a comfortable margin floor and per-act
editorial span floors.

Usage:  python _research/solve_act_windows.py
"""

import sys

# Gesture names carry IAST diacritics; the Windows console defaults to cp1252,
# which cannot encode them.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

FPS = 6
TOTAL_FRAMES = 324
TOTAL_SVH = 960
MIN_TRAVEL_SVH = 15

TEXT_IN_END = 0.20
TEXT_OUT_START = 0.80

# Comfortable floor, chosen well above the old set's tightest anchor (0.029).
MARGIN_FLOOR = 0.05

# Per-act span floors. Act 1 carries the hero heading and act 6 the closing call
# to action, so both need room; the old set gave them 0.110 and 0.200.
SPAN_FLOOR = [0.105, 0.120, 0.090, 0.090, 0.120, 0.185]

# Gesture second-ranges from asamyuta_hastas_reference_guide.md, inclusive.
# At 6fps each second is exactly 6 frames, so boundaries land on whole frames.
SECONDS = {
    "Patāka": (0, 0),
    "Ardhacandra": (8, 9),
    "Sūcī": (24, 24),
    "Padmakōśa": (27, 28),
    "Alapadma": (36, 37),
    "Tāmracūḍa": (48, 49),
}
ORDER = ["Patāka", "Ardhacandra", "Sūcī", "Padmakōśa", "Alapadma", "Tāmracūḍa"]


def frames(name):
    s, e = SECONDS[name]
    return s * FPS + 1, (e + 1) * FPS


def anchor_mid(name):
    fs, fe = frames(name)
    return ((fs - 1) / TOTAL_FRAMES + fe / TOTAL_FRAMES) / 2


MIDS = {n: anchor_mid(n) for n in ORDER}

print("anchor midpoints on the new 324-frame sequence")
for n in ORDER:
    fs, fe = frames(n)
    print(
        f"  {n:<12} seconds {SECONDS[n][0]:>2}-{SECONDS[n][1]:<2} "
        f"frames {fs:>3}-{fe:<3} mid {MIDS[n]:.6f}"
    )
print()


def margin_of(i, t):
    """Distance from the nearest visibility bound. Negative means failing."""
    upper = 10.0 if i == 5 else TEXT_OUT_START - t
    lower = 10.0 if i == 0 else t - TEXT_IN_END
    return min(upper, lower)


def evaluate(inner):
    """inner = (b1..b5). Returns (min_margin, ts, spans) or None if invalid."""
    b = (0.0,) + tuple(inner) + (1.0,)
    spans = [b[i + 1] - b[i] for i in range(6)]
    if any(spans[i] < SPAN_FLOOR[i] - 1e-9 for i in range(6)):
        return None
    for i in range(5):
        if 0.1 * (spans[i] + spans[i + 1]) * TOTAL_SVH < MIN_TRAVEL_SVH - 1e-9:
            return None
    ts, margins = [], []
    for i, n in enumerate(ORDER):
        if not (b[i] < MIDS[n] < b[i + 1]):
            return None
        t = (MIDS[n] - b[i]) / spans[i]
        ts.append(t)
        margins.append(margin_of(i, t))
    return min(margins), ts, spans


GRID = 0.001


def next_range(i, l, M):
    """Interval for boundary b_{i+1} given b_i = l and required margin M."""
    m = MIDS[ORDER[i]]
    if l >= m:
        return None
    lo_t = None if i == 0 else TEXT_IN_END + M
    hi_t = None if i == 5 else TEXT_OUT_START - M
    r_min = l + (m - l) / hi_t if hi_t else l + SPAN_FLOOR[i]
    r_max = l + (m - l) / lo_t if lo_t else 1.0
    r_min = max(r_min, l + SPAN_FLOOR[i])
    r_max = min(r_max, 1.0 - sum(SPAN_FLOOR[i + 1:]))
    return (r_min, r_max) if r_min <= r_max else None


def search(M, objective):
    """Best window set with margin >= M, scored by `objective` (lower is better)."""
    best = None

    def rec(i, l, chosen):
        nonlocal best
        if i == 5:
            res = evaluate(tuple(chosen))
            if res and res[0] >= M - 1e-9:
                score = objective(res)
                if best is None or score < best[0]:
                    best = (score, res, tuple(chosen))
            return
        rng = next_range(i, l, M)
        if not rng:
            return
        r_min, r_max = rng
        steps = int((r_max - r_min) / GRID)
        for s in range(steps + 1):
            r = round(r_min + s * GRID, 4)
            if r <= l or r >= 1.0:
                continue
            if chosen:
                prev = chosen[-2] if len(chosen) >= 2 else 0.0
                if 0.1 * ((l - prev) + (r - l)) * TOTAL_SVH < MIN_TRAVEL_SVH - 1e-9:
                    continue
            rec(i + 1, r, chosen + [r])

    rec(0, 0.0, [])
    return best


# Stage 1: how much margin is achievable at all?
lo, hi, feasible = 0.0, 0.30, None
for _ in range(16):
    M = (lo + hi) / 2
    found = search(M, lambda res: -res[0])
    if found:
        feasible, lo = found, M
    else:
        hi = M

if not feasible:
    raise SystemExit("no valid window set found — relax SPAN_FLOOR or the anchors")

print(f"stage 1: best achievable worst-anchor margin = {lo:.4f}")

# Stage 2: among sets clearing MARGIN_FLOOR, take the most balanced spans.
target = max(MARGIN_FLOOR, min(MARGIN_FLOOR, lo))
if lo < MARGIN_FLOOR:
    print(f"  (best margin {lo:.4f} is below the {MARGIN_FLOOR} floor; using it as the target)")
    target = lo


def balance(res):
    spans = res[2]
    mean = sum(spans) / len(spans)
    return sum((s - mean) ** 2 for s in spans)


best = search(target, balance)
if not best:
    raise SystemExit("stage 2 found nothing")

_, (min_margin, ts, spans), inner = best
bounds = (0.0,) + inner + (1.0,)

print(f"stage 2: most balanced set clearing margin {target:.4f}")
print()
print(f"SOLVED — worst anchor margin {min_margin:.4f}, span spread {max(spans) - min(spans):.3f}")
print()
print("  act  window            span    anchor         t       margin")
for i, n in enumerate(ORDER):
    note = "  (no fade-in)" if i == 0 else ("  (no fade-out)" if i == 5 else "")
    print(
        f"   {i + 1}   [{bounds[i]:.3f}, {bounds[i + 1]:.3f}]  {spans[i]:.3f}   "
        f"{n:<12}  {ts[i]:.3f}   {margin_of(i, ts[i]):+.4f}{note}"
    )

print()
print("  arch travel gaps")
for i in range(5):
    gap = 0.1 * (spans[i] + spans[i + 1])
    print(f"   act {i + 1} -> {i + 2}   {gap:.4f} of scroll = {gap * TOTAL_SVH:5.1f} svh")

print()
print("  old spans for comparison: 0.110 0.180 0.195 0.145 0.170 0.200")
print(f"  new spans:                {' '.join(f'{s:.3f}' for s in spans)}")

print()
print("paste into lib/acts.ts:")
for i in range(6):
    print(f"    window: {{ start: {bounds[i]:.3f}, end: {bounds[i + 1]:.3f} }},  // {ORDER[i]}")
