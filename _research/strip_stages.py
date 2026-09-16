"""
Strip the superseded STAGES block out of web/lib/site.ts.

The curriculum now lives in web/lib/curriculum.ts, transcribed from
`Website Contents.docx`. The crawled STAGES data disagreed with it on the number
of levels, the starting age, and the repertoire-to-level mapping, so it is
removed rather than left as a second source of truth.

Deletes from the "Curriculum" banner comment through to the line before the
"Faculty" banner comment, and drops in a pointer in its place.
"""

from pathlib import Path

path = Path(r"C:\Projects\Shantikalaniketan\web\lib\site.ts")
text = path.read_text(encoding="utf-8")

start_marker = "// ---------------------------------------------------------------------------\n// Curriculum"
end_marker = "// ---------------------------------------------------------------------------\n// Faculty"

start = text.index(start_marker)
end = text.index(end_marker)

replacement = (
    "// ---------------------------------------------------------------------------\n"
    "// Curriculum\n"
    "// ---------------------------------------------------------------------------\n"
    "//\n"
    "// Lives in ./curriculum.ts, transcribed from `Website Contents.docx`.\n"
    "//\n"
    "// The `STAGES` array that used to sit here was crawled from the previous\n"
    "// website and contradicted the docx on the number of levels, the starting age,\n"
    "// and which repertoire belongs to which level. It has been removed rather than\n"
    "// kept as a competing source of truth.\n\n"
)

path.write_text(text[:start] + replacement + text[end:], encoding="utf-8")
print("removed", end - start, "characters")
