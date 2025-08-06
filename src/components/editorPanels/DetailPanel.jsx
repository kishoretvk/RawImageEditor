import React from 'react';
import SliderControl from '../SliderControl';
import '../../styles/tokens.css';
import Panel from '../ui/Panel.jsx';
import Button from '../ui/Button.jsx';

// Defaults confirmed by plan
const DEFAULTS = {
  lumaNR: 0,        // 0..100
  chromaNR: 0,      // 0..100
  sharpenAmount: 40,// 0..150
  sharpenRadius: 1, // 0.5..3.0
  sharpenDetail: 25,// 0..100
  sharpenMasking: 0 // 0..100
};

export default function DetailPanel({ detail = DEFAULTS, onChange }) {
  const val = { ...DEFAULTS, ...(detail || {}) };
  const update = (k, v) => onChange && onChange({ ...val, [k]: v });
  const handleReset = () => onChange && onChange({ ...DEFAULTS });

  return (
    <Panel
      title="Detail (NR + Sharpen)"
      actions={<Button size="sm" variant="secondary" onClick={handleReset}>Reset</Button>}
      className="is-compact"
    >
      <div className="space-y-4">
        <section>
          <h4 className="text-sm font-medium mb-2">Noise Reduction</h4>
          <SliderControl
            label="Luminance NR"
            min={0}
            max={100}
            step={1}
            value={val.lumaNR}
            onChange={(v) => update('lumaNR', v)}
          />
          <SliderControl
            label="Color NR"
            min={0}
            max={100}
            step={1}
            value={val.chromaNR}
            onChange={(v) => update('chromaNR', v)}
          />
        </section>

        <section>
          <h4 className="text-sm font-medium mb-2">Sharpening</h4>
          <SliderControl
            label="Amount"
            min={0}
            max={150}
            step={1}
            value={val.sharpenAmount}
            onChange={(v) => update('sharpenAmount', v)}
          />
          <SliderControl
            label="Radius"
            min={0.5}
            max={3.0}
            step={0.1}
            value={val.sharpenRadius}
            onChange={(v) => update('sharpenRadius', v)}
          />
          <SliderControl
            label="Detail"
            min={0}
            max={100}
            step={1}
            value={val.sharpenDetail}
            onChange={(v) => update('sharpenDetail', v)}
          />
          <SliderControl
            label="Masking"
            min={0}
            max={100}
            step={1}
            value={val.sharpenMasking}
            onChange={(v) => update('sharpenMasking', v)}
          />
        </section>
      </div>
    </Panel>
  );
}
