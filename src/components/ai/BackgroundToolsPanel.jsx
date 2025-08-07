import React, { useState } from 'react';

export default function BackgroundToolsPanel({
  defaultBlur = 10,
  onBlurChange,
  onPreloadModels, // optional callback to warm up AI model cache
}) {
  const [blurStrength, setBlurStrength] = useState(defaultBlur);

  const handleBlurChange = (e) => {
    const v = Math.max(0, Math.min(100, Number(e.target.value) || 0));
    setBlurStrength(v);
    onBlurChange && onBlurChange(v);
  };

  return (
    <div>
      {/* Header row actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontWeight: 600 }}>Background Tools</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn secondary"
            type="button"
            onClick={() => onPreloadModels && onPreloadModels()}
            title="Preload AI models into cache to speed up first run"
          >
            Preload Models
          </button>
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: 6 }}>
          Blur Strength <span style={{ opacity: 0.7 }}>{blurStrength}</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={blurStrength}
          onChange={handleBlurChange}
          style={{ width: '100%' }}
        />
      </div>

      <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
        Blur uses the subject mask to preserve the foreground sharpness. Remove makes background transparent for PNG export or compositing.
      </div>
    </div>
  );
}
