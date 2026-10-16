"""
Cut the photographs that sit on the Curriculum page's level cards.

    python _research/make_page_photos.py

Reads six originals from the academy's archive (`Stuff from NAS/Final/Final/`,
not in the repo) and writes 3:2 JPEGs, 1200x800, progressive, to

    web/public/img/pages/level-<n>.jpg

The names are what lib/curriculum.ts refers to. Every source is already 3:2, so
nothing is cropped except the Level 6 picture: Jahnavi's Arangetram frame is a
portrait, and the 3:2 band that keeps her face, hands and the top of the costume
is cut from it (CROP_FROM_TOP says how far down).

Levels 5 and 6 have no class photograph because no batch runs at those levels at
present. They use a stage photograph, and the page says so under the picture.

The Locations venue cards and the About page deliberately have no photographs:
the pictures would repeat the gallery, and one batch's photo on a venue with
several batches would make the others look absent.
"""

from pathlib import Path

from PIL import Image, ImageOps

ARCHIVE = Path(__file__).resolve().parent.parent / "Stuff from NAS" / "Final" / "Final"
OUT = Path(__file__).resolve().parent.parent / "web" / "public" / "img" / "pages"

WIDTH, HEIGHT = 1200, 800
QUALITY = 78

# Fraction of the spare height to drop from the top of a portrait before taking
# the 3:2 band. 0.4 keeps the headdress clear of the top edge.
CROP_FROM_TOP = 0.4

PICKS = {
    # 1-4 are from a batch at that level; 5 and 6 are stage photographs.
    "level-1": "Classes/CG T/_DSC5670.jpg",
    "level-2": "Classes/AD1/_DSC5361.jpg",
    "level-3": "Classes/AS1/_DSC6052.jpg",
    "level-4": "Classes/CG R/_DSC4767.JPG",
    "level-5": "Events/Udaan/2025/_DSC3988.JPG",
    "level-6": "Events/Arangetrams/Jahnavi 2025/3D3A1440.JPG",
}


def three_by_two(im: Image.Image) -> Image.Image:
    """The largest 3:2 band of the image; a landscape 3:2 comes through whole."""
    w, h = im.size
    target_h = round(w * 2 / 3)
    if target_h <= h:
        top = round((h - target_h) * (CROP_FROM_TOP if h > w else 0.5))
        return im.crop((0, top, w, top + target_h))
    target_w = round(h * 3 / 2)
    left = (w - target_w) // 2
    return im.crop((left, 0, left + target_w, h))


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for key, rel in PICKS.items():
        src = ARCHIVE / rel
        if not src.exists():
            raise SystemExit(f"Missing from the archive: {rel}")
        im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
        im = three_by_two(im).resize((WIDTH, HEIGHT), Image.LANCZOS)
        dest = OUT / f"{key}.jpg"
        im.save(dest, "JPEG", quality=QUALITY, optimize=True, progressive=True)
        print(f"{key:28s} {dest.stat().st_size // 1024:4d} KB   {rel}")


if __name__ == "__main__":
    main()
