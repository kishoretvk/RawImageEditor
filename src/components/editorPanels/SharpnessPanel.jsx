import React from 'react';

const SharpnessPanel = ({ sharpness = {}, onChange }) => {
  const defaultSharpness = {
    amount: 1,
    radius: 1,
    detail: 0.5,
    masking: 0
  };
  
  const currentSharpness = { ...defaultSharpness, ...sharpness };
  
  const handleChange = (key, value) => {
    onChange({ ...currentSharpness, [key]: value });
  };
  
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-gray-300 font-medium mb-2 text-sm">
          Sharpening (Amount)
          <span className="text-gray-500 ml-2">{currentSharpness.amount.toFixed(2)}</span>
        </label>
        <input 
          type="range" 
          min="0" 
          max="3" 
          step="0.01" 
          value={currentSharpness.amount || 1} 
          onChange={e => handleChange('amount', Number(e.target.value))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
      
      <div>
        <label className="block text-gray-300 font-medium mb-2 text-sm">
          Radius
          <span className="text-gray-500 ml-2">{currentSharpness.radius.toFixed(2)}</span>
        </label>
        <input 
          type="range" 
          min="0.1" 
          max="5" 
          step="0.01" 
          value={currentSharpness.radius || 1} 
          onChange={e => handleChange('radius', Number(e.target.value))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
      
      <div>
        <label className="block text-gray-300 font-medium mb-2 text-sm">
          Detail
          <span className="text-gray-500 ml-2">{currentSharpness.detail.toFixed(2)}</span>
        </label>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          value={currentSharpness.detail || 0.5} 
          onChange={e => handleChange('detail', Number(e.target.value))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
      
      <div>
        <label className="block text-gray-300 font-medium mb-2 text-sm">
          Masking
          <span className="text-gray-500 ml-2">{currentSharpness.masking.toFixed(2)}</span>
        </label>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          value={currentSharpness.masking || 0} 
          onChange={e => handleChange('masking', Number(e.target.value))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
    </div>
  );
};

export default SharpnessPanel;
