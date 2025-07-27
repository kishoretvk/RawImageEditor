import React, { useState, useEffect } from 'react';
import PresetBuilder from './PresetBuilder';
import { useCurve } from '../context/CurveContext';

const PresetManager = ({ onApplyPreset, currentEdits }) => {
  const { curves } = useCurve();
  const [presets, setPresets] = useState([]);
  const [showBuilder, setShowBuilder] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Load presets from localStorage on component mount
  useEffect(() => {
    const savedPresets = localStorage.getItem('imageEditorPresets');
    if (savedPresets) {
      try {
        setPresets(JSON.parse(savedPresets));
      } catch (e) {
        console.error('Failed to parse presets', e);
      }
    }
  }, []);

  // Save presets to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('imageEditorPresets', JSON.stringify(presets));
  }, [presets]);

  const handleSavePreset = (preset) => {
    const newPreset = {
      id: Date.now(),
      ...preset,
      curves: {
        curveRgb: curves.curveRgb,
        curveR: curves.curveR,
        curveG: curves.curveG,
        curveB: curves.curveB,
        curveLuminance: curves.curveLuminance
      },
      createdAt: new Date().toISOString()
    };
    setPresets([...presets, newPreset]);
    setShowBuilder(false);
  };

  const handleDeletePreset = (id) => {
    setPresets(presets.filter(preset => preset.id !== id));
  };

  const handleApplyPreset = (preset) => {
    // Apply settings and curves
    onApplyPreset({
      ...preset.settings,
      curves: preset.curves
    });
  };

  const filteredPresets = presets.filter(preset => 
    preset.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="preset-manager">
      <div className="preset-manager-header">
        <h3 className="text-lg font-bold mb-2">Preset Manager</h3>
        <button 
          className="bg-primary text-white px-3 py-1 rounded text-sm"
          onClick={() => setShowBuilder(!showBuilder)}
        >
          {showBuilder ? 'Cancel' : 'Create New'}
        </button>
      </div>

      {showBuilder && (
        <div className="mb-4">
          <PresetBuilder onSave={handleSavePreset} currentEdits={currentEdits} />
        </div>
      )}

      <div className="preset-search mb-3">
        <input
          type="text"
          placeholder="Search presets..."
          className="w-full p-2 rounded bg-gray-700 text-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="preset-list max-h-60 overflow-y-auto">
        {filteredPresets.length === 0 ? (
          <p className="text-gray-400 text-center py-4">
            {searchTerm ? 'No matching presets found' : 'No presets saved yet'}
          </p>
        ) : (
          filteredPresets.map(preset => (
            <div 
              key={preset.id} 
              className="preset-item bg-gray-700 rounded p-3 mb-2 flex justify-between items-center"
            >
              <div className="preset-info">
                <h4 className="font-medium">{preset.name}</h4>
                <p className="text-xs text-gray-400">
                  {new Date(preset.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="preset-actions flex gap-2">
                <button 
                  className="bg-blue-600 text-white px-2 py-1 rounded text-sm"
                  onClick={() => handleApplyPreset(preset)}
                >
                  Apply
                </button>
                <button 
                  className="bg-red-600 text-white px-2 py-1 rounded text-sm"
                  onClick={() => handleDeletePreset(preset.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PresetManager;
