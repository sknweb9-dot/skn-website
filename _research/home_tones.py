"""
Contrast check for the home page's section tones ("stage lighting").

Each deep tone must carry cream body text at AA (4.5:1) with headroom, cream at
75% opacity for secondary copy, and marigold as an ornament (3:1 non-text).
Each light tone must carry ink, ink-soft and ink-faint. Run after changing any
value in the TONES block of app/globals.css.

    python _research/home_tones.py
"""


def lin(c: float) -> float:
    c /= 255
    return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4


def rgb(hexv: str) -> tuple[int, int, int]:
    h = hexv.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]


def lum(hexv: str) -> float:
    r, g, b = (lin(c) for c in rgb(hexv))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def ratio(a: str, b: str) -> float:
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def over(fg: str, bg: str, alpha: float) -> str:
    f, b = rgb(fg), rgb(bg)
    return "#" + "".join(f"{round(f[i] * alpha + b[i] * (1 - alpha)):02x}" for i in range(3))


CREAM, MARIGOLD = "#fbf8f1", "#ec9a29"
INK, INK_SOFT, INK_FAINT, NILA = "#2b1e16", "#5c4a3d", "#6f5b4d", "#00627d"

DEEP = {
    "midnight": "#0a2354",
    "plum": "#2b1540",
    "oxblood": "#3d0910",
    "kumkum-deep": "#5a1310",
    "teal-deep": "#143642",
}
LIGHT = {"cream": "#fbf8f1", "silk": "#f4ebd9"}

print(f"{'tone':12} {'cream':>6} {'cream75':>8} {'marigold':>9}")
for name, bg in DEEP.items():
    c = ratio(CREAM, bg)
    c75 = ratio(over(CREAM, bg, 0.75), bg)
    m = ratio(MARIGOLD, bg)
    flag = "" if c >= 7 and c75 >= 4.5 and m >= 3 else "  <-- FAILS"
    print(f"{name:12} {c:6.2f} {c75:8.2f} {m:9.2f}{flag}")

print()
print(f"{'tone':12} {'ink':>6} {'soft':>6} {'faint':>6} {'nila':>6}")
for name, bg in LIGHT.items():
    vals = [ratio(x, bg) for x in (INK, INK_SOFT, INK_FAINT, NILA)]
    flag = "" if min(vals) >= 4.5 else "  <-- FAILS"
    print(f"{name:12} " + " ".join(f"{v:6.2f}" for v in vals) + flag)
