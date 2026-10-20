import { COLOR, TEX_LONG } from './tuning';

/** The canvases the globe's plates are drawn from. */

/**
 * The play affordance drawn onto video plates.
 *
 * A plate that zooms in and a plate that leaves for YouTube must not look
 * identical — that is the whole argument for the hover label, and it applies
 * doubly before the pointer ever arrives. A ring and triangle in marigold, low
 * on the plate so it does not sit over a face.
 */
function drawPlayGlyph(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const r = Math.min(w, h) * 0.1;
  const cx = w / 2;
  const cy = h - r * 1.7;

  ctx.save();
  ctx.fillStyle = 'rgba(251, 248, 241, 0.88)';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = COLOR.marigold;
  ctx.lineWidth = Math.max(2, r * 0.1);
  ctx.stroke();

  ctx.fillStyle = COLOR.teal;
  ctx.beginPath();
  const t = r * 0.46;
  ctx.moveTo(cx - t * 0.7, cy - t);
  ctx.lineTo(cx - t * 0.7, cy + t);
  ctx.lineTo(cx + t * 0.95, cy);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/**
 * A plate is the whole photograph and nothing else.
 *
 * The canvas is the image's own size, so no crop, no letterbox, and no arch mask.
 * The previous version clipped every plate to the temple arch, which was
 * genuinely handsome and genuinely wrong: a third of these images are posters and
 * invitation cards whose text runs to the margins, and the arch cut the top
 * corners off — which on a poster is where the title sits. The sphere gives up
 * some of its uniformity and gets back the ability to be read.
 *
 * What survives of the treatment is the marigold hairline, drawn on the inside
 * edge so plates read as mounted rather than as floating cut-outs.
 */
export function buildPlate(img: HTMLImageElement, isVideo: boolean): HTMLCanvasElement {
  const w = img.naturalWidth || TEX_LONG;
  const h = img.naturalHeight || TEX_LONG;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.drawImage(img, 0, 0, w, h);

  // Warm the photograph toward the page's palette so a hundred-odd plates read as
  // one object rather than a contact sheet. Very light: 6% silk.
  ctx.fillStyle = 'rgba(244, 235, 217, 0.06)';
  ctx.fillRect(0, 0, w, h);

  if (isVideo) drawPlayGlyph(ctx, w, h);

  // Hairline inset by half its width so the whole stroke lands on the plate
  // rather than half of it falling off the edge.
  const line = isVideo ? 4 : 3;
  ctx.strokeStyle = isVideo ? COLOR.marigold : 'rgba(236, 154, 41, 0.66)';
  ctx.lineWidth = line;
  ctx.strokeRect(line / 2, line / 2, w - line, h - line);

  return canvas;
}

/**
 * Shown until the real plate lands. A quiet cream wash — deliberately dull,
 * because a hundred of these appearing at once would otherwise read as an error
 * state. Square, and stretched to whatever plate shape needs it; a flat gradient
 * does not care.
 */
export function buildFallbackPlate(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const grad = ctx.createLinearGradient(0, 0, 0, 64);
  grad.addColorStop(0, COLOR.cream);
  grad.addColorStop(1, COLOR.silk);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  ctx.strokeStyle = 'rgba(236, 154, 41, 0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, 62, 62);

  return canvas;
}

