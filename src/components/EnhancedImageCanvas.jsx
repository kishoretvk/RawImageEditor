import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import '../styles/loading-error.css';
import '../styles/responsive-canvas.css';
import { processRAWFile, isRawFormat, getRawFormatInfo, getRAWWorkflowRecommendation, cleanupRAWResources } from '../utils/rawProcessor';

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

const EnhancedImageCanvas = ({ imageSrc, edits, onProcessed, showSlider = false, sliderPosition = 50, onSliderChange }) => {
  const canvasRef = useRef(null);
  const originalCanvasRef = useRef(null);
  const processedCanvasRef = useRef(null);
  const containerRef = useRef(null);
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
    
    // Get available space (account for margins, paddings)
    const availableWidth = containerRect.width - 40; // 20px margin on each side
    const availableHeight = Math.min(
      window.innerHeight * 0.7, // Max 70% of viewport height
      containerRect.height - 40 // Account for container padding
    );

    // Calculate aspect ratio
    const imageAspectRatio = originalImageSize.width / originalImageSize.height;
    const containerAspectRatio = availableWidth / availableHeight;

    let displayWidth, displayHeight;

    if (imageAspectRatio > containerAspectRatio) {
      // Image is wider than container
      displayWidth = availableWidth;
      displayHeight = availableWidth / imageAspectRatio;
    } else {
      // Image is taller than container
      displayHeight = availableHeight;
      displayWidth = availableHeight * imageAspectRatio;
    }

    // Apply zoom level
    displayWidth *= zoomLevel;
    displayHeight *= zoomLevel;

    // Ensure minimum size for usability
    const minSize = 200;
    if (displayWidth < minSize || displayHeight < minSize) {
      const scale = minSize / Math.min(displayWidth, displayHeight);
      displayWidth *= scale;
      displayHeight *= scale;
    }

    setCanvasSize({
      width: Math.round(displayWidth),
      height: Math.round(displayHeight)
    });
  }, [originalImageSize, zoomLevel]);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      setTimeout(calculateCanvasSize, 100); // Debounce resize
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateCanvasSize]);

  // Touch and pan handling for mobile devices
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [lastTouchDistance, setLastTouchDistance] = useState(0);
  
  // Slider drag handling
  const [isSliderDragging, setIsSliderDragging] = useState(false);

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
      
      // If touch is near slider handle (within 20px), start dragging
      if (Math.abs(touchX - sliderX) < 20) {
        setIsSliderDragging(true);
        e.preventDefault();
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
  }, [zoomLevel, panOffset, showSlider, sliderPosition]);

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
    setZoomLevel(prev => Math.min(prev * 1.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev / 1.2, 0.1));
  }, []);

  const handleZoomReset = useCallback(() => {
    setZoomLevel(1);
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
    if (!imageSrc || !canvasRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('[EnhancedImageCanvas] Loading image:', imageSrc.name || 'Unknown');
      
      let processedImageData;
      
      // Check if it's a RAW format
      if (isRawFormat(imageSrc.name)) {
        console.log('[EnhancedImageCanvas] RAW format detected, processing with RAW decoder');
        
        try {
          // Use professional RAW processor
          processedImageData = await processRAWFile(imageSrc.file || imageSrc);
          console.log(`[EnhancedImageCanvas] RAW processed using strategy: ${processedImageData.strategy}`);
          
          // Show format information
          const formatInfo = getRawFormatInfo(imageSrc.name);
          if (formatInfo) {
            console.log(`[EnhancedImageCanvas] RAW format: ${formatInfo.brand} ${formatInfo.description}`);
          }
          
        } catch (rawError) {
          console.warn('[EnhancedImageCanvas] RAW processing failed:', rawError);
          throw new Error(`RAW processing failed: ${rawError.message}`);
        }
      } else {
        // Regular image processing
        processedImageData = {
          url: imageSrc.url,
          type: 'standard',
          strategy: 'direct'
        };
      }

      // Load the processed image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error('Failed to load processed image'));
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
      
      // Set canvas dimensions to actual image size
      [canvas, originalCanvas, processedCanvas].forEach(c => {
        if (c) {
          c.width = width;
          c.height = height;
        }
      });

      // Draw original image with optimized context
      const originalCtx = originalCanvas.getContext('2d', { willReadFrequently: true });
      originalCtx.drawImage(processedImg, 0, 0);
      
      console.log('[EnhancedImageCanvas] Original image drawn');

      // Send processed data to parent
      if (onProcessed) {
        onProcessed({
          width,
          height,
          size: imageSrc.size,
          name: imageSrc.name,
          type: imageSrc.type,
          rawProcessing: processedImageData.type !== 'standard' ? {
            strategy: processedImageData.strategy,
            formatInfo: processedImageData.formatInfo
          } : null
        });
      }

    } catch (err) {
      console.error('[EnhancedImageCanvas] Error loading image:', err);
      
      // Show helpful error message for RAW files
      if (isRawFormat(imageSrc.name)) {
        const recommendation = getRAWWorkflowRecommendation(imageSrc.file || imageSrc);
        setError(`RAW processing error: ${err.message}. ${recommendation.recommendations[0]}`);
      } else {
        setError(err.message);
      }
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
            
            const originalCtx = originalCanvas.getContext('2d', { willReadFrequently: true });
            const processedCtx = processedCanvas.getContext('2d', { willReadFrequently: true });
            const displayCtx = displayCanvas.getContext('2d', { willReadFrequently: true });
            
            // Copy original to processed canvas
            processedCtx.clearRect(0, 0, processedCanvas.width, processedCanvas.height);
            processedCtx.drawImage(originalCanvas, 0, 0);
            
            // Create temporary image from original canvas
            const tempImg = new Image();
            tempImg.onload = () => {
              // Apply filters to processed canvas
              applyProfessionalFilters(processedCtx, tempImg, edits);
              
          // Show before/after comparison on display canvas with slider
          const width = displayCanvas.width;
          const height = displayCanvas.height;
          const sliderX = showSlider ? (width * sliderPosition / 100) : width / 2;
          
          // Clear display canvas
          displayCtx.clearRect(0, 0, width, height);
          
          // Draw original image
          displayCtx.drawImage(originalCanvas, 0, 0, width, height);
          
          // Draw processed image with clipping
          displayCtx.save();
          displayCtx.beginPath();
          displayCtx.rect(sliderX, 0, width - sliderX, height);
          displayCtx.clip();
          displayCtx.drawImage(processedCanvas, 0, 0, width, height);
          displayCtx.restore();
          
          // Draw slider line if enabled
          if (showSlider) {
            displayCtx.strokeStyle = '#4a9eff';
            displayCtx.lineWidth = 2;
            displayCtx.setLineDash([5, 5]);
            displayCtx.beginPath();
            displayCtx.moveTo(sliderX, 0);
            displayCtx.lineTo(sliderX, height);
            displayCtx.stroke();
            
            // Draw slider handle
            displayCtx.setLineDash([]);
            displayCtx.fillStyle = '#4a9eff';
            displayCtx.beginPath();
            displayCtx.arc(sliderX, height / 2, 10, 0, Math.PI * 2);
            displayCtx.fill();
            displayCtx.strokeStyle = '#fff';
            displayCtx.lineWidth = 2;
            displayCtx.stroke();
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

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      // Clean up any created object URLs when component unmounts
      if (imageSrc && imageSrc.url && imageSrc.url.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc.url);
      }
    };
  }, [imageSrc]);

  // Calculate display size based on canvas size
  const displayStyle = useMemo(() => ({
    width: `${canvasSize.width}px`,
    height: `${canvasSize.height}px`,
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
    cursor: showSlider ? 'ew-resize' : (zoomLevel > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default'),
    transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
    transition: isPanning ? 'none' : 'transform 0.3s ease'
  }), [canvasSize, zoomLevel, isPanning, panOffset, showSlider]);

  // Mouse event handlers for slider
  const handleMouseDown = useCallback((e) => {
    if (!showSlider) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const sliderX = (rect.width * sliderPosition) / 100;
    
    // If mouse is near slider handle (within 20px), start dragging
    if (Math.abs(mouseX - sliderX) < 20) {
      setIsSliderDragging(true);
      e.preventDefault();
    }
  }, [showSlider, sliderPosition]);

  const handleMouseMove = useCallback((e) => {
    if (isSliderDragging && showSlider) {
      e.preventDefault();
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const newPosition = Math.max(0, Math.min(100, (mouseX / rect.width) * 100));
      if (onSliderChange) onSliderChange(newPosition);
    }
  }, [isSliderDragging, showSlider, onSliderChange]);

  const handleMouseUp = useCallback(() => {
    setIsSliderDragging(false);
  }, []);

  // Add mouse event listeners to document
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

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
        <div className="fullscreen-controls">
          <button 
            onClick={handleFullscreen}
            className="fullscreen-btn"
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Enter Fullscreen (F)"}
          >
            {isFullscreen ? "⤓" : "⤢"}
          </button>
        </div>
        
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
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
          
          {/* Before/After labels */}
          {!isLoading && !error && canvasSize.width > 0 && (
            <div className="comparison-labels">
              <div className="label-before">Original</div>
              <div className="label-after">Edited</div>
            </div>
          )}
        </div>

        {/* Zoom Controls - Below Image */}
        {!isLoading && !error && (
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
                disabled={zoomLevel >= 3}
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
            {isRawFormat(imageSrc?.name) && (
              <span className="image-format">
                RAW ({getRawFormatInfo(imageSrc.name)?.brand})
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedImageCanvas;
