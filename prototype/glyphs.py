"""Render each hasta as a filled silhouette.

    python prototype/glyphs.py            # write out/assets/glyphs/*.svg + sprite
    python prototype/glyphs.py --sheet    # also write a contact sheet for review

Geometry and the pose model live in pose.py; this is only the file-writing and
review layer. Silhouettes are schematic notation standing in for photography
still to be shot, and because they are generated from numbers, correcting a
gesture means editing data rather than redrawing artwork.
"""

import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import pose as P                                 # noqa: E402
from data.hastas import HASTAS                   # noqa: E402


def render(hasta, uid=None):
    p = P.derive(hasta)
    return P.svg(p, uid or f'crease-{hasta["key"]}',
                 label=f'{hasta["roman"]} hasta') + '\n'


def symbol(hasta):
    p = P.derive(hasta)
    return (f'<symbol id="hasta-{hasta["key"]}" viewBox="0 0 {P.W} {P.H}">\n'
            f'{P.body(p, f"crease-s-{hasta['key']}")}\n</symbol>')


def sprite():
    syms = '\n'.join(symbol(h) for h in HASTAS)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" '
            f'style="position:absolute;width:0;height:0;overflow:hidden" '
            f'aria-hidden="true">\n{syms}\n</svg>\n')


# ------------------------------------------------------------ contact sheet --

SHEET = '''<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8">
<title>Hasta notation - contact sheet</title>
<style>
  :root {{ --ink:#0a1a3f; --cyan:#10b0d0; --paper:#f7f4ee; }}
  * {{ box-sizing:border-box; }}
  body {{ margin:0; padding:40px; background:var(--paper); color:var(--ink);
         font:14px/1.4 ui-sans-serif,system-ui,sans-serif; }}
  h1 {{ font-size:20px; font-weight:500; margin:0 0 4px; }}
  p.note {{ margin:0 0 32px; color:#5b6b86; max-width:74ch; }}
  .grid {{ display:grid; grid-template-columns:repeat(auto-fill,minmax(170px,1fr));
          gap:18px; }}
  figure {{ margin:0; background:#fff; border:1px solid #e2dcd0; border-radius:3px;
           padding:14px 12px 12px; text-align:center; }}
  figure.school {{ border-color:var(--cyan); box-shadow:inset 0 0 0 1px var(--cyan); }}
  .art svg {{ width:92px; height:auto; display:block; margin:0 auto; }}
  .small {{ display:flex; gap:12px; justify-content:center; align-items:flex-end;
           margin-top:6px; }}
  .small svg {{ height:36px; width:auto; }}
  .small .xs svg {{ height:22px; }}
  .rev {{ background:var(--ink); color:var(--cyan); border-radius:3px;
         padding:5px 8px; display:inline-flex; }}
  .rev svg {{ height:36px; width:auto; }}
  figcaption {{ margin-top:10px; }}
  .deva {{ font-size:17px; }}
  .roman {{ font-style:italic; color:#334e7a; }}
  .gloss {{ font-size:12px; color:#6b7a94; }}
  .tag {{ display:inline-block; margin-top:6px; font-size:10px; letter-spacing:.08em;
         text-transform:uppercase; color:#8a97ad; }}
  figure.school .tag {{ color:#0a7d97; }}
</style></head><body>
<h1>Hasta notation &mdash; all 28 asamyuta</h1>
<p class="note">Filled silhouettes generated from continuous pose data. Cyan border
marks the eight gestures whose text is verified from the academy&rsquo;s own published
glosses; the rest await Sunitta&rsquo;s sign-off.</p>
<div class="grid">
{cells}
</div>
</body></html>
'''

CELL = '''<figure class="{cls}">
  <div class="art">{big}</div>
  <div class="small"><span>{mid}</span><span class="xs">{sm}</span><span class="rev">{rev}</span></div>
  <figcaption>
    <div class="deva">{deva}</div>
    <div class="roman">{roman}</div>
    <div class="gloss">{gloss}</div>
    <div class="tag">{tag}</div>
  </figcaption>
</figure>'''


def contact_sheet():
    cells = []
    for i, h in enumerate(HASTAS):
        cells.append(CELL.format(
            cls='school' if h['source'] == 'school' else 'canon',
            big=render(h, f'cs-a{i}').strip(),
            mid=render(h, f'cs-b{i}').strip(),
            sm=render(h, f'cs-c{i}').strip(),
            rev=render(h, f'cs-d{i}').strip(),
            deva=h['deva'], roman=h['roman'], gloss=h['gloss'],
            tag='verified' if h['source'] == 'school' else 'needs sign-off'))
    return SHEET.format(cells='\n'.join(cells))


def main():
    root = pathlib.Path(__file__).resolve().parent
    out = root / 'out' / 'assets' / 'glyphs'
    out.mkdir(parents=True, exist_ok=True)

    for h in HASTAS:
        (out / f'{h["key"]}.svg').write_text(render(h), encoding='utf-8')
    (out.parent / 'hasta-sprite.svg').write_text(sprite(), encoding='utf-8')
    print(f'wrote {len(HASTAS)} glyphs + sprite to {out}')

    if '--sheet' in sys.argv:
        sheet = root / 'out' / 'contact-sheet.html'
        sheet.write_text(contact_sheet(), encoding='utf-8')
        print(f'wrote {sheet}')


if __name__ == '__main__':
    main()
