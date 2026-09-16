"""Continuous pose model for the hastas.

The named finger states in data/hastas.py ('ext', 'fold', 'tip' ...) are
readable but they cannot be interpolated. This module expresses every pose as
numbers instead, so any two hastas can be blended and the result is still a
coherent hand.

Each digit carries four values:

  ext    0..1.2  extension. 0.15 is folded into the palm, 1.0 fully straight,
                 above 1.0 raised clear of its neighbours
  curl   0..1    how far the tip is drawn back toward the palm
  abd    degrees abduction, added to the digit's resting angle
  conv   0..1    how strongly the tip is pulled to the pose's convergence
                 point, which is how pinches and buds are formed

A pose is {digit: (ext, curl, abd, conv), ..., '_conv': (x, y)}. Blending is a
straight lerp of every number, which is why the model is worth the trouble:
tweening finger positions yields a hand genuinely mid-gesture, whereas blending
two finished outlines yields mush.

The named states survive as presets, so hastas.py stays readable and this stays
the single place the geometry lives.
"""

import math

# ------------------------------------------------------------------ geometry --

W, H = 120, 140
PALM_CENTRE = (61.0, 100.0)

FINGER_W = 13.0
THUMB_W = 15.0
CREASE_W = 3.4

# name -> (base x, base y, resting angle, length, fan offset at spread=1)
DIGITS = {
    'index':  (44.0, 76.0, -10.0, 42.0, -17.0),
    'middle': (58.0, 74.0, -3.0, 47.0, -6.0),
    'ring':   (72.0, 75.0, 7.0, 43.0, 8.0),
    'little': (83.0, 80.0, 19.0, 33.0, 20.0),
}
THUMB = (36.0, 104.0, -25.0, 45.0, 0.0)
ALL = ['thumb', 'index', 'middle', 'ring', 'little']
FINGERS = ['little', 'ring', 'middle', 'index']   # draw order, back to front
ADJACENT = [('index', 'middle'), ('middle', 'ring'), ('ring', 'little')]

TIP_MEET = (44.0, 54.0)
BUD = (56.0, 34.0)

PALM = ('M 33 86 '
        'Q 33 72 47 71 '
        'L 76 71 '
        'Q 88 72 88 85 '
        'L 89 107 '
        'Q 90 123 74 128 '
        'Q 55 132 42 124 '
        'Q 33 117 33 104 Z')

# ------------------------------------------------------------------- presets --
#                     ext   curl   abd  conv
FINGER_PRESET = {
    'ext':      (1.00, 0.00,    0, 0.0),
    'up':       (1.16, 0.00,   20, 0.0),
    'out':      (0.95, 0.00,   44, 0.0),
    'curve':    (0.90, 0.55,    0, 0.0),
    'bent':     (0.50, 0.30,    0, 0.0),
    'fold':     (0.16, 0.00,    0, 0.0),
    'hook':     (0.44, 0.85,    0, 0.0),
    'tip':      (0.85, 0.00,    0, 1.0),
    'converge': (0.90, 0.00,    0, 1.0),
}

THUMB_PRESET = {
    'ext':      (0.99, 0.00,   -2, 0.0),
    'up':       (1.04, 0.08,    4, 0.0),
    'out':      (0.76, 0.00,  -41, 0.0),
    'curve':    (0.90, 0.30,   18, 0.0),
    'across':   (0.85, 0.00,  121, 0.0),
    'fold':     (0.29, 0.00,  106, 0.0),
    'tip':      (0.90, 0.00,   26, 1.0),
    'converge': (0.95, 0.00,   18, 1.0),
}


def derive(hasta):
    """Named-state configuration -> numeric pose."""
    cfg = hasta['fingers']
    spread = float(cfg.get('spread', 0.0))
    fan = bool(cfg.get('fan', False))

    pose = {}
    for name in FINGERS:
        state = cfg[name]
        ext, curl, abd, conv = FINGER_PRESET[state]
        fan_off = DIGITS[name][4]
        # bake the hasta's spread into abduction so the pose is fully numeric
        abd = abd + spread * fan_off + (fan_off * 0.55 if fan else 0.0)
        pose[name] = (ext, curl, abd, conv)

    pose['thumb'] = THUMB_PRESET[cfg['thumb']]
    pose['_conv'] = BUD if 'converge' in cfg.values() else TIP_MEET
    return pose


def blend(a, b, t):
    """Linear blend of two poses. t=0 gives a, t=1 gives b."""
    t = max(0.0, min(1.0, t))
    out = {}
    for name in ALL:
        pa, pb = a[name], b[name]
        out[name] = tuple(pa[i] + (pb[i] - pa[i]) * t for i in range(4))
    ca, cb = a['_conv'], b['_conv']
    out['_conv'] = (ca[0] + (cb[0] - ca[0]) * t, ca[1] + (cb[1] - ca[1]) * t)
    return out


# --------------------------------------------------------------------- paths --

def _vec(deg):
    r = math.radians(deg)
    return math.sin(r), -math.cos(r)


def _unit(p, q):
    dx, dy = q[0] - p[0], q[1] - p[1]
    d = math.hypot(dx, dy) or 1.0
    return dx / d, dy / d


def _f(p):
    return f'{p[0]:.1f} {p[1]:.1f}'


