import Image from 'next/image';
import Link from 'next/link';
import { BRANCHES, METRICS, NAV_ROUTES, SITE, yearsOfLineage } from '@/lib/site';

const ROUTES = NAV_ROUTES;

/**
 * The footer sits on the .ground-deep band — see globals.css for the measured
 * contrast of every colour used here. Two rules that follow from those numbers:
 * nothing inside is kumkum (1.76:1 on teal-deep), and every hover moves toward
 * full cream rather than toward an accent.
 */
export default function Footer() {
  const years = yearsOfLineage();

  return (
    <footer className="ground-deep border-t-[3px] border-marigold">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        {/* Provenance figures. Derived where possible rather than hardcoded.
            `isText` matters: numerals fit the display size comfortably, but a
            word like "Kalakshetra" is ~200px at that scale and overflowed its
            grid cell on a 375px viewport, which pushed the whole document into
            horizontal scroll. Text values get a smaller size and may wrap. */}
        <dl className="grid grid-cols-2 gap-8 border-b border-cream/15 pb-12 sm:grid-cols-4">
          {[
            { value: `${years}`, label: 'Years of lineage' },
            { value: `${METRICS.students}`, label: 'Students taught' },
            { value: `${METRICS.stages}`, label: 'Stages performed' },
            { value: 'Kalakshetra', label: 'Bani and pedagogy', isText: true },
          ].map((stat) => (
            <div key={stat.label}>
              <dt className="sr-only">{stat.label}</dt>
              <dd>
                <span
                  className={`block font-semibold text-cream ${
                    stat.isText
                      ? 'font-display text-[clamp(1.1rem,3.4vw,1.6rem)] leading-tight break-words hyphens-auto'
                      : 'font-display text-[clamp(1.8rem,5vw,2.6rem)] leading-none'
                  }`}
                >
                  {stat.value}
                </span>
                <span className="mt-2 block font-sans text-micro tracking-[0.16em] text-cream/70 uppercase">
                  {stat.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              {/* PNG at its rendered size rather than the SVG — see Nav.tsx.
                  Transparent, so the emblem's cyan sits directly on the deep
                  teal of its own hue. */}
              <Image src="/img/logo-full.png" alt="" width={48} height={48} className="size-12" />
              <span className="leading-tight">
                <span className="block font-display text-base font-semibold text-cream">
                  {SITE.name}
                </span>
                <span className="block font-sans text-micro tracking-[0.2em] text-cream/70 uppercase">
                  {SITE.tagline}
                </span>
              </span>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-cream/80">
              {SITE.style}, taught in the {SITE.method} tradition since 18 April 2009.
            </p>
            <div className="mt-5 space-y-1.5 text-sm">
              <p>
                <a
                  href={`mailto:${SITE.email}`}
                  className="text-cream underline decoration-marigold/60 underline-offset-4 hover:decoration-marigold"
                >
                  {SITE.email}
                </a>
              </p>
              <p>
                <a
                  href={`tel:${SITE.phoneE164}`}
                  className="text-cream underline decoration-marigold/60 underline-offset-4 hover:decoration-marigold"
                >
                  {SITE.phoneDisplay}
                </a>
              </p>
            </div>
          </div>

          <nav aria-label="Sections">
            <h2 className="eyebrow">Explore</h2>
            <ul className="mt-4 space-y-2.5">
              {ROUTES.map((route) => (
                <li key={route.href}>
                  <Link
                    href={route.href}
                    className="text-sm text-cream/80 transition-colors hover:text-cream"
                  >
                    {route.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="eyebrow">Where we teach</h2>
            <ul className="mt-4 space-y-4">
              {BRANCHES.map((branch) => (
                <li key={branch.slug}>
                  <Link
                    href={`/locations/${branch.slug}`}
                    className="group block text-sm text-cream/80 transition-colors hover:text-cream"
                  >
                    <span className="block font-sans font-semibold text-cream underline decoration-transparent underline-offset-4 transition-colors group-hover:decoration-marigold">
                      {branch.city}
                      {branch.locality ? (
                        <span className="font-normal text-cream/70"> · {branch.locality}</span>
                      ) : null}
                    </span>
                    <span className="block text-xs text-cream/70">
                      {branch.region}, {branch.country}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>

            <ul className="mt-6 flex gap-4">
              {Object.entries(SITE.socials).map(([name, href]) => (
                <li key={name}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-sans text-xs tracking-[0.14em] text-cream/70 uppercase transition-colors hover:text-cream"
                  >
                    {name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-cream/15 pt-6 text-xs text-cream/70 sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {SITE.legalName}
          </p>
          <p>{BRANCHES[0].streetAddress}</p>
        </div>
      </div>
    </footer>
  );
}
