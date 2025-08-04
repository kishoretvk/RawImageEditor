/**
 * AutoWB node
 * Compute per-channel white balance gains and apply to all items.
 * Default: mode 'set' (compute once from leader, optionally region), target 'equalRGB'.
 * Params:
 *  - mode: 'set' | 'region' | 'global'
 *  - rect?: { x: number, y: number, w: number, h: number } // normalized [0..1] when sampling from region
 *  - target?: 'equalRGB' | 'D65' // D65 is a placeholder mapping; equalRGB is default
 *  - leaderIndex?: number // when mode='set', which item to compute from (default 0)
 *
 * Input shape (from previous nodes):
 *  - Array of records: { item: File|any, exif?: any, edits?: any, canvas?: HTMLCanvasElement, bitmap?: ImageBitmap|HTMLImageElement }
 * Output:
 *  - Array of records with white-balance applied to canvas
 */
export async function nodeAutoWB({ inputs, params, context, onProgress }) {
  const list = Array.isArray(inputs?.[0]) ? inputs[0] : [];
  if (!list.length) return list;

  const mode = params?.mode || 'set';
  const target = params?.target || 'equalRGB';
  const leaderIndex = Number.isFinite(params?.leaderIndex) ? Math.max(0, Math.min(list.length - 1, params.leaderIndex)) : 0;
  const rect = normalizeRect(params?.rect);

  // Compute gains (once) if in 'set' mode
  if (mode === 'set') {
    if (!context.shared.autoWB) context.shared.autoWB = {};
    if (!context.shared.autoWB.gains) {
      const leader = list[leaderIndex];
      const gains = await computeGainsForRecord(leader, rect, target);
      context.shared.autoWB.gains = gains;
    }
  }

  const out = [];
  for (let i = 0; i < list.length; i++) {
    let gains;
    if (mode === 'set') {
      gains = context.shared.autoWB?.gains || { r: 1, g: 1, b: 1 };
    } else if (mode === 'global') {
      gains = await computeGainsForRecord(list[i], null, target);
    } else if (mode === 'region') {
      gains = await computeGainsForRecord(list[i], rect, target);
    } else {
      gains = { r: 1, g: 1, b: 1 };
    }

    const rec = list[i];
    const applied = await applyGains(rec, gains);
    out.push(applied);
    onProgress((i + 1) / list.length, `AutoWB ${i + 1}/${list.length}`, { gains });
    await Promise.resolve();
  }

  return out;
}

function normalizeRect(r) {
  if (!r || !Number.isFinite(r.x) || !Number.isFinite(r.y) || !Number.isFinite(r.w) || !Number.isFinite(r.h)) return null;
  const x = clamp01(r.x); const y = clamp01(r.y); const w = clamp01(r.w); const h = clamp01(r.h);
  return { x, y, w, h };
}

async function computeGainsForRecord(rec, normRect, target) {
  // Obtain a drawable source
  let canvas = rec.canvas;
  if (!canvas) {
    const src = rec.canvas || rec.bitmap || rec.image;
    if (src) {
      const { width, height } = getImageSize(src);
      canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      drawImage(ctx, src, width, height);
    } else if (rec.item && typeof URL !== 'undefined') {
      try {
        const url = URL.createObjectURL(rec.item);
        const img = await loadImage(url);
        try { URL.revokeObjectURL(url); } catch {}
        canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
      } catch {
        return { r: 1, g: 1, b: 1 };
      }
    }
  }
  if (!canvas) return { r: 1, g: 1, b: 1 };

  const avg = sampleAverage(canvas, normRect);
  return computeGains(avg, target);
}

function sampleAverage(canvas, normRect) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  let x = 0, y = 0, w = W, h = H;
  if (normRect) {
    x = Math.floor(normRect.x * W);
    y = Math.floor(normRect.y * H);
    w = Math.max(1, Math.floor(normRect.w * W));
    h = Math.max(1, Math.floor(normRect.h * H));
  }
  const img = ctx.getImageData(x, y, w, h);
  const data = img.data;
  let rSum = 0, gSum = 0, bSum = 0, count = 0;

  // Sample step for performance on large areas
  const step = Math.max(1, Math.floor(Math.sqrt((w * h) / 40000))); // ~200x200 max samples
  for (let yy = 0; yy < h; yy += step) {
    for (let xx = 0; xx < w; xx += step) {
      const idx = ((yy * w) + xx) * 4;
      rSum += data[idx];
      gSum += data[idx + 1];
      bSum += data[idx + 2];
      count++;
    }
  }
  const r = rSum / Math.max(1, count);
  const g = gSum / Math.max(1, count);
  const b = bSum / Math.max(1, count);
  return { r, g, b };
}

function computeGains(avg, target) {
  const eps = 1e-6;
  if (!avg || !Number.isFinite(avg.r) || !Number.isFinite(avg.g) || !Number.isFinite(avg.b)) {
    return { r: 1, g: 1, b: 1 };
  }
  if (target === 'D65') {
    // Placeholder: map average to D65 neutral by equalizing and slightly biasing to common whitepoint if desired.
    // For MVP: equalize channels (same as equalRGB).
  }
  // equalRGB: make R=G=B by scaling each channel to their mean
  const mean = (avg.r + avg.g + avg.b) / 3;
  const gr = clampGain(mean / Math.max(eps, avg.r));
  const gg = clampGain(mean / Math.max(eps, avg.g));
  const gb = clampGain(mean / Math.max(eps, avg.b));
  return { r: gr, g: gg, b: gb };
}

function clampGain(g) {
  // clamp to avoid wild corrections on noisy samples
  return Math.max(0.25, Math.min(4.0, g));
}

async function applyGains(rec, gains) {
  let canvas = rec.canvas;
  let created = false;
  if (!canvas) {
    const src = rec.canvas || rec.bitmap || rec.image;
    if (src) {
      const { width, height } = getImageSize(src);
      canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext('2d');
      drawImage(ctx, src, width, height);
      created = true;
    } else if (rec.item && typeof URL !== 'undefined') {
      try {
        const url = URL.createObjectURL(rec.item);
        const img = await loadImage(url);
        try { URL.revokeObjectURL(url); } catch {}
        canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        created = true;
      } catch {
        return rec;
      }
    } else {
      return rec;
    }
  }
  const ctx = canvas.getContext('2d');
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = img.data;
  const gr = gains?.r ?? 1, gg = gains?.g ?? 1, gb = gains?.b ?? 1;

  for (let i = 0; i < data.length; i += 4) {
    data[i] = clamp255(data[i] * gr);
    data[i + 1] = clamp255(data[i + 1] * gg);
    data[i + 2] = clamp255(data[i + 2] * gb);
  }
  ctx.putImageData(img, 0, 0);
  return { ...rec, canvas };
}

function clamp255(v) {
  return Math.max(0, Math.min(255, v | 0));
}

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
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
