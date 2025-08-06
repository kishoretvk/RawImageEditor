import React from 'react';
import '../../styles/tokens.css';
import Panel from '../ui/Panel.jsx';
import Button from '../ui/Button.jsx';

const GeometryPanel = ({ geometry = {}, onChange }) => {
  const defaultGeometry = {
    crop: 0,
    rotate: 0,
    flip: 'none',
    perspective: 0,
    keystone: 0,
    distortion: 0
  };
  
  const currentGeometry = { ...defaultGeometry, ...geometry };
  
  const handleChange = (key, value) => {
    onChange({ ...currentGeometry, [key]: value });
  };
  
  const handleReset = () => {
    const defaults = {
      crop: 0,
      rotate: 0,
      flip: 'none',
      perspective: 0,
      keystone: 0,
      distortion: 0
    };
    onChange(defaults);
  };

  return (
    <Panel
      title="Geometry"
      actions={<Button size="sm" variant="secondary" onClick={handleReset}>Reset</Button>}
      className="is-compact"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-gray-300 font-medium mb-2 text-sm">
          Crop
          <span className="text-gray-500 ml-2">{currentGeometry.crop.toFixed(2)}</span>
        </label>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.01" 
          value={currentGeometry.crop || 0} 
          onChange={e => handleChange('crop', Number(e.target.value))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
      
      <div>
        <label className="block text-gray-300 font-medium mb-2 text-sm">
          Rotate
          <span className="text-gray-500 ml-2">{currentGeometry.rotate}°</span>
        </label>
        <input 
          type="range" 
          min="-180" 
          max="180" 
          step="1" 
          value={currentGeometry.rotate || 0} 
          onChange={e => handleChange('rotate', Number(e.target.value))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
      
      <div>
        <label className="block text-gray-300 font-medium mb-2 text-sm">
          Perspective
          <span className="text-gray-500 ml-2">{currentGeometry.perspective.toFixed(2)}</span>
        </label>
        <input 
          type="range" 
          min="-1" 
          max="1" 
          step="0.01" 
          value={currentGeometry.perspective || 0} 
          onChange={e => handleChange('perspective', Number(e.target.value))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
      
      <div>
        <label className="block text-gray-300 font-medium mb-2 text-sm">
          Keystone Correction
          <span className="text-gray-500 ml-2">{currentGeometry.keystone.toFixed(2)}</span>
        </label>
        <input 
          type="range" 
          min="-1" 
          max="1" 
          step="0.01" 
          value={currentGeometry.keystone || 0} 
          onChange={e => handleChange('keystone', Number(e.target.value))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
      
      <div>
        <label className="block text-gray-300 font-medium mb-2 text-sm">
          Lens Distortion
          <span className="text-gray-500 ml-2">{currentGeometry.distortion.toFixed(2)}</span>
        </label>
        <input 
          type="range" 
          min="-1" 
          max="1" 
          step="0.01" 
          value={currentGeometry.distortion || 0} 
          onChange={e => handleChange('distortion', Number(e.target.value))}
          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
        />
      </div>
      
      <div>
        <label className="block text-gray-300 font-medium mb-2 text-sm">
          Flip
        </label>
        <select 
          value={currentGeometry.flip || 'none'} 
          onChange={e => handleChange('flip', e.target.value)}
          className="w-full p-2 rounded-lg bg-gray-700 text-gray-300 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="none">None</option>
          <option value="horizontal">Horizontal</option>
          <option value="vertical">Vertical</option>
        </select>
      </div>
      </div>
    </Panel>
  );
};

export default GeometryPanel;
