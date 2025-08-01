import React, { useState, useRef, useEffect } from 'react';
import EnhancedProfessionalLanding from '../components/EnhancedProfessionalLanding';
import BatchWorkflowProcessor from '../components/BatchWorkflowProcessor';
import WorkflowBuilder from '../components/WorkflowBuilder';
import PresetSelector from '../components/PresetSelector';
import PresetBuilder from '../components/PresetBuilder';
import PresetManager from '../components/PresetManager';
import ImageSlider from '../components/ImageSlider';
import BeforeAfterDemo from '../components/BeforeAfterDemo';
import '../styles/EnhancedProfessionalLanding.css';

const ProfessionalDemo = () => {
  const [activeDemo, setActiveDemo] = useState('landing');
  const [demoImage, setDemoImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const demoImages = [
    {
      id: 1,
      name: 'RAW Landscape',
      url: '/src/assets/images/nature-horizontal.jpg',
      type: 'raw',
      size: '24.5 MB'
    },
    {
      id: 2,
      name: 'RAW Portrait',
      url: '/src/assets/images/cheetah-horizontal.jpg',
      type: 'raw',
      size: '18.2 MB'
    },
    {
      id: 3,
      name: 'RAW Architecture',
      url: '/src/assets/images/newyork-night.jpg',
      type: 'raw',
      size: '31.7 MB'
    }
  ];

  const handleDemoImageSelect = (image) => {
    setIsLoading(true);
    setDemoImage(image);
    
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  const renderDemoContent = () => {
    switch (activeDemo) {
      case 'landing':
        return <EnhancedProfessionalLanding />;
      
      case 'workflow':
        return (
          <div className="demo-section">
            <h2>Professional Workflow Builder</h2>
            <WorkflowBuilder 
              onWorkflowComplete={(workflow) => {
                console.log('Workflow created:', workflow);
              }}
            />
          </div>
        );
      
      case 'batch':
        return (
          <div className="demo-section">
            <h2>Batch Processing Demo</h2>
            <BatchWorkflowProcessor 
              demoMode={true}
              sampleImages={demoImages}
            />
          </div>
        );
      
      case 'presets':
        return (
          <div className="demo-section">
            <h2>Preset Management</h2>
            <PresetSelector 
              onPresetSelect={(preset) => {
                console.log('Preset selected:', preset);
              }}
            />
            <PresetBuilder 
              onSave={(preset) => {
                PresetManager.savePreset(preset);
              }}
              currentEdits={{}}
            />
          </div>
        );
      
      case 'slider':
        return (
          <div className="demo-section">
            <h2>Before/After Slider Demo</h2>
            <ImageSlider 
              beforeImage={demoImages[0]?.url}
              afterImage={demoImages[1]?.url}
              width={800}
              height={500}
            />
          </div>
        );
      
      case 'comparison':
        return (
          <div className="demo-section">
            <h2>Image Comparison</h2>
            <BeforeAfterDemo 
              images={demoImages}
            />
          </div>
        );
      
      default:
        return <EnhancedProfessionalLanding />;
    }
  };

  return (
    <div className="professional-demo">
      <nav className="demo-nav">
        <div className="demo-nav-container">
          <h1>Professional RAW Editor Demo</h1>
          <div className="demo-tabs">
            <button 
              className={`demo-tab ${activeDemo === 'landing' ? 'active' : ''}`}
              onClick={() => setActiveDemo('landing')}
            >
              Landing Page
            </button>
            <button 
              className={`demo-tab ${activeDemo === 'workflow' ? 'active' : ''}`}
              onClick={() => setActiveDemo('workflow')}
            >
              Workflow Builder
            </button>
            <button 
              className={`demo-tab ${activeDemo === 'batch' ? 'active' : ''}`}
              onClick={() => setActiveDemo('batch')}
            >
              Batch Processing
            </button>
            <button 
              className={`demo-tab ${activeDemo === 'presets' ? 'active' : ''}`}
              onClick={() => setActiveDemo('presets')}
            >
              Preset Manager
            </button>
            <button 
              className={`demo-tab ${activeDemo === 'slider' ? 'active' : ''}`}
              onClick={() => setActiveDemo('slider')}
            >
              Image Slider
            </button>
            <button 
              className={`demo-tab ${activeDemo === 'comparison' ? 'active' : ''}`}
              onClick={() => setActiveDemo('comparison')}
            >
              Comparison
            </button>
          </div>
        </div>
      </nav>

      <div className="demo-content">
        {renderDemoContent()}
      </div>

      {isLoading && (
        <div className="demo-loading">
          <div className="loading-spinner"></div>
          <p>Loading demo...</p>
        </div>
      )}
    </div>
  );
};

export default ProfessionalDemo;
