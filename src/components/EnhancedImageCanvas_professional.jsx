import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/loading-error.css';

// Helper function to clamp values
const clamp = (v, min = 0, max = 255) => Math.max(min, Math.min(max, v));

// Helper function to detect RAW image formats by extension
const isRawFormat = (fileName) => {
  if (!fileName) return false;
  const rawExtensions = ['.raw', '.arw', '.cr2', '.cr3', '.dng', '.nef', '.orf', '.rw2', '.pef', '.raf', '.srw'];
  const lowerCaseFileName = fileName.toLowerCase();
  return rawExtensions.some(ext => lowerCaseFileName.endsWith(ext));
};

// Color space conversion utilities
const rgbToHsl = (r, g, b) => {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h, s, l];
};

const hslToRgb = (h, s, l) => {
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
};

// Professional tone curve function
const applyCurve = (value, highlights, lights, darks, shadows) => {
  const normalized = value / 255;
  let adjusted = normalized;
  
  // Apply highlights (affects upper tones)
  if (normalized > 0.7) {
    adjusted += (highlights / 100) * (normalized - 0.7) * 0.3;
  }
  
  // Apply lights (affects mid-upper tones)
  if (normalized > 0.3 && normalized <= 0.7) {
    adjusted += (lights / 100) * (normalized - 0.3) * 0.4;
  }
  
  // Apply darks (affects mid-lower tones)
  if (normalized >= 0.1 && normalized <= 0.5) {
    adjusted += (darks / 100) * (normalized - 0.1) * 0.4;
  }
  
  // Apply shadows (affects lower tones)
  if (normalized < 0.3) {
    adjusted += (shadows / 100) * (0.3 - normalized) * 0.3;
  }
  
  return clamp(adjusted * 255);
};

// White balance adjustment
const adjustWhiteBalance = (r, g, b, temperature, tint) => {
  // Temperature adjustment (blue-yellow axis)
  const tempFactor = temperature / 2000;
  let newR = r + tempFactor * 30;
  let newB = b - tempFactor * 30;
  
  // Tint adjustment (green-magenta axis)
  const tintFactor = tint / 150;
  let newG = g + tintFactor * 20;
  newR = newR - tintFactor * 10;
  newB = newB - tintFactor * 10;
  
  return [clamp(newR), clamp(newG), clamp(newB)];
};

// Professional vibrance algorithm (protects skin tones)
const adjustVibrance = (r, g, b, vibrance) => {
  if (vibrance === 0) return [r, g, b];
  
  const [h, s, l] = rgbToHsl(r, g, b);
  
  // Skin tone protection (reduce effect in orange/red hues)
  const skinToneProtection = h > 0.05 && h < 0.15 ? 0.3 : 1.0;
  
  // Apply vibrance (affects less saturated colors more)
  const saturationWeight = 1 - s;
  const vibranceAdjustment = (vibrance / 100) * saturationWeight * skinToneProtection;
  const newSaturation = clamp(s + vibranceAdjustment, 0, 1);
  
  return hslToRgb(h, newSaturation, l);
};

// Clarity/local contrast enhancement
const enhanceClarity = (imageData, width, height, clarityAmount) => {
  if (clarityAmount === 0) return imageData;
  
  const data = new Uint8ClampedArray(imageData.data);
  const radius = 3;
  const strength = clarityAmount / 100;
  
  // Simple unsharp mask for clarity
  for (let y = radius; y < height - radius; y++) {
    for (let x = radius; x < width - radius; x++) {
      const idx = (y * width + x) * 4;
      
      // Calculate local average
      let avgR = 0, avgG = 0, avgB = 0;
      let count = 0;
      
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nIdx = ((y + dy) * width + (x + dx)) * 4;
          avgR += data[nIdx];
          avgG += data[nIdx + 1];
          avgB += data[nIdx + 2];
          count++;
        }
      }
      
      avgR /= count;
      avgG /= count;
      avgB /= count;
      
      // Apply enhancement
      data[idx] = clamp(data[idx] + (data[idx] - avgR) * strength);
      data[idx + 1] = clamp(data[idx + 1] + (data[idx + 1] - avgG) * strength);
      data[idx + 2] = clamp(data[idx + 2] + (data[idx + 2] - avgB) * strength);
    }
  }
  
  return new ImageData(data, width, height);
};

