import React from 'react';

const SliderControl = ({ label, value, min, max, step, onChange }) => (
  <div className="mb-4">
    <label className="block text-white mb-2">{label}</label>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full"
    />
    <div className="text-xs text-gray-400 mt-1">{value}</div>
  </div>
);

export default SliderControl;
