"""Structural analysis of the hasta viniyoga corpus in videos.json.

    python _research/lexicon_analysis.py

Answers: how many gestures, how many meanings each, how many meanings recur
across gestures. Determines whether a reverse (meaning -> gesture) index has
enough density to be worth building.
"""

import collections
import json
import pathlib
import re
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

ROOT = pathlib.Path(__file__).resolve().parent.parent
V = json.loads((ROOT / '_research' / 'videos.json').read_text(encoding='utf-8'))

STOP = {'a', 'an', 'the', 'to', 'of', 'or', 'in', 'on', 'and', 'for', 'is', 'are',
        'as', 'with', 'denote', 'uses', 'usages', 'hasta', 'according', 'bharata',
        'said', 'kind', 'etc', 'number', 'its', 'which', 'olden', 'days', 'this',
        'particular', 'place', 'be', 'it', 'by'}

gestures = []

for v in V:
    desc = v.get('description') or ''
    # the gloss lines are "term - english meaning"; the verse lines have no dash
    glosses = []
    for line in desc.split('\n'):
        line = line.strip()
        if not line or ' - ' not in line:
            continue
        term, meaning = line.split(' - ', 1)
        term, meaning = term.strip(), meaning.strip()
        # the closing line restates the whole verse, not a single meaning
        if len(term.split()) > 4:
            continue
        glosses.append((term, meaning))
    if glosses:
        gestures.append({'title': v['title'], 'id': v['id'], 'glosses': glosses})

print(f'{len(gestures)} gesture entries with glosses '
      f'(of {len(V)} videos total)\n')

total = 0
for g in gestures:
    total += len(g['glosses'])
    print(f'  {len(g["glosses"]):>3} meanings   {g["title"]}')
print(f'\n  {total:>3} meanings total')

# --- exact-ish recurrence across gestures --------------------------------
by_word = collections.defaultdict(set)
for g in gestures:
    short = g['title'].split(' Hasta')[0]
    for term, meaning in g['glosses']:
        for w in re.findall(r"[a-z']+", meaning.lower()):
            if w in STOP or len(w) < 3:
                continue
            by_word[w].add(short)

shared = {w: gs for w, gs in by_word.items() if len(gs) > 1}
print(f'\n\nMEANING WORDS APPEARING IN MORE THAN ONE GESTURE ({len(shared)})')
print('=' * 70)
for w, gs in sorted(shared.items(), key=lambda kv: (-len(kv[1]), kv[0])):
    print(f'  {w:16} {len(gs)}x  {", ".join(sorted(gs))}')

# --- thematic clustering ------------------------------------------------
THEMES = {
    'birds': ['parrot', 'crane', 'cuckoo', 'cakravaka', 'cakora', 'cataka', 'bird', 'swan'],
    'botanical': ['lily', 'lotus', 'flower', 'jasmine', 'plantain', 'coconut',
                  'fruit', 'betel', 'wood apple', 'lakuca'],
    'celestial': ['moon'],
    'water': ['lake', 'water', 'bridge'],
    'body': ['navel', 'belly', 'breast', 'eyes', 'face', 'hair'],
    'emotion': ['fear', 'sorrow', 'separation', 'anger', 'horripillation', 'sweetness'],
    'ritual': ['god', 'worship', 'religious', 'mangalsutra', 'auspicious', 'offering'],
    'materials': ['gold', 'copper', 'iron', 'musk', 'pearl', 'ghee', 'oil'],
    'numbers': ['five', 'six'],
    'objects': ['mirror', 'cart', 'bell', 'wick', 'necklace', 'stone', 'board'],
}
print('\n\nTHEMATIC CLUSTERS (candidate reverse-index categories)')
print('=' * 70)
for theme, keys in THEMES.items():
    hits = []
    for g in gestures:
        short = g['title'].split(' Hasta')[0]
        for term, meaning in g['glosses']:
            if any(k in meaning.lower() for k in keys):
                hits.append((short, meaning))
    gs = sorted({h[0] for h in hits})
    print(f'\n  {theme.upper()}  -  {len(hits)} meanings across {len(gs)} gestures')
    print(f'     {", ".join(gs)}')
