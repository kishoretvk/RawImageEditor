import React, { useState, useRef, useEffect } from 'react';
import { ChevronRightIcon, CameraIcon, AdjustmentsHorizontalIcon, SparklesIcon } from '@heroicons/react/24/outline';

// Import images
import cheetah from '../assets/images/cheetah-hotirontal.jpg';
import elephant from '../assets/images/elephant-hotirontal.jpg';
import lava from '../assets/images/lava.jpg';
import nature from '../assets/images/nature-horizontal.jpg';
import newyork from '../assets/images/newyork-night.jpg';
import northernlights from '../assets/images/northernlights.jpg';
import tree from '../assets/images/tree-horozontal.jpg';

// Filter functions for real-time preview
const applyFilter = (canvas, ctx, imageData, filterType, intensity) => {
  const data = imageData.data;
  const width = imageData.width;
  const height = imageData.height;
  
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    
    switch (filterType) {
      case 'exposure':
        const exposureAdjust = (intensity - 1) * 100;
        r = Math.max(0, Math.min(255, r + exposureAdjust));
        g = Math.max(0, Math.min(255, g + exposureAdjust));
        b = Math.max(0, Math.min(255, b + exposureAdjust));
        break;
        
      case 'contrast':
        const contrastFactor = intensity * 2;
        const factor = (259 * (contrastFactor * 255 + 255)) / (255 * (259 - contrastFactor * 255));
        r = Math.max(0, Math.min(255, factor * (r - 128) + 128));
        g = Math.max(0, Math.min(255, factor * (g - 128) + 128));
        b = Math.max(0, Math.min(255, factor * (b - 128) + 128));
        break;
        
      case 'vibrance':
        const avg = (r + g + b) / 3;
        const vibranceBoost = (intensity - 1) * 2;
        r = Math.max(0, Math.min(255, r + (r - avg) * vibranceBoost));
        g = Math.max(0, Math.min(255, g + (g - avg) * vibranceBoost));
        b = Math.max(0, Math.min(255, b + (b - avg) * vibranceBoost));
        break;
    }
    
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }
  
  ctx.putImageData(imageData, 0, 0);
};

const FilterPreviewCard = ({ image, filterName, filterType, description, index }) => {
  const canvasRef = useRef(null);
  const originalImageRef = useRef(null);
  const [sliderValue, setSliderValue] = useState(1);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const img = new Image();
    
    img.onload = () => {
      // Set canvas size to match image aspect ratio
      const aspectRatio = img.width / img.height;
      const canvasWidth = 300;
      const canvasHeight = canvasWidth / aspectRatio;
      
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      
      // Store original image
      originalImageRef.current = img;
      
      // Draw initial image
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
      setIsLoaded(true);
    };
    
    img.crossOrigin = 'anonymous';
    img.src = image;
  }, [image]);

  const handleSliderChange = (value) => {
    setSliderValue(value);
    
    if (!isLoaded || !originalImageRef.current || isProcessing) return;
    
    setIsProcessing(true);
    
    // Use requestAnimationFrame for smooth updates
    requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const img = originalImageRef.current;
      
      // Clear and redraw original
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Get image data and apply filter
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      applyFilter(canvas, ctx, imageData, filterType, value);
      
      setIsProcessing(false);
    });
  };

  const toggleComparison = () => {
    setShowComparison(!showComparison);
    if (!showComparison) {
      // Show split view
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      const img = originalImageRef.current;
      
      // Left half: original
      ctx.clearRect(0, 0, canvas.width / 2, canvas.height);
      ctx.drawImage(img, 0, 0, img.width / 2, img.height, 0, 0, canvas.width / 2, canvas.height);
      
      // Right half: filtered
      ctx.clearRect(canvas.width / 2, 0, canvas.width / 2, canvas.height);
      ctx.drawImage(img, img.width / 2, 0, img.width / 2, img.height, canvas.width / 2, 0, canvas.width / 2, canvas.height);
      
      const rightImageData = ctx.getImageData(canvas.width / 2, 0, canvas.width / 2, canvas.height);
      applyFilter(canvas, ctx, rightImageData, filterType, sliderValue);
      ctx.putImageData(rightImageData, canvas.width / 2, 0);
      
      // Add split line
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.stroke();
    } else {
      // Show full filtered view
      handleSliderChange(sliderValue);
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 transform transition-all duration-300 hover:scale-105 hover:shadow-3xl group">
      <div className="relative overflow-hidden rounded-xl mb-4">
        <canvas 
          ref={canvasRef}
          className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
          style={{ imageRendering: 'auto' }}
        />
        {showComparison && (
          <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
            Original | Enhanced
          </div>
        )}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">{filterName}</h3>
          <button
            onClick={toggleComparison}
            className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
          >
            {showComparison ? 'Full View' : 'Compare'}
          </button>
        </div>
        
        <p className="text-gray-600 text-sm">{description}</p>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Intensity</span>
            <span>{((sliderValue - 1) * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.01"
            value={sliderValue}
            onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-thumb"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #8b5cf6 ${(sliderValue / 2) * 100}%, #e5e7eb ${(sliderValue / 2) * 100}%, #e5e7eb 100%)`
            }}
            disabled={isProcessing}
          />
        </div>
        
        <button
          onClick={() => window.location.href = '/editor'}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-xl hover:from-blue-700 hover:to-purple-700 transform transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
        >
          Edit This Style
        </button>
      </div>
    </div>
  );
};

