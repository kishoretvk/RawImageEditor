import React from 'react';

const SliderControl = ({ value, onChange, min = 0, max = 100, step = 1, label = "Slider Position" }) => {
  return (
    <div className="slider-control">
      <label className="block text-sm font-medium mb-1">
        {label}: {value.toFixed(0)}%
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
      />
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>0%</span>
        <span>100%</span>
      </div>
    </div>
  );
};

export default SliderControl;
