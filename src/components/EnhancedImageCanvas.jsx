import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import '../styles/loading-error.css';
import '../styles/responsive-canvas.css';
import { processRAWFile, isRawFormat, getRawFormatInfo, getRAWWorkflowRecommendation, cleanupRAWResources } from '../utils/rawProcessor';

// RAW Image Quality Enhancement Function
const enhanceRAWImageQuality = async (processedImageData) => {
  try {
    console.log('[EnhancedImageCanvas] Enhancing RAW image quality...');
    
    // Create temporary canvas for enhancement
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Load the image
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = processedImageData.url;
    });
    
    canvas.width = img.width;
    canvas.height = img.height;
    
    // Draw and enhance
    ctx.drawImage(img, 0, 0);
    
    // Apply quality enhancements
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Enhance contrast and sharpness
    for (let i = 0; i < data.length; i += 4) {
      // Apply slight contrast boost
      data[i] = Math.min(255, Math.max(0, (data[i] - 128) * 1.1 + 128));     // R
      data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * 1.1 + 128)); // G
      data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * 1.1 + 128)); // B
      
      // Slight saturation boost
      const r = data[i] / 255;
      const g = data[i + 1] / 255;
      const b = data[i + 2] / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const delta = max - min;
      
      if (delta > 0) {
        const saturation = delta / max;
        const enhancedSat = Math.min(1, saturation * 1.1);
        const factor = enhancedSat / saturation;
        
        const gray = (r + g + b) / 3;
        data[i] = Math.min(255, (gray + (r - gray) * factor) * 255);
        data[i + 1] = Math.min(255, (gray + (g - gray) * factor) * 255);
        data[i + 2] = Math.min(255, (gray + (b - gray) * factor) * 255);
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Create enhanced blob
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(processedImageData.url); // Clean up old URL
        const enhancedUrl = URL.createObjectURL(blob);
        resolve({
          ...processedImageData,
          url: enhancedUrl,
          quality: 'high',
          enhanced: true
        });
      }, 'image/jpeg', 0.95);
    });
    
  } catch (error) {
    console.warn('[EnhancedImageCanvas] Quality enhancement failed:', error);
    return processedImageData; // Return original if enhancement fails
  }
};

// Helper function to clamp values
const clamp = (v, min = 0, max = 255) => Math.max(min, Math.min(max, v));

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

