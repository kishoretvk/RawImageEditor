import React from 'react';

const PRESETS = [
  { name: 'Original', settings: { exposure: 0, contrast: 0, vibrance: 0 } },
  { name: 'Bright', settings: { exposure: 20, contrast: 10, vibrance: 15 } },
  { name: 'Moody', settings: { exposure: -10, contrast: 20, vibrance: -5 } },
  { name: 'Vivid', settings: { exposure: 10, contrast: 5, vibrance: 25 } },
  // ...add more presets
];

const PresetSelector = ({ selected, onSelect }) => (
  <div className="flex gap-2 mb-4">
    {PRESETS.map((preset, idx) => (
      <button
        key={idx}
        className={`px-4 py-2 rounded ${selected === preset.name ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
        onClick={() => onSelect(preset)}
      >
        {preset.name}
      </button>
    ))}
  </div>
);

export default PresetSelector;
