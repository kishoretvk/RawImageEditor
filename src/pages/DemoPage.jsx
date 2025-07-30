import React, { useState } from 'react';
import ProfessionalLandingPage from '../components/ProfessionalLandingPage';
import ImageSlider from '../components/ImageSlider';
import FileUploader from '../components/FileUploader';
import BeforeAfterDemo from '../components/BeforeAfterDemo';
import '../components/BeforeAfterDemo.css';
import './DemoPage.css';

const DemoPage = () => {
  const [activeDemo, setActiveDemo] = useState('landing');

  const renderDemo = () => {
    switch (activeDemo) {
      case 'landing':
        return <ProfessionalLandingPage />;
      case 'slider':
        return (
          <div className="demo-container">
            <h2>Image Slider Demo</h2>
            <ImageSlider />
          </div>
        );
      case 'uploader':
        return (
          <div className="demo-container">
            <h2>File Uploader Demo</h2>
            <FileUploader />
          </div>
        );
      case 'before-after':
        return (
          <div className="demo-container">
            <h2>Before/After Demo</h2>
            <BeforeAfterDemo />
          </div>
        );
      default:
        return <ProfessionalLandingPage />;
    }
  };

  return (
    <div className="demo-page">
      <div className="demo-nav">
        <button 
          className={activeDemo === 'landing' ? 'active' : ''}
          onClick={() => setActiveDemo('landing')}
        >
          Landing Page
        </button>
        <button 
          className={activeDemo === 'slider' ? 'active' : ''}
          onClick={() => setActiveDemo('slider')}
        >
          Image Slider
        </button>
        <button 
          className={activeDemo === 'uploader' ? 'active' : ''}
          onClick={() => setActiveDemo('uploader')}
        >
          File Uploader
        </button>
        <button 
          className={activeDemo === 'before-after' ? 'active' : ''}
          onClick={() => setActiveDemo('before-after')}
        >
          Before/After
        </button>
      </div>
      
      <div className="demo-content">
        {renderDemo()}
      </div>
    </div>
  );
};

export default DemoPage;
