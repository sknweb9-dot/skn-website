import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { imageSize } from './imageSize';

/**
 * Photographs for the location pages, found by looking in a folder.
 *
 * HOW TO ADD PHOTOS
 * -----------------
 * Drop image files (.jpg, .jpeg, .png, .webp, .avif) into the folder for the
 * place and rebuild. They appear on that page, in file-name order, so a number
 * at the front of the name (01-, 02-) sets the order. Nothing else needs
 * editing. While a folder holds no images, nothing is drawn for it: no heading,
 * no empty frame, no gap.
 *
 *   public/img/locations/chennai/      the strip on the Chennai page
 *   public/img/locations/scarborough/  the strip on the Scarborough page
 *   public/img/locations/online/       the first image is the card's picture on
 *                                      /locations; the rest are the page's own
 *                                      photographs
 *   public/img/locations/individual/   the portraits beside "taught individually"
 *
 * Use upright photographs (not camera originals with a rotation flag): the
 * layout reads each file's proportions from its header.
 *
 * This runs at build time, in server components only (it reads the disk), and
 * every page that calls it is prerendered, so the deployed site never touches
 * the file system.
 *
 * WHY THE FILE NAMES ARE NEUTRAL
 * ------------------------------
 * The site does not name its students. Alt text is written here from the place,
 * never from the file name, so a name in a file does not leak onto the page.
 */

export type LocationFolder = 'chennai' | 'scarborough' | 'online' | 'individual';

/** `width` and `height` are the file's own, so a portrait stays a portrait. */
export type LocationPhoto = { src: string; alt: string; width: number; height: number };

/** What an unreadable file is laid out as. */
const FALLBACK = { width: 3, height: 2 };

const IMAGE = /\.(jpe?g|png|webp|avif)$/i;
const ROOT = path.join(process.cwd(), 'public', 'img', 'locations');

/**
 * @param altBase What the photographs show, e.g. "A class at Shanti Kala
 *   Nikketan, Chennai". With more than one photograph each gets "(2 of 5)" so a
 *   screen reader does not read the same sentence five times.
 */
export function locationPhotos(folder: LocationFolder, altBase: string): LocationPhoto[] {
  let names: string[];
  try {
    names = readdirSync(path.join(ROOT, folder));
  } catch {
    return [];
  }

  const files = names
    .filter((name) => IMAGE.test(name))
    .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));

  return files.map((name, i) => {
    let size = FALLBACK;
    try {
      size = imageSize(readFileSync(path.join(ROOT, folder, name))) ?? FALLBACK;
    } catch {
      // Unreadable: the frame falls back to 3:2 and the image still loads.
    }
    return {
      src: `/img/locations/${folder}/${encodeURIComponent(name)}`,
      alt: files.length > 1 ? `${altBase} (${i + 1} of ${files.length})` : altBase,
      ...size,
    };
  });
}
