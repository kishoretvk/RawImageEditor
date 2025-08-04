/**
 * Export node (MVP)
 * Consumes a list of records with a drawable source (canvas/bitmap/image/file) and produces downloadable blobs.
 * Params:
 *  - format: 'jpeg'|'png'|'webp' (default 'jpeg')
 *  - quality: 0..1 (default 0.9)
 *  - targetSizeMB: number (optional; if set, perform binary search on quality to meet size within tolerance)
 *  - tolerancePct: number (default 5)
 *  - filenamePattern: e.g., '{name}_edit' (fallback uses item.name or index)
 *  - download: boolean (default true) - trigger browser download
 *  - colorProfile: 'srgb'|'display-p3' (placeholder; browser control limited)
 * Output: array of { ...rec, blob, filename }
 */
export async function nodeExport({ inputs, params, context, onProgress }) {
  const list = Array.isArray(inputs?.[0]) ? inputs[0] : [];
  const {
    format = 'jpeg',
    quality = 0.9,
    targetSizeMB,
    tolerancePct = 5,
    filenamePattern = '{name}_edit',
    download = true,
  } = params || {};

  const out = [];
  for (let i = 0; i < list.length; i++) {
    const rec = list[i] || {};
    const src = rec.canvas || rec.bitmap || rec.image;
    let canvas = rec.canvas;

    // If no canvas, try to rasterize from image/bitmap
    if (!canvas && src) {
      const { width, height } = getImageSize(src);
      canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      drawImage(ctx, src, width, height);
    }

    // If still no canvas, try to build from File
    if (!canvas && rec.item && typeof URL !== 'undefined') {
      try {
        const file = rec.item;
        if (file && typeof file.type === 'string') {
          const url = URL.createObjectURL(file);
          const img = await loadImage(url);
          try { URL.revokeObjectURL(url); } catch {}
          const { width, height } = getImageSize(img);
          canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
        }
      } catch {}
    }

    if (!canvas) {
      // Nothing to export; pass through
      out.push(rec);
      onProgress((i + 1) / list.length, `Skip export ${i + 1}/${list.length}`);
      continue;
    }

    const wantTarget = Number.isFinite(targetSizeMB) && targetSizeMB > 0;
    let blob;
    if (wantTarget && format === 'jpeg') {
      blob = await encodeTargetSize(canvas, targetSizeMB, tolerancePct);
    } else {
      blob = await encodeOnce(canvas, format, quality);
    }

    // Support channel suffixes or other filename hints from upstream nodes (e.g., SplitRGB)
    const baseName = (inferBaseName(rec, i) + (rec.filenameSuffix || ''));
    const filename = buildFilename(baseName, filenamePattern, format);
    out.push({ ...rec, blob, filename });

    if (download && blob) {
      triggerDownload(blob, filename);
    }

    onProgress((i + 1) / list.length, `Exported ${i + 1}/${list.length}`, { filename, size: blob?.size || 0 });
    await Promise.resolve();
  }

  return out;
}

async function encodeOnce(canvas, format, quality) {
  const type = mimeFor(format);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, clamp01(quality)));
  return blob;
}

async function encodeTargetSize(canvas, targetMB, tolerancePct) {
  const type = mimeFor('jpeg');
  const targetBytes = targetMB * 1024 * 1024;
  const tol = Math.max(1, tolerancePct) / 100;
  let lo = 0.2, hi = 0.95, best = null;

  for (let iter = 0; iter < 8; iter++) {
    const mid = (lo + hi) / 2;
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, clamp01(mid)));
    if (!blob) break;
    const diff = blob.size - targetBytes;
    best = blob;

    if (Math.abs(diff) <= targetBytes * tol) {
      return blob;
    }
    if (diff > 0) {
      // too big -> reduce quality
      hi = mid;
    } else {
      lo = mid;
    }
  }
  return best;
}

function mimeFor(format) {
  switch ((format || '').toLowerCase()) {
    case 'jpeg':
    case 'jpg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    default:
      return 'image/jpeg';
  }
}

function buildFilename(baseName, pattern, format) {
  const name = (pattern || '{name}_edit').replace('{name}', baseName);
  const ext = extFor(format);
  return `${name}.${ext}`;
}

function extFor(format) {
  switch ((format || '').toLowerCase()) {
    case 'jpeg':
    case 'jpg': return 'jpg';
    case 'png': return 'png';
    case 'webp': return 'webp';
    default: return 'jpg';
  }
}

function inferBaseName(rec, index) {
  const raw = rec?.exif?.name || rec?.item?.name || `image_${index + 1}`;
  const dot = raw.lastIndexOf('.');
  return dot > 0 ? raw.slice(0, dot) : raw;
}

function triggerDownload(blob, filename) {
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'export';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch {}
}

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 1;
  return Math.max(0, Math.min(1, n));
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
