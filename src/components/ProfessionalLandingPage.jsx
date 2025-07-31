import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import EnhancedImageCanvas from './EnhancedImageCanvas';
import ImageSlider from './ImageSlider';
import BeforeAfterDemo from './BeforeAfterDemo';
// import './ProfessionalLandingPage.css';

const ProfessionalLandingPage = () => {
  const [demoImage, setDemoImage] = useState(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [currentDemo, setCurrentDemo] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const demoImages = [
    {
      original: '/src/assets/images/nature-horizontal.jpg',
      processed: '/src/assets/images/nature-horizontal.jpg',
      title: 'RAW Processing',
      description: 'Professional-grade RAW image processing with advanced algorithms'
    },
    {
      original: '/src/assets/images/cheetah-hotirontal.jpg',
      processed: '/src/assets/images/cheetah-hotirontal.jpg',
      title: 'Batch Processing',
      description: 'Process hundreds of images with custom workflows'
    },
    {
      original: '/src/assets/images/newyork-night.jpg',
      processed: '/src/assets/images/newyork-night.jpg',
      title: 'AI Enhancement',
      description: 'AI-powered image enhancement and noise reduction'
    }
  ];

  const features = [
    {
      icon: '📸',
      title: 'RAW Image Processing',
      description: 'Process RAW files from any camera with professional-grade algorithms',
      features: ['Canon CR2/CR3', 'Nikon NEF', 'Sony ARW', 'Fuji RAF', 'Adobe DNG']
    },
    {
      icon: '⚡',
      title: 'Real-time Processing',
      description: 'See changes instantly with WebAssembly-powered processing',
      features: ['GPU Acceleration', 'WebAssembly', 'Multi-threading', 'Real-time preview']
    },
    {
      icon: '🎨',
      title: 'Professional Presets',
      description: 'Save and apply custom presets for consistent editing',
      features: ['Custom LUTs', 'Batch presets', 'Export/Import', 'Cloud sync']
    },
    {
      icon: '🔄',
      title: 'Workflow Automation',
      description: 'Create custom workflows for batch processing',
      features: ['Drag & drop', 'Custom pipelines', 'Auto-export', 'Format conversion']
    },
    {
      icon: '☁️',
      title: 'Cloud Integration',
      description: 'Seamlessly work with cloud storage',
      features: ['Google Drive', 'Dropbox', 'OneDrive', 'Local storage']
    },
    {
      icon: '📱',
      title: 'Cross-platform',
      description: 'Works on any device with a web browser',
      features: ['iPad Pro', 'Mac/Windows', 'Android', 'Chrome OS']
    }
  ];

  const workflowSteps = [
    {
      step: 1,
      title: 'Upload Images',
      description: 'Drag & drop RAW files or select from cloud storage',
      icon: '📁'
    },
    {
      step: 2,
      title: 'Apply Presets',
      description: 'Choose from professional presets or create your own',
      icon: '🎨'
    },
    {
      step: 3,
      title: 'Fine-tune',
      description: 'Adjust exposure, curves, color grading, and more',
      icon: '⚙️'
    },
    {
      step: 4,
      title: 'Export',
      description: 'Export in multiple formats with custom settings',
      icon: '💾'
    }
  ];

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsLoading(true);
      setDemoImage(file);
      setIsLoading(false);
    }
  };

  const handleDragDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setDemoImage(file);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDemo((prev) => (prev + 1) % demoImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="professional-landing">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Professional RAW Image Editor
              <span className="hero-subtitle">in Your Browser</span>
            </h1>
            <p className="hero-description">
              Process RAW images with professional-grade tools. No downloads, no servers, 
              just pure web technology with WebAssembly and GPU acceleration.
            </p>
            <div className="hero-actions">
              <Link to="/editor" className="btn-primary">
                Start Editing Now
              </Link>
              <Link to="/workflow" className="btn-secondary">
                Create Workflow
              </Link>
            </div>
          </div>
          
          <div className="hero-demo">
            <div className="demo-container">
              {demoImage ? (
                <EnhancedImageCanvas
                  imageSrc={demoImage}
                  edits={{
                    exposure: 0.2,
                    contrast: 10,
                    vibrance: 15,
                    highlights: -20,
                    shadows: 30
                  }}
                  showSlider={true}
                  sliderPosition={sliderPosition}
                  onSliderChange={setSliderPosition}
                />
              ) : (
                <div 
                  className="upload-demo"
                  onDrop={handleDragDrop}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <div className="upload-icon">📸</div>
                  <h3>Try it yourself</h3>
                  <p>Drag & drop a RAW file or click to upload</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="upload-btn"
                  >
                    Upload Image
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Professional Features</h2>
          <p className="section-subtitle">
            Everything you need for professional RAW image processing
          </p>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <ul className="feature-list">
                  {feature.features.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="workflow-section">
        <div className="container">
          <h2 className="section-title">Simple 4-Step Workflow</h2>
          <p className="section-subtitle">
            Create custom workflows for batch processing your images
          </p>
          
          <div className="workflow-steps">
            {workflowSteps.map((step) => (
              <div key={step.step} className="workflow-step">
                <div className="step-number">{step.step}</div>
                <div className="step-icon">{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After Demo */}
      <section className="demo-section">
        <div className="container">
          <h2 className="section-title">See the Difference</h2>
          <p className="section-subtitle">
            Professional RAW processing vs. basic editing
          </p>
          
          <BeforeAfterDemo
            images={demoImages}
            currentIndex={currentDemo}
            onIndexChange={setCurrentDemo}
          />
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
              <div className="stat-number">10x</div>
              <div className="stat-label">Faster Processing</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">100%</div>
              <div className="stat-label">Privacy</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2>Ready to Start Editing?</h2>
          <p>Join thousands of photographers who trust our professional RAW editor</p>
          <div className="cta-actions">
            <Link to="/editor" className="btn-primary large">
              Start Free Trial
            </Link>
            <Link to="/workflow" className="btn-secondary large">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>Product</h3>
              <ul>
                <li><Link to="/editor">Editor</Link></li>
                <li><Link to="/workflow">Workflow</Link></li>
                <li><Link to="/batch">Batch Processing</Link></li>
                <li><Link to="/presets">Presets</Link></li>
              </ul>
            </div>
            <div className="footer-section">
              <h3>Support</h3>
              <ul>
                <li><Link to="/docs">Documentation</Link></li>
                <li><Link to="/tutorials">Tutorials</Link></li>
                <li><Link to="/faq">FAQ</Link></li>
                <li><Link to="/contact">Contact</Link></li>
              </ul>
            </div>
            <div className="footer-section">
              <h3>Company</h3>
              <ul>
                <li><Link to="/about">About</Link></li>
                <li><Link to="/privacy">Privacy</Link></li>
                <li><Link to="/terms">Terms</Link></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 Professional RAW Editor. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProfessionalLandingPage;
