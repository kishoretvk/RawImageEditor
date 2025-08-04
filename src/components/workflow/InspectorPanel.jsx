import React from 'react';
import RegionPicker from '../RegionPicker';
import ExportPresetEditor from '../ExportPresetEditor';
import WatermarkEditor from '../WatermarkEditor';
import Modal from './Modal';

export default function InspectorPanel({ node, onChange, onOpenLogs, onRefreshPresets }) {
  const [modal, setModal] = React.useState({ open: false, kind: null });

  if (!node) {
    return (
      <aside className="inspector-panel">
        <div className="inspector-empty">
          <h4>No node selected</h4>
          <p>Select a node to edit its parameters.</p>
        </div>
        <style>{styles}</style>
      </aside>
    );
  }

  const def = nodeDefinitions[node.type] || { name: node.type, inspector: [] };

  const openPresetEditor = (kind) => setModal({ open: true, kind });
  const closePresetEditor = () => {
    setModal({ open: false, kind: null });
    onRefreshPresets?.();
  };

  return (
    <aside className="inspector-panel">
      <div className="inspector-header">
        <div className="title">
          <span className="chip">{def.name || node.type}</span>
        </div>
        <div className="actions">
          <button className="btn-small" onClick={onOpenLogs}>Logs</button>
          <button
            className={`btn-small ${node.enabled !== false ? 'on' : 'off'}`}
            onClick={() => onChange({ ...node, enabled: node.enabled === false })}
          >
            {node.enabled !== false ? 'Disable' : 'Enable'}
          </button>
        </div>
      </div>

      <div className="inspector-body">
        {renderFields(def.inspector || [], node.params || {}, (key, val) => {
          onChange({ ...node, params: { ...node.params, [key]: val } });
        }, { openPresetEditor })}
      </div>

      <Modal
        open={modal.open}
        title={modal.kind === 'export' ? 'Manage Export Presets' : modal.kind === 'watermark' ? 'Manage Watermark Presets' : ''}
        onClose={closePresetEditor}
        width={820}
      >
        {modal.kind === 'export' && <ExportPresetEditor />}
        {modal.kind === 'watermark' && <WatermarkEditor />}
      </Modal>

      <style>{styles}</style>
    </aside>
  );
}

