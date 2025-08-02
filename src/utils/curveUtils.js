/**
 * Professional curve processing utilities for image editing
 */

/**
 * Curve utility functions for image processing
 */

/**
 * Create a default linear curve (straight line from 0,0 to 1,1)
 * @returns {Array} Array of control points [[x, y], ...]
 */
export const createDefaultCurve = () => {
  return [[0, 0], [0.25, 0.25], [0.5, 0.5], [0.75, 0.75], [1, 1]];
};

/**
 * Create a smooth curve function from control points using Catmull-Rom spline
 * @param {Array} points - Array of control points [[x, y], ...]
 * @returns {Function} Function that takes an input value and returns the mapped output
 */
/**
 * Monotone cubic (Fritsch–Carlson) interpolation to avoid overshoot/ringing.
 * Returns a function f(x) with x,y in [0,1].
 */
export const createSmoothCurve = (points) => {
  if (!points || points.length < 2) return (x) => x;

  // Sort and clamp points; ensure unique x
  const pts = [...points]
    .map(([x, y]) => [Math.min(1, Math.max(0, x)), Math.min(1, Math.max(0, y))])
    .sort((a, b) => a[0] - b[0]);
  // Deduplicate x
  const unique = [];
  for (let i = 0; i < pts.length; i++) {
    if (i === 0 || pts[i][0] > pts[i - 1][0]) unique.push(pts[i]);
    else unique[unique.length - 1] = pts[i]; // keep last for same x
  }
  if (unique.length < 2) return (x) => x;

  const n = unique.length;
  const xs = unique.map(p => p[0]);
  const ys = unique.map(p => p[1]);

  // Slopes between points
  const dx = new Array(n - 1);
  const m = new Array(n - 1);
  for (let i = 0; i < n - 1; i++) {
    dx[i] = xs[i + 1] - xs[i];
    m[i] = (ys[i + 1] - ys[i]) / (dx[i] || 1e-6);
  }

  // Tangents (Fritsch–Carlson)
  const t = new Array(n).fill(0);
  t[0] = m[0];
  t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (m[i - 1] * m[i] <= 0) {
      t[i] = 0;
    } else {
      const w1 = 2 * dx[i] + dx[i - 1];
      const w2 = dx[i] + 2 * dx[i - 1];
      t[i] = (w1 + w2) > 0 ? (w1 + w2) / ((w1 / m[i - 1]) + (w2 / m[i])) : 0;
    }
  }
  // Clamp to avoid overshoot
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
    } else {
      const a = t[i] / m[i];
      const b = t[i + 1] / m[i];
      const h = Math.hypot(a, b);
      if (h > 3) {
        const s = 3 / h;
        t[i] = a * s * m[i];
        t[i + 1] = b * s * m[i];
      }
    }
  }

  return (x) => {
    x = Math.min(1, Math.max(0, x));
    // Find segment
    let i = 0;
    while (i < n - 2 && x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i] || 1e-6;
    const s = (x - xs[i]) / h;
    const s2 = s * s;
    const s3 = s2 * s;

    // Hermite basis
    const h00 = 2 * s3 - 3 * s2 + 1;
    const h10 = s3 - 2 * s2 + s;
       const h01 = -2 * s3 + 3 * s2;
    const h11 = s3 - s2;

    const y = h00 * ys[i] + h10 * h * t[i] + h01 * ys[i + 1] + h11 * h * t[i + 1];
    return Math.min(1, Math.max(0, y));
  };
};

/**
 * Apply a curve to image data
 * @param {ImageData} imageData - The image data to modify
 * @param {Function} curveFunction - The curve function to apply
 * @param {string} channel - Which channel to apply to ('rgb', 'r', 'g', 'b', 'luminance')
 * @returns {ImageData} Modified image data
 */
/**
 * sRGB <-> Linear helpers in [0..1]
 */
const srgbToLinear = (v) => {
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};
const linearToSrgb = (v) => {
  return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
};

