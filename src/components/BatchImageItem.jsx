import React, { useState } from 'react';
import BeforeAfterSlider from './BeforeAfterSlider';
import PresetSelector from './PresetSelector';

const BatchImageItem = ({ item, preset }) => {
  const [showSlider, setShowSlider] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(preset?.name || 'Original');

  // Stub for edit/revert actions
  const handleEdit = () => {
    // TODO: Apply selectedPreset settings to image
    alert(`Applied preset: ${selectedPreset}`);
  };
  const handleRevert = () => {
    setSelectedPreset('Original');
    alert('Reverted to original');
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 flex flex-col items-center">
      <div className="mb-2 font-semibold text-white">{item.file.name}</div>
      <div className="mb-2">
        <img src={item.before} alt="before" className="h-32 w-32 object-cover rounded" />
      </div>
      {item.status === 'done' && (
        <>
          <PresetSelector selected={selectedPreset} onSelect={preset => setSelectedPreset(preset.name)} />
          <div className="mb-2 flex gap-2">
            <button className="bg-blue-600 text-white px-2 py-1 rounded" onClick={handleEdit}>Edit</button>
            <button className="bg-gray-600 text-white px-2 py-1 rounded" onClick={handleRevert}>Revert</button>
            <button className="bg-blue-600 text-white px-2 py-1 rounded" onClick={() => setShowSlider(!showSlider)}>
              {showSlider ? 'Hide' : 'Show'} Before/After
            </button>
          </div>
        </>
      )}
      {showSlider && item.after && (
        <BeforeAfterSlider before={item.before} after={item.after} />
      )}
      <div className="w-full mt-2">
        <div className="h-2 bg-gray-700 rounded">
          <div className="h-2 bg-blue-500 rounded" style={{ width: `${item.progress}%` }}></div>
        </div>
        <div className="text-xs text-gray-400 mt-1">{item.status === 'done' ? 'Completed' : item.status === 'processing' ? 'Processing...' : 'Pending'}</div>
      </div>
      {item.status === 'done' && (
        <div className="mt-2 flex gap-2">
          <a href={item.after} download={item.file.name.replace(/\.[^/.]+$/, '.jpg')} className="bg-green-600 text-white px-2 py-1 rounded">Download</a>
        </div>
      )}
    </div>
  );
};

export default BatchImageItem;
