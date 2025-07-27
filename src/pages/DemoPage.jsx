import React from 'react';
import { Link } from 'react-router-dom';
import BeforeAfterDemo from '../components/BeforeAfterDemo';
import '../styles/pages.css';

const DemoPage = () => {
  return (
    <div className="page">
      <nav className="top-navigation">
        <div className="nav-container">
          <div className="logo">RawConverter</div>
          <div className="nav-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/editor" className="nav-link">Editor</Link>
            <Link to="/workflow" className="nav-link">Workflow</Link>
          </div>
        </div>
      </nav>
      
      <div className="page-content">
        <div className="container">
          <h1>Professional RAW Image Editor Demo</h1>
          <p>See all the enhanced features in action</p>
          
          <div className="demo-section">
            <h2>Interactive Before/After Comparison</h2>
            <p>Drag the slider to compare the original and edited images</p>
            <BeforeAfterDemo />
          </div>
          
          <div className="demo-section mt-8">
            <h2>Key Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              <div className="bg-gray-800 p-6 rounded-xl">
                <h3 className="text-xl font-bold mb-2">Professional Editing Tools</h3>
                <p className="text-gray-300">
                  Advanced controls for exposure, contrast, highlights, shadows, 
                  whites, blacks, clarity, vibrance, and saturation.
                </p>
              </div>
              
              <div className="bg-gray-800 p-6 rounded-xl">
                <h3 className="text-xl font-bold mb-2">Preset Management</h3>
                <p className="text-gray-300">
                  Save and apply editing presets for consistent results across 
                  multiple images.
                </p>
              </div>
              
              <div className="bg-gray-800 p-6 rounded-xl">
                <h3 className="text-xl font-bold mb-2">Batch Processing</h3>
                <p className="text-gray-300">
                  Process multiple images simultaneously with customizable 
                  workflows and preset application.
                </p>
              </div>
            </div>
          </div>
          
          <div className="demo-section mt-8">
            <h2>Try It Yourself</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="bg-gray-800 p-6 rounded-xl">
                <h3 className="text-xl font-bold mb-2">Single Image Editing</h3>
                <p className="text-gray-300 mb-4">
                  Edit individual images with professional-grade tools and 
                  see results in real-time.
                </p>
                <Link to="/editor" className="btn btn-primary">
                  Open Editor
                </Link>
              </div>
              
              <div className="bg-gray-800 p-6 rounded-xl">
                <h3 className="text-xl font-bold mb-2">Batch Processing</h3>
                <p className="text-gray-300 mb-4">
                  Process multiple images at once with customizable workflows 
                  and preset application.
                </p>
                <Link to="/workflow" className="btn btn-primary">
                  Open Workflow
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoPage;
