import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/pages.css';

const DemoPage = () => {
  return (
    <div className="page">
      <nav className="top-navigation">
        <div className="nav-container">
          <div className="logo">RawConverter</div>
          <div className="nav-links">
            <Link to="/editor" className="nav-link">Editor</Link>
            <Link to="/compression" className="nav-link">Compression</Link>
            <Link to="/raw-convert" className="nav-link">RAW Convert</Link>
            <Link to="/workflow" className="nav-link">Workflow</Link>
          </div>
        </div>
      </nav>
      
      <div className="page-content">
        <div className="container">
          <h1 className="text-4xl font-bold text-center mb-8">Professional RAW Image Editor</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
              <div className="text-3xl mb-4">📸</div>
              <h2 className="text-2xl font-bold mb-2">RAW Processing</h2>
              <p className="text-gray-300">
                Professional RAW file conversion with advanced controls for all major camera formats.
              </p>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
              <div className="text-3xl mb-4">🎨</div>
              <h2 className="text-2xl font-bold mb-2">Advanced Editing</h2>
              <p className="text-gray-300">
                Professional-grade editing tools including curves, HSL, and local adjustments.
              </p>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
              <div className="text-3xl mb-4">⚡</div>
              <h2 className="text-2xl font-bold mb-2">Batch Processing</h2>
              <p className="text-gray-300">
                Process multiple images simultaneously with preset workflows for efficiency.
              </p>
            </div>
          </div>
          
          <div className="text-center">
            <Link 
              to="/editor" 
              className="bg-gradient-to-r from-blue-600 to-purple-700 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg hover:from-blue-700 hover:to-purple-800 transition-all duration-300"
            >
              Try the Editor
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoPage;
