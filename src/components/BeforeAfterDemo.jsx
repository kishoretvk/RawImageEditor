import React, { useState, useRef, useEffect } from 'react';
import EnhancedImageCanvas from './EnhancedImageCanvas';
import './BeforeAfterDemo.css';

const BeforeAfterDemo = ({ images, currentIndex, onIndexChange }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  const currentImage = images[currentIndex];

  const handleInteractionMove = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    handleInteractionMove(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    handleInteractionMove(e.clientX);
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    handleInteractionMove(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    handleInteractionMove(e.touches[0].clientX);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'ArrowLeft') {
      setSliderPosition(prev => Math.max(0, prev - 2));
    } else if (e.key === 'ArrowRight') {
      setSliderPosition(prev => Math.min(100, prev + 2));
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  const nextDemo = () => {
    onIndexChange((currentIndex + 1) % images.length);
    setSliderPosition(50);
  };

  const prevDemo = () => {
    onIndexChange((currentIndex - 1 + images.length) % images.length);
    setSliderPosition(50);
  };

  return (
    <div className="before-after-demo">
      <div className="demo-header">
        <h3>{currentImage.title}</h3>
        <p>{currentImage.description}</p>
      </div>

      <div 
        className="comparison-container"
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onKeyDown={handleKeyPress}
        tabIndex={0}
      >
        <div className="image-wrapper">
          <EnhancedImageCanvas
            imageSrc={currentImage.original}
            edits={{}}
            hideControls={true}
          />
          <div className="image-label before">Before</div>
        </div>
        
        <div 
          className="image-wrapper after"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <EnhancedImageCanvas
            imageSrc={currentImage.processed}
            edits={currentImage.edits}
            hideControls={true}
          />
          <div className="image-label after">After</div>
        </div>

        <div 
          className="slider-line"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="slider-handle">
            <div className="slider-arrows">
              <span>&#9664;</span>
              <span>&#9654;</span>
            </div>
          </div>
        </div>
      </div>

      <div className="demo-navigation-controls">
        <button 
          className="nav-btn" 
          onClick={prevDemo}
          disabled={images.length <= 1}
        >
          &larr; Previous
        </button>
        
        <div className="demo-indicators">
          {images.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => onIndexChange(index)}
              aria-label={`Go to demo ${index + 1}`}
            />
          ))}
        </div>
        
        <button 
          className="nav-btn" 
          onClick={nextDemo}
          disabled={images.length <= 1}
        >
          Next &rarr;
        </button>
      </div>
    </div>
  );
};

export default BeforeAfterDemo;
