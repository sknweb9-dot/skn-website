# Shanti Kala Nikketan — website

The academy's site: Next.js 16, React 19, Tailwind 4, GSAP + Lenis for the inner
pages' smooth scroll, three.js for the gallery globe.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build; also type-checks
npm run lint
npm test         # vitest: booking, enquiry route, home, stage
```

Copy `.env.example` to `.env.local` for enquiry email (Resend) and the Instagram
rail. Without them the site still runs; see the notes in that file.

## Where things live

- `lib/site.ts`, `lib/classes.ts`, `lib/curriculum.ts`, `lib/lineage.ts`,
  `lib/events.ts` — every fact about the academy. They feed both the page copy
  and the Schema.org data, so nothing unsourced goes in them.
- `lib/home.ts` — the home page's seven sections: what each says, which gesture
  it lands on, which ground it sits on. Parent quotes there are placeholders until
  the academy sends real ones (the build warns while any remain). To add an event,
  edit `HOME_EVENTS`; a future date makes it lead the events section on its own.
- `lib/stage.ts` — the home stage's arithmetic (which page shows at which scroll
  position, which moment of the footage the hand is on). Pure, and tested in
  `tests/stage.test.ts`.
- `lib/mudras.ts` — the 28 gestures and their frame ranges in the footage.
- `components/home/` — `HomeSections.tsx` (server components: the content, which
  stacks as an ordinary page), `HomeStage.tsx` (turns it into a stage on large
  screens), `archVideo.ts` (the WebGL shader that keys the hand out of the
  footage).
- `app/globals.css` — design tokens, with the measured contrast behind each one;
  the stage's CSS is under "The home stage". Re-run `../_research/home_tones.py`
  after changing a section ground.
- `public/video/` — `hastas.webm` and `hastas.mp4`, the footage the arch plays
  (re-cut from `Hastas.mp4`, which is not in the repo: crop 1558x2160 from the
  left edge x=1546, scaled to 720x998, 30 fps, keyframe every second).
- `public/frames/` — stills from the same footage: the stacked layout's arches
  and the `/hastas` page.

## The home stage

On a desktop-sized window with no reduced-motion preference, the home page is a
stage: one page shows at a time, in the same place, while the document scrolls
natively underneath; the hand in the arch plays on as you scroll. On phones and
tablets it is the **rail**: the page scrolls as an ordinary stacked page with a
small arch pinned under the masthead, the hand playing as you scroll
(`components/home/HomeRail.tsx`). Elsewhere (reduced motion, Data Saver, short
landscape windows, no JavaScript) the same markup is a plain stacked page. Every
page stays in the document either way, so it can be read, searched and crawled
without a scroll position. See the comment at the top of
`components/home/HomeStage.tsx`.

This Next.js version differs from older ones; see `AGENTS.md`.
