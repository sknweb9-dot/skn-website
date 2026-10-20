"""
Cut the link-preview card: the picture a chat app shows above the title when
someone pastes the site's address into a message.

    python _research/make_og_image.py

Reads:  Stuff from NAS/Final/Final/Events/Udaan/2025/_DSC3988.JPG
Writes: web/public/img/og-home.jpg   1200 x 630, progressive JPEG

WHY 1200 x 630
--------------
WhatsApp, LinkedIn, Slack and every other reader of Open Graph want a card of
about 1.91:1. The home page's hero is 3:2, so a link preview cropped it to a
letterbox and threw away the top of the frame, where the dancers are. This
card is cut to the shape the readers actually use.

WHY A NEW FILENAME
------------------
WhatsApp caches a link preview by its image address, and for weeks. Replacing
the bytes under the old name changes nothing that has already been sent: the
reader keeps the picture it fetched. A new address is fetched afresh, so the
card is written to a name of its own.

THE PICTURE
------------
A dancer mid-lean at the academy's own Udaan 2025 showcase, at the Kalakshetra
Foundation: the one frame from the archive with a single clear subject and
somewhere for the eye to rest. The crop keeps the raised arm at the top left
and the second dancer at the right.

Needs: pillow.
"""

from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "Stuff from NAS" / "Final" / "Final" / "Events" / "Udaan" / "2025" / "_DSC3988.JPG"
OUT = ROOT / "web" / "public" / "img" / "og-home.jpg"

CARD_W, CARD_H = 1200, 630
# Where the frame sits vertically: 0 is the top edge, 1 the bottom. 0.42 keeps
# the raised arm in and the feet just in.
FOCUS_Y = 0.42
QUALITY = 88


def main() -> None:
    im = ImageOps.exif_transpose(Image.open(SRC)).convert("RGB")

    # Cut to the card's shape first, then scale: cutting at full size keeps the
    # grain out of the resample.
    target = CARD_W / CARD_H
    band = int(im.width / target)
    if band > im.height:
        band = im.height
    top = int((im.height - band) * FOCUS_Y)
    card = im.crop((0, top, im.width, top + band)).resize((CARD_W, CARD_H), Image.LANCZOS)

    card.save(OUT, "JPEG", quality=QUALITY, progressive=True, optimize=True)
    print(f"{OUT.relative_to(ROOT)}  {card.size[0]}x{card.size[1]}  {OUT.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
