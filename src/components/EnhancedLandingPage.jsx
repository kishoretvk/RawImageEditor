import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/EnhancedLandingPage.css';

const EnhancedLandingPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loadedImages, setLoadedImages] = useState(0);
  const [showDemo, setShowDemo] = useState(false);

  const features = [
    {
      icon: '📸',
      title: 'Professional RAW Processing',
      description: 'Process RAW files from any camera with professional-grade algorithms'
    },
    {
      icon: '⚡',
      title: 'Real-time Processing',
      description: 'See changes instantly with GPU-accelerated processing'
    },
    {
      icon: '🎨',
      title: 'Advanced Color Grading',
      description: 'Professional color correction with LUTs and curves'
    },
    {
      icon: '🔄',
      title: 'Batch Processing',
      description: 'Process hundreds of images with custom workflows'
    },
    {
      icon: '💾',
      title: 'Preset Management',
      description: 'Save and apply your favorite settings as presets'
    },
    {
      icon: '📱',
      title: 'Cross-Platform',
      description: 'Works on any device with a web browser'
    }
  ];

  const demoImages = [
    {
      before: 'demo-images/raw-before.jpg',
      after: 'demo-images/raw-after.jpg',
      title: 'RAW Processing',
      description: 'Professional RAW development with enhanced details'
    },
    {
      before: 'demo-images/color-before.jpg',
      after: 'demo-images/color-after.jpg',
      title: 'Color Grading',
      description: 'Advanced color correction and grading'
    }
  ];

  useEffect(() => {
    // Preload demo images
    const images = [
      'demo-images/raw-before.jpg',
      'demo-images/raw-after.jpg',
      'demo-images/color-before.jpg',
      'demo-images/color-after.jpg'
    ];

    images.forEach(src => {
      const img = new Image();
      img.onload = () => setLoadedImages(prev => prev + 1);
      img.onerror = () => setLoadedImages(prev => prev + 1); // Count errors too
      img.src = src;
    });
  }, []);

  const handleStartEditing = () => {
    setIsLoading(true);
    setTimeout(() => {
      navigate('/demo');
    }, 500);
  };

  const handleCreateWorkflow = () => {
    setIsLoading(true);
    setTimeout(() => {
      navigate('/workflow');
    }, 500);
  };

  return (
    <div className="enhanced-landing">
      <div className="landing-hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Professional RAW Image Editor
            <span className="hero-subtitle">in Your Browser</span>
          </h1>
          <p className="hero-description">
            Process RAW files from any camera with professional-grade tools. 
            No downloads, no subscriptions, just pure processing power.
          </p>
          
          <div className="hero-actions">
            <button 
              className="btn-primary"
              onClick={handleStartEditing}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Start Editing'}
            </button>
            <button 
              className="btn-secondary"
              onClick={() => setShowDemo(!showDemo)}
            >
              View Demo
            </button>
          </div>

          <div className="hero-stats">
            <div className="stat">
              <span className="stat-number">50+</span>
              <span className="stat-label">Camera Profiles</span>
            </div>
            <div className="stat">
              <span className="stat-number">100%</span>
              <span className="stat-label">Browser Based</span>
            </div>
            <div className="stat">
              <span className="stat-number">0ms</span>
              <span className="stat-label">Upload Time</span>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          {showDemo && (
            <div className="demo-preview">
              <img 
                src="demo-images/raw-after.jpg" 
                alt="Demo preview"
                className="demo-image"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjMjIyIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMTUwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNjY2IiBmb250LXNpemU9IjE2Ij5EZW1vIEltYWdlPC90ZXh0Pgo8L3N2Zz4K';
                }}
              />
              <div className="demo-overlay">
                <span>Live Preview</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="features-section">
        <h2>Professional Features</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="workflow-section">
        <h2>Your Workflow, Your Way</h2>
        <div className="workflow-steps">
          <div className="workflow-step">
            <div className="step-number">1</div>
            <h3>Upload RAW Files</h3>
            <p>Drag and drop your RAW files or select from your device</p>
          </div>
          <div className="workflow-step">
            <div className="step-number">2</div>
            <h3>Apply Presets</h3>
            <p>Use built-in presets or create your own custom settings</p>
          </div>
          <div className="workflow-step">
            <div className="step-number">3</div>
            <h3>Fine-tune Adjustments</h3>
            <p>Adjust exposure, color, sharpness, and more with precision</p>
          </div>
          <div className="workflow-step">
            <div className="step-number">4</div>
            <h3>Export & Share</h3>
            <p>Export in your preferred format or batch process multiple files</p>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <h2>Ready to Transform Your RAW Files?</h2>
        <p>Join thousands of photographers who trust our professional RAW processor</p>
        <div className="cta-actions">
          <button 
            className="btn-cta"
            onClick={handleStartEditing}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Start Free'}
          </button>
          <button 
            className="btn-outline"
            onClick={handleCreateWorkflow}
          >
            Create Workflow
          </button>
        </div>
      </div>

      <footer className="landing-footer">
        <p>&copy; 2024 Professional RAW Editor. Built with WebAssembly and love.</p>
      </footer>
    </div>
  );
};

export default EnhancedLandingPage;
