import React from 'react';

export default function LocalAdjustmentsPanel({
  masks = [],
  onChange,
  onEditOverlay, // (maskId) => void, instructs page to show overlay for this mask
}) {
  const updateMask = (id, patch) => {
    const next = masks.map(m => (m.id === id ? { ...m, ...patch } : m));
    onChange && onChange(next);
  };

  const addGradient = () => {
    const id = 'grad-' + Math.random().toString(36).slice(2, 8);
    const m = {
      id,
      type: 'gradient',
      enabled: true,
      start: { x: 0.25, y: 0.25 },
      end: { x: 0.75, y: 0.75 },
      feather: 0.2,
      invert: false,
      adjustments: {
        exposure: 0,
        contrast: 0,
        saturation: 0,
      }
    };
    onChange && onChange([...(masks || []), m]);
  };

  const removeMask = (id) => {
    const next = (masks || []).filter(m => m.id !== id);
    onChange && onChange(next);
  };

  const MaskCard = ({ mask }) => {
    const adj = mask.adjustments || {};
    return (
      <div className="p-2 rounded border border-white/10 bg-white/5 mb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold">
            {mask.type === 'gradient' ? 'Gradient Mask' : (mask.type || 'Mask')} — {mask.id}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs flex items-center gap-1">
              <input
                type="checkbox"
                checked={!!mask.enabled}
                onChange={(e) => updateMask(mask.id, { enabled: !!e.target.checked })}
              />
              Enabled
            </label>
            <button className="header-button" onClick={() => onEditOverlay && onEditOverlay(mask.id)}>Edit</button>
            <button className="header-button" onClick={() => removeMask(mask.id)}>Remove</button>
          </div>
        </div>

        {mask.type === 'gradient' && (
          <>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <FloatField
                label="Start X"
                min={0}
                max={1}
                step={0.01}
                value={mask.start?.x ?? 0.25}
                onChange={(v) => updateMask(mask.id, { start: { ...(mask.start || {}), x: clamp01(v) } })}
              />
              <FloatField
                label="Start Y"
                min={0}
                max={1}
                step={0.01}
                value={mask.start?.y ?? 0.25}
                onChange={(v) => updateMask(mask.id, { start: { ...(mask.start || {}), y: clamp01(v) } })}
              />
              <FloatField
                label="End X"
                min={0}
                max={1}
                step={0.01}
                value={mask.end?.x ?? 0.75}
                onChange={(v) => updateMask(mask.id, { end: { ...(mask.end || {}), x: clamp01(v) } })}
              />
              <FloatField
                label="End Y"
                min={0}
                max={1}
                step={0.01}
                value={mask.end?.y ?? 0.75}
                onChange={(v) => updateMask(mask.id, { end: { ...(mask.end || {}), y: clamp01(v) } })}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <FloatField
                label="Feather"
                min={0}
                max={0.5}
                step={0.01}
                value={mask.feather ?? 0.2}
                onChange={(v) => updateMask(mask.id, { feather: clamp(v, 0, 0.5) })}
              />
              <label className="text-xs flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!mask.invert}
                  onChange={(e) => updateMask(mask.id, { invert: !!e.target.checked })}
                />
                Invert
              </label>
            </div>
          </>
        )}

        <div className="mt-2">
          <div className="text-xs opacity-80 mb-1">Local Adjustments</div>
          <SliderField
            label="Exposure"
            min={-2}
            max={2}
            step={0.05}
            value={adj.exposure ?? 0}
            onChange={(v) => updateMask(mask.id, { adjustments: { ...adj, exposure: v } })}
          />
          <SliderField
            label="Contrast"
            min={-100}
            max={100}
            step={1}
            value={adj.contrast ?? 0}
            onChange={(v) => updateMask(mask.id, { adjustments: { ...adj, contrast: v } })}
          />
          <SliderField
            label="Saturation"
            min={-100}
            max={100}
            step={1}
            value={adj.saturation ?? 0}
            onChange={(v) => updateMask(mask.id, { adjustments: { ...adj, saturation: v } })}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between mb-1">
        <div className="text-sm opacity-80">Create and tune local adjustments using masks.</div>
        <div className="flex gap-2">
          <button className="header-button" onClick={addGradient}>Add Gradient</button>
        </div>
      </div>

      {(masks && masks.length > 0) ? (
        masks.map(m => <MaskCard key={m.id} mask={m} />)
      ) : (
        <div className="text-xs opacity-70">No local masks added yet.</div>
      )}
    </div>
  );
}

function SliderField({ label, min, max, step, value, onChange }) {
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
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: '100%' }}
      />
    </div>
  );
}

function FloatField({ label, min, max, step, value, onChange }) {
  return (
    <label className="text-xs flex items-center justify-between gap-2">
      <span>{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ width: 100 }}
      />
    </label>
  );
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
function clamp01(v) { return clamp(v, 0, 1); }
