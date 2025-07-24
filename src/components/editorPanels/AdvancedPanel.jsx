import React from 'react';

const AdvancedPanel = ({ advanced = {}, onChange }) => {
  const defaultAdvanced = {
    hdr: 1,
    curves: 1,
    channelMixer: 1,
    lut: 0,
    defog: 0,
    shadowHighlight: 1,
    chromatic: 0,
    advancedVignetting: 0,
    filmGrain: 0
  };
  
  const currentAdvanced = { ...defaultAdvanced, ...advanced };
  
  const handleChange = (key, value) => {
    onChange({ ...currentAdvanced, [key]: value });
  };
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-gray-300 font-medium mb-2 text-sm">
          Tone Mapping / HDR
          <span className="text-gray-500 ml-2">{currentAdvanced.hdr.toFixed(2)}</span>
        </label>
        <input 
          type="range" 
          min="0" 
          max="2" 
          step="0.01" 
          value={currentAdvanced.hdr || 1} 
          onChange={e => handleChange('hdr', Number(e.target.value))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
      
      <div>
        <label className="block text-gray-300 font-medium mb-2 text-sm">
          Curves (RGB)
          <span className="text-gray-500 ml-2">{currentAdvanced.curves.toFixed(2)}</span>
        </label>
        <input 
          type="range" 
          min="0" 
          max="2" 
          step="0.01" 
          value={currentAdvanced.curves || 1} 
          onChange={e => handleChange('curves', Number(e.target.value))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
      
      <div>
        <label className="block text-gray-300 font-medium mb-2 text-sm">
          Channel Mixer
          <span className="text-gray-500 ml-2">{currentAdvanced.channelMixer.toFixed(2)}</span>
        </label>
        <input 
          type="range" 
          min="0" 
          max="2" 
          step="0.01" 
          value={currentAdvanced.channelMixer || 1} 
          onChange={e => handleChange('channelMixer', Number(e.target.value))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
      
      <div>
        <label className="block text-gray-300 font-medium mb-2 text-sm">
          LUT Intensity
          <span className="text-gray-500 ml-2">{currentAdvanced.lut.toFixed(2)}</span>
        </label>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          value={currentAdvanced.lut || 0} 
          onChange={e => handleChange('lut', Number(e.target.value))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
      
      <div>
        <label className="block text-gray-300 font-medium mb-2 text-sm">
          Defog
          <span className="text-gray-500 ml-2">{currentAdvanced.defog.toFixed(2)}</span>
        </label>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          value={currentAdvanced.defog || 0} 
          onChange={e => handleChange('defog', Number(e.target.value))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
      
      <div>
        <label className="block text-gray-300 font-medium mb-2 text-sm">
          Shadow/Highlight Recovery
          <span className="text-gray-500 ml-2">{currentAdvanced.shadowHighlight.toFixed(2)}</span>
        </label>
        <input 
          type="range" 
          min="0" 
          max="2" 
          step="0.01" 
          value={currentAdvanced.shadowHighlight || 1} 
          onChange={e => handleChange('shadowHighlight', Number(e.target.value))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
      
      <div>
        <label className="block text-gray-300 font-medium mb-2 text-sm">
          Chromatic Aberration Correction
          <span className="text-gray-500 ml-2">{currentAdvanced.chromatic.toFixed(2)}</span>
        </label>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          value={currentAdvanced.chromatic || 0} 
          onChange={e => handleChange('chromatic', Number(e.target.value))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
      
      <div>
        <label className="block text-gray-300 font-medium mb-2 text-sm">
          Vignetting
          <span className="text-gray-500 ml-2">{currentAdvanced.advancedVignetting.toFixed(2)}</span>
        </label>
        <input 
          type="range" 
          min="-1" 
          max="1" 
          step="0.01" 
          value={currentAdvanced.advancedVignetting || 0} 
          onChange={e => handleChange('advancedVignetting', Number(e.target.value))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
      
      <div>
        <label className="block text-gray-300 font-medium mb-2 text-sm">
          Film Grain
          <span className="text-gray-500 ml-2">{currentAdvanced.filmGrain.toFixed(2)}</span>
        </label>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          value={currentAdvanced.filmGrain || 0} 
          onChange={e => handleChange('filmGrain', Number(e.target.value))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
    </div>
  );
};

export default AdvancedPanel;
