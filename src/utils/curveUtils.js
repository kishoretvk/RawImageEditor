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
export const createSmoothCurve = (points) => {
  if (!points || points.length < 2) {
    return (x) => x; // Identity function for invalid curves
  }

  // Sort points by x value
  const sortedPoints = [...points].sort((a, b) => a[0] - b[0]);

  // Create Catmull-Rom spline interpolation
  return (x) => {
    // Clamp input to [0, 1]
    x = Math.max(0, Math.min(1, x));

    // Find the segment that contains x
    let i = 0;
    while (i < sortedPoints.length - 1 && sortedPoints[i + 1][0] <= x) {
      i++;
    }

    // If x is at or beyond the last point, return the last y value
    if (i >= sortedPoints.length - 1) {
      return sortedPoints[sortedPoints.length - 1][1];
    }

    // If x is at or before the first point, return the first y value
    if (i === 0 && sortedPoints[0][0] >= x) {
      return sortedPoints[0][1];
    }

    // Get four points for Catmull-Rom spline (handle boundaries)
    const p0 = sortedPoints[Math.max(0, i - 1)];
    const p1 = sortedPoints[i];
    const p2 = sortedPoints[i + 1];
    const p3 = sortedPoints[Math.min(sortedPoints.length - 1, i + 2)];

    // Calculate t value (0 to 1) for the segment
    const t = (x - p1[0]) / (p2[0] - p1[0]);

    // Catmull-Rom spline calculation
    const t2 = t * t;
    const t3 = t2 * t;

    const c0 = -0.5 * t3 + t2 - 0.5 * t;
    const c1 = 1.5 * t3 - 2.5 * t2 + 1.0;
    const c2 = -1.5 * t3 + 2.0 * t2 + 0.5 * t;
    const c3 = 0.5 * t3 - 0.5 * t2;

    return c0 * p0[1] + c1 * p1[1] + c2 * p2[1] + c3 * p3[1];
  };
};

/**
 * Apply a curve to image data
 * @param {ImageData} imageData - The image data to modify
 * @param {Function} curveFunction - The curve function to apply
 * @param {string} channel - Which channel to apply to ('rgb', 'r', 'g', 'b', 'luminance')
 * @returns {ImageData} Modified image data
 */
export const applyCurveToImageData = (imageData, curveFunction, channel = 'rgb') => {
  if (!imageData || !curveFunction) {
    return imageData;
  }

  const data = imageData.data;
  
  switch (channel) {
    case 'rgb':
      // Apply to all channels equally
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i] / 255;
        const g = data[i + 1] / 255;
        const b = data[i + 2] / 255;
        
        // Apply curve to average of RGB for uniform adjustment
        const avg = (r + g + b) / 3;
        const adjusted = curveFunction(avg);
        const factor = avg > 0 ? adjusted / avg : 1;
        
        data[i] = Math.min(255, Math.max(0, data[i] * factor));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * factor));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * factor));
      }
      break;
      
    case 'r':
      // Apply to red channel only
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i] / 255;
        const adjusted = curveFunction(r) * 255;
        data[i] = Math.min(255, Math.max(0, adjusted));
      }
      break;
      
    case 'g':
      // Apply to green channel only
      for (let i = 0; i < data.length; i += 4) {
        const g = data[i + 1] / 255;
        const adjusted = curveFunction(g) * 255;
        data[i + 1] = Math.min(255, Math.max(0, adjusted));
      }
      break;
      
    case 'b':
      // Apply to blue channel only
      for (let i = 0; i < data.length; i += 4) {
        const b = data[i + 2] / 255;
        const adjusted = curveFunction(b) * 255;
        data[i + 2] = Math.min(255, Math.max(0, adjusted));
      }
      break;
      
    case 'luminance':
      // Apply to luminance (perceptual brightness)
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i] / 255;
        const g = data[i + 1] / 255;
        const b = data[i + 2] / 255;
        
        // Calculate luminance (ITU-R BT.709)
        const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        const adjustedLuminance = curveFunction(luminance);
        const factor = luminance > 0 ? adjustedLuminance / luminance : 1;
        
        data[i] = Math.min(255, Math.max(0, data[i] * factor));
        data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * factor));
        data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * factor));
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
