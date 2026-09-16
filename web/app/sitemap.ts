import type { MetadataRoute } from 'next';
import { BRANCHES, SITE } from '@/lib/site';

/**
 * Priorities reflect what we most want ranking, not an even spread.
 *
 * The home page and the founding-school location page carry the commercial
 * intent. /hastas is lower priority but deliberately included: it is the one
 * page with reference value beyond the academy's own catchment, so it is the
 * likeliest to earn links.
 */
const ROUTES: { path: string; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }[] = [
  { path: '/locations', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/curriculum', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/about', changeFrequency: 'yearly', priority: 0.6 },
  { path: '/lineage', changeFrequency: 'yearly', priority: 0.6 },
  { path: '/performances', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/hastas', changeFrequency: 'yearly', priority: 0.5 },
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
