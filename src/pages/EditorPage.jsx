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
  // Add state for toggling previews
  const [showOriginal, setShowOriginal] = useState(true);
  const [showEdited, setShowEdited] = useState(true);

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
      // Create a temporary canvas to apply edits
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      
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
      
      // Set canvas dimensions
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw the original image
      ctx.drawImage(img, 0, 0);
      
      // Apply edits directly to the canvas
      // This is a simplified version - in a real app, you'd use the same
      // filter functions from EnhancedImageCanvas
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Apply basic adjustments (simplified for demo)
      const allEdits = {
        ...adjustments,
        ...colorAdjustments,
        ...sharpness,
        ...effects,
        ...geometry,
        ...advanced
      };
      
      // Simple brightness/contrast adjustment for demo
      if (allEdits.exposure !== 0 || allEdits.contrast !== 0) {
        const exposureFactor = Math.pow(2, allEdits.exposure);
        const contrastFactor = 1 + (allEdits.contrast / 100);
        
        for (let i = 0; i < data.length; i += 4) {
          // Apply exposure
          data[i] = Math.min(255, data[i] * exposureFactor);     // R
          data[i + 1] = Math.min(255, data[i + 1] * exposureFactor); // G
          data[i + 2] = Math.min(255, data[i + 2] * exposureFactor); // B
          
          // Apply contrast
          data[i] = Math.min(255, ((data[i] / 255 - 0.5) * contrastFactor + 0.5) * 255);
          data[i + 1] = Math.min(255, ((data[i + 1] / 255 - 0.5) * contrastFactor + 0.5) * 255);
          data[i + 2] = Math.min(255, ((data[i + 2] / 255 - 0.5) * contrastFactor + 0.5) * 255);
        }
      }
      
      // Put the modified image data back
      ctx.putImageData(imageData, 0, 0);
      
      // Create download link
      const downloadUrl = canvas.toDataURL('image/jpeg', 0.9);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'edited_image.jpg';
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
            <button 
              onClick={() => {
                setUploadedImage(null);
                setJpegPreview(null);
              }}
              className="toolbar-btn upload-btn ml-2"
              title="Upload New Image"
            >
              📁 Upload
            </button>
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
              <button className="toolbar-btn" title="Pan Left">←</button>
              <button className="toolbar-btn" title="Pan Right">→</button>
              <button className="toolbar-btn" title="Pan Up">↑</button>
              <button className="toolbar-btn" title="Pan Down">↓</button>
              {/* Zoom Controls */}
              <button className="toolbar-btn" title="Zoom In">+</button>
              <button className="toolbar-btn" title="Zoom Out">-</button>
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

      {/* Second line: Edit and Save buttons */}
      {uploadedImage && (
        <div className="editor-toolbar-secondary flex flex-row items-center gap-4 mb-2">
          <button className="toolbar-btn" title="Edit">✏️ Edit</button>
          <button className="toolbar-btn" onClick={downloadJpeg} title="Save">💾 Save</button>
        </div>
      )}

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
          <div className="image-display-area flex flex-row gap-4">
            {/* Image Previews with toggle buttons */}
            <div className="image-preview-tile relative flex-1 flex items-center justify-center">
              {/* Show/Minimize Original Button as overlay */}
              <button 
                className="toggle-preview-btn absolute top-2 left-2 z-10 bg-black/70 text-white rounded-full px-3 py-1 text-xs shadow-lg"
                onClick={() => setShowOriginal(prev => !prev)}
                title={showOriginal ? 'Minimize Original' : 'Show Original'}
              >
                {showOriginal ? 'Minimize Original' : 'Show Original'}
              </button>
              {showOriginal && uploadedImage && (
                <img
                  src={typeof uploadedImage === 'string' ? uploadedImage : uploadedImage.url}
                  alt="Original Preview"
                  className="max-w-full max-h-[400px] rounded shadow"
                />
              )}
            </div>
            <div className="image-preview-tile relative flex-1 flex items-center justify-center">
              {/* Show/Minimize Edited Button as overlay */}
              <button 
                className="toggle-preview-btn absolute top-2 left-2 z-10 bg-black/70 text-white rounded-full px-3 py-1 text-xs shadow-lg"
                onClick={() => setShowEdited(prev => !prev)}
                title={showEdited ? 'Minimize Edited' : 'Show Edited'}
              >
                {showEdited ? 'Minimize Edited' : 'Show Edited'}
              </button>
              {showEdited && (
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
                />
              )}
            </div>
            {/* Collapsible Side Panel for Advanced Controls */}
            <div className="side-controls-panel collapsed">
              <button className="panel-toggle" onClick={() => {
                const panel = document.querySelector('.side-controls-panel');
                panel.classList.toggle('collapsed');
              }}>
                ⚙️
              </button>
              <div className="panel-content">
                <CollapsibleControlPanel title="Basic Adjustments" defaultOpen={false}>
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
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorPage;
