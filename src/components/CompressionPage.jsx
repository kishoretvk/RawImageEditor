import React, { useState } from 'react';
import EditorLayout from './EditorLayout';
import FileUploader from './FileUploader';
import ImageCanvas from './ImageCanvas';
import '../styles/global.css';

const CompressionPage = () => {
  const [originalImage, setOriginalImage] = useState(null);
  const [compressedImage, setCompressedImage] = useState(null);
  const [compression, setCompression] = useState(1);
  const [customMode, setCustomMode] = useState(false);
  const [sliderValue, setSliderValue] = useState(50);
  const [showPreview, setShowPreview] = useState(false);

  // Helper function to calculate file size
  const calculateFileSize = (imageUrl) => {
    if (!imageUrl) return 'Unknown';
    try {
      if (imageUrl.startsWith('data:')) {
        // For data URLs, calculate from base64
        const base64 = imageUrl.split(',')[1] || '';
        return (window.atob(base64).length / 1024 / 1024).toFixed(2);
      } else if (imageUrl.startsWith('blob:')) {
        // For blob URLs, we can't get exact size, show estimated
        return 'Blob';
      }
    } catch (e) {
      console.error('Error calculating file size:', e);
    }
    return 'Unknown';
  };

  // Dummy compression logic for demo
  const handleCompress = () => {
    // Simulate compression by reducing quality
    if (!originalImage) return;
    const img = new window.Image();
    img.src = originalImage;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      // Simulate compression by lowering quality
      const quality = Math.max(0.01, Math.min(1, (customMode ? sliderValue : compression * 20) / 100));
      const compressedUrl = canvas.toDataURL('image/jpeg', quality);
      setCompressedImage(compressedUrl);
      setShowPreview(true);
    };
  };

  // Slider for before/after preview
  const [sliderPos, setSliderPos] = useState(50);

  return (
    <EditorLayout
      currentImage={compressedImage || originalImage}
      controls={(
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Compression Controls</h2>
          <div className="flex gap-4 mb-6">
            {[1,2,3,4,5].map(x => (
              <button key={x} onClick={() => { setCompression(x); setCustomMode(false); }}
                className={`px-4 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg transition-all duration-300 ${compression===x&&!customMode?'scale-105':''}`}
              >{x}x</button>
            ))}
            <button onClick={() => setCustomMode(true)}
              className={`px-4 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-pink-500 to-purple-600 shadow-lg transition-all duration-300 ${customMode?'scale-105':''}`}
            >Custom</button>
          </div>
          <div className="w-full flex flex-col items-center mb-6">
            <label className="text-white mb-2 text-lg font-semibold">Compression: {customMode ? sliderValue : compression * 20}x</label>
            <input type="range" min={1} max={100} value={customMode ? sliderValue : compression * 20} onChange={e => { setSliderValue(Number(e.target.value)); setCustomMode(true); }}
              className="w-72 h-3 bg-purple-200 rounded-lg appearance-none cursor-pointer shadow-lg" />
          </div>
          <div className="flex gap-4 mb-8">
            <button onClick={handleCompress} disabled={!originalImage}
              className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-all duration-300"
            >Compress</button>
            {showPreview && compressedImage && (
              <a
                href={compressedImage}
                download="compressed.jpg"
                className="btn btn-success btn-lg shadow-lg transition-all duration-300 hover:scale-105"
              >Download</a>
            )}
          </div>

        </div>
      )}
    >
      <div className="w-full max-w-4xl mx-auto px-4 py-8 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-white mb-2 mt-2">Image Compression</h1>
        <p className="text-lg text-white/70 mb-8">Optimize your images for web and storage</p>
        <FileUploader onFileUpload={setOriginalImage} />
        {showPreview && originalImage && compressedImage && (
          <div className="relative w-full max-w-xl h-[400px] bg-black rounded-xl overflow-hidden shadow-2xl mt-8">
            {/* Before/After slider */}
            <div className="absolute inset-0">
              <img src={originalImage} alt="Before" className="absolute inset-0 w-full h-full object-contain" style={{clipPath:`inset(0 ${100-sliderPos}% 0 0)`}} />
              <img src={compressedImage} alt="After" className="absolute inset-0 w-full h-full object-contain" style={{clipPath:`inset(0 0 0 ${sliderPos}%)`}} />
              {/* Vertical slider */}
              <input type="range" min={0} max={100} value={sliderPos} onChange={e=>setSliderPos(Number(e.target.value))}
                className="absolute top-0 left-0 h-full w-3 bg-blue-500/40 rounded-full appearance-none cursor-ew-resize z-10 shadow-lg"
                style={{left:`calc(${sliderPos}% - 1.5px)`}} />
              <div className="absolute top-0" style={{left:`calc(${sliderPos}% - 8px)`}}>
                <div className="w-4 h-full bg-gradient-to-b from-blue-500/60 to-green-500/60 rounded-full opacity-70 pointer-events-none"></div>
              </div>
              {/* Lightroom style labels */}
              <div className="absolute top-4 left-4 bg-black/70 px-3 py-1 rounded-lg text-white text-sm font-semibold shadow">Before<br/>{originalImage && typeof originalImage === 'string' ? `${(window.atob(originalImage.split(',')[1]||'').length/1024/1024).toFixed(2)} MB` : ''}</div>
              <div className="absolute top-4 right-4 bg-black/70 px-3 py-1 rounded-lg text-white text-sm font-semibold shadow">After<br/>{compressedImage && typeof compressedImage === 'string' ? `${(window.atob(compressedImage.split(',')[1]||'').length/1024/1024).toFixed(2)} MB` : ''}</div>
            </div>
            <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2">
              <a
                href={compressedImage}
                download="compressed.jpg"
                className="btn btn-success btn-lg shadow-lg transition-all duration-300 hover:scale-105"
              >
                Download
              </a>
              <div className="text-white/80 text-xs font-semibold">Compressed size: {compressedImage && typeof compressedImage === 'string' ? `${(window.atob(compressedImage.split(',')[1]||'').length/1024/1024).toFixed(2)} MB` : ''}</div>
            </div>
          </div>
        )}
      </div>
    </EditorLayout>
  );
};

export default CompressionPage;
