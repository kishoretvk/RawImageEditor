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
            <Link to="/compression" className="nav-link">Compression</Link>
            <Link to="/raw-convert" className="nav-link">RAW Convert</Link>
            <Link to="/workflow" className="nav-link">Workflow</Link>
          </div>
        </div>
      </nav>
      
      <div className="page-content">
        <div className="container">
          <h1 className="text-3xl font-bold mb-6 text-center">Professional RAW Image Editor Demo</h1>
          <p className="text-center mb-8 text-gray-600">
            Experience our world-class photo editing capabilities with before/after comparison
          </p>
          
          <BeforeAfterDemo />
          
          <div className="mt-12 bg-blue-50 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-blue-800">Key Professional Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-bold text-lg mb-2">Advanced Editing Tools</h3>
                <p className="text-gray-600">Professional controls for exposure, contrast, highlights, shadows, and more</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-bold text-lg mb-2">RAW Processing</h3>
                <p className="text-gray-600">Full support for all major RAW formats with professional quality</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-bold text-lg mb-2">Workflow Automation</h3>
                <p className="text-gray-600">Create and apply presets to multiple images with batch processing</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-bold text-lg mb-2">Cross-Platform</h3>
                <p className="text-gray-600">Works on all devices - iPad, MacBook, Windows, Linux, Chrome, Android, iOS</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-bold text-lg mb-2">Browser-Based</h3>
                <p className="text-gray-600">No server processing - all editing happens directly in your browser</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h3 className="font-bold text-lg mb-2">WebAssembly</h3>
                <p className="text-gray-600">Lightning-fast performance with WebAssembly acceleration</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <Link 
              to="/workflow" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg inline-block transition duration-300"
            >
              Try Workflow Automation
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoPage;
