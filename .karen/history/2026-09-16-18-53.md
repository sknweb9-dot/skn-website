# Karen Review: Shanti Kala Nikketan

**Score: 77/100** - "Actually decent" ✅ (7.7/10)

Generated: 2026-09-16

## The Reality Check

Credit where it's due: this is not another AI-slop Next.js template. Someone actually crawled a 12-page Wix site, screenshotted it 24 ways, transcribed a `.docx` as the source of truth, and then built a bespoke scroll-driven storytelling site around a hand-gesture video. The comments in `web/lib/acts.ts:1-37` explaining *why* the act windows are unequal (because act 4 once captioned Padmakōśa while the hand showed Mṛgaśīrṣa) is the kind of scar tissue you only get from doing the work.

And the honesty is refreshing. `web/lib/schema.ts:8-20` deliberately omits `aggregateRating` because faking stars risks a Google manual action. `web/lib/site.ts:1-8` says "do not add unsourced claims here". `web/lib/classes.ts:61-63` marks Canada timings as provisional and `web/lib/schema.ts:78-81` excludes them from structured data rather than sending a parent to a closed door. That's rare discipline.

But let's not hand out trophies yet:

1. Your conversion path is a dead end. `web/app/api/enquiry/route.ts:111` — `// TODO: deliver the enquiry` — logs redacted PII to the server console and returns `{ok:true}`. A parent thinks they booked a trial; you printed a log line. The file itself warns (lines 12-17) it needs Turnstile + durable rate limiting + a real destination before going live. Ship that before you ship anything else.

2. Zero tests. No `*.test.*`, no `*.spec.*`, no Playwright spec, no Vitest. The one piece of safety-critical logic — `actVisibility` / `archState` / `verifyActs` in `web/lib/acts.ts:186-287` — *does* fail loudly at module load if windows drift, and `_research/check_act_windows.py` exists. Good. But that's a runtime grenade, not a CI gate. One `npm run build` typo and the homepage is blank.

3. The README is still `create-next-app` boilerplate (`web/README.md:1-36`). No setup, no env, no deploy, no content-editing guide for the academy owner. And git history is two commits deep (`9c7e573 changes to the homepage`, `1546568 Add web project files`). No shame in a squash, but there's no evidence of review or iteration.

4. Root clutter: `_research/` (45 files of crawl artifacts), `_build/` (Python build scripts), `prototype/` (static prototype), `bundled_prompt.txt`, `mudra.mp4` at root. Fine as a working monorepo, but there's no root README explaining what each directory is or which is canonical (`web/` is, but you have to infer it).

**Market Context:** Chennai Bharatanatyam schools are saturated — Bharata Kalanjali (since 1968), Natya Sankalpaa (1000+ students since 1996), Shri Laksh (67+ 5-star reviews, Kalakshetra+ Pandanallur), plus a long tail of Anna Nagar studios. Nobody is winning on tech. This site wins on craft: the six-act mudra scroll, the 28-hastas `DefinedTermSet` reference (`web/lib/schema.ts:318-354`), and SEO that refuses to lie. That's genuine differentiation for a *client site*. As a *product* or *template* it's not reusable — and that's fine, it was never trying to be.

## Scoring Breakdown

### 🎭 Bullshit Factor: 17/20
Appropriately ambitious. GSAP ScrollTrigger + canvas frame scrub + Lenis smooth scroll (`web/package.json:12-16`) could be overkill, but for a dance academy selling *movement*, motion IS the product. The `TEXT_IN/OUT` ramps, `archState` travel gaps, and load-time `verifyActs` guard show tuning, not gold-plating. Docked 3 because the prototype/_build/_research triple-track (Python static gen + static prototype + Next.js) suggests two rewrites before landing on `web/` — some astronaut mileage burned to get here.

### ⚙️ Actually Works: 14/20
Static routes, dynamic `/locations/[city]`, sitemap/robots, JSON-LD graphs (home/hastas/location), skip-link, `prefers-reduced-motion` fallback to `StaticActs` (`web/components/ScrollStage.tsx:62-65`), PII-redacted logging + honeypot + per-IP rate limit in the enquiry route — all real. Docked 6 because the enquiry form doesn't deliver anywhere (critical path fakes success), rate limiter is in-memory (resets on serverless cold start, by its own admission), and there are zero automated tests to prove any of it.

### 💎 Code Quality: 17/20
Clean TypeScript, no `as any` / `ts-ignore` observed, consistent naming, excellent long-form comments that explain *why* not just *what* (`web/lib/curriculum.ts:1-19` on why the docx supersedes crawled STAGES; `web/lib/site.ts:88-90` on catchment vs venue). Accessibility and SEO done properly. Docked 3 for default README, default `web/next.config.ts:1-7` (no image remote patterns, no headers), and `web/dev.log` / `prod.log` checked into the tree.

### ✅ Completion: 14/20
Only one real TODO in code (`web/app/api/enquiry/route.ts:111`), plus two honest `placeholder` notes (`web/lib/classes.ts:62,176`, `web/lib/schema.ts:80`). `_research/STATUS.txt:52-109` openly lists 7 corrections and 3 open items (unretrieved photo albums, unverified about copy). That's honest, not complete. Enquiry delivery + Canada timings + docs + root cleanup are the remaining 30%.

### 🎯 Practical Value: 15/20
Fills a real gap for a real client (est. 2009, 324 students, 5 Chennai venues + Scarborough + online, per `web/lib/site.ts:42-53`). Beats the Wix original and most rival sites on performance, SEO honesty, and storytelling. Not a library, not a starter, not venture-scale — but it was never pretending to be. Don't extract a framework from it; finish it for the academy.

## Market Context

Competitors: Bharata Kalanjali (prestige, 1968), Natya Sankalpaa (volume, 1000+ students), Shri Laksh (modern SEO + reviews), long-tail Anna Nagar studios.
Unique Value: Mudra-choreographed scroll + hastas reference set + derived, honest structured data.
Recommendation: Continue — finish enquiry delivery, add 1 smoke test + CI build, write a real README, then ship.

## Top 3 Priorities

1. **Deliver enquiries** in `web/app/api/enquiry/route.ts:111` — wire Resend/SES or Google Form (`web/lib/site.ts:527` `GOOGLE_FORM_URL` is `null`), add Turnstile server-side verify, move rate limit to KV/Upstash. Currently fakes success.
2. **Add one smoke test + CI**: `next build && next lint` on push + a Playwright test that homepage renders 6 acts and POST /api/enquiry validates/rejects bad phone. Prevents blank-homepage deploys.
3. **Write a real README** (`web/README.md:1-36` is still create-next-app): setup, `npm run dev/build`, how to edit `site.ts`/`curriculum.ts`/`classes.ts`, image pipeline for `assets/img`, deploy target. Delete or gitignore `dev.log`/`prod.log`, add root README mapping `_research/` vs `_build/` vs `prototype/` vs `web/`.
