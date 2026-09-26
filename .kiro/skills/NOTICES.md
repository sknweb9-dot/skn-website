# Third-party skill attributions

Skills vendored into `.kiro/skills/`. All four upstreams are permissively
licensed and redistributable. Each skill folder keeps its own licence file.

## impeccable

- **Upstream:** https://github.com/pbakaus/impeccable
- **Licence:** Apache License 2.0 — `impeccable/LICENSE`
- **Version:** 4.4.0 (skill), engine 4.0.0
- **Vendored from:** the repository's own `.kiro/skills/impeccable/` variant,
  which already rewrites internal script paths to `.kiro/skills/impeccable/...`
  and omits the Claude-only `user-invocable` and `argument-hint` front matter.
- **Further attribution:** carries its own `NOTICE.md`. The `reference/ios.md`
  and `reference/android.md` files are distilled from ehmo's
  `platform-design-skills` (MIT) — https://github.com/ehmo/platform-design-skills
- **Local change:** top-level `version` moved under `metadata`, which is where
  Kiro's documented skill schema puts it.
- **Runtime dependency:** `scripts/impeccable.cmd` runs a self-contained engine
  binary, downloaded once on first use. Verified working on Windows
  (`--version` returns 4.0.0). The skill documents a degraded path if the
  launcher is unavailable.

## frontend-design

- **Upstream:** https://github.com/anthropics/skills — `skills/frontend-design`
- **Licence:** Apache License 2.0 — `frontend-design/LICENSE.txt`
- **Vendored from:** a sparse checkout of that path only.
- **Local change:** none. Its front matter already satisfies Kiro's schema.
- **Runtime dependency:** none. Pure guidance.

## ui-ux-pro-max, design-system, brand

- **Upstream:** https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- **Licence:** MIT — `ui-ux-pro-max/LICENSE`
- **Version:** 2.13.0
- **Vendored from:** the repository's `.claude/skills/<name>/` folders, each of
  which is self-contained (`data/`, `references/`, `scripts/`).
- **Local changes:**
  - `argument-hint` removed from `design-system` and `brand` front matter; the
    key is a Claude Code slash-command hint with no Kiro equivalent.
  - 11 script invocations in `ui-ux-pro-max/SKILL.md` rewritten from
    `${CLAUDE_PLUGIN_ROOT}/.claude/skills/...` to
    `.kiro/skills/ui-ux-pro-max/scripts/search.py`. That environment variable is
    set by Claude Code when loading a plugin and is undefined in Kiro, so every
    one of those commands would otherwise have failed — and failed quietly, since
    the script reports "no results" rather than erroring.
  - `scripts/tests/test_skill_script_paths.py` left untouched: it asserts on the
    upstream layout, is not run here, and rewriting it would manufacture a
    false failure.
- **Runtime dependency:** Python for `scripts/search.py`. Verified working
  (`python` 3.14.2 on this machine) against the `style`, `typography`, `color`,
  `gsap` and `product` domains.

## color-expert

- **Upstream:** https://github.com/meodai/skill.color-expert
- **Licence:** CC BY 4.0 for the original skill text — `color-expert/LICENSE`.
  Many files under `references/` summarise or transcribe third-party talks,
  articles and papers and remain under their authors' rights; see
  `color-expert/THIRD_PARTY_NOTICES.md` before reusing any of that material
  outside this repository.
- **Version:** commit `f74624c` (2026-09-23), cloned shallow.
- **Vendored from:** the full repository minus `.git` — 193 files, 2.5 MB,
  including the 173 reference files the OpenDesign catalogue entry points to
  but does not ship.
- **Local change:** none.
- **Runtime dependency:** none. Guidance and reference text only; no scripts.

## Deliberately not installed

From the `ui-ux-pro-max` repository:

- **`ui-styling`** — 5.6 MB, of which roughly 4 MB is bundled TTF files for
  canvas-based poster rendering. This project is Next.js with Tailwind 4, uses no
  shadcn/ui, and renders no canvas artwork. `impeccable` and `frontend-design`
  cover styling judgement more directly.
- **`banner-design`** — advertising banner sizes and layouts. Not applicable.
- **`slides`** — presentation generation. Not applicable.
- **`design`** — a router for logo, icon, banner and slide asset generation.
  Its useful sub-domains overlap what is installed; the rest is asset production
  this project does not need.

Re-add any of them by copying the folder from the upstream repository into
`.kiro/skills/`, then confirming `name` matches the folder name and stripping
`argument-hint`.
