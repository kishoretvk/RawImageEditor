import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import cheetahImg from '../assets/images/cheetah-hotirontal.jpg';
import elephantImg from '../assets/images/elephant-hotirontal.jpg';
import natureImg from '../assets/images/nature-horizontal.jpg';
import newyorkImg from '../assets/images/newyork-night.jpg';
import northernlightsImg from '../assets/images/northernlights.jpg';
import './LandingPage.css';

const LandingPage = () => {
  const [sharpening, setSharpening] = useState(0);
  const [noiseReduction, setNoiseReduction] = useState(0);
  const [sliderPosition, setSliderPosition] = useState(50);

  return (
    <div className="landing-page">
      {/* Navigation Menu */}
      <nav className="top-navigation">
        <div className="nav-container">
          <div className="logo">RawConverter</div>
          <div className="nav-links">
            <Link to="/editor" className="nav-link">Editor</Link>
            <Link to="/compression" className="nav-link">Compression</Link>
            <Link to="/raw-convert" className="nav-link">RAW Convert</Link>
            <Link to="/workflow" className="nav-link">Workflow</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section with New York Background */}
      <section className="hero" style={{backgroundImage: `url(${newyorkImg})`}}>
        <div className="hero-overlay">
          <div className="hero-content">
            <h1 className="hero-title">Professional Image Editing & Conversion</h1>
            <p className="hero-subtitle">Transform your RAW images with precision and style</p>
            <button className="cta-button">Start Editing</button>
          </div>
        </div>
      </section>

      {/* Interactive Preview Section */}
      <section className="interactive-preview">
        <div className="container">
          <h2 className="section-title">See the Difference</h2>
          <div className="preview-demo">
            <div className="image-comparison">
              <div className="comparison-container">
                <img src={cheetahImg} alt="Original" className="base-image" />
                <div 
                  className="overlay-image" 
                  style={{
                    clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
                    filter: `contrast(${1 + sharpening * 0.3}) brightness(${1 - noiseReduction * 0.2})`
                  }}
                >
                  <img src={elephantImg} alt="Processed" />
                </div>
                <div 
                  className="slider-handle"
                  style={{left: `${sliderPosition}%`}}
                  onMouseDown={(e) => {
                    const handleMove = (event) => {
                      const rect = e.target.parentElement.getBoundingClientRect();
                      const position = ((event.clientX - rect.left) / rect.width) * 100;
                      setSliderPosition(Math.max(0, Math.min(100, position)));
                    };
                    document.addEventListener('mousemove', handleMove);
                    document.addEventListener('mouseup', () => {
                      document.removeEventListener('mousemove', handleMove);
                    }, { once: true });
                  }}
                >
                  <div className="handle-line"></div>
                </div>
              </div>
              <div className="labels">
                <span className="before-label">Before</span>
                <span className="after-label">After</span>
              </div>
            </div>
            
            <div className="controls">
              <div className="control-group">
                <label>Sharpening: {sharpening.toFixed(2)}</label>
                <input 
                  type="range" 
                  min="0" 
                  max="3" 
                  step="0.01" 
                  value={sharpening}
                  onChange={(e) => setSharpening(Number(e.target.value))}
                  className="slider"
                />
              </div>
              <div className="control-group">
                <label>Noise Reduction: {noiseReduction.toFixed(2)}</label>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.01" 
                  value={noiseReduction}
                  onChange={(e) => setNoiseReduction(Number(e.target.value))}
                  className="slider"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Powerful Features</h2>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-image">
                <img src={natureImg} alt="RAW Processing" />
              </div>
              <h3>RAW Processing</h3>
              <p>Professional RAW file conversion with advanced controls</p>
            </div>
            <div className="feature-card">
              <div className="feature-image">
                <img src={northernlightsImg} alt="Batch Processing" />
              </div>
              <h3>Batch Processing</h3>
              <p>Process multiple images simultaneously for efficiency</p>
            </div>
            <div className="feature-card">
              <div className="feature-image">
                <img src={cheetahImg} alt="Advanced Editing" />
              </div>
              <h3>Advanced Editing</h3>
              <p>Fine-tune every aspect of your images with precision tools</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; 2025 RawConverter. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
