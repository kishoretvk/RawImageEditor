import React, { useState } from 'react';

const PresetBuilder = ({ onSave }) => {
  const [name, setName] = useState('');
  const [settings, setSettings] = useState({ exposure: 1, contrast: 1 });

  const handleSave = () => {
    if (name) onSave({ name, settings });
  };

  return (
    <div className="bg-gray-800 p-4 rounded-xl">
      <h3 className="text-lg font-bold mb-2">Create Preset</h3>
      <input className="mb-2 p-2 rounded w-full" value={name} onChange={e => setName(e.target.value)} placeholder="Preset Name" />
      <div className="flex gap-2 mb-2">
        <label>Exposure</label>
        <input type="number" value={settings.exposure} onChange={e => setSettings({ ...settings, exposure: Number(e.target.value) })} />
        <label>Contrast</label>
        <input type="number" value={settings.contrast} onChange={e => setSettings({ ...settings, contrast: Number(e.target.value) })} />
      </div>
      <button className="bg-primary text-white px-4 py-2 rounded" onClick={handleSave}>Save Preset</button>
    </div>
  );
};

export default PresetBuilder;
