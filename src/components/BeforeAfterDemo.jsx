import React, { useState, useEffect, useRef } from 'react';
import EnhancedImageCanvas from './EnhancedImageCanvas';
import './BeforeAfterDemo.css';

const BeforeAfterDemo = ({ images, currentIndex, onIndexChange, showSlider = true }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const intervalRef = useRef(null);

  const currentImage = images[currentIndex];

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setSliderPosition(prev => {
          if (prev >= 100) return 0;
          return prev + 1;
        });
      }, 50);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying]);

  const handleMouseMove = (e) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    handleMouseMove(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchMove = (e) => {
    if (!containerRef.current) return;
    
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'ArrowLeft') {
      setSliderPosition(prev => Math.max(0, prev - 5));
    } else if (e.key === 'ArrowRight') {
      setSliderPosition(prev => Math.min(100, prev + 5));
    }
  };

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

      <div className="demo-controls">
        <div className="demo-navigation">
          <button 
            className="nav-btn" 
            onClick={prevDemo}
            disabled={images.length <= 1}
          >
            ← Previous
          </button>
          
          <div className="demo-indicators">
            {images.map((_, index) => (
              <button
                key={index}
                className={`indicator ${index === currentIndex ? 'active' : ''}`}
                onClick={() => onIndexChange(index)}
              />
            ))}
          </div>
          
          <button 
            className="nav-btn" 
            onClick={nextDemo}
            disabled={images.length <= 1}
          >
            Next →
          </button>
        </div>

        <div className="slider-controls">
          <button 
            className={`play-btn ${isPlaying ? 'playing' : ''}`}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          
          <div className="slider-info">
            <span>Before</span>
            <span className="slider-value">{Math.round(sliderPosition)}%</span>
            <span>After</span>
          </div>
        </div>
      </div>

      <div 
        className="demo-container"
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchStart={handleMouseDown}
        onTouchEnd={handleMouseUp}
        onKeyDown={handleKeyPress}
        tabIndex={0}
      >
        <div className="image-comparison">
          <div className="image-container">
            <EnhancedImageCanvas
              imageSrc={currentImage.original}
              edits={{}}
              showSlider={false}
              hideControls={true}
            />
            <div className="image-label before">Original</div>
          </div>
          
          <div className="image-container after">
            <EnhancedImageCanvas
              imageSrc={currentImage.processed}
              edits={currentImage.edits}
              showSlider={false}
              hideControls={true}
            />
            <div className="image-label after">Processed</div>
          </div>
          
          <div 
            className="slider-overlay"
            style={{ left: `${sliderPosition}%` }}
          >
            <div className="slider-line"></div>
            <div className="slider-handle">
              <div className="slider-arrows">
                <span>◀</span>
                <span>▶</span>
              </div>
            </div>
          </div>
          
          <div 
            className="after-overlay"
            style={{ width: `${sliderPosition}%` }}
          >
            <EnhancedImageCanvas
              imageSrc={currentImage.processed}
              edits={currentImage.edits}
              showSlider={false}
              hideControls={true}
            />
          </div>
        </div>
      </div>

      <div className="demo-features">
        <div className="feature-grid">
          <div className="feature-item">
            <span className="feature-icon">🖱️</span>
            <span>Drag to compare</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">⌨️</span>
            <span>Use arrow keys</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📱</span>
            <span>Touch support</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">⚡</span>
            <span>Real-time preview</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeforeAfterDemo;
