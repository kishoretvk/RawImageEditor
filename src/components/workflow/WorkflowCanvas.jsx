import React from 'react';
import { NodeTypes, defaultParamsFor } from './nodeDefinitions';
import RegionPicker from '../RegionPicker';

export default function WorkflowCanvas({ nodes, selectedIndex, onSelect, onChange, onAddAfter, onRemove, onMoveUp, onMoveDown }) {
  const handleToggle = (i) => {
    const n = nodes[i];
    onChange(i, { ...n, enabled: !n.enabled });
  };

  const handleParamChange = (i, key, value) => {
    const n = nodes[i];
    onChange(i, { ...n, params: { ...n.params, [key]: value } });
  };

  const handlePresetSelect = (i, key, id) => {
    const n = nodes[i];
    onChange(i, { ...n, params: { ...n.params, [key]: id } });
  };

  return (
    <div className="wf-canvas">
      {nodes.map((n, i) => {
        const def = NodeTypes[n.type];
        const isSel = i === selectedIndex;
        return (
          <div key={n.id} className={`wf-node ${isSel ? 'selected' : ''}`} onClick={() => onSelect(i)}>
            <div className="wf-node-header">
              <div className="wf-node-title">
                <span className={`dot ${n.enabled !== false ? 'on' : 'off'}`} />
                {def?.name || n.type}
              </div>
              <div className="wf-node-actions">
                <button onClick={(e) => { e.stopPropagation(); onMoveUp(i); }}>↑</button>
                <button onClick={(e) => { e.stopPropagation(); onMoveDown(i); }}>↓</button>
                <button onClick={(e) => { e.stopPropagation(); handleToggle(i); }}>{n.enabled !== false ? 'Disable' : 'Enable'}</button>
                <button onClick={(e) => { e.stopPropagation(); onRemove(i); }}>Delete</button>
                <button onClick={(e) => { e.stopPropagation(); onAddAfter(i, n.type); }}>Duplicate</button>
              </div>
            </div>

            {isSel && (
              <div className="wf-node-body">
                {renderInspector(def, n.params, {
                  onChange: (key, val) => handleParamChange(i, key, val),
                  onPresetSelect: (key, id) => handlePresetSelect(i, key, id),
                })}
              </div>
            )}
          </div>
        );
      })}
      {nodes.length === 0 && (
        <div className="wf-empty">
          <p>No nodes yet. Add nodes from the palette to build your workflow.</p>
        </div>
      )}

      <style>{styles}</style>
    </div>
  );
}

function renderInspector(def, params = {}, api) {
  if (!def) return null;
  const items = def.inspector || [];
  return (
    <div className="inspector">
      {items.map((it) => {
        const key = it.key;
        const val = params[key];
        switch (it.type) {
          case 'text':
            return field(it.label, <input type="text" value={val || ''} onChange={(e) => api.onChange(key, e.target.value)} />);
          case 'number': {
            const attrs = {};
            if (Number.isFinite(it.min)) attrs.min = it.min;
            if (Number.isFinite(it.max)) attrs.max = it.max;
            if (Number.isFinite(it.step)) attrs.step = it.step;
            return field(it.label, <input type="number" {...attrs} value={Number.isFinite(val) ? val : (it.min ?? 0)} onChange={(e) => api.onChange(key, numOr(e.target.value, it.min ?? 0))} />);
          }
          case 'boolean':
            return field(it.label, (
              <label className="checkbox">
                <input type="checkbox" checked={!!val} onChange={(e) => api.onChange(key, e.target.checked)} />
                <span />
              </label>
            ));
          case 'select':
            return field(it.label, (
              <select value={val ?? it.options?.[0]} onChange={(e) => api.onChange(key, e.target.value)}>
                {(it.options || []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ));
          case 'json':
            return field(it.label, (
              <textarea value={toJSON(val)} onChange={(e) => {
                try { api.onChange(key, JSON.parse(e.target.value || '{}')); } catch {}
              }} rows={4} />
            ));
          case 'preset':
            return field(it.label, (
              <PresetDropdown presetType={it.presetType} value={val || ''} onChange={(id) => api.onPresetSelect(key, id)} />
            ));
          case 'region':
            return field(it.label, (
              <RegionPicker
                imageUrl=""
                value={val || { x: 0.4, y: 0.4, w: 0.2, h: 0.2 }}
                onChange={(rect) => api.onChange(key, rect)}
                width={320}
                height={180}
              />
            ));
          default:
            return null;
        }
      })}
    </div>
  );
}

function field(label, control) {
  return (
    <div className="field-row" key={label}>
      <label>{label}</label>
      <div className="control">{control}</div>
    </div>
  );
}

function toJSON(val) {
  try { return JSON.stringify(val ?? {}, null, 2); } catch { return '{}'; }
}

function numOr(x, fb) {
  const n = Number(x);
  return Number.isFinite(n) ? n : fb;
}

function PresetDropdown({ presetType, value, onChange }) {
  const [opts, setOpts] = React.useState([]);
  React.useEffect(() => {
    let mounted = true;
    import('../../utils/presets/presetStore').then(({ PresetStore }) => {
      if (!mounted) return;
      const list = PresetStore.list(presetType) || [];
      setOpts(list);
    }).catch(() => setOpts([]));
    return () => { mounted = false; };
  }, [presetType]);

  return (
    <select value={value || ''} onChange={(e) => onChange(e.target.value || '')}>
      <option value="">-- none --</option>
      {opts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
    </select>
  );
}

const styles = `
.wf-canvas { padding: 12px; }
.wf-empty { color: #97a3b6; padding: 16px; border: 1px dashed rgba(255,255,255,0.12); border-radius: 8px; }
.wf-node {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  margin-bottom: 10px;
}
.wf-node.selected {
  border-color: rgba(102,126,234,0.5);
  box-shadow: 0 0 0 2px rgba(102,126,234,0.25) inset;
}
.wf-node-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 10px;
  font-weight: 600;
}
.wf-node-title { display: flex; align-items: center; gap: 8px; }
.dot { width: 8px; height: 8px; border-radius: 999px; background: #8892a6; display: inline-block; }
.dot.on { background: #6ee7b7; }
.dot.off { background: #ef9a9a; }
.wf-node-actions button {
  margin-left: 6px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  color: #e6e9ef; padding: 4px 8px; border-radius: 6px; cursor: pointer;
}
.wf-node-actions button:hover {
  background: rgba(102,126,234,0.18);
  border-color: rgba(102,126,234,0.35);
}
.wf-node-body { padding: 10px; border-top: 1px solid rgba(255,255,255,0.06); }

.inspector .field-row { display: grid; grid-template-columns: 160px 1fr; align-items: center; gap: 10px; margin-bottom: 10px; }
.inspector label { font-size: 12px; color: #9aa4b2; }
.inspector input[type="text"], .inspector input[type="number"], .inspector select, .inspector textarea {
  width: 100%; padding: 6px 8px; border-radius: 6px;
  background: rgba(255,255,255,0.06); color: #e6e9ef;
  border: 1px solid rgba(255,255,255,0.1);
}
.checkbox { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; }
`;
