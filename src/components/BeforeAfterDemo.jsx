import React, { useState } from 'react';
import ImageSlider from './ImageSlider';
import './BeforeAfterDemo.css';

const BeforeAfterDemo = () => {
  const [selectedDemo, setSelectedDemo] = useState('portrait');

  const demoImages = {
    portrait: {
      before: '/src/assets/images/portrait-before.jpg',
      after: '/src/assets/images/portrait-after.jpg',
      title: 'Portrait Enhancement',
      description: 'Professional skin retouching, color grading, and lighting adjustments'
    },
    landscape: {
      before: '/src/assets/images/landscape-before.jpg',
      after: '/src/assets/images/landscape-after.jpg',
      title: 'Landscape Enhancement',
      description: 'Dynamic range expansion, color vibrancy, and atmospheric enhancement'
    },
    night: {
      before: '/src/assets/images/night-before.jpg',
      after: '/src/assets/images/night-after.jpg',
      title: 'Night Photography',
      description: 'Noise reduction, star enhancement, and light pollution correction'
    }
  };

  // Fallback images if demo images don't exist
  const fallbackImages = {
    before: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    after: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop&sat=150&con=120'
  };

  const currentDemo = demoImages[selectedDemo] || demoImages.portrait;

  return (
    <section className="before-after-demo">
      <div className="demo-container">
        <h2 className="demo-title">See the Magic in Action</h2>
        <p className="demo-subtitle">
          Drag the slider to compare RAW processing before and after our AI-powered enhancements
        </p>

        <div className="demo-controls">
          {Object.entries(demoImages).map(([key, demo]) => (
            <button
              key={key}
              className={`demo-button ${selectedDemo === key ? 'active' : ''}`}
              onClick={() => setSelectedDemo(key)}
            >
              {demo.title}
            </button>
          ))}
        </div>

        <div className="slider-container">
          <ImageSlider
            beforeImage={currentDemo.before}
            afterImage={currentDemo.after}
            width={800}
            height={600}
          />
        </div>

        <div className="demo-info">
          <h3>{currentDemo.title}</h3>
          <p>{currentDemo.description}</p>
        </div>
      </div>
    </section>
  );
};

export default BeforeAfterDemo;
