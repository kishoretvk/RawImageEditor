// Histogram.jsx
// Functional histogram component that analyzes images and displays RGB histograms
import React, { useEffect, useRef, useState } from 'react';

export default function Histogram({ imageUrl, width = 256, height = 80 }) {
  const canvasRef = useRef(null);
  const [bins, setBins] = useState(null);
  const [loading, setLoading] = useState(false);

  // Function to calculate histogram from image data
  const calculateHistogram = (imageData) => {
    const data = imageData.data;
    const redBins = new Array(256).fill(0);
    const greenBins = new Array(256).fill(0);
    const blueBins = new Array(256).fill(0);

    // Count pixel values for each channel
    for (let i = 0; i < data.length; i += 4) {
      redBins[data[i]]++;
      greenBins[data[i + 1]]++;
      blueBins[data[i + 2]]++;
    }

    // Normalize bins (log scale for better visualization)
    const maxRed = Math.max(...redBins);
    const maxGreen = Math.max(...greenBins);
    const maxBlue = Math.max(...blueBins);

    const normalizeWithLog = (bins, max) => 
      bins.map(count => max > 0 ? Math.log1p(count) / Math.log1p(max) : 0);

    return [
      normalizeWithLog(redBins, maxRed),
      normalizeWithLog(greenBins, maxGreen),
      normalizeWithLog(blueBins, maxBlue)
    ];
  };

  // Load and analyze image
  useEffect(() => {
    if (!imageUrl) {
      setBins(null);
      return;
    }

    setLoading(true);
    const img = new Image();
    
    // Handle CORS for cross-origin images
    if (typeof imageUrl === 'string') {
      if (imageUrl.startsWith('http') && !imageUrl.startsWith(window.location.origin)) {
        img.crossOrigin = 'anonymous';
      }
    }
    
    img.onload = () => {
      try {
        // Create temporary canvas to extract image data
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        if (!tempCtx) {
          console.error('Failed to get canvas context for histogram');
          setBins(null);
          setLoading(false);
          return;
        }
        
        // Scale down for performance (sample every 4th pixel)
        const sampleWidth = Math.min(img.width, 512);
        const sampleHeight = Math.min(img.height, 512);
        
        tempCanvas.width = sampleWidth;
        tempCanvas.height = sampleHeight;
        
        tempCtx.drawImage(img, 0, 0, sampleWidth, sampleHeight);
        const imageData = tempCtx.getImageData(0, 0, sampleWidth, sampleHeight);
        
        const histogramBins = calculateHistogram(imageData);
        setBins(histogramBins);
        setLoading(false);
      } catch (error) {
        console.error('Error calculating histogram:', error);
        setBins(null);
        setLoading(false);
      }
    };

    img.onerror = (e) => {
      console.warn('Could not load image for histogram analysis. This is normal for blob URLs or edited images.');
      setBins(null);
      setLoading(false);
    };

    // Handle different image source types
    if (typeof imageUrl === 'string') {
      // Check if it's a valid URL format
      if (imageUrl.startsWith('blob:') || imageUrl.startsWith('data:') || imageUrl.startsWith('http')) {
        img.src = imageUrl;
      } else {
        console.warn('Invalid image URL format for histogram:', imageUrl);
        setBins(null);
        setLoading(false);
      }
    } else {
      console.warn('Invalid image URL type for histogram:', typeof imageUrl);
      setBins(null);
      setLoading(false);
    }
  }, [imageUrl]);

  // Draw histogram
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (loading) {
      // Draw loading state
      ctx.fillStyle = '#333';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#666';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Loading...', canvas.width / 2, canvas.height / 2);
      return;
    }

    if (!bins || !Array.isArray(bins)) {
      // Draw empty state
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#666';
      ctx.font = '11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('No Image', canvas.width / 2, canvas.height / 2);
      return;
    }

    // Draw background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const x = (i * canvas.width) / 4;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Draw histogram channels
    const colors = ['#ff4444', '#44ff44', '#4444ff']; // Red, Green, Blue
    const channelNames = ['Red', 'Green', 'Blue'];
    
    bins.forEach((channelBins, channelIdx) => {
      if (!channelBins) return;
      
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = colors[channelIdx];
      
      const barWidth = canvas.width / channelBins.length;
      
      channelBins.forEach((normalizedCount, i) => {
        const x = i * barWidth;
        const barHeight = normalizedCount * canvas.height;
        
        if (barHeight > 0) {
          ctx.fillRect(x, canvas.height - barHeight, Math.max(1, barWidth - 0.5), barHeight);
        }
      });
    });

    ctx.globalAlpha = 1;

    // Draw channel labels
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    bins.forEach((_, channelIdx) => {
      ctx.fillStyle = colors[channelIdx];
      ctx.fillText(channelNames[channelIdx], 4, 12 + channelIdx * 12);
    });

  }, [bins, loading]);

  return (
    <div className="histogram-container">
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height} 
        style={{ 
          width: '100%', 
          height: height, 
          border: '1px solid #333',
          borderRadius: '4px',
          background: '#1a1a1a'
        }} 
      />
    </div>
  );
}
