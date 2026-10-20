"""
Cut the photographs on the location pages that come from existing site images
and from the academy's archive.

    python _research/make_location_photos.py

  public/img/locations/chennai/      the five class photographs the academy named
                                     (copied from the gallery's cuts), in their order
  public/img/locations/individual/   two portraits for the one-to-one block on /locations,
                                     from the archive. Neutral file names on purpose:
                                     the site does not name its students.

Scarborough and Online are cut by make_location_photos_nas.py. See
web/lib/locationPhotos.ts for how a folder becomes a page's photographs.

Needs: pillow.
"""

import pathlib
import shutil

from PIL import Image, ImageOps

ROOT = pathlib.Path(__file__).resolve().parent.parent
W = ROOT / "web" / "public" / "img" / "locations"
G = ROOT / "web" / "public" / "img" / "gallery"
NAS = ROOT / "Stuff from NAS" / "Final" / "Final" / "Classes"

for d in ("chennai", "scarborough", "online", "individual"):
    (W / d).mkdir(parents=True, exist_ok=True)
for d in ("scarborough", "online"):
    (W / d / ".gitkeep").write_text("")

# Chennai, in the order the academy gave: AS2, AS4, PC1, PC2, AD2.
ORDER = [
    ("01-as2-6152", "class-as2-dsc6152"),
    ("02-as4-6345", "class-as4-dsc6345"),
    ("03-pc1-5100", "class-pc1-dsc5100"),
    ("04-pc2-5146", "class-pc2-dsc5146"),
    ("05-ad2-5297", "class-ad2-dsc5297"),
]
for out, src in ORDER:
    shutil.copyfile(G / f"{src}.jpg", W / "chennai" / f"{out}.jpg")

for out, rel in [("01-one-to-one", "Dhiya/_DSC5784.jpg"), ("02-one-to-one", "Sanjana/_DSC4566.jpg")]:
    im = ImageOps.exif_transpose(Image.open(NAS / rel)).convert("RGB")
    im.thumbnail((1200, 1800), Image.LANCZOS)
    im.save(W / "individual" / f"{out}.jpg", quality=82, optimize=True, progressive=True)
    print(out, im.size)
