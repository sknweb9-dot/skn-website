"""
Cut the home page's photographs from the academy's archive.

Source: `Stuff from NAS/Final/Final/` (the academy's own shoot and event
folders, consent confirmed). Output: `web/public/img/home/`.

Each photograph is exif-rotated, resized so its long edge is at most LONG_EDGE,
and saved as a progressive JPEG. next/image re-encodes these to WebP/AVIF per
device, so this step only has to get the multi-megabyte camera files down to a
sane master size and fix orientation.

The two press clippings are special-cased: the Times of India spread is cut
out of page 3 of its PDF, and the Adyar Times page has its blank foot trimmed.

Run from the repository root:  python _research/make_home_photos.py
Requires Pillow and PyMuPDF.
"""

from __future__ import annotations

import glob
from pathlib import Path

import fitz  # PyMuPDF
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "Stuff from NAS" / "Final" / "Final"
OUT = ROOT / "web" / "public" / "img" / "home"

LONG_EDGE = 1600
QUALITY = 80

# The parents' photographs are cut square and small: they are shown as 72-pixel
# circles, so a 640-pixel master is already more than the site can use.
PORTRAIT_EDGE = 640
PORTRAIT_QUALITY = 85

# key -> path under SRC. A trailing "*" matches the first file with that prefix,
# for the phone uploads whose names are UUIDs.
PHOTOS: dict[str, str] = {
    # Why SKN: the academy's own class shoot
    "why-group": "Classes/AS2/_DSC6201.jpg",
    "why-motion": "Classes/AD1/_DSC5398.jpg",
    "why-adults": "Classes/AS5/_DSC6436.jpg",
    "why-theory": "Classes/Sanjana/_DSC4616.jpg",
    # The story, one photograph per stage
    "story-2009": "Samarppan 2009/P1010132.JPG",
    "story-2013": "Events/Sunitta/First Solo 26th Oct 2013/263.jpg",
    "story-2015": "Events/Sunitta/Second Solo Feb 2015/DSC_6257.JPG",
    "story-2018": "Events/Arangetrams/Aparna Manu 2018/CR6A0363.JPG",
    "story-2022": "Events/Jeevan Utsav 2022/_MG_1890.JPG",
    "story-2023": "Events/Udaan/2023/56.jpg",
    "story-2024": "Events/Arangetrams/Kirusanthini 2024/_DSC9506.JPG",
    "story-2025": "Events/Udaan/2025/_DSC3765.JPG",
    "story-2026": "Events/Nada Sudha 2026/DSC_1537.jpg",
    # Honours
    "honours-award": "Events/Sunitta/Awards/_DSC1415.JPG",
    # Events
    "event-udaan-2025": "Events/Udaan/2025/_DSC3988.JPG",
    "event-jahnavi-2025": "Events/Arangetrams/Jahnavi 2025/3D3A2276.JPG",
    "event-samarpanam-2025": "Events/Athma Academy Mylapore October 2025/*",
    "event-nadasudha-2026": "Events/Nada Sudha 2026/f8efd06a*",
    "event-kapaleeshwarar-2024": "Events/Kapaleshwar Temple 2024/IMG_5953.JPG",
    "event-kirusanthini-2024": "Events/Arangetrams/Kirusanthini 2024/_DSC9592.JPG",
    "event-udaan-2023": "Events/Udaan/2023/19.jpg",
    "event-jeevan-2022": "Events/Jeevan Utsav 2022/_MG_2228.JPG",
}
# Not cut: Aparna Manu's July 2024 Music Academy solo is in the docx's events
# list, but the archive has no photograph of it, and a 2018 Arangetram picture
# under a 2024 caption would misdate her.

