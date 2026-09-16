"""
Migrate the last of the old dark-theme colour tokens to the cream palette.

BACKGROUND
----------
The old design system named its tokens for a dark ground: `silk` was the body
*text* colour (near-white on obsidian) and `obsidian`/`charcoal` were surfaces.
The cream system reuses the name `silk` for a light *surface* (#F4EBD9) and
dropped obsidian/charcoal/ochre/muted entirely.

Two consequences, both visible:
  * `text-silk` now paints cream text on a cream page — invisible.
  * `bg-obsidian`, `text-ochre` etc. no longer exist, and Tailwind v4 silently
    emits nothing for unknown colour utilities, so those surfaces fall through
    to cream and the borders vanish.

Ordering matters: the longer, more specific tokens (ochre-lit, charcoal-2) must
be replaced before their prefixes, and `silk` must be handled by full utility
name so that legitimate new uses of `bg-silk` are left alone.
"""

import re
from pathlib import Path

ROOT = Path(r"C:\Projects\Shantikalaniketan\web")

TARGETS = [
    ROOT / "components" / "BookingModal.tsx",
    ROOT / "components" / "FloatingCta.tsx",
]

# (pattern, replacement) applied in order.
RULES: list[tuple[str, str]] = [
    # Surfaces: dark panel -> frosted warm panel
    (r"\bbg-obsidian/85\b", "bg-teal-deep/25"),
    (r"\bbg-obsidian/60\b", "bg-white/70"),
    (r"\bbg-obsidian\b", "bg-cream"),
    (r"\bbg-charcoal/95\b", "bg-white/85"),
    (r"\bbg-charcoal-2\b", "bg-silk-deep"),
    (r"\bbg-charcoal\b", "bg-cream"),
    # Accent: ochre -> marigold
    (r"\bbg-ochre/10\b", "bg-marigold/10"),
    (r"\bbg-ochre-lit\b", "bg-marigold"),
    (r"\bbg-ochre\b", "bg-kumkum"),
    (r"\btext-ochre-lit\b", "text-marigold-deep"),
    (r"\btext-ochre\b", "text-marigold-deep"),
    (r"\bborder-ochre/(\d+)\b", r"border-marigold/\1"),
    (r"\bborder-ochre\b", "border-marigold"),
    (r"\bfocus:border-ochre/60\b", "focus:border-teal/60"),
    # Text: silk was the body colour, muted was the secondary
    (r"\btext-silk/80\b", "text-ink-soft"),
    (r"\btext-silk\b", "text-ink"),
    (r"\bplaceholder:text-muted/50\b", "placeholder:text-ink-faint/70"),
    (r"\btext-muted/50\b", "text-ink-faint/70"),
    (r"\btext-muted\b", "text-ink-soft"),
    (r"\bhover:text-silk\b", "hover:text-teal"),
    # Error state: terracotta -> kumkum
    (r"\bborder-terracotta\b", "border-kumkum"),
    (r"\bbg-terracotta/10\b", "bg-kumkum/10"),
    (r"\btext-terracotta\b", "text-kumkum"),
    # Hairlines that were white-on-dark need to be ink-on-cream
    (r"\bborder-white/10\b", "border-ink/15"),
    (r"\bhover:bg-white/5\b", "hover:bg-teal/5"),
    (r"\bshadow-black/60\b", "shadow-teal-deep/20"),
    # The primary button sat dark-on-ochre; now cream-on-kumkum
    (r"\btext-obsidian\b", "text-cream"),
    (r"\bhover:bg-ochre-lit\b", "hover:bg-kumkum-lit"),
]

total = 0
for path in TARGETS:
    text = original = path.read_text(encoding="utf-8")
    for pattern, replacement in RULES:
        text = re.sub(pattern, replacement, text)
    if text != original:
        path.write_text(text, encoding="utf-8")
        changed = sum(1 for a, b in zip(original.split("\n"), text.split("\n")) if a != b)
        total += changed
        print(f"{path.name}: {changed} lines changed")
    else:
        print(f"{path.name}: no change")

print(f"\n{total} lines changed in total")

# Report anything left behind.
DEAD = re.compile(
    r"\b(?:text|bg|border|ring|from|to|via|decoration|placeholder|divide|shadow)"
    r"[-:/\w]*-(?:obsidian|charcoal|charcoal-2|ochre|ochre-lit|muted|crimson|terracotta)\b"
)
leftovers = []
for path in ROOT.rglob("*.tsx"):
    if "node_modules" in str(path) or ".next" in str(path):
        continue
    for i, line in enumerate(path.read_text(encoding="utf-8").split("\n"), 1):
        for match in DEAD.finditer(line):
            leftovers.append(f"{path.relative_to(ROOT)}:{i}  {match.group(0)}")

if leftovers:
    print("\nRemaining dead tokens:")
    for entry in leftovers:
        print(" ", entry)
else:
    print("\nNo dead colour tokens remain.")
