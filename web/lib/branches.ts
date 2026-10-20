/**
 * The academy's places: the branches (a branch is a physical school with an
 * address-level identity) and the online group class, which has a page of its
 * own but is not one. The batches taught at each live in ./classes.ts.
 */

// Branches
// ---------------------------------------------------------------------------

export type Branch = {
  /** URL segment for /locations/[city] */
  slug: string;
  /** Short label used in navigation */
  label: string;
  /** The city name used in headings and schema addressLocality */
  city: string;
  /** Neighbourhood or campus, when the academy has published one */
  locality?: string;
  region: string;
  regionCode: string;
  country: string;
  countryCode: string;
  postalCode?: string;
  streetAddress?: string;
  /**
   * Coordinates. Present only where the academy has published an address
   * precise enough to place. Locality-level accuracy is noted per branch.
   */
  geo?: { lat: number; lng: number; precision: 'street' | 'locality' };
  /** Head of branch, where named on the academy's own site */
  head?: string;
  /**
   * The branch's own contact line, where it has one. Absent means the academy's
   * main number and email in SITE apply.
   */
  contact?: { phoneDisplay: string; phoneE164: string; email: string };
  isPrimary: boolean;
  /** One-line positioning used in hero copy on the branch page */
  intro: string;
  /**
   * Neighbourhoods students travel from, for `areaServed` and on-page copy.
   *
   * These are catchment areas, NOT venues. The venues are in ./classes.ts, and
   * some of these names now appear in both — Thiruvanmiyur and Medavakkam have
   * real venues as well as being catchment. Do not infer a studio from an entry
   * here.
   */
  areaServed: string[];
  /** Landmarks a local parent would orient by */
  landmarks: string[];
  formats: string[];
  image: string;
};

export const BRANCHES: Branch[] = [
  {
    slug: 'chennai',
    label: 'Chennai',
    city: 'Chennai',
    locality: 'Sholinganallur',
    region: 'Tamil Nadu',
    regionCode: 'TN',
    country: 'India',
    countryCode: 'IN',
    postalCode: '600119',
    // No street address, on purpose. Every Chennai venue is a residential
    // complex, and the academy asked for the exact building address to come off
    // the public site to avoid trouble with the property. Locality + postcode is
    // what the schema carries now, and it is what a parent needs to judge
    // distance; the venue itself is shared once a family gets in touch.
    geo: { lat: 12.901, lng: 80.2279, precision: 'locality' },
    head: 'Smt. Sunitta Menghanaani',
    isPrimary: true,
    intro:
      'Where Shanti Kala Nikketan began in 2009, and now five venues across Thiruvanmiyur, Sholinganallur and Medavakkam — the Kalakshetra Bani taught in the Gurukulam manner.',
    areaServed: [
      'Sholinganallur',
      'Thiruvanmiyur',
      'Medavakkam',
      'Perungudi',
      'Thoraipakkam',
      'Karapakkam',
      'Navalur',
      'Siruseri',
      'Velachery',
      'Adyar',
      'Pallikaranai',
    ],
    // Kelambakkam and Egattur were removed from this list at the academy's
    // request. The venue-level landmarks were removed with the street address.
    landmarks: ['Off Rajiv Gandhi Salai (OMR)', 'Sholinganallur Junction'],
    formats: ['Group classes', 'Individual classes', 'Theory and Sanskrit viniyoga'],
    image: '/img/hero-gurukulam.jpg',
  },
  {
    slug: 'scarborough',
    label: 'Scarborough, Canada',
    city: 'Scarborough',
    locality: 'Morningside & Finch',
    region: 'Ontario',
    regionCode: 'ON',
    country: 'Canada',
    countryCode: 'CA',
    // The academy publishes the intersection, not a street address. We do not
    // invent one; schema carries locality + region only.
    geo: { lat: 43.801, lng: -79.2166, precision: 'locality' },
    head: 'S. Kirusanthini',
    // From the academy's International brochure, 2026-27.
    contact: { phoneDisplay: '+1 416 892 4427', phoneE164: '+14168924427', email: 'intlskn@gmail.com' },
    isPrimary: false,
    intro:
      'Our Canadian branch, running individual and group classes at Morningside and Finch under Kalakshetra-trained faculty.',
    areaServed: [
      'Scarborough',
      'Malvern',
      'Morningside Heights',
      'Markham',
      'Pickering',
      'Ajax',
      'North York',
      'Greater Toronto Area',
    ],
    landmarks: ['Morningside Avenue & Finch Avenue East', 'Malvern Town Centre'],
    formats: ['Group classes', 'Individual classes'],
    image: '/img/event-canada.jpg',
  },
  // The Delhi branch is closed. It has been removed rather than marked inactive,
  // per the academy's instruction that it not appear anywhere on the site.
];

/**
 * The online group class, which has a page and a card of its own beside the
 * branches but is not one of them: it is not a place, so it has no address,
 * coordinates or opening hours, and it is deliberately left out of BRANCHES so
 * that none of the places that list the academy's physical locations (the
 * schema.org `location` array, the founding-school lookups) can pick it up.
 *
 * Its batches live in ./classes.ts under `citySlug: 'online'`.
 */
export const ONLINE = {
  slug: 'online',
  label: 'Online',
  /** Heading on the card and the page. */
  title: 'Online group class',
  /** The small line over the heading, where a branch has "region, country". */
  eyebrow: 'Live, from anywhere',
  intro:
    'Live group classes over video, open to students anywhere. The same Kalakshetra Bani syllabus as our Chennai and Scarborough batches, taught in the Gurukulam manner.',
  /** The batch timings are Indian time. Said once, on the page. */
  timezone: 'IST',
  timezoneName: 'Indian Standard Time',
} as const;

export const PRIMARY_BRANCH = BRANCHES[0];

export function branchBySlug(slug: string): Branch | undefined {
  return BRANCHES.find((b) => b.slug === slug);
}
