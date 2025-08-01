import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import EnhancedImageCanvas from './EnhancedImageCanvas';
import FileUploader from './FileUploader';
import WorkflowBuilder from './WorkflowBuilder';
import PresetSelector from './PresetSelector';
import PresetBuilder from './PresetBuilder';
import PresetManager from './PresetManager';
import '../styles/EnhancedProfessionalLanding.css';

const EnhancedProfessionalLanding = () => {
  const [demoImage, setDemoImage] = useState(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [currentDemo, setCurrentDemo] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [showWorkflow, setShowWorkflow] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  // Demo images with proper paths
  const demoImages = [
    {
      original: '/src/assets/images/nature-horizontal.jpg',
      title: 'Professional RAW Processing',
      description: 'Advanced RAW processing with AI-powered enhancements',
      edits: {
        exposure: 0.3,
        contrast: 15,
        vibrance: 25,
        highlights: -30,
        shadows: 40,
        temperature: 5,
        tint: 2
      }
    },
    {
      original: '/src/assets/images/cheetah-hotirontal.jpg',
      title: 'Wildlife Enhancement',
      description: 'Perfect for wildlife photography with fur detail enhancement',
      edits: {
        exposure: 0.2,
        contrast: 20,
        vibrance: 30,
        highlights: -25,
        shadows: 35,
        clarity: 15,
        saturation: 10
      }
    },
    {
      original: '/src/assets/images/newyork-night.jpg',
      title: 'Night Photography',
      description: 'Urban night scenes with enhanced light and shadow details',
      edits: {
        exposure: 0.4,
        contrast: 25,
        vibrance: 20,
        highlights: -40,
        shadows: 50,
        temperature: -10,
        tint: 5
      }
    }
  ];

  const features = [
    {
      icon: '📸',
      title: 'RAW Processing',
      description: 'Support for 50+ RAW formats including Canon CR2/CR3, Nikon NEF, Sony ARW, Fuji RAF, and Adobe DNG',
      features: ['Canon CR2/CR3', 'Nikon NEF', 'Sony ARW', 'Fuji RAF', 'Adobe DNG', 'Olympus ORF', 'Panasonic RW2']
    },
    {
      icon: '⚡',
      title: 'Real-time Processing',
      description: 'WebAssembly-powered processing with GPU acceleration for instant preview',
      features: ['GPU Acceleration', 'WebAssembly SIMD', 'Multi-threading', 'Real-time preview', '60fps updates']
    },
    {
      icon: '🎨',
      title: 'Professional Presets',
      description: 'Save custom presets and apply them to batch processing workflows',
      features: ['Custom LUTs', 'Batch presets', 'Export/Import', 'Cloud sync', 'AI-powered suggestions']
    },
    {
      icon: '🔄',
      title: 'Workflow Automation',
      description: 'Create custom workflows for batch processing with drag-and-drop interface',
      features: ['Drag & drop builder', 'Custom pipelines', 'Auto-export', 'Format conversion', 'Smart naming']
    }
  ];

  const workflowSteps = [
    {
      step: 1,
      title: 'Upload Images',
      description: 'Drag & drop RAW files or import from cloud storage',
      icon: '📁',
      details: ['Batch upload', 'Cloud import', 'RAW format detection', 'Metadata extraction']
    },
    {
      step: 2,
      title: 'Create Workflow',
      description: 'Build custom processing pipelines with visual workflow builder',
      icon: '🔧',
      details: ['Drag & drop interface', 'Preset application', 'Format conversion', 'Quality settings']
    },
    {
      step: 3,
      title: 'Apply Presets',
      description: 'Use professional presets or create your own custom adjustments',
      icon: '🎨',
      details: ['Professional presets', 'Custom adjustments', 'AI suggestions', 'Real-time preview']
    },
    {
      step: 4,
      title: 'Batch Process',
      description: 'Process hundreds of images simultaneously with optimized performance',
      icon: '⚡',
      details: ['Multi-threading', 'GPU acceleration', 'Progress tracking', 'Error handling']
    },
    {
      step: 5,
      title: 'Export & Share',
      description: 'Export in multiple formats with custom naming and metadata',
      icon: '💾',
      details: ['Multiple formats', 'Custom naming', 'Metadata preservation', 'Direct sharing']
    }
  ];

  const handleFileUpload = async (files) => {
    if (files && files.length > 0) {
      setIsLoading(true);
      const file = files[0];
      
      const imageUrl = URL.createObjectURL(file);
      setUploadedImage({
        file,
        url: imageUrl,
        name: file.name
      });
      
      setDemoImage(imageUrl);
      setIsLoading(false);
    }
  };

  const handleDemoImageClick = (imageUrl) => {
    setDemoImage(imageUrl);
    setUploadedImage(null);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (!uploadedImage) {
        setCurrentDemo((prev) => (prev + 1) % demoImages.length);
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [uploadedImage]);

  useEffect(() => {
    return () => {
      if (uploadedImage?.url) {
        URL.revokeObjectURL(uploadedImage.url);
      }
    };
  }, [uploadedImage]);

  return (
    <div className="enhanced-professional-landing">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-container">
          <div className="logo">
            <span className="logo-icon">📸</span>
            RAW Pro Editor
          </div>
          <div className="nav-links">
            <Link to="/editor" className="nav-link">Editor</Link>
            <Link to="/workflow" className="nav-link">Workflow</Link>
            <Link to="/batch" className="nav-link">Batch</Link>
            <Link to="/presets" className="nav-link">Presets</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-overlay"></div>
        </div>
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Professional RAW Image Editor
              <span className="hero-subtitle">in Your Browser</span>
            </h1>
            <p className="hero-description">
              Process RAW images with professional-grade tools. No downloads, no servers, 
              just pure web technology with WebAssembly and GPU acceleration. 
              Works on any device with a browser.
            </p>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">50+</span>
                <span className="stat-label">RAW Formats</span>
              </div>
              <div className="stat">
                <span className="stat-number">10x</span>
                <span className="stat-label">Faster Processing</span>
              </div>
              <div className="stat">
                <span className="stat-number">100%</span>
                <span className="stat-label">Privacy</span>
              </div>
            </div>
            <div className="hero-actions">
              <Link to="/editor" className="btn-primary large">
                Start Editing Now
              </Link>
              <button 
                className="btn-secondary large"
                onClick={() => document.getElementById('interactive-demo').scrollIntoView({ behavior: 'smooth' })}
              >
                See Live Demo
              </button>
            </div>
          </div>
          
          <div className="hero-demo">
            <div className="demo-upload-zone">
              <FileUploader 
                onFileUpload={handleFileUpload}
                multiple={false}
                accept="image/*"
              />
              <div className="demo-images">
                <h4>Or try with demo images:</h4>
                <div className="demo-thumbnails">
                  {demoImages.map((img, index) => (
                    <button
                      key={index}
                      className={`demo-thumbnail ${currentDemo === index ? 'active' : ''}`}
                      onClick={() => handleDemoImageClick(img.original)}
                    >
                      <img src={img.original} alt={img.title} />
                      <span>{img.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="interactive-demo" className="interactive-demo-section">
        <div className="container">
          <h2 className="section-title">Live Interactive Demo</h2>
          <p className="section-subtitle">
            Upload your own image or use our demo images to see the professional difference
          </p>
          
          <div className="demo-container">
            <div className="demo-image-container">
              {demoImage && (
                <EnhancedImageCanvas
                  imageSrc={demoImage}
                  edits={demoImages[currentDemo]?.edits || {
                    exposure: 0.2,
                    contrast: 15,
                    vibrance: 20,
                    highlights: -25,
                    shadows: 30
                  }}
                  showSlider={true}
                  sliderPosition={sliderPosition}
                  onSliderChange={setSliderPosition}
                />
              )}
              
              {isLoading && (
                <div className="loading-overlay">
                  <div className="loading-spinner"></div>
                  <p>Processing image...</p>
                </div>
              )}
            </div>
            
            <div className="demo-controls">
              <div className="slider-control">
                <label>Before/After Comparison</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPosition}
                  onChange={(e) => setSliderPosition(Number(e.target.value))}
                  className="comparison-slider"
                />
                <div className="slider-labels">
                  <span>Original</span>
                  <span>Processed</span>
                </div>
              </div>
              
              {uploadedImage && (
                <div className="upload-info">
                  <p>Processing: <strong>{uploadedImage.name}</strong></p>
                  <button 
                    className="btn-tertiary"
                    onClick={() => {
                      setUploadedImage(null);
                      setDemoImage(demoImages[0].original);
                    }}
                  >
                    Use Demo Images
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
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
          <h2 className="section-title">5-Step Professional Workflow</h2>
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
                <ul className="step-details">
                  {step.details.map((detail, idx) => (
                    <li key={idx}>{detail}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="workflow-cta">
            <button 
              className="btn-primary"
              onClick={() => setShowWorkflow(true)}
            >
              Try Workflow Builder
            </button>
            <Link to="/workflow" className="btn-secondary">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Presets Section */}
      <section className="presets-section">
        <div className="container">
          <h2 className="section-title">Professional Presets</h2>
          <p className="section-subtitle">
            Save your custom settings and apply them to batch processing
          </p>
          
          <div className="presets-showcase">
            <div className="preset-categories">
              <div className="preset-category">
                <h4>Landscape</h4>
                <div className="preset-items">
                  <div className="preset-item">Golden Hour</div>
                  <div className="preset-item">Dramatic Sky</div>
                  <div className="preset-item">Forest Greens</div>
                </div>
              </div>
              <div className="preset-category">
                <h4>Portrait</h4>
                <div className="preset-items">
                  <div className="preset-item">Natural Skin</div>
                  <div className="preset-item">Cinematic</div>
                  <div className="preset-item">Vintage</div>
                </div>
              </div>
              <div className="preset-category">
                <h4>Wildlife</h4>
                <div className="preset-items">
                  <div className="preset-item">Fur Detail</div>
                  <div className="preset-item">Eye Enhancement</div>
                  <div className="preset-item">Action Freeze</div>
                </div>
              </div>
            </div>
            
            <div className="presets-cta">
              <button 
                className="btn-primary"
                onClick={() => setShowPresets(true)}
              >
                Create Custom Preset
              </button>
              <Link to="/presets" className="btn-secondary">
                Browse Presets
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Performance Section */}
      <section className="performance-section">
        <div className="container">
          <h2 className="section-title">Performance Optimized</h2>
          <div className="performance-grid">
            <div className="performance-item">
              <div className="performance-icon">⚡</div>
              <h3>WebAssembly Power</h3>
              <p>Native-speed processing in your browser</p>
            </div>
            <div className="performance-item">
              <div className="performance-icon">🎯</div>
              <h3>GPU Acceleration</h3>
              <p>Hardware-accelerated image processing</p>
            </div>
            <div className="performance-item">
              <div className="performance-icon">🔄</div>
              <h3>Multi-threading</h3>
              <p>Parallel processing for faster results</p>
            </div>
            <div className="performance-item">
              <div className="performance-icon">🔒</div>
              <h3>100% Private</h3>
              <p>All processing happens locally in your browser</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <h2>Ready to Transform Your Images?</h2>
          <p>Join thousands of professional photographers who trust our RAW editor</p>
          <div className="cta-actions">
            <Link to="/editor" className="btn-primary large">
              Start Free Now
            </Link>
            <Link to="/workflow" className="btn-secondary large">
              Build Workflow
            </Link>
          </div>
        </div>
      </section>

      {/* Modals */}
      {showWorkflow && (
        <div className="modal-overlay" onClick={() => setShowWorkflow(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Workflow Builder</h3>
            <WorkflowBuilder />
            <button className="btn-close" onClick={() => setShowWorkflow(false)}>×</button>
          </div>
        </div>
      )}

      {showPresets && (
        <div className="modal-overlay" onClick={() => setShowPresets(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Preset Manager</h3>
            <PresetSelector onPresetSelect={() => {}} />
            <PresetBuilder onSave={(preset) => PresetManager.savePreset(preset)} currentEdits={{}} />
            <button className="btn-close" onClick={() => setShowPresets(false)}>×</button>
          </div>
        </div>
      )}

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
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 RAW Pro Editor. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EnhancedProfessionalLanding;
