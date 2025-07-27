import React, { useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import EnhancedImageCanvas from './EnhancedImageCanvas';
import UnifiedSlider from './UnifiedSlider';
import cheetahImg from '../assets/images/cheetah-hotirontal.jpg';
import natureImg from '../assets/images/nature-horizontal.jpg';
import newyorkImg from '../assets/images/newyork-night.jpg';
import northernlightsImg from '../assets/images/northernlights.jpg';
import '../styles/unified-slider.css';

const BeforeAfterDemo = forwardRef((props, ref) => {
  const [sliderPosition, setSliderPosition] = useState(27); // Set to 27 as requested
  const [currentImageIndex, setCurrentImageIndex] = useState(2); // Set New York as default (index 2)
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  
  const containerRef = useRef(null);

  // Multiple sample images with different edit presets
  const sampleImages = [
    {
      url: cheetahImg,
      name: 'cheetah-horizontal.jpg',
      size: 2400000,
      title: 'Wildlife Photography',
      edits: {
        exposure: 0.4,
        contrast: 20,
        highlights: -30,
        shadows: 40,
        whites: 15,
        blacks: -20,
        clarity: 30,
        vibrance: 25,
        saturation: 15,
        temperature: 8,
        tint: 2
      }
    },
    {
      url: natureImg,
      name: 'nature-horizontal.jpg',
      size: 2800000,
      title: 'Landscape Enhancement',
      edits: {
        exposure: 0.2,
        contrast: 25,
        highlights: -40,
        shadows: 50,
        whites: 20,
        blacks: -25,
        clarity: 35,
        vibrance: 30,
        saturation: 20,
        temperature: -5,
        tint: -2
      }
    },
    {
      url: newyorkImg,
      name: 'newyork-night.jpg',
      size: 3200000,
      title: 'Urban Night Scene',
      edits: {
        exposure: 0.1,
        contrast: 30,
        highlights: -20,
        shadows: 60,
        whites: 10,
        blacks: -30,
        clarity: 25,
        vibrance: 20,
        saturation: 10,
        temperature: 10,
        tint: 3
      }
    },
    {
      url: northernlightsImg,
      name: 'northernlights.jpg',
      size: 2600000,
      title: 'Aurora Enhancement',
      edits: {
        exposure: 0.3,
        contrast: 15,
        highlights: -25,
        shadows: 45,
        whites: 25,
        blacks: -15,
        clarity: 40,
        vibrance: 35,
        saturation: 25,
        temperature: -10,
        tint: 5
      }
    }
  ];

  const currentImage = sampleImages[currentImageIndex];

  // Handle mouse drag for slider
  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    updateSliderPosition(e);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (isDragging) {
      updateSliderPosition(e);
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const updateSliderPosition = useCallback((e) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(percentage);
    }
  }, []);

  // Enhanced smooth animation function with crossfading
  const animateThroughImages = useCallback(async () => {
    if (isAnimating) return; // Prevent multiple animations
    
    setIsAnimating(true);
    setAnimationProgress(0);
    const totalCycleDuration = 12000; // 12 seconds total for smooth experience
    const imageDisplayTime = totalCycleDuration / sampleImages.length; // 3 seconds per image
    const sliderAnimationTime = imageDisplayTime * 0.7; // 70% of time for slider animation
    const transitionTime = imageDisplayTime * 0.3; // 30% for image transition
    
    for (let i = 0; i < sampleImages.length; i++) {
      // Update overall progress
      const overallProgress = (i / sampleImages.length) * 100;
      setAnimationProgress(overallProgress);
      
      // Smooth image transition with opacity fade
      if (i > 0) {
        // Add fade effect between images
        const container = containerRef.current;
        if (container) {
          container.style.transition = 'opacity 0.6s ease-in-out';
          container.style.opacity = '0.3';
          
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      // Set new image
      setCurrentImageIndex(i);
      
      // Restore opacity with new image
      if (containerRef.current) {
        containerRef.current.style.opacity = '1';
      }
      
      // Smooth slider animation with easing
      await new Promise(resolve => {
        const startTime = performance.now();
        const startPosition = 27;
        const endPosition = 100;
        const backPosition = 27;
        
        const animateSlider = (currentTime) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / sliderAnimationTime, 1);
          
          // Update progress for current image
          const imageProgress = (i + progress) / sampleImages.length * 100;
          setAnimationProgress(imageProgress);
          
          // Easing function for smooth animation (easeInOutCubic)
          const easeInOutCubic = (t) => {
            return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
          };
          
          const easedProgress = easeInOutCubic(progress);
          
          // First half: slide from 27 to 100
          if (progress <= 0.6) {
            const slideProgress = progress / 0.6;
            const easedSlideProgress = easeInOutCubic(slideProgress);
            const position = startPosition + (endPosition - startPosition) * easedSlideProgress;
            setSliderPosition(position);
            requestAnimationFrame(animateSlider);
          }
          // Second half: slide back to 27 smoothly
          else if (progress <= 1) {
            const returnProgress = (progress - 0.6) / 0.4;
            const easedReturnProgress = easeInOutCubic(returnProgress);
            const position = endPosition - (endPosition - backPosition) * easedReturnProgress;
            setSliderPosition(position);
            
            if (progress < 1) {
              requestAnimationFrame(animateSlider);
            } else {
              resolve();
            }
          }
        };
        
        requestAnimationFrame(animateSlider);
      });
      
      // Smooth pause between images
      if (i < sampleImages.length - 1) {
        await new Promise(resolve => setTimeout(resolve, transitionTime));
      }
    }
    
    // Final progress update
    setAnimationProgress(100);
    
    // Smooth return to New York image with final fade
    await new Promise(resolve => {
      if (containerRef.current) {
        containerRef.current.style.transition = 'opacity 0.8s ease-in-out';
        containerRef.current.style.opacity = '0.4';
      }
      setTimeout(resolve, 400);
    });
    
    setCurrentImageIndex(2); // New York image
    setSliderPosition(27);
    
    if (containerRef.current) {
      containerRef.current.style.opacity = '1';
      // Clean up inline styles after animation
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.style.transition = '';
          containerRef.current.style.opacity = '';
        }
      }, 800);
    }
    
    setIsAnimating(false);
    setAnimationProgress(0);
  }, [isAnimating, sampleImages.length]);

  // Add event listeners
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Expose the animation function via ref
  useImperativeHandle(ref, () => ({
    animateThroughImages
  }));

  return (
    <div className="before-after-demo">
      {/* Image Selector */}
      <div className="image-selector" style={{ 
        marginBottom: '40px', 
        textAlign: 'center',
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ 
          marginBottom: '25px', 
          color: '#2c3e50',
          fontSize: '1.6rem',
          fontWeight: '600',
          letterSpacing: '-0.01em'
        }}>
          Choose Your Editing Style:
        </h3>
        
        {/* Smooth Animation Progress Indicator */}
        {isAnimating && (
          <div style={{
            marginBottom: '20px',
            padding: '10px 20px',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            borderRadius: '15px',
            border: '1px solid rgba(76, 175, 80, 0.3)'
          }}>
            <div style={{
              fontSize: '14px',
              color: '#4CAF50',
              marginBottom: '8px',
              fontWeight: '600'
            }}>
              🎬 Showcasing Professional Edits... {Math.round(animationProgress)}%
            </div>
            <div style={{
              width: '100%',
              height: '4px',
              backgroundColor: 'rgba(76, 175, 80, 0.2)',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div 
                className={isAnimating ? 'progress-shimmer' : ''}
                style={{
                  width: `${animationProgress}%`,
                  height: '100%',
                  backgroundColor: '#4CAF50',
                  borderRadius: '2px',
                  transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: 'linear-gradient(90deg, #4CAF50 0%, #66BB6A 50%, #4CAF50 100%)',
                  backgroundSize: '200% 100%'
                }} 
              />
            </div>
          </div>
        )}
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '12px', 
          flexWrap: 'nowrap',
          maxWidth: '100%',
          margin: '0 auto',
          overflowX: 'auto',
          paddingBottom: '5px'
        }}>
          {sampleImages.map((img, index) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`image-selector-btn ${index === currentImageIndex ? 'active' : ''}`}
              style={{
                padding: '10px 18px',
                border: '2px solid',
                borderColor: index === currentImageIndex ? '#4CAF50' : '#e0e0e0',
                backgroundColor: index === currentImageIndex ? '#4CAF50' : 'white',
                color: index === currentImageIndex ? 'white' : '#333',
                borderRadius: '25px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                minWidth: 'auto',
                whiteSpace: 'nowrap',
                textTransform: 'capitalize',
                letterSpacing: '0.2px',
                boxShadow: index === currentImageIndex 
                  ? '0 4px 15px rgba(76, 175, 80, 0.3)' 
                  : '0 2px 8px rgba(0,0,0,0.1)',
                flexShrink: 0
              }}
            >
              {img.title}
            </button>
          ))}
        </div>
      </div>

      <div 
        ref={containerRef}
        className="demo-container"
        style={{ 
          position: 'relative', 
          width: '100%', 
          height: '550px',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 15px 40px rgba(0,0,0,0.15)',
          cursor: isDragging ? 'ew-resize' : 'default',
          border: '3px solid white'
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Enhanced Image Canvas with edits (RIGHT SIDE) */}
        <div 
          className="edited-image"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            clipPath: `polygon(${sliderPosition}% 0, 100% 0, 100% 100%, ${sliderPosition}% 100%)`,
            zIndex: 2
          }}
        >
          <EnhancedImageCanvas 
            imageSrc={currentImage}
            edits={currentImage.edits}
            showSlider={false}
            onProcessed={(data) => console.log('Processed:', data)}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        
        {/* Original image (LEFT SIDE) */}
        <div 
          className="original-image"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1
          }}
        >
          <img 
            src={currentImage.url} 
            alt="Original" 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover',
              userSelect: 'none',
              pointerEvents: 'none'
            }}
          />
        </div>
        
        {/* Enhanced Slider handle */}
        <div 
          className="slider-handle"
          style={{
            position: 'absolute',
            top: 0,
            left: `${sliderPosition}%`,
            transform: 'translateX(-50%)',
            height: '100%',
            width: '3px',
            backgroundColor: '#fff',
            zIndex: 10,
            cursor: 'ew-resize',
            boxShadow: '0 0 10px rgba(0,0,0,0.7)',
            pointerEvents: 'none'
          }}
        >
          {/* Top arrow */}
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '0',
            height: '0',
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderBottom: '12px solid #fff',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
          }}></div>
          
          {/* Center handle */}
          <div 
            className="handle-knob"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
              border: '3px solid #4CAF50'
            }}
          >
            {/* Left arrow */}
            <div style={{
              position: 'absolute',
              left: '12px',
              width: '0',
              height: '0',
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent',
              borderRight: '8px solid #4CAF50'
            }}></div>
            
            {/* Right arrow */}
            <div style={{
              position: 'absolute',
              right: '12px',
              width: '0',
              height: '0',
              borderTop: '6px solid transparent',
              borderBottom: '6px solid transparent',
              borderLeft: '8px solid #4CAF50'
            }}></div>
          </div>
          
          {/* Bottom arrow */}
          <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '0',
            height: '0',
            borderLeft: '8px solid transparent',
            borderRight: '8px solid transparent',
            borderTop: '12px solid #fff',
            filter: 'drop-shadow(0 -2px 4px rgba(0,0,0,0.3))'
          }}></div>
        </div>
      </div>
      
      {/* Enhanced Labels */}
      <div className="demo-labels" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginTop: '25px',
        padding: '0 30px'
      }}>
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '12px 20px', 
          borderRadius: '25px',
          fontSize: '15px',
          fontWeight: '600',
          color: '#6c757d',
          border: '2px solid #e9ecef'
        }}>
          📷 Original Image
        </div>
        <div style={{ 
          backgroundColor: '#4CAF50', 
          padding: '12px 20px', 
          borderRadius: '25px',
          fontSize: '15px',
          fontWeight: '600',
          color: 'white',
          boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)'
        }}>
          ✨ Enhanced Result
        </div>
      </div>
      
      {/* Slider Control */}
      <div style={{ 
        marginTop: '35px',
        backgroundColor: 'white',
        padding: '25px',
        borderRadius: '15px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        <UnifiedSlider
          min={0}
          max={100}
          value={sliderPosition}
          onChange={setSliderPosition}
          label="Drag to compare Before/After"
        />
      </div>
      
      {/* Current Image Info */}
      <div style={{ 
        textAlign: 'center', 
        marginTop: '25px',
        fontSize: '15px',
        color: '#6c757d',
        fontWeight: '500',
        backgroundColor: 'rgba(255,255,255,0.8)',
        padding: '15px',
        borderRadius: '10px',
        border: '1px solid #e9ecef'
      }}>
        <strong style={{ color: '#2c3e50' }}>{currentImage.title}</strong>
        <br />
        <span style={{ fontSize: '14px', opacity: '0.8' }}>
          Drag the slider above to see our professional editing transformation
        </span>
      </div>
    </div>
  );
});

BeforeAfterDemo.displayName = 'BeforeAfterDemo';

export default BeforeAfterDemo;