export const applyCurveToImageData = (imageData, curveFunction, channel = 'rgb', { space = 'linear' } = {}) => {
  if (!imageData || !curveFunction) return imageData;

  const data = imageData.data;
  const toLin = (v) => (space === 'linear' ? srgbToLinear(v) : v);
  const toOut = (v) => (space === 'linear' ? linearToSrgb(v) : v);

  switch (channel) {
    case 'rgb':
      // Apply to all channels equally
      for (let i = 0; i < data.length; i += 4) {
        const r = toLin(data[i] / 255);
        const g = toLin(data[i + 1] / 255);
        const b = toLin(data[i + 2] / 255);

        // Luminance in linear space for master curve
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        const adj = curveFunction(lum);
        const factor = lum > 0 ? adj / lum : 1;

        const ro = toOut(Math.min(1, Math.max(0, r * factor)));
        const go = toOut(Math.min(1, Math.max(0, g * factor)));
        const bo = toOut(Math.min(1, Math.max(0, b * factor)));

        data[i] = Math.round(ro * 255);
        data[i + 1] = Math.round(go * 255);
        data[i + 2] = Math.round(bo * 255);
      }
      break;
      
    case 'r':
      // Apply to red channel only
      for (let i = 0; i < data.length; i += 4) {
        const r = toLin(data[i] / 255);
        const out = toOut(Math.min(1, Math.max(0, curveFunction(r))));
        data[i] = Math.round(out * 255);
      }
      break;
      
    case 'g':
      // Apply to green channel only
      for (let i = 0; i < data.length; i += 4) {
        const g = toLin(data[i + 1] / 255);
        const out = toOut(Math.min(1, Math.max(0, curveFunction(g))));
        data[i + 1] = Math.round(out * 255);
      }
      break;
      
    case 'b':
      // Apply to blue channel only
      for (let i = 0; i < data.length; i += 4) {
        const b = toLin(data[i + 2] / 255);
        const out = toOut(Math.min(1, Math.max(0, curveFunction(b))));
        data[i + 2] = Math.round(out * 255);
      }
      break;
      
    case 'luminance':
      // Apply to luminance (perceptual brightness)
      for (let i = 0; i < data.length; i += 4) {
        const r = toLin(data[i] / 255);
        const g = toLin(data[i + 1] / 255);
        const b = toLin(data[i + 2] / 255);

        const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        const adjustedL = curveFunction(luminance);
        const factor = luminance > 0 ? adjustedL / luminance : 1;

        const ro = toOut(Math.min(1, Math.max(0, r * factor)));
        const go = toOut(Math.min(1, Math.max(0, g * factor)));
        const bo = toOut(Math.min(1, Math.max(0, b * factor)));

        data[i] = Math.round(ro * 255);
        data[i + 1] = Math.round(go * 255);
        data[i + 2] = Math.round(bo * 255);
      }
      break;
      
    default:
      console.warn(`Unknown curve channel: ${channel}`);
  }
  
  return new ImageData(data, imageData.width, imageData.height);
};

export default {
  createDefaultCurve,
  createSmoothCurve,
  applyCurveToImageData
};

/**
 * Convert curve points to a lookup table for performance
 * @param {Function} curveFn - Curve function
 * @param {number} size - Lookup table size (default 256)
 * @returns {Uint8Array} Lookup table
 */
export const createCurveLUT = (curveFn, size = 1024, { space = 'linear' } = {}) => {
  const lut = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    const x = i / (size - 1);
    const linIn = space === 'linear' ? srgbToLinear(x) : x;
    const curved = Math.min(1, Math.max(0, curveFn(linIn)));
    const out = space === 'linear' ? linearToSrgb(curved) : curved;
    lut[i] = Math.round(out * 255);
  }
  return lut;
};

/**
 * Apply lookup table to image data
 * @param {ImageData} imageData - Image data to process
 * @param {Uint8Array} lut - Lookup table
 * @param {string} channel - Channel to apply ('rgb', 'r', 'g', 'b', 'luminance')
 * @returns {ImageData} Processed image data
 */