const EnhancedImageCanvas = ({ 
  imageSrc, 
  edits, 
  onProcessed, 
  showSlider = false, 
  sliderPosition = 50, 
  onSliderChange,
  hideControls = false,
  hideFullscreen = false
}) => {
  const canvasRef = useRef(null);
  const originalCanvasRef = useRef(null);
  const processedCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const loadingRef = useRef(false); // Track loading state to prevent double loads
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [originalImageSize, setOriginalImageSize] = useState({ width: 0, height: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Responsive canvas sizing hook
  const calculateCanvasSize = useCallback(() => {
    if (!containerRef.current || !originalImageSize.width || !originalImageSize.height) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();
    
    // For fullscreen, use entire viewport
    if (isFullscreen) {
      const displayWidth = window.innerWidth * zoomLevel;
      const displayHeight = window.innerHeight * zoomLevel;
      setCanvasSize({
        width: Math.round(displayWidth),
        height: Math.round(displayHeight)
      });
      return;
    }
    
    // For normal view, use most of the available space
    const availableWidth = containerRect.width - 20; // Minimal padding
    const availableHeight = Math.max(
      window.innerHeight * 0.8, // Use 80% of viewport height by default
      containerRect.height - 20
    );

    // Calculate aspect ratio
    const imageAspectRatio = originalImageSize.width / originalImageSize.height;
    const containerAspectRatio = availableWidth / availableHeight;

    let displayWidth, displayHeight;

    if (imageAspectRatio > containerAspectRatio) {
      // Image is wider than container - fit to width
      displayWidth = availableWidth;
      displayHeight = availableWidth / imageAspectRatio;
    } else {
      // Image is taller than container - fit to height  
      displayHeight = availableHeight;
      displayWidth = availableHeight * imageAspectRatio;
    }

    // Apply zoom level
    displayWidth *= zoomLevel;
    displayHeight *= zoomLevel;

    // Ensure reasonable minimum size
    const minSize = 300;
    if (displayWidth < minSize || displayHeight < minSize) {
      const scale = minSize / Math.min(displayWidth, displayHeight);
      displayWidth *= scale;
      displayHeight *= scale;
    }

    setCanvasSize({
      width: Math.round(displayWidth),
      height: Math.round(displayHeight)
    });
  }, [originalImageSize, zoomLevel, isFullscreen]);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      setTimeout(calculateCanvasSize, 100); // Debounce resize
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateCanvasSize]);

  // Calculate canvas size when original image size changes
  useEffect(() => {
    if (originalImageSize.width > 0 && originalImageSize.height > 0) {
      calculateCanvasSize();
    }
  }, [originalImageSize, calculateCanvasSize]);

  // Touch and pan handling for mobile devices
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState(0);
  
  // Slider drag handling
  const [isSliderDragging, setIsSliderDragging] = useState(false);

  // Scroll wheel zoom handler
  const handleWheel = useCallback((e) => {
    if (!canvasRef.current) return;
    
    e.preventDefault();
    
    // Determine zoom direction and amount
    const delta = e.deltaY > 0 ? -0.15 : 0.15; // Increased zoom speed for better UX
    const newZoom = Math.max(0.1, Math.min(5, zoomLevel + delta));
    
    setZoomLevel(newZoom);
  }, [zoomLevel]);

  // Mouse panning for desktop
  const [isMousePanning, setIsMousePanning] = useState(false);
  const [mouseStart, setMouseStart] = useState({ x: 0, y: 0 });

  const handleMousePanStart = useCallback((e) => {
    if (zoomLevel > 1 && e.button === 0) { // Left mouse button
      setIsMousePanning(true);
      setMouseStart({
        x: e.clientX - panOffset.x,
        y: e.clientY - panOffset.y
      });
      e.preventDefault();
    }
  }, [zoomLevel, panOffset]);

  const handleMousePanMove = useCallback((e) => {
    if (isMousePanning) {
      e.preventDefault();
      setPanOffset({
        x: e.clientX - mouseStart.x,
        y: e.clientY - mouseStart.y
      });
    }
  }, [isMousePanning, mouseStart]);

  const handleMousePanEnd = useCallback(() => {
    setIsMousePanning(false);
  }, []);

  const getTouchDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = useCallback((e) => {
    if (showSlider && e.touches.length === 1) {
      // Check if touch is on slider handle
      const rect = canvasRef.current.getBoundingClientRect();
      const touchX = e.touches[0].clientX - rect.left;
      const sliderX = (rect.width * sliderPosition) / 100;
      
      // If touch is near slider handle (within 40px), start dragging
      if (Math.abs(touchX - sliderX) < 40) {
        setIsSliderDragging(true);
        e.preventDefault();
        // Immediately update slider position
        const newPosition = Math.max(0, Math.min(100, (touchX / rect.width) * 100));
        if (onSliderChange) onSliderChange(newPosition);
        return;
      }
    }
    
    if (e.touches.length === 1 && zoomLevel > 1) {
      setIsPanning(true);
      setPanStart({
        x: e.touches[0].clientX - panOffset.x,
        y: e.touches[0].clientY - panOffset.y
      });
    } else if (e.touches.length === 2) {
      // Pinch to zoom
      const distance = getTouchDistance(e.touches);
      setLastTouchDistance(distance);
    }
  }, [zoomLevel, panOffset, showSlider, sliderPosition, onSliderChange]);

  const handleTouchMove = useCallback((e) => {
    if (isSliderDragging && showSlider && e.touches.length === 1) {
      e.preventDefault();
      const rect = canvasRef.current.getBoundingClientRect();
      const touchX = e.touches[0].clientX - rect.left;
      const newPosition = Math.max(0, Math.min(100, (touchX / rect.width) * 100));
      if (onSliderChange) onSliderChange(newPosition);
      return;
    }
    
    if (isPanning && e.touches.length === 1) {
      e.preventDefault();
      setPanOffset({
        x: e.touches[0].clientX - panStart.x,
        y: e.touches[0].clientY - panStart.y
      });
    } else if (e.touches.length === 2 && lastTouchDistance > 0) {
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      const scale = distance / lastTouchDistance;
      const newZoom = Math.max(0.1, Math.min(3, zoomLevel * scale));
      setZoomLevel(newZoom);
      setLastTouchDistance(distance);
    }
  }, [isPanning, panStart, lastTouchDistance, zoomLevel, isSliderDragging, showSlider, onSliderChange]);

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false);
    setIsSliderDragging(false);
    setLastTouchDistance(0);
  }, []);

  // Reset pan when zoom changes
  useEffect(() => {
    if (zoomLevel <= 1) {
      setPanOffset({ x: 0, y: 0 });
    }
  }, [zoomLevel]);

  // Zoom controls - defined early to avoid hoisting issues
  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev * 1.3, 5)); // Increased max zoom to 5x
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev / 1.3, 0.1));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 }); // Reset pan when resetting zoom
  }, []);

  const handleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!containerRef.current || isFullscreen) return;
      
      switch (e.key) {
        case '+':
        case '=':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleZoomIn();
          }
          break;
        case '-':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleZoomOut();
          }
          break;
        case '0':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            handleZoomReset();
          }
          break;
        case 'f':
        case 'F11':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            handleFullscreen();
          }
          break;
        case 'Escape':
          if (isFullscreen) {
            e.preventDefault();
            setIsFullscreen(false);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleZoomIn, handleZoomOut, handleZoomReset, handleFullscreen, isFullscreen]);

  // Resize image if it's too large for performance
  const resizeImageIfNeeded = useCallback((img) => {
    const MAX_DIMENSION = 2000;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    
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

  // Load and draw the original image with RAW support
  const loadImage = useCallback(async () => {
    if (!imageSrc || !canvasRef.current || loadingRef.current) return;

    loadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // Handle different imageSrc formats
      const fileName = imageSrc.filename || imageSrc.name || 'Unknown';
      console.log('[EnhancedImageCanvas] Loading image:', fileName);
      
      let processedImageData;
      
      // Check if it's a RAW format
      if (isRawFormat(fileName)) {
        console.log('[EnhancedImageCanvas] RAW format detected, processing with RAW decoder');
        
        try {
          // Use professional RAW processor with enhanced quality settings
          processedImageData = await processRAWFile(imageSrc.file || imageSrc, {
            enhanceQuality: true,
            targetResolution: 'high',
            colorSpace: 'sRGB',
            gamma: 2.2,
            whiteBalance: 'auto'
          });
          console.log(`[EnhancedImageCanvas] RAW processed using strategy: ${processedImageData.strategy}`);
          
          // Apply post-processing quality enhancement for RAW images
          if (processedImageData.quality !== 'high') {
            console.log('[EnhancedImageCanvas] Applying quality enhancement to RAW image');
            processedImageData = await enhanceRAWImageQuality(processedImageData);
          }
          
          // Show format information
          const formatInfo = getRawFormatInfo(fileName);
          if (formatInfo) {
            console.log(`[EnhancedImageCanvas] RAW format: ${formatInfo.brand} ${formatInfo.description}`);
          }
          
        } catch (rawError) {
          console.warn('[EnhancedImageCanvas] RAW processing failed:', rawError);
          throw new Error(`RAW processing failed: ${rawError.message}`);
        }
      } else {
        // Regular image processing - use the existing URL if available
        if (imageSrc.url || imageSrc.preview) {
          // Use existing blob URL or preview URL
          processedImageData = {
            url: imageSrc.url || imageSrc.preview,
            type: 'standard',
            strategy: 'direct'
          };
        } else if (imageSrc.file instanceof File) {
          // Create a fresh blob URL if we have a file
          const url = URL.createObjectURL(imageSrc.file);
          processedImageData = {
            url: url,
            type: 'standard',
            strategy: 'direct',
            file: imageSrc.file
          };
        } else {
          // Direct URL
          processedImageData = {
            url: imageSrc,
            type: 'standard',
            strategy: 'direct'
          };
        }
      }

      // Load the processed image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = () => {
          console.log('[EnhancedImageCanvas] Image loaded successfully');
          resolve();
        };
        
        img.onerror = (e) => {
          console.error('[EnhancedImageCanvas] Image load error:', e);
          
          // Try alternative loading method if initial fails
          if (imageSrc.file instanceof File) {
            console.log('[EnhancedImageCanvas] Retrying with new blob URL...');
            try {
              const newUrl = URL.createObjectURL(imageSrc.file);
              img.src = newUrl;
              // Don't set up another onerror to avoid infinite loops
            } catch (recreateError) {
              reject(new Error('Failed to load image: ' + recreateError.message));
            }
          } else {
            reject(new Error('Failed to load image from URL: ' + processedImageData.url));
          }
        };
        
        // Set the image source
        img.src = processedImageData.url;
      });

      // Resize if needed for performance
      const processedImg = resizeImageIfNeeded(img);
      
      // Set up canvases
      const canvas = canvasRef.current;
      const originalCanvas = originalCanvasRef.current;
      const processedCanvas = processedCanvasRef.current;
      
      const width = processedImg.width;
      const height = processedImg.height;
      
      // Store original image dimensions for responsive sizing
      setOriginalImageSize({ width, height });
      
      // Calculate display size now that we have image dimensions
      setTimeout(() => calculateCanvasSize(), 50);
      
      // Set canvas dimensions to actual image size with quality optimization
      [canvas, originalCanvas, processedCanvas].forEach(c => {
        if (c) {
          c.width = width;
          c.height = height;
          
          // Ensure high-quality rendering for both RAW and JPEG
          const ctx = c.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Apply better interpolation for RAW images
          if (processedImageData.type !== 'standard') {
            ctx.filter = 'contrast(1.02) brightness(1.01)';
          }
        }
      });

      // Draw original image with optimized context
      const originalCtx = originalCanvas.getContext('2d', { 
        willReadFrequently: true,
        alpha: false  // Better performance for opaque images
      });
      
      // Enable high-quality scaling
      originalCtx.imageSmoothingEnabled = true;
      originalCtx.imageSmoothingQuality = 'high';
      
      // Apply enhancement for RAW images to match JPEG quality
      if (processedImageData.type !== 'standard') {
        originalCtx.filter = 'contrast(1.02) brightness(1.01) saturate(1.05)';
      }
      
      originalCtx.drawImage(processedImg, 0, 0);
      
      // Reset filter
      originalCtx.filter = 'none';
      
      console.log(`[EnhancedImageCanvas] Original image drawn (${processedImageData.type} format)`);

      // Send processed data to parent with quality information
      if (onProcessed) {
        onProcessed({
          width,
          height,
          size: imageSrc.size,
          name: fileName,
          type: imageSrc.type,
          quality: processedImageData.quality || 'standard',
          enhanced: processedImageData.enhanced || false,
          rawProcessing: processedImageData.type !== 'standard' ? {
            strategy: processedImageData.strategy,
            formatInfo: processedImageData.formatInfo
          } : null
        });
      }

    } catch (err) {
      console.error('[EnhancedImageCanvas] Error loading image:', err);
      
      // Show helpful error message for RAW files
      if (isRawFormat(fileName)) {
        const recommendation = getRAWWorkflowRecommendation(imageSrc.file || imageSrc);
        setError(`RAW processing error: ${err.message}. ${recommendation.recommendations[0]}`);
      } else {
        setError(err.message);
      }
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [imageSrc, resizeImageIfNeeded, onProcessed]);

  // Debounced filter application
  const applyFiltersDebounced = useCallback(
    (() => {
      let timeoutId;
      return (edits, forceImmediate = false) => {
        if (timeoutId) clearTimeout(timeoutId);
        
        // For slider changes, apply immediately for better responsiveness
        const delay = forceImmediate ? 0 : 100;
        
        timeoutId = setTimeout(() => {
          if (!originalCanvasRef.current || !processedCanvasRef.current || !canvasRef.current) return;
          
          setIsProcessing(true);
          
          try {
            const originalCanvas = originalCanvasRef.current;
            const processedCanvas = processedCanvasRef.current;
            const displayCanvas = canvasRef.current;
            
            const originalCtx = originalCanvas.getContext('2d', { willReadFrequently: true });
            const processedCtx = processedCanvas.getContext('2d', { willReadFrequently: true });
            const displayCtx = displayCanvas.getContext('2d', { willReadFrequently: true });
            
            // Ensure high-quality rendering for all contexts
            [originalCtx, processedCtx, displayCtx].forEach(ctx => {
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';
            });
            
            // Copy original to processed canvas
            processedCtx.clearRect(0, 0, processedCanvas.width, processedCanvas.height);
            processedCtx.drawImage(originalCanvas, 0, 0);
            
            // Create temporary image from original canvas
            const tempImg = new Image();
            tempImg.onload = () => {
              // Apply filters to processed canvas with enhanced quality
              applyProfessionalFilters(processedCtx, tempImg, edits);
              
          // Show before/after comparison on display canvas with slider
          const width = displayCanvas.width;
          const height = displayCanvas.height;
          const sliderX = showSlider ? (width * sliderPosition / 100) : width / 2;
          
          // Clear display canvas with quality settings
          displayCtx.clearRect(0, 0, width, height);
          displayCtx.imageSmoothingEnabled = true;
          displayCtx.imageSmoothingQuality = 'high';
          
          // Draw original image on left side
          if (showSlider) {
            displayCtx.save();
            displayCtx.beginPath();
            displayCtx.rect(0, 0, sliderX, height);
            displayCtx.clip();
            displayCtx.drawImage(originalCanvas, 0, 0, width, height);
            displayCtx.restore();
          } else {
            displayCtx.drawImage(originalCanvas, 0, 0, width, height);
          }
          
          // Draw processed image on right side
          displayCtx.save();
          displayCtx.beginPath();
          if (showSlider) {
            displayCtx.rect(sliderX, 0, width - sliderX, height);
          } else {
            displayCtx.rect(width/2, 0, width/2, height);
          }
          displayCtx.clip();
          displayCtx.drawImage(processedCanvas, 0, 0, width, height);
          displayCtx.restore();
          
          // Draw slider line if enabled
          if (showSlider) {
            // Draw shadow/outline for better visibility
            displayCtx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
            displayCtx.lineWidth = 5;
            displayCtx.setLineDash([]);
            displayCtx.beginPath();
            displayCtx.moveTo(sliderX, 0);
            displayCtx.lineTo(sliderX, height);
            displayCtx.stroke();
            
            // Draw main slider line
            displayCtx.strokeStyle = '#4a9eff';
            displayCtx.lineWidth = 3;
            displayCtx.setLineDash([]);
            displayCtx.beginPath();
            displayCtx.moveTo(sliderX, 0);
            displayCtx.lineTo(sliderX, height);
            displayCtx.stroke();
            
            // Draw slider handles for better visibility and interaction
            displayCtx.fillStyle = '#4a9eff';
            displayCtx.strokeStyle = '#ffffff';
            displayCtx.lineWidth = 2;
            displayCtx.setLineDash([]);
            
            // Top handle with shadow
            displayCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            displayCtx.beginPath();
            displayCtx.arc(sliderX + 1, 16, 10, 0, 2 * Math.PI);
            displayCtx.fill();
            
            displayCtx.fillStyle = '#4a9eff';
            displayCtx.beginPath();
            displayCtx.arc(sliderX, 15, 10, 0, 2 * Math.PI);
            displayCtx.fill();
            displayCtx.stroke();
            
            // Add inner circle
            displayCtx.fillStyle = '#ffffff';
            displayCtx.beginPath();
            displayCtx.arc(sliderX, 15, 4, 0, 2 * Math.PI);
            displayCtx.fill();
            
            // Bottom handle with shadow
            displayCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            displayCtx.beginPath();
            displayCtx.arc(sliderX + 1, height - 14, 10, 0, 2 * Math.PI);
            displayCtx.fill();
            
            displayCtx.fillStyle = '#4a9eff';
            displayCtx.beginPath();
            displayCtx.arc(sliderX, height - 15, 10, 0, 2 * Math.PI);
            displayCtx.fill();
            displayCtx.stroke();
            
            // Add inner circle
            displayCtx.fillStyle = '#ffffff';
            displayCtx.beginPath();
            displayCtx.arc(sliderX, height - 15, 4, 0, 2 * Math.PI);
            displayCtx.fill();
            
            // Center handle with shadow
            displayCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            displayCtx.beginPath();
            displayCtx.arc(sliderX + 1, height / 2 + 1, 12, 0, 2 * Math.PI);
            displayCtx.fill();
            
            displayCtx.fillStyle = '#4a9eff';
            displayCtx.beginPath();
            displayCtx.arc(sliderX, height / 2, 12, 0, 2 * Math.PI);
            displayCtx.fill();
            displayCtx.stroke();
            
            // Add inner circle
            displayCtx.fillStyle = '#ffffff';
            displayCtx.beginPath();
            displayCtx.arc(sliderX, height / 2, 5, 0, 2 * Math.PI);
            displayCtx.fill();
            
            // Add directional arrows on center handle
            displayCtx.fillStyle = '#4a9eff';
            displayCtx.font = '12px Arial';
            displayCtx.textAlign = 'center';
            displayCtx.fillText('⟷', sliderX, height / 2 + 4);
            
          } else {
            // Draw divider line for split view
            displayCtx.strokeStyle = '#4a9eff';
            displayCtx.lineWidth = 2;
            displayCtx.setLineDash([5, 5]);
            displayCtx.beginPath();
            displayCtx.moveTo(width/2, 0);
            displayCtx.lineTo(width/2, height);
            displayCtx.stroke();
          }
              
              console.log('[EnhancedImageCanvas] Filters applied');
              setIsProcessing(false);
            };
            tempImg.src = originalCanvas.toDataURL();
            
            } catch (err) {
            console.error('[EnhancedImageCanvas] Error applying filters:', err);
            setIsProcessing(false);
          }
        }, delay);
      };
    })(),
    [showSlider, sliderPosition]
  );  // Load image when source changes
  useEffect(() => {
    loadImage();
  }, [loadImage]);

  // Apply filters when edits change
  useEffect(() => {
    if (originalCanvasRef.current) {
      applyFiltersDebounced(edits);
    }
  }, [edits, applyFiltersDebounced, showSlider, sliderPosition]);

  // Apply filters when slider position changes
  useEffect(() => {
    if (originalCanvasRef.current && showSlider) {
      applyFiltersDebounced(edits, true); // Force immediate update for slider
    }
  }, [sliderPosition, showSlider, edits, applyFiltersDebounced]);

  // Log edits for debugging
  useEffect(() => {
    console.log('[EnhancedImageCanvas] Edits updated:', edits);
  }, [edits]);

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      // Clean up any created object URLs when component unmounts
      if (imageSrc) {
        // Handle different formats of imageSrc
        if (typeof imageSrc === 'string' && imageSrc.startsWith('blob:')) {
          URL.revokeObjectURL(imageSrc);
        } else if (imageSrc.url && imageSrc.url.startsWith('blob:')) {
          URL.revokeObjectURL(imageSrc.url);
        } else if (imageSrc.preview && imageSrc.preview.startsWith('blob:')) {
          URL.revokeObjectURL(imageSrc.preview);
        }
      }
    };
  }, [imageSrc]);

  // Calculate display size based on canvas size
  const displayStyle = useMemo(() => {
    let cursor = 'default';
    
    if (showSlider) {
      cursor = 'ew-resize';
    } else if (zoomLevel > 1) {
      cursor = isMousePanning ? 'grabbing' : 'grab';
    }
    
    return {
      width: `${canvasSize.width}px`,
      height: `${canvasSize.height}px`,
      maxWidth: 'none', // Remove max-width constraint
      maxHeight: 'none', // Remove max-height constraint
      objectFit: 'contain',
      cursor,
      transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
      transition: (isPanning || isMousePanning) ? 'none' : 'transform 0.3s ease'
    };
  }, [canvasSize, zoomLevel, isPanning, isMousePanning, panOffset, showSlider]);

  // Mouse event handlers for slider and panning
  const handleMouseDown = useCallback((e) => {
    if (showSlider) {
      // Check if clicking on slider first (priority over panning)
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const sliderX = (rect.width * sliderPosition) / 100;
      
      // Increased hit area for better usability - within 40px of slider line
      if (Math.abs(mouseX - sliderX) < 40) {
        setIsSliderDragging(true);
        e.preventDefault();
        e.stopPropagation();
        // Immediately update slider position
        const newPosition = Math.max(0, Math.min(100, (mouseX / rect.width) * 100));
        if (onSliderChange) onSliderChange(newPosition);
        return;
      }
    }
    
    // If zoomed in and not on slider, start panning
    if (zoomLevel > 1) {
      handleMousePanStart(e);
    }
  }, [showSlider, sliderPosition, zoomLevel, handleMousePanStart, onSliderChange]);

  const handleMouseMove = useCallback((e) => {
    if (isSliderDragging && showSlider) {
      e.preventDefault();
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const newPosition = Math.max(0, Math.min(100, (mouseX / rect.width) * 100));
      if (onSliderChange) onSliderChange(newPosition);
      return;
    }
    
    // Update cursor when hovering over slider
    if (showSlider && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const sliderX = (rect.width * sliderPosition) / 100;
      
      if (Math.abs(mouseX - sliderX) < 40) {
        canvasRef.current.style.cursor = 'ew-resize';
      } else {
        canvasRef.current.style.cursor = zoomLevel > 1 ? 'grab' : 'default';
      }
    } else if (canvasRef.current) {
      canvasRef.current.style.cursor = zoomLevel > 1 ? 'grab' : 'default';
    }
    
    // Handle mouse panning
    handleMousePanMove(e);
  }, [isSliderDragging, showSlider, onSliderChange, handleMousePanMove, sliderPosition, zoomLevel]);

  const handleMouseUp = useCallback(() => {
    setIsSliderDragging(false);
    handleMousePanEnd();
  }, [handleMousePanEnd]);

  // Add mouse event listeners to document
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Add wheel event listener with passive: false to allow preventDefault
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel]);

  return (
    <div className={`image-canvas-container ${isFullscreen ? 'fullscreen' : ''}`}>
      <div 
        ref={containerRef}
        className="enhanced-canvas-container"
        style={{
          minHeight: isFullscreen ? '100vh' : '400px',
          maxHeight: isFullscreen ? '100vh' : '80vh',
          position: isFullscreen ? 'fixed' : 'relative',
          top: isFullscreen ? 0 : 'auto',
          left: isFullscreen ? 0 : 'auto',
          width: isFullscreen ? '100vw' : '100%',
          zIndex: isFullscreen ? 9999 : 'auto',
          background: isFullscreen ? '#000' : '#121212'
        }}
      >
        {/* Hidden processing canvases */}
        <canvas ref={originalCanvasRef} style={{ display: 'none' }} />
        <canvas ref={processedCanvasRef} style={{ display: 'none' }} />
        
        {/* Fullscreen button only */}
        {!hideFullscreen && (
          <div className="fullscreen-controls">
            <button 
              onClick={handleFullscreen}
              className="fullscreen-btn"
              title={isFullscreen ? "Exit Fullscreen (Esc)" : "Enter Fullscreen (F)"}
            >
              {isFullscreen ? "⤓" : "⤢"}
            </button>
          </div>
        )}
        
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Loading image...</p>
            {isRawFormat(imageSrc?.name) && (
              <p className="loading-details">Processing RAW file...</p>
            )}
          </div>
        )}
        
        {error && (
          <div className="error-overlay">
            <div className="error-icon">⚠</div>
            <p className="error-message">{error}</p>
            <p className="error-suggestion">
              {isRawFormat(imageSrc?.name) 
                ? "This RAW file format may not be fully supported. Try converting to JPEG first for best results."
                : "Please try uploading a different image format (JPEG, PNG, WebP)."
              }
            </p>
            {isRawFormat(imageSrc?.name) && (
              <div className="raw-info">
                <p className="raw-format-info">
                  RAW Format: {getRawFormatInfo(imageSrc.name)?.brand} {getRawFormatInfo(imageSrc.name)?.description}
                </p>
                <p className="raw-recommendation">
                  For professional RAW processing, consider using Adobe Lightroom, Capture One, or RawTherapee.
                </p>
              </div>
            )}
          </div>
        )}
        
        {isProcessing && (
          <div className="processing-indicator">
            <div className="processing-spinner"></div>
            <span>Processing...</span>
          </div>
        )}
        
        <div className="canvas-display-wrapper">
          <canvas 
            ref={canvasRef}
            className={`main-canvas ${isLoading || error ? 'hidden' : ''}`}
            style={displayStyle}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
          
          {/* Before/After labels */}
          {!isLoading && !error && canvasSize.width > 0 && showSlider && !hideControls && (
            <div className="comparison-labels">
              <div className="label-before">Original</div>
              <div className="label-after">Edited</div>
            </div>
          )}
          
          {/* Slider instruction tooltip */}
          {!isLoading && !error && showSlider && canvasSize.width > 0 && !hideControls && (
            <div className="slider-instruction">
              <span>↔ Drag to compare before/after</span>
            </div>
          )}
        </div>

        {/* Zoom Controls - Below Image */}
        {!isLoading && !error && !hideControls && (
          <div className="bottom-controls">
            <div className="zoom-controls">
              <button 
                onClick={handleZoomOut} 
                disabled={zoomLevel <= 0.1}
                className="zoom-btn"
                title="Zoom Out (Ctrl + -)"
              >
                −
              </button>
              <span className="zoom-level">{Math.round(zoomLevel * 100)}%</span>
              <button 
                onClick={handleZoomIn} 
                disabled={zoomLevel >= 5}
                className="zoom-btn"
                title="Zoom In (Ctrl + +)"
              >
                +
              </button>
              <button 
                onClick={handleZoomReset}
                className="zoom-btn reset"
                title="Reset Zoom (Ctrl + 0)"
              >
                ⌂
              </button>
            </div>
            
            {/* User instructions */}
            <div className="zoom-instructions">
              <span>💡 Scroll to zoom • Drag to pan when zoomed</span>
            </div>
          </div>
        )}

        {/* Image Info Panel */}
        {!isLoading && !error && originalImageSize.width > 0 && (
          <div className="image-info-panel">
            <span className="image-dimensions">
              {originalImageSize.width} × {originalImageSize.height}
            </span>
            {imageSrc?.size && (
              <span className="image-size">
                {(imageSrc.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            )}
            {isRawFormat(imageSrc?.filename || imageSrc?.name) && (
              <span className="image-format">
                RAW ({getRawFormatInfo(imageSrc?.filename || imageSrc?.name)?.brand})
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Export utility functions for use in other modules
export {
  applyProfessionalFilters,
  rgbToHsl,
  hslToRgb,
  clamp,
  applyCurve,
  adjustWhiteBalance,
  adjustVibrance,
  enhanceClarity,
  addFilmGrain,
  applyVignetting,
  applyPreset
};

export default EnhancedImageCanvas;
