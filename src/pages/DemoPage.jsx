import React, { useState, useEffect } from 'react';
import BeforeAfterDemo from '../components/BeforeAfterDemo';
import './DemoPage.css';

import natureImg from '../assets/images/nature-horizontal.jpg';
import cheetahImg from '../assets/images/cheetah-horizontal.jpg';
import northernlightsImg from '../assets/images/northernlights.jpg';

const DemoPage = () => {
  const [currentDemoIndex, setCurrentDemoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Demo images with before/after comparisons
  const demoImages = [
    {
      title: "RAW to JPEG Conversion",
      description: "Professional RAW processing with enhanced colors and details",
      original: natureImg,
      processed: natureImg,
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
      original: cheetahImg,
      processed: cheetahImg,
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
      original: northernlightsImg,
      processed: northernlightsImg,
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
