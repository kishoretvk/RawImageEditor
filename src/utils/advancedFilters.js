/**
 * Advanced image filter functions
 * These provide professional-grade adjustments for the Advanced panel
 */

// Helper function for pixel data clamp
const clamp = (value, min = 0, max = 255) => Math.max(min, Math.min(max, value));

/**
 * Applies HDR/tone mapping effect
 * @param {ImageData} imageData - The image data to process
 * @param {Number} value - HDR intensity (0-2, 1 is neutral)
 * @returns {ImageData} Processed image data
 */
export const applyHDR = (imageData, value) => {
  // Skip if value is neutral
  if (value === 1) return imageData;
  
  const data = imageData.data;
  // Simple placeholder: boost/reduce dynamic range
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Mid-tone reference (0-255 scale)
    const mid = 128;
    
    // Compress or expand dynamic range based on HDR value
    const factor = value < 1 ? 1 + (1 - value) : 1 / value;
    
    // Apply tone mapping - compress/expand range around middle gray
    data[i] = clamp(mid + (r - mid) * factor);
    data[i + 1] = clamp(mid + (g - mid) * factor);
    data[i + 2] = clamp(mid + (b - mid) * factor);
  }
  
  return imageData;
};

/**
 * Applies Curves adjustment to tonal range
 * @param {ImageData} imageData - The image data to process
 * @param {Number} value - Curves intensity (0-2, 1 is neutral)
 * @returns {ImageData} Processed image data
 */
export const applyCurves = (imageData, value) => {
  // Skip if value is neutral
  if (value === 1) return imageData;
  
  const data = imageData.data;
  // Simple placeholder: S-curve for contrast
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const normalized = data[i + c] / 255;
      
      // Apply S-curve with variable strength
      // S-curve formula: x + (x - 0.5)^3 * strength
      const curveStrength = (value - 1) * 4; // Mapping 0-2 to -4 to 4
      const adjusted = normalized + Math.pow(normalized - 0.5, 3) * curveStrength;
      
      data[i + c] = clamp(adjusted * 255);
    }
  }
  
  return imageData;
};

/**
 * Applies Channel Mixer adjustment
 * @param {ImageData} imageData - The image data to process
 * @param {Number} value - Channel mixing intensity (0-2, 1 is neutral)
 * @returns {ImageData} Processed image data
 */
export const applyChannelMixer = (imageData, value) => {
  // Skip if value is neutral
  if (value === 1) return imageData;
  
  // Create a copy of the image data for reading while we modify
  const { width, height, data } = imageData;
  const tempData = new Uint8ClampedArray(data);
  
  // Simple placeholder: blend channels based on value
  // Value < 1: reduce mixing (more separation)
  // Value > 1: increase mixing (less separation)
  const mixFactor = (value - 1) * 0.5; // Scale to a reasonable range
  
  for (let i = 0; i < data.length; i += 4) {
    const r = tempData[i];
    const g = tempData[i + 1];
    const b = tempData[i + 2];
    
    // Mix channels with variable strength
    data[i] = clamp(r * (1 - mixFactor) + (g + b) * 0.5 * mixFactor);
    data[i + 1] = clamp(g * (1 - mixFactor) + (r + b) * 0.5 * mixFactor);
    data[i + 2] = clamp(b * (1 - mixFactor) + (r + g) * 0.5 * mixFactor);
  }
  
  return imageData;
};

/**
 * Applies LUT (Look-Up Table) intensity
 * @param {ImageData} imageData - The image data to process
 * @param {Number} value - LUT intensity (0-1)
 * @returns {ImageData} Processed image data
 */
export const applyLUT = (imageData, value) => {
  // Skip if no LUT is applied
  if (value === 0) return imageData;
  
  const data = imageData.data;
  
  // Simple placeholder: apply a sepia-like look
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Sepia tone formula
    const tr = 0.393 * r + 0.769 * g + 0.189 * b;
    const tg = 0.349 * r + 0.686 * g + 0.168 * b;
    const tb = 0.272 * r + 0.534 * g + 0.131 * b;
    
    // Apply LUT with intensity
    data[i] = clamp(r * (1 - value) + tr * value);
    data[i + 1] = clamp(g * (1 - value) + tg * value);
    data[i + 2] = clamp(b * (1 - value) + tb * value);
  }
  
  return imageData;
};

/**
 * Applies defogging effect (reduces haze)
 * @param {ImageData} imageData - The image data to process
 * @param {Number} value - Defog intensity (0-1)
 * @returns {ImageData} Processed image data
 */
export const applyDefog = (imageData, value) => {
  // Skip if no defog is applied
  if (value === 0) return imageData;
  
  const data = imageData.data;
  
  // Simple placeholder: enhance local contrast and reduce blue/white cast
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Detect haze (high blue, similar RGB values)
    const luminance = (r + g + b) / 3;
    const hazeAmount = Math.min(1, (b - r) / 128) * (luminance / 255);
    
    // Reduce haze and enhance contrast
    const contrast = 1 + value * 0.3;
    const defogFactor = value * hazeAmount;
    
    data[i] = clamp((r - 128) * contrast + 128 + defogFactor * 20);
    data[i + 1] = clamp((g - 128) * contrast + 128 + defogFactor * 10);
    data[i + 2] = clamp((b - 128) * contrast + 128 - defogFactor * 30);
  }
  
  return imageData;
};

