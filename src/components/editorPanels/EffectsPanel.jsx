import React from 'react';

const EffectsPanel = ({ effects = {}, onChange }) => {
  const defaultEffects = {
    vignette: 0,
    grain: 0,
    blur: 0,
    glow: 0,
    orton: 0,
    tint: 0,
    duotone: 0,
    split_toning: 0
  };
  
  const currentEffects = { ...defaultEffects, ...effects };
  
  const handleChange = (key, value) => {
    onChange({ ...currentEffects, [key]: value });
  };
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-gray-300 font-medium mb-2 text-sm">
          Vignette
          <span className="text-gray-500 ml-2">{currentEffects.vignette.toFixed(2)}</span>
        </label>
        <input 
          type="range" 
          min="-1" 
          max="1" 
          step="0.01" 
          value={currentEffects.vignette || 0} 
          onChange={e => handleChange('vignette', Number(e.target.value))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
      
      <div>
        <label className="block text-gray-300 font-medium mb-2 text-sm">
          Film Grain
          <span className="text-gray-500 ml-2">{currentEffects.grain.toFixed(2)}</span>
        </label>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          value={currentEffects.grain || 0} 
          onChange={e => handleChange('grain', Number(e.target.value))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
      
      <div>
        <label className="block text-gray-300 font-medium mb-2 text-sm">
          Blur
          <span className="text-gray-500 ml-2">{currentEffects.blur.toFixed(1)}</span>
        </label>
        <input 
          type="range" 
          min="0" 
          max="10" 
          step="0.1" 
          value={currentEffects.blur || 0} 
          onChange={e => handleChange('blur', Number(e.target.value))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
      
      <div>
        <label className="block text-gray-300 font-medium mb-2 text-sm">
          Glow Effect
          <span className="text-gray-500 ml-2">{currentEffects.glow.toFixed(2)}</span>
        </label>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          value={currentEffects.glow || 0} 
          onChange={e => handleChange('glow', Number(e.target.value))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
      
      <div>
        <label className="block text-gray-300 font-medium mb-2 text-sm">
          Orton Effect
          <span className="text-gray-500 ml-2">{currentEffects.orton.toFixed(2)}</span>
        </label>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          value={currentEffects.orton || 0} 
          onChange={e => handleChange('orton', Number(e.target.value))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
      
      <div>
        <label className="block text-gray-300 font-medium mb-2 text-sm">
          Color Tint
          <span className="text-gray-500 ml-2">{currentEffects.tint.toFixed(2)}</span>
        </label>
        <input 
          type="range" 
          min="-1" 
          max="1" 
          step="0.01" 
          value={currentEffects.tint || 0} 
          onChange={e => handleChange('tint', Number(e.target.value))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
      
      <div>
        <label className="block text-gray-300 font-medium mb-2 text-sm">
          Duotone Intensity
          <span className="text-gray-500 ml-2">{currentEffects.duotone.toFixed(2)}</span>
        </label>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          value={currentEffects.duotone || 0} 
          onChange={e => handleChange('duotone', Number(e.target.value))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
      
      <div>
        <label className="block text-gray-300 font-medium mb-2 text-sm">
          Split Toning
          <span className="text-gray-500 ml-2">{currentEffects.split_toning.toFixed(2)}</span>
        </label>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          value={currentEffects.split_toning || 0} 
          onChange={e => handleChange('split_toning', Number(e.target.value))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
    </div>
  );
};

export default EffectsPanel;
