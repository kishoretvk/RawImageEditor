import React, { useMemo, useState } from 'react';
import { PresetStore } from '../utils/presets/presetStore';

const defaultExportSettings = {
  format: 'jpeg',        // 'jpeg' | 'png' | 'webp'
  mode: 'target',        // 'quality' | 'target'
  quality: 0.9,          // used if mode === 'quality'
  targetSizeMB: 2,       // used if mode === 'target'
  tolerancePct: 5,       // tolerance for target size
  longEdge: 0,           // 0 disables resizing; otherwise pixels for long edge
  filenamePattern: '{name}_edit',
  colorProfile: 'srgb',  // placeholder
};

export default function ExportPresetEditor() {
  const [presets, setPresets] = useState(() => PresetStore.list('export'));
  const [selectedId, setSelectedId] = useState(presets[0]?.id || null);
  const selected = useMemo(
    () => (selectedId ? PresetStore.get('export', selectedId) : null),
    [selectedId]
  );

  const [draft, setDraft] = useState(() => ({
    id: '',
    name: 'New Export Preset',
    settings: { ...defaultExportSettings }
  }));

  const onSelect = (e) => {
    const id = e.target.value || null;
    setSelectedId(id);
    if (id) {
      const p = PresetStore.get('export', id);
      if (p) setDraft({ id: p.id, name: p.name, settings: { ...defaultExportSettings, ...(p.settings || {}) } });
    }
  };

  const updateSetting = (key, val) => {
    setDraft((d) => ({ ...d, settings: { ...d.settings, [key]: val } }));
  };

  const savePreset = () => {
    const payload = {
      id: draft.id || undefined,
      name: draft.name?.trim() || 'Export Preset',
      settings: { ...defaultExportSettings, ...(draft.settings || {}) },
    };
    const saved = PresetStore.save('export', payload);
    setPresets(PresetStore.list('export'));
    setSelectedId(saved.id);
  };

  const newPreset = () => {
    setSelectedId(null);
    setDraft({
      id: '',
      name: 'New Export Preset',
      settings: { ...defaultExportSettings }
    });
  };

  const deletePreset = () => {
    if (!selectedId) return;
    PresetStore.delete('export', selectedId);
    const next = PresetStore.list('export');
    setPresets(next);
    setSelectedId(next[0]?.id || null);
    if (!next.length) newPreset();
  };

  return (
    <div className="preset-editor export-preset-editor">
      <h3 className="title">Export Preset Editor</h3>

      <div className="row">
        <label>Existing Presets</label>
        <select value={selectedId || ''} onChange={onSelect}>
          <option value="">-- none --</option>
          {presets.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <div className="actions">
          <button onClick={newPreset}>New</button>
          <button onClick={savePreset}>Save</button>
          <button onClick={deletePreset} disabled={!selectedId}>Delete</button>
        </div>
      </div>

      <div className="row">
        <label>Preset Name</label>
        <input
          type="text"
          value={draft.name}
          onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
        />
      </div>

      <div className="grid">
        <div className="cell">
          <label>Format</label>
          <select
            value={draft.settings.format}
            onChange={(e) => updateSetting('format', e.target.value)}
          >
            <option value="jpeg">JPEG</option>
            <option value="png">PNG</option>
            <option value="webp">WEBP</option>
          </select>
        </div>

        <div className="cell">
          <label>Mode</label>
          <select
            value={draft.settings.mode}
            onChange={(e) => updateSetting('mode', e.target.value)}
          >
            <option value="target">Target Size</option>
            <option value="quality">Quality</option>
          </select>
        </div>

        {draft.settings.mode === 'quality' ? (
          <div className="cell">
            <label>Quality (0..1)</label>
            <input
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={draft.settings.quality}
              onChange={(e) => updateSetting('quality', clamp01(e.target.value))}
            />
          </div>
        ) : (
          <>
            <div className="cell">
              <label>Target Size (MB)</label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={draft.settings.targetSizeMB}
                onChange={(e) => updateSetting('targetSizeMB', Number(e.target.value) || 1)}
              />
            </div>
            <div className="cell">
              <label>Tolerance (%)</label>
              <input
                type="number"
                min="1"
                max="20"
                step="1"
                value={draft.settings.tolerancePct}
                onChange={(e) => updateSetting('tolerancePct', Number(e.target.value) || 5)}
              />
            </div>
          </>
        )}

        <div className="cell">
          <label>Long Edge (px)</label>
          <input
            type="number"
            min="0"
            step="1"
            value={draft.settings.longEdge}
            onChange={(e) => updateSetting('longEdge', Math.max(0, Number(e.target.value) || 0))}
          />
          <small>0 disables resizing</small>
        </div>

        <div className="cell">
          <label>Filename Pattern</label>
          <input
            type="text"
            value={draft.settings.filenamePattern}
            onChange={(e) => updateSetting('filenamePattern', e.target.value)}
          />
          <small>Use {'{name}'} for original base name</small>
        </div>

        <div className="cell">
          <label>Color Profile</label>
          <select
            value={draft.settings.colorProfile}
            onChange={(e) => updateSetting('colorProfile', e.target.value)}
          >
            <option value="srgb">sRGB</option>
            <option value="display-p3">Display-P3</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 1;
  return Math.max(0, Math.min(1, n));
}
