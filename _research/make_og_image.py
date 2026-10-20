"""
Cut the link-preview card: the picture a chat app shows above the title when
someone pastes the site's address into a message.

    python _research/make_og_image.py

Reads:  Stuff from NAS/Final/Final/Events/Udaan/2025/General Post-01.jpg
Writes: web/public/img/og-udaan-2025.jpg   1200 x 630, progressive JPEG

WHY 1200 x 630
--------------
WhatsApp, LinkedIn, Slack and every other reader of Open Graph want a card of
about 1.91:1. The home page's hero is 3:2, so a link preview cropped it to a
letterbox and threw away the top of the frame. This card is cut to the shape
the readers actually use.

WHY A NEW FILENAME
------------------
WhatsApp caches a link preview by its image address, and for weeks. Replacing
the bytes under the old name changes nothing that has already been sent: the
reader keeps the picture it fetched. A new address is fetched afresh, so the
card is written to a name of its own, and the name says which picture it is.

THE PICTURE
------------
The academy's own poster for Udaan 2025: the class on stage with the Guru
standing among them, each holding a certificate. The poster is a tall page -
the emblem and the title above, the photograph below - and a card is a wide
strip, so the card is cut from the photograph at the foot of it. The band
starts below the calligraphy of the title, which would otherwise be sliced
across the top edge, and the sides are trimmed to the card's shape.

Needs: pillow.
"""

from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "Stuff from NAS" / "Final" / "Final" / "Events" / "Udaan" / "2025" / "General Post-01.jpg"
OUT = ROOT / "web" / "public" / "img" / "og-udaan-2025.jpg"

CARD_W, CARD_H = 1200, 630
# The photograph at the foot of the poster: from just below the title's
# calligraphy to just above the contact line.
BAND_TOP = 0.62
BAND_BOTTOM = 0.915
QUALITY = 88


def main() -> None:
    im = ImageOps.exif_transpose(Image.open(SRC)).convert("RGB")
    w, h = im.size

    band = im.crop((0, int(h * BAND_TOP), w, int(h * BAND_BOTTOM)))
    band_w, band_h = band.size

    # Trim the sides to the card's shape, keeping the middle of the class.
    if band_w / band_h > CARD_W / CARD_H:
        keep = int(band_h * (CARD_W / CARD_H))
        left = (band_w - keep) // 2
        band = band.crop((left, 0, left + keep, band_h))
    else:
        keep = int(band_w / (CARD_W / CARD_H))
        top = (band_h - keep) // 2
        band = band.crop((0, top, band_w, top + keep))

    card = band.resize((CARD_W, CARD_H), Image.LANCZOS)
    card.save(OUT, "JPEG", quality=QUALITY, progressive=True, optimize=True)
    print(f"{OUT.relative_to(ROOT)}  {card.size[0]}x{card.size[1]}  {OUT.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
