/**
 * Watermark node (MVP)
 * Draws a simple text or PNG watermark onto a canvas for each item.
 * Input: array of { item, exif, edits?, bitmap?: ImageBitmap|HTMLImageElement|OffscreenCanvas }
 * Output: array of same records with { canvas } holding the watermarked image
 *
 * Notes:
 * - For MVP, if no bitmap/canvas is provided, we attempt to create an Image from a Blob/File URL.
 * - Position: 'tl'|'tr'|'bl'|'br' (top-left, top-right, bottom-left, bottom-right)
 */
export async function nodeWatermark({ inputs, params, context, onProgress }) {
  const list = Array.isArray(inputs?.[0]) ? inputs[0] : [];
  const {
    type = 'text', // 'text'|'png'
    text = '© RawImageEditor',
    font = '16px sans-serif',
    color = 'rgba(255,255,255,0.7)',
    position = 'br',
    padding = 16,
    pngSrc,
    opacity = 0.4,
  } = params || {};

  const out = [];

  for (let i = 0; i < list.length; i++) {
    const rec = list[i] || {};
    let imgSource = rec.canvas || rec.bitmap || rec.image;

    // Try to build an HTMLImageElement from File/Blob if needed (MVP)
    if (!imgSource && rec.item && typeof URL !== 'undefined') {
      try {
        const file = rec.item;
        if (file && typeof file.type === 'string') {
          const url = URL.createObjectURL(file);
          imgSource = await loadImage(url);
          try { URL.revokeObjectURL(url); } catch {}
        }
      } catch {}
    }

    // If we still don't have a bitmap, skip watermarking and pass through
    if (!imgSource) {
      out.push(rec);
      onProgress((i + 1) / list.length, `Skip watermark ${i + 1}/${list.length}`);
      continue;
    }

    // Draw onto a new canvas
    const { width, height } = getImageSize(imgSource);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Draw original
    drawImage(ctx, imgSource, width, height);

    // Draw watermark
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, opacity));

    if (type === 'png' && pngSrc) {
      try {
        const wmImg = await loadImage(pngSrc);
        const wmWidth = Math.min(width * 0.25, wmImg.width);
        const scale = wmWidth / wmImg.width;
        const wmHeight = wmImg.height * scale;
        const { x, y } = placeRect(width, height, wmWidth, wmHeight, position, padding);
        ctx.drawImage(wmImg, x, y, wmWidth, wmHeight);
      } catch (e) {
        // fallback to text if png fails
        ctx.font = font;
        ctx.fillStyle = color;
        const metrics = textMetrics(ctx, text);
        const { x, y } = placeRect(width, height, metrics.w, metrics.h, position, padding);
        ctx.fillText(text, x, y + metrics.baseline);
      }
    } else {
      ctx.font = font;
      ctx.fillStyle = color;
      const metrics = textMetrics(ctx, text);
      const { x, y } = placeRect(width, height, metrics.w, metrics.h, position, padding);
      ctx.fillText(text, x, y + metrics.baseline);
    }

    ctx.restore();

    out.push({ ...rec, canvas });
    onProgress((i + 1) / list.length, `Watermarked ${i + 1}/${list.length}`);
    await Promise.resolve();
  }

  return out;
}

function getImageSize(src) {
  if (!src) return { width: 0, height: 0 };
  if (src instanceof HTMLCanvasElement || src instanceof OffscreenCanvas) {
    return { width: src.width, height: src.height };
  }
  if (src instanceof HTMLImageElement || src instanceof ImageBitmap || src instanceof SVGImageElement) {
    return { width: src.width, height: src.height };
  }
  // fallback
  return { width: src.width || 0, height: src.height || 0 };
}

function drawImage(ctx, src, w, h) {
  if (src instanceof HTMLCanvasElement || src instanceof OffscreenCanvas || src instanceof HTMLImageElement || src instanceof ImageBitmap) {
    ctx.drawImage(src, 0, 0, w, h);
  } else if (src && src.data && src.width && src.height) {
    // ImageData
    const tmp = document.createElement('canvas');
    tmp.width = src.width;
    tmp.height = src.height;
    const tctx = tmp.getContext('2d');
    tctx.putImageData(src, 0, 0);
    ctx.drawImage(tmp, 0, 0, w, h);
  }
}

function placeRect(W, H, w, h, pos, pad) {
  const P = pad || 0;
  switch (pos) {
    case 'tl': return { x: P, y: P };
    case 'tr': return { x: W - w - P, y: P };
    case 'bl': return { x: P, y: H - h - P };
    case 'br':
    default: return { x: W - w - P, y: H - h - P };
  }
}

function textMetrics(ctx, text) {
  const m = ctx.measureText(text);
  const h = (m.actualBoundingBoxAscent || 0) + (m.actualBoundingBoxDescent || 0) || 16;
  const baseline = m.actualBoundingBoxAscent || 12;
  return { w: m.width || 100, h, baseline };
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
