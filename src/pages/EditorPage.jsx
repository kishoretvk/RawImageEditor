import React, { useState, useEffect, useRef, useMemo } from 'react';
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
        <div className="editor-main">
          <div className="canvas-container">
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
              
              <div className="adjustment-panels">
                <CollapsibleControlPanel title="Basic Adjustments" defaultOpen={true}>
                  <BasicAdjustmentsPanel adjustments={adjustments} onChange={setAdjustments} />
                </CollapsibleControlPanel>
                
                <CollapsibleControlPanel title="Color Adjustments" defaultOpen={false}>
                  <ColorAdjustmentsPanel colorAdjustments={colorAdjustments} onChange={setColorAdjustments} />
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
      </div>
    </div>
  );
};

export default EditorPage;
