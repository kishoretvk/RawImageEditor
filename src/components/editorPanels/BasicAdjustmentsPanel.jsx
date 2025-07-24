import React from 'react';

const SliderControl = ({ label, value, min, max, step = 0.01, onChange, defaultValue }) => {
  const handleDoubleClick = () => {
    onChange(defaultValue);
  };

  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-gray-400 mb-1">
        {label} <span className="float-right text-gray-500">{value.toFixed(2)}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        onDoubleClick={handleDoubleClick}
        className="w-full appearance-none h-2 bg-gray-300 rounded-full outline-none slider-thumb transition"
      />
    </div>
  );
};

const BasicAdjustmentsPanel = ({ edits = {}, onChange }) => {
  const updateEdit = (key, val) => {
    onChange({
      ...edits,
      [key]: val,
    });
  }

  return (
    <div className="w-full bg-white/5 backdrop-blur-md rounded-xl p-6 shadow-md text-white space-y-6">
      <h2 className="text-sm font-semibold tracking-wider text-gray-300 uppercase mb-4">
        Basic Adjustments
      </h2>

      {/* Exposure & Tonal Group */}
      <div>
        <h3 className="text-xs uppercase text-gray-400 mb-2">Exposure & Tone</h3>
        <SliderControl
          label="Exposure"
          value={edits.exposure || 0}
          min={-2}
          max={2}
          step={0.05}
          defaultValue={0}
          onChange={(v) => updateEdit('exposure', v)}
        />
        <SliderControl
          label="Contrast"
          value={edits.contrast || 0}
          min={-100}
          max={100}
          step={1}
          defaultValue={0}
          onChange={(v) => updateEdit('contrast', v)}
        />
        <SliderControl
          label="Highlights"
          value={edits.highlights || 0}
          min={-100}
          max={100}
          step={1}
          defaultValue={0}
          onChange={(v) => updateEdit('highlights', v)}
        />
        <SliderControl
          label="Shadows"
          value={edits.shadows || 0}
          min={-100}
          max={100}
          step={1}
          defaultValue={0}
          onChange={(v) => updateEdit('shadows', v)}
        />
        <SliderControl
          label="Whites"
          value={edits.whites || 0}
          min={-100}
          max={100}
          step={1}
          defaultValue={0}
          onChange={(v) => updateEdit('whites', v)}
        />
        <SliderControl
          label="Blacks"
          value={edits.blacks || 0}
          min={-100}
          max={100}
          step={1}
          defaultValue={0}
          onChange={(v) => updateEdit('blacks', v)}
        />
        <SliderControl
          label="Gamma"
          value={edits.gamma || 1}
          min={0.2}
          max={3}
          step={0.01}
          defaultValue={1}
          onChange={(v) => updateEdit('gamma', v)}
        />
      </div>

      {/* Clarity / Dehaze */}
      <div>
        <h3 className="text-xs uppercase text-gray-400 mb-2">Texture & Clarity</h3>
        <SliderControl
          label="Clarity"
          value={edits.clarity || 0}
          min={-100}
          max={100}
          step={1}
          defaultValue={0}
          onChange={(v) => updateEdit('clarity', v)}
        />
        <SliderControl
          label="Dehaze"
          value={edits.dehaze || 0}
          min={-100}
          max={100}
          step={1}
          defaultValue={0}
          onChange={(v) => updateEdit('dehaze', v)}
        />
      </div>

      {/* Color Adjustments */}
      <div>
        <h3 className="text-xs uppercase text-gray-400 mb-2">Color</h3>
        <SliderControl
          label="Saturation"
          value={edits.saturation || 0}
          min={-100}
          max={100}
          step={1}
          defaultValue={0}
          onChange={(v) => updateEdit('saturation', v)}
        />
        <SliderControl
          label="Vibrance"
          value={edits.vibrance || 0}
          min={-100}
          max={100}
          step={1}
          defaultValue={0}
          onChange={(v) => updateEdit('vibrance', v)}
        />
        <SliderControl
          label="Temperature"
          value={edits.temperature || 0}
          min={-100}
          max={100}
          step={1}
          defaultValue={0}
          onChange={(v) => updateEdit('temperature', v)}
        />
        <SliderControl
          label="Tint"
          value={edits.tint || 0}
          min={-100}
          max={100}
          step={1}
          defaultValue={0}
          onChange={(v) => updateEdit('tint', v)}
        />
      </div>

      {/* Reset All */}
      <div className="pt-2">
        <button
          onClick={() => onChange({})}
          className="text-xs text-red-400 hover:text-red-500 underline"
        >
          Reset All Adjustments
        </button>
      </div>
    </div>
  );
};

export default BasicAdjustmentsPanel;
