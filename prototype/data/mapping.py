"""What the site needs to say, and the hasta that already says it.

Every slot names the exact viniyoga being invoked, so the choice is arguable
from the source text rather than decorative. `meaning` must appear verbatim in
that hasta's viniyoga list in hastas.py -- assert_valid() enforces it.

Note how often alapadma recurs. That is deliberate, and it is the whole idea:
one unchanging hand means a mirror in one room, praise in another, a village in
a third, and separation in a fourth. The site is built on that polysemy, not in
spite of it.
"""

import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from data.hastas import BY_KEY  # noqa: E402

# slot -> (hasta key, viniyoga invoked, why this slot)
SLOTS = {
    'opening': ('pataka', 'the beginning of a dance',
                'The gesture that opens every performance opens the site.'),
    'blessing': ('pataka', 'a blessing',
                 'Closing benediction in the footer.'),

    'about': ('alapadma', 'a mirror',
              'Looking at ourselves.'),
    'praise': ('alapadma', 'to praise',
               'What families say about us.'),
    'branches': ('alapadma', 'a village',
                 'The three places we teach.'),
    'loading': ('alapadma', 'circular movement',
                'The waiting state.'),
    'notfound': ('alapadma', 'separation',
                 'The 404 page.'),
    'bloom': ('alapadma', 'a full-bloomed lotus',
              'The academy at full flower; the gesture inside the logo.'),

    'stages': ('hamsapaksha', 'to denote the number six',
               'The six levels of the Gurukulam.'),
    'write': ('hamsapaksha', 'writing a letter with the nails',
              'Writing to us.'),

    'teaching': ('hamsasya', 'giving instruction',
                 'The lineage, and what happens in class.'),
    'gallery': ('hamsasya', 'to draw or paint on a board',
                'Photographs.'),
    'committed': ('hamsasya', 'the tying of the auspicious thread',
                  'An enquiry successfully sent -- a bond made.'),

    'offering': ('sandamsha', 'making an offering to God',
                 'The founder, and why any of this is done.'),
    'watch': ('chatura', 'the eyes',
              'Video.'),
    'sound': ('kangula', 'small bells',
              'The audio toggle.'),
    'flight': ('bhramara', 'wings',
               'Udaan -- flying high to reach our goals.'),
    'calendar': ('chandrakala', 'the crescent moon',
                 'Dates and seasons.'),
    'single': ('suchi', 'one',
               'A single thing; the first step.'),
    'three': ('trishula', 'three things together',
              'Where three things are held at once.'),
}


def hasta(slot):
    return BY_KEY[SLOTS[slot][0]]


def meaning(slot):
    return SLOTS[slot][1]


def rationale(slot):
    return SLOTS[slot][2]


def key(slot):
    return SLOTS[slot][0]


def by_hasta():
    """hasta key -> [(slot, meaning, rationale)], for the legend page."""
    out = {}
    for slot, (hk, mean, why) in SLOTS.items():
        out.setdefault(hk, []).append((slot, mean, why))
    return out


def assert_valid():
    """Every invoked meaning must exist in that hasta's viniyoga list."""
    bad = []
    for slot, (hk, mean, _) in SLOTS.items():
        h = BY_KEY.get(hk)
        if h is None:
            bad.append(f'{slot}: unknown hasta {hk!r}')
        elif mean not in h['viniyoga']:
            bad.append(f'{slot}: {hk} has no viniyoga {mean!r}')
    if bad:
        raise AssertionError('gesture mapping is not grounded in the source:\n  '
                             + '\n  '.join(bad))
    return len(SLOTS)


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    n = assert_valid()
    used = by_hasta()
    print(f'{n} slots mapped across {len(used)} gestures, all grounded\n')
    for hk, slots in sorted(used.items(), key=lambda kv: -len(kv[1])):
        h = BY_KEY[hk]
        src = 'verified' if h['source'] == 'school' else 'needs sign-off'
        print(f'{h["roman"]}  ({h["deva"]}, {src})')
        for slot, mean, _ in slots:
            print(f'    {slot:12} {mean}')
