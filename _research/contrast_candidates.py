"""Measure WCAG contrast for label colours against the *composited* grounds they
actually land on, not the raw tokens.

Backgrounds in this codebase are frequently translucent (bg-paper/60, bg-silk/40,
bg-marigold/10) or oklab mixes (.glass). Measuring against the opaque token
overstates contrast, so every ground here is resolved to a concrete sRGB colour
first.

Run from repo root:  python _research/contrast_candidates.py
"""

# ---------------------------------------------------------------- colour maths


def _hex_to_rgb(h: str) -> tuple[float, float, float]:
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]


def _rgb_to_hex(rgb: tuple[float, float, float]) -> str:
    return "#" + "".join(f"{round(max(0, min(255, c))):02x}" for c in rgb)


def _srgb_to_lin(c: float) -> float:
    c /= 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def _lin_to_srgb(c: float) -> float:
    c = c * 12.92 if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055
    return c * 255.0


def luminance(hexstr: str) -> float:
    r, g, b = _hex_to_rgb(hexstr)
    return 0.2126 * _srgb_to_lin(r) + 0.7152 * _srgb_to_lin(g) + 0.0722 * _srgb_to_lin(b)


def ratio(fg: str, bg: str) -> float:
    lo, hi = sorted((luminance(fg), luminance(bg)))
    return (hi + 0.05) / (lo + 0.05)


def over(fg: str, alpha: float, bg: str) -> str:
    """Alpha-composite fg at `alpha` over opaque bg, in gamma-encoded sRGB."""
    f, b = _hex_to_rgb(fg), _hex_to_rgb(bg)
    return _rgb_to_hex(tuple(f[i] * alpha + b[i] * (1 - alpha) for i in range(3)))


# --- oklab, for CSS color-mix(in oklab, ...) which .glass uses ---------------

_M1 = (
    (0.4122214708, 0.5363325363, 0.0514459929),
    (0.2119034982, 0.6806995451, 0.1073969566),
    (0.0883024619, 0.2817188376, 0.6299787005),
)
_M2 = (
    (0.2104542553, 0.7936177850, -0.0040720468),
    (1.9779984951, -2.4285922050, 0.4505937099),
    (0.0259040371, 0.7827717662, -0.8086757660),
)


def _to_oklab(hexstr: str) -> tuple[float, float, float]:
    rgb = [_srgb_to_lin(c) for c in _hex_to_rgb(hexstr)]
    lms = [sum(_M1[i][j] * rgb[j] for j in range(3)) for i in range(3)]
    lms = [c ** (1 / 3) if c >= 0 else -((-c) ** (1 / 3)) for c in lms]
    return tuple(sum(_M2[i][j] * lms[j] for j in range(3)) for i in range(3))  # type: ignore


def _from_oklab(lab: tuple[float, float, float]) -> str:
    _M2i = (
        (1.0, 0.3963377774, 0.2158037573),
        (1.0, -0.1055613458, -0.0638541728),
        (1.0, -0.0894841775, -1.2914855480),
    )
    _M1i = (
        (4.0767416621, -3.3077115913, 0.2309699292),
        (-1.2684380046, 2.6097574011, -0.3413193965),
        (-0.0041960863, -0.7034186147, 1.7076147010),
    )
    lms = [sum(_M2i[i][j] * lab[j] for j in range(3)) for i in range(3)]
    lms = [c**3 for c in lms]
    rgb = [sum(_M1i[i][j] * lms[j] for j in range(3)) for i in range(3)]
    return _rgb_to_hex(tuple(_lin_to_srgb(c) for c in rgb))  # type: ignore


def mix_oklab(a: str, a_pct: float, b: str) -> str:
    la, lb = _to_oklab(a), _to_oklab(b)
    return _from_oklab(tuple(la[i] * a_pct + lb[i] * (1 - a_pct) for i in range(3)))  # type: ignore


# ---------------------------------------------------------------- the palette

CREAM, SILK, PAPER = "#fbf8f1", "#f4ebd9", "#fefdfa"
MARIGOLD = "#ec9a29"

SILK40_CREAM = over(SILK, 0.40, CREAM)  # <Section tinted>

GROUNDS = {
    "cream (page)": CREAM,
    "silk/40 on cream (Section tinted)": SILK40_CREAM,
    "paper/60 on cream": over(PAPER, 0.60, CREAM),
    "paper/60 on silk/40": over(PAPER, 0.60, SILK40_CREAM),
    "marigold/10 on cream (modal disc)": over(MARIGOLD, 0.10, CREAM),
    "glass (oklab white 88% + silk)": mix_oklab("#ffffff", 0.88, SILK),
    "cream/90 on silk (IG badge)": over(CREAM, 0.90, SILK),
    "silk (opaque)": SILK,
    # MobileMenu lays a radial gradient silk -> cream -> silk-deep over bg-cream.
    # silk-deep is the darkest stop and therefore the worst case for the
    # ordinal numerals sitting on it.
    "silk-deep (MobileMenu worst stop)": "#ebdfc6",
    "cream/85 (FloatingCta bar)": over(CREAM, 0.85, SILK),
}

CANDIDATES = {
    "marigold-deep (current)": "#c97d16",
    "nila-700 (on .eyebrow)": "#00627d",
    "kumkum": "#a8201a",
    "teal": "#0f4c5c",
    "teal-lit": "#1a6d82",
}

# ---------------------------------------------------------------- report

print("Resolved grounds")
print("-" * 60)
for name, hexv in GROUNDS.items():
    print(f"  {name:<36} {hexv}")

print()
NW = max(len(k) for k in CANDIDATES) + 2
print("Contrast of each candidate on each resolved ground")
print("-" * 60)
for gname, gv in GROUNDS.items():
    print(f"\n{gname}  ({gv})")
    for cname, cv in CANDIDATES.items():
        r = ratio(cv, gv)
        text = "AA" if r >= 4.5 else "fails-text"
        nontext = "ok" if r >= 3.0 else "FAILS-3:1"
        print(f"  {cname:<{NW}} {r:>6.2f}   text:{text:<11} non-text:{nontext}")

print()
print("AA normal text 4.5:1 | AA large (>=18.66px bold / 24px) 3:1 | non-text 3:1")
