# Shanti Kala Nikketan — website

The academy's site: Next.js 16, React 19, Tailwind 4, Lenis for the inner pages'
smooth scroll, three.js and GSAP for the gallery globe. Hosted on Vercel.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build; also type-checks
npm run lint
npm test         # vitest: booking, enquiry route, SEO and structured data, gallery, home, stage
```

Copy `.env.example` to `.env.local` for enquiry email (Resend) and the Instagram
rail. Without them the site still runs; see the notes in that file.

## Where things live

- `lib/site.ts` (the academy, its figures, the masthead's routes),
  `lib/branches.ts` (the branches and the online class), `lib/people.ts`,
  `lib/faqs.ts`, `lib/classes.ts`, `lib/curriculum.ts`, `lib/lineage.ts`,
  `lib/events.ts` - every fact about the academy. They feed both the page copy
  and the Schema.org data, so nothing unsourced goes in them.
- `lib/seo.ts` - every page's title, description and share image, in one place.
  Pages call `pageMetadata`; `tests/seo.test.ts` holds the length limits.
- `public/img/locations/<place>/` - drop photographs in and rebuild; they appear
  on that place's page (see `lib/locationPhotos.ts`).
- `lib/home.ts` — the home page's seven sections: what each says, which gesture
  it lands on, which ground it sits on. To add an event,
  edit `HOME_EVENTS`; a future date makes it lead the events section on its own.
- `lib/stage.ts` — the home stage's arithmetic (which page shows at which scroll
  position, which moment of the footage the hand is on). Pure, and tested in
  `tests/stage.test.ts`.
- `lib/mudras.ts` — the 28 gestures and their frame ranges in the footage.
- `components/home/` — `HomeSections.tsx` (server components: the content, which
  stacks as an ordinary page), `HomeStage.tsx` (turns it into a stage on large
  screens), `archVideo.ts` (the WebGL shader that keys the hand out of the
  footage).
- `app/globals.css` imports `app/styles/*.css`, one file per concern in cascade
  order: `tokens.css` (design tokens, with the measured contrast behind each),
  `home-stage.css`, `home-rail.css`, `text-motion.css` and so on. Re-run
  `../_research/home_tones.py` after changing a section ground.
- `components/booking/` and `components/gallery/globe/` - the pieces of the two
  largest components (`BookingFlow.tsx`, `gallery/GlobeCanvas.tsx`).
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
