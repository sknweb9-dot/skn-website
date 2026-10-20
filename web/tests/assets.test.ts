import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The images the code names, and the images that are in public/, must be the same
 * set. A path that points at nothing is a broken picture; a file nothing points
 * at is weight in the repository and in every deploy.
 *
 * Out of scope on purpose: public/img/gallery and public/img/globe (their files
 * are named by lib/gallery.data.ts and lib/events.ts, which tests/gallery.test.ts
 * and the guards in those files already hold to account), public/img/locations
 * (a folder the academy fills; lib/locationPhotos.ts finds what is there) and
 * public/frames (numbered by lib/mudras.ts).
 */

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, 'public');
const SOURCE_DIRS = ['app', 'components', 'lib'];
const SOURCE_EXT = /\.(ts|tsx|css)$/;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const sources = SOURCE_DIRS.flatMap((d) => walk(path.join(ROOT, d)))
  .filter((f) => SOURCE_EXT.test(f))
  .map((f) => readFileSync(f, 'utf8'));
const allSource = sources.join('\n');

const IMAGE_PATH = /["'`(](\/img\/[A-Za-z0-9_\-./]+\.(?:jpe?g|png|webp|avif|svg))/g;

describe('image paths', () => {
  it('every /img path written in the code is a file in public/', () => {
    const missing = new Set<string>();
    for (const source of sources) {
      for (const match of source.matchAll(IMAGE_PATH)) {
        if (!existsSync(path.join(PUBLIC, match[1]))) missing.add(match[1]);
      }
    }
    expect([...missing]).toEqual([]);
  });

  it('every file in public/img (outside the folders named above) is used by the code', () => {
    const skip = ['gallery', 'globe', 'locations'].map((d) => path.join(PUBLIC, 'img', d));
    const orphans = walk(path.join(PUBLIC, 'img'))
      .filter((f) => !skip.some((s) => f.startsWith(s + path.sep)))
      .map((f) => '/' + path.relative(PUBLIC, f).split(path.sep).join('/'))
      .filter((rel) => !allSource.includes(rel));
    expect(orphans).toEqual([]);
  });
});
