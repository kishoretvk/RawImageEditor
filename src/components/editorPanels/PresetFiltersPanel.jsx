import React from "react";

/**
 * PresetFiltersPanel - apply preset filter looks (e.g., Warm, Cool, B&W)
 * Props:
 *   edits: current edits object
 *   updateEdits: function to update edits
 */
const PRESETS = [
  { name: "Warm", values: { temperature: 20, tint: 10 } },
  { name: "Cool", values: { temperature: -20, tint: -10 } },
  { name: "B&W", values: { saturation: -100, contrast: 20 } },
  { name: "Vivid", values: { vibrance: 30, contrast: 15 } },
];

const PresetFiltersPanel = ({ edits, updateEdits }) => {
  return (
    <section className="mb-4">
      <h3 className="text-lg font-semibold mb-2">Presets</h3>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.name}
            className="btn btn-xs btn-secondary"
            onClick={() => updateEdits(preset.values)}
            title={`Apply ${preset.name}`}
          >
            {preset.name}
          </button>
        ))}
      </div>
    </section>
  );
};

export default PresetFiltersPanel;
