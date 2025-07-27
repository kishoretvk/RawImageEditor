/**
 * Professional curve processing utilities for image editing
 */

/**
 * Create a smooth curve using cubic spline interpolation
 * @param {Array} points - Array of [x, y] control points (0-1 range)
 * @returns {Function} Interpolation function
 */
export const createSmoothCurve = (points) => {
  if (points.length < 2) {
    return (x) => x; // Identity function
  }

  // Sort points by x value
  const sortedPoints = [...points].sort((a, b) => a[0] - b[0]);
  
  // Extract x and y values
  const xs = sortedPoints.map(p => p[0]);
  const ys = sortedPoints.map(p => p[1]);
  
  // Calculate second derivatives for cubic spline
  const n = xs.length;
  const y2 = new Array(n);
  const u = new Array(n);
  
  y2[0] = 0;
  y2[n - 1] = 0;
  u[0] = 0;
  
  for (let i = 1; i < n - 1; i++) {
    const sig = (xs[i] - xs[i - 1]) / (xs[i + 1] - xs[i - 1]);
    const p = sig * y2[i - 1] + 2;
    y2[i] = (sig - 1) / p;
    u[i] = (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]) - 
           (ys[i] - ys[i - 1]) / (xs[i] - xs[i - 1]);
    u[i] = (6 * u[i] / (xs[i + 1] - xs[i - 1]) - sig * u[i - 1]) / p;
  }
  
  for (let k = n - 2; k >= 0; k--) {
    y2[k] = y2[k] * y2[k + 1] + u[k];
  }
  
  // Return interpolation function
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    
    // Find the right interval
    let klo = 0;
    let khi = n - 1;
    
    while (khi - klo > 1) {
      const k = (khi + klo) >> 1;
      if (xs[k] > x) {
        khi = k;
      } else {
        klo = k;
      }
    }
    
    const h = xs[khi] - xs[klo];
    if (h === 0) return ys[klo];
    
    const a = (xs[khi] - x) / h;
    const b = (x - xs[klo]) / h;
    
    return a * ys[klo] + b * ys[khi] + 
           ((a * a * a - a) * y2[klo] + (b * b * b - b) * y2[khi]) * (h * h) / 6;
  };
};

/**
 * Create a Bezier curve segment
 * @param {Array} p0 - Start point [x, y]
 * @param {Array} p1 - Control point 1 [x, y]
 * @param {Array} p2 - Control point 2 [x, y]
 * @param {Array} p3 - End point [x, y]
 * @returns {Function} Bezier curve function
 */
export const createBezierCurve = (p0, p1, p2, p3) => {
  return (t) => {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;
    
    return [
      uuu * p0[0] + 3 * uu * t * p1[0] + 3 * u * tt * p2[0] + ttt * p3[0],
      uuu * p0[1] + 3 * uu * t * p1[1] + 3 * u * tt * p2[1] + ttt * p3[1]
    ];
  };
};

/**
 * Apply curve to image data
 * @param {ImageData} imageData - Image data to process
 * @param {Function} curveFn - Curve function (0-1 input/output)
 * @param {string} channel - Channel to apply ('rgb', 'r', 'g', 'b', 'luminance')
 * @returns {ImageData} Processed image data
 */
export const applyCurveToImageData = (imageData, curveFn, channel = 'rgb') => {
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    switch (channel) {
      case 'r':
        data[i] = Math.max(0, Math.min(255, curveFn(r / 255) * 255));
        break;
      case 'g':
        data[i + 1] = Math.max(0, Math.min(255, curveFn(g / 255) * 255));
        break;
      case 'b':
        data[i + 2] = Math.max(0, Math.min(255, curveFn(b / 255) * 255));
        break;
      case 'luminance': {
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        const newLuminance = Math.max(0, Math.min(255, curveFn(luminance / 255) * 255));
        const ratio = luminance > 0 ? newLuminance / luminance : 1;
        data[i] = Math.max(0, Math.min(255, r * ratio));
        data[i + 1] = Math.max(0, Math.min(255, g * ratio));
        data[i + 2] = Math.max(0, Math.min(255, b * ratio));
        break;
      }
      default: // 'rgb'
        data[i] = Math.max(0, Math.min(255, curveFn(r / 255) * 255));
        data[i + 1] = Math.max(0, Math.min(255, curveFn(g / 255) * 255));
        data[i + 2] = Math.max(0, Math.min(255, curveFn(b / 255) * 255));
    }
  }
  
  return imageData;
};

/**
 * Predefined curve presets
 */
export const curvePresets = {
  linear: [[0, 0], [1, 1]],
  sCurve: [[0, 0], [0.25, 0.1], [0.75, 0.9], [1, 1]],
  highlightCompress: [[0, 0], [0.5, 0.7], [0.75, 0.9], [1, 1]],
  shadowBoost: [[0, 0], [0.25, 0.3], [0.5, 0.7], [1, 1]],
  contrastBoost: [[0, 0], [0.3, 0.15], [0.7, 0.85], [1, 1]],
  contrastReduce: [[0, 0], [0.15, 0.3], [0.85, 0.7], [1, 1]]
};

/**
 * Create a curve function from a preset
 * @param {string} preset - Preset name
 * @returns {Function} Curve function
 */
export const createPresetCurve = (preset) => {
  if (curvePresets[preset]) {
    return createSmoothCurve(curvePresets[preset]);
  }
  return (x) => x; // Identity function
};

/**
 * Convert curve points to a lookup table for performance
 * @param {Function} curveFn - Curve function
 * @param {number} size - Lookup table size (default 256)
 * @returns {Uint8Array} Lookup table
 */
export const createCurveLUT = (curveFn, size = 256) => {
  const lut = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    lut[i] = Math.max(0, Math.min(255, Math.round(curveFn(i / (size - 1)) * 255)));
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
  
  for (let i = 0; i < data.length; i += 4) {
    switch (channel) {
      case 'r':
        data[i] = lut[Math.floor((data[i] / 255) * (lutSize - 1))];
        break;
      case 'g':
        data[i + 1] = lut[Math.floor((data[i + 1] / 255) * (lutSize - 1))];
        break;
      case 'b':
        data[i + 2] = lut[Math.floor((data[i + 2] / 255) * (lutSize - 1))];
        break;
      case 'luminance': {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        const newLuminance = lut[Math.floor((luminance / 255) * (lutSize - 1))];
        const ratio = luminance > 0 ? newLuminance / luminance : 1;
        data[i] = Math.max(0, Math.min(255, r * ratio));
        data[i + 1] = Math.max(0, Math.min(255, g * ratio));
        data[i + 2] = Math.max(0, Math.min(255, b * ratio));
        break;
      }
      default: // 'rgb'
        data[i] = lut[Math.floor((data[i] / 255) * (lutSize - 1))];
        data[i + 1] = lut[Math.floor((data[i + 1] / 255) * (lutSize - 1))];
        data[i + 2] = lut[Math.floor((data[i + 2] / 255) * (lutSize - 1))];
    }
  }
  
  return imageData;
};
