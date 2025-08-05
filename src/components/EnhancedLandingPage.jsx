import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BeforeAfterSlider from './BeforeAfterSlider';
import '../styles/EnhancedLandingPage.css';

const EnhancedLandingPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loadedImages, setLoadedImages] = useState(0);

  // Updated features highlighting newly implemented capabilities
  const features = [
    { icon: '🎯', title: 'WB by Neutral Region', description: 'Drag a rectangle to auto‑balance color from a known neutral area.' },
    { icon: '🧩', title: 'Split RGB Channels', description: 'Export R, G, B mono images from original or adjusted pixels.' },
    { icon: '📦', title: 'Target Size Export', description: 'Export JPEG to a specific MB target with quality search and downscale.' },
    { icon: '🎨', title: 'Curves & LUTs', description: 'Precise tonal control and creative looks with per‑channel curves.' },
    { icon: '⚡', title: 'Fast In‑Browser', description: 'GPU‑accelerated preview with no uploads or installs.' },
    { icon: '🔄', title: 'Batch & Workflows', description: 'Preset management and custom multi‑step processing.' }
  ];

  useEffect(() => {
    // Preload only the images we actually use on the landing
    const images = [
      '/public/demo-images/color-before.jpg',
      '/public/demo-images/color-after.jpg'
    ];
    images.forEach(src => {
      const img = new Image();
      img.onload = () => setLoadedImages(prev => prev + 1);
      img.onerror = () => setLoadedImages(prev => prev + 1);
      img.src = src;
    });
  }, []);

  const handleOpenDemo = () => {
    setIsLoading(true);
    setTimeout(() => navigate('/demo'), 300);
  };

  const handleOpenEditor = () => {
    setIsLoading(true);
    setTimeout(() => navigate('/editor'), 300);
  };

  const handleCreateWorkflow = () => {
    setIsLoading(true);
    setTimeout(() => navigate('/workflow'), 300);
  };

  return (
    <div className="enhanced-landing">
      <div className="landing-hero">
        <div className="hero-content">
          <div className="hero-headline">
            <h1 className="hero-title">
              Pro‑grade RAW Editor
              <span className="hero-subtitle">in your browser</span>
            </h1>
            <span className="whats-new-badge" role="status" aria-label="New features">
              New: WB Region • RGB Split • Target Size Export
            </span>
          </div>

          <p className="hero-description">
            Develop RAW files with professional controls, instantly in the browser.
            Keep your workflow fast—no uploads, no installs.
          </p>

          <div className="hero-actions">
            <button className="btn-primary" onClick={handleOpenEditor} disabled={isLoading}>
              {isLoading ? 'Loading…' : 'Open Editor'}
            </button>
            <button className="btn-secondary" onClick={handleOpenDemo} disabled={isLoading}>
              {isLoading ? 'Loading…' : 'Open Demo'}
            </button>
          </div>

          <div className="hero-stats" aria-label="Key stats">
            <div className="stat"><span className="stat-number">100%</span><span className="stat-label">Local Processing</span></div>
            <div className="stat"><span className="stat-number">0</span><span className="stat-label">Installs</span></div>
            <div className="stat"><span className="stat-number">3</span><span className="stat-label">New Pro Tools</span></div>
          </div>
        </div>

      <div className="hero-visual" aria-hidden="true">
        {/* Lightweight teaser: small before/after slider with optimized demo images */}
        <div className="demo-teaser">
          <BeforeAfterSlider
            beforeSrc="/public/demo-images/color-before.jpg"
            afterSrc="/public/demo-images/color-after.jpg"
            alt="Before/After teaser"
          />
          <div className="demo-caption">Quick teaser — see more on the Demo page</div>
        </div>
      </div>
      </div>

      <div className="features-section">
        <h2>Professional Features</h2>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card" role="article">
              <div className="feature-icon" aria-hidden="true">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="workflow-section">
        <h2>Your Workflow, Your Way</h2>
        <div className="workflow-steps" role="list">
          <div className="workflow-step" role="listitem">
            <div className="step-number">1</div>
            <h3>Pick or Upload</h3>
            <p>Start from sample images or add your own RAWs.</p>
          </div>
          <div className="workflow-step" role="listitem">
            <div className="step-number">2</div>
            <h3>Balance & Adjust</h3>
            <p>Use WB region, curves, and pro sliders to dial in your look.</p>
          </div>
          <div className="workflow-step" role="listitem">
            <div className="step-number">3</div>
            <h3>Preview & Compare</h3>
            <p>Use before/after and channel views to validate results.</p>
          </div>
          <div className="workflow-step" role="listitem">
            <div className="step-number">4</div>
            <h3>Export Exactly</h3>
            <p>Target exact JPEG size or split RGB channels for analysis.</p>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <h2>Ready to Transform Your RAW Files?</h2>
        <p>Try the live demo or jump straight into the full editor.</p>
        <div className="cta-actions">
          <button className="btn-cta" onClick={handleOpenEditor} disabled={isLoading}>
            {isLoading ? 'Loading…' : 'Open Editor'}
          </button>
          <button className="btn-outline" onClick={handleCreateWorkflow}>
            Create Workflow
          </button>
        </div>
      </div>

      <footer className="landing-footer">
        <p>&copy; {new Date().getFullYear()} RAW Image Editor · Built with Web tech</p>
        <a className="changelog-link" href="https://github.com/kishoretvk/RawImageEditor" target="_blank" rel="noreferrer">
          View on GitHub
        </a>
      </footer>
    </div>
  );
};

export default EnhancedLandingPage;
