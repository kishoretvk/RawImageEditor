import React, { useState, useRef, useEffect } from 'react';
import './ImageSlider.css';

const ImageSlider = ({ originalImage, editedImage, className = '' }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    handleMouseMove(e);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div 
      ref={containerRef}
      className={`image-slider ${className}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div className="slider-container">
        <img 
          src={originalImage} 
          alt="Original" 
          className="slider-image slider-image-before"
        />
        <div 
          className="slider-image-after-container"
          style={{ width: `${sliderPosition}%` }}
        >
          <img 
            src={editedImage} 
            alt="Edited" 
            className="slider-image slider-image-after"
          />
        </div>
        
        <div 
          className="slider-handle"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="slider-handle-line"></div>
          <div className="slider-handle-circle">
            <div className="slider-handle-arrows">
              <span>◀</span>
              <span>▶</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="slider-labels">
        <span className="slider-label slider-label-before">Original</span>
        <span className="slider-label slider-label-after">Processed</span>
      </div>
    </div>
  );
};

export default ImageSlider;
