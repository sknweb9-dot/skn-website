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
- Motion is GSAP + ScrollTrigger with Lenis smooth scroll. `prefers-reduced-motion`
  is already handled by swapping `ScrollStage` for `StaticActs` under a distinct
  React key — preserve that split rather than adding conditionals inside the
  scrubbing path.
- `web/lib/acts.ts` throws at module load if an act's anchor gesture drifts
  outside its card's fully-visible window. That validation is deliberate. If it
  fires, retune the window and rerun `_research/check_act_windows.py`; do not
  weaken the check.
- The hero is a framed arch aperture, not a full-bleed video. That was chosen
  because the footage sits on a mid-grey backdrop, which is the worst case for
  overlaid text, and because full-bleed would make the page video-led rather than
  cream-led. Revisit only with that reasoning in hand.

## Licensing

Vendored skills carry their own licences — Apache 2.0 for `impeccable` and
`frontend-design`, MIT for the `ui-ux-pro-max` family. Attribution is recorded in
`.kiro/skills/NOTICES.md`. Keep it accurate if you add or remove a skill.
