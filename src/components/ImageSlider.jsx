import React, { useState, useRef, useEffect } from 'react';
import './ImageSlider.css';

const ImageSlider = () => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const [beforeImage, setBeforeImage] = useState(null);
  const [afterImage, setAfterImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sample images for demo
  const sampleImages = {
    before: '/src/assets/images/nature-horizontal.jpg',
    after: '/src/assets/images/nature-horizontal-enhanced.jpg'
  };

  useEffect(() => {
    // Load sample images
    setIsLoading(true);
    const loadImages = async () => {
      try {
        // For demo purposes, we'll use the same image but simulate enhancement
        setBeforeImage(sampleImages.before);
        setAfterImage(sampleImages.before); // In real app, this would be enhanced
      } catch (error) {
        console.error('Error loading images:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadImages();
  }, []);

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  const handleImageUpload = (type, file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (type === 'before') {
        setBeforeImage(e.target.result);
      } else {
        setAfterImage(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  if (isLoading) {
    return (
      <div className="image-slider-container">
        <div className="slider-loading">
          <div className="spinner"></div>
          <p>Loading images...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="image-slider-container">
      <div className="slider-header">
        <h3>Before & After Comparison</h3>
        <p>Drag the slider to compare RAW processing results</p>
      </div>

      <div className="upload-section">
        <div className="upload-controls">
          <label className="upload-btn">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload('before', e.target.files[0])}
              hidden
            />
            Upload Before
          </label>
          <label className="upload-btn">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload('after', e.target.files[0])}
              hidden
            />
            Upload After
          </label>
        </div>
      </div>

      <div 
        className="slider-wrapper"
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      >
        <div className="slider-image-container">
          <img 
            src={beforeImage || sampleImages.before} 
            alt="Before" 
            className="slider-image before-image"
          />
          <img 
            src={afterImage || sampleImages.before} 
            alt="After" 
            className="slider-image after-image"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          />
          
          <div 
            className="slider-divider"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="slider-handle">
              <div className="slider-arrows">
                <span>◀</span>
                <span>▶</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="slider-info">
        <div className="info-item">
          <span className="info-label">Before:</span>
          <span className="info-value">Original RAW</span>
        </div>
        <div className="info-item">
          <span className="info-label">After:</span>
          <span className="info-value">Processed</span>
        </div>
        <div className="info-item">
          <span className="info-label">Split:</span>
          <span className="info-value">{Math.round(sliderPosition)}%</span>
        </div>
      </div>
    </div>
  );
};

export default ImageSlider;
