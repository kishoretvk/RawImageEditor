import React from 'react';
import '../../styles/tokens.css';
import Panel from '../ui/Panel.jsx';
import Button from '../ui/Button.jsx';

const BANDS = [
  { key: 'red', label: 'Red' },
  { key: 'orange', label: 'Orange' },
  { key: 'yellow', label: 'Yellow' },
  { key: 'green', label: 'Green' },
  { key: 'aqua', label: 'Aqua' },
  { key: 'blue', label: 'Blue' },
  { key: 'purple', label: 'Purple' },
  { key: 'magenta', label: 'Magenta' },
];

// Defaults per band
const defaultBand = { hue: 0, sat: 0, lum: 0 };

export function defaultHSLState() {
  return BANDS.reduce((acc, b) => {
    acc[b.key] = { ...defaultBand };
    return acc;
  }, {});
}

export default function HSLPanel({ hsl = defaultHSLState(), onChange }) {
  const update = (bandKey, field, value) => {
    const v = Number(value);
    const safe = Number.isFinite(v) ? v : 0;
    const clamped = clamp(field === 'hue' ? safe : safe, field === 'hue' ? -60 : -100, field === 'hue' ? 60 : 100);
    const next = {
      ...hsl,
      [bandKey]: {
        ...hsl[bandKey],
        [field]: clamped
      }
    };
    onChange && onChange(next);
  };

  const resetBand = (bandKey) => {
    const next = { ...hsl, [bandKey]: { ...defaultBand } };
    onChange && onChange(next);
  };

  const resetAll = () => {
    onChange && onChange(defaultHSLState());
  };

  return (
    <Panel title="HSL / Color Mixer" className="flex flex-col gap-3">
      <div className="flex justify-between items-center">
        <div className="text-sm opacity-80">Adjust hue, saturation, and luminance for specific color ranges.</div>
        <Button size="sm" variant="ghost" onClick={resetAll} title="Reset all HSL bands">Reset All</Button>
      </div>

      {BANDS.map(({ key, label }) => {
        const band = hsl[key] || defaultBand;
        return (
          <div key={key} className="p-2 rounded border border-white/10 bg-white/5">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-semibold">{label}</div>
              <Button size="sm" variant="secondary" onClick={() => resetBand(key)} title={`Reset ${label}`}>Reset</Button>
            </div>

            <LabeledSlider
              label="Hue"
              min={-60}
              max={60}
              step={1}
              value={band.hue}
              onChange={(v) => update(key, 'hue', v)}
            />
            <LabeledSlider
              label="Saturation"
              min={-100}
              max={100}
              step={1}
              value={band.sat}
              onChange={(v) => update(key, 'sat', v)}
            />
            <LabeledSlider
              label="Luminance"
              min={-100}
              max={100}
              step={1}
              value={band.lum}
              onChange={(v) => update(key, 'lum', v)}
            />
          </div>
        );
      })}
    </Panel>
  );
}

function LabeledSlider({ label, min, max, step, value, onChange }) {
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span>{label}</span>
        <span className="opacity-70">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%' }}
      />
    </div>
  );
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
