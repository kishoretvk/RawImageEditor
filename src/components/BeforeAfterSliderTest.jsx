import React, { useState } from 'react';
import EnhancedImageCanvas from './EnhancedImageCanvas';
import UnifiedSlider from './UnifiedSlider';

const BeforeAfterSliderTest = () => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [showSlider, setShowSlider] = useState(true);
  
  // Test images - replace with actual test images
  const testImage = {
    url: '/src/assets/images/cheetah-horizontal.jpg',
    filename: 'test-image.jpg'
  };

  const testEdits = {
    exposure: 0.3,
    contrast: 0.2,
    saturation: 0.4,
    temperature: 0.1,
    sharpness: 0.3
  };

  return (
    <div style={{ 
      padding: '20px', 
      background: '#1a1a1a', 
      minHeight: '100vh',
      color: 'white'
    }}>
      <h1>Before/After Slider Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setShowSlider(!showSlider)}
          style={{
            padding: '10px 20px',
            background: '#4a9eff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Toggle Slider: {showSlider ? 'ON' : 'OFF'}
        </button>
      </div>

      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto',
        background: '#222',
        padding: '20px',
        borderRadius: '12px'
      }}>
        <h3>Test Image with Before/After Slider</h3>
        
        <div style={{ 
          position: 'relative',
          marginBottom: '20px'
        }}>
          <EnhancedImageCanvas 
            imageSrc={testImage}
            edits={testEdits}
            showSlider={showSlider}
            sliderPosition={sliderPosition}
            onSliderChange={setSliderPosition}
            hideControls={false}
            hideFullscreen={false}
          />
        </div>

        <div style={{ marginTop: '20px' }}>
          <UnifiedSlider
            min={0}
            max={100}
            value={sliderPosition}
            onChange={setSliderPosition}
            label="Before/After Comparison"
          />
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginTop: '10px',
            fontSize: '12px',
            color: '#aaa'
          }}>
            <span>Before (Original)</span>
            <span>After (Edited)</span>
          </div>
        </div>

        <div style={{ 
          marginTop: '20px',
          padding: '15px',
          background: '#333',
          borderRadius: '8px',
          fontSize: '14px'
        }}>
          <h4>Current Settings:</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li>Slider Position: {sliderPosition}%</li>
            <li>Show Slider: {showSlider ? 'Yes' : 'No'}</li>
            <li>Image Loaded: {testImage ? 'Yes' : 'No'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BeforeAfterSliderTest;
