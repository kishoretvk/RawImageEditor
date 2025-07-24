import React from 'react';

const ConversionSettings = ({ settings = { quality: 50, format: 'jpeg', resize: 1000, sharpening: 0, noiseReduction: 0 }, onChange }) => {
  const handleInputChange = (key, value) => {
    if (key === 'resize' && (value < 100 || value > 8000)) {
      // Use modern toast notification instead of alert
      console.warn('Resize value must be between 100 and 8000 pixels.');
      return;
    }
    if (key === 'quality' && (value < 10 || value > 100)) {
      console.warn('Quality must be between 10 and 100.');
      return;
    }
    onChange({ ...settings, [key]: value });
  };

  return (
    <div className="glass rounded-2xl p-6 mb-6 shadow-2xl border border-white/20 fade-in">
      <h2 className="text-2xl font-bold mb-6 text-white flex items-center">
        <span className="w-3 h-3 bg-blue-400 rounded-full mr-3 pulse"></span>
        Conversion Settings
      </h2>
      <div className="space-y-6">
        <div className="fade-in">
          <label className="block text-white/90 font-semibold mb-3" htmlFor="quality">
            Quality: {settings.quality}%
          </label>
          <input
            id="quality"
            type="range"
            min="10"
            max="100"
            value={settings.quality}
            onChange={e => handleInputChange('quality', Number(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
            aria-label="Quality setting"
          />
          <div className="flex justify-between text-xs text-white/60 mt-1">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>
        
        <div className="fade-in">
          <label className="block text-white/90 font-semibold mb-3" htmlFor="format">Format</label>
          <select
            id="format"
            value={settings.format}
            onChange={e => handleInputChange('format', e.target.value)}
            className="w-full p-3 rounded-xl glass text-white font-medium border border-white/20 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
            aria-label="Format setting"
          >
            <option value="jpeg" className="bg-slate-800">JPEG</option>
            <option value="png" className="bg-slate-800">PNG</option>
          </select>
        </div>
        
        <div className="fade-in">
          <label className="block text-white/90 font-semibold mb-3" htmlFor="resize">
            Resize: {settings.resize}px
          </label>
          <input
            id="resize"
            type="number"
            min="100"
            max="8000"
            value={settings.resize}
            onChange={e => handleInputChange('resize', Number(e.target.value))}
            className="w-full p-3 rounded-xl glass text-white font-medium border border-white/20 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
            aria-label="Resize setting"
          />
          <div className="text-xs text-white/60 mt-1">Min: 100px, Max: 8000px</div>
        </div>
        
        <div className="fade-in">
          <label className="block text-white/90 font-semibold mb-3" htmlFor="sharpening">
            Sharpening: {(settings.sharpening || 0).toFixed(2)}
          </label>
          <input
            id="sharpening"
            type="range"
            min="0"
            max="3"
            step="0.01"
            value={settings.sharpening || 0}
            onChange={e => handleInputChange('sharpening', Number(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
            aria-label="Sharpening setting"
          />
          <div className="flex justify-between text-xs text-white/60 mt-1">
            <span>None</span>
            <span>Maximum</span>
          </div>
        </div>
        
        <div className="fade-in">
          <label className="block text-white/90 font-semibold mb-3" htmlFor="noiseReduction">
            Noise Reduction: {(settings.noiseReduction || 0).toFixed(2)}
          </label>
          <input
            id="noiseReduction"
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={settings.noiseReduction || 0}
            onChange={e => handleInputChange('noiseReduction', Number(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
            aria-label="Noise Reduction setting"
          />
          <div className="flex justify-between text-xs text-white/60 mt-1">
            <span>None</span>
            <span>Maximum</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversionSettings;
