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

  // Linear gradient mask
  createGradientMask({ start, end, angle, feather }) {
    const mask = new Float32Array(256 * 256); // Simplified for demo
    
    for (let y = 0; y < 256; y++) {
      for (let x = 0; x < 256; x++) {
        const distance = this.calculateGradientDistance(x, y, start, end, angle);
        mask[y * 256 + x] = Math.max(0, Math.min(1, 1 - distance));
      }
    }
    
    return {
      type: 'gradient',
      start,
      end,
      angle,
      feather,
      data: mask
    };
  }

  // Radial gradient mask
  createRadialMask({ center, radius, feather }) {
    const mask = new Float32Array(256 * 256);
    
    for (let y = 0; y < 256; y++) {
      for (let x = 0; x < 256; x++) {
        const distance = Math.sqrt(
          Math.pow(x - center.x, 2) + Math.pow(y - center.y, 2)
        );
        const normalizedDistance = distance / radius;
        mask[y * 256 + x] = Math.max(0, Math.min(1, 1 - normalizedDistance));
      }
    }
    
    return {
      type: 'radial',
      center,
      radius,
      feather,
      data: mask
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
    const maskData = this.resizeMask(mask.data, mask.width, mask.height, width, height);
    
    for (let i = 0; i < data.length; i += 4) {
      const pixelIndex = Math.floor(i / 4);
      const maskValue = maskData[pixelIndex];
      
      if (maskValue > 0) {
        // Apply adjustments based on mask value
        const adjusted = this.applyAdjustments(
          [data[i], data[i + 1], data[i + 2]],
          adjustments,
          maskValue
        );
        
        output[i] = adjusted[0];
        output[i + 1] = adjusted[1];
        output[i + 2] = adjusted[2];
      }
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

  calculateGradientDistance(x, y, start, end, angle) {
    const radians = angle * Math.PI / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    
    const dx = x - start.x;
    const dy = y - start.y;
    
    return (dx * cos + dy * sin) / Math.sqrt(
      Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
    );
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

  applyAdjustments([r, g, b], adjustments, maskValue) {
    const {
      exposure = 0,
      contrast = 0,
      saturation = 0,
      hue = 0,
      temperature = 0,
      tint = 0
    } = adjustments;
    
    // Apply exposure
    r *= Math.pow(2, exposure);
    g *= Math.pow(2, exposure);
    b *= Math.pow(2, exposure);
    
    // Apply contrast
    const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    r = contrastFactor * (r - 128) + 128;
    g = contrastFactor * (g - 128) + 128;
    b = contrastFactor * (b - 128) + 128;
    
    // Apply saturation
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    r = gray + (r - gray) * (1 + saturation / 100);
    g = gray + (g - gray) * (1 + saturation / 100);
    b = gray + (b - gray) * (1 + saturation / 100);
    
    // Apply mask blending
    const originalR = r;
    const originalG = g;
    const originalB = b;
    
    r = originalR * maskValue + (r * (1 - maskValue));
    g = originalG * maskValue + (g * (1 - maskValue));
    b = originalB * maskValue + (b * (1 - maskValue));
    
    return [
      Math.max(0, Math.min(255, r)),
      Math.max(0, Math.min(255, g)),
      Math.max(0, Math.min(255, b))
    ];
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
