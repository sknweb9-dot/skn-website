import type { MetadataRoute } from 'next';
import { BRANCHES, SITE } from '@/lib/site';

/**
 * Priorities reflect what we most want ranking, not an even spread.
 *
 * The home page and the founding-school location page carry the commercial
 * intent. /events is close behind: it is where the photographs and the Udaan
 * record live, so it is the page most likely to be shared and linked.
 *
 * /hastas is deliberately ABSENT. It still resolves, but it is unlinked and
 * noindexed at the academy's request — listing it in the sitemap while telling
 * robots not to index it sends Google two contradictory signals.
 *
 * /performances is absent because it no longer exists as a page; next.config.ts
 * 308s it to /events.
 */
const ROUTES: { path: string; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }[] = [
  { path: '/locations', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/curriculum', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/events', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/about', changeFrequency: 'yearly', priority: 0.6 },
  { path: '/lineage', changeFrequency: 'yearly', priority: 0.6 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: SITE.url,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...ROUTES.map((route) => ({
      url: `${SITE.url}${route.path}`,
      lastModified,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...BRANCHES.map((branch) => ({
      url: `${SITE.url}/locations/${branch.slug}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      // The founding school is the page we most want ranking for Chennai.
      priority: branch.isPrimary ? 0.9 : 0.7,
    })),
  ];
}
