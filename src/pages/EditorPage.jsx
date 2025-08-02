import React, { useState, useEffect, useRef } from 'react';
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
  useEffect(() => {
    if (uploadedImage) {
      // Handle both old format (string) and new format (object)
      const imageUrl = typeof uploadedImage === 'string' ? uploadedImage : uploadedImage.url;
      setEditedImageUrl(imageUrl);
    }
  }, [uploadedImage, adjustments, colorAdjustments, sharpness, effects, geometry, advanced]);

  // Handle file upload and RAW-to-JPEG preview for histogram
  const handleFileUpload = async (file) => {
    try {
      setUploadedImage(file);
      setIsLoading(true);

      // Normalize file info
      const fileName = file?.name || file?.filename || '';
      const knownUrl = file?.url || file?.preview || null;

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

      // Always show something instantly if we can
      if (instantUrl) {
        setEditedImageUrl(instantUrl);
      }

      const isRaw = isRawFile(fileName);

      if (!isRaw) {
        // For JPEG/PNG: use instant URL for histogram too
        if (instantUrl) setJpegPreview(instantUrl);
        setIsLoading(false);
        return;
      }

      // RAW path: keep instant URL visible, then ask worker for better preview
      try {
        console.debug('[EditorPage] sending to worker convertRawToJpeg');

        // Watchdog timeout so UI never hangs if worker channel breaks
        const timeoutMs = 2000;
        const timeoutPromise = new Promise((resolve) => {
          setTimeout(() => resolve({ preview: instantUrl, status: 'timeout' }), timeoutMs);
        });

        // Race worker vs timeout
        const workerPromise = convertRawToJpeg({
          name: fileName,
          preview: instantUrl
        });

        const jpegResult = await Promise.race([workerPromise, timeoutPromise]);

        console.debug('[EditorPage] worker/timeout returned', jpegResult);

        if (jpegResult?.preview) {
          setJpegPreview(jpegResult.preview);
        } else if (instantUrl) {
          // Fallback: still show instantUrl if worker gave nothing
          setJpegPreview(instantUrl);
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
      // In a real app, this would process the image with all edits
      const imageUrl = typeof uploadedImage === 'string' ? uploadedImage : uploadedImage.url;
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
                  <CurvesPanel isActive={true} />
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
