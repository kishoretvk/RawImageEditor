import React, { useState, useEffect } from 'react';
import EnhancedImageCanvas from './EnhancedImageCanvas';
import './BeforeAfterDemo.css';

const BeforeAfterDemo = ({ images, currentIndex, onIndexChange }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const currentImage = images[currentIndex];

  const sampleEdits = {
    nature: {
      exposure: 0.3,
      contrast: 15,
      vibrance: 20,
      highlights: -25,
      shadows: 35,
      temperature: 200,
      tint: 5
    },
    cheetah: {
      exposure: 0.2,
      contrast: 20,
      vibrance: 25,
      clarity: 15,
      highlights: -15,
      shadows: 40
    },
    night: {
      exposure: 0.5,
      contrast: 25,
      vibrance: 15,
      highlights: -30,
      shadows: 50,
      temperature: -300,
      vignetting: 20
    }
  };

  const getEditsForImage = (title) => {
    if (title.includes('RAW')) return sampleEdits.nature;
    if (title.includes('Batch')) return sampleEdits.cheetah;
    if (title.includes('AI')) return sampleEdits.night;
    return sampleEdits.nature;
  };

  useEffect(() => {
    if (isAutoPlaying) {
      const interval = setInterval(() => {
        onIndexChange((prev) => (prev + 1) % images.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isAutoPlaying, images.length, onIndexChange]);

  return (
    <div className="before-after-demo">
      <div className="demo-header">
        <h3>{currentImage.title}</h3>
        <p>{currentImage.description}</p>
      </div>

      <div className="demo-container">
        <EnhancedImageCanvas
          imageSrc={currentImage.original}
          edits={getEditsForImage(currentImage.title)}
          showSlider={true}
          sliderPosition={sliderPosition}
          onSliderChange={setSliderPosition}
        />
      </div>

      <div className="demo-controls">
        <div className="image-selector">
          {images.map((image, index) => (
            <button
              key={index}
              className={`selector-btn ${index === currentIndex ? 'active' : ''}`}
              onClick={() => onIndexChange(index)}
            >
              {image.title}
            </button>
          ))}
        </div>

        <div className="playback-controls">
          <button
            className="control-btn"
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          >
            {isAutoPlaying ? '⏸️' : '▶️'}
          </button>
          <button
            className="control-btn"
            onClick={() => onIndexChange((currentIndex - 1 + images.length) % images.length)}
          >
            ⏮️
          </button>
          <button
            className="control-btn"
            onClick={() => onIndexChange((currentIndex + 1) % images.length)}
          >
            ⏭️
          </button>
        </div>
      </div>

      <div className="demo-info">
        <div className="info-grid">
          <div className="info-item">
            <span className="info-label">Original</span>
            <span className="info-value">Unprocessed RAW</span>
          </div>
          <div className="info-item">
            <span className="info-label">Processed</span>
            <span className="info-value">Professional Edit</span>
          </div>
          <div className="info-item">
            <span className="info-label">Format</span>
            <span className="info-value">RAW → JPEG</span>
          </div>
          <div className="info-item">
            <span className="info-label">Time</span>
            <span className="info-value">Real-time</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeforeAfterDemo;
