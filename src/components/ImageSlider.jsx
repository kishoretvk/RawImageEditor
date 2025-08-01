import React, { useState, useRef, useEffect } from 'react';
import './ImageSlider.css';

const ImageSlider = () => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const [images, setImages] = useState({
    before: 'demo-images/before.jpg',
    after: 'demo-images/after.jpg'
  });

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
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  const loadDemoImages = async () => {
    try {
      // Try to load demo images from public/demo-images
      const beforeImg = new Image();
      const afterImg = new Image();
      
      beforeImg.onload = () => setImages(prev => ({ ...prev, before: 'demo-images/before.jpg' }));
      afterImg.onload = () => setImages(prev => ({ ...prev, after: 'demo-images/after.jpg' }));
      
      beforeImg.onerror = () => {
        // Fallback to placeholder images
        setImages({
          before: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjMjIyIi8+Cjx0ZXh0IHg9IjQwMCIgeT0iMzAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjY2IiBmb250LXNpemU9IjI0Ij5CZWZvcmUgSW1hZ2U8L3RleHQ+Cjwvc3ZnPgo=',
          after: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgdmlld0JveD0iMCAwIDgwMCA2MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI4MDAiIGhlaWdodD0iNjAwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjQwMCIgeT0iMzAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LXNpemU9IjI0Ij5BZnRlciBJbWFnZTwvdGV4dD4KPC9zdmc+Cg=='
        });
      };
      
      afterImg.onerror = beforeImg.onerror;
      
      beforeImg.src = 'demo-images/before.jpg';
      afterImg.src = 'demo-images/after.jpg';
    } catch (error) {
      console.error('Error loading demo images:', error);
    }
  };

  useEffect(() => {
    loadDemoImages();
  }, []);

  return (
    <div className="image-slider-container">
      <div className="slider-header">
        <h3>Interactive Before/After Comparison</h3>
        <p>Drag the slider to compare RAW processing results</p>
      </div>
      
      <div 
        ref={containerRef}
        className="slider-wrapper"
        onMouseDown={handleMouseDown}
        onTouchStart={(e) => {
          setIsDragging(true);
          const touch = e.touches[0];
          const rect = containerRef.current.getBoundingClientRect();
          const x = touch.clientX - rect.left;
          const percentage = (x / rect.width) * 100;
          setSliderPosition(Math.max(0, Math.min(100, percentage)));
        }}
        onTouchMove={(e) => {
          if (!isDragging) return;
          const touch = e.touches[0];
          const rect = containerRef.current.getBoundingClientRect();
          const x = touch.clientX - rect.left;
          const percentage = (x / rect.width) * 100;
          setSliderPosition(Math.max(0, Math.min(100, percentage)));
        }}
        onTouchEnd={() => setIsDragging(false)}
      >
        <div className="slider-image-container">
          <img 
            src={images.before} 
            alt="Before processing" 
            className="slider-image before-image"
            draggable={false}
          />
          <div 
            className="after-image-container"
            style={{ width: `${sliderPosition}%` }}
          >
            <img 
              src={images.after} 
              alt="After processing" 
              className="slider-image after-image"
              draggable={false}
            />
          </div>
          
          <div 
            className="slider-handle"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="slider-line"></div>
            <div className="slider-button">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M15 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
        
        <div className="slider-labels">
          <span className="label before-label">Before</span>
          <span className="label after-label">After</span>
        </div>
      </div>
      
      <div className="slider-controls">
        <button 
          className="reset-button"
          onClick={() => setSliderPosition(50)}
        >
          Reset Slider
        </button>
        <button 
          className="toggle-button"
          onClick={() => setSliderPosition(sliderPosition === 100 ? 0 : 100)}
        >
          {sliderPosition === 100 ? 'Show Before' : 'Show After'}
        </button>
      </div>
    </div>
  );
};

export default ImageSlider;
