import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css'; // Assuming you will create a CSS file for styling

import cheetahImg from '../assets/images/cheetah-hotirontal.jpg';
import elephantImg from '../assets/images/elephant-hotirontal.jpg';
import natureImg from '../assets/images/nature-horizontal.jpg';
import newyorkImg from '../assets/images/newyork-night.jpg';
import northernlightsImg from '../assets/images/northernlights.jpg';

const LandingPage = () => {
  return (
    <div className="landing-page">
      {/* Header Section */}
      <header className="header">
        <h1 className="title">Welcome to RawConverter</h1>
        <p className="subtitle">Your Ultimate Image Editing and Conversion Tool</p>
        <button className="cta-button">Get Started</button>
      </header>

      {/* Feature Highlights Section */}
      <section className="features">
        <h2 className="section-title">Features</h2>
        <div className="feature-grid">
          <div className="feature-item">
            <img src={cheetahImg} alt="Conversion" className="feature-icon" />
            <h3>Image Conversion</h3>
            <p>Convert images to JPEG or PNG with adjustable quality.</p>
          </div>
          <div className="feature-item">
            <img src={elephantImg} alt="Sharpening" className="feature-icon" />
            <h3>Advanced Adjustments</h3>
            <p>Fine-tune sharpening and noise reduction settings.</p>
          </div>
          <div className="feature-item">
            <img src={natureImg} alt="Resize" className="feature-icon" />
            <h3>Resize Images</h3>
            <p>Resize images from 100px to 8000px effortlessly.</p>
          </div>
        </div>
      </section>

      {/* Live Preview Section */}
      <section className="live-preview">
        <h2 className="section-title">Live Preview</h2>
        <div className="preview-container">
          <div className="preview-image">
            <img src={newyorkImg} alt="Before" className="before-image" />
            <img src={northernlightsImg} alt="After" className="after-image" />
          </div>
          <div className="sliders">
            <label>Sharpening</label>
            <input type="range" min="0" max="3" step="0.01" />
            <label>Noise Reduction</label>
            <input type="range" min="0" max="1" step="0.01" />
          </div>
        </div>
      </section>

      {/* Navigation Buttons */}
      <section className="navigation">
        <h2 className="section-title">Explore More</h2>
        <div className="nav-buttons">
          <Link to="/editor" className="nav-button">Editor</Link>
          <Link to="/gallery" className="nav-button">Gallery</Link>
          <Link to="/settings" className="nav-button">Settings</Link>
        </div>
      </section>

      {/* Footer Section */}
      <footer className="footer">
        <p>&copy; 2025 RawConverter. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;
