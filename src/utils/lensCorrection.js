/**
 * Lens Correction Utilities
 * Handles lens distortion, vignetting, and chromatic aberration correction
 */

export class LensCorrection {
  constructor() {
    this.profiles = new Map();
  }

  // Load lens profile from JSON
  async loadLensProfile(profilePath) {
    try {
      const response = await fetch(profilePath);
      const profile = await response.json();
      
      this.profiles.set(profile.name, profile);
      return profile;
    } catch (error) {
      console.error('Failed to load lens profile:', error);
      return null;
    }
  }

  // Apply lens corrections
  applyLensCorrection(imageData, width, height, profile) {
    const { data } = imageData;
    const output = new Uint8ClampedArray(data);
    
    // Apply distortion correction
    if (profile.distortion) {
      this.correctDistortion(data, output, width, height, profile.distortion);
    }
    
    // Apply vignetting correction
    if (profile.vignetting) {
      this.correctVignetting(output, width, height, profile.vignetting);
    }
    
    // Apply chromatic aberration correction
    if (profile.chromaticAberration) {
      this.correctChromaticAberration(output, width, height, profile.chromaticAberration);
    }
    
    return new ImageData(output, width, height);
  }

  // Correct lens distortion
  correctDistortion(input, output, width, height, distortionParams) {
    const { k1 = 0, k2 = 0, k3 = 0, p1 = 0, p2 = 0, centerX = 0.5, centerY = 0.5 } = distortionParams;
    
    const centerX_px = width * centerX;
    const centerY_px = height * centerY;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Normalize coordinates
        const nx = (x - centerX_px) / Math.max(width, height);
        const ny = (y - centerY_px) / Math.max(width, height);
        
        // Calculate radius
        const r2 = nx * nx + ny * ny;
        const r4 = r2 * r2;
        const r6 = r4 * r2;
        
        // Apply radial distortion
        const radialFactor = 1 + k1 * r2 + k2 * r4 + k3 * r6;
        
        // Apply tangential distortion
        const tx = 2 * p1 * nx * ny + p2 * (r2 + 2 * nx * nx);
        const ty = p1 * (r2 + 2 * ny * ny) + 2 * p2 * nx * ny;
        
        // Calculate source coordinates
        const srcX = centerX_px + (nx * radialFactor + tx) * Math.max(width, height);
        const srcY = centerY_px + (ny * radialFactor + ty) * Math.max(width, height);
        
        // Bilinear interpolation
        const pixel = this.bilinearInterpolate(input, width, height, srcX, srcY);
        const idx = (y * width + x) * 4;
        
        output[idx] = pixel[0];
        output[idx + 1] = pixel[1];
        output[idx + 2] = pixel[2];
        output[idx + 3] = pixel[3];
      }
    }
  }

  // Correct vignetting
  correctVignetting(data, width, height, vignettingParams) {
    const { strength = 0, centerX = 0.5, centerY = 0.5, radius = 1.0 } = vignettingParams;
    
    const centerX_px = width * centerX;
    const centerY_px = height * centerY;
    const maxRadius = Math.sqrt(centerX_px * centerX_px + centerY_px * centerY_px) * radius;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - centerX_px;
        const dy = y - centerY_px;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const vignette = 1 + strength * Math.pow(distance / maxRadius, 2);
        const correction = Math.max(0, Math.min(2, vignette));
        
        const idx = (y * width + x) * 4;
        data[idx] = Math.min(255, data[idx] * correction);
        data[idx + 1] = Math.min(255, data[idx + 1] * correction);
        data[idx + 2] = Math.min(255, data[idx + 2] * correction);
      }
    }
  }

  // Correct chromatic aberration
  correctChromaticAberration(data, width, height, caParams) {
    const { redScale = 1.0, redX = 0, redY = 0, blueScale = 1.0, blueX = 0, blueY = 0 } = caParams;
    
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Create temporary arrays for each channel
    const redChannel = new Uint8Array(width * height);
    const greenChannel = new Uint8Array(width * height);
    const blueChannel = new Uint8Array(width * height);
    
    // Extract channels
    for (let i = 0; i < data.length; i += 4) {
      const pixel = i / 4;
      redChannel[pixel] = data[i];
      greenChannel[pixel] = data[i + 1];
      blueChannel[pixel] = data[i + 2];
    }
    
    // Apply corrections
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        
        // Red channel correction
        const redSrcX = centerX + (x - centerX) * redScale + redX;
        const redSrcY = centerY + (y - centerY) * redScale + redY;
        const redValue = this.bilinearInterpolateChannel(redChannel, width, height, redSrcX, redSrcY);
        
        // Blue channel correction
        const blueSrcX = centerX + (x - centerX) * blueScale + blueX;
        const blueSrcY = centerY + (y - centerY) * blueScale + blueY;
        const blueValue = this.bilinearInterpolateChannel(blueChannel, width, height, blueSrcX, blueSrcY);
        
        // Green channel (reference)
        const greenValue = greenChannel[idx];
        
        // Apply corrections
        const dataIdx = idx * 4;
        data[dataIdx] = redValue;
        data[dataIdx + 1] = greenValue;
        data[dataIdx + 2] = blueValue;
      }
    }
  }

  // Bilinear interpolation for RGBA
  bilinearInterpolate(data, width, height, x, y) {
    const x1 = Math.floor(x);
    const y1 = Math.floor(y);
    const x2 = Math.min(width - 1, x1 + 1);
    const y2 = Math.min(height - 1, y1 + 1);
    
    const dx = x - x1;
    const dy = y - y1;
    
    const idx11 = (y1 * width + x1) * 4;
    const idx12 = (y2 * width + x1) * 4;
    const idx21 = (y1 * width + x2) * 4;
    const idx22 = (y2 * width + x2) * 4;
    
    const interpolate = (v11, v12, v21, v22) => {
      const top = v11 * (1 - dx) + v21 * dx;
      const bottom = v12 * (1 - dx) + v22 * dx;
      return top * (1 - dy) + bottom * dy;
    };
    
    return [
      Math.round(interpolate(data[idx11], data[idx12], data[idx21], data[idx22])),
      Math.round(interpolate(data[idx11 + 1], data[idx12 + 1], data[idx21 + 1], data[idx22 + 1])),
      Math.round(interpolate(data[idx11 + 2], data[idx12 + 2], data[idx21 + 2], data[idx22 + 2])),
      Math.round(interpolate(data[idx11 + 3], data[idx12 + 3], data[idx21 + 3], data[idx22 + 3]))
    ];
  }

  // Bilinear interpolation for single channel
  bilinearInterpolateChannel(channel, width, height, x, y) {
    const x1 = Math.floor(x);
    const y1 = Math.floor(y);
    const x2 = Math.min(width - 1, x1 + 1);
    const y2 = Math.min(height - 1, y1 + 1);
    
    const dx = x - x1;
    const dy = y - y1;
    
    const v11 = channel[y1 * width + x1] || 0;
    const v12 = channel[y2 * width + x1] || 0;
    const v21 = channel[y1 * width + x2] || 0;
    const v22 = channel[y2 * width + x2] || 0;
    
    const top = v11 * (1 - dx) + v21 * dx;
    const bottom = v12 * (1 - dx) + v22 * dx;
    
    return Math.round(top * (1 - dy) + bottom * dy);
  }

  // Generate lens profile from calibration images
  generateLensProfile(calibrationImages) {
    // Placeholder for automatic lens profile generation
    // In production, this would analyze calibration patterns
    return {
      name: 'auto-generated',
      distortion: {
        k1: 0.0,
        k2: 0.0,
        k3: 0.0,
        p1: 0.0,
        p2: 0.0
      },
      vignetting: {
        strength: 0.0,
        centerX: 0.5,
        centerY: 0.5,
        radius: 1.0
      },
      chromaticAberration: {
        redScale: 1.0,
        redX: 0,
        redY: 0,
        blueScale: 1.0,
        blueX: 0,
        blueY: 0
      }
    };
  }

  // Get built-in lens profiles
  getBuiltInProfiles() {
    return [
      {
        name: 'Canon EF 50mm f/1.8 STM',
        distortion: { k1: -0.02, k2: 0.01, k3: 0, p1: 0, p2: 0 },
        vignetting: { strength: -0.3, centerX: 0.5, centerY: 0.5, radius: 1.0 },
        chromaticAberration: { redScale: 1.0, redX: 0.5, redY: 0, blueScale: 1.0, blueX: -0.5, blueY: 0 }
      },
      {
        name: 'Nikon 35mm f/1.8G',
        distortion: { k1: -0.015, k2: 0.008, k3: 0, p1: 0, p2: 0 },
        vignetting: { strength: -0.25, centerX: 0.5, centerY: 0.5, radius: 1.0 },
        chromaticAberration: { redScale: 1.0, redX: 0.3, redY: 0, blueScale: 1.0, blueX: -0.3, blueY: 0 }
      },
      {
        name: 'Sony FE 24-70mm f/2.8 GM',
        distortion: { k1: 0.01, k2: -0.005, k3: 0, p1: 0, p2: 0 },
        vignetting: { strength: -0.2, centerX: 0.5, centerY: 0.5, radius: 1.0 },
        chromaticAberration: { redScale: 1.0, redX: 0.2, redY: 0, blueScale: 1.0, blueX: -0.2, blueY: 0 }
      }
    ];
  }
}

// Export singleton instance
export const lensCorrection = new LensCorrection();

// Convenience function
export const applyLensCorrection = (imageData, width, height, profile) => {
  return lensCorrection.applyLensCorrection(imageData, width, height, profile);
};
