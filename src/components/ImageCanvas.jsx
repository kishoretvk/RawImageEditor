
import { autoEnhance } from '../lib/autoEnhance';
import React, { useRef, useEffect, useState } from 'react';
import {
  applyHDR,
  applyCurves,
  applyChannelMixer,
  applyLUT,
  applyDefog,
  applyShadowHighlight,
  applyChromaticAberration,
  applyVignetting,
  applyFilmGrain
} from '../utils/advancedFilters';

const clamp = (v, min = 0, max = 255) => Math.max(min, Math.min(max, v));

const applyFilters = (ctx, image, edits) => {
  // Unpack edits
  const {
    exposure = 0, contrast = 0, highlights = 0, shadows = 0, whites = 0, blacks = 0, gamma = 1,
    vibrance = 0, saturation = 0, hue = 0, temperature = 0, tint = 0,
    sharpness = 0, clarity = 0, blur = 0, vignette = 0,
    flipH = false, flipV = false, rotate = 0, crop = null,
    mask = null, customFilter = null, applyQuickAction = null, localBrushMask = null,
    // Advanced panel sliders
    hdr = 1, curves = 1, channelMixer = 1, lut = 0, defog = 0,
    shadowHighlight = 1, chromatic = 0, advancedVignetting = 0, filmGrain = 0
  } = edits || {};

  const width = image.width;
  const height = image.height;
  ctx.clearRect(0, 0, width, height);
  ctx.save();

  // Geometry: flip, rotate
  if (flipH || flipV || rotate !== 0) {
    ctx.translate(width / 2, height / 2);
    ctx.rotate((rotate * Math.PI) / 180);
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    ctx.drawImage(image, -width / 2, -height / 2);
  } else {
    ctx.drawImage(image, 0, 0);
  }
  ctx.restore();

  // Get initial image data for pixel processing
  let imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i], g = data[i + 1], b = data[i + 2];

    // Exposure
    r += exposure * 255;
    g += exposure * 255;
    b += exposure * 255;

    // Contrast
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    r = factor * (r - 128) + 128;
    g = factor * (g - 128) + 128;
    b = factor * (b - 128) + 128;

    // Gamma
    r = 255 * Math.pow(r / 255, 1 / gamma);
    g = 255 * Math.pow(g / 255, 1 / gamma);
    b = 255 * Math.pow(b / 255, 1 / gamma);

    // Saturation
    const avg = (r + g + b) / 3;
    r += (r - avg) * (saturation / 100);
    g += (g - avg) * (saturation / 100);
    b += (b - avg) * (saturation / 100);

    // Vibrance
    const max = Math.max(r, g, b);
    const vibranceBoost = vibrance / 100;
    r += (max - r) * vibranceBoost;
    g += (max - g) * vibranceBoost;
    b += (max - b) * vibranceBoost;

    // Hue
    if (hue !== 0) {
      const angle = (hue * Math.PI) / 180;
      const cosA = Math.cos(angle), sinA = Math.sin(angle);
      const newR = 0.213 + cosA * 0.787 - sinA * 0.213;
      const newG = 0.715 - cosA * 0.715 - sinA * 0.715;
      const newB = 0.072 - cosA * 0.072 + sinA * 0.928;
      const r1 = r * newR + g * newG + b * newB;
      const g1 = r * newG + g * newR + b * newB;
      const b1 = r * newB + g * newG + b * newR;
      r = r1; g = g1; b = b1;
    }

    // Temperature/Tint
    r += temperature;
    b -= temperature;
    g += tint;

    data[i] = clamp(r, 0, 255);
    data[i + 1] = clamp(g, 0, 255);
    data[i + 2] = clamp(b, 0, 255);
  }

  ctx.putImageData(imageData, 0, 0);

  // Blur
  if (blur > 0) {
    ctx.globalAlpha = 0.5;
    for (let i = 1; i <= blur; i++) {
      ctx.drawImage(ctx.canvas, i, 0);
      ctx.drawImage(ctx.canvas, -i, 0);
      ctx.drawImage(ctx.canvas, 0, i);
      ctx.drawImage(ctx.canvas, 0, -i);
    }
    ctx.globalAlpha = 1.0;
  }

  // Vignette
  if (vignette > 0) {
    const gradient = ctx.createRadialGradient(width / 2, height / 2, width * 0.2, width / 2, height / 2, width * 0.5);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, `rgba(0,0,0,${vignette / 100})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  // Custom filter
  if (customFilter) {
    customFilter(ctx, imageData);
  }

  // Quick Actions
  if (applyQuickAction === 'bw') {
    const bwData = ctx.getImageData(0, 0, width, height);
    const pixels = bwData.data;
    for (let i = 0; i < pixels.length; i += 4) {
      const avg = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      pixels[i] = pixels[i + 1] = pixels[i + 2] = avg;
    }
    ctx.putImageData(bwData, 0, 0);
  }
  
  // Apply advanced adjustments
  // Get updated image data after previous operations
  imageData = ctx.getImageData(0, 0, width, height);
  
  // Only process if any advanced slider is not at default/neutral
  if (hdr !== 1 || curves !== 1 || channelMixer !== 1 || lut !== 0 || defog !== 0 || 
      shadowHighlight !== 1 || chromatic !== 0 || advancedVignetting !== 0 || filmGrain !== 0) {
      
    // Apply each advanced filter in sequence
    if (hdr !== 1) imageData = applyHDR(imageData, hdr);
    if (curves !== 1) imageData = applyCurves(imageData, curves);
    if (channelMixer !== 1) imageData = applyChannelMixer(imageData, channelMixer);
    if (lut !== 0) imageData = applyLUT(imageData, lut);
    if (defog !== 0) imageData = applyDefog(imageData, defog);
    if (shadowHighlight !== 1) imageData = applyShadowHighlight(imageData, shadowHighlight);
    if (chromatic !== 0) imageData = applyChromaticAberration(imageData, chromatic);
    if (advancedVignetting !== 0) imageData = applyVignetting(imageData, width, height, advancedVignetting);
    
    // Update the canvas with processed image data
    ctx.putImageData(imageData, 0, 0);
    
    // Film grain is applied directly to the canvas (not ImageData)
    if (filmGrain > 0) applyFilmGrain(ctx, width, height, filmGrain);
  }
};

const ImageCanvas = ({ imageSrc, edits, onProcessed }) => {
  const canvasRef = useRef(null);
  const [image, setImage] = useState(null);

  useEffect(() => {
    if (!imageSrc) return;
    const img = new window.Image();
    img.onload = () => setImage(img);
    img.src = imageSrc;
  }, [imageSrc]);

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    canvas.width = image.width;
    canvas.height = image.height;
    applyFilters(ctx, image, edits);
    if (onProcessed) onProcessed(canvas.toDataURL());
  }, [image, edits]);

  return (
    <div className="relative">
      <canvas ref={canvasRef} className="w-full max-w-full h-auto rounded-xl border border-gray-700 shadow-lg" />
    </div>
  );
};

export default ImageCanvas;
