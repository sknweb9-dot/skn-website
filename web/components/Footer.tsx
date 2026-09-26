import Image from 'next/image';
import Link from 'next/link';
import { BRANCHES, NAV_ROUTES, SITE } from '@/lib/site';
import { FacebookIcon, InstagramIcon, YoutubeIcon } from './SocialIcons';

const SOCIALS = [
  { name: 'Instagram', href: SITE.socials.instagram, Icon: InstagramIcon },
  { name: 'Facebook', href: SITE.socials.facebook, Icon: FacebookIcon },
  { name: 'YouTube', href: SITE.socials.youtube, Icon: YoutubeIcon },
];

const ROUTES = NAV_ROUTES;

/**
 * The footer sits on the .ground-deep band — see globals.css for the measured
 * contrast of every colour used here. Two rules that follow from those numbers:
 * nothing inside is kumkum (1.76:1 on teal-deep), and every hover moves toward
 * full cream rather than toward an accent.
 *
 * The figures row that used to open the footer (years, students, stages) was
 * removed at the academy's request: it repeated on every page, and the student
 * count is not something they track. The street address went with it, for
 * privacy - every Chennai venue is a residential complex.
 */
export default function Footer() {
  return (
    <footer className="ground-deep border-t-[3px] border-marigold">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              {/* On a cream disc, not straight on the band. The approved emblem's
                  navy Ganesha and cobalt rings are close in lightness to teal-deep
                  and disappear on it; the cream behind them keeps the mark whole. */}
              <span className="grid size-14 shrink-0 place-items-center rounded-full bg-cream">
                <Image src="/img/logo-emblem.png" alt="" width={44} height={44} className="size-11" />
              </span>
              <span className="leading-tight">
                <span className="block font-display text-base font-semibold text-cream">
                  {SITE.name}
                </span>
                <span className="block font-sans text-micro tracking-[0.2em] text-cream/70 uppercase">
                  {SITE.tagline}
                </span>
              </span>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-cream/80">{SITE.signature}</p>
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
                <span className="text-cream/70"> · India</span>
              </p>
              {BRANCHES.filter((b) => b.contact).map((b) => (
                <p key={b.slug}>
                  <a
                    href={`tel:${b.contact!.phoneE164}`}
                    className="text-cream underline decoration-marigold/60 underline-offset-4 hover:decoration-marigold"
                  >
                    {b.contact!.phoneDisplay}
                  </a>
                  <span className="text-cream/70"> · {b.country}</span>
                </p>
              ))}
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

            {/* Brand marks rather than words, with a 44px target each. The name is
                the accessible label, so screen readers hear "Instagram" etc. */}
            <ul className="-ml-2.5 mt-6 flex gap-1">
              {SOCIALS.map(({ name, href, Icon }) => (
                <li key={name}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${SITE.name} on ${name}`}
                    className="grid size-11 place-items-center rounded-full text-cream/80 transition-colors hover:bg-cream/10 hover:text-cream"
                  >
                    <Icon className="size-5" />
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
        </div>
      </div>
    </footer>
  );
}
