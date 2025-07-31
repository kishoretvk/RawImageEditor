import React, { useRef, useEffect, useState } from 'react';
import { processImageWithEdits } from '../utils/rawProcessor';

const EnhancedImageCanvas = ({ 
  imageSrc, 
  edits = {}, 
  showSlider = false, 
  sliderPosition = 50,
  onSliderChange 
}) => {
  const canvasRef = useRef(null);
  const originalCanvasRef = useRef(null);
  const processedCanvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    loadAndProcessImage();
  }, [imageSrc, edits]);

  const loadAndProcessImage = async () => {
    if (!imageSrc) return;

    setIsLoading(true);
    
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageSrc;
      });

      setImageDimensions({ width: img.width, height: img.height });

      // Create original canvas
      const originalCanvas = originalCanvasRef.current;
      const originalCtx = originalCanvas.getContext('2d');
      originalCanvas.width = img.width;
      originalCanvas.height = img.height;
      originalCtx.drawImage(img, 0, 0);

      // Create processed canvas
      const processedCanvas = processedCanvasRef.current;
      const processedCtx = processedCanvas.getContext('2d');
      processedCanvas.width = img.width;
      processedCanvas.height = img.height;

      // Apply edits
      processedCtx.drawImage(img, 0, 0);
      await applyImageEdits(processedCanvas, edits);

      // Update display canvas
      updateDisplayCanvas();
      
    } catch (error) {
      console.error('Error loading image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyImageEdits = async (canvas, edits) => {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Apply basic edits
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Exposure
      if (edits.exposure) {
        const exposure = Math.pow(2, edits.exposure);
        r = Math.min(255, r * exposure);
        g = Math.min(255, g * exposure);
        b = Math.min(255, b * exposure);
      }

      // Contrast
      if (edits.contrast) {
        const contrast = (edits.contrast + 100) / 100;
        r = Math.min(255, Math.max(0, (r - 128) * contrast + 128));
        g = Math.min(255, Math.max(0, (g - 128) * contrast + 128));
        b = Math.min(255, Math.max(0, (b - 128) * contrast + 128));
      }

      // Vibrance
      if (edits.vibrance) {
        const max = Math.max(r, g, b);
        const avg = (r + g + b) / 3;
        const amt = edits.vibrance / 100;
        
        if (max !== avg) {
          const amt2 = amt * (1 - Math.abs(max - avg) / 255);
          if (r === max) r = Math.min(255, r + amt2 * (r - avg));
          if (g === max) g = Math.min(255, g + amt2 * (g - avg));
          if (b === max) b = Math.min(255, b + amt2 * (b - avg));
        }
      }

      // Temperature
      if (edits.temperature) {
        const temp = edits.temperature / 100;
        r = Math.min(255, r + temp * 2);
        b = Math.max(0, b - temp * 2);
      }

      // Tint
      if (edits.tint) {
        const tint = edits.tint / 100;
        g = Math.min(255, g + tint * 2);
        if (tint > 0) {
          b = Math.max(0, b - tint * 2);
        } else {
          r = Math.max(0, r + tint * 2);
        }
      }

      // Highlights
      if (edits.highlights) {
        const highlights = edits.highlights / 100;
        if (r > 128) r = Math.min(255, r + highlights * (255 - r));
        if (g > 128) g = Math.min(255, g + highlights * (255 - g));
        if (b > 128) b = Math.min(255, b + highlights * (255 - b));
      }

      // Shadows
      if (edits.shadows) {
        const shadows = edits.shadows / 100;
        if (r < 128) r = Math.max(0, r + shadows * r);
        if (g < 128) g = Math.max(0, g + shadows * g);
        if (b < 128) b = Math.max(0, b + shadows * b);
      }

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const updateDisplayCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;
    
    // Set canvas size to match container
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const originalCanvas = originalCanvasRef.current;
    const processedCanvas = processedCanvasRef.current;

    if (!originalCanvas || !processedCanvas) return;

    // Calculate scaling
    const scale = Math.min(
      canvas.width / originalCanvas.width,
      canvas.height / originalCanvas.height
    );

    const scaledWidth = originalCanvas.width * scale;
    const scaledHeight = originalCanvas.height * scale;

    const x = (canvas.width - scaledWidth) / 2;
    const y = (canvas.height - scaledHeight) / 2;

    if (showSlider) {
      // Draw split view
      const splitX = x + (scaledWidth * sliderPosition) / 100;

      // Draw original on left
      ctx.drawImage(
        originalCanvas,
        0, 0, originalCanvas.width * (sliderPosition / 100), originalCanvas.height,
        x, y, scaledWidth * (sliderPosition / 100), scaledHeight
      );

      // Draw processed on right
      ctx.drawImage(
        processedCanvas,
        originalCanvas.width * (sliderPosition / 100), 0,
        originalCanvas.width * (1 - sliderPosition / 100), originalCanvas.height,
        splitX, y, scaledWidth * (1 - sliderPosition / 100), scaledHeight
      );

      // Draw slider handle
      drawSliderHandle(ctx, splitX, y, scaledHeight);
    } else {
      // Draw processed image
      ctx.drawImage(processedCanvas, x, y, scaledWidth, scaledHeight);
    }
  };

  const drawSliderHandle = (ctx, x, y, height) => {
    // Draw vertical line
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + height);
    ctx.stroke();

    // Draw handle
    const handleY = y + height / 2;
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(x, handleY, 20, 0, 2 * Math.PI);
    ctx.fill();
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 8;
    ctx.fill();

    // Draw arrows
    ctx.fillStyle = '#667eea';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('↔', x, handleY);
  };

  const handleMouseMove = (e) => {
    if (!showSlider || !onSliderChange) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    onSliderChange(percentage);
  };

  const handleMouseDown = (e) => {
    if (!showSlider) return;
    
    const handleMouseMove = (e) => {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      onSliderChange(percentage);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    if (!isLoading) {
      updateDisplayCanvas();
    }
  }, [sliderPosition, isLoading]);

  useEffect(() => {
    const handleResize = () => {
      if (!isLoading) {
        updateDisplayCanvas();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isLoading, sliderPosition]);

  return (
    <div className="enhanced-canvas-container">
      <canvas
        ref={canvasRef}
        className="enhanced-canvas"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
      />
      
      <canvas ref={originalCanvasRef} style={{ display: 'none' }} />
      <canvas ref={processedCanvasRef} style={{ display: 'none' }} />

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default EnhancedImageCanvas;
