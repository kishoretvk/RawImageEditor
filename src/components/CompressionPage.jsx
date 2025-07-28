import React, { useState, useCallback } from 'react';
import EditorLayout from './EditorLayout';
import FileUploader from './FileUploader';
import UnifiedSlider from './UnifiedSlider';
import { isRawFormat, processRAWFile } from '../utils/rawProcessor';
import '../styles/global.css';
import '../styles/unified-slider.css';

const CompressionPage = () => {
  const [originalImage, setOriginalImage] = useState(null);
  const [compressedImage, setCompressedImage] = useState(null);
  const [compression, setCompression] = useState(1);
  const [customMode, setCustomMode] = useState(false);
  const [sliderValue, setSliderValue] = useState(50);
  const [showPreview, setShowPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rawProcessed, setRawProcessed] = useState(false);
  const [originalFileSize, setOriginalFileSize] = useState(0);
  const [compressedFileSize, setCompressedFileSize] = useState(0);

  // Helper function to calculate file size from data URL
  const calculateFileSize = (dataUrl) => {
    if (!dataUrl) return 0;
    try {
      if (dataUrl.startsWith('data:')) {
        const base64 = dataUrl.split(',')[1] || '';
        return (base64.length * 0.75) / (1024 * 1024); // Convert to MB
      }
    } catch (e) {
      console.error('Error calculating file size:', e);
    }
    return 0;
  };

  // Process RAW image to JPEG
  const processRawToJpeg = useCallback(async (file) => {
    try {
      setIsProcessing(true);
      const processedData = await processRAWFile(file, {
        outputFormat: 'jpeg',
        quality: 0.95,
        enhanceQuality: true
      });
      
      // Set the processed image
      setOriginalImage(processedData.url);
      setOriginalFileSize(file.size / (1024 * 1024)); // Convert to MB
      setRawProcessed(true);
      setIsProcessing(false);
      return processedData.url;
    } catch (error) {
      console.error('Error processing RAW file:', error);
      setIsProcessing(false);
      throw error;
    }
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(async (fileData) => {
    setIsProcessing(true);
    try {
      // Check if it's a RAW file
      if (fileData.file && isRawFormat(fileData.filename || fileData.name)) {
        await processRawToJpeg(fileData.file);
      } else {
        // Handle regular image files
        setOriginalImage(fileData.url || fileData.preview);
        setOriginalFileSize(fileData.size ? fileData.size / (1024 * 1024) : 0);
        setRawProcessed(false);
      }
      setShowPreview(false);
      setCompressedImage(null);
    } catch (error) {
      console.error('Error handling file upload:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [processRawToJpeg]);

  // Professional compression logic
  const handleCompress = useCallback(() => {
    if (!originalImage) return;
    
    setIsProcessing(true);
    
    // Create image from original
    const img = new window.Image();
    img.src = originalImage;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxWidth = 4000; // Maximum width for web optimization
      const maxHeight = 4000; // Maximum height for web optimization
      
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      // Apply high-quality rendering
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      
      // Calculate quality based on compression settings
      let quality;
      if (customMode) {
        // Custom mode: slider value maps to quality (1-100 -> 0.01-0.95)
        quality = Math.max(0.01, Math.min(0.95, sliderValue / 100));
      } else {
        // Preset mode: 1x = 0.95, 2x = 0.85, 3x = 0.75, 4x = 0.65, 5x = 0.55
        const qualityMap = { 1: 0.95, 2: 0.85, 3: 0.75, 4: 0.65, 5: 0.55 };
        quality = qualityMap[compression] || 0.85;
      }
      
      // Compress to JPEG with calculated quality
      const compressedUrl = canvas.toDataURL('image/jpeg', quality);
      setCompressedImage(compressedUrl);
      setCompressedFileSize(calculateFileSize(compressedUrl));
      setShowPreview(true);
      setIsProcessing(false);
    };
    
    img.onerror = () => {
      console.error('Error loading image for compression');
      setIsProcessing(false);
    };
  }, [originalImage, compression, customMode, sliderValue]);

  // Slider for before/after preview
  const [sliderPos, setSliderPos] = useState(50);

  return (
    <EditorLayout
      currentImage={compressedImage || originalImage}
      controls={(
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white mb-4">Compression Controls</h2>
          
          {/* Compression Presets */}
          <div className="flex flex-wrap gap-3 mb-4">
            {[1,2,3,4,5].map(x => (
              <button 
                key={x} 
                onClick={() => { setCompression(x); setCustomMode(false); }}
                className={`px-4 py-2 rounded-lg font-semibold text-white transition-all duration-300 ${
                  compression===x && !customMode 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-700 scale-105 shadow-lg' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
                }`}
              >
                {x}x
              </button>
            ))}
            <button 
              onClick={() => setCustomMode(true)}
              className={`px-4 py-2 rounded-lg font-semibold text-white transition-all duration-300 ${
                customMode 
                  ? 'bg-gradient-to-r from-pink-600 to-purple-700 scale-105 shadow-lg' 
                  : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700'
              }`}
            >
              Custom
            </button>
          </div>
          
          {/* Custom Slider */}
          {customMode && (
            <div className="w-full flex flex-col items-center mb-4">
              <UnifiedSlider
                min={1}
                max={100}
                value={sliderValue}
                onChange={setSliderValue}
                label={`Compression Quality: ${sliderValue}%`}
                showValue={true}
              />
            </div>
          )}
          
          {/* File Info */}
          {originalImage && (
            <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Original Size:</span>
                  <div className="font-semibold text-white">
                    {rawProcessed ? `${originalFileSize.toFixed(2)} MB (RAW)` : `${originalFileSize.toFixed(2)} MB`}
                  </div>
                </div>
                {compressedImage && (
                  <div>
                    <span className="text-gray-400">Compressed Size:</span>
                    <div className="font-semibold text-green-400">
                      {compressedFileSize.toFixed(2)} MB
                      <span className="text-xs text-gray-400 ml-2">
                        ({Math.round((1 - compressedFileSize / originalFileSize) * 100)}% reduction)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={handleCompress} 
              disabled={!originalImage || isProcessing}
              className={`px-6 py-3 font-bold rounded-xl shadow-lg transition-all duration-300 ${
                !originalImage || isProcessing
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:scale-105'
              }`}
            >
              {isProcessing ? 'Processing...' : 'Compress Image'}
            </button>
            
            {showPreview && compressedImage && (
              <a
                href={compressedImage}
                download={`compressed-${Date.now()}.jpg`}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold rounded-xl shadow-lg hover:from-blue-600 hover:to-cyan-700 hover:scale-105 transition-all duration-300"
              >
                Download JPEG
              </a>
            )}
          </div>
          
          {/* Info Panel */}
          <div className="bg-gray-800/30 rounded-lg p-4 mt-4">
            <h3 className="font-semibold text-white mb-2">Compression Guide</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• 1x: High quality (0.95) - Minimal compression</li>
              <li>• 2x: Good quality (0.85) - Balanced compression</li>
              <li>• 3x: Medium quality (0.75) - Noticeable compression</li>
              <li>• 4x: Low quality (0.65) - Heavy compression</li>
              <li>• 5x: Very low quality (0.55) - Maximum compression</li>
              <li className="mt-2">• RAW files are automatically converted to JPEG</li>
              <li>• Images are resized to max 4000px on longest side for web optimization</li>
            </ul>
          </div>
        </div>
      )}
    >
      <div className="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-white mb-2 mt-2">Professional Image Compression</h1>
        <p className="text-lg text-white/70 mb-8">Convert RAW files to JPEG and optimize images for web and storage</p>
        
        <FileUploader onFileUpload={handleFileUpload} />
        
        {isProcessing && (
          <div className="mt-8 p-6 bg-gray-800/50 rounded-xl text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-3"></div>
            <p className="text-white">
              {rawProcessed ? 'Converting RAW to JPEG...' : 'Processing image...'}
            </p>
          </div>
        )}
        
        {showPreview && originalImage && compressedImage && (
          <div className="relative w-full max-w-4xl h-[500px] bg-black rounded-xl overflow-hidden shadow-2xl mt-8 border-2 border-gray-700">
            {/* Before/After slider */}
            <div className="absolute inset-0">
              <img 
                src={originalImage} 
                alt="Before" 
                className="absolute inset-0 w-full h-full object-contain" 
                style={{clipPath:`inset(0 ${100-sliderPos}% 0 0)`}} 
              />
              <img 
                src={compressedImage} 
                alt="After" 
                className="absolute inset-0 w-full h-full object-contain" 
                style={{clipPath:`inset(0 0 0 ${sliderPos}%)`}} 
              />
            </div>
            
            {/* Slider Control */}
            <div className="absolute top-4 left-0 w-full px-4">
              <UnifiedSlider
                min={0}
                max={100}
                value={sliderPos}
                onChange={setSliderPos}
                label="Drag to compare"
                showLabels={true}
                className=""
              />
            </div>
            
            {/* Image Labels */}
            <div className="absolute top-20 left-4 bg-black/70 px-3 py-2 rounded-lg text-white text-sm font-semibold shadow">
              Before<br/>
              <span className="text-xs">{originalFileSize.toFixed(2)} MB</span>
            </div>
            <div className="absolute top-20 right-4 bg-black/70 px-3 py-2 rounded-lg text-white text-sm font-semibold shadow">
              After<br/>
              <span className="text-xs text-green-400">{compressedFileSize.toFixed(2)} MB</span>
            </div>
            
            {/* Download Button */}
            <div className="absolute bottom-4 right-4">
              <a
                href={compressedImage}
                download={`compressed-${Date.now()}.jpg`}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold rounded-lg shadow-lg hover:from-blue-600 hover:to-cyan-700 hover:scale-105 transition-all duration-300"
              >
                Download JPEG
              </a>
            </div>
          </div>
        )}
        
        {/* Features Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          <div className="bg-gray-800/30 p-6 rounded-xl">
            <div className="text-2xl mb-3">📸</div>
            <h3 className="text-lg font-bold text-white mb-2">RAW Conversion</h3>
            <p className="text-gray-300 text-sm">
              Automatically convert RAW files from all major camera brands to high-quality JPEG format.
            </p>
          </div>
          <div className="bg-gray-800/30 p-6 rounded-xl">
            <div className="text-2xl mb-3">⚡</div>
            <h3 className="text-lg font-bold text-white mb-2">Smart Compression</h3>
            <p className="text-gray-300 text-sm">
              Professional algorithms that maintain visual quality while significantly reducing file size.
            </p>
          </div>
          <div className="bg-gray-800/30 p-6 rounded-xl">
            <div className="text-2xl mb-3">🔄</div>
            <h3 className="text-lg font-bold text-white mb-2">Before/After Preview</h3>
            <p className="text-gray-300 text-sm">
              Interactive slider to compare original and compressed images side-by-side.
            </p>
          </div>
        </div>
      </div>
    </EditorLayout>
  );
};

export default CompressionPage;
