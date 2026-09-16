"""The twenty-eight asamyuta (single-hand) hastas of the Abhinaya Darpana.

Each entry carries:

  key        stable slug
  roman      IAST transliteration
  deva       Devanagari
  gloss      short English name
  fingers    schematic configuration, consumed by glyphs.py
  viniyoga   list of canonical usages, English
  source     'school'    -- text published by Shanti Kala Nikketan, verified
             'canonical' -- supplied from the Abhinaya Darpana tradition,
                            NOT yet verified by Sunitta Menghanaani
  video      YouTube id where the school has published a demonstration

PROVENANCE NOTE
The eight entries marked source='school' are transcribed from the academy's own
published glosses, with their typographic errors corrected ("a betel nut free"
-> tree; a stray "?" in the Katakamukha-adjacent gloss removed) and their
romanisation normalised to IAST. The remaining twenty are supplied from the
Abhinaya Darpana tradition so the vocabulary is complete enough to design
against, and every one of them needs Sunitta's sign-off before launch. The
finger configurations throughout are schematic notation, not anatomical claims;
they stand in for the commissioned photography.

Digit states used by `fingers`:
  ext      extended straight
  curve    gently curved
  bent     bent forward at the base knuckle
  fold     folded down into the palm
  tip      tip meeting the thumb tip
  up       raised clear of the others
  out      abducted away from the palm
  across   laid across the palm
  hook     curled into a hook
  converge drawn in to a shared point above the palm
"""

# --------------------------------------------------------------- vocabulary --

