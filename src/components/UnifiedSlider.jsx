import React, { useState, useRef, useEffect } from 'react';

const UnifiedSlider = ({ 
  min = 0, 
  max = 100, 
  value = 50, 
  onChange, 
  label = "", 
  showLabels = true,
  showValue = true,
  className = ""
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);

  // Handle mouse events for slider
  const handleMouseDown = (e) => {
    setIsDragging(true);
    updateValue(e);
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      updateValue(e);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateValue = (e) => {
    if (sliderRef.current) {
      const rect = sliderRef.current.getBoundingClientRect();
      const position = ((e.clientX - rect.left) / rect.width) * (max - min) + min;
      const clampedValue = Math.max(min, Math.min(max, position));
      if (onChange) onChange(clampedValue);
    }
  };

  // Handle touch events for mobile
  const handleTouchStart = (e) => {
    setIsDragging(true);
    updateValue(e.touches[0]);
  };

  const handleTouchMove = (e) => {
    if (isDragging) {
      e.preventDefault();
      updateValue(e.touches[0]);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Add event listeners for dragging
  useEffect(() => {
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
  }, [isDragging]);

  // Calculate slider position as a percentage
  const sliderPosition = ((value - min) / (max - min)) * 100;

  return (
    <div className={`unified-slider ${className}`}>
      {label && <label className="slider-label">{label}</label>}
      <div className="slider-container">
        {showLabels && <span className="slider-min-value">{min}</span>}
        <div 
          ref={sliderRef}
          className="slider-track"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div 
            className="slider-fill"
            style={{ width: `${sliderPosition}%` }}
          ></div>
          <div 
            className="slider-handle"
            style={{ left: `${sliderPosition}%` }}
          ></div>
        </div>
        {showLabels && (
          <div className="slider-value-container">
            {showValue && <span className="slider-value">{value.toFixed(1)}</span>}
            <span className="slider-max-value">{max}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedSlider;
