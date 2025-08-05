import React from 'react';
import '../../styles/tokens.css';
import Button from '../ui/Button.jsx';
import Panel from '../ui/Panel.jsx';

const SliderControl = ({ label, value, min, max, step = 0.01, onChange, defaultValue }) => {
  // Guard against undefined/NaN so the slider is always controlled
  const safeValue = Number.isFinite(value) ? value : (Number.isFinite(defaultValue) ? defaultValue : 0);

  const handleDoubleClick = () => {
    if (typeof defaultValue === 'number') {
      onChange(defaultValue);
    }
  };

  const handleChange = (e) => {
    const next = parseFloat(e.target.value);
    onChange(Number.isFinite(next) ? next : (Number.isFinite(defaultValue) ? defaultValue : 0));
  };

  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-gray-400 mb-1">
        {label} <span className="float-right text-gray-500">{Number.isFinite(safeValue) ? safeValue.toFixed(2) : '0.00'}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={safeValue}
        onChange={handleChange}
        onDoubleClick={handleDoubleClick}
        className="w-full appearance-none h-2 bg-gray-300 rounded-full outline-none slider-thumb transition"
      />
    </div>
  );
};

const BasicAdjustmentsPanel = ({ edits = {}, onChange }) => {
  const normalized = {
    exposure: Number.isFinite(edits.exposure) ? edits.exposure : 0,
    contrast: Number.isFinite(edits.contrast) ? edits.contrast : 0,
    highlights: Number.isFinite(edits.highlights) ? edits.highlights : 0,
    shadows: Number.isFinite(edits.shadows) ? edits.shadows : 0,
    whites: Number.isFinite(edits.whites) ? edits.whites : 0,
    blacks: Number.isFinite(edits.blacks) ? edits.blacks : 0,
    gamma: Number.isFinite(edits.gamma) ? edits.gamma : 1,
    clarity: Number.isFinite(edits.clarity) ? edits.clarity : 0,
    dehaze: Number.isFinite(edits.dehaze) ? edits.dehaze : 0,
    saturation: Number.isFinite(edits.saturation) ? edits.saturation : 0,
    vibrance: Number.isFinite(edits.vibrance) ? edits.vibrance : 0,
    temperature: Number.isFinite(edits.temperature) ? edits.temperature : 0,
    tint: Number.isFinite(edits.tint) ? edits.tint : 0,
  };

  const updateEdit = (key, val) => {
    const next = { ...normalized, ...edits, [key]: val };
    onChange(next);
  }

  return (
    <Panel title="Basic Adjustments" className="w-full space-y-6">

      {/* Exposure & Tonal Group */}
      <div>
        <h3 className="text-xs uppercase text-gray-400 mb-2">Exposure & Tone</h3>
        <SliderControl
          label="Exposure"
          value={normalized.exposure}
          min={-2}
          max={2}
          step={0.05}
          defaultValue={0}
          onChange={(v) => updateEdit('exposure', v)}
        />
        <SliderControl
          label="Contrast"
          value={normalized.contrast}
          min={-100}
          max={100}
          step={1}
          defaultValue={0}
          onChange={(v) => updateEdit('contrast', v)}
        />
        <SliderControl
          label="Highlights"
          value={normalized.highlights}
          min={-100}
          max={100}
          step={1}
          defaultValue={0}
          onChange={(v) => updateEdit('highlights', v)}
        />
        <SliderControl
          label="Shadows"
          value={normalized.shadows}
          min={-100}
          max={100}
          step={1}
          defaultValue={0}
          onChange={(v) => updateEdit('shadows', v)}
        />
        <SliderControl
          label="Whites"
          value={normalized.whites}
          min={-100}
          max={100}
          step={1}
          defaultValue={0}
          onChange={(v) => updateEdit('whites', v)}
        />
        <SliderControl
          label="Blacks"
          value={normalized.blacks}
          min={-100}
          max={100}
          step={1}
          defaultValue={0}
          onChange={(v) => updateEdit('blacks', v)}
        />
        <SliderControl
          label="Gamma"
          value={normalized.gamma}
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
          value={normalized.clarity}
          min={-100}
          max={100}
          step={1}
          defaultValue={0}
          onChange={(v) => updateEdit('clarity', v)}
        />
        <SliderControl
          label="Dehaze"
          value={normalized.dehaze}
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
          value={normalized.saturation}
          min={-100}
          max={100}
          step={1}
          defaultValue={0}
          onChange={(v) => updateEdit('saturation', v)}
        />
        <SliderControl
          label="Vibrance"
          value={normalized.vibrance}
          min={-100}
          max={100}
          step={1}
          defaultValue={0}
          onChange={(v) => updateEdit('vibrance', v)}
        />
        <SliderControl
          label="Temperature"
          value={normalized.temperature}
          min={-100}
          max={100}
          step={1}
          defaultValue={0}
          onChange={(v) => updateEdit('temperature', v)}
        />
        <SliderControl
          label="Tint"
          value={normalized.tint}
          min={-100}
          max={100}
          step={1}
          defaultValue={0}
          onChange={(v) => updateEdit('tint', v)}
        />
      </div>

      {/* Reset All */}
      <div className="pt-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onChange({})}
        >
          Reset All Adjustments
        </Button>
      </div>
    </Panel>
  );
};

export default BasicAdjustmentsPanel;