HASTAS = [
    {
        'key': 'pataka', 'roman': 'patāka', 'deva': 'पताक', 'gloss': 'the flag',
        'fingers': {'thumb': 'across', 'index': 'ext', 'middle': 'ext',
                    'ring': 'ext', 'little': 'ext', 'spread': 0.0},
        'viniyoga': ['the beginning of a dance', 'a cloud', 'a forest', 'forbidding',
                     'night', 'a river', 'the world of the gods', 'a horse', 'the wind',
                     'reclining', 'moonlight', 'strong sunlight', 'a blessing',
                     'the sea', 'a wave', 'silence'],
        'source': 'canonical', 'video': None,
    },
    {
        'key': 'tripataka', 'roman': 'tripatāka', 'deva': 'त्रिपताक',
        'gloss': 'three parts of the flag',
        'fingers': {'thumb': 'across', 'index': 'ext', 'middle': 'ext',
                    'ring': 'bent', 'little': 'ext', 'spread': 0.0},
        'viniyoga': ['a crown', 'a tree', 'the vajra', 'Indra', 'a lamp', 'a flame',
                     'rising flames', 'a cheek', 'an arrow', 'turning around',
                     'marks on the forehead'],
        'source': 'canonical', 'video': None,
    },
    {
        'key': 'ardhapataka', 'roman': 'ardhapatāka', 'deva': 'अर्धपताक',
        'gloss': 'half flag',
        'fingers': {'thumb': 'across', 'index': 'ext', 'middle': 'ext',
                    'ring': 'bent', 'little': 'bent', 'spread': 0.0},
        'viniyoga': ['a sprout', 'a tender shoot', 'a leaf', 'a writing tablet',
                     'a knife', 'a banner', 'a tower', 'a horn', 'two things',
                     'either bank of a river'],
        'source': 'canonical', 'video': None,
    },
    {
        'key': 'kartarimukha', 'roman': 'kartarīmukha', 'deva': 'कर्तरीमुख',
        'gloss': 'the face of the scissors',
        'fingers': {'thumb': 'across', 'index': 'ext', 'middle': 'ext',
                    'ring': 'fold', 'little': 'fold', 'spread': 0.55},
        'viniyoga': ['the separation of a woman and a man', 'opposition',
                     'the corner of the eye', 'death', 'disagreement',
                     'falling down', 'a creeper', 'lightning'],
        'source': 'canonical', 'video': None,
    },
    {
        'key': 'mayura', 'roman': 'mayūra', 'deva': 'मयूर', 'gloss': 'the peacock',
        'fingers': {'thumb': 'tip', 'index': 'ext', 'middle': 'ext',
                    'ring': 'tip', 'little': 'ext', 'spread': 0.15},
        'viniyoga': ["a peacock's beak", 'a creeper', 'the forehead mark',
                     'wiping away tears', 'well-known things', 'argument',
                     'the parting of the hair'],
        'source': 'canonical', 'video': None,
    },
    {
        'key': 'ardhachandra', 'roman': 'ardhacandra', 'deva': 'अर्धचन्द्र',
        'gloss': 'the half moon',
        'fingers': {'thumb': 'out', 'index': 'ext', 'middle': 'ext',
                    'ring': 'ext', 'little': 'ext', 'spread': 0.0},
        'viniyoga': ['the moon on the eighth night', 'a spear', 'consecrating an image',
                     'a plate', 'the waist', 'anxiety', "one's own self", 'meditation',
                     'prayer', 'touching the limbs', 'greeting'],
        'source': 'canonical', 'video': None,
    },
    {
        'key': 'arala', 'roman': 'arāla', 'deva': 'अराल', 'gloss': 'bent',
        'fingers': {'thumb': 'curve', 'index': 'curve', 'middle': 'ext',
                    'ring': 'ext', 'little': 'ext', 'spread': 0.1},
        'viniyoga': ['drinking nectar', 'drinking poison', 'a violent wind',
                     'a benediction'],
        'source': 'canonical', 'video': None,
    },
    {
        'key': 'shukatunda', 'roman': 'śukatuṇḍa', 'deva': 'शुकतुण्ड',
        'gloss': "the parrot's beak",
        'fingers': {'thumb': 'across', 'index': 'curve', 'middle': 'ext',
                    'ring': 'bent', 'little': 'ext', 'spread': 0.1},
        'viniyoga': ['shooting an arrow', 'hurling a spear', 'a mystery',
                     'ferocity', 'recollection'],
        'source': 'canonical', 'video': None,
    },
    {
        'key': 'mushti', 'roman': 'muṣṭi', 'deva': 'मुष्टि', 'gloss': 'the fist',
        'fingers': {'thumb': 'across', 'index': 'fold', 'middle': 'fold',
                    'ring': 'fold', 'little': 'fold', 'spread': 0.0},
        'viniyoga': ['firmness', 'grasping the hair', 'holding things',
                     'wrestling', 'steadfastness'],
        'source': 'canonical', 'video': None,
    },
    {
        'key': 'shikhara', 'roman': 'śikhara', 'deva': 'शिखर', 'gloss': 'the peak',
        'fingers': {'thumb': 'up', 'index': 'fold', 'middle': 'fold',
                    'ring': 'fold', 'little': 'fold', 'spread': 0.0},
        'viniyoga': ['the god of love', 'a bow', 'a pillar', 'silence', 'a husband',
                     'a tooth', 'a question', 'saying no', 'recollection',
                     'an embrace', 'the sound of a bell'],
        'source': 'canonical', 'video': None,
    },
    {
        'key': 'kapittha', 'roman': 'kapittha', 'deva': 'कपित्थ',
        'gloss': 'the wood apple',
        'fingers': {'thumb': 'up', 'index': 'hook', 'middle': 'fold',
                    'ring': 'fold', 'little': 'fold', 'spread': 0.0},
        'viniyoga': ['Lakshmi', 'Saraswati', 'holding cymbals', 'milking a cow',
                     'gathering flowers', 'holding the end of a garment', 'collyrium'],
        'source': 'canonical', 'video': None,
    },
    {
        'key': 'katakamukha', 'roman': 'kaṭakāmukha', 'deva': 'कटकामुख',
        'gloss': 'the opening in a bracelet',
        'fingers': {'thumb': 'tip', 'index': 'tip', 'middle': 'tip',
                    'ring': 'ext', 'little': 'ext', 'spread': 0.2},
        'viniyoga': ['plucking flowers', 'holding a pearl necklace', 'drawing an arrow',
                     'speech', 'a glance', 'breaking a twig',
                     'applying sandal paste'],
        'source': 'canonical', 'video': None,
    },
    {
        'key': 'suchi', 'roman': 'sūcī', 'deva': 'सूची', 'gloss': 'the needle',
        'fingers': {'thumb': 'across', 'index': 'ext', 'middle': 'fold',
                    'ring': 'fold', 'little': 'fold', 'spread': 0.0},
        'viniyoga': ['one', 'the supreme being', 'a hundred', 'the sun', 'a city',
                     'the world', 'saying "thus"', 'to threaten', 'beating a drum',
                     'thinness', 'a rod', 'an umbrella', 'raising up',
                     '"who is this?"', 'evening'],
        'source': 'canonical', 'video': None,
    },
    {
        'key': 'chandrakala', 'roman': 'candrakalā', 'deva': 'चन्द्रकला',
        'gloss': 'the digit of the moon',
        'fingers': {'thumb': 'out', 'index': 'ext', 'middle': 'fold',
                    'ring': 'fold', 'little': 'fold', 'spread': 0.0},
        'viniyoga': ["the crescent moon", 'the face', "Shiva's crest", 'a river',
                     'measuring a length'],
        'source': 'canonical', 'video': None,
    },
    {
        'key': 'padmakosha', 'roman': 'padmakośa', 'deva': 'पद्मकोश',
        'gloss': 'the lotus bud',
        'fingers': {'thumb': 'curve', 'index': 'curve', 'middle': 'curve',
                    'ring': 'curve', 'little': 'curve', 'spread': 0.5},
        'viniyoga': ['a fruit', 'a breast', 'a bunch of flowers', 'an egg', 'a bell',
                     'a lotus bud', 'a round temple', 'offering food to a deity'],
        'source': 'canonical', 'video': None,
    },
    {
        'key': 'sarpashirsha', 'roman': 'sarpaśīrṣa', 'deva': 'सर्पशीर्ष',
        'gloss': "the snake's head",
        'fingers': {'thumb': 'across', 'index': 'curve', 'middle': 'curve',
                    'ring': 'curve', 'little': 'curve', 'spread': 0.0},
        'viniyoga': ['sandal paste', 'a snake', 'slow movement', 'sprinkling water',
                     'offering water to the gods', 'nourishing',
                     "a wrestler's arms", "an elephant's cheek"],
        'source': 'canonical', 'video': None,
    },
    {
        'key': 'mrigashirsha', 'roman': 'mṛgaśīrṣa', 'deva': 'मृगशीर्ष',
        'gloss': "the deer's head",
        'fingers': {'thumb': 'up', 'index': 'bent', 'middle': 'bent',
                    'ring': 'bent', 'little': 'up', 'spread': 0.0},
        'viniyoga': ['women', 'the cheek', 'a limit', 'ointment', 'fear',
                     'discussion', 'a place for sleeping', 'arranging the hair',
                     'the three qualities', 'calling a lady'],
        'source': 'canonical', 'video': None,
    },
    {
        'key': 'simhamukha', 'roman': 'siṃhamukha', 'deva': 'सिंहमुख',
        'gloss': "the lion's face",
        'fingers': {'thumb': 'tip', 'index': 'ext', 'middle': 'tip',
                    'ring': 'tip', 'little': 'ext', 'spread': 0.3},
        'viniyoga': ["a lion's face", 'a hare', 'an elephant', 'the sacrificial fire',
                     'coral', 'a pearl', 'a garland', 'a lotus', 'wiping tears',
                     'purity', 'sacred grass', 'medicine'],
        'source': 'canonical', 'video': None,
    },

    # ---------------------------------------------------------------------
    # From here down, the viniyoga text is the academy's own, verified.
    # ---------------------------------------------------------------------
    {
        'key': 'kangula', 'roman': 'kaṅgūla', 'deva': 'कङ्गूल', 'gloss': 'the tail',
        'fingers': {'thumb': 'across', 'index': 'ext', 'middle': 'ext',
                    'ring': 'fold', 'little': 'ext', 'spread': 0.2},
        'viniyoga': ['the lakuca fruit', 'small bells', 'a huge bell',
                     'the cakora bird', 'a betel nut tree', 'the breast of a youngster',
                     'a white water lily', 'the cātaka bird', 'a coconut'],
        'source': 'school', 'video': 'Key6fbXDNc0',
    },
    {
        'key': 'alapadma', 'roman': 'alapadma', 'deva': 'अलपद्म',
        'gloss': 'the full-bloomed lotus',
        'fingers': {'thumb': 'ext', 'index': 'ext', 'middle': 'ext',
                    'ring': 'ext', 'little': 'ext', 'spread': 1.0, 'fan': True},
        'viniyoga': ['a full-bloomed lotus', 'a wood apple', 'circular movement',
                     'a breast', 'separation', 'a mirror', 'the full moon', 'beauty',
                     'a hair knot', 'the moon tower', 'a village', 'extreme anger',
                     'a lake', 'a cart', 'the cakravāka bird',
                     'chattering unnecessarily', 'to praise'],
        'source': 'school', 'video': 'qn37NYFdRe0',
    },
    {
        'key': 'chatura', 'roman': 'catura', 'deva': 'चतुर', 'gloss': 'the square',
        'fingers': {'thumb': 'across', 'index': 'ext', 'middle': 'ext',
                    'ring': 'ext', 'little': 'out', 'spread': 0.0},
        'viniyoga': ['musk', 'a little', 'gold', 'copper', 'iron', 'wet', 'sorrow',
                     'enjoying taste', 'the eyes', 'different colours', 'a promise',
                     'sweetness', 'a slow walk', 'breaking into pieces', 'the face',
                     'ghee and oil'],
        'source': 'school', 'video': 'hOL47OYH_ec',
    },
    {
        'key': 'bhramara', 'roman': 'bhramara', 'deva': 'भ्रमर', 'gloss': 'the bee',
        'fingers': {'thumb': 'tip', 'index': 'bent', 'middle': 'tip',
                    'ring': 'ext', 'little': 'ext', 'spread': 0.25},
        'viniyoga': ['a bee', 'a parrot', 'wings', 'a crane', 'the cuckoo'],
        'source': 'school', 'video': 'jh3ML6T2RRk',
    },
    {
        'key': 'hamsasya', 'roman': 'haṃsāsya', 'deva': 'हंसास्य',
        'gloss': "the swan's face",
        'fingers': {'thumb': 'tip', 'index': 'tip', 'middle': 'tip',
                    'ring': 'ext', 'little': 'ext', 'spread': 0.25},
        'viniyoga': ['the tying of the auspicious thread', 'giving instruction',
                     'certainty', 'horripilation', 'a necklace of pearls',
                     'sharpening the tip of a wick', 'the touchstone',
                     'a jasmine flower', 'to draw or paint on a board', 'to bite',
                     'a bridge', 'the stoppage of water'],
        'source': 'school', 'video': '_dBDwVF8Jiw',
    },
    {
        'key': 'hamsapaksha', 'roman': 'haṃsapakṣa', 'deva': 'हंसपक्ष',
        'gloss': "the swan's wing",
        'fingers': {'thumb': 'across', 'index': 'ext', 'middle': 'ext',
                    'ring': 'ext', 'little': 'up', 'spread': 0.0},
        'viniyoga': ['to denote the number six', 'the construction of a bridge',
                     'putting nail marks on a leaf', 'writing a letter with the nails',
                     'to cover'],
        'source': 'school', 'video': 'I6bHj5fGtiA',
    },
    {
        'key': 'sandamsha', 'roman': 'sandaṃśa', 'deva': 'सन्दंश',
        'gloss': 'the pincers',
        'fingers': {'thumb': 'tip', 'index': 'tip', 'middle': 'ext',
                    'ring': 'ext', 'little': 'ext', 'spread': 0.15},
        'viniyoga': ['the belly', 'making an offering to God', 'a wound', 'a worm',
                     'great fear', 'to worship', 'to denote the number five'],
        'source': 'school', 'video': 'e39ivEbqBcA',
    },
    {
        'key': 'mukula', 'roman': 'mukula', 'deva': 'मुकुल', 'gloss': 'the bud',
        'fingers': {'thumb': 'converge', 'index': 'converge', 'middle': 'converge',
                    'ring': 'converge', 'little': 'converge', 'spread': 0.0},
        'viniyoga': ['a water lily', 'to eat', 'the five arrows of Manmatha',
                     'placing religious marks', 'the navel', 'a plantain flower'],
        'source': 'school', 'video': 'LRYJZI7M1bM',
    },
    {
        'key': 'tamrachuda', 'roman': 'tāmracūḍa', 'deva': 'ताम्रचूड',
        'gloss': 'the rooster',
        'fingers': {'thumb': 'out', 'index': 'hook', 'middle': 'fold',
                    'ring': 'fold', 'little': 'fold', 'spread': 0.0},
        'viniyoga': ['a cock', 'a crane', 'a camel', 'a calf', 'writing',
                     'reading', 'ringing a bell'],
        'source': 'canonical', 'video': None,
    },
    {
        'key': 'trishula', 'roman': 'triśūla', 'deva': 'त्रिशूल',
        'gloss': 'the trident',
        'fingers': {'thumb': 'fold', 'index': 'ext', 'middle': 'ext',
                    'ring': 'ext', 'little': 'fold', 'spread': 0.45},
        'viniyoga': ['a trident', 'a bel leaf', 'the three worlds',
                     'three things together'],
        'source': 'canonical', 'video': None,
    },
]

BY_KEY = {h['key']: h for h in HASTAS}

# The two tala lessons the academy has published. Not hastas, but part of the
# same archive and the source of the site's timing system.
TALAM = [
    {'video': '0d-RijftnT4', 'title': 'Talam', 'note': 'Basic Lesson', 'seconds': 96},
    {'video': '7MNqijCnO6E', 'title': 'Talam — Ta dhi tom num', 'note': None,
     'seconds': 97},
]


def verified():
    return [h for h in HASTAS if h['source'] == 'school']


def needs_signoff():
    return [h for h in HASTAS if h['source'] != 'school']
