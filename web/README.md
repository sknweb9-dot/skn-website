# Shanti Kala Nikketan — website

The academy's site: Next.js 16, React 19, Tailwind 4, GSAP + Lenis for the home
page scroll, three.js for the gallery globe.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build; also type-checks
npm run lint
```

Copy `.env.example` to `.env.local` for enquiry email (Resend) and the Instagram
rail. Without them the site still runs; see the notes in that file.

## Where things live

- `lib/site.ts`, `lib/classes.ts`, `lib/curriculum.ts`, `lib/lineage.ts`,
  `lib/events.ts` — every fact about the academy. They feed both the page copy
  and the Schema.org data, so nothing unsourced goes in them.
- `lib/acts.ts`, `lib/mudras.ts` — the home page's six acts and the gesture
  timings. `acts.ts` throws at build if an act's gesture drifts out of its card's
  window; rerun `../_research/check_act_windows.py` after touching either.
- `app/globals.css` — design tokens, with the measured contrast behind each one.
- `public/frames/` — the home page scrub, cut from `Hastas.mp4` (not in the repo).

This Next.js version differs from older ones; see `AGENTS.md`.