# The parents' own photographs, sent with their reviews: six files, numbered in
# the academy's order, one for each card in the "In their words" section of
# the home page (lib/home.ts). Square-cropped.
#
# THREE OF THEM CAME OUT LYING DOWN. The photographer held the camera in
# portrait, and the three files carry the orientation tag that says so
# (EXIF 8), but the cut was once taken from the stored pixels instead of the
# tagged ones, so the families were photographed on their sides. open_photo
# reads the tag, and with it the three stand up: their crops are taken from
# the turned file, which is a tall one, hence the focus of 0.5 - the middle
# band, holding the whole figure.
#
# key -> (path, vertical focus 0..1 for the square crop)
PORTRAITS: dict[str, tuple[str, float]] = {
    "voice-1": ("Reviews/Reviews/1. DSC_6401.JPG", 0.00),
    "voice-2": ("Reviews/Reviews/2. _DSC4129.JPG", 0.50),
    "voice-3": ("Reviews/Reviews/3. _MG_1885.JPG", 0.30),
    "voice-4": ("Reviews/Reviews/4. _DSC4561.JPG", 0.00),
    "voice-5": ("Reviews/Reviews/5. 3D3A1237.JPG", 0.00),
    "voice-6": ("Reviews/Reviews/6. _DSC3376.JPG", 0.35),
}


def resolve(rel: str) -> Path:
    if rel.endswith("*"):
        matches = sorted(glob.glob(str(SRC / rel)))
        matches = [m for m in matches if m.lower().endswith((".jpg", ".jpeg"))]
        if not matches:
            raise FileNotFoundError(rel)
        return Path(matches[0])
    path = SRC / rel
    if not path.exists():
        raise FileNotFoundError(rel)
    return path


def save(im: Image.Image, key: str, long_edge: int = LONG_EDGE) -> tuple[int, int]:
    im = im.convert("RGB")
    im.thumbnail((long_edge, long_edge), Image.LANCZOS)
    im.save(OUT / f"{key}.jpg", "JPEG", quality=QUALITY, progressive=True, optimize=True)
    return im.size


def open_photo(path: Path) -> Image.Image:
    im = Image.open(path)
    im.draft("RGB", (LONG_EDGE * 2, LONG_EDGE * 2))
    return ImageOps.exif_transpose(im)


def square(im: Image.Image, focus_y: float) -> Image.Image:
    side = min(im.size)
    left = (im.width - side) // 2
    top = int((im.height - side) * focus_y)
    return im.crop((left, top, left + side, top + side))


def times_of_india() -> tuple[int, int]:
    """Page 3, left column: the Udaan 2025 spread, headline to audience photo."""
    doc = fitz.open(SRC / "Papers" / "Madras_Times_TOI_26-06-2025.pdf")
    page = doc[2]
    r = page.rect
    clip = fitz.Rect(r.x0, r.y0 + r.height * 0.045, r.x0 + r.width * 0.505, r.y0 + r.height * 0.695)
    pix = page.get_pixmap(dpi=110, clip=clip)
    im = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    return save(im, "press-toi", 1800)


def adyar_times() -> tuple[int, int]:
    im = Image.open(SRC / "Papers" / "AT-page-18 copy.jpg")
    im = im.crop((0, 0, im.width, int(im.height * 0.92)))
    return save(im, "press-adyar", 1800)


def portrait(key: str, rel: str, focus_y: float) -> tuple[int, int]:
    """One parent's photograph: square, and standing the right way up."""
    im = square(open_photo(resolve(rel)), focus_y)
    im.thumbnail((PORTRAIT_EDGE, PORTRAIT_EDGE), Image.LANCZOS)
    im.save(OUT / f"{key}.jpg", "JPEG", quality=PORTRAIT_QUALITY, optimize=True)
    return im.size


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for key, rel in PHOTOS.items():
        w, h = save(open_photo(resolve(rel)), key)
        print(f"{key:28} {w}x{h}")
    for key, (rel, focus) in PORTRAITS.items():
        w, h = portrait(key, rel, focus)
        print(f"{key:28} {w}x{h}")
    print(f"{'press-toi':28} {'x'.join(map(str, times_of_india()))}")
    print(f"{'press-adyar':28} {'x'.join(map(str, adyar_times()))}")


if __name__ == "__main__":
    main()
