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

/* Lightweight bottom control bar inside this file to avoid adding new files */
function BottomControlBar({ onOpenAdjustments, onOpenActions, onOpenTools }) {
  return (
    <div
      className="bottom-control-bar mobile-only"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 65,
        display: 'flex',
        gap: '8px',
        justifyContent: 'space-around',
        padding: '10px',
        background: 'rgba(20,20,20,0.95)',
        borderTop: '1px solid #2f2f2f',
        backdropFilter: 'blur(8px)'
      }}
    >
      <button className="header-button" onClick={onOpenAdjustments} aria-label="Open Adjustments">Adjustments</button>
      <button className="header-button" onClick={onOpenActions} aria-label="Open Actions">Actions</button>
      <button className="header-button" onClick={onOpenTools} aria-label="Open Tools">Tools</button>
    </div>
  );
}

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

  // Action/Tools sheets
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);

  // Auto-hide header on scroll (maximize preview real estate)
  const lastScrollYRef = useRef(0);
  const [headerHidden, setHeaderHidden] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY || 0;
      const delta = y - lastScrollYRef.current;
      if (Math.abs(delta) > 4) {
        setHeaderHidden(delta > 0);
        lastScrollYRef.current = y;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
      {/* Ultra-compact header: collapsible menu on the left, title hidden on mobile to reclaim space */}
      <div className={`editor-header auto-hide-header`}>
        <div className="header-left" style={{ gap: '0.5rem' }}>
          {/* Collapsible menu button replacing the Back link */}
          <details style={{ position: 'relative' }}>
            <summary
              className="header-button"
              style={{
                listStyle: 'none',
                cursor: 'pointer',
                userSelect: 'none',
                padding: '0.35rem 0.6rem',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.10)',
                boxShadow: '0 6px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.06)'
              }}
              aria-label="Open menu"
            >
              ☰
            </summary>
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                left: 0,
                background: 'rgba(31,31,31,0.98)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 14,
                minWidth: 280,
                zIndex: 1000,
                padding: 10,
                boxShadow: '0 18px 48px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
                backdropFilter: 'blur(8px)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Caret */}
              <div style={{
                position: 'absolute',
                top: -8,
                left: 16,
                width: 16,
                height: 16,
                background: 'rgba(31,31,31,0.98)',
                borderLeft: '1px solid rgba(255,255,255,0.08)',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                transform: 'rotate(45deg)'
              }} />
              {/* Grid menu */}
              <nav
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 10,
                  alignItems: 'stretch'
                }}
              >
                <Link
                  to="/"
                  className="header-button"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 44,
                    borderRadius: 12,
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  ← Back to Home
                </Link>
                <button
                  className="header-button"
                  style={{ height: 44, borderRadius: 12 }}
                  onClick={onUndo}
                >
                  Undo
                </button>
                <button
                  className="header-button"
                  style={{ height: 44, borderRadius: 12 }}
                  onClick={onRedo}
                >
                  Redo
                </button>
                <button
                  className="header-button"
                  style={{ height: 44, borderRadius: 12 }}
                  onClick={handleReset}
                >
                  Reset
                </button>
                <button
                  className="header-button primary"
                  style={{ height: 44, borderRadius: 12, gridColumn: '1 / -1' }}
                  onClick={handleExport}
                  disabled={!uploadedImage || isExporting}
                >
                  {isExporting ? 'Exporting...' : 'Export'}
                </button>
              </nav>
            </div>
          </details>

          {/* Title shown on desktop only to free space on mobile */}
          <h1 className="desktop-only">RAW Image Editor</h1>
        </div>

        {/* Desktop actions remain on the right; hidden on mobile */}
        <div className="header-right desktop-only">
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
        {/* Remove extra mobile toolbar row to reclaim vertical space */}
        <div className="mobile-toolbar" style={{ display: 'none' }} />
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
                {/* Removed canvas overlay controls for a clean, professional preview area */}
                {/* All controls moved to bottom sheets and bottom control bar */}
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

        {/* Mobile bottom sheets */}
        {uploadedImage && (
          <div className="mobile-only">
            {/* Adjustments Sheet */}
            <BottomSheet
              open={isMobileSheetOpen}
              onClose={() => setIsMobileSheetOpen(false)}
              // Default to 25% viewport to keep most of the image visible; user can drag to resize
              initialHeight={Math.round((typeof window !== 'undefined' ? window.innerHeight : 800) * 0.25)}
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

            {/* Actions Sheet: export / target size / split channels */}
            <BottomSheet
              open={isActionsOpen}
              onClose={() => setIsActionsOpen(false)}
              initialHeight={Math.round((typeof window !== 'undefined' ? window.innerHeight : 800) * 0.25)}
              minHeight={200}
            >
              <div className="sheet-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px' }}>
                <strong>Actions</strong>
                <button className="header-button" onClick={() => setIsActionsOpen(false)}>Close</button>
              </div>

              <div className="panel-content">
                <div className="button-group">
                  <button className="header-button" onClick={handleExport} disabled={!uploadedImage || isExporting}>
                    {isExporting ? 'Exporting…' : 'Export Current'}
                  </button>
                </div>

                {/* Target-size export quick controls */}
                <div className="export-settings" style={{ marginTop: '12px' }}>
                  <h4>Export at Target Size</h4>
                  <div className="export-row">
                    <label>Size (MB)</label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={targetSizeMB}
                      onChange={(e) => setTargetSizeMB(Math.max(0.1, Number(e.target.value) || 0.1))}
                    />
                    <label>Tolerance %</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      step="1"
                      value={sizeTolerancePct}
                      onChange={(e) => setSizeTolerancePct(Math.max(1, Math.min(20, Number(e.target.value) || 5)))}
                    />
                    <label>Downscale</label>
                    <input
                      type="checkbox"
                      checked={allowDownscale}
                      onChange={(e) => setAllowDownscale(e.target.checked)}
                    />
                  </div>
                  <div className="button-group">
                    <button
                      className="header-button primary"
                      disabled={isTargetExporting || !editedImageUrl}
                      onClick={async () => {
                        // trigger the same logic we wired earlier in the canvas overlay removal,
                        // by opening the adjustments (already removed overlay), here just simulate a click path:
                        try {
                          const evt = new Event('target-size-export');
                          window.dispatchEvent(evt);
                        } catch {}
                      }}
                    >
                      Export (Target Size)
                    </button>
                  </div>
                  {lastTargetExportInfo && (
                    <div style={{ marginTop: '8px', fontSize: '0.8rem', opacity: 0.85 }}>
                      {lastTargetExportInfo.finalMB}MB @ q={lastTargetExportInfo.quality} ({lastTargetExportInfo.width}×{lastTargetExportInfo.height}, {lastTargetExportInfo.attempts} tries)
                    </div>
                  )}
                </div>

                {/* Split channels quick action */}
                <div className="export-settings" style={{ marginTop: '12px' }}>
                  <h4>Split Channels</h4>
                  <div className="export-row">
                    <label>Source</label>
                    <select
                      value={channelSource}
                      onChange={(e) => setChannelSource(e.target.value)}
                      disabled={isExtractingChannels}
                    >
                      <option value="processed">Adjusted</option>
                      <option value="original">Original</option>
                    </select>
                    <button
                      className="header-button"
                      disabled={isExtractingChannels}
                      onClick={() => {
                        if (isExtractingChannels) return;
                        setIsExtractingChannels(true);
                        setExtractHandlerKey((k) => k + 1);
                      }}
                    >
                      {isExtractingChannels ? 'Extracting…' : 'Export R/G/B (PNG)'}
                    </button>
                  </div>
                </div>
              </div>
            </BottomSheet>

            {/* Tools Sheet: toggles for tools like WB Region, Crop */}
            <BottomSheet
              open={isToolsOpen}
              onClose={() => setIsToolsOpen(false)}
              initialHeight={Math.round((typeof window !== 'undefined' ? window.innerHeight : 800) * 0.25)}
              minHeight={200}
            >
              <div className="sheet-header-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px' }}>
                <strong>Tools</strong>
                <button className="header-button" onClick={() => setIsToolsOpen(false)}>Close</button>
              </div>

              <div className="panel-content">
                <div className="export-row">
                  <label>WB Region Select</label>
                  <button
                    className={`header-button ${wbSelectEnabled ? 'primary' : ''}`}
                    onClick={() => setWbSelectEnabled((v) => !v)}
                  >
                    {wbSelectEnabled ? 'Enabled' : 'Enable'}
                  </button>
                </div>

                {lastWbInfo && (
                  <div style={{ fontSize: '0.8rem', opacity: 0.85, marginTop: '6px' }}>
                    Avg RGB: ({Math.round(lastWbInfo.avgR || 0)}, {Math.round(lastWbInfo.avgG || 0)}, {Math.round(lastWbInfo.avgB || 0)}) |
                    Gains: R {lastWbInfo.rGain?.toFixed(2)}, G {lastWbInfo.gGain?.toFixed(2)}, B {lastWbInfo.bGain?.toFixed(2)}
                    <div>
                      <button className="header-button" style={{ marginTop: '6px' }} onClick={() => { setWbGains(null); setLastWbInfo(null); }}>
                        Reset WB Gains
                      </button>
                    </div>
                  </div>
                )}

                {/* Placeholder for future tools like Crop/Lens Correction */}
                <div className="export-settings" style={{ marginTop: '12px' }}>
                  <h4>More Tools</h4>
                  <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>Additional tools can be toggled here.</div>
                </div>
              </div>
            </BottomSheet>

            {/* Persistent bottom bar to open sheets */}
            <BottomControlBar
              onOpenAdjustments={() => setIsMobileSheetOpen(true)}
              onOpenActions={() => setIsActionsOpen(true)}
              onOpenTools={() => setIsToolsOpen(true)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorPage;
