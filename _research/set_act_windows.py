"""
Rewrite the six `window: window(n)` calls in lib/acts.ts to explicit, tuned
windows. Values come from _research/check_act_windows.py.
"""

from pathlib import Path

path = Path(r"C:\Projects\Shantikalaniketan\web\lib\acts.ts")
text = path.read_text(encoding="utf-8")

windows = [
    (0.000, 0.110),
    (0.110, 0.290),
    (0.290, 0.485),
    (0.485, 0.630),
    (0.630, 0.800),
    (0.800, 1.000),
]

for i, (start, end) in enumerate(windows, start=1):
    old = f"window: window({i}),"
    new = f"window: {{ start: {start:.3f}, end: {end:.3f} }},"
    if old not in text:
        raise SystemExit(f"could not find {old!r}")
    text = text.replace(old, new, 1)

path.write_text(text, encoding="utf-8")
print("rewrote 6 act windows")
