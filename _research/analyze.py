import re, sys, html, pathlib

# Wix pages contain zero-width spaces and smart quotes; the Windows console
# codepage cannot encode them, which silently truncated earlier dumps.
sys.stdout.reconfigure(encoding='utf-8', errors='replace')


def load(p):
    return pathlib.Path(p).read_text(encoding='utf-8', errors='ignore')

def text_of(h):
    h = re.sub(r'(?is)<script.*?</script>', ' ', h)
    h = re.sub(r'(?is)<style.*?</style>', ' ', h)
    h = re.sub(r'(?is)<noscript.*?</noscript>', ' ', h)
    h = re.sub(r'(?s)<!--.*?-->', ' ', h)
    h = re.sub(r'(?i)<br\s*/?>', '\n', h)
    h = re.sub(r'(?i)</(p|div|li|h[1-6]|tr|section)>', '\n', h)
    h = re.sub(r'(?s)<[^>]+>', ' ', h)
    h = html.unescape(h)
    lines = [re.sub(r'[ \t\xa0]+', ' ', l).strip() for l in h.split('\n')]
    out, prev = [], None
    for l in lines:
        if l and l != prev:
            out.append(l)
            prev = l
    return '\n'.join(out)

def links(h):
    return sorted(set(re.findall(r'href="([^"#?]+)"', h)))

def imgs(h):
    s = set(re.findall(r'(?:src|data-src|href)="([^"]+?\.(?:jpe?g|png|webp|avif|gif|svg))"', h, re.I))
    s |= set(re.findall(r'"(https?://static\.wixstatic\.com/media/[^"\\ ]+)"', h))
    return sorted(s)

if __name__ == '__main__':
    mode = sys.argv[1]
    args = sys.argv[2:]

    # Optional "--out FILE": write UTF-8 directly rather than relying on the
    # shell to redirect, which mangles non-ASCII on Windows.
    out = None
    if '--out' in args:
        i = args.index('--out')
        out = pathlib.Path(args[i + 1])
        args = args[:i] + args[i + 2:]

    buf = []
    emit = buf.append if out else print

    for f in args:
        h = load(f)
        emit('=' * 100)
        emit(f'FILE: {f} len {len(h)}')
        if mode == 'text':
            emit(text_of(h))
        elif mode == 'links':
            emit('\n'.join(links(h)))
        elif mode == 'imgs':
            emit('\n'.join(imgs(h)))
        elif mode == 'meta':
            emit(str(re.findall(r'(?is)<title>(.*?)</title>', h)))
            for m in re.finditer(r'(?is)<meta[^>]+>', h):
                v = m.group(0)
                if re.search(r'description|og:|keywords|twitter:', v, re.I):
                    emit(v[:300])
            for k in ['wix', 'squarespace', 'wp-content', 'elementor', 'shopify', 'webflow']:
                emit(f'{k} {len(re.findall(k, h, re.I))}')

    if out:
        out.write_text('\n'.join(buf) + '\n', encoding='utf-8')
        print(f'wrote {out} ({out.stat().st_size} bytes, {len(args)} pages)')

