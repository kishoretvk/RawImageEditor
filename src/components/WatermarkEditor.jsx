import React, { useMemo, useState } from 'react';
import { PresetStore } from '../utils/presets/presetStore';

const defaultWatermarkSettings = {
  type: 'text',          // 'text' | 'png'
  text: '© RawImageEditor',
  fontFamily: 'Arial, sans-serif',
  fontSize: 24,          // px
  opacity: 0.3,          // 0..1
  position: 'br',        // 'tl'|'tr'|'bl'|'br' (top/bottom + left/right)
  offsetX: 16,           // px
  offsetY: 16,           // px
  pngSrc: '',            // data URL or object URL
  scale: 1.0,            // applied for png
};

export default function WatermarkEditor() {
  const [presets, setPresets] = useState(() => PresetStore.list('watermark'));
  const [selectedId, setSelectedId] = useState(presets[0]?.id || null);
  const selected = useMemo(
    () => (selectedId ? PresetStore.get('watermark', selectedId) : null),
    [selectedId]
  );

  const [draft, setDraft] = useState(() => ({
    id: '',
    name: 'New Watermark Preset',
    settings: { ...defaultWatermarkSettings }
  }));

  const onSelect = (e) => {
    const id = e.target.value || null;
    setSelectedId(id);
    if (id) {
      const p = PresetStore.get('watermark', id);
      if (p) setDraft({ id: p.id, name: p.name, settings: { ...defaultWatermarkSettings, ...(p.settings || {}) } });
    }
  };

  const updateSetting = (key, val) => {
    setDraft((d) => ({ ...d, settings: { ...d.settings, [key]: val } }));
  };

  const onPickPng = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = URL.createObjectURL(file);
      // keep as object URL to avoid huge localStorage usage; user can re-pick later as needed
      updateSetting('pngSrc', url);
    } catch {}
  };

  const savePreset = () => {
    const payload = {
      id: draft.id || undefined,
      name: draft.name?.trim() || 'Watermark Preset',
      settings: { ...defaultWatermarkSettings, ...(draft.settings || {}) },
    };
    const saved = PresetStore.save('watermark', payload);
    setPresets(PresetStore.list('watermark'));
    setSelectedId(saved.id);
  };

  const newPreset = () => {
    setSelectedId(null);
    setDraft({
      id: '',
      name: 'New Watermark Preset',
      settings: { ...defaultWatermarkSettings }
    });
  };

  const deletePreset = () => {
    if (!selectedId) return;
    PresetStore.delete('watermark', selectedId);
    const next = PresetStore.list('watermark');
    setPresets(next);
    setSelectedId(next[0]?.id || null);
    if (!next.length) newPreset();
  };

  return (
    <div className="preset-editor watermark-preset-editor">
      <h3 className="title">Watermark Preset Editor</h3>

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
          <label>Type</label>
          <select
            value={draft.settings.type}
            onChange={(e) => updateSetting('type', e.target.value)}
          >
            <option value="text">Text</option>
            <option value="png">PNG</option>
          </select>
        </div>

        {draft.settings.type === 'text' ? (
          <>
            <div className="cell">
              <label>Text</label>
              <input
                type="text"
                value={draft.settings.text}
                onChange={(e) => updateSetting('text', e.target.value)}
              />
            </div>
            <div className="cell">
              <label>Font Family</label>
              <input
                type="text"
                value={draft.settings.fontFamily}
                onChange={(e) => updateSetting('fontFamily', e.target.value)}
              />
            </div>
            <div className="cell">
              <label>Font Size (px)</label>
              <input
                type="number"
                min="6"
                step="1"
                value={draft.settings.fontSize}
                onChange={(e) => updateSetting('fontSize', Math.max(6, Number(e.target.value) || 12))}
              />
            </div>
          </>
        ) : (
          <>
            <div className="cell">
              <label>PNG Image</label>
              <input type="file" accept="image/png" onChange={onPickPng} />
              {draft.settings.pngSrc ? <small>Image selected</small> : <small>No image selected</small>}
            </div>
            <div className="cell">
              <label>Scale</label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={draft.settings.scale}
                onChange={(e) => updateSetting('scale', Math.max(0.1, Number(e.target.value) || 1))}
              />
            </div>
          </>
        )}

        <div className="cell">
          <label>Opacity (0..1)</label>
          <input
            type="number"
            min="0"
            max="1"
            step="0.05"
            value={draft.settings.opacity}
            onChange={(e) => updateSetting('opacity', clamp01(e.target.value))}
          />
        </div>

        <div className="cell">
          <label>Position</label>
          <select
            value={draft.settings.position}
            onChange={(e) => updateSetting('position', e.target.value)}
          >
            <option value="tl">Top-Left</option>
            <option value="tr">Top-Right</option>
            <option value="bl">Bottom-Left</option>
            <option value="br">Bottom-Right</option>
          </select>
        </div>

        <div className="cell">
          <label>Offset X (px)</label>
          <input
            type="number"
            step="1"
            value={draft.settings.offsetX}
            onChange={(e) => updateSetting('offsetX', Number(e.target.value) || 0)}
          />
        </div>
        <div className="cell">
          <label>Offset Y (px)</label>
          <input
            type="number"
            step="1"
            value={draft.settings.offsetY}
            onChange={(e) => updateSetting('offsetY', Number(e.target.value) || 0)}
          />
        </div>
      </div>
    </div>
  );
}

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0.3;
  return Math.max(0, Math.min(1, n));
}
