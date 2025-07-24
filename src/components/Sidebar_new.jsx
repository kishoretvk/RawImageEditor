import React from 'react';
import '../styles/Sidebar.css';

const Sidebar = ({ isCollapsed, edits, onEditChange, imageInfo }) => {
  // Handle slider change
  const handleSliderChange = (editName, event) => {
    onEditChange(editName, parseFloat(event.target.value));
  };

  // Handle checkbox change
  const handleCheckboxChange = (editName, event) => {
    onEditChange(editName, event.target.checked);
  };

  // Reset all edits
  const handleResetAll = () => {
    Object.keys(edits).forEach(edit => {
      onEditChange(edit, 0);
    });
  };

  // Format slider value for display
  const formatValue = (value, suffix = '') => {
    return `${Math.round(value * 100) / 100}${suffix}`;
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <h3>Professional Adjustments</h3>
        <button className="reset-button" onClick={handleResetAll}>Reset All</button>
      </div>

      {/* Image info */}
      {imageInfo && (
        <div className="image-info-section">
          <h4>Image Info</h4>
          <div className="image-info">
            <div className="info-item">
              <span className="info-label">Dimensions:</span>
              <span className="info-value">{imageInfo.width} × {imageInfo.height}</span>
            </div>
          </div>
        </div>
      )}

      {/* Basic Tone Adjustments */}
      <div className="adjustment-section">
        <h4>Basic</h4>
        
        <div className="adjustment-item">
          <label>
            <span className="adjustment-label">Exposure</span>
            <input 
              type="range"
              min="-3"
              max="3"
              step="0.1"
              value={edits.exposure || 0}
              onChange={e => handleSliderChange('exposure', e)}
            />
            <span className="adjustment-value">{formatValue(edits.exposure || 0, ' EV')}</span>
          </label>
        </div>
        
        <div className="adjustment-item">
          <label>
            <span className="adjustment-label">Highlights</span>
            <input 
              type="range"
              min="-100"
              max="100"
              step="1"
              value={edits.highlights || 0}
              onChange={e => handleSliderChange('highlights', e)}
            />
            <span className="adjustment-value">{formatValue(edits.highlights || 0)}</span>
          </label>
        </div>
        
        <div className="adjustment-item">
          <label>
            <span className="adjustment-label">Shadows</span>
            <input 
              type="range"
              min="-100"
              max="100"
              step="1"
              value={edits.shadows || 0}
              onChange={e => handleSliderChange('shadows', e)}
            />
            <span className="adjustment-value">{formatValue(edits.shadows || 0)}</span>
          </label>
        </div>
        
        <div className="adjustment-item">
          <label>
            <span className="adjustment-label">Whites</span>
            <input 
              type="range"
              min="-100"
              max="100"
              step="1"
              value={edits.whites || 0}
              onChange={e => handleSliderChange('whites', e)}
            />
            <span className="adjustment-value">{formatValue(edits.whites || 0)}</span>
          </label>
        </div>
        
        <div className="adjustment-item">
          <label>
            <span className="adjustment-label">Blacks</span>
            <input 
              type="range"
              min="-100"
              max="100"
              step="1"
              value={edits.blacks || 0}
              onChange={e => handleSliderChange('blacks', e)}
            />
            <span className="adjustment-value">{formatValue(edits.blacks || 0)}</span>
          </label>
        </div>
        
        <div className="adjustment-item">
          <label>
            <span className="adjustment-label">Contrast</span>
            <input 
              type="range"
              min="-100"
              max="100"
              step="1"
              value={edits.contrast || 0}
              onChange={e => handleSliderChange('contrast', e)}
            />
            <span className="adjustment-value">{formatValue(edits.contrast || 0)}</span>
          </label>
        </div>
      </div>

      {/* Presence */}
      <div className="adjustment-section">
        <h4>Presence</h4>
        
        <div className="adjustment-item">
          <label>
            <span className="adjustment-label">Texture</span>
            <input 
              type="range"
              min="-100"
              max="100"
              step="1"
              value={edits.texture || 0}
              onChange={e => handleSliderChange('texture', e)}
            />
            <span className="adjustment-value">{formatValue(edits.texture || 0)}</span>
          </label>
        </div>
        
        <div className="adjustment-item">
          <label>
            <span className="adjustment-label">Clarity</span>
            <input 
              type="range"
              min="-100"
              max="100"
              step="1"
              value={edits.clarity || 0}
              onChange={e => handleSliderChange('clarity', e)}
            />
            <span className="adjustment-value">{formatValue(edits.clarity || 0)}</span>
          </label>
        </div>
        
        <div className="adjustment-item">
          <label>
            <span className="adjustment-label">Dehaze</span>
            <input 
              type="range"
              min="-100"
              max="100"
              step="1"
              value={edits.dehaze || 0}
              onChange={e => handleSliderChange('dehaze', e)}
            />
            <span className="adjustment-value">{formatValue(edits.dehaze || 0)}</span>
          </label>
        </div>
        
        <div className="adjustment-item">
          <label>
            <span className="adjustment-label">Vibrance</span>
            <input 
              type="range"
              min="-100"
              max="100"
              step="1"
              value={edits.vibrance || 0}
              onChange={e => handleSliderChange('vibrance', e)}
            />
            <span className="adjustment-value">{formatValue(edits.vibrance || 0)}</span>
          </label>
        </div>
        
        <div className="adjustment-item">
          <label>
            <span className="adjustment-label">Saturation</span>
            <input 
              type="range"
              min="-100"
              max="100"
              step="1"
              value={edits.saturation || 0}
              onChange={e => handleSliderChange('saturation', e)}
            />
            <span className="adjustment-value">{formatValue(edits.saturation || 0)}</span>
          </label>
        </div>
      </div>

      {/* HSL Color */}
      <div className="adjustment-section">
        <h4>HSL / Color</h4>
        
        <div className="adjustment-item">
          <label>
            <span className="adjustment-label">Hue</span>
            <input 
              type="range"
              min="-180"
              max="180"
              step="1"
              value={edits.hue || 0}
              onChange={e => handleSliderChange('hue', e)}
            />
            <span className="adjustment-value">{formatValue(edits.hue || 0, '°')}</span>
          </label>
        </div>
        
        <div className="adjustment-item">
          <label>
            <span className="adjustment-label">Red Luminance</span>
            <input 
              type="range"
              min="-100"
              max="100"
              step="1"
              value={edits.redLuminance || 0}
              onChange={e => handleSliderChange('redLuminance', e)}
            />
            <span className="adjustment-value">{formatValue(edits.redLuminance || 0)}</span>
          </label>
        </div>
        
        <div className="adjustment-item">
          <label>
            <span className="adjustment-label">Green Luminance</span>
            <input 
              type="range"
              min="-100"
              max="100"
              step="1"
              value={edits.greenLuminance || 0}
              onChange={e => handleSliderChange('greenLuminance', e)}
            />
            <span className="adjustment-value">{formatValue(edits.greenLuminance || 0)}</span>
          </label>
        </div>
        
        <div className="adjustment-item">
          <label>
            <span className="adjustment-label">Blue Luminance</span>
            <input 
              type="range"
              min="-100"
              max="100"
              step="1"
              value={edits.blueLuminance || 0}
              onChange={e => handleSliderChange('blueLuminance', e)}
            />
            <span className="adjustment-value">{formatValue(edits.blueLuminance || 0)}</span>
          </label>
        </div>
      </div>

      {/* White Balance */}
      <div className="adjustment-section">
        <h4>White Balance</h4>
        
        <div className="adjustment-item">
          <label>
            <span className="adjustment-label">Temperature</span>
            <input 
              type="range"
              min="-2000"
              max="2000"
              step="50"
              value={edits.temperature || 0}
              onChange={e => handleSliderChange('temperature', e)}
            />
            <span className="adjustment-value">{formatValue(edits.temperature || 0, 'K')}</span>
          </label>
        </div>
        
        <div className="adjustment-item">
          <label>
            <span className="adjustment-label">Tint</span>
            <input 
              type="range"
              min="-150"
              max="150"
              step="1"
              value={edits.tint || 0}
              onChange={e => handleSliderChange('tint', e)}
            />
            <span className="adjustment-value">{formatValue(edits.tint || 0)}</span>
          </label>
        </div>
      </div>

      {/* Tone Curve */}
      <div className="adjustment-section">
        <h4>Tone Curve</h4>
        
        <div className="adjustment-item">
          <label>
            <span className="adjustment-label">Highlights</span>
            <input 
              type="range"
              min="-100"
              max="100"
              step="1"
              value={edits.curveHighlights || 0}
              onChange={e => handleSliderChange('curveHighlights', e)}
            />
            <span className="adjustment-value">{formatValue(edits.curveHighlights || 0)}</span>
          </label>
        </div>
        
        <div className="adjustment-item">
          <label>
            <span className="adjustment-label">Lights</span>
            <input 
              type="range"
              min="-100"
              max="100"
              step="1"
              value={edits.curveLights || 0}
              onChange={e => handleSliderChange('curveLights', e)}
            />
            <span className="adjustment-value">{formatValue(edits.curveLights || 0)}</span>
          </label>
        </div>
        
        <div className="adjustment-item">
          <label>
            <span className="adjustment-label">Darks</span>
            <input 
              type="range"
              min="-100"
              max="100"
              step="1"
              value={edits.curveDarks || 0}
              onChange={e => handleSliderChange('curveDarks', e)}
            />
            <span className="adjustment-value">{formatValue(edits.curveDarks || 0)}</span>
          </label>
        </div>
        
        <div className="adjustment-item">
          <label>
            <span className="adjustment-label">Shadows</span>
            <input 
              type="range"
              min="-100"
              max="100"
              step="1"
              value={edits.curveShadows || 0}
              onChange={e => handleSliderChange('curveShadows', e)}
            />
            <span className="adjustment-value">{formatValue(edits.curveShadows || 0)}</span>
          </label>
        </div>
      </div>

      {/* Detail */}
      <div className="adjustment-section">
        <h4>Detail</h4>
        
        <div className="adjustment-item">
          <label>
            <span className="adjustment-label">Sharpening</span>
            <input 
              type="range"
              min="0"
              max="150"
              step="1"
              value={edits.sharpening || 25}
              onChange={e => handleSliderChange('sharpening', e)}
            />
            <span className="adjustment-value">{formatValue(edits.sharpening || 25)}</span>
          </label>
        </div>
        
        <div className="adjustment-item">
          <label>
            <span className="adjustment-label">Radius</span>
            <input 
              type="range"
              min="0.5"
              max="3"
              step="0.1"
              value={edits.sharpeningRadius || 1}
              onChange={e => handleSliderChange('sharpeningRadius', e)}
            />
            <span className="adjustment-value">{formatValue(edits.sharpeningRadius || 1)}</span>
          </label>
        </div>
        
        <div className="adjustment-item">
          <label>
            <span className="adjustment-label">Noise Reduction</span>
            <input 
              type="range"
              min="0"
              max="100"
              step="1"
              value={edits.noiseReduction || 0}
              onChange={e => handleSliderChange('noiseReduction', e)}
            />
            <span className="adjustment-value">{formatValue(edits.noiseReduction || 0)}</span>
          </label>
        </div>
        
        <div className="adjustment-item">
          <label>
            <span className="adjustment-label">Color Noise Reduction</span>
            <input 
              type="range"
              min="0"
              max="100"
              step="1"
              value={edits.colorNoiseReduction || 25}
              onChange={e => handleSliderChange('colorNoiseReduction', e)}
            />
            <span className="adjustment-value">{formatValue(edits.colorNoiseReduction || 25)}</span>
          </label>
        </div>
      </div>

      {/* Effects */}
      <div className="adjustment-section">
        <h4>Effects</h4>
        
        <div className="adjustment-item">
          <label>
            <span className="adjustment-label">Post-Crop Vignetting</span>
            <input 
              type="range"
              min="-100"
              max="100"
              step="1"
              value={edits.vignetting || 0}
              onChange={e => handleSliderChange('vignetting', e)}
            />
            <span className="adjustment-value">{formatValue(edits.vignetting || 0)}</span>
          </label>
        </div>
        
        <div className="adjustment-item">
          <label>
            <span className="adjustment-label">Midpoint</span>
            <input 
              type="range"
              min="0"
              max="100"
              step="1"
              value={edits.vignetteMidpoint || 50}
              onChange={e => handleSliderChange('vignetteMidpoint', e)}
            />
            <span className="adjustment-value">{formatValue(edits.vignetteMidpoint || 50)}</span>
          </label>
        </div>
        
        <div className="adjustment-item">
          <label>
            <span className="adjustment-label">Grain Amount</span>
            <input 
              type="range"
              min="0"
              max="100"
              step="1"
              value={edits.grainAmount || 0}
              onChange={e => handleSliderChange('grainAmount', e)}
            />
            <span className="adjustment-value">{formatValue(edits.grainAmount || 0)}</span>
          </label>
        </div>
        
        <div className="adjustment-item">
          <label>
            <span className="adjustment-label">Grain Size</span>
            <input 
              type="range"
              min="16"
              max="80"
              step="1"
              value={edits.grainSize || 25}
              onChange={e => handleSliderChange('grainSize', e)}
            />
            <span className="adjustment-value">{formatValue(edits.grainSize || 25)}</span>
          </label>
        </div>
      </div>

      {/* Transform */}
      <div className="adjustment-section">
        <h4>Transform</h4>
        
        <div className="adjustment-item">
          <label>
            <span className="adjustment-label">Vertical Perspective</span>
            <input 
              type="range"
              min="-100"
              max="100"
              step="1"
              value={edits.verticalPerspective || 0}
              onChange={e => handleSliderChange('verticalPerspective', e)}
            />
            <span className="adjustment-value">{formatValue(edits.verticalPerspective || 0)}</span>
          </label>
        </div>
        
        <div className="adjustment-item">
          <label>
            <span className="adjustment-label">Horizontal Perspective</span>
            <input 
              type="range"
              min="-100"
              max="100"
              step="1"
              value={edits.horizontalPerspective || 0}
              onChange={e => handleSliderChange('horizontalPerspective', e)}
            />
            <span className="adjustment-value">{formatValue(edits.horizontalPerspective || 0)}</span>
          </label>
        </div>
        
        <div className="adjustment-item">
          <label>
            <span className="adjustment-label">Rotate</span>
            <input 
              type="range"
              min="-45"
              max="45"
              step="0.1"
              value={edits.rotate || 0}
              onChange={e => handleSliderChange('rotate', e)}
            />
            <span className="adjustment-value">{formatValue(edits.rotate || 0, '°')}</span>
          </label>
        </div>
        
        <div className="adjustment-item">
          <label className="checkbox-label">
            <input 
              type="checkbox"
              checked={edits.flipH || false}
              onChange={e => handleCheckboxChange('flipH', e)}
            />
            <span className="adjustment-label">Flip Horizontal</span>
          </label>
        </div>
        
        <div className="adjustment-item">
          <label className="checkbox-label">
            <input 
              type="checkbox"
              checked={edits.flipV || false}
              onChange={e => handleCheckboxChange('flipV', e)}
            />
            <span className="adjustment-label">Flip Vertical</span>
          </label>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="adjustment-section">
        <h4>Quick Presets</h4>
        
        <div className="preset-buttons">
          <button 
            className={`preset-button ${edits.applyQuickAction === 'bw' ? 'active' : ''}`}
            onClick={() => onEditChange('applyQuickAction', edits.applyQuickAction === 'bw' ? null : 'bw')}
          >
            B&W
          </button>
          <button 
            className={`preset-button ${edits.applyQuickAction === 'vintage' ? 'active' : ''}`}
            onClick={() => onEditChange('applyQuickAction', edits.applyQuickAction === 'vintage' ? null : 'vintage')}
          >
            Vintage
          </button>
          <button 
            className={`preset-button ${edits.applyQuickAction === 'portrait' ? 'active' : ''}`}
            onClick={() => onEditChange('applyQuickAction', edits.applyQuickAction === 'portrait' ? null : 'portrait')}
          >
            Portrait
          </button>
          <button 
            className={`preset-button ${edits.applyQuickAction === 'landscape' ? 'active' : ''}`}
            onClick={() => onEditChange('applyQuickAction', edits.applyQuickAction === 'landscape' ? null : 'landscape')}
          >
            Landscape
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
