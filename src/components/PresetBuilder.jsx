import React, { useState } from 'react';
import { useCurve } from '../context/CurveContext.jsx';

const PresetBuilder = ({ onSave, currentEdits }) => {
  // Only use curve context if we have curve edits
  const hasCurveEdits = currentEdits?.curveRgb || currentEdits?.curveR || currentEdits?.curveG || currentEdits?.curveB || currentEdits?.curveLuminance;
  const { curves } = hasCurveEdits ? useCurve() : { curves: {} };
  const [name, setName] = useState('');
  const [settings, setSettings] = useState({
    exposure: 0,
    contrast: 0,
    highlights: 0,
    shadows: 0,
    whites: 0,
    blacks: 0,
    clarity: 0,
    vibrance: 0,
    saturation: 0,
    temperature: 0,
    tint: 0,
    ...currentEdits
  });

  const handleSave = () => {
    if (name) {
      // Include curve data in the preset
      const presetWithCurves = {
        name,
        settings: {
          ...settings,
          curves: {
            curveRgb: curves.curveRgb,
            curveR: curves.curveR,
            curveG: curves.curveG,
            curveB: curves.curveB,
            curveLuminance: curves.curveLuminance
          }
        }
      };
      onSave(presetWithCurves);
    }
  };

  const handleReset = () => {
    setSettings({
      exposure: 0,
      contrast: 0,
      highlights: 0,
      shadows: 0,
      whites: 0,
      blacks: 0,
      clarity: 0,
      vibrance: 0,
      saturation: 0,
      temperature: 0,
      tint: 0
    });
    setName('');
  };

  const updateSetting = (key, value) => {
    setSettings({ ...settings, [key]: Number(value) });
  };

  return (
    <div className="bg-gray-800 p-4 rounded-xl">
      <h3 className="text-lg font-bold mb-2">Create Preset</h3>
      <input 
        className="mb-2 p-2 rounded w-full bg-gray-700 text-white" 
        value={name} 
        onChange={e => setName(e.target.value)} 
        placeholder="Preset Name" 
      />
      
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className="block text-sm mb-1">Exposure</label>
          <input 
            type="range" 
            min="-2" 
            max="2" 
            step="0.1" 
            value={settings.exposure} 
            onChange={e => updateSetting('exposure', e.target.value)} 
            className="w-full"
          />
          <span className="text-xs">{settings.exposure}</span>
        </div>
        
        <div>
          <label className="block text-sm mb-1">Contrast</label>
          <input 
            type="range" 
            min="-100" 
            max="100" 
            step="1" 
            value={settings.contrast} 
            onChange={e => updateSetting('contrast', e.target.value)} 
            className="w-full"
          />
          <span className="text-xs">{settings.contrast}</span>
        </div>
        
        <div>
          <label className="block text-sm mb-1">Highlights</label>
          <input 
            type="range" 
            min="-100" 
            max="100" 
            step="1" 
            value={settings.highlights} 
            onChange={e => updateSetting('highlights', e.target.value)} 
            className="w-full"
          />
          <span className="text-xs">{settings.highlights}</span>
        </div>
        
        <div>
          <label className="block text-sm mb-1">Shadows</label>
          <input 
            type="range" 
            min="-100" 
            max="100" 
            step="1" 
            value={settings.shadows} 
            onChange={e => updateSetting('shadows', e.target.value)} 
            className="w-full"
          />
          <span className="text-xs">{settings.shadows}</span>
        </div>
        
        <div>
          <label className="block text-sm mb-1">Whites</label>
          <input 
            type="range" 
            min="-100" 
            max="100" 
            step="1" 
            value={settings.whites} 
            onChange={e => updateSetting('whites', e.target.value)} 
            className="w-full"
          />
          <span className="text-xs">{settings.whites}</span>
        </div>
        
        <div>
          <label className="block text-sm mb-1">Blacks</label>
          <input 
            type="range" 
            min="-100" 
            max="100" 
            step="1" 
            value={settings.blacks} 
            onChange={e => updateSetting('blacks', e.target.value)} 
            className="w-full"
          />
          <span className="text-xs">{settings.blacks}</span>
        </div>
        
        <div>
          <label className="block text-sm mb-1">Clarity</label>
          <input 
            type="range" 
            min="-100" 
            max="100" 
            step="1" 
            value={settings.clarity} 
            onChange={e => updateSetting('clarity', e.target.value)} 
            className="w-full"
          />
          <span className="text-xs">{settings.clarity}</span>
        </div>
        
        <div>
          <label className="block text-sm mb-1">Vibrance</label>
          <input 
            type="range" 
            min="-100" 
            max="100" 
            step="1" 
            value={settings.vibrance} 
            onChange={e => updateSetting('vibrance', e.target.value)} 
            className="w-full"
          />
          <span className="text-xs">{settings.vibrance}</span>
        </div>
        
        <div>
          <label className="block text-sm mb-1">Saturation</label>
          <input 
            type="range" 
            min="-100" 
            max="100" 
            step="1" 
            value={settings.saturation} 
            onChange={e => updateSetting('saturation', e.target.value)} 
            className="w-full"
          />
          <span className="text-xs">{settings.saturation}</span>
        </div>
        
        <div>
          <label className="block text-sm mb-1">Temperature</label>
          <input 
            type="range" 
            min="-100" 
            max="100" 
            step="1" 
            value={settings.temperature} 
            onChange={e => updateSetting('temperature', e.target.value)} 
            className="w-full"
          />
          <span className="text-xs">{settings.temperature}</span>
        </div>
        
        <div>
          <label className="block text-sm mb-1">Tint</label>
          <input 
            type="range" 
            min="-100" 
            max="100" 
            step="1" 
            value={settings.tint} 
            onChange={e => updateSetting('tint', e.target.value)} 
            className="w-full"
          />
          <span className="text-xs">{settings.tint}</span>
        </div>
      </div>
      
      <div className="flex gap-2 mt-4">
        <button 
          className="bg-primary text-white px-4 py-2 rounded flex-1" 
          onClick={handleSave}
          disabled={!name}
        >
          Save Preset
        </button>
        <button 
          className="bg-gray-600 text-white px-4 py-2 rounded flex-1" 
          onClick={handleReset}
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default PresetBuilder;
