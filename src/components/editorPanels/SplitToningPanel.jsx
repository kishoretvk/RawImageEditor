import React from 'react';
import SliderControl from '../SliderControl';

export default function SplitToningPanel({ edits, onEditsChange }) {
  const handleChange = (key, value) => {
    onEditsChange({
      ...edits,
      splitToning: {
        ...edits.splitToning,
        [key]: value
      }
    });
  };

  const splitToning = edits.splitToning || {
    highlightsHue: 0,
    highlightsSat: 0,
    shadowsHue: 0,
    shadowsSat: 0,
    balance: 0
  };

  return (
    <div className="panel-content">
      <h3 className="panel-title">Split Toning</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Highlights</h4>
          <SliderControl
            label="Hue"
            value={splitToning.highlightsHue}
            min={0}
            max={360}
            step={1}
            onChange={(v) => handleChange('highlightsHue', v)}
            unit="°"
          />
          <SliderControl
            label="Saturation"
            value={splitToning.highlightsSat}
            min={0}
            max={100}
            step={1}
            onChange={(v) => handleChange('highlightsSat', v)}
            unit="%"
          />
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Shadows</h4>
          <SliderControl
            label="Hue"
            value={splitToning.shadowsHue}
            min={0}
            max={360}
            step={1}
            onChange={(v) => handleChange('shadowsHue', v)}
            unit="°"
          />
          <SliderControl
            label="Saturation"
            value={splitToning.shadowsSat}
            min={0}
            max={100}
            step={1}
            onChange={(v) => handleChange('shadowsSat', v)}
            unit="%"
          />
        </div>

        <SliderControl
          label="Balance"
          value={splitToning.balance}
          min={-100}
          max={100}
          step={1}
          onChange={(v) => handleChange('balance', v)}
        />
      </div>
    </div>
  );
}
