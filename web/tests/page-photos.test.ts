import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { LEVELS } from '@/lib/curriculum';

const onDisk = (src: string) => existsSync(join(process.cwd(), 'public', src));

describe('level photographs', () => {
  it('has a file and a description for every level', () => {
    for (const level of LEVELS) {
      expect(onDisk(level.image), `${level.id}: ${level.image}`).toBe(true);
      expect(level.imageAlt?.trim(), `${level.id} alt`).toBeTruthy();
    }
  });

  it('says where each photograph was taken', () => {
    for (const level of LEVELS) expect(level.imageCaption?.trim(), `${level.id} caption`).toBeTruthy();
  });

  it('never repeats a picture across levels', () => {
    const srcs = LEVELS.map((l) => l.image);
    expect(new Set(srcs).size).toBe(srcs.length);
  });
});