// Professional film grain
const addFilmGrain = (imageData, width, height, grainAmount, grainSize) => {
  if (grainAmount === 0) return imageData;
  
  const data = imageData.data;
  const intensity = grainAmount / 100;
  
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * intensity * grainSize;
    data[i] = clamp(data[i] + grain);
    data[i + 1] = clamp(data[i + 1] + grain);
    data[i + 2] = clamp(data[i + 2] + grain);
  }
  
  return imageData;
};

// Professional vignetting
const applyVignetting = (imageData, width, height, amount, midpoint) => {
  if (amount === 0) return imageData;
  
  const data = imageData.data;
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
  const vignetteStrength = amount / 100;
  const midpointNorm = midpoint / 100;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const distance = Math.sqrt((x - centerX) * (x - centerX) + (y - centerY) * (y - centerY));
      const normalizedDistance = distance / maxDistance;
      
      let vignetteFactor = 1;
      if (normalizedDistance > midpointNorm) {
        const falloff = (normalizedDistance - midpointNorm) / (1 - midpointNorm);
        vignetteFactor = 1 + vignetteStrength * falloff;
      }
      
      data[idx] = clamp(data[idx] * vignetteFactor);
      data[idx + 1] = clamp(data[idx + 1] * vignetteFactor);
      data[idx + 2] = clamp(data[idx + 2] * vignetteFactor);
    }
  }
  
  return imageData;
};

// Professional quick presets
const applyPreset = (r, g, b, preset) => {
  switch (preset) {
    case 'bw':
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      return [luminance, luminance, luminance];
    
    case 'vintage':
      // Vintage film look
      const newR = clamp(r * 1.1 + g * 0.1);
      const newG = clamp(g * 0.95);
      const newB = clamp(b * 0.8 + r * 0.05);
      return [newR, newG, newB];
    
    case 'portrait':
      // Warm skin tone enhancement
      const [h, s, l] = rgbToHsl(r, g, b);
      if (h > 0.05 && h < 0.15) { // Skin tone range
        const [enhR, enhG, enhB] = hslToRgb(h, s * 1.1, l * 1.05);
        return [enhR, enhG, enhB];
      }
      return [r, g, b];
    
    case 'landscape':
      // Enhanced greens and blues
      const landscapeR = clamp(r * 0.95);
      const landscapeG = clamp(g * 1.15);
      const landscapeB = clamp(b * 1.1);
      return [landscapeR, landscapeG, landscapeB];
    
    default:
      return [r, g, b];
  }
};

/**
 * Apply professional image filters to canvas context
 */
