import React, { useState } from 'react';
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

  return (
    <div className="demo-page">
      <div className="demo-header">
        <h1>Try the Live Demo</h1>
        <p>Pick a sample, drag the slider, and compare before/after. Open the full editor anytime.</p>
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
              beforeSrc={selectedSample.before}
              afterSrc={selectedSample.after}
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