export const applyLUTToImageData = (imageData, lut, channel = 'rgb') => {
  const data = imageData.data;
  const lutSize = lut.length;

  const sample = (v) => {
    const idx = Math.min(lutSize - 1, Math.max(0, Math.floor(v)));
    return lut[idx];
  };

  for (let i = 0; i < data.length; i += 4) {
    switch (channel) {
      case 'r':
        data[i] = sample((data[i] / 255) * (lutSize - 1));
        break;
      case 'g':
        data[i + 1] = sample((data[i + 1] / 255) * (lutSize - 1));
        break;
      case 'b':
        data[i + 2] = sample((data[i + 2] / 255) * (lutSize - 1));
        break;
      case 'luminance': {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        const newL = sample((luminance / 255) * (lutSize - 1));
        const ratio = luminance > 0 ? newL / luminance : 1;
        data[i] = Math.min(255, Math.max(0, r * ratio));
        data[i + 1] = Math.min(255, Math.max(0, g * ratio));
        data[i + 2] = Math.min(255, Math.max(0, b * ratio));
        break;
      }
      default: // 'rgb'
        data[i] = sample((data[i] / 255) * (lutSize - 1));
        data[i + 1] = sample((data[i + 1] / 255) * (lutSize - 1));
        data[i + 2] = sample((data[i + 2] / 255) * (lutSize - 1));
    }
  }
  return imageData;
};

/**
 * Preset curves for common editing operations
 */
export const curvePresets = {
  linear: [[0, 0], [1, 1]],
  sCurve: [[0, 0], [0.25, 0.1], [0.5, 0.5], [0.75, 0.9], [1, 1]],
  highlightCompress: [[0, 0], [0.5, 0.6], [0.75, 0.85], [1, 1]],
  shadowBoost: [[0, 0], [0.25, 0.35], [0.5, 0.6], [1, 1]],
  contrastBoost: [[0, 0], [0.3, 0.15], [0.7, 0.85], [1, 1]],
  contrastReduce: [[0, 0], [0.3, 0.25], [0.7, 0.75], [1, 1]]
};

/**
 * Compose master (RGB) and channel curves to three per-channel LUTs.
 * Strategy: sequential application: outC(x) = curveC(curveRGB(x))
 * Returns Uint8Array LUTs (256 by default) suitable for CPU path or to upload to GPU.
 */
export const composeCurves = (
  {
    rgbPoints,
    rPoints,
    gPoints,
    bPoints
  },
  { size = 256, space = 'linear' } = {}
) => {
  const rgbFn = createSmoothCurve(
    (rgbPoints && rgbPoints.length ? rgbPoints : createDefaultCurve()).map(p => Array.isArray(p) ? p : [p.x / 256 || p.x, p.y / 256 || p.y])
  );
  const rFnRaw = createSmoothCurve(
    (rPoints && rPoints.length ? rPoints : createDefaultCurve()).map(p => Array.isArray(p) ? p : [p.x / 256 || p.x, p.y / 256 || p.y])
  );
  const gFnRaw = createSmoothCurve(
    (gPoints && gPoints.length ? gPoints : createDefaultCurve()).map(p => Array.isArray(p) ? p : [p.x / 256 || p.x, p.y / 256 || p.y])
  );
  const bFnRaw = createSmoothCurve(
    (bPoints && bPoints.length ? bPoints : createDefaultCurve()).map(p => Array.isArray(p) ? p : [p.x / 256 || p.x, p.y / 256 || p.y])
  );

  // Compose: c(rgb(x))
  const comp = (cFn) => (x) => cFn(rgbFn(x));
  const rFn = comp(rFnRaw);
  const gFn = comp(gFnRaw);
  const bFn = comp(bFnRaw);

  const lutR = createCurveLUT(rFn, size, { space });
  const lutG = createCurveLUT(gFn, size, { space });
  const lutB = createCurveLUT(bFn, size, { space });

  return { lutR, lutG, lutB };
};

/**
 * Convenience wrapper: build LUTs from unified curves object:
 * curves = { mode, rgb:{points}, r:{points}, g:{points}, b:{points} }
 */
export const buildLUTsFromCurves = (curves, { size = 256, space = 'linear' } = {}) => {
  if (!curves) {
    const id = createDefaultCurve();
    return composeCurves({ rgbPoints: id, rPoints: id, gPoints: id, bPoints: id }, { size, space });
  }
  const rgbPoints = curves.rgb?.points || createDefaultCurve();
  const rPoints = curves.r?.points || createDefaultCurve();
  const gPoints = curves.g?.points || createDefaultCurve();
  const bPoints = curves.b?.points || createDefaultCurve();
  return composeCurves({ rgbPoints, rPoints, gPoints, bPoints }, { size, space });
};
