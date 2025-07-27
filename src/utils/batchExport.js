/**
 * Batch Export Utility
 * Handles exporting images with applied edits in batch processing
 */

import {
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
} from '../components/EnhancedImageCanvas';

/**
 * Apply edits to an image and export as JPEG
 */
export const exportImageWithEdits = async (imageFile, edits, options = {}) => {
  return new Promise((resolve, reject) => {
    try {
      // Create canvas and context
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      
      // Load image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      // Create URL for the image file
      const imageUrl = URL.createObjectURL(imageFile);
      img.src = imageUrl;
      
      img.onload = () => {
        try {
          // Set canvas dimensions
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw original image
          ctx.drawImage(img, 0, 0);
          
          // Prepare edits with curve data if available
          const editsWithCurves = { ...edits };
          if (edits.curves) {
            editsWithCurves.curveRgb = edits.curves.curveRgb;
            editsWithCurves.curveR = edits.curves.curveR;
            editsWithCurves.curveG = edits.curves.curveG;
            editsWithCurves.curveB = edits.curves.curveB;
            editsWithCurves.curveLuminance = edits.curves.curveLuminance;
          }
          
          // Apply professional filters
          applyProfessionalFilters(ctx, img, editsWithCurves);
          
          // Export as JPEG
          const quality = options.quality || 0.9;
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          
          // Clean up
          URL.revokeObjectURL(imageUrl);
          
          resolve(dataUrl);
        } catch (error) {
          URL.revokeObjectURL(imageUrl);
          reject(error);
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(imageUrl);
        reject(new Error('Failed to load image'));
      };
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Process multiple images with the same edits
 */
export const batchProcessImages = async (imageFiles, edits, options = {}) => {
  const results = [];
  
  for (let i = 0; i < imageFiles.length; i++) {
    try {
      const imageFile = imageFiles[i];
      const editedImage = await exportImageWithEdits(imageFile, edits, options);
      
      results.push({
        id: Date.now() + i,
        name: imageFile.name.replace(/\.[^/.]+$/, "_edited.jpg"),
        originalName: imageFile.name,
        size: imageFile.size,
        dataUrl: editedImage,
        status: 'completed'
      });
    } catch (error) {
      results.push({
        id: Date.now() + i,
        name: imageFiles[i].name,
        originalName: imageFiles[i].name,
        size: imageFiles[i].size,
        error: error.message,
        status: 'failed'
      });
    }
  }
  
  return results;
};

/**
 * Create a ZIP file containing all processed images
 */
export const createZipFromImages = async (processedImages) => {
  // In a real implementation, this would use a library like JSZip
  // For now, we'll just return the first image for demo purposes
  const successfulImages = processedImages.filter(img => img.status === 'completed');
  
  if (successfulImages.length === 0) {
    throw new Error('No successfully processed images to download');
  }
  
  // Return the first image for demo purposes
  return successfulImages[0].dataUrl;
};

export default {
  exportImageWithEdits,
  batchProcessImages,
  createZipFromImages
};
