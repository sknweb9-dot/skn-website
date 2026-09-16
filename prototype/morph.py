"""Morph test: blend between hastas and look at the intermediate frames.

    python prototype/morph.py

Writes prototype/out/morph-test.html. The pairs chosen are the ones most likely
to break: fists have nothing protruding, buds and pinches collapse every tip to
one point, and a wide fan has to close all the way down.
"""

import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import pose as P                                  # noqa: E402
from data.hastas import BY_KEY                    # noqa: E402

PAIRS = [
    ('mukula', 'alapadma', 'bud closed to full fan — every tip travels'),
    ('mushti', 'suchi', 'fist to a single raised finger — nothing to something'),
    ('hamsasya', 'pataka', 'three-finger pinch releasing to a flat flag'),
    ('shikhara', 'alapadma', 'closed fist with raised thumb to full bloom'),
    ('katakamukha', 'trishula', 'pinch to a wide three-pronged spread'),
    ('padmakosha', 'mukula', 'cupped bud tightening to a closed bud'),
]
STEPS = 7

PAGE = '''<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>Hasta morph test</title>
<style>
  :root {{ --ink:#0a1a3f; --cyan:#10b0d0; --paper:#f7f4ee; }}
  body {{ margin:0; padding:40px; background:var(--paper); color:var(--ink);
         font:14px/1.5 ui-sans-serif,system-ui,sans-serif; }}
  h1 {{ font-size:20px; font-weight:500; margin:0 0 4px; }}
  p.note {{ margin:0 0 28px; color:#5b6b86; max-width:74ch; }}
  section {{ margin-bottom:30px; padding-bottom:22px; border-bottom:1px solid #ddd4c2; }}
  h2 {{ font-size:15px; font-weight:600; margin:0 0 2px; }}
  h2 em {{ font-weight:400; color:#5b6b86; font-style:normal; }}
  .strip {{ display:flex; gap:6px; align-items:flex-end; margin-top:14px;
           background:var(--ink); padding:14px; border-radius:3px; }}
  .frame {{ flex:1; text-align:center; color:var(--cyan); }}
  .frame.end {{ color:#fff; }}
  .frame svg {{ width:100%; height:auto; }}
  .t {{ font-size:10px; color:#7f93b5; margin-top:5px; font-variant-numeric:tabular-nums; }}
  .frame.end .t {{ color:#cfe6f2; }}
  .sm {{ display:flex; gap:6px; margin-top:8px; align-items:flex-end; }}
  .sm .frame {{ color:var(--ink); }}
  .sm .frame svg {{ height:30px; width:auto; }}
</style></head><body>
<h1>Hasta morph test</h1>
<p class="note">Seven frames per transition, blended by interpolating finger
extension, curl, abduction and convergence &mdash; not by blending outlines. The
question for each strip is whether the middle frames look like a hand caught
mid-gesture or like something that could not exist. Small row underneath checks
the same frames at interface size.</p>
{sections}
</body></html>
'''


def strip(a_key, b_key, note, idx):
    a, b = P.derive(BY_KEY[a_key]), P.derive(BY_KEY[b_key])
    big, small = [], []
    for i in range(STEPS):
        t = i / (STEPS - 1)
        p = P.blend(a, b, t)
        end = ' end' if i in (0, STEPS - 1) else ''
        big.append(f'<div class="frame{end}">{P.svg(p, f"mf{idx}-{i}")}'
                   f'<div class="t">{t:.2f}</div></div>')
        small.append(f'<div class="frame">{P.svg(p, f"ms{idx}-{i}")}</div>')
    ha, hb = BY_KEY[a_key], BY_KEY[b_key]
    return (f'<section>\n<h2>{ha["roman"]} &rarr; {hb["roman"]} '
            f'<em>&mdash; {note}</em></h2>\n'
            f'<div class="strip">{"".join(big)}</div>\n'
            f'<div class="sm">{"".join(small)}</div>\n</section>')


def main():
    out = pathlib.Path(__file__).resolve().parent / 'out'
    out.mkdir(parents=True, exist_ok=True)
    sections = '\n'.join(strip(a, b, n, i) for i, (a, b, n) in enumerate(PAIRS))
    (out / 'morph-test.html').write_text(PAGE.format(sections=sections),
                                         encoding='utf-8')
    print(f'wrote {out / "morph-test.html"}  ({len(PAIRS)} transitions)')


if __name__ == '__main__':
    main()
