/**
 * Width and height of an image, read from its header, with no dependency.
 *
 * The location pages lay one or two photographs out at their own proportions
 * (a portrait beside a landscape, side by side at the same height), which needs
 * the proportions at build time. Supports JPEG, PNG and WebP, which is what the
 * folders in public/img/locations hold. Anything else returns undefined and the
 * caller falls back to a 3:2 frame.
 *
 * It reports the stored size, not the size after an EXIF rotation. Photographs
 * dropped into those folders should be upright already (export them from the
 * photo editor, or any phone gallery, rather than copying the camera original).
 */

export type ImageSize = { width: number; height: number };

function jpeg(b: Buffer): ImageSize | undefined {
  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = b[i + 1];
    // Start-of-frame markers carry the size; 0xC4, 0xC8 and 0xCC share the range
    // but are not frames.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: b.readUInt16BE(i + 5), width: b.readUInt16BE(i + 7) };
    }
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      i += 2;
    } else {
      i += 2 + b.readUInt16BE(i + 2);
    }
  }
  return undefined;
}

function png(b: Buffer): ImageSize | undefined {
  return b.length >= 24 ? { width: b.readUInt32BE(16), height: b.readUInt32BE(20) } : undefined;
}

function webp(b: Buffer): ImageSize | undefined {
  if (b.length < 30) return undefined;
  const kind = b.toString('ascii', 12, 16);
  if (kind === 'VP8X') {
    return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
  }
  if (kind === 'VP8L') {
    const bits = b.readUInt32LE(21);
    return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >> 14) & 0x3fff) };
  }
  if (kind === 'VP8 ') {
    return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
  }
  return undefined;
}

export function imageSize(b: Buffer): ImageSize | undefined {
  let size: ImageSize | undefined;
  if (b[0] === 0xff && b[1] === 0xd8) size = jpeg(b);
  else if (b.toString('ascii', 1, 4) === 'PNG') size = png(b);
  else if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') size = webp(b);
  return size && size.width > 0 && size.height > 0 ? size : undefined;
}