function renderFields(items, params, setParam, api) {
  if (!items.length) return <div className="hint">No editable parameters for this node.</div>;

  return (
    <div className="fields">
      {items.map((it) => {
        const key = it.key;
        const val = params[key];

        switch (it.type) {
          case 'text':
            return row(it.label, <input type="text" value={val || ''} onChange={(e) => setParam(key, e.target.value)} />);
          case 'number': {
            const attrs = {};
            if (Number.isFinite(it.min)) attrs.min = it.min;
            if (Number.isFinite(it.max)) attrs.max = it.max;
            if (Number.isFinite(it.step)) attrs.step = it.step;
            return row(it.label,
              <input type="number" {...attrs} value={Number.isFinite(val) ? val : (it.min ?? 0)} onChange={(e) => setParam(key, numOr(e.target.value, it.min ?? 0))} />
            );
          }
          case 'boolean':
            return row(it.label,
              <label className="switch">
                <input type="checkbox" checked={!!val} onChange={(e) => setParam(key, e.target.checked)} />
                <span />
              </label>
            );
          case 'select':
            return row(it.label,
              <select value={val ?? it.options?.[0]} onChange={(e) => setParam(key, e.target.value)}>
                {(it.options || []).map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            );
          case 'json':
            return row(it.label,
              <textarea rows={5} value={toJSON(val)} onChange={(e) => {
                try { setParam(key, JSON.parse(e.target.value || '{}')); } catch {}
              }} />
            );
          case 'preset': {
            const manageBtn = (it.presetType === 'export' || it.presetType === 'watermark')
              ? <button className="btn-small ghost" onClick={() => api.openPresetEditor(it.presetType)}>Manage</button>
              : null;
            return row(it.label,
              <div className="row-inline">
                <PresetDropdown presetType={it.presetType} value={val || ''} onChange={(id) => setParam(key, id)} />
                {manageBtn}
              </div>
            );
          }
          case 'region':
            return row(it.label,
              <RegionPicker
                imageUrl=""
                value={val || { x: 0.4, y: 0.4, w: 0.2, h: 0.2 }}
                onChange={(rect) => setParam(key, rect)}
                width={320}
                height={180}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

function row(label, control) {
  return (
    <div className="row" key={label}>
      <label>{label}</label>
      <div className="control">{control}</div>
    </div>
  );
}

function toJSON(val) {
  try { return JSON.stringify(val ?? {}, null, 2); } catch { return '{}'; }
}
function numOr(x, fb) { const n = Number(x); return Number.isFinite(n) ? n : fb; }

// Minimal inline node definitions fallback (for title); real app imports from nodeDefinitions
const nodeDefinitions = {
  IngestList: { name: 'Ingest Files', inspector: [] },
  ReadEXIF: { name: 'Read EXIF', inspector: [] },
  ApplyPreset: { name: 'Apply Preset', inspector: [{ key: 'presetId', type: 'preset', label: 'Preset', presetType: 'export' }] },
  AutoWB: { name: 'Auto White Balance', inspector: [{ key: 'mode', type: 'select', label: 'Mode', options: ['set', 'region'] }, { key: 'rect', type: 'region', label: 'Region' }] },
  Watermark: { name: 'Watermark', inspector: [{ key: 'presetId', type: 'preset', label: 'Preset', presetType: 'watermark' }] },
  SplitRGB: { name: 'Split Channels (RGB)', inspector: [{ key: 'useAdjusted', type: 'boolean', label: 'Use Adjusted' }] },
  Export: { name: 'Export', inspector: [{ key: 'presetId', type: 'preset', label: 'Preset', presetType: 'export' }] },
};

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
.inspector-panel {
  width: 340px;
  border-left: 1px solid rgba(255,255,255,0.08);
  background: rgba(17,20,26,0.6);
  backdrop-filter: blur(6px);
  padding: 12px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.inspector-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 4px 10px 4px; border-bottom: 1px solid rgba(255,255,255,0.06);
}
.chip {
  font-weight: 700; padding: 6px 10px; border-radius: 999px;
  background: rgba(102,126,234,0.15); border: 1px solid rgba(102,126,234,0.35);
}
.actions .btn-small { margin-left: 8px; }
.btn-small {
  font-size: 12px; padding: 6px 8px; border-radius: 8px;
  background: rgba(255,255,255,0.06); color: #e6e9ef; border: 1px solid rgba(255,255,255,0.12);
}
.btn-small:hover { background: rgba(102,126,234,0.18); border-color: rgba(102,126,234,0.35); }
.btn-small.ghost { background: rgba(255,255,255,0.02); }
.btn-small.on { border-color: rgba(110,231,183,0.35); background: rgba(110,231,183,0.15); }
.btn-small.off { border-color: rgba(239,154,154,0.35); background: rgba(239,154,154,0.15); }

.inspector-body { padding: 10px 4px; overflow: auto; }
.row { display: grid; grid-template-columns: 140px 1fr; gap: 10px; align-items: center; margin-bottom: 10px; }
.row label { font-size: 12px; color: #9aa4b2; }
.row .control input[type="text"], 
.row .control input[type="number"], 
.row .control select, 
.row .control textarea {
  width: 100%; padding: 6px 8px; border-radius: 6px;
  background: rgba(255,255,255,0.06); color: #e6e9ef;
  border: 1px solid rgba(255,255,255,0.1);
}
.row-inline { display: flex; align-items: center; gap: 8px; }

.switch { position: relative; display: inline-block; width: 42px; height: 24px; }
.switch input { opacity: 0; width: 0; height: 0; }
.switch span {
  position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(255,255,255,0.15); border-radius: 20px; transition: .2s;
}
.switch span:before {
  position: absolute; content: ""; height: 18px; width: 18px; left: 3px; top: 3px;
  background: #e6e9ef; border-radius: 50%; transition: .2s;
}
.switch input:checked + span { background: rgba(102,126,234,0.55); }
.switch input:checked + span:before { transform: translateX(18px); }

.inspector-empty { padding: 12px; color: #9aa4b2; }
`;
