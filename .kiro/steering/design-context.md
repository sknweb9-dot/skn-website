---
inclusion: fileMatch
fileMatchPattern: ['web/**/*.tsx', 'web/**/*.ts', 'web/**/*.css']
---

# Design context for the Shanti Kala Nikketan site

Deliberately short. Kiro CLI's documentation is self-contradictory about whether
inclusion modes are honoured — one page states all steering files load
automatically on CLI — so this file is written to be harmless if it loads on
every turn. Depth lives in the skills under `.kiro/skills/`, which load on
demand.

## The design skills available here

| Skill | Reach for it when |
|---|---|
| `impeccable` | Any UI work: critique, audit, polish, bolder/quieter, animate, layout, harden. Command-driven; it has a playbook per verb. |
| `frontend-design` | Choosing aesthetic direction, typography, and avoiding templated defaults. |
| `ui-ux-pro-max` | Look up concrete data: font pairings, palettes, GSAP motion tiers, UX rules, icon sets. Tool-backed — see below. |
| `design-system` | Token architecture and component specs. |
| `brand` | Voice, messaging, asset consistency. |

`ui-ux-pro-max` is a searchable database, not prose. Query it rather than
guessing, and run it from the project root:

```
python ".kiro/skills/ui-ux-pro-max/scripts/search.py" "<query>" --domain <domain>
```

Domains include `style`, `typography`, `color`, `ux`, `gsap`, `icons`, `landing`,
`chart`, `product`, `react`. If it returns no match it says so explicitly —
report that rather than quietly falling back to a default.

## This project's visual truth

Tokens live in `web/app/globals.css` under `@theme`. Read them before inventing
values; Tailwind 4 reads them directly, so `--color-marigold` yields
`bg-marigold` with no JS config.

- Ground: cream `#fbf8f1`, silk `#f4ebd9`, raised surfaces `paper #fefdfa`
- Dark section grounds (home): midnight `#0a2354`, plum `#2b1540`, oxblood
  `#3d0910`, sindoor `#5a1310`; the arch's niche `#1a0d0d` / `#2a0505`
- Jewel accents: teal `#0f4c5c`, kumkum `#a8201a`, marigold `#ec9a29`
- Display face Cinzel, body Plus Jakarta Sans
- The temple arch is the structural motif, and it ties to the academy's emblem

## A real tension, recorded rather than resolved

Three further traits on that list do appear in the codebase, and these are
genuinely worth reviewing rather than defending:

- The `.eyebrow` utility is tracked-out uppercase (`letter-spacing: 0.24em`,
  `text-transform: uppercase`) and is used in **58** places, including one above
  nearly every act heading. "Using all caps for labels" and "a tracked-out
  ALL-CAPS eyebrow label above every heading" are both on the list.
- **6** instances of `→` appended to link or button text.
- **19** instances of middle-dot meta strings (`A · B · C`).

None of these is wrong on its own. All three being systematic is the thing to
look at. Treat it as a question for the site owner, not a licence to strip them.

## Constraints that bite

- **Next.js 16.3.4 differs from training data.** Read the relevant guide in
  `web/node_modules/next/dist/docs/` before writing routing, metadata, caching or
  server/client boundary code. `proxy.ts` replaces `middleware.ts`; `params` is a
  Promise and must be awaited.
- The home page is a **stage** (`web/components/home/HomeStage.tsx`,
  `web/lib/stage.ts`): on a large screen with no reduced-motion preference, one
  page shows at a time in the same place while the document scrolls natively, and
  the hand in the arch plays the footage as you scroll. On phones and tablets it
  is the **rail** (`HomeRail.tsx`): a stacked page with a small arch pinned at the
  top. Anywhere else (reduced motion, Data Saver, no script) the same
  server-rendered markup is an ordinary stacked page. Preserve that split: each
  presentation's machinery lives in its own engine, mounted only when it is on, so
  nothing in them checks for reduced motion. Every page stays in the document and
  the accessibility tree; do not hide inactive pages with `inert`, `display:none`
  or `visibility:hidden`.
- The home page scrolls natively (`SmoothScroll` skips Lenis on `/`): the hand
  already eases toward the scroll position, and smoothing it twice makes it trail.
- `web/lib/home.ts` throws at module load if a section's gesture comes earlier in
  the footage than the previous section's. That validation is deliberate: the hand
  would run backwards. Pick a later gesture; do not weaken the check.
- The arch is a window onto the footage, and the footage sits on a mid-grey
  backdrop. On the three light sections the arch shows it as filmed (grey); on the
  dark ones the shader (`archVideo.ts`) keys the grey out and the hand floats in a
  warm lamp-lit niche. The niche is always warm and dark (`--color-lamp`), because
  a warm glow over a blue or green ground mixes to grey or olive. The hero is
  still a framed arch aperture, not a full-bleed video: full-bleed would make the
  page video-led rather than cream-led.
- Section grounds are blue, plum, oxblood and sindoor ("dusk") with cream between
  them; they are measured by `_research/home_tones.py`. Dark blues and greens
  between OKLCH hue 170 and 245 read as teal, which was rejected; keep blues at
  hue 255 and above.

## Licensing

Vendored skills carry their own licences — Apache 2.0 for `impeccable` and
`frontend-design`, MIT for the `ui-ux-pro-max` family. Attribution is recorded in
`.kiro/skills/NOTICES.md`. Keep it accurate if you add or remove a skill.
