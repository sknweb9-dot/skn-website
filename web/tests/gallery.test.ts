import { describe, expect, it } from 'vitest';
import {
  ALBUMS,
  ALL_ITEMS,
  GLOBE_ITEMS,
  NO_FILTER,
  PHOTOS,
  RECORDINGS,
  batchOptions,
  filterToQuery,
  groupOptions,
  indexSections,
  isFiltered,
  matches,
  queryToFilter,
  subOptions,
} from '@/lib/gallery';
import { galleryGraph } from '@/lib/schema';

const filterWith = (patch: Partial<typeof NO_FILTER>) => ({ ...NO_FILTER, ...patch });

describe('the gallery data', () => {
  it('has a photograph count in the range the academy asked for on the globe', () => {
    const onGlobe = PHOTOS.filter((p) => p.onGlobe).length;
    expect(onGlobe).toBeGreaterThanOrEqual(100);
    expect(onGlobe).toBeLessThanOrEqual(150);
  });

  it('puts every photograph in a known album', () => {
    for (const p of PHOTOS) expect(ALBUMS.some((a) => a.id === p.albumId)).toBe(true);
  });

  it('keeps every plate the globe carries, and the recordings, once', () => {
    expect(GLOBE_ITEMS.length).toBe(PHOTOS.filter((p) => p.onGlobe).length + RECORDINGS.length);
    expect(new Set(GLOBE_ITEMS.map((i) => i.id)).size).toBe(GLOBE_ITEMS.length);
  });

  it('carries every class photograph in the index, so a parent can find their child', () => {
    const classes = PHOTOS.filter((p) => p.group === 'classes');
    expect(classes.length).toBeGreaterThanOrEqual(40);
    expect(classes.every((p) => p.venueId && p.batches?.length)).toBe(true);
  });
});

describe('filters', () => {
  it('finds a batch by venue then batch code', () => {
    const f = filterWith({ group: 'classes', venue: 'appswamy-springs', batch: 'AS1' });
    const hits = ALL_ITEMS.filter((i) => matches(i, f));
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((i) => i.batches?.includes('AS1') && i.venueId === 'appswamy-springs')).toBe(true);
  });

  it('shows the same Casagrand Riviera photographs for either of its batches', () => {
    const r1 = ALL_ITEMS.filter((i) => matches(i, filterWith({ group: 'classes', batch: 'CG R1' })));
    const r2 = ALL_ITEMS.filter((i) => matches(i, filterWith({ group: 'classes', batch: 'CG R2' })));
    expect(r1.length).toBeGreaterThan(0);
    expect(r1.map((i) => i.id)).toEqual(r2.map((i) => i.id));
  });

  it('finds Sunitta\u2019s awards', () => {
    const hits = ALL_ITEMS.filter((i) => matches(i, filterWith({ group: 'sunitta', album: 'sunitta-awards' })));
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((i) => i.group === 'sunitta')).toBe(true);
  });

  it('searches by batch code, event name and year', () => {
    expect(ALL_ITEMS.some((i) => matches(i, filterWith({ query: 'AD1' })))).toBe(true);
    expect(ALL_ITEMS.some((i) => matches(i, filterWith({ query: 'udaan' })))).toBe(true);
    expect(ALL_ITEMS.some((i) => matches(i, filterWith({ query: '2013' })))).toBe(true);
    expect(ALL_ITEMS.some((i) => matches(i, filterWith({ query: 'zzzz' })))).toBe(false);
  });

  it('offers venues under Classes, batches under a venue, and events under the rest', () => {
    const venues = subOptions('classes');
    expect(venues?.kind).toBe('venue');
    expect(venues?.options.map((o) => o.id)).toContain('adroit');
    expect(batchOptions('adroit').map((o) => o.id)).toEqual(['AD1', 'AD2']);
    expect(batchOptions('adroit')[0].detail).toMatch(/Level 2/);
    expect(subOptions('sunitta')?.options.map((o) => o.id)).toContain('sunitta-awards');
    expect(subOptions('videos')).toBeNull();
  });

  it('counts every option from the items themselves', () => {
    const total = groupOptions().reduce((n, g) => n + g.count, 0);
    expect(total).toBe(ALL_ITEMS.length);
  });

  it('round-trips through the address bar and ignores nonsense', () => {
    const f = filterWith({ group: 'classes', venue: 'adroit', batch: 'AD1', query: 'pose' });
    expect(queryToFilter(`?${filterToQuery(f)}`)).toEqual(f);
    expect(queryToFilter('?group=bogus&venue=nowhere&batch=ZZ9')).toEqual(NO_FILTER);
    expect(isFiltered(NO_FILTER)).toBe(false);
    expect(isFiltered(f)).toBe(true);
  });
});

describe('the index', () => {
  it('lists every item exactly once, grouped by album', () => {
    const sections = indexSections(ALL_ITEMS);
    expect(sections.reduce((n, s) => n + s.items.length, 0)).toBe(ALL_ITEMS.length);
    expect(new Set(sections.map((s) => s.id)).size).toBe(sections.length);
  });

  it('leaves out albums with nothing in them under a filter', () => {
    const hits = ALL_ITEMS.filter((i) => matches(i, filterWith({ group: 'udaan' })));
    expect(indexSections(hits).map((s) => s.id).sort()).toEqual(['udaan-2023', 'udaan-2025']);
  });
});

describe('structured data', () => {
  it('describes one photograph per event album and none of the class photographs', () => {
    const graph = galleryGraph();
    const list = graph['@graph'].find((n) => String((n as { '@id'?: string })['@id']).endsWith('#collection')) as unknown as {
      mainEntity: { itemListElement: { item: { '@id': string } }[] };
    };
    const ids = list.mainEntity.itemListElement.map((e) => e.item['@id']);
    expect(ids.length).toBeLessThanOrEqual(ALBUMS.filter((a) => a.group !== 'classes').length);
    expect(ids.some((id) => id.includes('class-'))).toBe(false);
  });
});
