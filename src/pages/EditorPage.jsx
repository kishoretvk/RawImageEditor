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
import ImageCanvas from '../components/ImageCanvas';
import EditorLayout from '../components/EditorLayout';

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
    exposure: 1,
    contrast: 1,
    highlights: 1,
    shadows: 1,
    whites: 1,
    blacks: 1,
    gamma: 1,
  });
  const [colorAdjustments, setColorAdjustments] = useState({
    temperature: 5500,
    tint: 0,
    hue: 0,
    saturation: 1,
  });
  const [sharpness, setSharpness] = useState({
    amount: 1,
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
  const [showPreview, setShowPreview] = useState(true);
  const [editedImageUrl, setEditedImageUrl] = useState(null);

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
      exposure: 1,
      contrast: 1,
      highlights: 1,
      shadows: 1,
      whites: 1,
      blacks: 1,
      gamma: 1,
    });
    setColorAdjustments({
      temperature: 5500,
      tint: 0,
      hue: 0,
      saturation: 1,
    });
    setSharpness({
      amount: 1,
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
    if (!editedImageUrl) return;
    
    // In a real app, this would export the edited image
    const a = document.createElement('a');
    a.href = editedImageUrl;
    a.download = 'image_edited.jpg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <EditorLayout
      currentImage={editedImageUrl || (typeof uploadedImage === 'string' ? uploadedImage : uploadedImage?.url)}
      controls={uploadedImage && (
            <div className="controls-container" style={{ maxHeight: '90vh', overflowY: 'auto', paddingRight: 8 }}>
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

          <CollapsibleControlPanel title="Quick Actions" defaultOpen={true} style={{ marginBottom: 16 }}>
            <div className="quick-actions">
              <button onClick={handleReset} className="btn btn-warning btn-block">
                🔄 Reset All
              </button>
              <button onClick={downloadRaw} className="btn btn-primary btn-block">
                📥 Download RAW
              </button>
              <button onClick={downloadJpeg} className="btn btn-success btn-block">
                📥 Download JPEG
              </button>
            </div>
          </CollapsibleControlPanel>
        </div>
      )}
    >
      {!uploadedImage ? (
        <div className="upload-area">
          <FileUploader onFileUpload={handleFileUpload} />
        </div>
      ) : (
        <div className="image-workspace">
          {/* Show histogram for the current image (JPEG preview for RAW) */}
          {/* Only show one histogram per image, and always use the correct preview */}
          {jpegPreview && <Histogram imageUrl={jpegPreview} />}
          {showPreview ? (
            <div className="image-comparison">
              <div className="comparison-container">
                <div className="image-section">
                  <div className="image-label">Original</div>
                  <ImageCanvas imageSrc={jpegPreview} edits={{}} />
                </div>
                <div className="image-section">
                  <div className="image-label">Edited</div>
                  <ImageCanvas 
                    imageSrc={jpegPreview} 
                    edits={{
                      ...adjustments,
                      ...colorAdjustments,
                      ...sharpness,
                      ...effects,
                      ...geometry,
                      ...advanced
                    }} 
                  />
                </div>
              </div>
              <div className="preview-controls">
                <button 
                  onClick={() => setShowPreview(false)}
                  className="btn btn-secondary"
                >
                  👁️ Single View
                </button>
              </div>
            </div>
          ) : (
            <div className="single-image-view">
              <ImageCanvas 
                imageSrc={jpegPreview} 
                edits={{
                  ...adjustments,
                  ...colorAdjustments,
                  ...sharpness,
                  ...effects,
                  ...geometry,
                  ...advanced
                }} 
              />
              <div className="preview-controls">
                <button 
                  onClick={() => setShowPreview(true)}
                  className="btn btn-secondary"
                >
                  👁️ Compare View
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </EditorLayout>
  );
};

export default EditorPage;
