"""
Cut the gallery's images and write the data file that lists them.

    python _research/make_gallery_assets.py

Reads  _research/gallery_picks.json  (the curated event photographs; produced by
curate_gallery.py and then looked at by a person) and every photograph in the
class folders of the academy's archive, and writes:

    web/public/img/gallery/<key>.jpg    full size, long edge 1400, progressive
    web/public/img/globe/<key>.webp     globe plate, long edge 512
    web/lib/gallery.data.ts             what the site imports

The archive is not in the repo (`Stuff from NAS/Final/Final/`). Albums, dates and
batch labels are NOT written here: they live in web/lib/gallery.ts, where a
person can read and correct them. This file only knows which image belongs to
which album id, its shape, and whether it is on the globe.

Every class photograph goes in the gallery, so a parent can find their child;
only the curated ones (and eight chosen class pictures) are plates on the globe.

Needs: pillow.
"""

import json
import re
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "Stuff from NAS" / "Final" / "Final"
PICKS = ROOT / "_research" / "gallery_picks.json"
GALLERY_DIR = ROOT / "web" / "public" / "img" / "gallery"
GLOBE_DIR = ROOT / "web" / "public" / "img" / "globe"
DATA = ROOT / "web" / "lib" / "gallery.data.ts"

FULL_EDGE = 1400
PLATE_EDGE = 512

# archive folder -> album id (the id web/lib/gallery.ts uses)
EVENT_ALBUMS = {
    "Events/Udaan/2025": "udaan-2025",
    "Events/Udaan/2023": "udaan-2023",
    "Events/Arangetrams/Aparna Manu 2018": "arangetram-aparna",
    "Events/Arangetrams/Kirusanthini 2024": "arangetram-kirusanthini",
    "Events/Arangetrams/Jahnavi 2025": "arangetram-jahnavi",
    "Events/Sunitta/First Solo 26th Oct 2013": "sunitta-first-solo",
    "Events/Sunitta/Second Solo Feb 2015": "sunitta-second-solo",
    "Events/Sunitta/December Festival 2015 - 2016": "sunitta-december-festival",
    "Events/Sunitta/Awards": "sunitta-awards",
    "Events/Jeevan Utsav 2022": "jeevan-utsav",
    "Events/Athma Academy Mylapore October 2025": "samarpanam",
    "Events/Nada Sudha 2026": "nada-sudha",
    "Events/Kapaleshwar Temple 2024": "maha-shivaratri",
    "Samarppan 2009": "samarpan-2009",
    "Events/17th Oct 2026 - Navaratri": "canada-navaratri",
}

# class folder -> album id
CLASS_ALBUMS = {
    "AS1": "class-as1",
    "AS2": "class-as2",
    "AS3": "class-as3",
    "AS4": "class-as4",
    "AS5": "class-as5",
    "AD1": "class-ad1",
    "AD2": "class-ad2",
    "PC1": "class-pc1",
    "PC2": "class-pc2",
    "CG R": "class-cg-r",
    "CG T": "class-cg-t",
    # One-to-one classes, filed like the group ones. The folders are named for the
    # student; nothing here carries that name into a key, a title or alt text.
    "Dhiya": "class-cg-t2",
    "Sanjana": "class-pw",
    "Yathi Nithi": "class-ag",
}

# The two Scarborough class photographs (they are also on the Scarborough
# location page). With the Navaratri event they make up the Canada filter.
CANADA_CLASS_PHOTOS = ["CA1.jpg", "CA3.jpg"]

# Class photographs that are also plates on the globe, chosen by eye.
GLOBE_CLASS_PHOTOS = {
    ("AS2", "_DSC6201.jpg"),
    ("AS3", "_DSC5971.jpg"),
    ("AS4", "_DSC6322.jpg"),
    ("AS5", "_DSC6436.jpg"),
    ("AD1", "_DSC5398.jpg"),
    ("PC1", "_DSC5100.jpg"),
    ("PC2", "_DSC5080.jpg"),
    ("CG T", "_DSC5670.jpg"),
}


def slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")


def cut(src: Path, key: str, plate: bool) -> tuple[int, int]:
    im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
    full = im.copy()
    full.thumbnail((FULL_EDGE, FULL_EDGE), Image.LANCZOS)
    full.save(GALLERY_DIR / f"{key}.jpg", "JPEG", quality=76, optimize=True, progressive=True)
    if plate:
        p = im.copy()
        p.thumbnail((PLATE_EDGE, PLATE_EDGE), Image.LANCZOS)
        p.save(GLOBE_DIR / f"{key}.webp", "WEBP", quality=72, method=6)
    return full.size


def main() -> None:
    GALLERY_DIR.mkdir(parents=True, exist_ok=True)
    GLOBE_DIR.mkdir(parents=True, exist_ok=True)
    rows = []

    picks = json.loads(PICKS.read_text(encoding="utf-8"))
    for p in picks:
        album = EVENT_ALBUMS.get(p["folder"])
        if not album:
            continue  # class pictures come from the class folders below
        key = f"{album}-{slug(Path(p['file']).stem)}"
        w, h = cut(SRC / p["folder"] / p["file"], key, plate=True)
        rows.append((album, key, w, h, True))

    for folder, album in CLASS_ALBUMS.items():
        for f in sorted((SRC / "Classes" / folder).glob("*")):
            if f.suffix.lower() not in (".jpg", ".jpeg"):
                continue
            key = f"{album}-{slug(f.stem)}"
            on_globe = (folder, f.name) in GLOBE_CLASS_PHOTOS
            w, h = cut(f, key, plate=on_globe)
            rows.append((album, key, w, h, on_globe))

    for name in CANADA_CLASS_PHOTOS:
        key = f"canada-classes-{slug(Path(name).stem)}"
        w, h = cut(SRC / "Canada" / name, key, plate=False)
        rows.append(("canada-classes", key, w, h, False))

    lines = [
        "// Generated by _research/make_gallery_assets.py. Do not edit by hand;",
        "// albums, dates and labels live in ./gallery.ts.",
        "",
        "/** [key, albumId, width, height, onGlobe] */",
        "export const RAW_PHOTOS: readonly [string, string, number, number, boolean][] = [",
    ]
    for album, key, w, h, g in rows:
        lines.append(f"  ['{key}', '{album}', {w}, {h}, {'true' if g else 'false'}],")
    lines.append("];")
    DATA.write_text("\n".join(lines) + "\n", encoding="utf-8")

    on_globe = sum(1 for r in rows if r[4])
    print(f"{len(rows)} photographs, {on_globe} on the globe")


if __name__ == "__main__":
    main()
