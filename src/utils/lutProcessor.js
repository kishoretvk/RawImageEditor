/**
 * LUT (Look-Up Table) Processing Utilities
 * Supports 3D LUT files for professional color grading
 */

export class LUTProcessor {
  constructor() {
    this.luts = new Map();
    this.worker = null;
  }

  async loadLUT(lutPath) {
    try {
      const response = await fetch(lutPath);
      const text = await response.text();
      
      // Parse .cube format
      if (lutPath.endsWith('.cube')) {
        return this.parseCubeLUT(text);
      }
      
      // Parse .3dl format
      if (lutPath.endsWith('.3dl')) {
        return this.parse3DLLUT(text);
      }
      
      throw new Error('Unsupported LUT format');
    } catch (error) {
      console.error('Failed to load LUT:', error);
      return null;
    }
  }

  parseCubeLUT(text) {
    const lines = text.split('\n');
    let size = 0;
    const data = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('LUT_3D_SIZE')) {
        size = parseInt(trimmed.split(' ')[1]);
      } else if (trimmed && !trimmed.startsWith('#')) {
        const values = trimmed.split(' ').map(v => parseFloat(v));
        if (values.length === 3) {
          data.push(...values);
        }
      }
    }
    
    return {
      size,
      data: new Float32Array(data),
      type: '3D'
    };
  }

  parse3DLLUT(text) {
    const lines = text.split('\n');
    let size = 0;
    const data = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const values = trimmed.split(' ').map(v => parseInt(v));
        if (values.length === 3) {
          data.push(...values.map(v => v / 1023));
        }
      }
    }
    
    size = Math.round(Math.pow(data.length / 3, 1/3));
    
    return {
      size,
      data: new Float32Array(data),
      type: '3D'
    };
  }

  applyLUT(imageData, lut, intensity = 1.0) {
    const { data, width, height } = imageData;
    const { size, lutData } = lut;
    
    const output = new Uint8ClampedArray(data);
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      
      // Sample from 3D LUT
      const lutR = Math.floor(r * (size - 1));
      const lutG = Math.floor(g * (size - 1));
      const lutB = Math.floor(b * (size - 1));
      
      const index = ((lutR * size + lutG) * size + lutB) * 3;
      
      const newR = lutData[index] * intensity + r * (1 - intensity);
      const newG = lutData[index + 1] * intensity + g * (1 - intensity);
      const newB = lutData[index + 2] * intensity + b * (1 - intensity);
      
      output[i] = Math.round(newR * 255);
      output[i + 1] = Math.round(newG * 255);
      output[i + 2] = Math.round(newB * 255);
    }
    
    return new ImageData(output, width, height);
  }

  // Generate identity LUT for testing
  generateIdentityLUT(size = 33) {
    const data = [];
    const step = 1 / (size - 1);
    
    for (let b = 0; b < size; b++) {
      for (let g = 0; g < size; g++) {
        for (let r = 0; r < size; r++) {
          data.push(r * step, g * step, b * step);
        }
      }
    }
    
    return {
      size,
      data: new Float32Array(data),
      type: '3D'
    };
  }
}

// Export singleton instance
export const lutProcessor = new LUTProcessor();

// Convenience function
export const applyLUT = async (imageData, lutPath, intensity = 1.0) => {
  const lut = await lutProcessor.loadLUT(lutPath);
  if (!lut) return imageData;
  
  return lutProcessor.applyLUT(imageData, lut, intensity);
};
