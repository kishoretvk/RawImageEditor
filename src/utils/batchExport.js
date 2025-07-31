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
  enhanceClarity
} from '../utils/rawProcessor';

import {
  applyVignetting,
  applyFilmGrain
} from '../utils/advancedFilters';


/**
 * Apply edits to an image and export as JPEG with enhanced quality
 */
export const exportImageWithEdits = async (imageFile, edits, options = {}) => {
  return new Promise((resolve, reject) => {
    try {
      // Create canvas and context with high quality settings
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      
      // Enable high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Load image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      // Create URL for the image file
      const imageUrl = URL.createObjectURL(imageFile);
      img.src = imageUrl;
      
      img.onload = () => {
        try {
          // Set canvas dimensions with maximum size constraints for web optimization
          const maxWidth = options.maxWidth || 4000;
          const maxHeight = options.maxHeight || 4000;
          
          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw original image with high quality
          ctx.drawImage(img, 0, 0, width, height);
          
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
          
          // Export as JPEG with specified quality or default 0.9
          const quality = options.quality !== undefined ? options.quality : 0.9;
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          
          // Calculate approximate file size from data URL
          const base64 = dataUrl.split(',')[1] || '';
          const size = (base64.length * 0.75);
          
          // Clean up
          URL.revokeObjectURL(imageUrl);
          
          resolve({
            dataUrl,
            size,
            width: canvas.width,
            height: canvas.height
          });
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
  
  // Process images sequentially to avoid memory issues
  for (let i = 0; i < imageFiles.length; i++) {
    try {
      const imageFile = imageFiles[i];
      const editedImage = await exportImageWithEdits(imageFile, edits, options);
      
      results.push({
        id: Date.now() + i,
        name: imageFile.name.replace(/\.[^/.]+$/, "_edited.jpg"),
        originalName: imageFile.name,
        size: editedImage.size,
        width: editedImage.width,
        height: editedImage.height,
        dataUrl: editedImage.dataUrl,
        status: 'completed'
      });
    } catch (error) {
      console.error(`Error processing image ${imageFiles[i].name}:`, error);
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

/**
 * Download a file from a data URL
 */
export const downloadFile = (dataUrl, filename) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Download multiple files as a ZIP archive
 * In a real implementation, this would use JSZip library
 */
export const downloadAsZip = async (processedImages, zipName = 'processed_images.zip') => {
  const successfulImages = processedImages.filter(img => img.status === 'completed');
  
  if (successfulImages.length === 0) {
    throw new Error('No successfully processed images to download');
  }
  
  // For demo purposes, download the first image
  // In a real implementation, this would create a ZIP file
  const firstImage = successfulImages[0];
  downloadFile(firstImage.dataUrl, firstImage.name);
  
  return {
    count: successfulImages.length,
    name: zipName
  };
};

export default {
  exportImageWithEdits,
  batchProcessImages,
  createZipFromImages,
  downloadFile,
  downloadAsZip
};
