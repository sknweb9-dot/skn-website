import Image from 'next/image';
import Link from 'next/link';
import { BRANCHES, METRICS, NAV_ROUTES, SITE, yearsOfLineage } from '@/lib/site';

const ROUTES = NAV_ROUTES;

export default function Footer() {
  const years = yearsOfLineage();

  return (
    <footer className="border-t border-marigold/25 bg-silk">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        {/* Provenance figures. Derived where possible rather than hardcoded.
            `isText` matters: numerals fit the display size comfortably, but a
            word like "Kalakshetra" is ~200px at that scale and overflowed its
            grid cell on a 375px viewport, which pushed the whole document into
            horizontal scroll. Text values get a smaller size and may wrap. */}
        <dl className="grid grid-cols-2 gap-8 border-b border-marigold/20 pb-12 sm:grid-cols-4">
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
                  className={`block font-semibold foil ${
                    stat.isText
                      ? 'font-display text-[clamp(1.1rem,3.4vw,1.6rem)] leading-tight break-words hyphens-auto'
                      : 'font-display text-[clamp(1.8rem,5vw,2.6rem)] leading-none'
                  }`}
                >
                  {stat.value}
                </span>
                <span className="mt-2 block font-sans text-[0.68rem] tracking-[0.16em] text-ink-faint uppercase">
                  {stat.label}
                </span>
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              {/* PNG at its rendered size rather than the SVG — see Nav.tsx. */}
              <Image src="/img/logo-full.png" alt="" width={48} height={48} className="size-12" />
              <span className="leading-tight">
                <span className="block font-display text-base font-semibold text-teal-deep">
                  {SITE.name}
                </span>
                <span className="block font-sans text-[0.6rem] tracking-[0.2em] text-ink-faint uppercase">
                  {SITE.tagline}
                </span>
              </span>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink-soft">
              {SITE.style}, taught in the {SITE.method} tradition since 18 April 2009.
            </p>
            <div className="mt-5 space-y-1.5 text-sm">
              <p>
                <a
                  href={`mailto:${SITE.email}`}
                  className="text-teal underline decoration-marigold/50 underline-offset-4 hover:decoration-marigold"
                >
                  {SITE.email}
                </a>
              </p>
              <p>
                <a
                  href={`tel:${SITE.phoneE164}`}
                  className="text-teal underline decoration-marigold/50 underline-offset-4 hover:decoration-marigold"
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
                    className="text-sm text-ink-soft transition-colors hover:text-kumkum"
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
                    className="group block text-sm text-ink-soft transition-colors hover:text-kumkum"
                  >
                    <span className="block font-sans font-semibold text-teal group-hover:text-kumkum">
                      {branch.city}
                      {branch.locality ? (
                        <span className="font-normal text-ink-faint"> · {branch.locality}</span>
                      ) : null}
                    </span>
                    <span className="block text-xs text-ink-faint">
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
                    className="font-sans text-xs tracking-[0.14em] text-ink-faint uppercase transition-colors hover:text-kumkum"
                  >
                    {name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-marigold/20 pt-6 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {SITE.legalName}
          </p>
          <p>{BRANCHES[0].streetAddress}</p>
        </div>
      </div>
    </footer>
  );
}
