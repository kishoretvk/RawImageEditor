import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ImageSlider from '../components/ImageSlider';
import BeforeAfterDemo from '../components/BeforeAfterDemo';
import './DemoPage.css';

const DemoPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('slider');

  return (
    <div className="demo-page">
      <div className="demo-header">
        <h1>Professional RAW Processing Demo</h1>
        <p>Experience the power of professional RAW image processing with our interactive demos</p>
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
            <ImageSlider />
          </div>
        ) : (
          <div className="gallery-demo">
            <BeforeAfterDemo />
          </div>
        )}
      </div>

      <div className="demo-cta">
        <h3>Ready to Process Your RAW Images?</h3>
        <p>Start editing your RAW files with professional-grade tools</p>
        <div className="cta-buttons">
          <button className="cta-primary" onClick={() => navigate('/editor')}>
            Start Editing
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