const applyProfessionalFilters = (ctx, image, edits = {}) => {
  const {
    // Basic adjustments
    exposure = 0, highlights = 0, shadows = 0, whites = 0, blacks = 0, contrast = 0,
    
    // Presence
    texture = 0, clarity = 0, dehaze = 0, vibrance = 0, saturation = 0,
    
    // HSL/Color
    hue = 0, redLuminance = 0, greenLuminance = 0, blueLuminance = 0,
    
    // White Balance
    temperature = 0, tint = 0,
    
    // Tone Curve
    curveHighlights = 0, curveLights = 0, curveDarks = 0, curveShadows = 0,
    
    // Detail
    sharpening = 25, sharpeningRadius = 1, noiseReduction = 0, colorNoiseReduction = 25,
    
    // Effects
    vignetting = 0, vignetteMidpoint = 50, grainAmount = 0, grainSize = 25,
    
    // Transform
    verticalPerspective = 0, horizontalPerspective = 0, rotate = 0,
    flipH = false, flipV = false,
    
    // Quick actions
    applyQuickAction = null
  } = edits;

  const width = image.width;
  const height = image.height;
  
  // Clear canvas and apply geometry transformations
  ctx.clearRect(0, 0, width, height);
  ctx.save();

  if (flipH || flipV || rotate !== 0) {
    ctx.translate(width / 2, height / 2);
    ctx.rotate((rotate * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(image, -width / 2, -height / 2);
  } else {
    ctx.drawImage(image, 0, 0);
  }
  ctx.restore();

  // Check if we need pixel-level processing
  const needsPixelProcessing = exposure !== 0 || highlights !== 0 || shadows !== 0 || 
                              whites !== 0 || blacks !== 0 || contrast !== 0 ||
                              vibrance !== 0 || saturation !== 0 || hue !== 0 ||
                              temperature !== 0 || tint !== 0 || clarity !== 0 ||
                              vignetting !== 0 || grainAmount !== 0 || applyQuickAction;

  if (!needsPixelProcessing) {
    return;
  }

  // Get image data for pixel manipulation
  let imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Apply pixel-level adjustments
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i], g = data[i + 1], b = data[i + 2];

    // Apply quick preset first if specified
    if (applyQuickAction) {
      [r, g, b] = applyPreset(r, g, b, applyQuickAction);
    }

    // White balance adjustment
    if (temperature !== 0 || tint !== 0) {
      [r, g, b] = adjustWhiteBalance(r, g, b, temperature, tint);
    }

    // Exposure adjustment (more accurate)
    if (exposure !== 0) {
      const expFactor = Math.pow(2, exposure);
      r = clamp(r * expFactor);
      g = clamp(g * expFactor);
      b = clamp(b * expFactor);
    }

    // Highlights and Shadows
    if (highlights !== 0 || shadows !== 0) {
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      const normalizedLum = luminance / 255;
      
      // Highlights (affect brighter areas)
      if (normalizedLum > 0.6 && highlights !== 0) {
        const highlightFactor = 1 + (highlights / 100) * (normalizedLum - 0.6) * 2.5;
        r = clamp(r * highlightFactor);
        g = clamp(g * highlightFactor);
        b = clamp(b * highlightFactor);
      }
      
      // Shadows (affect darker areas)
      if (normalizedLum < 0.4 && shadows !== 0) {
        const shadowFactor = 1 + (shadows / 100) * (0.4 - normalizedLum) * 2.5;
        r = clamp(r * shadowFactor);
        g = clamp(g * shadowFactor);
        b = clamp(b * shadowFactor);
      }
    }

    // Whites and Blacks
    if (whites !== 0) {
      const whiteFactor = 1 + (whites / 100) * 0.5;
      r = clamp(255 - (255 - r) / whiteFactor);
      g = clamp(255 - (255 - g) / whiteFactor);
      b = clamp(255 - (255 - b) / whiteFactor);
    }
    
    if (blacks !== 0) {
      const blackFactor = 1 + (blacks / 100) * 0.5;
      r = clamp(r / blackFactor);
      g = clamp(g / blackFactor);
      b = clamp(b / blackFactor);
    }

    // Contrast adjustment
    if (contrast !== 0) {
      const contrastFactor = 1 + (contrast / 100);
      r = clamp(((r / 255 - 0.5) * contrastFactor + 0.5) * 255);
      g = clamp(((g / 255 - 0.5) * contrastFactor + 0.5) * 255);
      b = clamp(((b / 255 - 0.5) * contrastFactor + 0.5) * 255);
    }

    // Tone curve adjustments
    if (curveHighlights !== 0 || curveLights !== 0 || curveDarks !== 0 || curveShadows !== 0) {
      r = applyCurve(r, curveHighlights, curveLights, curveDarks, curveShadows);
      g = applyCurve(g, curveHighlights, curveLights, curveDarks, curveShadows);
      b = applyCurve(b, curveHighlights, curveLights, curveDarks, curveShadows);
    }

    // Vibrance adjustment (professional algorithm)
    if (vibrance !== 0) {
      [r, g, b] = adjustVibrance(r, g, b, vibrance);
    }

    // Saturation adjustment
    if (saturation !== 0) {
      const [h, s, l] = rgbToHsl(r, g, b);
      const newSaturation = clamp(s + (saturation / 100), 0, 1);
      [r, g, b] = hslToRgb(h, newSaturation, l);
    }

    // Hue adjustment
    if (hue !== 0) {
      const [h, s, l] = rgbToHsl(r, g, b);
      const newHue = (h + (hue / 360)) % 1;
      [r, g, b] = hslToRgb(newHue < 0 ? newHue + 1 : newHue, s, l);
    }

    // Color luminance adjustments
    if (redLuminance !== 0) {
      const redWeight = r / (r + g + b + 1);
      const adjustment = (redLuminance / 100) * redWeight;
      r = clamp(r + adjustment * 50);
    }
    
    if (greenLuminance !== 0) {
      const greenWeight = g / (r + g + b + 1);
      const adjustment = (greenLuminance / 100) * greenWeight;
      g = clamp(g + adjustment * 50);
    }
    
    if (blueLuminance !== 0) {
      const blueWeight = b / (r + g + b + 1);
      const adjustment = (blueLuminance / 100) * blueWeight;
      b = clamp(b + adjustment * 50);
    }

    // Store processed values
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }

  // Apply clarity enhancement if needed
  if (clarity !== 0) {
    imageData = enhanceClarity(imageData, width, height, clarity);
  }

  // Apply vignetting if needed
  if (vignetting !== 0) {
    imageData = applyVignetting(imageData, width, height, vignetting, vignetteMidpoint);
  }

  // Apply film grain if needed
  if (grainAmount !== 0) {
    imageData = addFilmGrain(imageData, width, height, grainAmount, grainSize);
  }

  // Put the processed image data back to canvas
  ctx.putImageData(imageData, 0, 0);
};

