/**
 * The academy itself: name, contact, figures and the masthead's routes.
 *
 * Every fact below is transcribed from the academy's own published material
 * (crawled into ../../_research). Do not add unsourced claims here: this file
 * feeds both the visible copy and the Schema.org JSON-LD, so anything invented
 * becomes a structured-data misrepresentation.
 */

export const SITE = {
  name: 'Shanti Kala Nikketan',
  legalName: 'Shanti Kala Nikketan Academy of Fine Arts',
  tagline: 'Academy of Fine Arts',
  /**
   * The academy's own one-line description, supplied by the director. Used as
   * the home page subtext and the footer line on every page, so it is defined
   * once and cannot drift between them.
   */
  signature: 'Bharatanatyam, Kalakshetra Bani since 2009',
  url: 'https://www.shantikalanikketan.com',
  founded: '2009-04-18',
  email: 'shantikalanikketan@gmail.com',
  phoneDisplay: '+91 98840 22306',
  phoneE164: '+919884022306',
  style: 'Kalakshetra Bani of Bharatanatyam',
  method: 'Gurukulam',
  logo: '/img/logo-emblem.png',
  /**
   * The link-preview card: what a chat app shows above the title when the
   * site's address is pasted into a message. Cut by
   * _research/make_og_image.py, 1200 x 630. It has a name of its own because
   * readers cache a preview by its image address, and a new one is fetched.
   */
  ogImage: '/img/og-home.jpg',
  socials: {
    instagram: 'https://www.instagram.com/shantikalanikketan',
    facebook: 'https://www.facebook.com/shantikalanikketan',
    youtube: 'https://www.youtube.com/channel/UCDGm0LQ-24ZIKG-2DUAn2ew',
  },
} as const;

/** Years of unbroken teaching, derived from the founding date rather than hardcoded. */
export function yearsOfLineage(now: Date = new Date()): number {
  const start = new Date(SITE.founded);
  let years = now.getFullYear() - start.getFullYear();
  const beforeAnniversary =
    now.getMonth() < start.getMonth() ||
    (now.getMonth() === start.getMonth() && now.getDate() < start.getDate());
  if (beforeAnniversary) years -= 1;
  return years;
}

/**
 * Owner-supplied figures. Update here when the academy reports new numbers.
 *
 * The site once showed "324 students taught", which the academy asked to have
 * removed because that exact count was not tracked. The figure below is the
 * academy's own confirmed total across all years, and is shown as "1500+".
 * Neither figure is in the Schema.org graph.
 */
export const METRICS = {
  /** Shown as "1,500+". Confirmed by the academy, October 2026. */
  studentsTaught: 1500,
  /** Shown as "20+". */
  stages: 20,
  /**
   * Countries where the academy has students: India, Canada, and the USA
   * (online). This is student reach, as the academy counts it — not branches,
   * of which there are two.
   */
  countries: 3,
} as const;

/**
 * The site's routes, in narrative order: who we are, where we came from, what
 * is taught, the stage, the address.
 *
 * Canonical for the masthead, the mobile menu and the footer, and each page has
 * exactly ONE name in all three. There used to be a long `label` ("The academy",
 * "Our lineage", "Events & gallery") for the footer and menu and a `short` one
 * for the masthead, so the same link read differently depending on where you
 * met it. The short names are the ones the academy chose in its revision plan
 * (Academy, Lineage, Curriculum, Locations, Events), and they fit the masthead,
 * so they are the only names.
 *
 * TWO ROUTES LEFT THIS LIST, and neither was deleted:
 *
 *   /hastas       still resolves and still carries all twenty-eight gestures,
 *                 but is unlinked and noindexed at the academy's request. See
 *                 the note at the top of app/hastas/page.tsx before reviving it.
 *   /performances folded into /events, which now carries the Udaan copy, the
 *                 Arangetrams and the gallery. next.config.ts 308s the old path
 *                 so inbound links still land.
 *
 * The list was five items after those two left. /gallery has since joined it as
 * the sixth, once the globe and the photographs got a page of their own; the
 * inline masthead only shows from `lg`, and the full-screen menu covers the rest.
 *
 * Home leads it. The logo already links home, but not everyone knows a logo is a
 * link, so the word is there too: in the masthead, the menu and the footer, which
 * all read this list.
 */
export const NAV_ROUTES = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'Academy' },
  { href: '/lineage', label: 'Lineage' },
  { href: '/curriculum', label: 'Curriculum' },
  // Locations before Events, at the academy's request: a parent reading the
  // levels on /curriculum is looking for a batch next, not a gallery.
  { href: '/locations', label: 'Locations' },
  { href: '/events', label: 'Events' },
  { href: '/gallery', label: 'Gallery' },
] as const;

// Booking lives in ./booking.ts: the enquiry flow's rules, the /book URL and
// the label every booking button uses.
