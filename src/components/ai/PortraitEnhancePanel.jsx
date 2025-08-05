import React, { useState } from 'react';

export default function PortraitEnhancePanel({ defaultStrength = 50, onStrengthChange }) {
  const [strength, setStrength] = useState(defaultStrength);

  const handleChange = (e) => {
    const v = Math.max(0, Math.min(100, Number(e.target.value) || 0));
    setStrength(v);
    onStrengthChange && onStrengthChange(v);
  };

  return (
    <div>
      <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: 6 }}>
        Strength <span style={{ opacity: 0.7 }}>{strength}</span>
      </label>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={strength}
        onChange={handleChange}
        style={{ width: '100%' }}
      />
      <div style={{ fontSize: '0.85rem', opacity: 0.8, marginTop: 6 }}>
        Applies subject-aware exposure, mid-contrast curve, warmth, subtle saturation, and vibrance.
      </div>
    </div>
  );
}