const EnhancedImageCanvas = ({ imageSrc, edits, onProcessed }) => {
  const canvasRef = useRef(null);
  const originalCanvasRef = useRef(null);
  const processedCanvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Resize image if it's too large for performance
  const resizeImageIfNeeded = useCallback((img) => {
    const MAX_DIMENSION = 2000;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    let { width, height } = img;
    
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
      width = Math.floor(width * ratio);
      height = Math.floor(height * ratio);
    }
    
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0, width, height);
    
    return canvas;
  }, []);

  // Load and draw the original image
  const loadImage = useCallback(async () => {
    if (!imageSrc || !canvasRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('[EnhancedImageCanvas] Loading image:', imageSrc.name || 'Unknown');
      
      let imageUrl = imageSrc.url;
      
      // Handle RAW images
      if (isRawFormat(imageSrc.name)) {
        console.log('[EnhancedImageCanvas] RAW format detected, using fallback display');
        // For RAW files, we'll show a placeholder or the embedded thumbnail
        // In a production app, you'd integrate with a RAW processing library
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = imageUrl;
      });

      // Resize if needed for performance
      const processedImg = resizeImageIfNeeded(img);
      
      // Set up canvases
      const canvas = canvasRef.current;
      const originalCanvas = originalCanvasRef.current;
      const processedCanvas = processedCanvasRef.current;
      
      const width = processedImg.width;
      const height = processedImg.height;
      
      // Set canvas dimensions
      [canvas, originalCanvas, processedCanvas].forEach(c => {
        if (c) {
          c.width = width;
          c.height = height;
        }
      });

      // Draw original image
      const originalCtx = originalCanvas.getContext('2d');
      originalCtx.drawImage(processedImg, 0, 0);
      
      console.log('[EnhancedImageCanvas] Original image drawn');

      // Send processed data to parent
      if (onProcessed) {
        onProcessed({
          width,
          height,
          size: imageSrc.size,
          name: imageSrc.name,
          type: imageSrc.type
        });
      }

    } catch (err) {
      console.error('[EnhancedImageCanvas] Error loading image:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [imageSrc, resizeImageIfNeeded, onProcessed]);

  // Debounced filter application
  const applyFiltersDebounced = useCallback(
    (() => {
      let timeoutId;
      return (edits) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (!originalCanvasRef.current || !processedCanvasRef.current || !canvasRef.current) return;
          
          setIsProcessing(true);
          
          try {
            const originalCanvas = originalCanvasRef.current;
            const processedCanvas = processedCanvasRef.current;
            const displayCanvas = canvasRef.current;
            
            const originalCtx = originalCanvas.getContext('2d');
            const processedCtx = processedCanvas.getContext('2d');
            const displayCtx = displayCanvas.getContext('2d');
            
            // Copy original to processed canvas
            processedCtx.clearRect(0, 0, processedCanvas.width, processedCanvas.height);
            processedCtx.drawImage(originalCanvas, 0, 0);
            
            // Create temporary image from original canvas
            const tempImg = new Image();
            tempImg.onload = () => {
              // Apply filters to processed canvas
              applyProfessionalFilters(processedCtx, tempImg, edits);
              
              // Show before/after comparison on display canvas
              const width = displayCanvas.width;
              const height = displayCanvas.height;
              
              // Clear display canvas
              displayCtx.clearRect(0, 0, width, height);
              
              // Draw original on left half
              displayCtx.drawImage(originalCanvas, 0, 0, width/2, height, 0, 0, width/2, height);
              
              // Draw processed on right half
              displayCtx.drawImage(processedCanvas, width/2, 0, width/2, height, width/2, 0, width/2, height);
              
              // Draw divider line
              displayCtx.strokeStyle = '#4a9eff';
              displayCtx.lineWidth = 2;
              displayCtx.setLineDash([5, 5]);
              displayCtx.beginPath();
              displayCtx.moveTo(width/2, 0);
              displayCtx.lineTo(width/2, height);
              displayCtx.stroke();
              
              console.log('[EnhancedImageCanvas] Filters applied');
              setIsProcessing(false);
            };
            tempImg.src = originalCanvas.toDataURL();
            
          } catch (err) {
            console.error('[EnhancedImageCanvas] Error applying filters:', err);
            setIsProcessing(false);
          }
        }, 100);
      };
    })(),
    []
  );

  // Load image when source changes
  useEffect(() => {
    loadImage();
  }, [loadImage]);

  // Apply filters when edits change
  useEffect(() => {
    if (originalCanvasRef.current) {
      applyFiltersDebounced(edits);
    }
  }, [edits, applyFiltersDebounced]);

  return (
    <div className="enhanced-image-canvas">
      {/* Hidden canvases for processing */}
      <canvas ref={originalCanvasRef} style={{ display: 'none' }} />
      <canvas ref={processedCanvasRef} style={{ display: 'none' }} />
      
      {/* Display canvas */}
      <div className="canvas-container">
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Loading image...</p>
          </div>
        )}
        
        {error && (
          <div className="error-overlay">
            <div className="error-icon">⚠</div>
            <p className="error-message">{error}</p>
            <p className="error-suggestion">
              {isRawFormat(imageSrc?.name) 
                ? "RAW files require specialized processing. Consider converting to JPEG first."
                : "Please try uploading a different image format (JPEG, PNG, WebP)."
              }
            </p>
          </div>
        )}
        
        {isProcessing && (
          <div className="processing-indicator">
            <div className="processing-spinner"></div>
            <span>Processing...</span>
          </div>
        )}
        
        <canvas 
          ref={canvasRef}
          className={`main-canvas ${isLoading || error ? 'hidden' : ''}`}
        />
        
        {/* Before/After labels */}
        {!isLoading && !error && (
          <div className="comparison-labels">
            <div className="label-before">Original</div>
            <div className="label-after">Edited</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedImageCanvas;
