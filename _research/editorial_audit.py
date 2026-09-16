"""Editorial audit of the source site: name spellings, incomplete sentences,
transliteration inconsistencies.

    python _research/editorial_audit.py
"""

import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ROOT = pathlib.Path(__file__).resolve().parent.parent
text = (ROOT / '_research' / 'all_text.txt').read_text(encoding='utf-8')
videos = json.loads((ROOT / '_research' / 'videos.json').read_text(encoding='utf-8'))
yt = json.loads((ROOT / '_research' / 'youtube.json').read_text(encoding='utf-8'))
blob = text + '\n' + json.dumps(videos, ensure_ascii=False) + '\n' + json.dumps(yt, ensure_ascii=False)

print('SCHOOL NAME VARIANTS')
print('=' * 62)
for pat in [r'Shanti Kala Nikketan', r'Shanthi Kala Niketan', r'Shanti Ka la Nikketan',
            r'Shanti Kala Niketan', r'Shantikalanikketan', r'shantikalanikketan']:
    n = len(re.findall(pat, blob))
    if n:
        print(f'  {n:>4}x  {pat}')

print('\nPERSON NAME VARIANTS')
print('=' * 62)
for pat in [r'Sunitta Menghanaani', r'Sunita Menghanaani', r'Jhanvi', r'Jahnavi',
            r'Kirusanthini', r'Kirushantini', r'Kirushantini', r'Aparna Manu', r'Aparana']:
    n = len(re.findall(pat, blob))
    if n:
        print(f'  {n:>4}x  {pat}')

print('\nINCOMPLETE / DEFECTIVE SENTENCES IN SOURCE COPY')
print('=' * 62)
for pat, note in [
    (r'undergraduate degree at Ashoka University in,', 'sentence truncated mid-clause'),
    (r'tested for its \?', 'literal question mark left in published gloss'),
    (r"Jhanvi'sArangetram", 'missing space in gallery title'),
    (r'Add a Title', 'unedited Wix placeholder album title'),
    (r'When art becomes a part of our life\.\.\.\.', 'four-dot ellipsis'),
    (r'We insists', 'subject-verb disagreement'),
    (r'She hold Best Performer', 'subject-verb disagreement'),
    (r'Perfomance', 'misspelling (YouTube title)'),
    (r'betel nut free', '"free" should read "tree"'),
]:
    for m in re.finditer(pat, blob):
        s = max(0, m.start() - 70)
        print(f'  - {note}')
        print(f'      ...{blob[s:m.end() + 50]}...'.replace('\n', ' '))
        break

print('\nTRANSLITERATION INCONSISTENCY WITHIN THE VERSE GLOSSES')
print('=' * 62)
for pat in [r'haṃsāsyō', r'hamsāsyō', r'Haṃsāsy hasta', r'bhramērē', r'svarnē', r'kirtītō']:
    n = len(re.findall(pat, blob))
    if n:
        print(f'  {n:>4}x  {pat}')
print('\n  (expected: bhramarē, svarṇē, kīrtitō, consistent haṃs-)')
