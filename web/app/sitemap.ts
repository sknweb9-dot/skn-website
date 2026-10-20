import type { MetadataRoute } from 'next';
import { BRANCHES, ONLINE } from '@/lib/branches';
import { PAGE_SEO, type PageSeo } from '@/lib/seo';
import { SITE } from '@/lib/site';

/**
 * Every page that may be indexed, and only those. The list is built from the
 * pages' own search copy, so a page that is marked noindex there (/hastas, which
 * is unlinked at the academy's request) cannot also be offered here: that would
 * send Google two contradictory signals. /performances and /photos are absent
 * because they redirect (next.config.ts).
 *
 * `lastModified` is the time of the build, which is when the content last changed.
 * Priority and change frequency are left out; Google ignores both.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const paths = [
    '/',
    ...(Object.values(PAGE_SEO) as PageSeo[]).filter((page) => !page.noindex).map((page) => page.path),
    ...BRANCHES.map((branch) => `/locations/${branch.slug}`),
    `/locations/${ONLINE.slug}`,
  ];

  return paths.map((path) => ({ url: path === '/' ? SITE.url : `${SITE.url}${path}`, lastModified }));
}