def _digit_path(name, pose):
    bx, by, rest, length, _ = THUMB if name == 'thumb' else DIGITS[name]
    ext, curl, abd, conv = pose[name]
    conv_pt = pose['_conv']

    d = _vec(rest + abd)
    knuckle = (bx, by)
    base = (knuckle[0] - d[0] * 10, knuckle[1] - d[1] * 10)
    inward = _unit(knuckle, PALM_CENTRE)

    reach = length * ext
    free = (knuckle[0] + d[0] * reach, knuckle[1] + d[1] * reach)
    # curl pulls the tip back toward the palm
    curled = (free[0] + inward[0] * curl * 20, free[1] + inward[1] * curl * 20)
    tip = (curled[0] + (conv_pt[0] - curled[0]) * conv,
           curled[1] + (conv_pt[1] - curled[1]) * conv)

    # a control point on the digit's own axis keeps a straight finger straight
    ctrl = (knuckle[0] + d[0] * reach * 0.8, knuckle[1] + d[1] * reach * 0.8)
    return f'M {_f(base)} Q {_f(ctrl)} {_f(tip)}'


def _creases(pose):
    """Internal articulation, derived from the numbers so it interpolates too."""
    out = []

    for a, b in ADJACENT:
        ea, eb = pose[a][0], pose[b][0]
        ca, cb = pose[a][3], pose[b][3]
        strength = min(ea, eb)
        if strength < 0.4:
            continue
        ax, ay, ra, la, _ = DIGITS[a]
        bx, by, rb, lb, _ = DIGITS[b]
        mid = ((ax + bx) / 2, (ay + by) / 2)
        d = _vec(((ra + pose[a][2]) + (rb + pose[b][2])) / 2)
        reach = 0.42 if max(ca, cb) > 0.5 else 0.66
        run = min(la, lb) * reach * strength
        start = (mid[0] - d[0] * 6, mid[1] - d[1] * 6)
        out.append(f'M {_f(start)} L {_f((mid[0] + d[0] * run, mid[1] + d[1] * run))}')

    for name in FINGERS:
        ext = pose[name][0]
        strength = (0.45 - ext) / 0.45
        if strength <= 0.05:
            continue
        bx, by, rest, _, _ = DIGITS[name]
        knuckle = (bx, by)
        d = _vec(rest + pose[name][2])
        inward = _unit(knuckle, PALM_CENTRE)
        start = (knuckle[0] + inward[0] * 7, knuckle[1] + inward[1] * 7)
        ctrl = (start[0] + d[0] * 5, start[1] + d[1] * 5)
        run = 11 * min(1.0, strength)
        end = (start[0] + inward[0] * run, start[1] + inward[1] * run)
        out.append(f'M {_f(start)} Q {_f(ctrl)} {_f(end)}')

    return out


def body(pose, uid, palm=True):
    """Silhouette markup for a pose. `uid` must be unique per document."""
    strokes = [f'<path d="{_digit_path("thumb", pose)}" stroke-width="{THUMB_W}"/>']
    for name in FINGERS:
        strokes.append(f'<path d="{_digit_path(name, pose)}" stroke-width="{FINGER_W}"/>')

    creases = _creases(pose)
    mask = ref = ''
    if creases:
        lines = '\n      '.join(f'<path d="{c}"/>' for c in creases)
        mask = (f'<mask id="{uid}" maskUnits="userSpaceOnUse" '
                f'x="0" y="0" width="{W}" height="{H}">\n'
                f'    <rect width="{W}" height="{H}" fill="#fff"/>\n'
                f'    <g stroke="#000" stroke-width="{CREASE_W}" fill="none" '
                f'stroke-linecap="round">\n      {lines}\n    </g>\n  </mask>')
        ref = f' mask="url(#{uid})"'

    palm_path = f'<path d="{PALM}" stroke="none"/>\n    ' if palm else ''
    group = (f'<g{ref} fill="currentColor" stroke="currentColor" '
             f'stroke-linecap="round" stroke-linejoin="round">\n    '
             f'{palm_path}' + '\n    '.join(strokes) + '\n  </g>')
    return f'  {mask}\n  {group}' if mask else f'  {group}'


def svg(pose, uid, label=''):
    aria = f' role="img" aria-label="{label}"' if label else ' aria-hidden="true"'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}"'
            f'{aria}>\n{body(pose, uid)}\n</svg>')


# ------------------------------------------------------------ shape-outside --

def outline_polygon(pose, samples=26):
    """A convex-ish hull of the silhouette as CSS polygon() percentages, for
    shape-outside. polygon() is universally supported, unlike path()."""
    pts = [(33.0, 86.0), (33.0, 104.0), (42.0, 124.0), (74.0, 128.0),
           (89.0, 107.0), (88.0, 85.0)]
    for name in ['index', 'middle', 'ring', 'little', 'thumb']:
        bx, by, rest, length, _ = THUMB if name == 'thumb' else DIGITS[name]
        ext, curl, abd, conv = pose[name]
        d = _vec(rest + abd)
        reach = length * ext
        free = (bx + d[0] * reach, by + d[1] * reach)
        inward = _unit((bx, by), PALM_CENTRE)
        curled = (free[0] + inward[0] * curl * 20, free[1] + inward[1] * curl * 20)
        cp = pose['_conv']
        tip = (curled[0] + (cp[0] - curled[0]) * conv,
               curled[1] + (cp[1] - curled[1]) * conv)
        half = (THUMB_W if name == 'thumb' else FINGER_W) / 2
        pts.append((tip[0] - half, tip[1]))
        pts.append((tip[0] + half, tip[1]))

    cx = sum(p[0] for p in pts) / len(pts)
    cy = sum(p[1] for p in pts) / len(pts)
    pts.sort(key=lambda p: math.atan2(p[1] - cy, p[0] - cx))
    return 'polygon(' + ', '.join(
        f'{p[0] / W * 100:.1f}% {p[1] / H * 100:.1f}%' for p in pts) + ')'
