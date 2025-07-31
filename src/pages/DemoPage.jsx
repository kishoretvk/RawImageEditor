import React, { useState } from 'react';
import BeforeAfterDemo from '../components/BeforeAfterDemo';
import './DemoPage.css';

const DemoPage = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const demoImages = [
    {
      title: "RAW Nature Processing",
      description: "Professional RAW processing with enhanced colors and dynamic range",
      original: "/src/assets/images/nature-horizontal.jpg",
      processed: "/src/assets/images/nature-horizontal.jpg"
    },
    {
      title: "Batch Processing",
      description: "Consistent processing across multiple images with custom presets",
      original: "/src/assets/images/cheetah-hotirontal.jpg",
      processed: "/src/assets/images/cheetah-hotirontal.jpg"
    },
    {
      title: "AI-Enhanced Night Photography",
      description: "Advanced noise reduction and light enhancement for night shots",
      original: "/src/assets/images/newyork-night.jpg",
      processed: "/src/assets/images/newyork-night.jpg"
    },
    {
      title: "Landscape Enhancement",
      description: "Professional landscape editing with graduated filters and color grading",
      original: "/src/assets/images/northernlights.jpg",
      processed: "/src/assets/images/northernlights.jpg"
    }
  ];

  return (
    <div className="demo-page">
      <div className="demo-header">
        <h1>Professional RAW Processing Demo</h1>
        <p>Experience the power of professional RAW image processing in your browser</p>
      </div>

      <BeforeAfterDemo 
        images={demoImages}
        currentIndex={currentIndex}
        onIndexChange={setCurrentIndex}
      />

      <div className="demo-features">
        <h2>Professional Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3>Real-time Processing</h3>
            <p>See your edits applied instantly with WebAssembly acceleration</p>
          </div>
          <div className="feature-card">
            <h3>Batch Processing</h3>
            <p>Apply presets to hundreds of images with consistent results</p>
          </div>
          <div className="feature-card">
            <h3>Professional Presets</h3>
            <p>Save and share your custom editing workflows</p>
          </div>
          <div className="feature-card">
            <h3>Cross-platform</h3>
            <p>Works on any device with a modern web browser</p>
          </div>
        </div>
      </div>

      <div className="demo-cta">
        <h2>Ready to Start?</h2>
        <p>Try our professional RAW editor with your own images</p>
        <div className="cta-buttons">
          <button className="cta-primary" onClick={() => window.location.href = '/editor'}>
            Start Editing
          </button>
          <button className="cta-secondary" onClick={() => window.location.href = '/workflow'}>
            Create Workflow
          </button>
        </div>
      </div>
    </div>
  );
};

export default DemoPage;
