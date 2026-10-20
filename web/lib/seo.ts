import type { Metadata } from 'next';
import { areasTaught, offlineVenuesForCity } from './classes';
import { SITE } from './site';
import { type Branch } from './branches';

/**
 * Search and share metadata for every page, in one place.
 *
 * WHY ONE HELPER
 * --------------
 * Next merges the metadata of a layout and its page shallowly: a page that sets
 * `openGraph` replaces the layout's whole `openGraph`, image included. Pages that
 * wrote their own `openGraph` therefore shared with no picture at all. Every page
 * goes through `pageMetadata` instead, so the picture, the site name and the
 * Twitter card can never be left behind.
 *
 * LENGTHS
 * -------
 * A search result shows about 60 characters of title and 155 of description. The
 * layout adds " | Shanti Kala Nikketan" (24 characters) to every page title, so a
 * page's own title has about 36 to work with. tests/seo.test.ts holds the limits.
 */

export const TITLE_LIMIT = 60;
export const DESCRIPTION_LIMIT = 160;

type SocialImage = { url: string; width?: number; height?: number; alt: string };

/** What a page shares when it has no picture of its own. */
export const DEFAULT_SOCIAL_IMAGE: SocialImage = {
  url: SITE.ogImage,
  width: 1200,
  height: 630,
  alt: 'The academy\u2019s Udaan 2025 class on stage, each holding a certificate',
};

/** The title as it appears in a result: the page's own, then the site name. */
export function fullTitle(title: string): string {
  return `${title} | ${SITE.name}`;
}

export type PageSeo = {
  /** The route, for the canonical link and the share URL. */
  path: string;
  title: string;
  description: string;
  image?: SocialImage;
  type?: 'website' | 'article';
  /** Kept out of search results. The sitemap leaves such pages out too. */
  noindex?: boolean;
  locale?: string;
};

export function pageMetadata(seo: PageSeo): Metadata {
  const image = seo.image ?? DEFAULT_SOCIAL_IMAGE;
  const shared = fullTitle(seo.title);

  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: seo.path },
    ...(seo.noindex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type: seo.type ?? 'website',
      siteName: SITE.name,
      locale: seo.locale ?? 'en_IN',
      title: shared,
      description: seo.description,
      url: `${SITE.url}${seo.path}`,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      title: shared,
      description: seo.description,
      images: [image.url],
    },
  };
}

/**
 * The home page's. Absolute (the layout's template would add the site name a
 * second time), and the only title that names the school before the town.
 */
export const HOME_SEO = {
  title: `Bharatanatyam Dance Academy Chennai | ${SITE.name}`,
  description:
    'Kalakshetra Bani Bharatanatyam, taught the Gurukulam way at five venues across Chennai since 2009, with an online class and a branch in Scarborough, Canada.',
};

/**
 * The static pages' search copy. The pages with something to compute (a branch's
 * name and venues) build theirs from `branchSeo` and `ONLINE_SEO` below.
 */
export const PAGE_SEO = {
  about: {
    path: '/about',
    title: 'About the Academy',
    description:
      'Founded in 2009, Shanti Kala Nikketan preserves and promotes Indian classical arts through the Gurukulam tradition and the Kalakshetra Bani of Bharatanatyam.',
  },
  lineage: {
    path: '/lineage',
    title: 'Our Lineage: Founder and Faculty',
    description:
      'The vision of founder Om \u2013 Guru \u2013 Om, the Kalakshetra training of Director Sunitta Menghanaani, and the faculty who teach the Gurukulam tradition.',
  },
  curriculum: {
    path: '/curriculum',
    title: 'Curriculum: Six Levels to Arangetram',
    description:
      'An Introductory Programme from age 3.5, six graded levels from Foundation to Mastery, and a dedicated Performance & Arangetram Programme.',
  },
  locations: {
    path: '/locations',
    title: 'Locations in Chennai and Scarborough',
    description:
      'Kalakshetra Bani Bharatanatyam at five venues across Chennai, plus an online batch and our branch at Morningside & Finch in Scarborough, Canada.',
  },
  events: {
    path: '/events',
    title: 'Events: Udaan and Arangetrams',
    description:
      'Udaan, Arangetrams, temple festivals and outreach: videos of the academy\u2019s own stages, a photograph gallery and its Instagram.',
  },
  gallery: {
    path: '/gallery',
    title: 'Gallery',
    description:
      'Photographs and videos from every class and batch, Udaan, Arangetrams and temple festivals. Find your child by venue and batch.',
  },
  book: {
    path: '/book',
    title: 'Book a session',
    description:
      'Tell us who is learning and where suits you, and we will suggest a batch. Children from 3.5, adults, online classes and residential communities.',
  },
  hastas: {
    path: '/hastas',
    title: 'The 28 Asamyuta Hastas',
    description:
      'The twenty-eight single-hand gestures of Bharatanatyam in Abhinaya Darpana order, each with its meaning, viniyoga and, where published, its shloka.',
    type: 'article',
    noindex: true,
  },
} satisfies Record<string, PageSeo>;

export const ONLINE_SEO = {
  path: '/locations/online',
  title: 'Online Bharatanatyam Group Class',
  description:
    'A live online Bharatanatyam group class for students anywhere: the Kalakshetra Bani syllabus of Shanti Kala Nikketan, taught in the Gurukulam manner.',
} satisfies PageSeo;

/** A branch page's search copy, built from the branch's own facts. */
export function branchSeo(branch: Branch): PageSeo {
  const areas = areasTaught(branch.slug);
  const venues = offlineVenuesForCity(branch.slug).length;
  const description =
    areas.length > 1
      ? `Kalakshetra Bani Bharatanatyam at ${venues} venues across ${branch.city}: ${areas.join(', ')}. From age 3.5 to Arangetram, and adults.`
      : `Kalakshetra Bani Bharatanatyam in ${branch.city}${branch.head ? `, led by ${branch.head}` : ''}. Group, individual and adults batches from age 3.5 to Arangetram.`;

  return {
    path: `/locations/${branch.slug}`,
    title: `Bharatanatyam Classes in ${branch.city}`,
    description,
    image: { url: branch.image, alt: `${SITE.name} in ${branch.city}` },
    locale: branch.countryCode === 'IN' ? 'en_IN' : 'en_CA',
  };
}
