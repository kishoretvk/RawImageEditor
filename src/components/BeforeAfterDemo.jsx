import React, { useState, useRef } from 'react';
import EnhancedImageCanvas from './EnhancedImageCanvas';

const BeforeAfterDemo = () => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [edits, setEdits] = useState({
    exposure: 0.3,
    contrast: 15,
    highlights: -20,
    shadows: 30,
    whites: 10,
    blacks: -15,
    clarity: 25,
    vibrance: 15,
    saturation: 10,
    temperature: 5,
    tint: 2
  });
  
  const containerRef = useRef(null);
  const isDragging = useRef(false);

  // Handle mouse events for slider
  const handleMouseDown = (e) => {
    isDragging.current = true;
    updateSliderPosition(e);
  };

  const handleMouseMove = (e) => {
    if (isDragging.current) {
      updateSliderPosition(e);
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const updateSliderPosition = (e) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const position = ((e.clientX - rect.left) / rect.width) * 100;
      setSliderPosition(Math.max(0, Math.min(100, position)));
    }
  };

  // Handle touch events for mobile
  const handleTouchStart = (e) => {
    isDragging.current = true;
    updateSliderPosition(e.touches[0]);
  };

  const handleTouchMove = (e) => {
    if (isDragging.current) {
      e.preventDefault();
      updateSliderPosition(e.touches[0]);
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
  };

  // Add event listeners for dragging
  React.useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Sample image for demo (using one of the existing assets)
  const sampleImage = {
    url: '../assets/images/cheetah-hotirontal.jpg',
    name: 'cheetah-hotirontal.jpg',
    size: 2400000
  };

  return (
    <div className="before-after-demo">
      <div 
        ref={containerRef}
        className="demo-container"
        style={{ position: 'relative', width: '100%', height: '400px' }}
      >
        {/* Enhanced Image Canvas with edits */}
        <div 
          className="edited-image"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`
          }}
        >
          <EnhancedImageCanvas 
            imageSrc={sampleImage}
            edits={edits}
            onProcessed={(data) => console.log('Processed:', data)}
          />
        </div>
        
        {/* Original image */}
        <div 
          className="original-image"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1
          }}
        >
          <img 
            src="../assets/images/cheetah-hotirontal.jpg" 
            alt="Original" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        
        {/* Slider handle */}
        <div 
          className="slider-handle"
          style={{
            position: 'absolute',
            top: 0,
            left: `${sliderPosition}%`,
            transform: 'translateX(-50%)',
            height: '100%',
            width: '4px',
            backgroundColor: '#fff',
            zIndex: 3,
            cursor: 'ew-resize',
            boxShadow: '0 0 5px rgba(0,0,0,0.5)'
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div 
            className="handle-knob"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 10px rgba(0,0,0,0.5)'
            }}
          >
            <div 
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: '2px solid #333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div 
                style={{
                  width: '2px',
                  height: '10px',
                  backgroundColor: '#333',
                  transform: 'rotate(45deg)'
                }}
              ></div>
              <div 
                style={{
                  width: '2px',
                  height: '10px',
                  backgroundColor: '#333',
                  transform: 'rotate(-45deg)',
                  position: 'absolute'
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Labels */}
      <div className="demo-labels" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
        <span className="label-before">Original</span>
        <span className="label-after">Edited</span>
      </div>
    </div>
  );
};

export default BeforeAfterDemo;