const Home = () => {
  const showcaseFilters = [
    {
      image: cheetah,
      filterName: "Exposure Enhancement",
      filterType: "exposure",
      description: "Perfect lighting for wildlife photography. Bring out details in shadows and highlights."
    },
    {
      image: northernlights,
      filterName: "Contrast Boost",
      filterType: "contrast", 
      description: "Enhance dramatic skies and landscapes. Make your night photography pop."
    },
    {
      image: nature,
      filterName: "Vibrance Control",
      filterType: "vibrance",
      description: "Natural color enhancement for stunning nature shots. Avoid oversaturation."
    },
    {
      image: elephant,
      filterName: "HDR Tone Mapping",
      filterType: "exposure",
      description: "Reveal details in both shadows and highlights for perfect wildlife portraits."
    },
    {
      image: tree,
      filterName: "Nature Enhancement", 
      filterType: "vibrance",
      description: "Bring out the natural beauty of landscapes while maintaining realistic colors."
    },
    {
      image: lava,
      filterName: "Dynamic Range",
      filterType: "contrast",
      description: "Capture the full spectrum of light in challenging conditions."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-purple-900/20"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-full px-6 py-2 mb-8">
              <CameraIcon className="w-5 h-5 text-blue-400" />
              <span className="text-blue-300 font-medium">Professional RAW Processing</span>
            </div>
            
            <h1 className="text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent leading-tight">
              Unleash Your
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Wildlife Vision
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Transform your RAW captures into masterpieces with professional-grade tools designed for 
              wildlife and nature photographers. Real-time processing, advanced filters, and intuitive controls.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
              <button
                className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold px-8 py-4 rounded-xl shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
                onClick={() => window.location.href = '/upload'}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>Start Processing</span>
                  <ChevronRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </button>
              
              <button
                className="group bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold px-8 py-4 rounded-xl hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
                onClick={() => window.location.href = '/editor'}
              >
                <div className="flex items-center justify-center gap-2">
                  <AdjustmentsHorizontalIcon className="w-5 h-5" />
                  <span>Try Live Demo</span>
                </div>
              </button>
              
              <button
                className="group bg-white/10 backdrop-blur-sm border border-white/20 text-white font-bold px-8 py-4 rounded-xl hover:bg-white/20 transition-all duration-300 transform hover:scale-105"
                onClick={() => window.location.href = '/demo'}
              >
                <div className="flex items-center justify-center gap-2">
                  <SparklesIcon className="w-5 h-5" />
                  <span>View Features</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Filter Showcase */}
      <div className="py-20 bg-gradient-to-b from-slate-900 to-slate-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-full px-6 py-2 mb-6">
              <SparklesIcon className="w-5 h-5 text-purple-400" />
              <span className="text-purple-300 font-medium">Live Filter Preview</span>
            </div>
            
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              See the Magic in Action
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Experience real-time processing with our most popular filters. 
              Drag the sliders to see instant transformations on professional wildlife photography.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {showcaseFilters.map((filter, index) => (
              <FilterPreviewCard key={index} {...filter} index={index} />
            ))}
          </div>
          
          <div className="text-center">
            <p className="text-gray-400 mb-6">
              Ready to transform your entire photo collection?
            </p>
            <button
              onClick={() => window.location.href = '/upload'}
              className="bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold px-12 py-4 rounded-xl shadow-lg hover:from-green-700 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl"
            >
              Upload Your RAW Files
            </button>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-20 bg-slate-800">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
            Professional Tools for Every Shot
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-8 bg-gradient-to-b from-blue-900/30 to-transparent rounded-2xl border border-blue-500/20">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CameraIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">RAW Support</h3>
              <p className="text-gray-300">
                Native support for Canon, Nikon, Sony, and all major camera formats. 
                Preserve every detail from your original capture.
              </p>
            </div>
            
            <div className="text-center p-8 bg-gradient-to-b from-purple-900/30 to-transparent rounded-2xl border border-purple-500/20">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <AdjustmentsHorizontalIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Advanced Controls</h3>
              <p className="text-gray-300">
                Professional-grade adjustment tools including curves, masking, 
                and local adjustments for precise control.
              </p>
            </div>
            
            <div className="text-center p-8 bg-gradient-to-b from-green-900/30 to-transparent rounded-2xl border border-green-500/20">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <SparklesIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Real-time Processing</h3>
              <p className="text-gray-300">
                See your edits instantly with our optimized processing engine. 
                No waiting, just pure creative flow.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Camera Support */}
      <div className="py-16 bg-gradient-to-b from-slate-800 to-slate-900">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h3 className="text-2xl font-semibold mb-8 text-gray-300">
            Trusted by Wildlife Photographers Worldwide
          </h3>
          <div className="flex justify-center items-center gap-12 opacity-60">
            <div className="text-gray-400 font-bold text-lg">CANON</div>
            <div className="text-gray-400 font-bold text-lg">NIKON</div>
            <div className="text-gray-400 font-bold text-lg">SONY</div>
            <div className="text-gray-400 font-bold text-lg">FUJI</div>
            <div className="text-gray-400 font-bold text-lg">OLYMPUS</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
