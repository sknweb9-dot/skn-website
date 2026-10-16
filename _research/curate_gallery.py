"""
Curate the events gallery from the academy's archive.

    python _research/curate_gallery.py            # writes picks/gallery_auto.json
                                                  # and picks/gallery_N.jpg sheets

Source: `Stuff from NAS/Final/Final/` (not in the repo). Each album's folder name
is the academy's own label, so album names and dates here come from the folders
and from the Events list in `Website Contents.docx`; no photograph is given a
title or a date that nobody supplied.

Within each album the pick is automatic and meant to be reviewed: sharpest first,
near-duplicates (burst shots) dropped, near-black and blown-out frames skipped,
up to the album's quota. The quotas keep the globe from being 40% one afternoon.
The output is a list of picks (JSON) plus numbered contact sheets for a person to
look at; swap any pick by editing the JSON's "file" and rerunning
`_research/make_gallery_assets.py`.

Needs: pillow, numpy.
"""

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "Stuff from NAS" / "Final" / "Final"
OUT = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT.parent / "skn-stage-prototype" / "picks"

# folder -> (album, section, date, quota)
ALBUMS = {
    "Events/Udaan/2025": ("Udaan 2025", "udaan", "2025-06", 13),
    "Events/Udaan/2023": ("Udaan 2023", "udaan", "2023-10", 11),
    "Events/Arangetrams/Aparna Manu 2018": ("Arangetram: Aparna Manu", "arangetram", "2018", 10),
    "Events/Arangetrams/Kirusanthini 2024": ("Arangetram: S. Kirusanthini", "arangetram", "2024-01", 9),
    "Events/Arangetrams/Jahnavi 2025": ("Arangetram: Jahnavi Sivasubramanyam", "arangetram", "2025-06", 12),
    "Events/Sunitta/First Solo 26th Oct 2013": ("Sunitta Menghanaani: first solo", "solo", "2013-10", 12),
    "Events/Sunitta/Second Solo Feb 2015": ("Sunitta Menghanaani: second solo", "solo", "2015-02", 9),
    "Events/Sunitta/December Festival 2015 - 2016": ("December Festival", "solo", "2015", 6),
    "Events/Sunitta/Awards": ("Awards", "solo", None, 4),
    "Events/Jeevan Utsav 2022": ("Jeevan Utsav", "group", "2022", 11),
    "Events/Athma Academy Mylapore October 2025": ("Samarpanam Festival, Athma Academy", "group", "2025-10", 8),
    "Events/Nada Sudha 2026": ("Nada Sudha Festival", "group", "2026", 7),
    "Events/Kapaleshwar Temple 2024": ("Maha Shivaratri, Kapaleeshwarar Temple", "outreach", "2024-03", 5),
    "Samarppan 2009": ("Samarpan, 2009", "studio", "2009", 7),
}


# Files looked at and set aside: posters, invitation cards and other text-on-image
# graphics (sharp, so the sharpness pick loves them), the empty hall, the
# decoration shots, and a portrait that belongs to no stage.
EXCLUDE = {
    "General Post-01.jpg",
    "PHOTO-2023-10-22-12-32-15.jpg",
    "3D3A1082.JPG",
    "3D3A1089.JPG",
    "3D3A1093.JPG",
    "grey curve.jpg",
    "yellow curve.jpg",
    "back trial.jpg",
    "front trial.jpg",
    "Avantika2.JPEG",
}

# In-class photographs chosen by eye from the batch folders (Classes/<batch>/).
# album: "In class at <venue>". Venue names are the site's own (lib/classes.ts).
CLASS_PICKS = [
    ("Classes/AS2", "_DSC6201.jpg", "In class at Appswamy Springs"),
    ("Classes/AS3", "_DSC5971.jpg", "In class at Appswamy Springs"),
    ("Classes/AS4", "_DSC6322.jpg", "In class at Appswamy Springs"),
    ("Classes/AS5", "_DSC6436.jpg", "In class at Appswamy Springs"),
    ("Classes/AD1", "_DSC5398.jpg", "In class at Adroit"),
    ("Classes/PC1", "_DSC5100.jpg", "In class at Prestige Courtyards"),
    ("Classes/PC2", "_DSC5080.jpg", "In class at Prestige Courtyards"),
    ("Classes/CG T", "_DSC5670.jpg", "In class at Casagrand Tranquil"),
]


def dhash(im: Image.Image) -> np.ndarray:
    g = np.asarray(im.convert("L").resize((9, 8), Image.LANCZOS), dtype=np.int16)
    return (g[:, 1:] > g[:, :-1]).flatten()


def sharpness(im: Image.Image) -> float:
    g = im.convert("L").resize((384, max(1, int(384 * im.height / im.width))), Image.LANCZOS)
    return float(np.asarray(g.filter(ImageFilter.FIND_EDGES), dtype=np.float32).var())


def load(p: Path) -> Image.Image:
    return ImageOps.exif_transpose(Image.open(p)).convert("RGB")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    picks = []
    for folder, (album, section, date, quota) in ALBUMS.items():
        files = [p for p in sorted((SRC / folder).glob("*")) if p.suffix.lower() in (".jpg", ".jpeg")]
        scored = []
        for p in files:
            try:
                im = load(p)
            except Exception as e:  # unreadable file: say so, move on
                print("skip", p.name, e)
                continue
            small = im.copy()
            small.thumbnail((640, 640))
            lum = float(np.asarray(small.convert("L")).mean())
            if p.name in EXCLUDE or lum < 8 or lum > 240:
                continue
            scored.append((sharpness(small), p, dhash(small), im.size))
        scored.sort(key=lambda t: -t[0])
        chosen = []
        for s, p, h, size in scored:
            if len(chosen) >= quota:
                break
            if any(int((h != c[2]).sum()) < 11 for c in chosen):
                continue
            chosen.append((s, p, h, size))
        print(f"{album}: {len(files)} -> {len(chosen)}")
        for s, p, _, size in sorted(chosen, key=lambda t: t[1].name):
            picks.append(
                {"folder": folder, "file": p.name, "album": album, "section": section, "date": date, "w": size[0], "h": size[1]}
            )
    for folder, name, album in CLASS_PICKS:
        w, h = load(SRC / folder / name).size
        picks.append({"folder": folder, "file": name, "album": album, "section": "studio", "date": None, "w": w, "h": h})
    (OUT / "gallery_auto.json").write_text(json.dumps(picks, indent=1), encoding="utf-8")
    print("total", len(picks))

    # Numbered contact sheets, 8 across, about 40 to a sheet.
    T, cols, per = 250, 8, 40
    font = ImageFont.load_default()
    for s in range(0, len(picks), per):
        chunk = picks[s : s + per]
        rows = (len(chunk) + cols - 1) // cols
        cell_h = int(T * 0.8) + 18
        sheet = Image.new("RGB", (cols * (T + 6), rows * cell_h), "#222")
        d = ImageDraw.Draw(sheet)
        for i, p in enumerate(chunk):
            im = load(SRC / p["folder"] / p["file"])
            im.thumbnail((T, int(T * 0.8)))
            x, y = (i % cols) * (T + 6), (i // cols) * cell_h
            sheet.paste(im, (x, y + 14))
            d.text((x + 2, y + 1), f"{s + i:03d}  {p['album'][:30]}", fill="#fff", font=font)
        sheet.save(OUT / f"gallery_{s // per + 1}.jpg", quality=84)
    print("sheets", (len(picks) + per - 1) // per)


if __name__ == "__main__":
    main()
