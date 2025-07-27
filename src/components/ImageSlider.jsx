import React, { useState, useRef, useCallback } from 'react';
import './UnifiedSlider.css';

const ImageSlider = ({ 
  originalImage, 
  editedImage, 
  initialPosition = 50,
  onPositionChange,
  className = ''
}) => {
  const [sliderPosition, setSliderPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const updateSliderPosition = useCallback((clientX) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(percentage);
      if (onPositionChange) {
        onPositionChange(percentage);
      }
    }
  }, [onPositionChange]);

  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    updateSliderPosition(e.clientX);
  }, [updateSliderPosition]);

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      updateSliderPosition(e.clientX);
    }
  }, [isDragging, updateSliderPosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e) => {
    setIsDragging(true);
    updateSliderPosition(e.touches[0].clientX);
  }, [updateSliderPosition]);

  const handleTouchMove = useCallback((e) => {
    if (isDragging) {
      e.preventDefault();
      updateSliderPosition(e.touches[0].clientX);
    }
  }, [isDragging, updateSliderPosition]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add event listeners
  React.useEffect(() => {
    if (isDragging) {
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
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  return (
    <div 
      ref={containerRef}
      className={`image-slider ${className}`}
      style={{ 
        position: 'relative', 
        width: '100%', 
        height: '100%',
        cursor: isDragging ? 'ew-resize' : 'default'
      }}
    >
      {/* Edited image (RIGHT SIDE) */}
      <div 
        className="edited-image"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)`,
          zIndex: 2
        }}
      >
        <img 
          src={editedImage} 
          alt="Edited" 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            userSelect: 'none',
            pointerEvents: 'none'
          }}
        />
      </div>
      
      {/* Original image (LEFT SIDE) */}
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
          src={originalImage} 
          alt="Original" 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            userSelect: 'none',
            pointerEvents: 'none'
          }}
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
          width: '3px',
          backgroundColor: '#fff',
          zIndex: 10,
          cursor: 'ew-resize',
          boxShadow: '0 0 10px rgba(0,0,0,0.7)',
          pointerEvents: 'none'
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Top arrow */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '0',
          height: '0',
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderBottom: '12px solid #fff',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
        }}></div>
        
        {/* Center handle */}
        <div 
          className="handle-knob"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            border: '3px solid #4CAF50'
          }}
        >
          {/* Left arrow */}
          <div style={{
            position: 'absolute',
            left: '12px',
            width: '0',
            height: '0',
            borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent',
            borderRight: '8px solid #4CAF50'
          }}></div>
          
          {/* Right arrow */}
          <div style={{
            position: 'absolute',
            right: '12px',
            width: '0',
            height: '0',
            borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent',
            borderLeft: '8px solid #4CAF50'
          }}></div>
        </div>
        
        {/* Bottom arrow */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '0',
          height: '0',
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '12px solid #fff',
          filter: 'drop-shadow(0 -2px 4px rgba(0,0,0,0.3))'
        }}></div>
      </div>
    </div>
  );
};

export default ImageSlider;
