import React, { useRef, useEffect, useState, useMemo } from 'react';
import { processImageWithEdits } from '../utils/rawProcessor';

const EnhancedImageCanvas = ({ 
  imageSrc, 
  edits = {}, 
  // local masks passed from EditorPage; default empty array to avoid ReferenceError
  localMasks = [], 
  showSlider = false, 
  sliderPosition = 50,
  onSliderChange,
  curveLUTs = null,
  // WB region selection mode and gains application
  wbSelectEnabled = false,
  onWbRegionSelected = null,
  wbGains = null, // { rGain, gGain, bGain }
  wbSamplingSpace = 'original', // 'original' | 'processed'
  // Channel split export: when requested, return blobs for R/G/B
  onExtractChannels = null,
  extractChannelsFrom = 'processed', // 'processed' | 'original'
  // AI/matte-aware compose props
  ai = null, // expected: { subjectMask?: { data: Float32Array, w:number, h:number } }
  hasAlphaBackgroundRemoved = false,
  featherPx = 2,
  // Inpainting props
  inpaintIsEnabled = false,
  inpaintBrushSize = 40,
  onInpaintMaskUpdate = null,
}) => {
  const canvasRef = useRef(null);
  const originalCanvasRef = useRef(null);
  const processedCanvasRef = useRef(null);
  const inpaintMaskCanvasRef = useRef(null);
  // Cache for matte-based background blur to avoid recomputing on small changes
  const matteCacheRef = useRef({
    key: null,         // cache key based on dims/blur/mask hash
    blurredBG: null    // OffscreenCanvas with pre-blurred background
  });
  const [isLoading, setIsLoading] = useState(true);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  // WB region selection state (canvas coordinate space during drag)
  const [wbDrag, setWbDrag] = useState(null); // { startX, startY, curX, curY }

  // rAF gate to avoid multiple reprocesses per frame
  const rafGateRef = useRef(0);
  useEffect(() => {
    if (rafGateRef.current) return;
    rafGateRef.current = requestAnimationFrame(() => {
      rafGateRef.current = 0;
      loadAndProcessImage();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // Optional matte-aware compose (background blur / alpha remove)
      if (ai?.subjectMask || hasAlphaBackgroundRemoved || (edits?.effects?.blur > 0)) {
        try {
          await applyMatteAwareCompose(processedCanvas, originalCanvas, edits, ai, { featherPx, removeAlpha: hasAlphaBackgroundRemoved });
        } catch (e) {
          // non-fatal; fall back to regular processed canvas
          console.warn('[EnhancedImageCanvas] matte compose failed:', e);
        }
      }

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
    console.time && console.time('[applyImageEdits total]');
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Pre-allocate scratch buffers once per call for NR/sharpen operations
    const width = canvas.width;
    const height = canvas.height;
    const scratch = new Uint8ClampedArray(data.length);
    const scratch2 = new Uint8ClampedArray(data.length);

    // Apply WB per-channel gains first if provided
    const rGain = wbGains?.rGain ?? 1;
    const gGain = wbGains?.gGain ?? 1;
    const bGain = wbGains?.bGain ?? 1;

    // HSL band definitions (hue ranges in degrees)
    const HSL_BANDS = [
      { key: 'red', hueMin: 0, hueMax: 15 },
      { key: 'orange', hueMin: 15, hueMax: 45 },
      { key: 'yellow', hueMin: 45, hueMax: 75 },
      { key: 'green', hueMin: 75, hueMax: 135 },
      { key: 'aqua', hueMin: 135, hueMax: 165 },
      { key: 'blue', hueMin: 165, hueMax: 255 },
      { key: 'purple', hueMin: 255, hueMax: 285 },
      { key: 'magenta', hueMin: 285, hueMax: 360 },
    ];

    // Short-circuit feature checks to skip heavy work when inactive
    const st = edits.splitToning || null;
    const hasSplitToning = !!st && ((st.highlightsSat || 0) !== 0 || (st.shadowsSat || 0) !== 0);

    const hsl = edits.hslAdjustments || null;
    let hasHsl = false;
    if (hsl) {
      for (const band of HSL_BANDS) {
        const adj = hsl[band.key];
        if (adj && ((adj.hue || 0) !== 0 || (adj.sat || 0) !== 0 || (adj.lum || 0) !== 0)) {
          hasHsl = true; break;
        }
      }
    }

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

      // Split Toning (apply after curves) — only if active
      if (hasSplitToning) {
        const { highlightsHue = 40, highlightsSat = 15, shadowsHue = 220, shadowsSat = 15, balance = 0 } = st || {};
        // compute luminance in [0..1]
        const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
        // balance in [-1..1]
        const bal = Math.max(-1, Math.min(1, balance / 100));
        // shadows weight increases in darks; highlights in brights; balance shifts midpoint
        const mid = 0.5 + bal * 0.25; // shift midpoint by balance
        const shadowsW = luma < mid ? 1 - (luma / Math.max(0.0001, mid)) : 0;
        const highlightsW = luma > mid ? (luma - mid) / Math.max(0.0001, 1 - mid) : 0;

        // convert hue/sat to RGB tint at same luminance
        const tintShadows = hslToRgb(shadowsHue, shadowsSat, luma * 100);
        const tintHighlights = hslToRgb(highlightsHue, highlightsSat, luma * 100);

        // blend tints by weights (normalized so sum <= 1)
        const wSum = shadowsW + highlightsW || 1;
        const wS = shadowsW / wSum;
        const wH = highlightsW / wSum;

        r = Math.max(0, Math.min(255, Math.round(r * (1 - (wS + wH)) + tintShadows[0] * wS + tintHighlights[0] * wH)));
        g = Math.max(0, Math.min(255, Math.round(g * (1 - (wS + wH)) + tintShadows[1] * wS + tintHighlights[1] * wH)));
        b = Math.max(0, Math.min(255, Math.round(b * (1 - (wS + wH)) + tintShadows[2] * wS + tintHighlights[2] * wH)));
      }

      // HSL adjustments per color band — only if active
      if (hasHsl) {
        const hslv = rgbToHsl(r, g, b);
        let [h, s, l] = hslv;

        for (const band of HSL_BANDS) {
          if (h >= band.hueMin && h <= band.hueMax) {
            const adj = hsl[band.key];
            if (adj) {
              if ((adj.hue || 0) !== 0) h = h + adj.hue;
              if ((adj.sat || 0) !== 0) s = Math.max(0, Math.min(100, s + adj.sat));
              if ((adj.lum || 0) !== 0) l = Math.max(0, Math.min(100, l + adj.lum));
            }
            break;
          }
        }

        const [nr, ng, nb] = hslToRgb(h, s, l);
        r = nr;
        g = ng;
        b = nb;
      }

      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }

    // Write basic/global edits back before detail processing
    ctx.putImageData(imageData, 0, 0);
    console.timeEnd && console.timeEnd('[applyImageEdits total]');

    // Apply Local Masks (gradient prototype) after global color edits, before sharpening
    if (Array.isArray(edits?.localMasks) || Array.isArray(localMasks)) {
      const masks = Array.isArray(edits?.localMasks) ? edits.localMasks : (Array.isArray(localMasks) ? localMasks : []);
      if (masks.length > 0) {
        try {
          const { maskProcessor } = await import('../utils/maskProcessor');
          const baseImg = ctx.getImageData(0, 0, canvas.width, canvas.height);

          for (const m of masks) {
            if (!m?.enabled) continue;
            let mask;
            if (m.type === 'gradient') {
              mask = maskProcessor.generateLinearGradientMask({
                width: canvas.width,
                height: canvas.height,
                start: m.start,
                end: m.end,
                feather: m.feather ?? 0.2,
                invert: !!m.invert
              });
            } else {
              continue; // future types (radial/brush/etc.)
            }
            // Apply local adjustments via processor and draw back
            const adjusted = maskProcessor.applyMask(baseImg, { ...m, data: mask.data, width: mask.width, height: mask.height }, m.adjustments || {});
            ctx.putImageData(adjusted, 0, 0);
          }
        } catch (e) {
          // non-fatal
          console.warn('Local mask application failed:', e);
        }
      }
    }

    // Detail Panel: Luma NR, Chroma NR, Sharpen (unsharp mask) with masking
    const detail = edits.detailAdjustments || edits.detail || null;
    if (detail) {
      const {
        lumaNR = 0,          // 0..100
        chromaNR = 0,        // 0..100
        sharpenAmount = 40,  // 0..150
        sharpenRadius = 1.0, // 0.5..3.0
        sharpenDetail = 25,  // 0..100
        sharpenMasking = 0   // 0..100
      } = detail || {};

      // Read current processed pixels
      const base = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const bd = base.data;

      // Compute luma buffer
      const lumaBuf = new Float32Array(width * height);
      for (let y = 0, idx = 0; y < height; y++) {
        for (let x = 0; x < width; x++, idx++) {
          const o = idx * 4;
          const r = bd[o], g = bd[o + 1], b = bd[o + 2];
          lumaBuf[idx] = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        }
      }

      // Luma NR (separable blur on luma only)
      if (lumaNR > 0) {
        const sigma = 0.5 + (lumaNR / 100) * 1.5; // approx radius mapping
        separableGaussianGray(lumaBuf, width, height, sigma);
        // Recompose RGB by pushing luma towards denoised luma
        for (let y = 0, idx = 0; y < height; y++) {
          for (let x = 0; x < width; x++, idx++) {
            const o = idx * 4;
            const r = bd[o], g = bd[o + 1], b = bd[o + 2];
            const curL = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            const targetL = lumaBuf[idx];
            const delta = targetL - curL;
            // distribute delta across channels by their contribution
            bd[o]     = clamp8(r + delta * 0.2126);
            bd[o + 1] = clamp8(g + delta * 0.7152);
            bd[o + 2] = clamp8(b + delta * 0.0722);
          }
        }
      }

      // Chroma NR (light blur on a-b like components using simple difference from luma)
      if (chromaNR > 0) {
        // Build chroma buffers Cr, Cb as differences from luma
        const Cr = new Float32Array(width * height);
        const Cb = new Float32Array(width * height);
        for (let y = 0, idx = 0; y < height; y++) {
          for (let x = 0; x < width; x++, idx++) {
            const o = idx * 4;
            const r = bd[o], g = bd[o + 1], b = bd[o + 2];
            const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            Cr[idx] = r - L;
            Cb[idx] = b - L;
          }
        }
        const sigmaC = 0.5 + (chromaNR / 100) * 1.2;
        separableGaussianGray(Cr, width, height, sigmaC);
        separableGaussianGray(Cb, width, height, sigmaC);
        // Recompose RGB with smoothed chroma
        for (let y = 0, idx = 0; y < height; y++) {
          for (let x = 0; x < width; x++, idx++) {
            const o = idx * 4;
            const g = bd[o + 1];
            const L = 0.2126 * bd[o] + 0.7152 * g + 0.0722 * bd[o + 2];
            const rNew = L + Cr[idx];
            const bNew = L + Cb[idx];
            bd[o]     = clamp8(rNew);
            bd[o + 2] = clamp8(bNew);
          }
        }
      }

      // Unsharp mask sharpen
      if (sharpenAmount > 0) {
        // Copy current to scratch
        scratch.set(bd);
        // Blur into scratch2
        const sigmaS = Math.max(0.25, sharpenRadius);
        separableGaussianRGBA(scratch, scratch2, width, height, sigmaS);

        // Edge mask from difference magnitude (for masking and "detail")
        // Compute mask strength based on sharpenMasking and sharpenDetail
        const maskThresh = (sharpenMasking / 100) * 40; // threshold in [0..40] approx
        const detailScale = 0.5 + (sharpenDetail / 100) * 1.5; // 0.5..2.0

        for (let i = 0; i < bd.length; i += 4) {
          const r = bd[i], g = bd[i + 1], b = bd[i + 2];
          const rb = scratch2[i], gb = scratch2[i + 1], bb = scratch2[i + 2];
          const dr = r - rb, dg = g - gb, db = b - bb;

          const mag = Math.sqrt(dr * dr + dg * dg + db * db) / Math.sqrt(3);
          const mask = mag <= maskThresh ? 0 : Math.min(1, (mag - maskThresh) / 128);

          const k = (sharpenAmount / 100) * detailScale * mask;
          bd[i]     = clamp8(r + dr * k);
          bd[i + 1] = clamp8(g + dg * k);
          bd[i + 2] = clamp8(b + db * k);
        }
      }

      ctx.putImageData(base, 0, 0);
    }
  };

  /**
   * Matte-aware compose:
   * - If effects.blur > 0: blur background only, keep subject sharp via subject mask
   * - If removeAlpha: apply subject mask as alpha (background transparent)
   * Uses a small cache so feather tweaks avoid recomputing heavy blur.
   */
  const applyMatteAwareCompose = async (procCanvas, origCanvas, edits, ai, { featherPx = 2, removeAlpha = false } = {}) => {
    const blurAmt = Math.max(0, Math.min(100, Number(edits?.effects?.blur || 0)));
    const hasBlur = blurAmt > 0;
    const maskObj = ai?.subjectMask || null;
    if (!maskObj && !removeAlpha && !hasBlur) return; // nothing to do

    const W = procCanvas.width | 0;
    const H = procCanvas.height | 0;
    if (W <= 0 || H <= 0) return;

    // Create working contexts
    const procCtx = procCanvas.getContext('2d');
    const baseImg = procCtx.getImageData(0, 0, W, H);
    const bd = baseImg.data;

    // Prepare/resize mask to image dimensions if present
    let mask = null;
    if (maskObj && maskObj.data && maskObj.w && maskObj.h) {
      mask = resizeMaskToImage(maskObj.data, maskObj.w, maskObj.h, W, H);
      if (featherPx > 0.1) {
        featherFloatMask(mask, W, H, featherPx);
      }
    }

    // Remove alpha using mask (subject opaque, background transparent)
    if (removeAlpha && mask) {
      const alpha = new Uint8ClampedArray(W * H);
      for (let i = 0; i < alpha.length; i++) {
        alpha[i] = Math.max(0, Math.min(255, Math.round(mask[i] * 255)));
      }
      for (let i = 0, p = 0; i < alpha.length; i++, p += 4) {
        bd[p + 3] = alpha[i];
      }
      procCtx.putImageData(baseImg, 0, 0);
    }

    // Background blur while preserving subject
    if (hasBlur) {
      // Build cache key
      const maskHash = mask ? `${W}x${H}@${Math.round(featherPx)}@${hashMask(mask, W, H)}` : `${W}x${H}@no-mask`;
      const key = `${maskHash}#blur:${blurAmt}`;
      let blurredBG = null;

      if (matteCacheRef.current.key === key && matteCacheRef.current.blurredBG) {
        blurredBG = matteCacheRef.current.blurredBG;
      } else {
        // Create blurred background from the current processed image
        blurredBG = new OffscreenCanvas(W, H);
        const bctx = blurredBG.getContext('2d');
        bctx.putImageData(baseImg, 0, 0);
        // Approximate Gaussian blur using canvas filter (fast path)
        try {
          bctx.filter = `blur(${(blurAmt / 100) * 12}px)`; // 0..12px scale
          bctx.drawImage(blurredBG, 0, 0);
          bctx.filter = 'none';
        } catch {
          // Fallback: simple separable blur on CPU if filter unsupported
          const src = bctx.getImageData(0, 0, W, H);
          const tmp = new Uint8ClampedArray(src.data.length);
          separableGaussianRGBA(src.data, tmp, W, H, 0.5 + (blurAmt / 100) * 3.0);
          const out = new ImageData(tmp, W, H);
          bctx.putImageData(out, 0, 0);
        }
        matteCacheRef.current.key = key;
        matteCacheRef.current.blurredBG = blurredBG;
      }

      // Compose: subject from baseImg, background from blurredBG, masked by (1 - mask)
      const bimg = (blurredBG.getContext && blurredBG.getContext('2d').getImageData(0, 0, W, H)) || null;
      const bb = bimg ? bimg.data : null;
      if (!bb) return;

      if (mask) {
        for (let i = 0, p = 0; i < W * H; i++, p += 4) {
          const m = mask[i]; // 0 bg, 1 subject
          const inv = 1 - m;
          // background contribution
          bd[p]     = clamp8(bd[p] * m + bb[p] * inv);
          bd[p + 1] = clamp8(bd[p + 1] * m + bb[p + 1] * inv);
          bd[p + 2] = clamp8(bd[p + 2] * m + bb[p + 2] * inv);
          // alpha already set by previous step if removeAlpha; otherwise keep opaque
          if (!removeAlpha) bd[p + 3] = 255;
        }
      } else {
        // No mask: global blur (fallback)
        for (let i = 0; i < bd.length; i++) bd[i] = bb[i];
      }

      procCtx.putImageData(baseImg, 0, 0);
    }
  };

  // Resize Float32 mask (nearest neighbor)
  function resizeMaskToImage(srcMask, mw, mh, W, H) {
    if (mw === W && mh === H) return srcMask;
    const out = new Float32Array(W * H);
    for (let y = 0; y < H; y++) {
      const sy = Math.min(mh - 1, Math.round((y / H) * mh));
      for (let x = 0; x < W; x++) {
        const sx = Math.min(mw - 1, Math.round((x / W) * mw));
        out[y * W + x] = srcMask[sy * mw + sx];
      }
    }
    return out;
  }

  // Feather Float32 mask using small separable blur in mask space
  function featherFloatMask(mask, W, H, px) {
    const sigma = Math.max(0.25, px / 2.5);
    separableGaussianGray(mask, W, H, sigma);
    // Normalize to 0..1
    for (let i = 0; i < mask.length; i++) {
      const v = mask[i];
      mask[i] = v < 0 ? 0 : v > 1 ? 1 : v;
    }
  }

  // Light hash for cache key
  function hashMask(mask, W, H) {
    // sample a few points
    let h = 0;
    const step = Math.max(1, Math.floor((W * H) / 1024));
    for (let i = 0; i < mask.length; i += step) {
      h = (h * 1664525 + Math.round(mask[i] * 255) + 1013904223) | 0;
    }
    return (h >>> 0).toString(16);
  }

  // Utility: clamp to 0..255
  function clamp8(v) {
    return v < 0 ? 0 : v > 255 ? 255 : v | 0;
  }

  // Gaussian kernel helper
  function gaussianKernel(sigma) {
    const radius = Math.max(1, Math.ceil(sigma * 2.5));
    const size = radius * 2 + 1;
    const kernel = new Float32Array(size);
    const s2 = sigma * sigma;
    let sum = 0;
    for (let i = -radius, j = 0; i <= radius; i++, j++) {
      const v = Math.exp(-(i * i) / (2 * s2));
      kernel[j] = v;
      sum += v;
    }
    for (let j = 0; j < size; j++) kernel[j] /= sum;
    return { kernel, radius };
  }

  // Separable Gaussian for gray buffer (Float32Array)
  function separableGaussianGray(buf, w, h, sigma) {
    const { kernel, radius } = gaussianKernel(sigma);
    const tmp = new Float32Array(buf.length);

    // horizontal
    for (let y = 0; y < h; y++) {
      const row = y * w;
      for (let x = 0; x < w; x++) {
        let acc = 0;
        for (let k = -radius; k <= radius; k++) {
          const xx = Math.min(w - 1, Math.max(0, x + k));
          acc += buf[row + xx] * kernel[k + radius];
        }
        tmp[row + x] = acc;
      }
    }

    // vertical
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) {
        let acc = 0;
        for (let k = -radius; k <= radius; k++) {
          const yy = Math.min(h - 1, Math.max(0, y + k));
          acc += tmp[yy * w + x] * kernel[k + radius];
        }
        buf[y * w + x] = acc;
      }
    }
  }

  // Separable Gaussian for RGBA Uint8ClampedArray
  function separableGaussianRGBA(src, dst, w, h, sigma) {
    const { kernel, radius } = gaussianKernel(sigma);
    // horizontal
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const o = (y * w + x) * 4;
        let ar = 0, ag = 0, ab = 0, aa = 0;
        for (let k = -radius; k <= radius; k++) {
          const xx = Math.min(w - 1, Math.max(0, x + k));
          const oi = (y * w + xx) * 4;
          const wgt = kernel[k + radius];
          ar += src[oi] * wgt;
          ag += src[oi + 1] * wgt;
          ab += src[oi + 2] * wgt;
          aa += src[oi + 3] * wgt;
        }
        dst[o] = ar; dst[o + 1] = ag; dst[o + 2] = ab; dst[o + 3] = aa;
      }
    }
    // vertical
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const o = (y * w + x) * 4;
        let ar = 0, ag = 0, ab = 0, aa = 0;
        for (let k = -radius; k <= radius; k++) {
          const yy = Math.min(h - 1, Math.max(0, y + k));
          const oi = (yy * w + x) * 4;
          const wgt = kernel[k + radius];
          ar += dst[oi] * wgt;
          ag += dst[oi + 1] * wgt;
          ab += dst[oi + 2] * wgt;
          aa += dst[oi + 3] * wgt;
        }
        // write back into src-like buffer (bd) target after full blur
        dst[o] = ar; dst[o + 1] = ag; dst[o + 2] = ab; dst[o + 3] = aa;
      }
    }
  }

  // Helper: RGB to HSL
  function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
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
    return [h * 360, s * 100, l * 100];
  }

  // Helper: HSL to RGB
  function hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

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

    // Draw inpainting mask overlay
    if (inpaintIsEnabled && inpaintMaskCanvasRef.current) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.drawImage(inpaintMaskCanvasRef.current, x, y, scaledWidth, scaledHeight);
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

    // Inpainting brush stroke
    if (inpaintIsEnabled && e.buttons === 1) {
      const maskCanvas = inpaintMaskCanvasRef.current;
      const maskCtx = maskCanvas.getContext('2d');
      
      const scale = maskCanvas.width / rect.width;
      const brushX = x * scale;
      const brushY = y * scale;

      maskCtx.fillStyle = 'rgba(255, 0, 0, 1)';
      maskCtx.beginPath();
      maskCtx.arc(brushX, brushY, inpaintBrushSize / 2 * scale, 0, 2 * Math.PI);
      maskCtx.fill();
      
      updateDisplayCanvas();
      if (onInpaintMaskUpdate) {
        onInpaintMaskUpdate(maskCanvas);
      }
      return;
    }

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

    // Inpainting start
    if (inpaintIsEnabled) {
      const maskCanvas = inpaintMaskCanvasRef.current;
      if (!maskCanvas.width || !maskCanvas.height) {
        maskCanvas.width = imageDimensions.width;
        maskCanvas.height = imageDimensions.height;
      }
      const maskCtx = maskCanvas.getContext('2d');
      
      const scale = maskCanvas.width / rect.width;
      const brushX = x * scale;
      const brushY = y * scale;

      maskCtx.fillStyle = 'rgba(255, 0, 0, 1)';
      maskCtx.beginPath();
      maskCtx.arc(brushX, brushY, inpaintBrushSize / 2 * scale, 0, 2 * Math.PI);
      maskCtx.fill();

      updateDisplayCanvas();
      if (onInpaintMaskUpdate) {
        onInpaintMaskUpdate(maskCanvas);
      }
      return;
    }

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

        // Choose sampling source based on wbSamplingSpace
        const sampleCanvas = (wbSamplingSpace === 'processed' ? processedCanvas : originalCanvas) || originalCanvas;
        const sctx = sampleCanvas.getContext('2d');
        const clampW = Math.min(imgW, sampleCanvas.width - imgX);
        const clampH = Math.min(imgH, sampleCanvas.height - imgY);
        if (clampW <= 0 || clampH <= 0) {
          setWbDrag(null);
          return;
        }
        const region = sctx.getImageData(imgX, imgY, clampW, clampH);
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
      <canvas ref={inpaintMaskCanvasRef} style={{ display: 'none' }} />

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}
    </div>
  );
};

export default EnhancedImageCanvas;

// Local helpers (scoped) for detail and math
function clamp8(v) {
  return v < 0 ? 0 : v > 255 ? 255 : v | 0;
}
