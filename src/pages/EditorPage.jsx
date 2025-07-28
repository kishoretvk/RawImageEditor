import React, { useState, useEffect } from 'react';
import { convertRawToJpeg } from '../utils/imageProcessing';
import { isRawFile } from '../utils/rawFileDetector';
import Histogram from '../components/Histogram';
import { Link } from 'react-router-dom';
import '../styles/pages.css';
import '../styles/modern-enhancements.css';
import '../styles/lightroom-theme.css';
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

  // Update edited image when adjustments change
  useEffect(() => {
    if (uploadedImage) {
      // In a real app, this would apply the edits and generate a new image URL
      // For now, we'll just use the original image but trigger histogram updates
      // Handle both old format (string) and new format (object)
      const imageUrl = typeof uploadedImage === 'string' ? uploadedImage : uploadedImage.url;
      setEditedImageUrl(imageUrl);
    }
  }, [uploadedImage, adjustments, colorAdjustments, sharpness, effects, geometry, advanced]);

  // Handle file upload and RAW-to-JPEG preview for histogram
  const handleFileUpload = async (file) => {
    setUploadedImage(file);
    if (file && file.filename && isRawFile(file.filename)) {
      try {
        const jpegResult = await convertRawToJpeg(file);
        setJpegPreview(jpegResult.preview);
      } catch (e) {
        setJpegPreview(null);
      }
    } else {
      setJpegPreview(file.url || file.preview);
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

  const onCrop = (cropData) => {
    console.log('Crop action triggered', cropData);
  };

  const onWhiteBalance = (whiteBalanceData) => {
    console.log('White balance action triggered', whiteBalanceData);
  };

  const onReset = () => {
    console.log('Reset action triggered');
    handleReset();
  };

  // Image control functions
  const handlePanLeft = () => setPan(prev => ({ ...prev, x: prev.x - 20 }));
  const handlePanRight = () => setPan(prev => ({ ...prev, x: prev.x + 20 }));
  const handlePanUp = () => setPan(prev => ({ ...prev, y: prev.y - 20 }));
  const handlePanDown = () => setPan(prev => ({ ...prev, y: prev.y + 20 }));
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.1));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Panel resize functions
  const handleMouseDown = (e) => {
    setIsResizing(true);
    document.body.classList.add('resizing');
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isResizing) return;
    
    const newWidth = window.innerWidth - e.clientX;
    // Set minimum and maximum panel width
    const minWidth = 250;
    const maxWidth = Math.min(600, window.innerWidth * 0.6);
    
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setPanelWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    document.body.classList.remove('resizing');
  };

  // Add global event listeners for resize
  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.classList.remove('resizing');
    };
  }, []);

  // Download handlers
  const downloadRaw = () => {
    if (!uploadedImage) return;
    
    // Handle both old format (string) and new format (object)
    const imageUrl = typeof uploadedImage === 'string' ? uploadedImage : uploadedImage.url;
    const filename = typeof uploadedImage === 'string' ? 'image_raw.jpg' : uploadedImage.filename || 'image_raw.jpg';
    
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const downloadJpeg = async () => {
    if (!uploadedImage) return;
    
    setIsExporting(true);
    
    try {
      // Create export canvas
      const exportCanvas = document.createElement('canvas');
      const exportCtx = exportCanvas.getContext('2d', { willReadFrequently: true });
      
      // Load the original image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      // Handle both old format (string) and new format (object)
      const imageUrl = typeof uploadedImage === 'string' ? uploadedImage : uploadedImage.url;
      img.src = imageUrl;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      
      // Set canvas dimensions to match original image
      exportCanvas.width = img.width;
      exportCanvas.height = img.height;
      
      // Enable high-quality rendering
      exportCtx.imageSmoothingEnabled = true;
      exportCtx.imageSmoothingQuality = 'high';
      
      // Draw the original image
      exportCtx.drawImage(img, 0, 0);
      
      // Apply professional filters using the same function as EnhancedImageCanvas
      const allEdits = {
        ...adjustments,
        ...colorAdjustments,
        ...sharpness,
        ...effects,
        ...geometry,
        ...advanced
      };
      
      // Import the applyProfessionalFilters function
      const { applyProfessionalFilters } = await import('../components/EnhancedImageCanvas');
      applyProfessionalFilters(exportCtx, img, allEdits);
      
      // Create download link with higher quality
      const downloadUrl = exportCanvas.toDataURL('image/jpeg', 0.95);
      const a = document.createElement('a');
      a.href = downloadUrl;
      
      // Generate filename based on original file
      let filename = 'edited_image.jpg';
      if (uploadedImage.filename || uploadedImage.name) {
        const originalName = uploadedImage.filename || uploadedImage.name;
        const nameWithoutExt = originalName.split('.').slice(0, -1).join('.');
        filename = `${nameWithoutExt}_edited.jpg`;
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Helper: is uploadedImage truly empty?
  const isImageEmpty =
    !uploadedImage ||
    (typeof uploadedImage === 'object' && Object.keys(uploadedImage).length === 0) ||
    (typeof uploadedImage === 'string' && uploadedImage.trim() === '');

  return (
    <div className="editor-page">
      {/* Always show Reset Editor button at the top */}
      <div style={{background:'#222',color:'#fff',padding:'6px 12px',fontSize:'12px',marginBottom:'8px',borderRadius:'6px',maxWidth:'600px'}}>
        <b>Debug Info:</b> uploadedImage = {JSON.stringify(uploadedImage)}
        <button style={{marginLeft:'16px',padding:'2px 8px',fontSize:'12px',borderRadius:'4px',background:'#4a9eff',color:'#fff',border:'none',cursor:'pointer'}} onClick={()=>{setUploadedImage(null);setJpegPreview(null);}}>Reset Editor</button>
      </div>
      {/* Header */}
      <header className="editor-header flex items-center justify-between">
        <div className="header-left flex items-center gap-4">
          <Link to="/" className="back-link">← Back to Home</Link>
          <h1 className="editor-title">Edit Photo</h1>
          {/* Always show uploader when no image is uploaded */}
          {!uploadedImage && (
            <FileUploader 
              onFileUpload={handleFileUpload}
              className="header-uploader"
            />
          )}
          {uploadedImage && (
            <>
              <button 
                onClick={() => {
                  setUploadedImage(null);
                  setJpegPreview(null);
                }}
                className="toolbar-btn upload-btn"
                title="Upload New Image"
              >
                📁 Upload
              </button>
              <div className="toolbar-divider"></div>
              <button className="toolbar-btn" title="Edit">✏️ Edit</button>
              <button className="toolbar-btn" onClick={downloadJpeg} title="Save">💾 Save</button>
              <div className="toolbar-divider"></div>
              <button 
                className={`toolbar-btn ${showSidePanel ? 'active' : ''}`}
                onClick={() => setShowSidePanel(!showSidePanel)}
                title="Toggle Edit Panel"
              >
                ⚙️ Adjustments
              </button>
            </>
          )}
        </div>
        <div className="header-right">
          {/* Reserved for future actions */}
        </div>
      </header>

      {/* Single-line Toolbar - Always visible */}
      <div className="editor-toolbar flex flex-row items-center gap-4">
        {uploadedImage ? (
          <>
            {/* Pan & Zoom Controls + Undo/Redo in one line */}
            <div className="toolbar-section flex flex-row items-center gap-2">
              <button className="toolbar-btn" onClick={handlePanLeft} title="Pan Left">←</button>
              <button className="toolbar-btn" onClick={handlePanRight} title="Pan Right">→</button>
              <button className="toolbar-btn" onClick={handlePanUp} title="Pan Up">↑</button>
              <button className="toolbar-btn" onClick={handlePanDown} title="Pan Down">↓</button>
              {/* Zoom Controls */}
              <button className="toolbar-btn" onClick={handleZoomIn} title="Zoom In">+</button>
              <button className="toolbar-btn" onClick={handleZoomOut} title="Zoom Out">-</button>
              <button className="toolbar-btn" onClick={handleResetView} title="Reset View">⌂</button>
              <div className="toolbar-divider"></div>
              <button className="toolbar-btn" onClick={onUndo} title="Undo">Undo</button>
              <button className="toolbar-btn" onClick={onRedo} title="Redo">Redo</button>
            </div>
            <div className="toolbar-divider"></div>
            {/* Tools */}
            <div className="toolbar-section flex flex-row items-center gap-2">
              <button className="toolbar-btn" title="EXIF Metadata">EXIF</button>
            </div>
            <div className="toolbar-divider"></div>
            {/* Quick Actions */}
            <div className="toolbar-section flex flex-row items-center gap-2">
              <button onClick={handleReset} className="toolbar-btn" title="Reset All">🔄 Reset</button>
              <button onClick={downloadRaw} className="toolbar-btn" title="Download RAW">📥 RAW</button>
              <button onClick={downloadJpeg} className="toolbar-btn" title="Download JPEG">📥 JPEG</button>
            </div>
            <div className="toolbar-spacer"></div>
          </>
        ) : (
          <>
            <div className="toolbar-section">
              <span className="toolbar-text">Ready to edit your images</span>
            </div>
            <div className="toolbar-spacer"></div>
            <div className="toolbar-section">
              <FileUploader 
                onFileUpload={handleFileUpload}
                className="toolbar-uploader"
              />
            </div>
          </>
        )}
      </div>

      {/* Main Content Area */}
      <div className="editor-main-content">
        {isImageEmpty ? (
          <div className="editor-upload-container flex flex-col items-center justify-center min-h-[400px]">
            <FileUploader 
              onFileUpload={handleFileUpload}
              className="header-uploader"
            />
            <div style={{color:'#fff',marginTop:'16px',fontSize:'14px'}}>If you do not see the upload button, click <b>Reset Editor</b> above or reload the page.</div>
          </div>
        ) : (
          <div className="main-editor-content">
            {/* Full-width Image Editor */}
            <div className="image-preview-container full-width-only">
              <div className="image-preview-tile edited-preview full-width">
                <EnhancedImageCanvas 
                  imageSrc={uploadedImage} 
                  edits={{
                    ...adjustments,
                    ...colorAdjustments,
                    ...sharpness,
                    ...effects,
                    ...geometry,
                    ...advanced
                  }} 
                  showSlider={true}
                  sliderPosition={sliderPosition}
                  onSliderChange={setSliderPosition}
                  hideControls={true}
                  hideFullscreen={false}
                />
              </div>
              <div className="slider-control-container">
                <UnifiedSlider
                  min={0}
                  max={100}
                  value={sliderPosition}
                  onChange={setSliderPosition}
                  label="Before/After Comparison"
                />
              </div>
            </div>
            
            {/* Overlay Side Panel - Only show when toggled */}
            {showSidePanel && (
              <div 
                className="side-controls-panel overlay resizable"
                style={{ width: `${panelWidth}px` }}
              >
                <div 
                  className="resize-handle"
                  onMouseDown={handleMouseDown}
                  title="Drag to resize panel"
                />
                <button 
                  className="panel-close" 
                  onClick={() => setShowSidePanel(false)}
                  title="Close Panel"
                >
                  ✕
                </button>
                <div className="panel-content">
                  <h3 className="panel-title">Edit Controls</h3>
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
                    <CurvesPanel />
                  </CollapsibleControlPanel>
                  <CollapsibleControlPanel title="Presets" defaultOpen={false}>
                    <PresetManager 
                      onApplyPreset={(presetSettings) => {
                        setAdjustments(prev => ({...prev, ...presetSettings}));
                        setColorAdjustments(prev => ({...prev, ...presetSettings}));
                        setSharpness(prev => ({...prev, ...presetSettings}));
                        setEffects(prev => ({...prev, ...presetSettings}));
                        setGeometry(prev => ({...prev, ...presetSettings}));
                        setAdvanced(prev => ({...prev, ...presetSettings}));
                      }}
                      currentEdits={{
                        ...adjustments,
                        ...colorAdjustments,
                        ...sharpness,
                        ...effects,
                        ...geometry,
                        ...advanced
                      }}
                    />
                  </CollapsibleControlPanel>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorPage;
