import type { CSSProperties } from 'react';
import Image from 'next/image';
import type { LocationPhoto } from '@/lib/locationPhotos';
import PhotoScroller from './PhotoScroller';

/**
 * The photographs of a place, laid out to suit how many there are, or nothing at
 * all when there are none.
 *
 * Returning null for an empty list is the whole of "if it is blank it should not
 * be visible": the page that renders this has no heading of its own for the
 * photographs, so an empty folder leaves no trace.
 *
 *   0       nothing
 *   1 or 2  at their own proportions, never cropped: a portrait and a landscape
 *           sit side by side at the same height (from a tablet up; stacked on a
 *           phone). A scroller for two photographs would have nothing to scroll
 *           to, and a fixed frame would cut the heads off a portrait.
 *   3+      PhotoScroller: two in view, the rest a swipe or a tap away. Its
 *           frames are fixed at 3:2, so give it landscape photographs.
 */
export default function LocationPhotos({
  photos,
  label,
}: {
  photos: LocationPhoto[];
  label: string;
}) {
  if (photos.length === 0) return null;

  if (photos.length > 2) return <PhotoScroller photos={photos} label={label} />;

  const ratios = photos.map((p) => p.width / p.height);
  const total = ratios.reduce((a, b) => a + b, 0);
  // Widest the page lets the row be, so a lone photograph is not blown up to it.
  const rowWidth = 1152;

  return (
    <ul
      aria-label={label}
      className="flex flex-col items-start gap-4 sm:flex-row"
      // One photograph: as wide as it would be at a comfortable height, no wider.
      style={photos.length === 1 ? { maxWidth: `${Math.min(48, ratios[0] * 30)}rem` } : undefined}
    >
      {photos.map((photo, i) => (
        <li
          key={photo.src}
          // Each takes a share of the row in proportion to its own shape, which
          // is what makes the two the same height.
          style={{ aspectRatio: `${photo.width} / ${photo.height}`, '--share': ratios[i] } as CSSProperties}
          className="relative w-full min-w-0 overflow-hidden rounded-[1.25rem] bg-silk sm:w-auto sm:[flex:var(--share)_1_0%]"
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes={`(max-width: 640px) 100vw, ${Math.round((rowWidth * ratios[i]) / total)}px`}
            className="object-cover"
          />
        </li>
      ))}
    </ul>
  );
}
