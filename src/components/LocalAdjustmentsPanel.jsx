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
