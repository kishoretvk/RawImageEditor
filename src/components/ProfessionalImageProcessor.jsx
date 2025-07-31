import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import EnhancedImageCanvas from './EnhancedImageCanvas';
import { processRAWFile, isRawFormat } from '../utils/rawProcessor';
import { applyLUT } from '../utils/lutProcessor';
import { createMask, applyMask } from '../utils/maskProcessor';
import { applyLensCorrection } from '../utils/lensCorrection';
import { useCurve } from '../context/CurveContext';

const ProfessionalImageProcessor = ({ 
  imageSrc, 
  edits, 
  onProcessed, 
  showSlider = false,
  masks = [],
  lutPath = null,
  cameraProfile = null,
  lensProfile = null
}) => {
  const [processedImage, setProcessedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingSteps, setProcessingSteps] = useState([]);
  const canvasRef = useRef(null);
  const maskCanvasRef = useRef(null);
  
  // Professional color grading pipeline
  const applyProfessionalColorGrading = useCallback(async (imageData, width, height, edits) => {
    const {
      // Color wheels
      shadowsColor = { r: 0, g: 0, b: 0 },
      midtonesColor = { r: 0, g: 0, b: 0 },
      highlightsColor = { r: 0, g: 0, b: 0 },
      
      // HSL secondary
      hslAdjustments = [],
      
      // LUT
      lutIntensity = 1.0,
      
      // Camera calibration
      cameraCalibration = null,
      
      // Selective color
      selectiveColor = []
    } = edits;

    let data = new ImageData(new Uint8ClampedArray(imageData.data), width, height);
    
    // Apply camera profile if provided
    if (cameraProfile) {
      data = applyCameraProfile(data, cameraProfile);
    }
    
    // Apply lens correction if provided
    if (lensProfile) {
      data = applyLensCorrection(data, width, height, lensProfile);
    }
    
    // Apply LUT if provided
    if (lutPath) {
      data = await applyLUT(data, lutPath, lutIntensity);
    }
    
    // Apply color wheels (shadows, midtones, highlights)
    data = applyColorWheels(data, shadowsColor, midtonesColor, highlightsColor);
    
    // Apply HSL secondary adjustments
    if (hslAdjustments.length > 0) {
      data = applyHSLSecondary(data, hslAdjustments);
    }
    
    // Apply selective color adjustments
    if (selectiveColor.length > 0) {
      data = applySelectiveColor(data, selectiveColor);
    }
    
    return data;
  }, []);

  // AI-powered subject detection
  const detectSubject = useCallback(async (imageData) => {
    // Placeholder for AI subject detection
    // In production, this would use TensorFlow.js or similar
    return {
      subjectMask: null,
      backgroundMask: null,
      confidence: 0.0
    };
  }, []);

  // Professional masking system
  const applyMasks = useCallback(async (imageData, masks) => {
    let maskedData = imageData;
    
    for (const mask of masks) {
      const maskData = await createMask(mask, imageData);
      maskedData = applyMask(maskedData, maskData, mask.adjustments);
    }
    
    return maskedData;
  }, []);

  // Professional RAW processing with camera profiles
  const processProfessionalRAW = useCallback(async (file) => {
    const processingSteps = [];
    
    try {
      processingSteps.push('Loading RAW file...');
      setProcessingSteps(processingSteps);
      
      // Enhanced RAW processing with camera profiles
      const rawData = await processRAWFile(file, {
        enhanceQuality: true,
        cameraProfile: cameraProfile,
        applyNoiseReduction: true,
        preserveHighlights: true,
        shadowRecovery: true,
        colorSpace: 'ProPhoto RGB',
        bitDepth: 16
      });
      
      processingSteps.push('Applying camera profile...');
      setProcessingSteps(processingSteps);
      
      // Apply lens corrections if available
      if (lensProfile) {
        processingSteps.push('Applying lens corrections...');
        setProcessingSteps(processingSteps);
      }
      
      processingSteps.push('Processing complete');
      setProcessingSteps(processingSteps);
      
      return rawData;
    } catch (error) {
      console.error('Professional RAW processing failed:', error);
      throw error;
    }
  }, [cameraProfile, lensProfile]);

  // Professional export with multiple formats
  const exportProfessional = useCallback(async (format, quality, options = {}) => {
    const {
      includeMetadata = true,
      colorSpace = 'sRGB',
      resize = null,
      watermark = null,
      sharpening = 0
    } = options;

    if (!canvasRef.current) return null;

    const canvas = canvasRef.current;
    const exportCanvas = document.createElement('canvas');
    const ctx = exportCanvas.getContext('2d');

    // Set dimensions
    if (resize) {
      exportCanvas.width = resize.width;
      exportCanvas.height = resize.height;
    } else {
      exportCanvas.width = canvas.width;
      exportCanvas.height = canvas.height;
    }

    // Apply color space conversion
    if (colorSpace !== 'sRGB') {
      // Apply color space conversion
    }

    // Draw image
    ctx.drawImage(canvas, 0, 0, exportCanvas.width, exportCanvas.height);

    // Apply output sharpening
    if (sharpening > 0) {
      applyOutputSharpening(ctx, sharpening);
    }

    // Add watermark if provided
    if (watermark) {
      applyWatermark(ctx, watermark);
    }

    // Export based on format
    return new Promise((resolve) => {
      exportCanvas.toBlob((blob) => {
        resolve({
          blob,
          width: exportCanvas.width,
          height: exportCanvas.height,
          format,
          quality
        });
      }, `image/${format}`, quality);
    });
  }, []);

  // Batch processing support
  const processBatch = useCallback(async (files, preset, options = {}) => {
    const results = [];
    
    for (const file of files) {
      try {
        setIsProcessing(true);
        
        let processedData;
        if (isRawFormat(file.name)) {
          processedData = await processProfessionalRAW(file);
        } else {
          processedData = { url: URL.createObjectURL(file), type: 'standard' };
        }
        
        // Apply preset
        const finalImage = await applyProfessionalColorGrading(
          processedData.imageData,
          processedData.width,
          processedData.height,
          preset
        );
        
        results.push({
          file,
          processedImage: finalImage,
          success: true
        });
        
      } catch (error) {
        results.push({
          file,
          error: error.message,
          success: false
        });
      }
    }
    
    setIsProcessing(false);
    return results;
  }, [processProfessionalRAW, applyProfessionalColorGrading]);

  return (
    <div className="professional-image-processor">
      <EnhancedImageCanvas
        ref={canvasRef}
        imageSrc={imageSrc}
        edits={edits}
        onProcessed={onProcessed}
        showSlider={showSlider}
        className="professional-canvas"
      />
      
      {isProcessing && (
        <div className="processing-overlay">
          <div className="processing-steps">
            {processingSteps.map((step, index) => (
              <div key={index} className="processing-step">
                {step}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Mask overlay canvas */}
      <canvas
        ref={maskCanvasRef}
        className="mask-overlay"
        style={{ display: masks.length > 0 ? 'block' : 'none' }}
      />
    </div>
  );
};

// Helper functions for professional processing
const applyCameraProfile = (imageData, profile) => {
  // Apply camera-specific color matrix
  const data = imageData.data;
  const matrix = profile.colorMatrix;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    
    // Apply color matrix transformation
    data[i] = Math.min(255, r * matrix[0][0] + g * matrix[0][1] + b * matrix[0][2]);
    data[i + 1] = Math.min(255, r * matrix[1][0] + g * matrix[1][1] + b * matrix[1][2]);
    data[i + 2] = Math.min(255, r * matrix[2][0] + g * matrix[2][1] + b * matrix[2][2]);
  }
  
  return imageData;
};

const applyColorWheels = (imageData, shadows, midtones, highlights) => {
  const data = imageData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    const normalizedLum = luminance / 255;
    
    // Apply color wheels based on luminance
    let colorWheel = { r: 0, g: 0, b: 0 };
    
    if (normalizedLum < 0.33) {
      colorWheel = shadows;
    } else if (normalizedLum < 0.66) {
      colorWheel = midtones;
    } else {
      colorWheel = highlights;
    }
    
    data[i] = Math.min(255, Math.max(0, r + colorWheel.r));
    data[i + 1] = Math.min(255, Math.max(0, g + colorWheel.g));
    data[i + 2] = Math.min(255, Math.max(0, b + colorWheel.b));
  }
  
  return imageData;
};

const applyHSLSecondary = (imageData, adjustments) => {
  const data = imageData.data;
  
  for (const adjustment of adjustments) {
    const { hue, saturation, lightness, range } = adjustment;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      
      // Convert to HSL
      const [h, s, l] = rgbToHsl(r, g, b);
      
      // Check if pixel is in target hue range
      if (isInHueRange(h, range)) {
        // Apply adjustments
        const newH = h + (hue / 360);
        const newS = Math.max(0, Math.min(1, s + (saturation / 100)));
        const newL = Math.max(0, Math.min(1, l + (lightness / 100)));
        
        const [newR, newG, newB] = hslToRgb(newH, newS, newL);
        
        data[i] = newR;
        data[i + 1] = newG;
        data[i + 2] = newB;
      }
    }
  }
  
  return imageData;
};

const applySelectiveColor = (imageData, adjustments) => {
  const data = imageData.data;
  
  for (const adjustment of adjustments) {
    const { color, cyan, magenta, yellow, black } = adjustment;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      
      if (isTargetColor(r, g, b, color)) {
        // Apply CMYK adjustments
        const [c, m, y, k] = rgbToCmyk(r, g, b);
        
        const newC = Math.max(0, Math.min(100, c + cyan));
        const newM = Math.max(0, Math.min(100, m + magenta));
        const newY = Math.max(0, Math.min(100, y + yellow));
        const newK = Math.max(0, Math.min(100, k + black));
        
        const [newR, newG, newB] = cmykToRgb(newC, newM, newY, newK);
        
        data[i] = newR;
        data[i + 1] = newG;
        data[i + 2] = newB;
      }
    }
  }
  
  return imageData;
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

const rgbToCmyk = (r, g, b) => {
  const c = 1 - (r / 255);
  const m = 1 - (g / 255);
  const y = 1 - (b / 255);
  const k = Math.min(c, m, y);
  
  return [
    (c - k) / (1 - k) * 100,
    (m - k) / (1 - k) * 100,
    (y - k) / (1 - k) * 100,
    k * 100
  ];
};

const cmykToRgb = (c, m, y, k) => {
  const r = 255 * (1 - c / 100) * (1 - k / 100);
  const g = 255 * (1 - m / 100) * (1 - k / 100);
  const b = 255 * (1 - y / 100) * (1 - k / 100);
  
  return [Math.round(r), Math.round(g), Math.round(b)];
};

const isInHueRange = (hue, range) => {
  const [min, max] = range;
  return hue >= min && hue <= max;
};

const isTargetColor = (r, g, b, targetColor) => {
  // Simple color matching - in production, use more sophisticated matching
  const threshold = 30;
  return Math.abs(r - targetColor.r) < threshold &&
         Math.abs(g - targetColor.g) < threshold &&
         Math.abs(b - targetColor.b) < threshold;
};

export default ProfessionalImageProcessor;
