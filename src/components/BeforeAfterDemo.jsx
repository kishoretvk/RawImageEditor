import React, { useState, useEffect } from 'react';
import './BeforeAfterDemo.css';

const BeforeAfterDemo = () => {
  const [selectedImage, setSelectedImage] = useState(0);
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const demoImages = [
    {
      id: 1,
      title: "RAW Processing",
      description: "Professional RAW image processing with enhanced details and colors",
      before: 'demo-images/raw-before.jpg',
      after: 'demo-images/raw-after.jpg'
    },
    {
      id: 2,
      title: "Color Grading",
      description: "Advanced color grading with LUTs and professional color correction",
      before: 'demo-images/color-before.jpg',
      after: 'demo-images/color-after.jpg'
    },
    {
      id: 3,
      title: "Noise Reduction",
      description: "AI-powered noise reduction while preserving fine details",
      before: 'demo-images/noise-before.jpg',
      after: 'demo-images/noise-after.jpg'
    },
    {
      id: 4,
      title: "Dynamic Range",
      description: "HDR processing with enhanced dynamic range and shadow recovery",
      before: 'demo-images/hdr-before.jpg',
      after: 'demo-images/hdr-after.jpg'
    }
  ];

  useEffect(() => {
    loadDemoImages();
  }, []);

  const loadDemoImages = async () => {
    setIsLoading(true);
    
    // Simulate loading with fallback to placeholders
    const loadedImages = demoImages.map(img => ({
      ...img,
      before: img.before,
      after: img.after
    }));
    
    setImages(loadedImages);
    setIsLoading(false);
  };

  const handleImageSelect = (index) => {
    setSelectedImage(index);
  };

  if (isLoading) {
    return (
      <div className="before-after-demo loading">
        <div className="loading-spinner"></div>
        <p>Loading demo images...</p>
      </div>
    );
  }

  const currentImage = images[selectedImage] || demoImages[selectedImage];

  return (
    <div className="before-after-demo">
      <div className="demo-gallery">
        <h3>Professional Processing Examples</h3>
        
        <div className="image-selector">
          {images.map((image, index) => (
            <button
              key={image.id}
              className={`selector-button ${selectedImage === index ? 'active' : ''}`}
              onClick={() => handleImageSelect(index)}
            >
              {image.title}
            </button>
          ))}
        </div>

        <div className="demo-image-grid">
          <div className="image-comparison">
            <div className="image-container">
              <img 
                src={currentImage.before} 
                alt={`${currentImage.title} - Before`}
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMjIyIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjY2IiBmb250LXNpemU9IjE2Ij5CZWZvcmU8L3RleHQ+Cjwvc3ZnPgo=';
                }}
              />
              <div className="image-label">Before</div>
            </div>
            
            <div className="image-container">
              <img 
                src={currentImage.after} 
                alt={`${currentImage.title} - After`}
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMzMzIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5IiBmb250LXNpemU9IjE2Ij5BZnRlcjwvdGV4dD4KPC9zdmc+Cg==';
                }}
              />
              <div className="image-label">After</div>
            </div>
          </div>

          <div className="demo-info">
            <h4>{currentImage.title}</h4>
            <p>{currentImage.description}</p>
          </div>
        </div>
      </div>

      <div className="demo-features">
        <h4>Processing Features Demonstrated</h4>
        <div className="features-list">
          <div className="feature-item">
            <span className="feature-icon">🎨</span>
            <span>Professional color grading</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">📊</span>
            <span>Advanced histogram adjustment</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🔍</span>
            <span>Detail enhancement</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">⚡</span>
            <span>Real-time processing</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeforeAfterDemo;
