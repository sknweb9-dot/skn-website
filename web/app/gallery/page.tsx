import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import GalleryExplorer from '@/components/gallery/GalleryExplorer';
import { PageHero, PageShell } from '@/components/PageShell';
import { ALL_ITEMS, PHOTOS } from '@/lib/gallery';
import { galleryGraph } from '@/lib/schema';
import { PAGE_SEO, pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata(PAGE_SEO.gallery);

/**
 * The gallery: a globe to turn, and under it every photograph, filterable down to
 * a single class so a parent can find their child. It used to be a section of
 * /events; the album names and dates here are the academy's own (lib/gallery.ts).
 */
export default function GalleryPage() {
  return (
    <PageShell>
      <JsonLd data={galleryGraph()} />

      <PageHero
        eyebrow="The gallery"
        title="Every stage,"
        accent="every class"
        lede={`${PHOTOS.length} photographs and ${ALL_ITEMS.length - PHOTOS.length} videos, every one the academy's own. Turn the globe, or filter by venue and batch to find your child.`}
      />

      <GalleryExplorer />
    </PageShell>
  );
}
