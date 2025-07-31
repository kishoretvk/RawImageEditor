import React, { useState, useEffect } from 'react';
import BeforeAfterDemo from '../components/BeforeAfterDemo';
import EnhancedLandingPage from '../components/EnhancedLandingPage';
import './DemoPage.css';

const DemoPage = () => {
  const [currentDemoIndex, setCurrentDemoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Demo images with before/after comparisons
  const demoImages = [
    {
      title: "RAW to JPEG Conversion",
      description: "Professional RAW processing with enhanced colors and details",
      original: "/src/assets/images/nature-horizontal.jpg",
      processed: "/src/assets/images/nature-horizontal.jpg",
      edits: {
        exposure: 0.3,
        contrast: 1.2,
        saturation: 1.1,
        highlights: -0.2,
        shadows: 0.3,
        temperature: 5500,
        tint: 10
      }
    },
    {
      title: "Portrait Enhancement",
      description: "Professional portrait retouching with skin tone correction",
      original: "/src/assets/images/cheetah-hotirontal.jpg",
      processed: "/src/assets/images/cheetah-hotirontal.jpg",
      edits: {
        exposure: 0.2,
        contrast: 1.1,
        saturation: 0.9,
        highlights: -0.1,
        shadows: 0.2,
        temperature: 5200,
        tint: 5,
        clarity: 0.1,
        vibrance: 0.15
      }
    },
    {
      title: "Landscape Processing",
      description: "Enhanced landscape with improved dynamic range",
      original: "/src/assets/images/northernlights.jpg",
      processed: "/src/assets/images/northernlights.jpg",
      edits: {
        exposure: 0.4,
        contrast: 1.3,
        saturation: 1.2,
        highlights: -0.3,
        shadows: 0.4,
        temperature: 5800,
        tint: -5,
        clarity: 0.2,
        vibrance: 0.25
      }
    }
  ];

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleDemoChange = (index) => {
    setCurrentDemoIndex(index);
  };

  return (
    <div className="demo-page">
      <div className="demo-header-section">
        <h1>Live RAW Processing Demo</h1>
        <p>Experience professional RAW image processing in real-time</p>
      </div>

      {isLoading ? (
        <div className="demo-loading">
          <div className="loading-spinner"></div>
          <p>Loading demo images...</p>
        </div>
      ) : (
        <>
          <BeforeAfterDemo
            images={demoImages}
            currentIndex={currentDemoIndex}
            onIndexChange={handleDemoChange}
          />

          <div className="demo-info">
            <div className="info-grid">
              <div className="info-card">
                <h3>🎯 Professional Quality</h3>
                <p>Experience the same quality as desktop applications, right in your browser</p>
              </div>
              
              <div className="info-card">
                <h3>⚡ Real-time Processing</h3>
                <p>See changes instantly with our optimized WebAssembly processing engine</p>
              </div>
              
              <div className="info-card">
                <h3>📱 Cross-platform</h3>
                <p>Works on any device with a modern web browser - no downloads required</p>
              </div>
              
              <div className="info-card">
                <h3>🔒 Privacy First</h3>
                <p>All processing happens locally on your device - your images never leave your browser</p>
              </div>
            </div>
          </div>

          <div className="demo-cta">
            <h2>Ready to Process Your RAW Images?</h2>
            <p>Start editing your RAW files with professional-grade tools</p>
            <div className="cta-buttons">
              <button className="btn-primary">Start Editing</button>
              <button className="btn-secondary">Learn More</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DemoPage;
