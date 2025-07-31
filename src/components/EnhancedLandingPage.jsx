import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import EnhancedImageCanvas from './EnhancedImageCanvas';
import ImageSlider from './ImageSlider';
import BeforeAfterDemo from './BeforeAfterDemo';
import '../styles/EnhancedLandingPage.css';

const EnhancedLandingPage = () => {
  const [demoImage, setDemoImage] = useState(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [currentDemo, setCurrentDemo] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const fileInputRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);

  const demoImages = [
    {
      original: '/src/assets/images/nature-horizontal.jpg',
      processed: '/src/assets/images/nature-horizontal.jpg',
      title: 'RAW Processing',
      description: 'Professional-grade RAW image processing with advanced algorithms',
      edits: {
        exposure: 0.3,
        contrast: 15,
        vibrance: 20,
        highlights: -25,
        shadows: 35,
        temperature: 200,
        tint: 10
      }
    },
    {
      original: '/src/assets/images/cheetah-hotirontal.jpg',
      processed: '/src/assets/images/cheetah-hotirontal.jpg',
      title: 'Wildlife Enhancement',
      description: 'AI-powered wildlife photography enhancement',
      edits: {
        exposure: 0.2,
        contrast: 20,
        vibrance: 25,
        clarity: 15,
        dehaze: 10,
        temperature: -100
      }
    },
    {
      original: '/src/assets/images/newyork-night.jpg',
      processed: '/src/assets/images/newyork-night.jpg',
      title: 'Night Photography',
      description: 'Advanced noise reduction and light enhancement',
      edits: {
        exposure: 0.4,
        contrast: 25,
        highlights: -30,
        shadows: 40,
        noiseReduction: 50,
        temperature: -200
      }
    }
  ];

  const features = [
    {
      icon: '📸',
      title: 'RAW Processing',
      description: 'Support for 50+ RAW formats including Canon CR3, Nikon NEF, Sony ARW',
      features: ['Canon CR2/CR3', 'Nikon NEF', 'Sony ARW', 'Fuji RAF', 'Adobe DNG', 'Olympus ORF', 'Panasonic RW2'],
      color: '#FF6B6B'
    },
    {
      icon: '⚡',
      title: 'GPU Acceleration',
      description: 'WebAssembly + WebGL for real-time processing at 60fps',
      features: ['WebAssembly SIMD', 'WebGL 2.0', 'Multi-threading', 'Real-time preview', 'GPU acceleration'],
      color: '#4ECDC4'
    },
    {
      icon: '🎨',
      title: 'Professional Presets',
      description: 'Create, save, and share custom presets with advanced color grading',
      features: ['Custom LUTs', '3D LUT support', 'Batch presets', 'Cloud sync', 'Import/Export'],
      color: '#45B7D1'
    },
    {
      icon: '🔄',
      title: 'Workflow Automation',
      description: 'Build custom workflows for batch processing with drag-and-drop interface',
      features: ['Visual workflow builder', 'Batch processing', 'Auto-export', 'Format conversion', 'Cloud integration'],
      color: '#96CEB4'
    },
    {
      icon: '📱',
      title: 'Cross-Platform',
      description: 'Works seamlessly on iPad Pro, Mac, Windows, Android, and Chrome OS',
      features: ['iPad Pro optimized', 'Touch gestures', 'Apple Pencil support', 'Offline mode', 'PWA support'],
      color: '#FECA57'
    },
    {
      icon: '🔒',
      title: 'Privacy First',
      description: '100% client-side processing - your images never leave your device',
      features: ['Zero data upload', 'Local storage', 'Offline processing', 'No tracking', 'GDPR compliant'],
      color: '#FF9FF3'
    }
  ];

  const workflowSteps = [
    {
      step: 1,
      title: 'Upload & Organize',
      description: 'Drag & drop RAW files or import from cloud storage with automatic organization',
      icon: '📁',
      details: ['Multi-file upload', 'Cloud integration', 'Auto-sorting', 'Metadata extraction']
    },
    {
      step: 2,
      title: 'Apply AI Presets',
      description: 'Choose from AI-powered presets or create custom ones with machine learning',
      icon: '🤖',
      details: ['AI scene detection', 'Auto-enhancement', 'Custom presets', 'Batch application']
    },
    {
      step: 3,
      title: 'Fine-tune & Adjust',
      description: 'Professional-grade adjustments with real-time preview and histogram',
      icon: '⚙️',
      details: ['Curves & levels', 'Color grading', 'Local adjustments', 'Lens corrections']
    },
    {
      step: 4,
      title: 'Export & Share',
      description: 'Export in multiple formats with custom settings and automatic sharing',
      icon: '💾',
      details: ['Multiple formats', 'Batch export', 'Cloud sync', 'Direct sharing']
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Professional Photographer",
      avatar: "👩‍🎨",
      text: "This tool has revolutionized my workflow. The batch processing saves me hours every week.",
      rating: 5
    },
    {
      name: "Marcus Rodriguez",
      role: "Wedding Photographer",
      avatar: "👨‍💼",
      text: "The RAW processing quality rivals desktop software. I can edit on my iPad Pro anywhere.",
      rating: 5
    },
    {
      name: "Emma Thompson",
      role: "Travel Blogger",
      avatar: "👩‍✈️",
      text: "Perfect for editing on the go. The presets are incredible and the interface is intuitive.",
      rating: 5
    }
  ];

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsLoading(true);
      const url = URL.createObjectURL(file);
      setDemoImage({ url, filename: file.name });
      setIsLoading(false);
    }
  };

  const handleDragDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setDemoImage({ url, filename: file.name });
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDemo((prev) => (prev + 1) % demoImages.length);
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="enhanced-landing">
      {/* Animated Background */}
      <div className="animated-bg" style={{ transform: `translateY(${scrollY * 0.5}px)` }}>
        <div className="bg-gradient"></div>
      </div>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Professional RAW Editor
              <span className="hero-subtitle gradient-text">in Your Browser</span>
            </h1>
            <p className="hero-description">
              Process RAW images with professional-grade tools. GPU-accelerated processing, 
              AI-powered presets, and workflow automation - all in your browser.
            </p>
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">50+</span>
                <span className="stat-label">RAW Formats</span>
              </div>
              <div className="stat">
                <span className="stat-number">10x</span>
                <span className="stat-label">Faster</span>
              </div>
              <div className="stat">
                <span className="stat-number">100%</span>
                <span className="stat-label">Private</span>
              </div>
            </div>
            <div className="hero-actions">
              <Link to="/editor" className="btn-primary">
                Start Editing Free
              </Link>
              <Link to="/workflow" className="btn-secondary">
                Build Workflow
              </Link>
              <button className="btn-demo" onClick={() => document.getElementById('demo-section').scrollIntoView({ behavior: 'smooth' })}>
                Watch Demo
              </button>
            </div>
          </div>
          
          <div className="hero-demo">
            <div className="demo-container floating">
              {demoImage ? (
                <div className="live-demo">
                  <EnhancedImageCanvas
                    imageSrc={demoImage.url}
                    edits={demoImages[currentDemo].edits}
                    showSlider={true}
                    sliderPosition={sliderPosition}
                    onSliderChange={setSliderPosition}
                  />
                  <div className="demo-controls">
                    <span className="demo-title">{demoImages[currentDemo].title}</span>
                    <span className="demo-description">{demoImages[currentDemo].description}</span>
                  </div>
                </div>
              ) : (
                <div 
                  className="upload-demo"
                  onDrop={handleDragDrop}
                  onDragOver={(e) => e.preventDefault()}
                >
                  <div className="upload-icon">📸</div>
                  <h3>Try Live Demo</h3>
                  <p>Drag & drop a RAW file or click to upload</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.raw,.cr2,.cr3,.nef,.arw,.dng,.raf,.orf,.rw2"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="upload-btn"
                  >
                    Upload Image
                  </button>
                  {isLoading && <div className="loading-spinner"></div>}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Professional Features</h2>
          <p className="section-subtitle">
            Everything you need for professional RAW image processing
          </p>
          
          <div className="features-grid">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={`feature-card ${activeFeature === index ? 'active' : ''}`}
                onMouseEnter={() => setActiveFeature(index)}
                style={{ '--accent-color': feature.color }}
              >
                <div className="feature-icon" style={{ backgroundColor: feature.color + '20', color: feature.color }}>
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <ul className="feature-list">
                  {feature.features.map((item, idx) => (
                    <li key={idx}>
                      <span className="feature-bullet" style={{ backgroundColor: feature.color }}></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Visualization */}
      <section className="workflow-section">
        <div className="container">
          <h2 className="section-title">4-Step Professional Workflow</h2>
          <p className="section-subtitle">
            Create custom workflows for batch processing your images
          </p>
          
          <div className="workflow-visualization">
            {workflowSteps.map((step, index) => (
              <div key={step.step} className="workflow-step-card">
                <div className="step-header">
                  <div className="step-number">{step.step}</div>
                  <div className="step-icon">{step.icon}</div>
                </div>
                <div className="step-content">
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                  <ul className="step-details">
                    {step.details.map((detail, idx) => (
                      <li key={idx}>{detail}</li>
                    ))}
                  </ul>
                </div>
                {index < workflowSteps.length - 1 && (
                  <div className="step-arrow">→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Before/After Demo */}
      <section id="demo-section" className="demo-section">
        <div className="container">
          <h2 className="section-title">See Professional Results</h2>
          <p className="section-subtitle">
            Compare RAW processing vs basic editing with interactive demos
          </p>
          
          <BeforeAfterDemo
            images={demoImages}
            currentIndex={currentDemo}
            onIndexChange={setCurrentDemo}
            showSlider={true}
          />
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="container">
          <h2 className="section-title">Trusted by Professionals</h2>
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-avatar">{testimonial.avatar}</div>
                <div className="testimonial-content">
                  <div className="testimonial-rating">
                    {'★'.repeat(testimonial.rating)}
                  </div>
                  <p className="testimonial-text">"{testimonial.text}"</p>
                  <div className="testimonial-author">
                    <strong>{testimonial.name}</strong>
                    <span>{testimonial.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Performance Stats */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number" data-target="50">0</div>
              <div className="stat-label">RAW Formats</div>
            </div>
            <div className="stat-item">
              <div className="stat-number" data-target="10000">0</div>
              <div className="stat-label">Images Processed</div>
            </div>
            <div className="stat-item">
              <div className="stat-number" data-target="10">0</div>
              <div className="stat-label">X Faster</div>
            </div>
            <div className="stat-item">
              <div className="stat-number" data-target="100">0</div>
              <div className="stat-label">% Private</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Transform Your Workflow?</h2>
            <p>Join thousands of photographers who trust our professional RAW editor</p>
            <div className="cta-features">
              <span>✓ No signup required</span>
              <span>✓ Free forever</span>
              <span>✓ Privacy guaranteed</span>
            </div>
            <div className="cta-actions">
              <Link to="/editor" className="btn-primary large">
                Start Editing Now
              </Link>
              <Link to="/workflow" className="btn-secondary large">
                Build Custom Workflow
              </Link>
            </div>
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
                <li><Link to="/editor">RAW Editor</Link></li>
                <li><Link to="/workflow">Workflow Builder</Link></li>
                <li><Link to="/batch">Batch Processing</Link></li>
                <li><Link to="/presets">Preset Library</Link></li>
              </ul>
            </div>
            <div className="footer-section">
              <h3>Resources</h3>
              <ul>
                <li><Link to="/docs">Documentation</Link></li>
                <li><Link to="/tutorials">Video Tutorials</Link></li>
                <li><Link to="/api">API Reference</Link></li>
                <li><Link to="/community">Community</Link></li>
              </ul>
            </div>
            <div className="footer-section">
              <h3>Support</h3>
              <ul>
                <li><Link to="/help">Help Center</Link></li>
                <li><Link to="/contact">Contact Us</Link></li>
                <li><Link to="/status">System Status</Link></li>
              </ul>
            </div>
            <div className="footer-section">
              <h3>Company</h3>
              <ul>
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/privacy">Privacy Policy</Link></li>
                <li><Link to="/terms">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 Professional RAW Editor. Built with ❤️ for photographers worldwide.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default EnhancedLandingPage;
