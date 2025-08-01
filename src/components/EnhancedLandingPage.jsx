import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/EnhancedLandingPage.css';
import BeforeAfterDemo from './BeforeAfterDemo';
import ImageSlider from './ImageSlider';
import WorkflowManager from './WorkflowManager';
import BatchWorkflowProcessor from './BatchWorkflowProcessor';
import PresetManager from './PresetManager';

const EnhancedLandingPage = () => {
  const [activeDemo, setActiveDemo] = useState('slider');
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [showBatch, setShowBatch] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  const features = [
    {
      title: 'RAW Processing',
      description: 'Process RAW files from any camera with professional-grade algorithms',
      icon: '📷',
      demo: 'slider'
    },
    {
      title: 'Batch Processing',
      description: 'Apply presets and edits to hundreds of images at once',
      icon: '⚡',
      demo: 'batch'
    },
    {
      title: 'Custom Workflows',
      description: 'Create and save custom processing workflows for consistent results',
      icon: '🔄',
      demo: 'workflow'
    },
    {
      title: 'Live Preview',
      description: 'See your edits in real-time with before/after comparisons',
      icon: '👁️',
      demo: 'slider'
    },
    {
      title: 'Professional Presets',
      description: 'Use built-in presets or create your own for consistent styling',
      icon: '🎨',
      demo: 'presets'
    },
    {
      title: 'Cross-Platform',
      description: 'Works on any device with a web browser - no installation needed',
      icon: '🌐',
      demo: 'slider'
    }
  ];

  const renderDemo = () => {
    switch (activeDemo) {
      case 'slider':
        return <ImageSlider />;
      case 'batch':
        return <BatchWorkflowProcessor />;
      case 'workflow':
        return <WorkflowManager />;
      case 'presets':
        return <PresetManager />;
      default:
        return <ImageSlider />;
    }
  };

  return (
    <div className="enhanced-landing">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Professional RAW Image Editor
            <span className="hero-subtitle">in Your Browser</span>
          </h1>
          <p className="hero-description">
            Process RAW files from any camera with professional-grade tools. 
            No downloads, no installations - just pure web-based power.
          </p>
          <div className="hero-actions">
            <Link to="/editor" className="cta-button primary">
              Start Editing
              <span className="button-icon">→</span>
            </Link>
            <Link to="/demo" className="cta-button secondary">
              <span className="button-icon">▶</span>
              Watch Demo
            </Link>
          </div>
        </div>
        <div className="hero-visual">
          <BeforeAfterDemo />
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Professional Features</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={`feature-card ${activeDemo === feature.demo ? 'active' : ''}`}
                onClick={() => setActiveDemo(feature.demo)}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <button className="feature-demo-btn">
                  Try Demo
                  <span className="icon">→</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="demo-section">
        <div className="container">
          <h2 className="section-title">Interactive Demo</h2>
          <div className="demo-controls">
            <button 
              className={`demo-tab ${activeDemo === 'slider' ? 'active' : ''}`}
              onClick={() => setActiveDemo('slider')}
            >
              Before/After
            </button>
            <button 
              className={`demo-tab ${activeDemo === 'batch' ? 'active' : ''}`}
              onClick={() => setActiveDemo('batch')}
            >
              Batch Processing
            </button>
            <button 
              className={`demo-tab ${activeDemo === 'workflow' ? 'active' : ''}`}
              onClick={() => setActiveDemo('workflow')}
            >
              Workflows
            </button>
            <button 
              className={`demo-tab ${activeDemo === 'presets' ? 'active' : ''}`}
              onClick={() => setActiveDemo('presets')}
            >
              Presets
            </button>
          </div>
          <div className="demo-container">
            {renderDemo()}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="workflow-section">
        <div className="container">
          <h2 className="section-title">Your Workflow, Your Way</h2>
          <div className="workflow-steps">
            <div className="workflow-step">
              <div className="step-number">1</div>
              <h3>Upload RAW Files</h3>
              <p>Drag and drop your RAW files or select from your device</p>
            </div>
            <div className="workflow-step">
              <div className="step-number">2</div>
              <h3>Apply Edits</h3>
              <p>Use professional tools to adjust exposure, color, and more</p>
            </div>
            <div className="workflow-step">
              <div className="step-number">3</div>
              <h3>Save Presets</h3>
              <p>Save your settings as presets for consistent styling</p>
            </div>
            <div className="workflow-step">
              <div className="step-number">4</div>
              <h3>Export & Share</h3>
              <p>Export in any format or batch process multiple files</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">50+</div>
              <div className="stat-label">RAW Formats</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">1000+</div>
              <div className="stat-label">Images Processed</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">24/7</div>
              <div className="stat-label">Available</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">0</div>
              <div className="stat-label">Installations</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2>Ready to Edit Like a Pro?</h2>
          <p>Start processing your RAW files with professional tools right now</p>
          <div className="cta-actions">
            <Link to="/editor" className="cta-button primary large">
              Start Free
              <span className="button-icon">→</span>
            </Link>
            <Link to="/workflow" className="cta-button secondary large">
              <span className="button-icon">⚙</span>
              Create Workflow
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <p>&copy; 2024 RAW Image Editor. Built with WebAssembly and modern web technologies.</p>
          <div className="footer-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/about">About</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EnhancedLandingPage;
