import React, { useRef, useEffect, useState } from 'react';
import { processImageWithEdits } from '../utils/rawProcessor';

const EnhancedImageCanvas = ({ 
  imageSrc, 
  edits = {}, 
  showSlider = false, 
  sliderPosition = 50,
  onSliderChange,
  curveLUTs = null,
  // WB region selection mode and gains application
  wbSelectEnabled = false,
  onWbRegionSelected = null,
  wbGains = null, // { rGain, gGain, bGain }
  // Channel split export: when requested, return blobs for R/G/B
  onExtractChannels = null,
  extractChannelsFrom = 'processed' // 'processed' | 'original'
}) => {
  const canvasRef = useRef(null);
  const originalCanvasRef = useRef(null);
  const processedCanvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  // WB region selection state (canvas coordinate space during drag)
  const [wbDrag, setWbDrag] = useState(null); // { startX, startY, curX, curY }

  useEffect(() => {
    loadAndProcessImage();
  }, [imageSrc, edits, wbGains]);

  const loadAndProcessImage = async () => {
    if (!imageSrc) return;

    setIsLoading(true);
    
    try {
      const img = new Image();

      // Only set CORS for network images; blob: and data: should not use anonymous
      const isNetwork = typeof imageSrc === 'string' && /^https?:\/\//i.test(imageSrc);
      if (isNetwork) {
        img.crossOrigin = 'anonymous';
      }

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = (e) => {
          console.error('[EnhancedImageCanvas] img onerror for src:', imageSrc, e);
          reject(e);
        };
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
      await applyImageEdits(processedCanvas, edits, curveLUTs);

      // Update display canvas
      updateDisplayCanvas();
      
    } catch (error) {
      console.error('[EnhancedImageCanvas] Error loading image:', error, 'src:', imageSrc);
      // Draw a visible placeholder so user never sees an infinite spinner
      const processedCanvas = processedCanvasRef.current;
      if (processedCanvas) {
        const ctx = processedCanvas.getContext('2d');
        const w = processedCanvas.width || 800;
        const h = processedCanvas.height || 600;
        processedCanvas.width = w;
        processedCanvas.height = h;
        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#666';
        ctx.font = '16px sans-serif';
        ctx.fillText('Preview unavailable', 20, 32);
        updateDisplayCanvas();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const applyImageEdits = async (canvas, edits, curveLUTs) => {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Apply WB per-channel gains first if provided
    const rGain = wbGains?.rGain ?? 1;
    const gGain = wbGains?.gGain ?? 1;
    const bGain = wbGains?.bGain ?? 1;

    // Apply basic edits
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // WB gains first
      if (rGain !== 1 || gGain !== 1 || bGain !== 1) {
        r = Math.min(255, r * rGain);
        g = Math.min(255, g * gGain);
        b = Math.min(255, b * bGain);
      }

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

      // Apply per-channel tone curve LUTs if provided
      if (curveLUTs && curveLUTs.lutR && curveLUTs.lutG && curveLUTs.lutB) {
        const { lutR, lutG, lutB } = curveLUTs;
        const idxR = Math.min(lutR.length - 1, Math.max(0, r | 0));
        const idxG = Math.min(lutG.length - 1, Math.max(0, g | 0));
        const idxB = Math.min(lutB.length - 1, Math.max(0, b | 0));
        r = lutR[idxR];
        g = lutG[idxG];
        b = lutB[idxB];
      }

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }

    ctx.putImageData(imageData, 0, 0);
  };

  // Extract mono channel canvases/blobs for R/G/B
  const extractChannels = async (source = 'processed') => {
    const srcCanvas = source === 'original' ? originalCanvasRef.current : processedCanvasRef.current;
    if (!srcCanvas) return null;
    const w = srcCanvas.width;
    const h = srcCanvas.height;
    const sctx = srcCanvas.getContext('2d');
    const srcData = sctx.getImageData(0, 0, w, h).data;

    const makeMono = (selector) => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const cctx = c.getContext('2d');
      const img = cctx.createImageData(w, h);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = selector(srcData[i], srcData[i + 1], srcData[i + 2]);
        d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = 255;
      }
      cctx.putImageData(img, 0, 0);
      return c;
    };

    const rCanvas = makeMono((r,g,b) => r);
    const gCanvas = makeMono((r,g,b) => g);
    const bCanvas = makeMono((r,g,b) => b);

    const toBlob = (canvas) => new Promise((resolve) => canvas.toBlob((blob) => resolve(blob), 'image/png'));

    const [rBlob, gBlob, bBlob] = await Promise.all([toBlob(rCanvas), toBlob(gCanvas), toBlob(bCanvas)]);
    return { rBlob, gBlob, bBlob };
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

    // If WB selection overlay is enabled and dragging, draw rectangle overlay
    if (wbSelectEnabled && wbDrag) {
      const startX = Math.min(wbDrag.startX, wbDrag.curX);
      const startY = Math.min(wbDrag.startY, wbDrag.curY);
      const endX = Math.max(wbDrag.startX, wbDrag.curX);
      const endY = Math.max(wbDrag.startY, wbDrag.curY);
      ctx.save();
      ctx.strokeStyle = '#4fd1c5';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(startX, startY, endX - startX, endY - startY);
      ctx.restore();
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
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // WB selection drag handling
    if (wbSelectEnabled && wbDrag) {
      setWbDrag((prev) => ({ ...prev, curX: x, curY: y }));
      if (!isLoading) updateDisplayCanvas();
      return;
    }

    if (!showSlider || !onSliderChange) return;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    onSliderChange(percentage);
  };

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // WB selection start
    if (wbSelectEnabled) {
      setWbDrag({ startX: x, startY: y, curX: x, curY: y });

      const handleUp = async () => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);

        if (!wbDrag) {
          setWbDrag(null);
          return;
        }
        // Compute final rectangle in display canvas coordinates
        const startX = Math.min(wbDrag.startX, wbDrag.curX);
        const startY = Math.min(wbDrag.startY, wbDrag.curY);
        const endX = Math.max(wbDrag.startX, wbDrag.curX);
        const endY = Math.max(wbDrag.startY, wbDrag.curY);

        // Map display canvas rect back to image pixel coordinates
        const container = canvasRef.current;
        const ctx = container.getContext('2d');

        const originalCanvas = originalCanvasRef.current;
        const processedCanvas = processedCanvasRef.current;
        if (!originalCanvas || !processedCanvas) {
          setWbDrag(null);
          return;
        }

        // Recompute scaling to map coordinates (reuse logic from updateDisplayCanvas)
        const containerRect = container.parentElement.getBoundingClientRect();
        const cW = container.width;
        const cH = container.height;
        // Use last computed dims
        const scale = Math.min(
          cW / originalCanvas.width,
          cH / originalCanvas.height
        );
        const scaledWidth = originalCanvas.width * scale;
        const scaledHeight = originalCanvas.height * scale;
        const baseX = (cW - scaledWidth) / 2;
        const baseY = (cH - scaledHeight) / 2;

        // Clamp selection to image area
        const selX1 = Math.max(startX, baseX);
        const selY1 = Math.max(startY, baseY);
        const selX2 = Math.min(endX, baseX + scaledWidth);
        const selY2 = Math.min(endY, baseY + scaledHeight);

        const selW = Math.max(0, selX2 - selX1);
        const selH = Math.max(0, selY2 - selY1);

        if (selW < 2 || selH < 2) {
          setWbDrag(null);
          return;
        }

        // Convert to image pixel coordinates
        const imgX = Math.round((selX1 - baseX) / scale);
        const imgY = Math.round((selY1 - baseY) / scale);
        const imgW = Math.round(selW / scale);
        const imgH = Math.round(selH / scale);

        // Sample from originalCanvas (pre-adjusted)
        const octx = originalCanvas.getContext('2d');
        const clampW = Math.min(imgW, originalCanvas.width - imgX);
        const clampH = Math.min(imgH, originalCanvas.height - imgY);
        if (clampW <= 0 || clampH <= 0) {
          setWbDrag(null);
          return;
        }
        const region = octx.getImageData(imgX, imgY, clampW, clampH);
        const d = region.data;
        let sumR = 0, sumG = 0, sumB = 0, count = 0;
        for (let i = 0; i < d.length; i += 4) {
          sumR += d[i];
          sumG += d[i + 1];
          sumB += d[i + 2];
          count++;
        }
        const avgR = sumR / count;
        const avgG = sumG / count;
        const avgB = sumB / count;
        const L = (avgR + avgG + avgB) / 3 || 1;
        const rGain = L / (avgR || 1);
        const gGain = L / (avgG || 1);
        const bGain = L / (avgB || 1);

        if (onWbRegionSelected) {
          onWbRegionSelected(
            { x: imgX, y: imgY, width: clampW, height: clampH },
            { avgR, avgG, avgB },
            { rGain, gGain, bGain }
          );
        }

        setWbDrag(null);
      };

      const handleMove = (ev) => {
        const r = canvasRef.current.getBoundingClientRect();
        const nx = ev.clientX - r.left;
        const ny = ev.clientY - r.top;
        setWbDrag((prev) => (prev ? { ...prev, curX: nx, curY: ny } : prev));
        if (!isLoading) updateDisplayCanvas();
      };

      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
      return;
    }

    // Before/After slider drag activation
    if (!showSlider) return;

    const handleMove = (ev) => {
      const r = canvasRef.current.getBoundingClientRect();
      const nx = ev.clientX - r.left;
      const percentage = Math.max(0, Math.min(100, (nx / r.width) * 100));
      onSliderChange(percentage);
    };

    const handleUp = () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
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
  }, [isLoading, sliderPosition, wbDrag, wbSelectEnabled]);

  // If consumer requests channel extraction, run it when canvases are ready and notify once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (typeof onExtractChannels === 'function' && originalCanvasRef.current && processedCanvasRef.current && !isLoading) {
        const result = await extractChannels(extractChannelsFrom);
        if (!cancelled) {
          onExtractChannels(result);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [onExtractChannels, extractChannelsFrom, isLoading, imageSrc, edits, wbGains]);

  return (
    <div className="enhanced-canvas-container">
      <canvas
        ref={canvasRef}
        className="enhanced-canvas"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
      />
      {/* when WB selection is enabled, we rely on the same canvas; overlay drawn in updateDisplayCanvas */}
      
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
