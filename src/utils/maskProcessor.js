/**
 * Professional Masking System
 * Supports advanced masking techniques for selective editing
 */

export class MaskProcessor {
  constructor() {
    this.masks = new Map();
    this.brushSize = 50;
    this.feather = 0.5;
    this.opacity = 1.0;
  }

  /**
   * Generate linear gradient alpha buffer in image space.
   * options: { width, height, start:{x:0..1,y:0..1}, end:{x:0..1,y:0..1}, feather:0..0.5, invert:boolean }
   * Returns { data:Float32Array, width, height }
   */
  generateLinearGradientMask({ width, height, start, end, feather = 0.2, invert = false }) {
    const w = Math.max(1, Math.floor(width));
    const h = Math.max(1, Math.floor(height));
    const out = new Float32Array(w * h);

    // Convert normalized start/end to pixel coords
    const sx = (start?.x ?? 0.25) * w;
    const sy = (start?.y ?? 0.25) * h;
    const ex = (end?.x ?? 0.75) * w;
    const ey = (end?.y ?? 0.75) * h;

    // Axis vector and its length
    const ax = ex - sx;
    const ay = ey - sy;
    const len = Math.max(1e-6, Math.hypot(ax, ay));
    const nx = -ay / len; // normal unit
    const ny = ax / len;

    // Feather (thickness of transition band) in pixels, relative to min dimension
    const band = Math.max(0, Math.min(0.5, feather)) * Math.min(w, h);

    // For each pixel, compute signed distance to axis and map to [0..1] alpha
    // Define inside region on one side of the axis, transition across band width.
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        // vector from start point to pixel
        const px = x - sx;
        const py = y - sy;
        // signed distance from axis
        const d = px * nx + py * ny; // positive on one side, negative on the other

        // Map distance to alpha: center at 0, full on one side, falloff across band
        let a;
        if (band <= 1e-6) {
          a = d >= 0 ? 1 : 0;
        } else {
          // Smoothstep-like transition: d in [-band/2, +band/2]
          const t = (d / (band * 0.5) + 1) * 0.5; // map to [0..1]
          const tt = t < 0 ? 0 : t > 1 ? 1 : t;
          // use smootherstep
          a = tt * tt * (3 - 2 * tt);
        }

        if (invert) a = 1 - a;
        out[y * w + x] = a;
      }
    }

    return { data: out, width: w, height: h };
  }

  /**
   * Generate radial gradient alpha buffer in image space.
   * options: { width, height, center:{x:0..1,y:0..1}, radius:0..1 (relative), feather:0..1, invert:boolean }
   * Returns { data:Float32Array, width, height }
   */
  generateRadialGradientMask({ width, height, center, radius = 0.3, feather = 0.2, invert = false }) {
    const w = Math.max(1, Math.floor(width));
    const h = Math.max(1, Math.floor(height));
    const out = new Float32Array(w * h);

    const cx = (center?.x ?? 0.5) * w;
    const cy = (center?.y ?? 0.5) * h;
    const maxR = Math.max(1e-6, radius * Math.min(w, h));
    const band = Math.max(0, feather) * Math.min(w, h); // transition band

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const d = Math.hypot(x - cx, y - cy);
        // Inside radius full 1, outside falloff across band
        let t;
        if (band <= 1e-6) {
          t = d <= maxR ? 1 : 0;
        } else {
          const a0 = maxR;           // start of falloff
          const a1 = maxR + band;    // end of falloff
          if (d <= a0) t = 1;
          else if (d >= a1) t = 0;
          else {
            const u = 1 - (d - a0) / (a1 - a0); // map to [0..1]
            t = u * u * (3 - 2 * u);            // smootherstep
          }
        }
        const a = invert ? (1 - t) : t;
        out[y * w + x] = a;
      }
    }

    return { data: out, width: w, height: h };
  }

  // Create different types of masks
  async createMask(type, options = {}) {
    switch (type) {
      case 'brush':
        return this.createBrushMask(options);
      case 'gradient':
        return this.createGradientMask(options);
      case 'radial':
        return this.createRadialMask(options);
      case 'luminance':
        return this.createLuminanceMask(options);
      case 'color':
        return this.createColorMask(options);
      case 'ai':
        return this.createAIMask(options);
      default:
        throw new Error(`Unsupported mask type: ${type}`);
    }
  }

  // Brush mask for manual painting
  createBrushMask({ points, size, feather, opacity }) {
    return {
      type: 'brush',
      points,
      size: size || this.brushSize,
      feather: feather || this.feather,
      opacity: opacity || this.opacity,
      data: this.generateBrushMask(points, size, feather)
    };
  }

  // Linear gradient mask (image-sized)
  createGradientMask({ width = 256, height = 256, start, end, feather = 0.2, invert = false }) {
    const { data, width: w, height: h } = this.generateLinearGradientMask({ width, height, start, end, feather, invert });
    return {
      type: 'gradient',
      start, end, feather, invert,
      data,
      width: w,
      height: h
    };
  }

  // Radial gradient mask (image-sized)
  createRadialMask({ width = 256, height = 256, center, radius = 0.3, feather = 0.2, invert = false }) {
    const { data, width: w, height: h } = this.generateRadialGradientMask({ width, height, center, radius, feather, invert });
    return {
      type: 'radial',
      center, radius, feather, invert,
      data,
      width: w,
      height: h
    };
  }

  // Luminance-based mask
  createLuminanceMask({ imageData, low, high, feather }) {
    const { data, width, height } = imageData;
    const mask = new Float32Array(width * height);
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      const normalizedLum = luminance / 255;
      
      let maskValue = 0;
      if (normalizedLum >= low && normalizedLum <= high) {
        maskValue = 1;
        if (feather > 0) {
          const featherRange = feather * (high - low);
          if (normalizedLum < low + featherRange) {
            maskValue = (normalizedLum - low) / featherRange;
          } else if (normalizedLum > high - featherRange) {
            maskValue = (high - normalizedLum) / featherRange;
          }
        }
      }
      
      mask[i / 4] = maskValue;
    }
    
    return {
      type: 'luminance',
      low,
      high,
      feather,
      data: mask,
      width,
      height
    };
  }

  // Color range mask
  createColorMask({ imageData, targetColor, tolerance, feather }) {
    const { data, width, height } = imageData;
    const mask = new Float32Array(width * height);
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      
      const distance = this.colorDistance(
        { r, g, b },
        targetColor
      );
      
      let maskValue = 0;
      if (distance <= tolerance) {
        maskValue = 1 - (distance / tolerance);
        if (feather > 0) {
          maskValue = Math.pow(maskValue, 1 / feather);
        }
      }
      
      mask[i / 4] = maskValue;
    }
    
    return {
      type: 'color',
      targetColor,
      tolerance,
      feather,
      data: mask,
      width,
      height
    };
  }

  // AI-powered subject detection mask
  async createAIMask({ imageData, subjectType = 'person' }) {
    // Placeholder for AI-based subject detection
    // In production, this would use TensorFlow.js or similar
    console.warn('AI mask creation not implemented - using placeholder');
    
    const { width, height } = imageData;
    const mask = new Float32Array(width * height);
    
    // Simple center-weighted mask for demo
    const centerX = width / 2;
    const centerY = height / 2;
    const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const distance = Math.sqrt(
          Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
        );
        mask[y * width + x] = 1 - (distance / maxDistance);
      }
    }
    
    return {
      type: 'ai',
      subjectType,
      data: mask,
      width,
      height,
      confidence: 0.7 // Placeholder confidence
    };
  }

  // Apply mask to image data
  applyMask(imageData, mask, adjustments) {
    const { data, width, height } = imageData;
    const output = new Uint8ClampedArray(data);

    // Ensure mask matches image dimensions
    const maskData = this.resizeMask(mask.data, mask.width ?? width, mask.height ?? height, width, height);

    for (let i = 0; i < data.length; i += 4) {
      const pixelIndex = (i >> 2);
      const m = maskData[pixelIndex]; // 0..1
      if (m <= 0) continue;

      const r0 = data[i], g0 = data[i + 1], b0 = data[i + 2];
      const [r1, g1, b1] = this.applyAdjustments([r0, g0, b0], adjustments, 1);

      // Blend by mask alpha m
      output[i]     = r0 + (r1 - r0) * m;
      output[i + 1] = g0 + (g1 - g0) * m;
      output[i + 2] = b0 + (b1 - b0) * m;
    }

    return new ImageData(output, width, height);
  }

  // Combine multiple masks
  combineMasks(masks, operation = 'add') {
    if (masks.length === 0) return null;
    if (masks.length === 1) return masks[0];
    
    const { width, height } = masks[0];
    const combined = new Float32Array(width * height);
    
    for (let i = 0; i < combined.length; i++) {
      let value = masks[0].data[i];
      
      for (let j = 1; j < masks.length; j++) {
        const maskValue = masks[j].data[i];
        
        switch (operation) {
          case 'add':
            value = Math.min(1, value + maskValue);
            break;
          case 'subtract':
            value = Math.max(0, value - maskValue);
            break;
          case 'multiply':
            value *= maskValue;
            break;
          case 'screen':
            value = 1 - (1 - value) * (1 - maskValue);
            break;
          case 'overlay':
            value = value < 0.5 
              ? 2 * value * maskValue 
              : 1 - 2 * (1 - value) * (1 - maskValue);
            break;
        }
      }
      
      combined[i] = value;
    }
    
    return {
      type: 'combined',
      operation,
      masks,
      data: combined,
      width,
      height
    };
  }

  // Helper methods
  generateBrushMask(points, size, feather) {
    // Simplified brush mask generation
    const mask = new Float32Array(256 * 256);
    
    for (const point of points) {
      const centerX = Math.round(point.x);
      const centerY = Math.round(point.y);
      
      for (let y = Math.max(0, centerY - size); y < Math.min(256, centerY + size); y++) {
        for (let x = Math.max(0, centerX - size); x < Math.min(256, centerX + size); x++) {
          const distance = Math.sqrt(
            Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
          );
          
          if (distance <= size) {
            const falloff = 1 - (distance / size);
            const feathered = Math.pow(falloff, 1 / feather);
            mask[y * 256 + x] = Math.max(mask[y * 256 + x], feathered);
          }
        }
      }
    }
    
    return mask;
  }

  // Deprecated helper retained for compatibility; prefer generateLinearGradientMask
  calculateGradientDistance(x, y, start, end, angle) {
    const radians = (angle ?? 0) * Math.PI / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    const dx = x - start.x;
    const dy = y - start.y;
    return (dx * cos + dy * sin) / Math.max(1e-6, Math.hypot(end.x - start.x, end.y - start.y));
  }

  colorDistance(color1, color2) {
    const dr = color1.r - color2.r;
    const dg = color1.g - color2.g;
    const db = color1.b - color2.b;
    
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  resizeMask(maskData, srcWidth, srcHeight, dstWidth, dstHeight) {
    if (srcWidth === dstWidth && srcHeight === dstHeight) {
      return maskData;
    }
    
    // Simple nearest-neighbor resizing for demo
    const resized = new Float32Array(dstWidth * dstHeight);
    const xRatio = srcWidth / dstWidth;
    const yRatio = srcHeight / dstHeight;
    
    for (let y = 0; y < dstHeight; y++) {
      for (let x = 0; x < dstWidth; x++) {
        const srcX = Math.floor(x * xRatio);
        const srcY = Math.floor(y * yRatio);
        resized[y * dstWidth + x] = maskData[srcY * srcWidth + srcX];
      }
    }
    
    return resized;
  }

  applyAdjustments([r, g, b], adjustments) {
    const {
      exposure = 0,
      contrast = 0,
      saturation = 0,
      // hue, temperature, tint could be added here if needed for local adjustments
    } = adjustments ?? {};

    // Exposure
    const exp = Math.pow(2, exposure);
    r *= exp; g *= exp; b *= exp;

    // Contrast (simple linear around 128)
    const cf = (259 * (contrast + 255)) / (255 * (259 - contrast));
    r = cf * (r - 128) + 128;
    g = cf * (g - 128) + 128;
    b = cf * (b - 128) + 128;

    // Saturation
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    r = gray + (r - gray) * (1 + saturation / 100);
    g = gray + (g - gray) * (1 + saturation / 100);
    b = gray + (b - gray) * (1 + saturation / 100);

    // Clamp
    r = r < 0 ? 0 : r > 255 ? 255 : r;
    g = g < 0 ? 0 : g > 255 ? 255 : g;
    b = b < 0 ? 0 : b > 255 ? 255 : b;
    return [r, g, b];
  }
}

// Export singleton instance
export const maskProcessor = new MaskProcessor();

// Convenience functions
export const createMask = async (type, options) => {
  return maskProcessor.createMask(type, options);
};

export const applyMask = (imageData, mask, adjustments) => {
  return maskProcessor.applyMask(imageData, mask, adjustments);
};

export const combineMasks = (masks, operation) => {
  return maskProcessor.combineMasks(masks, operation);
};
