import { describe, expect, it } from 'vitest';
import sitemap from '@/app/sitemap';
import {
  DESCRIPTION_LIMIT,
  HOME_SEO,
  ONLINE_SEO,
  PAGE_SEO,
  TITLE_LIMIT,
  branchSeo,
  fullTitle,
  pageMetadata,
  type PageSeo,
} from '@/lib/seo';
import {
  bookGraph,
  eventsGraph,
  galleryGraph,
  hastasGraph,
  homeGraph,
  locationGraph,
  onlineGraph,
} from '@/lib/schema';
import { BRANCHES } from '@/lib/branches';
import { SITE } from '@/lib/site';

const PAGES: { name: string; seo: PageSeo }[] = [
  ...Object.entries(PAGE_SEO).map(([name, seo]) => ({ name, seo: seo as PageSeo })),
  { name: 'online', seo: ONLINE_SEO },
  ...BRANCHES.map((b) => ({ name: `branch ${b.slug}`, seo: branchSeo(b) })),
];

describe('search copy', () => {
  it.each(PAGES)('$name fits a result: title and description within limits', ({ seo }) => {
    expect(fullTitle(seo.title).length).toBeLessThanOrEqual(TITLE_LIMIT);
    expect(seo.description.length).toBeLessThanOrEqual(DESCRIPTION_LIMIT);
    expect(seo.description.length).toBeGreaterThan(60);
  });

  it('gives the home page a title and description that fit as well', () => {
    expect(HOME_SEO.title.length).toBeLessThanOrEqual(TITLE_LIMIT);
    expect(HOME_SEO.description.length).toBeLessThanOrEqual(DESCRIPTION_LIMIT);
  });

  it('never gives two pages the same title or description', () => {
    const titles = [HOME_SEO.title, ...PAGES.map((p) => fullTitle(p.seo.title))];
    const descriptions = [HOME_SEO.description, ...PAGES.map((p) => p.seo.description)];
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });
});

describe('pageMetadata', () => {
  it.each(PAGES)('$name always shares a picture, a canonical and a Twitter card', ({ seo }) => {
    const meta = pageMetadata(seo);
    expect(meta.alternates?.canonical).toBe(seo.path);
    const images = (meta.openGraph as { images?: unknown[] }).images ?? [];
    expect(images.length).toBe(1);
    expect((meta.twitter as { images?: string[] }).images?.length).toBe(1);
    expect((meta.openGraph as { url?: string }).url).toBe(`${SITE.url}${seo.path}`);
  });

  it('keeps a noindex page out of search', () => {
    expect(pageMetadata(PAGE_SEO.hastas).robots).toEqual({ index: false, follow: false });
    expect(pageMetadata(PAGE_SEO.about).robots).toBeUndefined();
  });
});

describe('sitemap', () => {
  const listed = sitemap().map((entry) => new URL(entry.url).pathname.replace(/\/$/, '') || '/');

  it('lists every indexable page once, and none that is noindex', () => {
    const wanted = PAGES.filter((p) => !p.seo.noindex).map((p) => p.seo.path);
    for (const path of ['/', ...wanted]) expect(listed).toContain(path);
    expect(listed).not.toContain(PAGE_SEO.hastas.path);
    expect(new Set(listed).size).toBe(listed.length);
  });
});

describe('structured data', () => {
  type Graph = { '@graph': unknown[] };
  const graphs: [string, Graph][] = [
    ['home', homeGraph()],
    ['book', bookGraph()],
    ['hastas', hastasGraph()],
    ['events', eventsGraph()],
    ['gallery', galleryGraph()],
    ['online', onlineGraph()],
    ...BRANCHES.map((b): [string, Graph] => [`location ${b.slug}`, locationGraph(b)]),
  ];

  /** Every `{ "@id": x }` that is only a reference, wherever it sits. */
  function references(node: unknown, out: string[] = []): string[] {
    if (Array.isArray(node)) node.forEach((n) => references(n, out));
    else if (node && typeof node === 'object') {
      const keys = Object.keys(node);
      if (keys.length === 1 && keys[0] === '@id') out.push((node as { '@id': string })['@id']);
      else Object.values(node).forEach((v) => references(v, out));
    }
    return out;
  }

  it.each(graphs)('%s: every reference points at a node on the same page', (_name, graph) => {
    const nodes = graph['@graph'] as { '@id'?: string }[];
    const ids = new Set(nodes.map((n) => n['@id']).filter(Boolean));
    const dangling = references(nodes).filter((id) => !ids.has(id));
    expect(dangling).toEqual([]);
  });

  it.each(graphs)('%s: no node id is used twice, and nothing serialises to null', (_name, graph) => {
    const ids = (graph['@graph'] as { '@id'?: string }[]).map((n) => n['@id']).filter(Boolean);
    expect(new Set(ids).size).toBe(ids.length);
    expect(JSON.stringify(graph)).not.toMatch(/:null|undefined|NaN/);
  });
});
