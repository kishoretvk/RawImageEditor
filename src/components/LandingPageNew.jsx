import React from 'react';
import { Link } from 'react-router-dom';
import BeforeAfterDemo from './BeforeAfterDemo';
import cheetahImg from '../assets/images/cheetah-hotirontal.jpg';
import natureImg from '../assets/images/nature-horizontal.jpg';
import newyorkImg from '../assets/images/newyork-night.jpg';
import northernlightsImg from '../assets/images/northernlights.jpg';
import './LandingPage.css';

const LandingPage = () => {
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
          <BeforeAfterDemo />
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
