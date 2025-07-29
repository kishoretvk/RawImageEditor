import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import BeforeAfterDemo from './BeforeAfterDemo';
import PreloadLink from './PreloadLink';
import cheetahImg from '../assets/images/cheetah-hotirontal.jpg';
import natureImg from '../assets/images/nature-horizontal.jpg';
import newyorkImg from '../assets/images/newyork-night.jpg';
import northernlightsImg from '../assets/images/northernlights.jpg';
import FileUploader from './FileUploader';
import './LandingPageNew.css';


const LandingPage = () => {
  const beforeAfterRef = useRef(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [toolbarMinimized, setToolbarMinimized] = useState(false);

  // Smooth scroll function
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offsetTop = element.offsetTop - 80; // Account for fixed navigation
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  };

  // Enhanced "See the Difference" function with animation
  const handleSeeTheDifference = () => {
    // First scroll to the interactive section
    scrollToSection('interactive-preview');
    
    // Then trigger the animation after a short delay
    setTimeout(() => {
      if (beforeAfterRef.current && beforeAfterRef.current.animateThroughImages) {
        beforeAfterRef.current.animateThroughImages();
      }
    }, 800); // Give time for scroll to complete
  };

  // Add scroll animation observer
  useEffect(() => {
    // Start preloading critical components immediately
    const preloadCritical = async () => {
      const { preloadAllComponents } = await import('../utils/preloadManager');
      setTimeout(() => preloadAllComponents(), 500); // Small delay to not block initial render
    };
    
    preloadCritical();

    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
        }
      });
    }, observerOptions);

    const sections = document.querySelectorAll('.interactive-preview, .features');
    sections.forEach(section => observer.observe(section));

    return () => {
      sections.forEach(section => observer.unobserve(section));
    };
  }, []);

  return (
    <div className="landing-page">
      {/* Navigation Menu */}
      <nav className="top-navigation">
        <div className="nav-container">
          <div className="logo">RawConverter</div>
          <div className="nav-links">
            <PreloadLink 
              to="/editor" 
              className="nav-link"
              componentName="Editor"
              importFunction={() => import('../pages/Editor')}
            >
              Editor
            </PreloadLink>
            <PreloadLink 
              to="/compression" 
              className="nav-link"
              componentName="CompressionPage"
              importFunction={() => import('../pages/CompressionPage')}
            >
              Compression
            </PreloadLink>
            <Link to="/workflow" className="nav-link">Workflow</Link>
            <Link to="/gallery" className="nav-link">Gallery</Link>
            <Link to="/about" className="nav-link">About</Link>
          </div>
        </div>
      </nav>
      
      {/* Always-visible Upload Button */}
      <div className="upload-bar" style={{position: 'sticky', top: 0, left: 0, right: 0, zIndex: 1000, background: 'rgba(20,20,30,0.97)', boxShadow: '0 2px 12px rgba(0,0,0,0.12)', padding: '0.5rem 0'}}>
        <div style={{maxWidth: 900, margin: '0 auto', padding: '0 1rem'}}>
          <FileUploader onFileUpload={setUploadedImage} multiple={false} />
        </div>
      </div>

      {/* Hero Section with New York Background */}
      <section className="hero" style={{backgroundImage: `url(${newyorkImg})`}}>
        <div className="hero-overlay">
          <div className="hero-content">
            <h1 className="hero-title">Professional Image Editing & Conversion</h1>
            <p className="hero-subtitle">Transform your RAW images with precision and style</p>
            <div className="flex gap-4">
              <Link to="/editor" className="cta-button">Start Editing</Link>
              <Link to="/demo" className="cta-button secondary">View Demo</Link>
              <button 
                className="cta-button tertiary" 
                onClick={handleSeeTheDifference}
              >
                See the Difference
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Editing Style Selection */}
      <section className="editing-styles" style={{padding: '2rem 0', background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)'}}>
        <div className="container">
          <h2 className="section-title" style={{textAlign: 'center', marginBottom: '2rem'}}>Choose Your Editing Style</h2>
          <div style={{display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap'}}>
            <button 
              className="cta-button" 
              style={{padding: '0.8rem 1.5rem', fontSize: '1rem', minWidth: '180px'}}
              onClick={() => {
                // Navigate to editor with wildlife preset
                window.location.hash = '/editor';
              }}
            >
              Wildlife Photography
            </button>
            <button 
              className="cta-button secondary" 
              style={{padding: '0.8rem 1.5rem', fontSize: '1rem', minWidth: '180px'}}
              onClick={() => {
                // Navigate to editor with landscape preset
                window.location.hash = '/editor';
              }}
            >
              Landscape Enhancement
            </button>
            <button 
              className="cta-button tertiary" 
              style={{padding: '0.8rem 1.5rem', fontSize: '1rem', minWidth: '180px'}}
              onClick={() => {
                // Navigate to editor with urban night preset
                window.location.hash = '/editor';
              }}
            >
              Urban Night Scene
            </button>
            <button 
              className="cta-button" 
              style={{background: 'linear-gradient(45deg, #9c27b0, #7b1fa2)', padding: '0.8rem 1.5rem', fontSize: '1rem', minWidth: '180px'}}
              onClick={() => {
                // Navigate to editor with aurora preset
                window.location.hash = '/editor';
              }}
            >
              Aurora Enhancement
            </button>
          </div>
        </div>
      </section>

      {/* Interactive Preview Section */}
      <section id="interactive-preview" className="interactive-preview">
        <div className="container">
          <h2 className="section-title">See the Professional Difference</h2>
          <p className="section-subtitle">
            Experience our advanced editing capabilities with real-time before/after comparisons
          </p>
          <div style={{position: 'relative', maxWidth: 900, margin: '0 auto'}}>
            {/* Overlay Controls */}
            <div style={{position: 'absolute', top: 18, right: 18, zIndex: 20, display: 'flex', gap: 8}}>
              <button
                className="cta-button secondary"
                style={{padding: '0.5rem 1.2rem', fontSize: 15, minWidth: 0, borderRadius: 18, boxShadow: '0 2px 8px rgba(33,150,243,0.13)'}}
                onClick={() => setShowOriginal(o => !o)}
              >
                {showOriginal ? 'Minimize Original' : 'Show Original'}
              </button>
              <button
                className="cta-button tertiary"
                style={{padding: '0.5rem 1.2rem', fontSize: 15, minWidth: 0, borderRadius: 18, boxShadow: '0 2px 8px rgba(255,152,0,0.13)'}}
                onClick={() => setToolbarMinimized(m => !m)}
              >
                {toolbarMinimized ? 'Show Toolbar' : 'Minimize Toolbar'}
              </button>
            </div>
            {/* Grouped Toolbar (Demo Only) */}
            {!toolbarMinimized && (
              <div style={{position: 'absolute', bottom: 18, left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', gap: 12, background: 'rgba(255,255,255,0.92)', borderRadius: 18, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', padding: '0.5rem 1.2rem'}}>
                <button className="cta-button" style={{padding: '0.3rem 1.1rem', fontSize: 15, minWidth: 0, borderRadius: 14}}>Pan</button>
                <button className="cta-button secondary" style={{padding: '0.3rem 1.1rem', fontSize: 15, minWidth: 0, borderRadius: 14}}>Zoom</button>
                <button className="cta-button tertiary" style={{padding: '0.3rem 1.1rem', fontSize: 15, minWidth: 0, borderRadius: 14}}>←</button>
                <button className="cta-button tertiary" style={{padding: '0.3rem 1.1rem', fontSize: 15, minWidth: 0, borderRadius: 14}}>→</button>
                <button className="cta-button secondary" style={{padding: '0.3rem 1.1rem', fontSize: 15, minWidth: 0, borderRadius: 14}}>Undo</button>
                <button className="cta-button secondary" style={{padding: '0.3rem 1.1rem', fontSize: 15, minWidth: 0, borderRadius: 14}}>Redo</button>
              </div>
            )}
            {/* Demo Preview: Show uploaded image if present, else demo */}
            <div style={{marginTop: 40, marginBottom: 40}}>
              {uploadedImage ? (
                <div style={{position: 'relative', borderRadius: 18, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.13)'}}>
                  <BeforeAfterDemo ref={beforeAfterRef} />
                </div>
              ) : (
                <BeforeAfterDemo ref={beforeAfterRef} showOriginal={showOriginal} />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Powerful Features</h2>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-image">
                <img src={natureImg} alt="RAW Processing" />
              </div>
              <h3>RAW Processing</h3>
              <p>Professional RAW file conversion with advanced controls</p>
            </div>
            <div className="feature-card">
              <div className="feature-image">
                <img src={northernlightsImg} alt="Batch Processing" />
              </div>
              <h3>Batch Processing</h3>
              <p>Process multiple images simultaneously for efficiency</p>
            </div>
            <div className="feature-card">
              <div className="feature-image">
                <img src={cheetahImg} alt="Advanced Editing" />
              </div>
              <h3>Advanced Editing</h3>
              <p>Fine-tune every aspect of your images with precision tools</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; 2025 RawConverter. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
