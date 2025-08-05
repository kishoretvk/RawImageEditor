import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { convertRawToJpeg } from '../utils/imageProcessing';
import { isRawFile } from '../utils/rawFileDetector';
import Histogram from '../components/Histogram';
import { Link } from 'react-router-dom';
import '../styles/modern-editor.css';
import ConversionSettings from '../components/ConversionSettings';
import BasicAdjustmentsPanel from '../components/editorPanels/BasicAdjustmentsPanel';
import ColorAdjustmentsPanel from '../components/editorPanels/ColorAdjustmentsPanel';
import SharpnessPanel from '../components/editorPanels/SharpnessPanel';
import EffectsPanel from '../components/editorPanels/EffectsPanel';
import GeometryPanel from '../components/editorPanels/GeometryPanel';
import AdvancedPanel from '../components/editorPanels/AdvancedPanel';
import CurvesPanel from '../components/editorPanels/CurvesPanel';
import { buildLUTsFromCurves } from '../utils/curveUtils';
import FileUploader from '../components/FileUploader';
import EditorUploadPlaceholder from '../components/EditorUploadPlaceholder';
import EnhancedImageCanvas from '../components/EnhancedImageCanvas';
import PresetSelector from '../components/PresetSelector';
import PresetBuilder from '../components/PresetBuilder';
import PresetManager from '../components/PresetManager';
import UnifiedSlider from '../components/UnifiedSlider';
import WhiteBalanceTool from '../components/WhiteBalanceTool';
import BottomSheet from '../components/BottomSheet';
import '../styles/unified-slider.css';

// Enhanced collapsible panel wrapper
function CollapsibleControlPanel({ title, children, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="collapsible-panel">
      <button 
        className="panel-header"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="panel-title">{title}</span>
        <span className={`panel-chevron ${isOpen ? 'open' : ''}`}>▼</span>
      </button>
      {isOpen && (
        <div className="panel-content">
          {children}
        </div>
      )}
    </div>
  );
}

