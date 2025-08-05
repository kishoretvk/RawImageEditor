import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ImageSlider from '../components/ImageSlider';
import BeforeAfterDemo from '../components/BeforeAfterDemo';
import './DemoPage.css';

const samples = [
  { key: 'color', name: 'Color', before: '/demo-images/color-before.jpg', after: '/demo-images/color-after.jpg' },
  { key: 'landscape', name: 'Landscape', before: '/demo-images/landscape-before.jpg', after: '/demo-images/landscape-after.jpg' },
  { key: 'portrait', name: 'Portrait', before: '/demo-images/portrait-before.jpg', after: '/demo-images/portrait-after.jpg' },
];

const DemoPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('slider');
  const [selectedSample, setSelectedSample] = useState(samples[0]);

  // Read ?tool= query to preselect scenario and sample
  useEffect(() => {
    try {
      const qs = new URLSearchParams(window.location.search);
      const tool = (qs.get('tool') || '').toLowerCase();
      if (!tool) return;

      // Choose sample based on tool intent
      if (tool === 'portrait') {
        const s = samples.find(x => x.key === 'portrait');
        if (s) setSelectedSample(s);
      } else if (tool === 'landscape' || tool === 'hsl' || tool === 'splittoning' || tool === 'detail') {
        const s = samples.find(x => x.key === 'landscape');
        if (s) setSelectedSample(s);
      } else if (tool === 'rgbsplit' || tool === 'bgblur' || tool === 'bgremove' || tool === 'target2mb') {
        const s = samples.find(x => x.key === 'color');
        if (s) setSelectedSample(s);
      }

      // Ensure slider tab is visible to showcase effect immediately
      setActiveTab('slider');
    } catch (_) {
      // no-op
    }
  }, []);

  // Ensure sample paths are correct for Vite dev server (public/ is served at root)
  const withBase = (p) => p.startsWith('/demo-images') ? p : p;

  return (
    <div className="demo-page">
      <div className="demo-header">
        <h1>Try the Live Demo</h1>
        <p>Pick a sample, drag the slider, and compare before/after. Open the full editor anytime.</p>

        {/* Quick Scenarios row to jump from Demo page itself */}
        <div className="demo-quick-scenarios">
          <button className="sample-chip" onClick={() => navigate('/demo?tool=portrait')}>Portrait Enhance</button>
          <button className="sample-chip" onClick={() => navigate('/demo?tool=landscape')}>Landscape Enhance</button>
          <button className="sample-chip" onClick={() => navigate('/demo?tool=hsl')}>HSL Pop</button>
          <button className="sample-chip" onClick={() => navigate('/demo?tool=splittoning')}>Split Toning Mood</button>
          <button className="sample-chip" onClick={() => navigate('/demo?tool=detail')}>Detail Cleanup</button>
          <button className="sample-chip" onClick={() => navigate('/demo?tool=bgblur')}>Background Blur</button>
          <button className="sample-chip" onClick={() => navigate('/demo?tool=bgremove')}>Background Remove (PNG)</button>
          <button className="sample-chip" onClick={() => navigate('/demo?tool=target2mb')}>Export 2 MB</button>
          <button className="sample-chip" onClick={() => navigate('/demo?tool=rgbsplit')}>RGB Split</button>
        </div>
      </div>

      <div className="demo-samples" role="tablist" aria-label="Sample images">
        {samples.map((s) => (
          <button
            key={s.key}
            className={`sample-chip ${selectedSample.key === s.key ? 'active' : ''}`}
            onClick={() => setSelectedSample(s)}
            role="tab"
            aria-selected={selectedSample.key === s.key}
            title={`Use ${s.name} sample`}
          >
            {s.name}
          </button>
        ))}
        <button
          className="open-in-editor-chip"
          onClick={() => navigate('/editor')}
          title="Open in full editor"
        >
          Open in Editor →
        </button>
      </div>

      <div className="demo-tabs">
        <button
          className={`tab-button ${activeTab === 'slider' ? 'active' : ''}`}
          onClick={() => setActiveTab('slider')}
        >
          Interactive Slider
        </button>
        <button
          className={`tab-button ${activeTab === 'gallery' ? 'active' : ''}`}
          onClick={() => setActiveTab('gallery')}
        >
          Before/After Gallery
        </button>
      </div>

      <div className="demo-content">
        {activeTab === 'slider' ? (
          <div className="slider-demo">
            {/* Reuse ImageSlider but allow it to accept sources via props if supported; fallback renders default */}
            <ImageSlider
              beforeSrc={withBase(selectedSample.before)}
              afterSrc={withBase(selectedSample.after)}
              alt={`${selectedSample.name} before/after`}
            />
          </div>
        ) : (
          <div className="gallery-demo">
            <BeforeAfterDemo />
          </div>
        )}
      </div>

      <div className="demo-cta">
        <h3>Move beyond the basics</h3>
        <p>Open the full editor to try WB region, RGB split, and target‑size export.</p>
        <div className="cta-buttons">
          <button className="cta-primary" onClick={() => navigate('/editor')}>
            Open Editor
          </button>
          <button className="cta-secondary" onClick={() => navigate('/workflow')}>
            Create Workflow
          </button>
        </div>
      </div>
    </div>
  );
};

export default DemoPage;
