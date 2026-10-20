"""
Cut the Scarborough and Online photographs on the location pages from the
academy's archive.

    python _research/make_location_photos_nas.py

  public/img/locations/scarborough/  the two class photographs (CA1, CA3), upright,
                                     long edge 1600, neutral file names
  public/img/locations/online/       the first image is the Online card on /locations:
                                     a 16:9 crop of the class's video call (the top
                                     row of tiles), with the two student names
                                     printed on their tiles blurred out. The site
                                     does not name its students, and the crop also
                                     leaves out the meeting link in the browser bar.

The archive original is untouched. Needs: pillow.
"""

import pathlib

from PIL import Image, ImageDraw, ImageFilter, ImageOps

ROOT = pathlib.Path(__file__).resolve().parent.parent
NAS = ROOT / "Stuff from NAS" / "Final" / "Final"
OUT = ROOT / "web" / "public" / "img" / "locations"

for name, out in [("Canada/CA1.jpg", "01-class.jpg"), ("Canada/CA3.jpg", "02-class.jpg")]:
    im = ImageOps.exif_transpose(Image.open(NAS / name)).convert("RGB")
    im.thumbnail((1600, 1600), Image.LANCZOS)
    im.save(OUT / "scarborough" / out, quality=82, optimize=True, progressive=True)
    print(out, im.size)

src = Image.open(NAS / "Online/Online for website.png").convert("RGB")
crop = src.crop((64, 96, 1045, 648))  # 981 x 552


def blur(img, box, radius=14, feather=10):
    x0, y0, x1, y1 = box
    region = img.crop(box).filter(ImageFilter.GaussianBlur(radius))
    mask = Image.new("L", (x1 - x0, y1 - y0), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (feather // 2, feather // 2, x1 - x0 - feather // 2, y1 - y0 - feather // 2), radius=8, fill=255
    )
    img.paste(region, (x0, y0), mask.filter(ImageFilter.GaussianBlur(feather / 2)))


blur(crop, (52, 280, 192, 346))   # the name label on the top-left tile
blur(crop, (440, 386, 604, 462))  # the name label on the top-right tile
crop.save(OUT / "online" / "01-online-class.jpg", quality=88, optimize=True, progressive=True)
print("online", crop.size)
