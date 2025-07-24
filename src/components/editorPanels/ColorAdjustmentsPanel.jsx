import React from 'react';

const ColorAdjustmentsPanel = ({ colorAdjustments = {}, onChange }) => {
  const defaultColorAdjustments = {
    temperature: 5500,
    tint: 0,
    hue: 0,
    saturation: 1,
    vibrance: 0,
    luminance: 0
  };
  
  const currentColorAdjustments = { ...defaultColorAdjustments, ...colorAdjustments };
  
  const handleChange = (key, value) => {
    onChange({ ...currentColorAdjustments, [key]: value });
  };
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-gray-300 font-medium mb-2 text-sm">
          White Balance (Temperature)
          <span className="text-gray-500 ml-2">{currentColorAdjustments.temperature}K</span>
        </label>
        <input 
          type="range" 
          min="2000" 
          max="10000" 
          step="10" 
          value={currentColorAdjustments.temperature || 5500} 
          onChange={e => handleChange('temperature', Number(e.target.value))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
      
      <div>
        <label className="block text-gray-300 font-medium mb-2 text-sm">
          White Balance (Tint)
          <span className="text-gray-500 ml-2">{currentColorAdjustments.tint}</span>
        </label>
        <input 
          type="range" 
          min="-150" 
          max="150" 
          step="1" 
          value={currentColorAdjustments.tint || 0} 
          onChange={e => handleChange('tint', Number(e.target.value))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
      
      <div>
        <label className="block text-gray-300 font-medium mb-2 text-sm">
          Hue
          <span className="text-gray-500 ml-2">{currentColorAdjustments.hue}°</span>
        </label>
        <input 
          type="range" 
          min="-180" 
          max="180" 
          step="1" 
          value={currentColorAdjustments.hue || 0} 
          onChange={e => handleChange('hue', Number(e.target.value))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
      
      <div>
        <label className="block text-gray-300 font-medium mb-2 text-sm">
          Saturation
          <span className="text-gray-500 ml-2">{currentColorAdjustments.saturation.toFixed(2)}</span>
        </label>
        <input 
          type="range" 
          min="0" 
          max="2" 
          step="0.01" 
          value={currentColorAdjustments.saturation || 1} 
          onChange={e => handleChange('saturation', Number(e.target.value))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
      
      <div>
        <label className="block text-gray-300 font-medium mb-2 text-sm">
          Vibrance
          <span className="text-gray-500 ml-2">{currentColorAdjustments.vibrance.toFixed(2)}</span>
        </label>
        <input 
          type="range" 
          min="-1" 
          max="1" 
          step="0.01" 
          value={currentColorAdjustments.vibrance || 0} 
          onChange={e => handleChange('vibrance', Number(e.target.value))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
      
      <div>
        <label className="block text-gray-300 font-medium mb-2 text-sm">
          Luminance
          <span className="text-gray-500 ml-2">{currentColorAdjustments.luminance.toFixed(2)}</span>
        </label>
        <input 
          type="range" 
          min="-1" 
          max="1" 
          step="0.01" 
          value={currentColorAdjustments.luminance || 0} 
          onChange={e => handleChange('luminance', Number(e.target.value))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
    </div>
  );
};

export default ColorAdjustmentsPanel;
