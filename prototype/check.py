"""Static checks on the generated prototype.

    python prototype/check.py

Verifies internal links and assets resolve, every img has alt text, each page
has exactly one h1, form fields have labels, and aria references point at real
ids. Exits non-zero on error.
"""

import pathlib
import re
import sys
from collections import Counter
from html.parser import HTMLParser

OUT = pathlib.Path(__file__).resolve().parent / 'out'
VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
        'meta', 'param', 'source', 'track', 'wbr'}

errors, warnings = [], []


class Check(HTMLParser):
    def __init__(self, page):
        super().__init__(convert_charrefs=True)
        self.page = page
        self.stack, self.ids = [], Counter()
        self.h1 = 0
        self.no_alt, self.links, self.assets = [], [], []
        self.labels, self.fields = [], set()

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag not in VOID:
            self.stack.append((tag, self.getpos()[0]))
        if 'id' in a:
            self.ids[a['id']] += 1
        if tag == 'h1':
            self.h1 += 1
        if tag == 'img':
            if 'alt' not in a:
                self.no_alt.append(self.getpos()[0])
            if a.get('src', '') and not a['src'].startswith(('http', 'data:')):
                self.assets.append((a['src'], self.getpos()[0]))
        if tag in ('link', 'script'):
            ref = a.get('href') or a.get('src')
            if ref and not ref.startswith(('http', 'data:')):
                self.assets.append((ref, self.getpos()[0]))
        if tag == 'a':
            href = a.get('href', '')
            if href and not href.startswith(('http', 'mailto:', 'tel:', '#')):
                self.links.append((href, self.getpos()[0]))
        if tag == 'label' and 'for' in a:
            self.labels.append(a['for'])
        if tag in ('input', 'select', 'textarea') and 'id' in a:
            self.fields.add(a['id'])

    def handle_endtag(self, tag):
        if tag in VOID or not self.stack:
            return
        if self.stack[-1][0] != tag:
            open_tag, line = self.stack[-1]
            errors.append(f'{self.page}: </{tag}> at line {self.getpos()[0]} '
                          f'closes <{open_tag}> opened at line {line}')
            for i in range(len(self.stack) - 1, -1, -1):
                if self.stack[i][0] == tag:
                    del self.stack[i:]
                    return
            return
        self.stack.pop()


def main():
    pages = sorted(OUT.glob('*.html'))
    pages = [p for p in pages if p.name not in ('contact-sheet.html', 'morph-test.html')]
    if not pages:
        print('nothing built; run site.py first')
        return 1

    for p in pages:
        src = p.read_text(encoding='utf-8')
        c = Check(p.name)
        c.feed(src)
        c.close()

        for tag, line in c.stack:
            errors.append(f'{p.name}: <{tag}> at line {line} never closed')
        for ident, n in c.ids.items():
            if n > 1:
                errors.append(f'{p.name}: duplicate id "{ident}" ({n}x)')
        if c.h1 != 1:
            errors.append(f'{p.name}: {c.h1} <h1> elements (expected 1)')
        for line in c.no_alt:
            errors.append(f'{p.name}: <img> without alt at line {line}')
        for href, line in c.links:
            target = href.split('#')[0].split('?')[0]
            if target and not (OUT / target).exists():
                errors.append(f'{p.name}: dead link "{href}" at line {line}')
        for ref, line in c.assets:
            if not (OUT / ref).exists():
                errors.append(f'{p.name}: missing asset "{ref}" at line {line}')
        for ref in c.labels:
            if ref not in c.fields:
                errors.append(f'{p.name}: <label for="{ref}"> matches no field')
        for attr in ('aria-controls', 'aria-labelledby'):
            for ref in set(re.findall(attr + r'="([^"]+)"', src)):
                for part in ref.split():
                    if part not in c.ids:
                        errors.append(f'{p.name}: {attr}="{part}" has no such id')
        if '\ufffd' in src or 'â€' in src:
            errors.append(f'{p.name}: mis-encoded characters')
        if 'lang="sa"' not in src and p.name not in ('404.html',):
            warnings.append(f'{p.name}: no lang="sa" on Sanskrit text')

    print(f'checked {len(pages)} pages')
    for w in warnings:
        print(f'  WARN  {w}')
    for e in errors:
        print(f'  ERROR {e}')
    if errors:
        print(f'\n{len(errors)} error(s), {len(warnings)} warning(s)')
        return 1
    print(f'\nno errors ({len(warnings)} warning(s))')
    return 0


if __name__ == '__main__':
    sys.exit(main())
