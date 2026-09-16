"""Static checks on the generated site.

    python _build/check.py

Verifies: tag balance, duplicate ids, internal link targets, local asset
existence, images have alt attributes, and that every page has one <h1>.
"""

import pathlib
import re
import sys
from collections import Counter
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parent.parent

VOID = {'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
        'meta', 'param', 'source', 'track', 'wbr'}

errors = []
warnings = []


class Checker(HTMLParser):
    def __init__(self, page):
        super().__init__(convert_charrefs=True)
        self.page = page
        self.stack = []
        self.ids = Counter()
        self.h1 = 0
        self.imgs_without_alt = []
        self.links = []
        self.assets = []
        self.labels = []
        self.form_ids = set()
        self.buttons_without_text = 0

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
                self.imgs_without_alt.append(self.getpos()[0])
            src = a.get('src', '')
            if src and not src.startswith(('http', 'data:')):
                self.assets.append((src, self.getpos()[0]))

        if tag in ('link', 'script') and (a.get('href') or a.get('src')):
            ref = a.get('href') or a.get('src')
            if not ref.startswith(('http', 'data:')):
                self.assets.append((ref, self.getpos()[0]))

        if tag == 'a':
            href = a.get('href', '')
            if href and not href.startswith(('http', 'mailto:', 'tel:', '#')):
                self.links.append((href, self.getpos()[0]))

        if tag == 'label' and 'for' in a:
            self.labels.append(a['for'])

        if tag in ('input', 'select', 'textarea') and 'id' in a:
            self.form_ids.add(a['id'])

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if not self.stack:
            errors.append(f'{self.page}: stray </{tag}> at line {self.getpos()[0]}')
            return
        if self.stack[-1][0] != tag:
            open_tag, line = self.stack[-1]
            errors.append(f'{self.page}: </{tag}> at line {self.getpos()[0]} closes '
                          f'<{open_tag}> opened at line {line}')
            # resync if possible
            for i in range(len(self.stack) - 1, -1, -1):
                if self.stack[i][0] == tag:
                    del self.stack[i:]
                    return
            return
        self.stack.pop()


def main():
    pages = sorted(p for p in ROOT.glob('*.html'))
    if not pages:
        print('No pages found. Run build.py first.')
        return 1

    for page in pages:
        html = page.read_text(encoding='utf-8')
        c = Checker(page.name)
        c.feed(html)
        c.close()

        for tag, line in c.stack:
            errors.append(f'{page.name}: <{tag}> opened at line {line} never closed')

        for ident, count in c.ids.items():
            if count > 1:
                errors.append(f'{page.name}: id "{ident}" used {count} times')

        if c.h1 != 1:
            warnings.append(f'{page.name}: found {c.h1} <h1> elements (expected 1)')

        for line in c.imgs_without_alt:
            errors.append(f'{page.name}: <img> without alt at line {line}')

        for href, line in c.links:
            target = href.split('#')[0].split('?')[0]
            if target and not (ROOT / target).exists():
                errors.append(f'{page.name}: broken link "{href}" at line {line}')

        for src, line in c.assets:
            if not (ROOT / src).exists():
                errors.append(f'{page.name}: missing asset "{src}" at line {line}')

        for ref in c.labels:
            if ref not in c.form_ids:
                errors.append(f'{page.name}: <label for="{ref}"> has no matching field')

        # aria-controls must point at a real id
        for ref in set(re.findall(r'aria-controls="([^"]+)"', html)):
            if ref not in c.ids:
                errors.append(f'{page.name}: aria-controls="{ref}" has no matching id')

        # aria-labelledby must point at a real id
        for ref in set(re.findall(r'aria-labelledby="([^"]+)"', html)):
            for part in ref.split():
                if part not in c.ids:
                    errors.append(f'{page.name}: aria-labelledby="{part}" has no matching id')

        if '\ufffd' in html or 'â€' in html or 'â—' in html:
            errors.append(f'{page.name}: mis-encoded characters present')

    # unreferenced images
    referenced = set()
    for page in pages:
        html = page.read_text(encoding='utf-8')
        referenced.update(re.findall(r'assets/img/([^"\')\s]+)', html))
    for img in sorted((ROOT / 'assets' / 'img').glob('*')):
        if img.name not in referenced:
            warnings.append(f'unused asset: assets/img/{img.name}')

    print(f'checked {len(pages)} pages\n')
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
