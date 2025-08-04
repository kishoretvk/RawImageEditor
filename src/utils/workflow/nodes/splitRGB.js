/**
 * SplitRGB node
 * Produces three monochrome channel outputs (R, G, B) from an input image/canvas.
 * Params:
 *  - useAdjusted: boolean (if true, use current rec.canvas; else rebuild from original source)
 *  - exportAll: boolean (if true, fan-out three separate records for downstream export with suffixes)
 *
 * Input: array of records { item, exif?, edits?, canvas?, bitmap?, image? }
 * Output:
 *  - if exportAll: array with 3x records (R/G/B) with canvas replaced by mono canvas and filenameSuffix
 *  - else: array of records where rec.channels = { R: canvas, G: canvas, B: canvas } (MVP: prefer exportAll=true)
 */
export async function nodeSplitRGB({ inputs, params, context, onProgress }) {
  const list = Array.isArray(inputs?.[0]) ? inputs[0] : [];
  const useAdjusted = !!params?.useAdjusted;
  const exportAll = params?.exportAll !== false; // default true
  const out = [];
  for (let i = 0; i < list.length; i++) {
    const rec = list[i] || {};
    const baseCanvas = await ensureCanvas(rec, useAdjusted);
    if (!baseCanvas) {
      // Pass through if nothing to split
      out.push(rec);
      onProgress((i + 1) / list.length, `Skip SplitRGB ${i + 1}/${list.length}`);
      continue;
    }

    const { R, G, B } = splitToMono(baseCanvas);

    if (exportAll) {
      out.push(tagRecordWithCanvas(rec, R, '_R'));
      out.push(tagRecordWithCanvas(rec, G, '_G'));
      out.push(tagRecordWithCanvas(rec, B, '_B'));
    } else {
      out.push({ ...rec, channels: { R, G, B } });
    }

    onProgress((i + 1) / list.length, `SplitRGB ${i + 1}/${list.length}`);
    await Promise.resolve();
  }
  return out;
}

function tagRecordWithCanvas(rec, canvas, suffix) {
  // Attach a hint for downstream Export to modify filename pattern, if supported later.
  // For now, we keep filenameSuffix in the record to help export node decide naming.
  return { ...rec, canvas, filenameSuffix: suffix };
}

async function ensureCanvas(rec, useAdjusted) {
  if (useAdjusted && rec.canvas) return rec.canvas;

  const src = rec.canvas || rec.bitmap || rec.image;
  if (src) {
    const { width, height } = getImageSize(src);
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');
    drawImage(ctx, src, width, height);
    return canvas;
  }
  if (rec.item && typeof URL !== 'undefined') {
    try {
      const url = URL.createObjectURL(rec.item);
      const img = await loadImage(url);
      try { URL.revokeObjectURL(url); } catch {}
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      return canvas;
    } catch {
      return null;
    }
  }
  return null;
}

function splitToMono(canvas) {
  const R = document.createElement('canvas');
  const G = document.createElement('canvas');
  const B = document.createElement('canvas');
  R.width = G.width = B.width = canvas.width;
  R.height = G.height = B.height = canvas.height;

  const srcCtx = canvas.getContext('2d');
  const src = srcCtx.getImageData(0, 0, canvas.width, canvas.height);
  const data = src.data;

  const rCtx = R.getContext('2d');
  const gCtx = G.getContext('2d');
  const bCtx = B.getContext('2d');

  const rImg = rCtx.createImageData(canvas.width, canvas.height);
  const gImg = gCtx.createImageData(canvas.width, canvas.height);
  const bImg = bCtx.createImageData(canvas.width, canvas.height);

  const rData = rImg.data, gData = gImg.data, bData = bImg.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Mono grayscale from each channel: set all RGB to that channel value, keep alpha
    const a = data[i + 3];

    rData[i] = r; rData[i + 1] = r; rData[i + 2] = r; rData[i + 3] = a;
    gData[i] = g; gData[i + 1] = g; gData[i + 2] = g; gData[i + 3] = a;
    bData[i] = b; bData[i + 1] = b; bData[i + 2] = b; bData[i + 3] = a;
  }

  rCtx.putImageData(rImg, 0, 0);
  gCtx.putImageData(gImg, 0, 0);
  bCtx.putImageData(bImg, 0, 0);

  return { R, G, B };
}

function getImageSize(src) {
  if (!src) return { width: 0, height: 0 };
  if (src instanceof HTMLCanvasElement || src instanceof OffscreenCanvas) {
    return { width: src.width, height: src.height };
  }
  if (src instanceof HTMLImageElement || src instanceof ImageBitmap) {
    return { width: src.width, height: src.height };
  }
  return { width: src.width || 0, height: src.height || 0 };
}

function drawImage(ctx, src, w, h) {
  if (src instanceof HTMLCanvasElement || src instanceof OffscreenCanvas || src instanceof HTMLImageElement || src instanceof ImageBitmap) {
    ctx.drawImage(src, 0, 0, w, h);
  } else if (src && src.data && src.width && src.height) {
    const tmp = document.createElement('canvas');
    tmp.width = src.width;
    tmp.height = src.height;
    const tctx = tmp.getContext('2d');
    tctx.putImageData(src, 0, 0);
    ctx.drawImage(tmp, 0, 0, w, h);
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
