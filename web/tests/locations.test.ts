import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  VENUES,
  formatBatchTime,
  offlineVenuesForCity,
  venuesForCity,
} from '@/lib/classes';
import { imageSize } from '@/lib/imageSize';
import { locationPhotos } from '@/lib/locationPhotos';
import { BRANCHES, ONLINE } from '@/lib/branches';

const batch = (code: string) => {
  const found = VENUES.flatMap((v) => v.batches).find((b) => b.code === code);
  if (!found) throw new Error(`no batch ${code}`);
  return found;
};

describe('Canada timings', () => {
  it('are the ones the academy confirmed', () => {
    expect(formatBatchTime(batch('CA1'))).toBe('Sat \u00b7 6 pm \u2013 7 pm');
    expect(formatBatchTime(batch('CA2'))).toBe('Sun \u00b7 5 pm \u2013 6 pm');
    expect(formatBatchTime(batch('CA3'))).toBe('Sun \u00b7 5 pm \u2013 6 pm');
  });

  it('keep everything else about the batches as it was', () => {
    expect(batch('CA1')).toMatchObject({ programmeId: 'level-1', audience: 'children', admissionOpen: true });
    expect(batch('CA2')).toMatchObject({ programmeId: 'level-1', audience: 'adults', admissionOpen: true });
    expect(batch('CA3')).toMatchObject({ programmeId: 'introductory', audience: 'children', admissionOpen: true });
  });
});

describe('the online group class', () => {
  it('belongs to the online location, not to Chennai', () => {
    expect(venuesForCity(ONLINE.slug).map((v) => v.id)).toEqual(['online-group']);
    expect(venuesForCity('chennai').some((v) => v.mode === 'online')).toBe(false);
    expect(offlineVenuesForCity('chennai')).toHaveLength(5);
  });

  it('is not a branch', () => {
    expect(BRANCHES.some((b) => b.slug === ONLINE.slug)).toBe(false);
  });
});

describe('location photographs', () => {
  it('finds the five Chennai photographs, in the order the academy gave them', () => {
    const photos = locationPhotos('chennai', 'A class');
    expect(photos).toHaveLength(5);
    expect(photos.map((p) => p.src.split('/').pop())).toEqual([
      '01-as2-6152.jpg',
      '02-as4-6345.jpg',
      '03-pc1-5100.jpg',
      '04-pc2-5146.jpg',
      '05-ad2-5297.jpg',
    ]);
  });

  it('numbers the alt text when there is more than one, and never uses the file name', () => {
    const photos = locationPhotos('chennai', 'A class');
    expect(photos[1].alt).toBe('A class (2 of 5)');
  });

  it('returns nothing for a folder that does not exist', () => {
    // Scarborough and online are filled by the academy later, so they cannot be
    // asserted empty here; a folder that is not there stands in for "blank".
    expect(locationPhotos('nowhere' as never, 'x')).toEqual([]);
  });
});

describe('photograph proportions', () => {
  it('reads each photograph\'s own size, so a portrait stays a portrait', () => {
    const [first] = locationPhotos('chennai', 'x');
    expect(first).toMatchObject({ width: 1400, height: 933 });
    for (const photo of locationPhotos('individual', 'x')) {
      expect(photo.height).toBeGreaterThan(photo.width);
    }
  });

  it('reads JPEG, PNG and WebP headers, and gives up politely on anything else', () => {
    const root = 'public/img';
    expect(imageSize(readFileSync(`${root}/locations/chennai/01-as2-6152.jpg`))).toEqual({ width: 1400, height: 933 });
    expect(imageSize(readFileSync(`${root}/globe/class-as2-dsc6201.webp`))).toMatchObject({ width: expect.any(Number) });
    expect(imageSize(Buffer.from('not an image at all, not even close'))).toBeUndefined();
    // A 3 x 2 PNG header, assembled by hand.
    const png = Buffer.alloc(24);
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(png);
    png.writeUInt32BE(3, 16);
    png.writeUInt32BE(2, 20);
    expect(imageSize(png)).toEqual({ width: 3, height: 2 });
  });
});
