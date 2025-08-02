// EditorSidebar.jsx
// Sidebar for editor tools (Histogram, Crop, White Balance, etc.)
import React, { useEffect, useState, useContext } from 'react';
import Histogram from './Histogram';
import CropTool from './CropTool';
import WhiteBalanceTool from './WhiteBalanceTool';
import ResetTools from './ResetTools';
import UnifiedSlider from './UnifiedSlider';
import { EditorContext } from '../context/EditorContext.jsx';

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

  const { state, dispatch } = useContext(EditorContext);
  const basic = state?.basic ?? { exposure: 0, contrast: 0, highlights: 0, shadows: 0, whites: 0, blacks: 0, gamma: 1 };

  const setBasic = (patch) => {
    const next = { ...basic, ...patch };
    dispatch({ type: 'SET_BASIC', payload: next });
  };

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

        {/* Basic Adjustments */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
          <h3 className="text-white font-semibold mb-3 flex items-center">
            🛠️ Basic Adjustments
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-white/80 mb-1">
                <span>Exposure</span>
                <span>{Number.isFinite(basic.exposure) ? basic.exposure.toFixed(2) : '0.00'} EV</span>
              </div>
              <UnifiedSlider
                min={-5}
                max={5}
                step={0.01}
                value={Number.isFinite(basic.exposure) ? basic.exposure : 0}
                onChange={(v) => setBasic({ exposure: v })}
              />
            </div>

            <div>
              <div className="flex justify-between text-sm text-white/80 mb-1">
                <span>Contrast</span>
                <span>{Number.isFinite(basic.contrast) ? Math.round(basic.contrast) : 0}%</span>
              </div>
              <UnifiedSlider
                min={-100}
                max={100}
                step={1}
                value={Number.isFinite(basic.contrast) ? basic.contrast : 0}
                onChange={(v) => setBasic({ contrast: v })}
              />
            </div>

            <div>
              <div className="flex justify-between text-sm text-white/80 mb-1">
                <span>Highlights</span>
                <span>{Number.isFinite(basic.highlights) ? Math.round(basic.highlights) : 0}%</span>
              </div>
              <UnifiedSlider
                min={-100}
                max={100}
                step={1}
                value={Number.isFinite(basic.highlights) ? basic.highlights : 0}
                onChange={(v) => setBasic({ highlights: v })}
              />
            </div>

            <div>
              <div className="flex justify-between text-sm text-white/80 mb-1">
                <span>Shadows</span>
                <span>{Number.isFinite(basic.shadows) ? Math.round(basic.shadows) : 0}%</span>
              </div>
              <UnifiedSlider
                min={-100}
                max={100}
                step={1}
                value={Number.isFinite(basic.shadows) ? basic.shadows : 0}
                onChange={(v) => setBasic({ shadows: v })}
              />
            </div>

            <div>
              <div className="flex justify-between text-sm text-white/80 mb-1">
                <span>Whites</span>
                <span>{Number.isFinite(basic.whites) ? Math.round(basic.whites) : 0}%</span>
              </div>
              <UnifiedSlider
                min={-100}
                max={100}
                step={1}
                value={Number.isFinite(basic.whites) ? basic.whites : 0}
                onChange={(v) => setBasic({ whites: v })}
              />
            </div>

            <div>
              <div className="flex justify-between text-sm text-white/80 mb-1">
                <span>Blacks</span>
                <span>{Number.isFinite(basic.blacks) ? Math.round(basic.blacks) : 0}%</span>
              </div>
              <UnifiedSlider
                min={-100}
                max={100}
                step={1}
                value={Number.isFinite(basic.blacks) ? basic.blacks : 0}
                onChange={(v) => setBasic({ blacks: v })}
              />
            </div>

            <div>
              <div className="flex justify-between text-sm text-white/80 mb-1">
                <span>Gamma</span>
                <span>{Number.isFinite(basic.gamma) ? basic.gamma.toFixed(2) : '1.00'}</span>
              </div>
              <UnifiedSlider
                min={0.1}
                max={3}
                step={0.01}
                value={Number.isFinite(basic.gamma) ? basic.gamma : 1}
                onChange={(v) => setBasic({ gamma: v })}
              />
            </div>
          </div>
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
