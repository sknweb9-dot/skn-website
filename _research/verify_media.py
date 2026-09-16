"""Report dimensions and size of everything in assets/img (no third-party deps).

    python _research/verify_media.py
"""

import pathlib
import struct
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ROOT = pathlib.Path(__file__).resolve().parent.parent
IMG = ROOT / 'assets' / 'img'
OUT = ROOT / '_research' / 'media_downloaded.txt'


def png_size(data):
    if data[:8] != b'\x89PNG\r\n\x1a\n':
        return None
    w, h = struct.unpack('>II', data[16:24])
    return w, h


def jpeg_size(data):
    if data[:2] != b'\xff\xd8':
        return None
    i = 2
    while i < len(data) - 9:
        if data[i] != 0xFF:
            i += 1
            continue
        marker = data[i + 1]
        if marker in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7,
                      0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
            h, w = struct.unpack('>HH', data[i + 5:i + 9])
            return w, h
        if marker in (0xD8, 0xD9) or 0xD0 <= marker <= 0xD7:
            i += 2
            continue
        seg = struct.unpack('>H', data[i + 2:i + 4])[0]
        i += 2 + seg
    return None


lines = []
total = 0
bad = []

for f in sorted(IMG.glob('*')):
    data = f.read_bytes()
    total += len(data)
    size = png_size(data) if f.suffix.lower() == '.png' else jpeg_size(data)
    if size:
        lines.append(f'  {f.name:26} {size[0]:>5} x {size[1]:<5} {len(data)//1024:>5} KB')
    else:
        lines.append(f'  {f.name:26} UNREADABLE HEADER      {len(data)//1024:>5} KB')
        bad.append(f.name)

header = [f'{len(lines)} files in assets/img, {total/1048576:.1f} MB total', '']
report = '\n'.join(header + lines)
if bad:
    report += f'\n\nUNREADABLE: {", ".join(bad)}'
OUT.write_text(report + '\n', encoding='utf-8')
print(report)
