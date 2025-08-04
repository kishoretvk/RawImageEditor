import React from 'react';
import { NodeTypes } from './nodeDefinitions';
import RegionPicker from '../RegionPicker';
import Modal from './Modal';
import ExportPresetEditor from '../ExportPresetEditor';
import WatermarkEditor from '../WatermarkEditor';

export default function WorkflowCanvas({
  nodes,
  selectedIndex,
  onSelect,
  onChange,
  onAddAfter,
  onRemove,
  onMoveUp,
  onMoveDown
}) {
  const [modal, setModal] = React.useState({ open: false, kind: null });

  // Zoom/Pan state
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const draggingRef = React.useRef(false);
  const lastPosRef = React.useRef({ x: 0, y: 0 });

  const handleWheel = (e) => {
    if (!e.ctrlKey && Math.abs(e.deltaY) < 40) return; // require ctrl or trackpad intensity
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((z) => Math.max(0.3, Math.min(3, z * factor)));
  };

  const onMouseDownCanvas = (e) => {
    // Pan by dragging background
    if (e.button !== 0) return;
    draggingRef.current = true;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    document.addEventListener('mousemove', onMouseMoveCanvas);
    document.addEventListener('mouseup', onMouseUpCanvas);
  };
  const onMouseMoveCanvas = (e) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - lastPosRef.current.x;
    const dy = e.clientY - lastPosRef.current.y;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
    setPan((p) => ({ x: p.x + dx, y: p.y + dy }));
  };
  const onMouseUpCanvas = () => {
    draggingRef.current = false;
    document.removeEventListener('mousemove', onMouseMoveCanvas);
    document.removeEventListener('mouseup', onMouseUpCanvas);
  };

  const fitView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

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

  const openPresetEditor = (kind) => setModal({ open: true, kind });
  const closePresetEditor = () => {
    setModal({ open: false, kind: null });
    if (Number.isFinite(selectedIndex)) onSelect(selectedIndex);
  };

  const Icon = ({ type }) => {
    // lightweight inline icons per node type
    const c = 'currentColor';
    switch (type) {
      case 'IngestList':
        return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path stroke={c} strokeWidth="2" d="M3 7h18M3 12h18M3 17h18"/></svg>;
      case 'ReadEXIF':
        return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke={c} strokeWidth="2"/><path d="M4 4h16v16H4z" stroke={c} strokeWidth="2"/></svg>;
      case 'ApplyPreset':
        return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4L19 6" stroke={c} strokeWidth="2"/></svg>;
      case 'AutoWB':
        return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3v18M3 12h18" stroke={c} strokeWidth="2"/></svg>;
      case 'SplitRGB':
        return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6h12v12H6z" stroke={c} strokeWidth="2"/><path d="M6 12h12" stroke={c} strokeWidth="2"/></svg>;
      case 'Watermark':
        return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 18l8-12 8 12H4z" stroke={c} strokeWidth="2"/></svg>;
      case 'Export':
        return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3v12M7 8l5-5 5 5" stroke={c} strokeWidth="2"/><path d="M5 21h14" stroke={c} strokeWidth="2"/></svg>;
      default:
        return <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke={c} strokeWidth="2"/></svg>;
    }
  };

  const badgesFor = (n) => {
    const list = [];
    if (n.type === 'ApplyPreset' && n.params?.presetId) list.push('Preset');
    if (n.type === 'AutoWB' && (n.params?.mode === 'region')) list.push('Region');
    if (n.type === 'Export') list.push('Output');
    if (n.type === 'SplitRGB') list.push('RGB');
    return list;
  };

  return (
    <div className="wf-canvas">
      <div className="wf-toolbar">
        <div className="group">
          <button className="btn" onClick={() => setZoom((z) => Math.min(3, z * 1.1))}>Zoom +</button>
          <button className="btn" onClick={() => setZoom((z) => Math.max(0.3, z / 1.1))}>Zoom -</button>
          <button className="btn" onClick={() => setZoom(1)}>100%</button>
          <button className="btn" onClick={fitView}>Fit</button>
        </div>
        <div className="hint">Zoom: {Math.round(zoom * 100)}%</div>
      </div>

      <div
        className="wf-scroll"
        onWheel={handleWheel}
        onMouseDown={onMouseDownCanvas}
        style={{ cursor: 'grab' }}
      >
        <div
          className="wf-content"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0'
          }}
        >
          {nodes.map((n, i) => {
            const def = NodeTypes[n.type];
            const isSel = i === selectedIndex;
            const badgeList = badgesFor(n);
            return (
              <div key={n.id} className={`wf-node ${isSel ? 'selected' : ''}`} onClick={() => onSelect(i)}>
                <div className="wf-node-header">
                  <div className="wf-node-title">
                    <span className={`dot ${n.enabled !== false ? 'on' : 'off'}`} />
                    <Icon type={n.type} />
                    <span className="label">{def?.name || n.type}</span>
                    {badgeList.length > 0 && (
                      <div className="badges">
                        {badgeList.map((b) => <span key={b} className="badge">{b}</span>)}
                      </div>
                    )}
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
                      onOpenPresetEditor: openPresetEditor
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
        </div>
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
          case 'preset': {
            const dropdown = (
              <PresetDropdown presetType={it.presetType} value={val || ''} onChange={(id) => api.onPresetSelect(key, id)} />
            );
            const manageBtn = it.presetType === 'export' || it.presetType === 'watermark'
              ? <button className="manage-btn" onClick={() => api.onOpenPresetEditor(it.presetType)}>Manage Presets</button>
              : null;
            return field(it.label, (
              <div className="preset-row">
                {dropdown}
                {manageBtn}
              </div>
            ));
          }
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
.wf-canvas { padding: 10px; display: flex; flex-direction: column; min-height: 0; }
.wf-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 8px; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;
  background: rgba(255,255,255,0.04); margin-bottom: 8px;
}
.wf-toolbar .group { display: flex; gap: 6px; }
.wf-toolbar .btn {
  font-size: 12px; padding: 6px 8px; border-radius: 8px;
  background: rgba(255,255,255,0.06); color: #e6e9ef; border: 1px solid rgba(255,255,255,0.12);
  cursor: pointer;
}
.wf-toolbar .btn:hover { background: rgba(102,126,234,0.18); border-color: rgba(102,126,234,0.35); }
.wf-toolbar .hint { font-size: 12px; color: #9aa4b2; }

.wf-scroll { position: relative; overflow: auto; flex: 1; border: 1px dashed rgba(255,255,255,0.06); border-radius: 8px; }
.wf-content { padding: 10px; min-height: 100%; }

.wf-empty { color: #97a3b6; padding: 16px; border: 1px dashed rgba(255,255,255,0.12); border-radius: 8px; }
.wf-node {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 10px;
  margin-bottom: 10px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.25);
}
.wf-node.selected {
  border-color: rgba(102,126,234,0.5);
  box-shadow: 0 0 0 2px rgba(102,126,234,0.25) inset, 0 10px 24px rgba(102,126,234,0.15);
}
.wf-node-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 10px;
  font-weight: 600;
}
.wf-node-title { display: flex; align-items: center; gap: 8px; }
.wf-node-title .label { margin-left: 2px; }
.badges { display: inline-flex; gap: 6px; margin-left: 8px; }
.badge {
  font-size: 11px; padding: 2px 6px; border-radius: 999px;
  background: rgba(102,126,234,0.18); border: 1px solid rgba(102,126,234,0.35); color: #e6e9ef;
}

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

/* legacy inspector styles kept for inline view if needed */
.inspector .field-row { display: grid; grid-template-columns: 160px 1fr; align-items: center; gap: 10px; margin-bottom: 10px; }
.inspector label { font-size: 12px; color: #9aa4b2; }
.inspector input[type="text"], .inspector input[type="number"], .inspector select, .inspector textarea {
  width: 100%; padding: 6px 8px; border-radius: 6px;
  background: rgba(255,255,255,0.06); color: #e6e9ef;
  border: 1px solid rgba(255,255,255,0.1);
}
.checkbox { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; }
.preset-row { display: flex; align-items: center; gap: 8px; }
.manage-btn {
  background: rgba(102,126,234,0.15); border: 1px solid rgba(102,126,234,0.35);
  color: #e6e9ef; padding: 6px 10px; border-radius: 8px; cursor: pointer;
}
.manage-btn:hover {
  background: rgba(102,126,234,0.25); border-color: rgba(102,126,234,0.5);
}
`;
