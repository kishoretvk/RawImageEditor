import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BeforeAfterSlider from './BeforeAfterSlider';
import Button from '../components/ui/Button.jsx';
import '../styles/EnhancedLandingPage.css';
import '../styles/tokens.css';

const EnhancedLandingPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loadedImages, setLoadedImages] = useState(0);

  // Updated features highlighting newly implemented capabilities
  const features = [
    { icon: '🎯', title: 'WB by Neutral Region', description: 'Drag a rectangle to auto‑balance color from a known neutral area.' },
    { icon: '🎚️', title: 'HSL / Split Toning', description: 'Per‑hue adjustments and highlight/shadow toning with balance.' },
    { icon: '🔎', title: 'Detail (NR + Sharpen)', description: 'Luminance/chroma noise reduction and unsharp masking.' },
    { icon: '🤖', title: 'AI Portrait & Landscape', description: 'Auto exposure/contrast/warmth and texture tuning.' },
    { icon: '🧩', title: 'Split RGB Channels', description: 'Export R, G, B mono images from original or adjusted pixels.' },
    { icon: '📦', title: 'Target Size Export', description: 'Export JPEG to a specific MB target with quality search/downscale.' },
    { icon: '🪄', title: 'Background Tools', description: 'Blur or remove background; PNG transparency supported.' },
    { icon: '🎨', title: 'Curves & LUTs', description: 'Precise tonal control and creative looks with per‑channel curves.' },
    { icon: '⚡', title: 'Fast In‑Browser', description: 'GPU‑accelerated preview with no uploads or installs.' },
    { icon: '🔄', title: 'Batch & Workflows', description: 'Preset management and custom multi‑step processing.' }
  ];

  useEffect(() => {
    // Preload only the images we actually use on the landing (base-aware)
    const base = (import.meta?.env?.BASE_URL || '/');
    const images = [
      `${base}demo-images/color-before.jpg`,
      `${base}demo-images/color-after.jpg`
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
              New: HSL • Split Toning • Detail • AI Portrait/Landscape • Background Tools • Target Size
            </span>
          </div>

          <p className="hero-description">
            Develop RAW files with professional controls, instantly in the browser.
            Keep your workflow fast—no uploads, no installs.
          </p>

          <div className="hero-actions" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Button variant="primary" size="lg" onClick={handleOpenEditor} disabled={isLoading}>
              {isLoading ? 'Loading…' : 'Open Editor'}
            </Button>
            <Button variant="secondary" size="lg" onClick={handleOpenDemo} disabled={isLoading}>
              {isLoading ? 'Loading…' : 'Open Demo'}
            </Button>
          </div>

          {/* Quick scenarios to jump into Demo with presets */}
          <div
            className="quick-scenarios"
            style={{
              marginTop: 12,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, max-content))',
              gap: '8px 10px',
              alignItems: 'start'
            }}
          >
            <Button variant="ghost" size="sm" onClick={() => navigate('/demo?tool=portrait')}>Portrait Enhance</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/demo?tool=landscape')}>Landscape Enhance</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/demo?tool=hsl')}>HSL Pop</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/demo?tool=splittoning')}>Split Toning Mood</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/demo?tool=detail')}>Detail Cleanup</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/demo?tool=bgblur')}>Background Blur</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/demo?tool=bgremove')}>Background Remove (PNG)</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/demo?tool=target2mb')}>Export 2 MB</Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/demo?tool=rgbsplit')}>RGB Split</Button>
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
            beforeSrc={`${import.meta.env.BASE_URL}demo-images/color-before.jpg`}
            afterSrc={`${import.meta.env.BASE_URL}demo-images/color-after.jpg`}
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
        <div className="cta-actions" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button variant="primary" size="md" onClick={handleOpenEditor} disabled={isLoading}>
            {isLoading ? 'Loading…' : 'Open Editor'}
          </Button>
          <Button variant="secondary" size="md" onClick={handleCreateWorkflow}>
            Create Workflow
          </Button>
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