const EditorPage = () => {
  const [settings, setSettings] = useState({
    quality: 50,
    format: 'jpeg',
    resize: 1000,
    sharpening: 0,
    noiseReduction: 0,
  });
  const [uploadedImage, setUploadedImage] = useState(null);
  const [jpegPreview, setJpegPreview] = useState(null);
  const objectUrlRef = useRef(null);
  const [adjustments, setAdjustments] = useState({
    exposure: 0,
    contrast: 0,
    highlights: 0,
    shadows: 0,
    whites: 0,
    blacks: 0,
    gamma: 1,
  });
  const [colorAdjustments, setColorAdjustments] = useState({
    temperature: 0,
    tint: 0,
    hue: 0,
    saturation: 0,
  });
  const [sharpness, setSharpness] = useState({
    amount: 0,
    radius: 1,
    detail: 0.5,
    masking: 0,
  });
  const [effects, setEffects] = useState({
    vignette: 0,
    grain: 0,
    blur: 0,
  });
  const [geometry, setGeometry] = useState({
    crop: 0,
    rotate: 0,
    flip: 'none',
  });
  const [advanced, setAdvanced] = useState({
    hdr: 1,
    curves: 1,
    channelMixer: 1,
  });

  // White balance region selection state
  const [wbSelectEnabled, setWbSelectEnabled] = useState(false);
  const [wbGains, setWbGains] = useState(null); // { rGain, gGain, bGain }
  const [lastWbInfo, setLastWbInfo] = useState(null); // { avgR, avgG, avgB, rGain, gGain, bGain }

  // Unified tone curves state (master RGB + per-channel), normalized [0..1] point pairs
  const ID = [[0, 0], [1, 1]];
  const [curves, setCurves] = useState({
    mode: 'rgb',
    rgb: { points: ID },
    r: { points: ID },
    g: { points: ID },
    b: { points: ID }
  });

  // Compose master+channel curves into per-channel LUTs for rendering
  const { lutR, lutG, lutB } = useMemo(() => buildLUTsFromCurves(curves, { size: 256, space: 'linear' }), [curves]);
  const [editedImageUrl, setEditedImageUrl] = useState(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isExporting, setIsExporting] = useState(false);

  // Target-size export UI (minimizable) and logic state
  const [showTargetExport, setShowTargetExport] = useState(false);
  const [targetSizeMB, setTargetSizeMB] = useState(2); // default 2 MB
  const [sizeTolerancePct, setSizeTolerancePct] = useState(5); // ±5%
  const [allowDownscale, setAllowDownscale] = useState(true);
  const [isTargetExporting, setIsTargetExporting] = useState(false);
  const [lastTargetExportInfo, setLastTargetExportInfo] = useState(null); // { finalMB, quality, width, height, attempts }
  // Add state for image controls
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  // Add state for side panel toggle
  const [showSidePanel, setShowSidePanel] = useState(false);
  // Add state for resizable panel
  const [panelWidth, setPanelWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Mobile bottom-sheet state
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [showMoreTools, setShowMoreTools] = useState(false);

  // Channel split UI state
  const [channelSource, setChannelSource] = useState('processed'); // 'processed' | 'original'
  const [isExtractingChannels, setIsExtractingChannels] = useState(false);
  const [extractHandlerKey, setExtractHandlerKey] = useState(0); // force prop change to trigger extraction effect

  // Stable channel extraction handler (hook must be defined at top level, not inline in JSX)
  const onExtractChannelsHandler = useCallback(
    ({ rBlob, gBlob, bBlob } = {}) => {
      // Only act when extraction has been requested
      if (!isExtractingChannels) return;
      const save = (blob, name) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      };
      save(rBlob, `channel-R-${channelSource}.png`);
      save(gBlob, `channel-G-${channelSource}.png`);
      save(bBlob, `channel-B-${channelSource}.png`);
      setIsExtractingChannels(false);
    },
    [isExtractingChannels, channelSource]
  );

  // Update edited image when adjustments change
  // Important: Do NOT overwrite editedImageUrl with uploadedImage.url here,
  // because uploadedImage may be a native File with no .url, and we already
  // set an object URL in handleFileUpload. Keep editedImageUrl stable.
  useEffect(() => {
    // No-op: edits re-render EnhancedImageCanvas via props; editedImageUrl stays as set in handleFileUpload.
  }, [adjustments, colorAdjustments, sharpness, effects, geometry, advanced]);

  // Handle file upload and RAW-to-JPEG preview for histogram
  const handleFileUpload = async (incoming) => {
    try {
      // Normalize input: accept single File or array from FileUploader
      const file = Array.isArray(incoming) ? incoming[0] : incoming;
      if (!file) return;
      setUploadedImage(file);
      setIsLoading(true);

      // Normalize file info
      const fileName = file?.name || file?.filename || '';
      const knownUrl = file?.url || file?.preview || null;
      console.debug('[EditorPage] onFileUpload:', {
        name: file?.name || file?.filename,
        type: file?.type,
        size: file?.size,
        hasUrl: !!file?.url,
        hasPreview: !!file?.preview
      });

      // Create a fast local preview URL for immediate feedback
      // Revoke previous object URL if any
      if (objectUrlRef.current) {
        try { URL.revokeObjectURL(objectUrlRef.current); } catch {}
        objectUrlRef.current = null;
      }

      let instantUrl = knownUrl;
      if (!instantUrl && file instanceof Blob) {
        instantUrl = URL.createObjectURL(file);
        objectUrlRef.current = instantUrl;
      }

      const isRaw = isRawFile(fileName) || (file?.type && /application\/octet-stream|image\/x-(?:canon|nikon|sony|fujifilm|olympus|panasonic)-raw|image\/(?:dng|arw|nef|cr2|cr3|raf|orf|rw2)/i.test(file.type));

      if (!isRaw) {
        // JPEG/PNG path: use instant URL for both canvas and histogram
        if (instantUrl) {
          setEditedImageUrl(instantUrl);
          setJpegPreview(instantUrl);
        }
        console.debug('[EditorPage] JPEG/PNG preview set:', instantUrl);
        setIsLoading(false);
        return;
      }

      // RAW path:
      // Do NOT pass RAW blob to <img>. Show placeholder first, then replace with worker JPEG.
      const rawPlaceholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI2MDAiIGZpbGw9IiMyYTJhMmEiLz48dGV4dCB4PSI0MDAiIHk9IjMwMCIgZmlsbD0iIzc2NyIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkdlbmVyYXRpbmcgUkFXIHByZXZpZXcuLi48L3RleHQ+PC9zdmc+';
      setEditedImageUrl(rawPlaceholder);
      if (instantUrl) setJpegPreview(instantUrl); // temporary histogram source

      // RAW path: keep instant URL visible, then ask worker for better preview
      try {
        console.debug('[EditorPage] sending to worker convertRawToJpeg');

        // Watchdog timeout so UI never hangs if worker channel breaks
        const timeoutMs = 2000;
        const timeoutPromise = new Promise((resolve) => {
          setTimeout(() => resolve({ preview: instantUrl, status: 'timeout' }), timeoutMs);
        });

        // Race worker vs timeout
        // Pass the actual File/Blob to the worker so it can decode RAW
        const workerPromise = convertRawToJpeg({
          file,
          name: fileName
        });

        const jpegResult = await Promise.race([workerPromise, timeoutPromise]);

        console.debug('[EditorPage] worker/timeout returned', jpegResult);

        const displayUrl = jpegResult?.preview || null;

        if (displayUrl) {
          setJpegPreview(displayUrl);
          setEditedImageUrl(displayUrl); // use displayable JPEG/PNG in canvas
          console.debug('[EditorPage] RAW preview set from worker');
        } else {
          // Fallback: keep placeholder for canvas, histogram uses instantUrl if any
          if (instantUrl) setJpegPreview(instantUrl);
          console.warn('[EditorPage] RAW worker returned no preview, using fallback');
        }
      } catch (e) {
        console.error('[EditorPage] worker convert error', e);
        // Fallback
        if (instantUrl) setJpegPreview(instantUrl);
      } finally {
        setIsLoading(false);
      }
    } catch (err) {
      console.error('[EditorPage] handleFileUpload fatal', err);
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAdjustments({
      exposure: 0,
      contrast: 0,
      highlights: 0,
      shadows: 0,
      whites: 0,
      blacks: 0,
      gamma: 1,
    });
    setColorAdjustments({
      temperature: 0,
      tint: 0,
      hue: 0,
      saturation: 0,
    });
    setSharpness({
      amount: 0,
      radius: 1,
      detail: 0.5,
      masking: 0,
    });
    setEffects({
      vignette: 0,
      grain: 0,
      blur: 0,
    });
    setGeometry({
      crop: 0,
      rotate: 0,
      flip: 'none',
    });
    setAdvanced({
      hdr: 1,
      curves: 1,
      channelMixer: 1,
    });
    setSettings({
      quality: 50,
      format: 'jpeg',
      resize: 1000,
      sharpening: 0,
      noiseReduction: 0,
    });
  };

  const onUndo = () => {
    console.log('Undo action triggered');
  };

  const onRedo = () => {
    console.log('Redo action triggered');
  };

  const handleExport = async () => {
    if (!uploadedImage) return;
    
    setIsExporting(true);
    try {
      // Prefer editedImageUrl or jpegPreview; uploadedImage.url may be undefined for native Files
      const imageUrl =
        editedImageUrl ||
        jpegPreview ||
        (typeof uploadedImage === 'string' ? uploadedImage : (uploadedImage?.url || uploadedImage?.preview || null));

      if (!imageUrl) {
        throw new Error('No exportable image URL available');
      }

      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `edited-image.${settings.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleResizeStart = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleResizeMove = (e) => {
    if (!isResizing) return;
    const newWidth = Math.max(280, Math.min(600, e.clientX));
    setPanelWidth(newWidth);
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing]);

  const allEdits = {
    ...adjustments,
    ...colorAdjustments,
    ...sharpness,
    ...effects,
    ...geometry,
    ...advanced
  };

  return (
    <div className="editor-page">
      <div className="editor-header">
        <div className="header-left">
          <Link to="/" className="back-button">← Back to Home</Link>
          <h1>RAW Image Editor</h1>
        </div>
        <div className="header-right">
          <button className="header-button" onClick={onUndo}>Undo</button>
          <button className="header-button" onClick={onRedo}>Redo</button>
          <button className="header-button" onClick={handleReset}>Reset</button>
          <button 
            className="header-button primary" 
            onClick={handleExport}
            disabled={!uploadedImage || isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>

      <div className="editor-content">
        {/* Mobile toolbar */}
        <div className="mobile-toolbar" style={{ display: 'none' }}>
          <button
            className="header-button"
            onClick={() => setIsMobileSheetOpen(true)}
          >
            Adjustments
          </button>
        </div>
        <div className="editor-main">
          <div className="canvas-container" style={{ minHeight: '65vh' }}>
            {!uploadedImage ? (
              <div className="upload-placeholder">
                <FileUploader onFileUpload={handleFileUpload} />
              </div>
            ) : (
              <>
                <EnhancedImageCanvas
                  imageSrc={editedImageUrl}
                  edits={allEdits}
                  showSlider={showBeforeAfter}
                  sliderPosition={sliderPosition}
                  onSliderChange={setSliderPosition}
                  curveLUTs={lutR && lutG && lutB ? { lutR, lutG, lutB } : null}
                  // WB region selection wiring
                  wbSelectEnabled={wbSelectEnabled}
                  wbGains={wbGains}
                  onWbRegionSelected={(rect, avgs, gains) => {
                    setWbGains(gains);
                    setLastWbInfo({ ...avgs, ...gains });
                    // turn off selection after one selection
                    setWbSelectEnabled(false);
                  }}
                  // Channel extraction wiring
                  onExtractChannels={onExtractChannelsHandler}
                  extractChannelsFrom={channelSource}
                />
                {isLoading && (
                  <div className="canvas-loading-overlay">
                    <div className="spinner" />
                    <span>Processing…</span>
                  </div>
                )}
                <div className="canvas-controls">
                  <button 
                    className={`control-button ${showBeforeAfter ? 'active' : ''}`}
                    onClick={() => setShowBeforeAfter(!showBeforeAfter)}
                  >
                    {showBeforeAfter ? 'Hide' : 'Show'} Before/After
                  </button>
                  {showBeforeAfter && (
                    <UnifiedSlider
                      value={sliderPosition}
                      onChange={setSliderPosition}
                      min={0}
                      max={100}
                      step={1}
                      label="Before/After"
                    />
                  )}

                  {/* Split Channels Controls */}
                  {uploadedImage && (
                    <div className="split-channels-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '12px' }}>
                      <label className="text-xs" title="Choose source for channel extraction">Source:</label>
                      <select
                        className="text-xs"
                        value={channelSource}
                        onChange={(e) => setChannelSource(e.target.value)}
                        disabled={isExtractingChannels}
                      >
                        <option value="processed">Adjusted</option>
                        <option value="original">Original</option>
                      </select>
                      <button
                        className="control-button"
                        disabled={isExtractingChannels}
                        onClick={() => {
                          if (isExtractingChannels) return;
                          setIsExtractingChannels(true);
                          // force new handler identity to trigger onExtractChannels effect in canvas
                          setExtractHandlerKey((k) => k + 1);
                        }}
                        title="Export R/G/B mono PNGs"
                      >
                        {isExtractingChannels ? 'Extracting…' : 'Export R/G/B (PNG)'}
                      </button>
                    </div>
                  )}

                  {/* Target-size Export (minimizable) */}
                  {uploadedImage && (
                    <div className="target-size-export" style={{ marginLeft: '12px' }}>
                      <button
                        className={`control-button ${showTargetExport ? 'active' : ''}`}
                        onClick={() => setShowTargetExport(!showTargetExport)}
                        title="Toggle target-size export panel"
                      >
                        {showTargetExport ? 'Target Size ▼' : 'Target Size ▶'}
                      </button>

                      {showTargetExport && (
                        <div
                          className="target-size-panel"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginLeft: '8px',
                            padding: '6px 8px',
                            borderRadius: '8px',
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.12)'
                          }}
                        >
                          <label className="text-xs" title="Desired output file size in MB">Size (MB):</label>
                          <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={targetSizeMB}
                            onChange={(e) => setTargetSizeMB(Math.max(0.1, Number(e.target.value) || 0.1))}
                            className="text-xs"
                            style={{ width: '64px' }}
                          />
                          <label className="text-xs" title="Allowed size error tolerance">±%</label>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            step="1"
                            value={sizeTolerancePct}
                            onChange={(e) => setSizeTolerancePct(Math.max(1, Math.min(20, Number(e.target.value) || 5)))}
                            className="text-xs"
                            style={{ width: '48px' }}
                          />
                          <label className="text-xs" title="If needed, reduce resolution to meet target">Downscale</label>
                          <input
                            type="checkbox"
                            checked={allowDownscale}
                            onChange={(e) => setAllowDownscale(e.target.checked)}
                            title="Allow automatic downscale if quality alone cannot hit target"
                          />
                          <button
                            className="control-button"
                            disabled={isTargetExporting}
                            onClick={async () => {
                              if (!editedImageUrl || isTargetExporting) return;
                              setIsTargetExporting(true);
                              try {
                                const TWO_TO_Q = async (canvas, q) => new Promise((resolve) => {
                                  canvas.toBlob((blob) => resolve(blob), 'image/jpeg', q);
                                });

                                // Prepare a working canvas from processedCanvas inside EnhancedImageCanvas by drawing it here
                                // We will re-render from the visible canvas element to avoid threading; use the displayed processedCanvas as source
                                const display = document.querySelector('.enhanced-canvas-container canvas.enhanced-canvas');
                                // Fallback: render from image element if needed
                                const imgEl = new Image();
                                imgEl.src = editedImageUrl;

                                // First ensure image is loaded (in case direct draw is needed)
                                await new Promise((res) => {
                                  if (imgEl.complete) return res();
                                  imgEl.onload = () => res();
                                  imgEl.onerror = () => res();
                                });

                                // Build a temp working canvas reflecting the original image dimensions if possible
                                const tmp = document.createElement('canvas');
                                // Try to get true pixel size from hidden original canvas if present
                                const hiddenOriginal = document.querySelector('.enhanced-canvas-container canvas[style*="display: none"]');
                                if (hiddenOriginal && hiddenOriginal.width && hiddenOriginal.height) {
                                  tmp.width = hiddenOriginal.width;
                                  tmp.height = hiddenOriginal.height;
                                  const tctx = tmp.getContext('2d');
                                  // Draw from visible output if possible, else from the loaded image URL
                                  if (display) {
                                    // Draw scaled up from display to original size (quality may vary)
                                    tctx.drawImage(display, 0, 0, tmp.width, tmp.height);
                                  } else {
                                    tctx.drawImage(imgEl, 0, 0, tmp.width, tmp.height);
                                  }
                                } else {
                                  // Fallback to display size
                                  const baseW = imgEl.naturalWidth || 2048;
                                  const baseH = imgEl.naturalHeight || 1536;
                                  tmp.width = baseW;
                                  tmp.height = baseH;
                                  const tctx = tmp.getContext('2d');
                                  if (display) {
                                    tctx.drawImage(display, 0, 0, baseW, baseH);
                                  } else {
                                    tctx.drawImage(imgEl, 0, 0, baseW, baseH);
                                  }
                                }

                                const targetBytes = targetSizeMB * 1024 * 1024;
                                const tol = sizeTolerancePct / 100;
                                const withinTol = (size) => Math.abs(size - targetBytes) <= targetBytes * tol;

                                // Helper to run binary search for quality on a given canvas
                                const runQualitySearch = async (workCanvas) => {
                                  let lo = 0.2, hi = 0.95;
                                  let best = { blob: null, q: 0.85, size: Infinity };
                                  for (let i = 0; i < 8; i++) {
                                    const mid = (lo + hi) / 2;
                                    const blob = await TWO_TO_Q(workCanvas, mid);
                                    const size = blob ? blob.size : Infinity;

                                    // Track closest match
                                    if (Math.abs(size - targetBytes) < Math.abs((best.blob?.size || Infinity) - targetBytes)) {
                                      best = { blob, q: mid, size };
                                    }

                                    if (withinTol(size)) {
                                      return { blob, q: mid, size, attempts: i + 1 };
                                    }
                                    if (size > targetBytes) {
                                      // too big -> reduce quality
                                      hi = mid;
                                    } else {
                                      // too small -> increase quality
                                      lo = mid;
                                    }
                                  }
                                  return { blob: best.blob, q: best.q, size: best.size, attempts: 8 };
                                };

                                // Try quality search at current resolution
                                let workCanvas = tmp;
                                let result = await runQualitySearch(workCanvas);

                                // If still too big and allowed, progressively downscale and retry
                                const minLongEdge = 1024;
                                while (result.size > targetBytes * (1 + tol) && allowDownscale) {
                                  const w = workCanvas.width;
                                  const h = workCanvas.height;
                                  const longEdge = Math.max(w, h);
                                  if (longEdge <= minLongEdge) break;

                                  // Downscale by 10%
                                  const scale = 0.9;
                                  const newW = Math.max(1, Math.round(w * scale));
                                  const newH = Math.max(1, Math.round(h * scale));
                                  const d = document.createElement('canvas');
                                  d.width = newW;
                                  d.height = newH;
                                  const dctx = d.getContext('2d');
                                  dctx.imageSmoothingEnabled = true;
                                  dctx.imageSmoothingQuality = 'high';
                                  dctx.drawImage(workCanvas, 0, 0, newW, newH);
                                  workCanvas = d;

                                  result = await runQualitySearch(workCanvas);
                                  if (withinTol(result.size)) break;
                                }

                                // Finalize: download
                                if (result.blob) {
                                  const finalMB = (result.size / (1024 * 1024)).toFixed(2);
                                  setLastTargetExportInfo({
                                    finalMB: Number(finalMB),
                                    quality: Number(result.q.toFixed(3)),
                                    width: workCanvas.width,
                                    height: workCanvas.height,
                                    attempts: result.attempts
                                  });
                                  const url = URL.createObjectURL(result.blob);
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = `export-${finalMB}MB.jpg`;
                                  document.body.appendChild(a);
                                  a.click();
                                  document.body.removeChild(a);
                                  setTimeout(() => URL.revokeObjectURL(url), 2500);
                                } else {
                                  console.warn('Target-size export: no blob produced');
                                }
                              } catch (err) {
                                console.error('Target-size export failed:', err);
                              } finally {
                                setIsTargetExporting(false);
                              }
                            }}
                            title="Export JPEG near the target size using quality search (+ optional downscale)"
                          >
                            {isTargetExporting ? 'Exporting…' : 'Export (Target Size)'}
                          </button>

                          {lastTargetExportInfo && (
                            <span className="text-xs" style={{ opacity: 0.8 }}>
                              {lastTargetExportInfo.finalMB}MB @ q={lastTargetExportInfo.quality} ({lastTargetExportInfo.width}×{lastTargetExportInfo.height}, {lastTargetExportInfo.attempts} tries)
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          
          {uploadedImage && (
            <div className="histogram-container">
              <Histogram 
                imageUrl={
                  jpegPreview ||
                  editedImageUrl ||
                  (typeof uploadedImage === 'string' ? uploadedImage : (uploadedImage?.url || uploadedImage?.preview || null))
                } 
              />
            </div>
          )}
        </div>

        {uploadedImage && (
          <div 
            className="editor-sidebar"
            style={{ width: `${panelWidth}px` }}
          >
            <div 
              className="resize-handle"
              onMouseDown={handleResizeStart}
            />
            <div className="sidebar-content">
              <div className="sidebar-header">
                <h3>Adjustments</h3>
              </div>

              {/* Desktop/Tablet adjustments sidebar (hidden on narrow screens via CSS) */}
              <div className="adjustment-panels desktop-only">
                <CollapsibleControlPanel title="Basic Adjustments" defaultOpen={true}>
                  {/* Use the 'edits' prop name expected by the panel and defensively merge updates */}
                  <BasicAdjustmentsPanel
                    edits={adjustments}
                    onChange={(next) =>
                      setAdjustments((prev) => ({ ...prev, ...(next || {}) }))
                    }
                  />
                </CollapsibleControlPanel>
                
                <CollapsibleControlPanel title="Color Adjustments" defaultOpen={false}>
                  <ColorAdjustmentsPanel
                    colorAdjustments={colorAdjustments}
                    onChange={(next) =>
                      setColorAdjustments((prev) => ({ ...prev, ...(next || {}) }))
                    }
                  />
                </CollapsibleControlPanel>
                
                <CollapsibleControlPanel title="Sharpness & Detail" defaultOpen={false}>
                  <SharpnessPanel sharpness={sharpness} onChange={setSharpness} />
                </CollapsibleControlPanel>
                
                <CollapsibleControlPanel title="Effects & Filters" defaultOpen={false}>
                  <EffectsPanel effects={effects} onChange={setEffects} />
                </CollapsibleControlPanel>
                
                <CollapsibleControlPanel title="Geometry" defaultOpen={false}>
                  <GeometryPanel geometry={geometry} onChange={setGeometry} />
                </CollapsibleControlPanel>
                
                <CollapsibleControlPanel title="Advanced" defaultOpen={false}>
                  <AdvancedPanel advanced={advanced} onChange={setAdvanced} />
                </CollapsibleControlPanel>

                {/* White Balance Tool */}
                <CollapsibleControlPanel title="White Balance" defaultOpen={false}>
                  <WhiteBalanceTool
                    enableWbSelect={setWbSelectEnabled}
                    lastWbInfo={lastWbInfo}
                    onChange={(payload) => {
                      // Accept temp/tint updates and wbGains reset
                      if (Object.prototype.hasOwnProperty.call(payload, 'wbGains')) {
                        setWbGains(payload.wbGains);
                        if (!payload.wbGains) setLastWbInfo(null);
                      }
                      // If you want temp/tint to influence edits, merge here:
                      if (Object.prototype.hasOwnProperty.call(payload, 'temp') || Object.prototype.hasOwnProperty.call(payload, 'tint')) {
                        const temperature = typeof payload.temp === 'number' ? payload.temp : colorAdjustments.temperature;
                        const tint = typeof payload.tint === 'number' ? payload.tint : colorAdjustments.tint;
                        setColorAdjustments(prev => ({ ...prev, temperature, tint }));
                      }
                    }}
                  />
                </CollapsibleControlPanel>
                
                <CollapsibleControlPanel title="Tone Curves" defaultOpen={false}>
                  <CurvesPanel
                    curves={curves}
                    onChange={setCurves}
                  />
                </CollapsibleControlPanel>
                
                <CollapsibleControlPanel title="Presets" defaultOpen={true}>
                  <PresetSelector 
                    onPresetSelect={(preset) => {
                      const { settings } = preset;
                      setAdjustments(prev => ({...prev, ...settings}));
                      setColorAdjustments(prev => ({...prev, ...settings}));
                      setSharpness(prev => ({...prev, ...settings}));
                      setEffects(prev => ({...prev, ...settings}));
                      setGeometry(prev => ({...prev, ...settings}));
                      setAdvanced(prev => ({...prev, ...settings}));
                    }}
                  />
                  <PresetBuilder 
                    onSave={(preset) => {
                      PresetManager.savePreset(preset);
                    }}
                    currentEdits={allEdits}
                  />
                </CollapsibleControlPanel>
              </div>
            </div>
          </div>
        )}

        {/* Mobile bottom sheet for adjustments */}
        {uploadedImage && (
          <div className="mobile-only">
            <BottomSheet
              open={isMobileSheetOpen}
              onClose={() => setIsMobileSheetOpen(false)}
              initialHeight={Math.round((typeof window !== 'undefined' ? window.innerHeight : 800) * 0.5)}
              minHeight={200}
            >
              <div className="sheet-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px' }}>
                <strong>Adjustments</strong>
                <button className="header-button" onClick={() => setIsMobileSheetOpen(false)}>Close</button>
              </div>

              <div className="adjustment-panels">
                <CollapsibleControlPanel title="Basic Adjustments" defaultOpen={true}>
                  <BasicAdjustmentsPanel
                    edits={adjustments}
                    onChange={(next) =>
                      setAdjustments((prev) => ({ ...prev, ...(next || {}) }))
                    }
                  />
                </CollapsibleControlPanel>

                {/* "More tools" toggle */}
                <div style={{ padding: '4px 8px' }}>
                  <button
                    className="header-button"
                    onClick={() => setShowMoreTools((v) => !v)}
                    aria-expanded={showMoreTools}
                    aria-controls="more-tools-section"
                  >
                    {showMoreTools ? 'Hide More Tools' : 'Show More Tools'}
                  </button>
                </div>

                {showMoreTools && (
                  <div id="more-tools-section">
                    <CollapsibleControlPanel title="Color Adjustments" defaultOpen={false}>
                      <ColorAdjustmentsPanel
                        colorAdjustments={colorAdjustments}
                        onChange={(next) =>
                          setColorAdjustments((prev) => ({ ...prev, ...(next || {}) }))
                        }
                      />
                    </CollapsibleControlPanel>

                    <CollapsibleControlPanel title="Sharpness & Detail" defaultOpen={false}>
                      <SharpnessPanel sharpness={sharpness} onChange={setSharpness} />
                    </CollapsibleControlPanel>

                    <CollapsibleControlPanel title="Effects & Filters" defaultOpen={false}>
                      <EffectsPanel effects={effects} onChange={setEffects} />
                    </CollapsibleControlPanel>

                    <CollapsibleControlPanel title="Geometry" defaultOpen={false}>
                      <GeometryPanel geometry={geometry} onChange={setGeometry} />
                    </CollapsibleControlPanel>

                    <CollapsibleControlPanel title="Advanced" defaultOpen={false}>
                      <AdvancedPanel advanced={advanced} onChange={setAdvanced} />
                    </CollapsibleControlPanel>

                    <CollapsibleControlPanel title="White Balance" defaultOpen={false}>
                      <WhiteBalanceTool
                        enableWbSelect={setWbSelectEnabled}
                        lastWbInfo={lastWbInfo}
                        onChange={(payload) => {
                          if (Object.prototype.hasOwnProperty.call(payload, 'wbGains')) {
                            setWbGains(payload.wbGains);
                            if (!payload.wbGains) setLastWbInfo(null);
                          }
                          if (Object.prototype.hasOwnProperty.call(payload, 'temp') || Object.prototype.hasOwnProperty.call(payload, 'tint')) {
                            const temperature = typeof payload.temp === 'number' ? payload.temp : colorAdjustments.temperature;
                            const tint = typeof payload.tint === 'number' ? payload.tint : colorAdjustments.tint;
                            setColorAdjustments(prev => ({ ...prev, temperature, tint }));
                          }
                        }}
                      />
                    </CollapsibleControlPanel>

                    <CollapsibleControlPanel title="Tone Curves" defaultOpen={false}>
                      <CurvesPanel
                        curves={curves}
                        onChange={setCurves}
                      />
                    </CollapsibleControlPanel>

                    <CollapsibleControlPanel title="Presets" defaultOpen={false}>
                      <PresetSelector 
                        onPresetSelect={(preset) => {
                          const { settings } = preset;
                          setAdjustments(prev => ({...prev, ...settings}));
                          setColorAdjustments(prev => ({...prev, ...settings}));
                          setSharpness(prev => ({...prev, ...settings}));
                          setEffects(prev => ({...prev, ...settings}));
                          setGeometry(prev => ({...prev, ...settings}));
                          setAdvanced(prev => ({...prev, ...settings}));
                        }}
                      />
                      <PresetBuilder 
                        onSave={(preset) => {
                          PresetManager.savePreset(preset);
                        }}
                        currentEdits={allEdits}
                      />
                    </CollapsibleControlPanel>
                  </div>
                )}
              </div>
            </BottomSheet>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorPage;
