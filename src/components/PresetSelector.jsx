import React, { useState, useEffect } from 'react';

const PresetSelector = ({ 
  presets = [], 
  selectedPreset = '', 
  onPresetSelect, 
  className = '',
  placeholder = 'Select a preset',
  showPreview = true
}) => {
  const [filteredPresets, setFilteredPresets] = useState(presets);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter presets based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredPresets(presets);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredPresets(
        presets.filter(preset => 
          preset.name.toLowerCase().includes(term) ||
          (preset.description && preset.description.toLowerCase().includes(term))
        )
      );
    }
  }, [searchTerm, presets]);

  // Handle preset selection
  const handlePresetSelect = (presetId) => {
    if (onPresetSelect) {
      onPresetSelect(presetId);
    }
  };

  // Get selected preset details
  const selectedPresetDetails = presets.find(preset => preset.id === selectedPreset);

  return (
    <div className={`preset-selector ${className}`}>
      {/* Search Input */}
      <div className="preset-search mb-2">
        <input
          type="text"
          placeholder="Search presets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Preset List */}
      <div className="preset-list max-h-60 overflow-y-auto border border-gray-600 rounded-md bg-gray-800">
        {filteredPresets.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchTerm ? 'No matching presets found' : 'No presets available'}
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {filteredPresets.map((preset) => (
              <div
                key={preset.id}
                onClick={() => handlePresetSelect(preset.id)}
                className={`p-3 cursor-pointer hover:bg-gray-700 transition-colors ${
                  selectedPreset === preset.id ? 'bg-gray-700 border-l-4 border-blue-500' : ''
                }`}
              >
                <div className="flex items-center">
                  {showPreview && preset.preview && (
                    <div className="flex-shrink-0 mr-3">
                      <img 
                        src={preset.preview} 
                        alt={preset.name}
                        className="w-10 h-10 object-cover rounded"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-white font-medium truncate">
                        {preset.name}
                      </h4>
                      {selectedPreset === preset.id && (
                        <span className="text-blue-400 ml-2">✓</span>
                      )}
                    </div>
                    {preset.description && (
                      <p className="text-gray-400 text-sm truncate">
                        {preset.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {preset.tags && preset.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Preset Preview */}
      {selectedPresetDetails && showPreview && (
        <div className="selected-preset-preview mt-3 p-3 bg-gray-700 rounded-md">
          <div className="flex items-center">
            {selectedPresetDetails.preview && (
              <div className="flex-shrink-0 mr-3">
                <img 
                  src={selectedPresetDetails.preview} 
                  alt={selectedPresetDetails.name}
                  className="w-12 h-12 object-cover rounded"
                />
              </div>
            )}
            <div>
              <h4 className="text-white font-medium">{selectedPresetDetails.name}</h4>
              <p className="text-gray-400 text-sm">
                Selected preset
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PresetSelector;
