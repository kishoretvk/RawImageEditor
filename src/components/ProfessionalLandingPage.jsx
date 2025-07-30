import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ImageSlider from './ImageSlider';
import FileUploader from './FileUploader';
import { 
  CameraIcon, 
  SparklesIcon, 
  AdjustmentsHorizontalIcon,
  ArrowDownTrayIcon,
  ClockIcon,
  ShieldCheckIcon,
  GlobeAltIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

// Sample images for demonstration
import cheetahOriginal from '../assets/images/cheetah-hotirontal.jpg';
import natureOriginal from '../assets/images/nature-horizontal.jpg';
import newyorkOriginal from '../assets/images/newyork-night.jpg';
import northernlightsOriginal from '../assets/images/northernlights.jpg';

const ProfessionalLandingPage = () => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [activeDemo, setActiveDemo] = useState(0);
  const heroRef = useRef(null);

  const demoImages = [
    {
      original: cheetahOriginal,
      edited: cheetahOriginal,
      title: "Wildlife Enhancement",
      description: "Professional wildlife photography with enhanced details and natural colors"
    },
    {
      original: natureOriginal,
      edited: natureOriginal,
      title: "Landscape Mastery",
      description: "Breathtaking landscape processing with perfect dynamic range"
    },
    {
      original: newyorkOriginal,
      edited: newyorkOriginal,
      title: "Urban Night Photography",
      description: "City lights and night scenes with professional color grading"
    },
    {
      original: northernlightsOriginal,
      edited: northernlightsOriginal,
      title: "Aurora Processing",
      description: "Northern lights with enhanced vibrancy and clarity"
    }
  ];

  const features = [
    {
      icon: CameraIcon,
      title: "RAW Processing",
      description: "Support for 800+ camera models including Canon, Nikon, Sony, Fuji, and more",
      stats: "800+ formats"
    },
    {
      icon: SparklesIcon,
      title: "Real-time Processing",
      description: "WebAssembly-powered processing with GPU acceleration for instant results",
      stats: "10x faster"
    },
    {
      icon: AdjustmentsHorizontalIcon,
      title: "Professional Tools",
      description: "Curves, levels, color grading, noise reduction, and advanced masking",
      stats: "50+ tools"
    },
    {
      icon: ArrowDownTrayIcon,
      title: "Batch Processing",
      description: "Process hundreds of images with custom workflows and presets",
      stats: "Unlimited"
    },
    {
      icon: ClockIcon,
      title: "Workflow Automation",
      description: "Create custom processing pipelines for consistent results",
      stats: "100% automated"
    },
    {
      icon: ShieldCheckIcon,
      title: "Privacy First",
      description: "All processing happens in your browser - no uploads to servers",
      stats: "100% private"
    }
  ];

  const cameraBrands = [
    { name: "Canon", models: ["EOS R5", "EOS R6", "5D Mark IV", "6D Mark II"] },
    { name: "Nikon", models: ["Z9", "Z7 II", "D850", "D750"] },
    { name: "Sony", models: ["A7R V", "A7 IV", "A9 III", "A1"] },
    { name: "Fujifilm", models: ["X-T5", "X-H2", "GFX100S", "X-Pro3"] },
    { name: "Olympus", models: ["OM-1", "OM-D E-M1 III", "PEN-F"] },
    { name: "Panasonic", models: ["S5 II", "GH6", "S1R", "G9"] }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveDemo((prev) => (prev + 1) % demoImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-slate-900/80 backdrop-blur-md border-b border-slate-700/50 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <CameraIcon className="h-8 w-8 text-blue-400 mr-2" />
              <span className="text-xl font-bold text-white">RawConverter Pro</span>
            </div>
            <div className="hidden md:flex space-x-8">
              <button onClick={() => scrollToSection('features')} className="text-gray-300 hover:text-white transition-colors">
                Features
              </button>
              <button onClick={() => scrollToSection('demo')} className="text-gray-300 hover:text-white transition-colors">
                Demo
              </button>
              <button onClick={() => scrollToSection('workflow')} className="text-gray-300 hover:text-white transition-colors">
                Workflow
              </button>
              <Link to="/editor" className="text-gray-300 hover:text-white transition-colors">
                Editor
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/upload"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Upload RAW
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="pt-16 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Professional RAW
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {" "}Processing
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Transform your RAW images with professional-grade tools. Process 800+ camera formats 
              with WebAssembly-powered speed and precision.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                to="/upload"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
              >
                Start Processing Now
              </Link>
              <button
                onClick={() => scrollToSection('demo')}
                className="border border-gray-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-gray-800 transition-all"
              >
                View Live Demo
              </button>
            </div>

            {/* Quick Upload */}
            <div className="max-w-md mx-auto">
              <FileUploader 
                onFileUpload={setUploadedImage} 
                multiple={false}
                className="bg-slate-800/50 border border-slate-600 rounded-xl p-6"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Live Demo Section */}
      <section id="demo" className="py-20 bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Live Before/After Demo</h2>
            <p className="text-gray-300">See professional processing in action</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl font-semibold text-white mb-4">
                {demoImages[activeDemo].title}
              </h3>
              <p className="text-gray-300 mb-6">
                {demoImages[activeDemo].description}
              </p>
              
              <div className="space-y-4">
                {demoImages.map((demo, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveDemo(index)}
                    className={`w-full text-left p-4 rounded-lg transition-all ${
                      activeDemo === index 
                        ? 'bg-blue-600/20 border border-blue-500' 
                        : 'bg-slate-700/50 hover:bg-slate-700'
                    }`}
                  >
                    <h4 className="font-semibold text-white">{demo.title}</h4>
                    <p className="text-sm text-gray-300">{demo.description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-slate-900 rounded-xl p-4 shadow-2xl">
                <ImageSlider
                  originalImage={demoImages[activeDemo].original}
                  editedImage={demoImages[activeDemo].edited}
                  className="rounded-lg"
                />
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-400">Drag the slider to compare</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Professional Features</h2>
            <p className="text-gray-300">Everything you need for professional RAW processing</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 hover:border-blue-500 transition-all">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-300 mb-3">{feature.description}</p>
                <span className="text-blue-400 font-semibold">{feature.stats}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Camera Support */}
      <section className="py-20 bg-slate-800/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">Supported Cameras</h2>
            <p className="text-gray-300">800+ camera models supported</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {cameraBrands.map((brand, index) => (
              <div key={index} className="bg-slate-800 rounded-lg p-4 text-center">
                <h3 className="text-white font-semibold mb-2">{brand.name}</h3>
                <div className="text-xs text-gray-400">
                  {brand.models.slice(0, 2).join(", ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section id="workflow" className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">Professional Workflow</h2>
            <p className="text-gray-300">Create custom processing pipelines</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-semibold text-white mb-4">Build Your Workflow</h3>
              <p className="text-gray-300 mb-6">
                Create custom processing pipelines with presets, batch operations, and export settings.
                Save and reuse workflows for consistent results across your entire photo collection.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">1</div>
                  <div>
                    <h4 className="text-white font-semibold">Upload RAW Files</h4>
                    <p className="text-gray-300 text-sm">Drag and drop or select multiple RAW files</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">2</div>
                  <div>
                    <h4 className="text-white font-semibold">Apply Presets & Adjustments</h4>
                    <p className="text-gray-300 text-sm">Use professional presets or create custom adjustments</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">3</div>
                  <div>
                    <h4 className="text-white font-semibold">Batch Process</h4>
                    <p className="text-gray-300 text-sm">Process entire collections with consistent settings</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">4</div>
                  <div>
                    <h4 className="text-white font-semibold">Export & Share</h4>
                    <p className="text-gray-300 text-sm">Export in multiple formats with professional quality</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Quick Start</h3>
              <div className="space-y-4">
                <Link
                  to="/upload"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center"
                >
                  Upload RAW Files
                  <ChevronRightIcon className="w-5 h-5 ml-2" />
                </Link>
                <Link
                  to="/editor"
                  className="w-full bg-slate-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-600 transition-all flex items-center justify-center"
                >
                  Try Live Editor
                  <ChevronRightIcon className="w-5 h-5 ml-2" />
                </Link>
                <Link
                  to="/workflow"
                  className="w-full border border-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-all flex items-center justify-center"
                >
                  Build Workflow
                  <ChevronRightIcon className="w-5 h-5 ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-700 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <CameraIcon className="h-8 w-8 text-blue-400 mr-2" />
                <span className="text-xl font-bold text-white">RawConverter Pro</span>
              </div>
              <p className="text-gray-300 text-sm">
                Professional RAW image processing in your browser. No uploads, no servers, just pure performance.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><Link to="/editor" className="hover:text-white transition-colors">Live Editor</Link></li>
                <li><Link to="/upload" className="hover:text-white transition-colors">Batch Upload</Link></li>
                <li><Link to="/workflow" className="hover:text-white transition-colors">Workflow Builder</Link></li>
                <li><Link to="/compression" className="hover:text-white transition-colors">Compression</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><a href="https://github.com/kishoretvk/RawImageEditor" className="hover:text-white transition-colors">GitHub</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <div className="flex items-center space-x-2 text-sm text-gray-300">
                <GlobeAltIcon className="w-5 h-5" />
                <span>Works on all devices</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Chrome, Firefox, Safari, Edge, iOS, Android, Windows, macOS, Linux
              </p>
            </div>
          </div>
          <div className="border-t border-slate-700 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2025 RawConverter Pro. Built with WebAssembly and modern web technologies.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ProfessionalLandingPage;
