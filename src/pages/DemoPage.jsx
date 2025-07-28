import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import BeforeAfterDemo from '../components/BeforeAfterDemo';
import ImageSlider from '../components/ImageSlider';
import '../styles/pages.css';

const DemoPage = () => {
  const [sliderPosition, setSliderPosition] = useState(50);
  
  // Sample images for demo
  const sampleImages = [
    { id: 1, name: 'Landscape', url: '../assets/images/nature-horizontal.jpg' },
    { id: 2, name: 'Night City', url: '../assets/images/newyork-night.jpg' },
    { id: 3, name: 'Wildlife', url: '../assets/images/cheetah-hotirontal.jpg' },
    { id: 4, name: 'Northern Lights', url: '../assets/images/northernlights.jpg' }
  ];
  
  const [selectedImage, setSelectedImage] = useState(sampleImages[0]);

  return (
    <div className="page">
      <nav className="top-navigation">
        <div className="nav-container">
          <div className="logo">RawConverter Pro</div>
          <div className="nav-links">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/editor" className="nav-link">Editor</Link>
            <Link to="/workflow" className="nav-link">Workflow</Link>
            <Link to="/compression" className="nav-link">Compression</Link>
          </div>
        </div>
      </nav>
      
      <div className="page-content">
        <div className="container mx-auto px-4 py-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Professional RAW Image Editing
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Experience world-class photo editing capabilities with our browser-based RAW processor. 
              No downloads required - edit anywhere, anytime.
            </p>
          </div>
          
          {/* Interactive Demo */}
          <div className="bg-gray-800 rounded-2xl p-6 mb-12 shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Live Editing Demo</h2>
            <BeforeAfterDemo />
          </div>
          
          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            <div className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-all duration-300">
              <div className="text-blue-500 text-3xl mb-4">📸</div>
              <h3 className="text-xl font-bold text-white mb-2">RAW Processing</h3>
              <p className="text-gray-400">
                Professional RAW file support with embedded thumbnail extraction and simulated processing for instant previews.
              </p>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-all duration-300">
              <div className="text-green-500 text-3xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-white mb-2">Batch Workflows</h3>
              <p className="text-gray-400">
                Create custom processing workflows and apply them to multiple images simultaneously with our powerful batch processor.
              </p>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-all duration-300">
              <div className="text-purple-500 text-3xl mb-4">🎨</div>
              <h3 className="text-xl font-bold text-white mb-2">Advanced Editing</h3>
              <p className="text-gray-400">
                Professional-grade tools including exposure, contrast, highlights, shadows, clarity, vibrance, and more.
              </p>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-all duration-300">
              <div className="text-yellow-500 text-3xl mb-4">📱</div>
              <h3 className="text-xl font-bold text-white mb-2">Cross-Platform</h3>
              <p className="text-gray-400">
                Works seamlessly on desktop, tablet, and mobile devices with touch-optimized controls.
              </p>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-all duration-300">
              <div className="text-red-500 text-3xl mb-4">🔒</div>
              <h3 className="text-xl font-bold text-white mb-2">Privacy First</h3>
              <p className="text-gray-400">
                All processing happens in your browser - your images never leave your device.
              </p>
            </div>
            
            <div className="bg-gray-800 rounded-xl p-6 hover:bg-gray-750 transition-all duration-300">
              <div className="text-indigo-500 text-3xl mb-4">💾</div>
              <h3 className="text-xl font-bold text-white mb-2">Preset Management</h3>
              <p className="text-gray-400">
                Save and apply your favorite editing settings with our powerful preset system.
              </p>
            </div>
          </div>
          
          {/* Image Gallery Demo */}
          <div className="bg-gray-800 rounded-2xl p-6 mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">Image Gallery</h2>
            
            {/* Image Selector */}
            <div className="flex flex-wrap justify-center gap-4 mb-6">
              {sampleImages.map((image) => (
                <button
                  key={image.id}
                  onClick={() => setSelectedImage(image)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    selectedImage.id === image.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {image.name}
                </button>
              ))}
            </div>
            
            {/* Image Slider */}
            <div className="h-96 rounded-xl overflow-hidden">
              <ImageSlider
                originalImage={selectedImage.url}
                editedImage={selectedImage.url}
                initialPosition={sliderPosition}
                onPositionChange={setSliderPosition}
              />
            </div>
          </div>
          
          {/* CTA Section */}
          <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Transform Your Images?</h2>
            <p className="text-xl text-blue-100 mb-6 max-w-2xl mx-auto">
              Join thousands of photographers who trust our platform for professional RAW image editing.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                to="/editor" 
                className="px-8 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100 transition-all shadow-lg"
              >
                Start Editing
              </Link>
              <Link 
                to="/workflow" 
                className="px-8 py-3 bg-transparent border-2 border-white text-white font-bold rounded-lg hover:bg-white hover:text-blue-600 transition-all"
              >
                Create Workflow
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoPage;
