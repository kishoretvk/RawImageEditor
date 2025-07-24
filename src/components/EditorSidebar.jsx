// EditorSidebar.jsx
// Sidebar for editor tools (Histogram, Crop, White Balance, etc.)
import React, { useEffect, useState } from 'react';
import Histogram from './Histogram';
import CropTool from './CropTool';
import WhiteBalanceTool from './WhiteBalanceTool';
import ResetTools from './ResetTools';

export default function EditorSidebar({ rawPixels, channelCount, onUndo, onRedo, onCrop, onWhiteBalance, onReset }) {
  const [bins, setBins] = useState(null);

  useEffect(() => {
    // Check if we have valid image data (should be a string URL, not an array)
    if (!rawPixels || typeof rawPixels !== 'string' || !channelCount) {
      setBins(null);
      return;
    }

    // For now, skip histogram generation as we need actual pixel data, not URL
    // This would need to be implemented with proper image processing
    setBins(null);
  }, [rawPixels, channelCount]);

  // Only check for string URL, not array
  if (!rawPixels || typeof rawPixels !== 'string') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6">
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📸</span>
          </div>
          <h3 className="text-white font-semibold text-lg mb-2">No Image Loaded</h3>
          <p className="text-white/60">Upload an image to access editing tools</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <h2 className="text-xl font-bold text-white flex items-center">
          <span className="w-3 h-3 bg-blue-400 rounded-full mr-3 animate-pulse"></span>
          Tools & Analysis
        </h2>
      </div>

      {/* Tools Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Histogram Section */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <h3 className="text-white font-semibold mb-3 flex items-center">
            📊 Histogram
          </h3>
          {bins ? (
            <Histogram bins={bins} />
          ) : (
            <div className="h-32 bg-black/30 rounded-lg flex items-center justify-center">
              <div className="animate-spin h-6 w-6 border-2 border-blue-400 border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <h3 className="text-white font-semibold mb-3 flex items-center">
            ⚡ Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={onUndo}
              className="px-3 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors text-sm font-semibold"
            >
              ↶ Undo
            </button>
            <button 
              onClick={onRedo}
              className="px-3 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors text-sm font-semibold"
            >
              ↷ Redo
            </button>
          </div>
        </div>

        {/* Crop Tool */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <h3 className="text-white font-semibold mb-3 flex items-center">
            ✂️ Crop & Transform
          </h3>
          <CropTool onChange={onCrop} />
        </div>

        {/* White Balance Tool */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <h3 className="text-white font-semibold mb-3 flex items-center">
            🎨 White Balance
          </h3>
          <WhiteBalanceTool onChange={onWhiteBalance} />
        </div>

        {/* Reset Tools */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <h3 className="text-white font-semibold mb-3 flex items-center">
            🔄 Reset Options
          </h3>
          <ResetTools onReset={onReset} />
        </div>
      </div>
    </div>
  );
}
