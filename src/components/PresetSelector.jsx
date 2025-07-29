import React, { useState, useEffect } from 'react';

const PresetSelector = ({ onPresetSelect, selectedPreset }) => {
  const [presets, setPresets] = useState([]);
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

  const filteredPresets = presets.filter(preset => 
    preset.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="preset-selector" style={{ 
      background: 'rgba(255,255,255,0.03)',
      borderRadius: '8px',
      padding: '16px'
    }}>
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Search presets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '6px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid #4a5568',
            color: '#e0e0e0',
            fontSize: '14px'
          }}
        />
      </div>
      
      <div style={{ 
        maxHeight: '200px', 
        overflowY: 'auto',
        paddingRight: '8px'
      }}>
        {filteredPresets.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '20px', 
            color: '#a0a0a0' 
          }}>
            {searchTerm ? 'No matching presets found' : 'No presets available'}
          </div>
        ) : (
          filteredPresets.map(preset => (
            <div 
              key={preset.id}
              onClick={() => onPresetSelect(preset)}
              style={{
                padding: '12px',
                background: selectedPreset?.id === preset.id 
                  ? 'rgba(74, 158, 255, 0.2)' 
                  : 'rgba(255,255,255,0.05)',
                borderRadius: '6px',
                marginBottom: '8px',
                cursor: 'pointer',
                border: selectedPreset?.id === preset.id 
                  ? '1px solid #4a9eff' 
                  : '1px solid transparent',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.background = selectedPreset?.id === preset.id 
                  ? 'rgba(74, 158, 255, 0.3)' 
                  : 'rgba(255,255,255,0.08)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = selectedPreset?.id === preset.id 
                  ? 'rgba(74, 158, 255, 0.2)' 
                  : 'rgba(255,255,255,0.05)';
              }}
            >
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <span style={{ 
                  fontWeight: '600', 
                  color: '#e0e0e0' 
                }}>
                  {preset.name}
                </span>
                <span style={{ 
                  fontSize: '12px', 
                  color: '#a0a0a0' 
                }}>
                  {new Date(preset.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div style={{ 
                marginTop: '6px', 
                fontSize: '12px', 
                color: '#a0a0a0' 
              }}>
                {Object.keys(preset.settings || {}).length} adjustments
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PresetSelector;