/**
 * Applies Shadow/Highlight recovery
 * @param {ImageData} imageData - The image data to process
 * @param {Number} value - Shadow/Highlight recovery intensity (0-2, 1 is neutral)
 * @returns {ImageData} Processed image data
 */
export const applyShadowHighlight = (imageData, value) => {
  // Skip if value is neutral
  if (value === 1) return imageData;
  
  const data = imageData.data;
  
  // Simple placeholder: bring up shadows / pull down highlights
  const strength = (value - 1) * 0.5; // -0.5 to 0.5
  
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const pixel = data[i + c];
      const normalized = pixel / 255;
      
      // Shadow/highlight curve
      // Positive strength: lift shadows, compress highlights
      // Negative strength: deepen shadows, expand highlights
      let adjusted;
      if (normalized < 0.5) {
        // Shadows
        adjusted = normalized + (0.5 - normalized) * strength;
      } else {
        // Highlights
        adjusted = normalized - (normalized - 0.5) * strength;
      }
      
      data[i + c] = clamp(adjusted * 255);
    }
  }
  
  return imageData;
};

/**
 * Applies Chromatic Aberration correction
 * @param {ImageData} imageData - The image data to process
 * @param {Number} value - Chromatic aberration correction intensity (0-1)
 * @returns {ImageData} Processed image data
 */
export const applyChromaticAberration = (imageData, value) => {
  // Skip if no correction is applied
  if (value === 0) return imageData;
  
  const { width, height, data } = imageData;
  // Simple placeholder: simulate basic fringing correction
  
  // For a real implementation, this would need to:
  // 1. Analyze RGB channels for color fringing at edges
  // 2. Align the RGB channels to reduce fringing
  // 3. Apply selective correction at image edges
  
  // Placeholder: reduce color saturation at high-contrast edges
  const tempData = new Uint8ClampedArray(data);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4;
      
      // Check for high contrast (edge detection)
      const iLeft = (y * width + (x - 1)) * 4;
      const iRight = (y * width + (x + 1)) * 4;
      const iTop = ((y - 1) * width + x) * 4;
      const iBottom = ((y + 1) * width + x) * 4;
      
      const edgeDetect = Math.abs(tempData[iLeft] - tempData[iRight]) + 
                         Math.abs(tempData[iTop] - tempData[iBottom]);
      
      // If high contrast edge detected, reduce color saturation
      if (edgeDetect > 50) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const correctionAmount = value * 0.8;
        
        data[i] = Math.round(data[i] * (1 - correctionAmount) + avg * correctionAmount);
        data[i + 1] = Math.round(data[i + 1] * (1 - correctionAmount) + avg * correctionAmount);
        data[i + 2] = Math.round(data[i + 2] * (1 - correctionAmount) + avg * correctionAmount);
      }
    }
  }
  
  return imageData;
};

/**
 * Applies Vignetting effect
 * @param {ImageData} imageData - The image data to process
 * @param {Number} width - Image width
 * @param {Number} height - Image height
 * @param {Number} value - Vignette intensity (-1 to 1, 0 is neutral)
 * @returns {ImageData} Processed image data
 */
export const applyVignetting = (imageData, width, height, value) => {
  // Skip if no vignetting is applied
  if (value === 0) return imageData;
  
  const data = imageData.data;
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
  
  // Dark vignette (negative values) or light vignette (positive values)
  const isLightVignette = value > 0;
  const intensity = Math.abs(value);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      
      // Calculate distance from center (normalized 0-1)
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy) / maxDistance;
      
      // Non-linear falloff for more pleasing vignette
      const falloff = Math.pow(distance, 2.5) * intensity;
      
      if (isLightVignette) {
        // Light vignette (add light to edges)
        data[i] = clamp(data[i] + falloff * 255);
        data[i + 1] = clamp(data[i + 1] + falloff * 255);
        data[i + 2] = clamp(data[i + 2] + falloff * 255);
      } else {
        // Dark vignette (subtract light from edges)
        data[i] = clamp(data[i] * (1 - falloff));
        data[i + 1] = clamp(data[i + 1] * (1 - falloff));
        data[i + 2] = clamp(data[i + 2] * (1 - falloff));
      }
    }
  }
  
  return imageData;
};

/**
 * Applies Film Grain effect
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Number} width - Image width
 * @param {Number} height - Image height
 * @param {Number} value - Film grain intensity (0-1)
 */
export const applyFilmGrain = (ctx, width, height, value) => {
  // Skip if no grain is applied
  if (value === 0) return;
  
  // Get current image data
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Simple placeholder: add random noise with intensity
  const noiseIntensity = value * 30; // Scale to reasonable range
  
  for (let i = 0; i < data.length; i += 4) {
    // Generate noise between -noiseIntensity and +noiseIntensity
    const noise = (Math.random() - 0.5) * 2 * noiseIntensity;
    
    // Apply noise to all channels
    data[i] = clamp(data[i] + noise);
    data[i + 1] = clamp(data[i + 1] + noise);
    data[i + 2] = clamp(data[i + 2] + noise);
  }
  
  ctx.putImageData(imageData, 0, 0);
};
