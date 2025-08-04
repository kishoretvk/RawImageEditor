import React, { useMemo, useState, useEffect } from 'react';
import NodePalette from './NodePalette';
import WorkflowCanvas from './WorkflowCanvas';
import InspectorPanel from './InspectorPanel';
import LogsDrawer from './LogsDrawer';
import { defaultParamsFor, NodeTypes } from './nodeDefinitions';
import { WorkflowRunner, buildDefaultRegistry } from '../../utils/workflow/runner';
import { JobStore } from '../../utils/db/indexedDb';

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Build initial linear workflow
function initialNodes() {
  return [
    { id: uid(), type: 'IngestList', enabled: true, params: defaultParamsFor('IngestList') },
    { id: uid(), type: 'ReadEXIF', enabled: true, params: defaultParamsFor('ReadEXIF') },
    { id: uid(), type: 'ApplyPreset', enabled: true, params: defaultParamsFor('ApplyPreset') },
    { id: uid(), type: 'AutoWB', enabled: true, params: defaultParamsFor('AutoWB') },
    { id: uid(), type: 'Watermark', enabled: true, params: defaultParamsFor('Watermark') },
    { id: uid(), type: 'Export', enabled: true, params: defaultParamsFor('Export') },
  ];
}

export default function VisualWorkflow() {
  const [nodes, setNodes] = useState(initialNodes);
  const [selected, setSelected] = useState(0);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState([]); // [{nodeId, status, progress, message, itemIndex}]
  const [files, setFiles] = useState([]);
  // Job persistence
  const [jobId, setJobId] = useState(null);
  const [history, setHistory] = useState([]);
  // Right inspector + logs drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const hist = await JobStore.listJobs(20);
        setHistory(hist);
      } catch {}
    })();
  }, []);

  const addNode = (type) => {
    const n = { id: uid(), type, enabled: true, params: defaultParamsFor(type) };
    setNodes((prev) => [...prev, n]);
    setSelected(nodes.length); // select new node
  };

  const addAfter = (index, type) => {
    const base = nodes[index];
    const t = type || base.type;
    const n = { id: uid(), type: t, enabled: true, params: defaultParamsFor(t) };
    setNodes((prev) => {
      const next = [...prev];
      next.splice(index + 1, 0, n);
      return next;
    });
    setSelected(index + 1);
  };

  const removeNode = (index) => {
    setNodes((prev) => prev.filter((_, i) => i !== index));
    setSelected((s) => Math.max(0, Math.min(s, nodes.length - 2)));
  };

  const moveUp = (index) => {
    if (index <= 0) return;
    setNodes((prev) => {
      const next = [...prev];
      const tmp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = tmp;
      return next;
    });
    setSelected(index - 1);
  };

  const moveDown = (index) => {
    if (index >= nodes.length - 1) return;
    setNodes((prev) => {
      const next = [...prev];
      const tmp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = tmp;
      return next;
    });
    setSelected(index + 1);
  };

  const changeNode = (index, nextNode) => {
    setNodes((prev) => prev.map((n, i) => (i === index ? nextNode : n)));
  };

  const onPickFiles = (e) => {
    const list = Array.from(e.target.files || []);
    setFiles(list);
  };

  // Resolve presets for Watermark/Export before run
  const resolveParams = async (params, type) => {
    if (!params) return {};
    const out = { ...params };
    // Resolve presetId to concrete settings
    if ((type === 'Watermark' || type === 'Export') && params.presetId) {
      try {
        const { PresetStore } = await import('../../utils/presets/presetStore');
        const preset = PresetStore.get(type === 'Watermark' ? 'watermark' : 'export', params.presetId);
        if (preset?.settings) {
          if (type === 'Watermark') {
            Object.assign(out, preset.settings);
          } else {
            // Export preset supports target vs quality
            const s = preset.settings;
            out.format = s.format || out.format || 'jpeg';
            out.filenamePattern = s.filenamePattern || out.filenamePattern || '{name}_edit';
            if (s.mode === 'quality') {
              delete out.targetSizeMB;
              delete out.tolerancePct;
              out.quality = typeof s.quality === 'number' ? s.quality : (out.quality ?? 0.9);
            } else {
              delete out.quality;
              out.targetSizeMB = Number.isFinite(s.targetSizeMB) ? s.targetSizeMB : (out.targetSizeMB ?? 2);
              out.tolerancePct = Number.isFinite(s.tolerancePct) ? s.tolerancePct : (out.tolerancePct ?? 5);
            }
          }
        }
      } catch {}
    }
    return out;
  };

  const buildSpec = async () => {
    // Linear sequence -> connect previous node id as input
    const active = nodes.filter((n) => n.enabled !== false);
    const built = [];
    for (let i = 0; i < active.length; i++) {
      const n = active[i];
      const id = `n${i}_${n.type}`;
      const inputs = i === 0 ? undefined : [built[i - 1].id];
      const params = await resolveParams(n.params, n.type);
      built.push({
        id,
        type: n.type,
        inputs,
        params,
      });
    }
    return built;
  };

  const run = async () => {
    if (running) return;
    // Validate ingest
    const hasIngest = nodes.some((n) => n.enabled !== false && n.type === 'IngestList');
    if (!hasIngest) {
      alert('Add an Ingest Files node to start the pipeline.');
      return;
    }
    setProgress([]);
    setRunning(true);
    let createdJobId = null;
    try {
      const registry = buildDefaultRegistry();
      const runner = new WorkflowRunner({
        registry,
        onProgress: async (evt) => {
          setProgress((prev) => [...prev, { ...evt }]);
          try {
            if (createdJobId) {
              await JobStore.pushProgress(createdJobId, {
                itemIndex: evt.itemIndex ?? 0,
                nodeId: evt.nodeId || 'node',
                status: evt.status || 'info',
                progress: evt.progress ?? 0,
                message: evt.message || ''
              });
            }
          } catch {}
        },
      });
      const specNodes = await buildSpec();
      const spec = { version: 1, name: 'Visual Workflow', settings: { retry: 1, timeoutSec: 180 }, nodes: specNodes };

      // Create job record
      try {
        const itemsMeta = (files || []).map(f => ({ name: f?.name || '', size: f?.size || 0, type: f?.type || '' }));
        createdJobId = await JobStore.createJob({ name: 'Visual Workflow', spec, itemsMeta });
        setJobId(createdJobId);
      } catch {}

      // items: from UI files if first node is ingest
      await runner.run(spec, files || []);

      try {
        if (createdJobId) await JobStore.completeJob(createdJobId, { count: (files || []).length });
      } catch {}
    } catch (e) {
      setProgress((prev) => [...prev, { nodeId: 'workflow', status: 'error', progress: 0, message: e?.message || String(e) }]);
      try {
        if (createdJobId) await JobStore.failJob(createdJobId, e?.message || String(e));
      } catch {}
    } finally {
      setRunning(false);
      try {
        const hist = await JobStore.listJobs(20);
        setHistory(hist);
      } catch {}
    }
  };

  const renderProgress = () => {
    if (!progress.length) return null;
    return (
      <div className="vw-progress">
        <h4>Progress</h4>
        <div className="log">
          {progress.map((p, idx) => (
            <div key={idx} className={`line ${p.status}`}>
              <span className="node">{p.nodeId}</span>
              <span className="msg">{p.message}</span>
              <span className="pct">{Math.round((p.progress || 0) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="visual-workflow">
      <aside className="vw-left">
        <NodePalette onAdd={addNode} />
        <div className="vw-history">
          <h4>Recent Jobs</h4>
          <ul className="vw-job-list">
            {history.map(j => (
              <li key={j.id} className={`vw-job ${j.status}`}>
                <div className="name">{j.name}</div>
                <div className="sub">{new Date(j.createdAt).toLocaleString()}</div>
                <div className="status">{j.status}</div>
                <button className="btn-small" onClick={() => { setJobId(j.id); setDrawerOpen(true); }}>Logs</button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="vw-main">
        <div className="vw-toolbar">
          <div className="tool">
            <label>Files</label>
            <input type="file" multiple onChange={onPickFiles} />
            {files?.length ? <span className="hint">{files.length} selected</span> : null}
          </div>
          <div className="spacer" />
          <button className="btn" disabled={running} onClick={run}>{running ? 'Running…' : 'Run'}</button>
        </div>

        <div className="vw-center">
          <WorkflowCanvas
            nodes={nodes}
            selectedIndex={selected}
            onSelect={setSelected}
            onChange={changeNode}
            onAddAfter={addAfter}
            onRemove={removeNode}
            onMoveUp={moveUp}
            onMoveDown={moveDown}
          />
        </div>

        {renderProgress()}
      </main>

      <InspectorPanel
        node={nodes[selected]}
        onChange={(nextNode) => changeNode(selected, nextNode)}
        onOpenLogs={() => jobId ? setDrawerOpen(true) : null}
        onRefreshPresets={() => {}}
      />

      <LogsDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        jobId={jobId}
        title="Visual Workflow Logs"
      />

      <style>{styles}</style>
    </div>
  );
}

const styles = `
.visual-workflow {
  display: grid;
  grid-template-columns: 280px 1fr 360px;
  gap: 0;
  height: 100%;
}
.vw-left {
  background: rgba(0,0,0,0.25);
  border-right: 1px solid rgba(255,255,255,0.08);
  display: flex; flex-direction: column;
}
.vw-center { min-height: 0; }
.vw-history { padding: 10px; border-top: 1px solid rgba(255,255,255,0.08); }
.vw-history h4 { margin: 8px 0; }
.vw-job-list { list-style: none; padding: 0; margin: 0; display: grid; gap: 6px; }
.vw-job { display: grid; grid-template-columns: 1fr auto; gap: 6px; padding: 6px; border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; }
.vw-job .name { font-weight: 600; }
.vw-job .sub { font-size: 11px; color: #97a3b6; }
.vw-job .status { font-size: 12px; }
.btn-small { font-size: 12px; padding: 4px 6px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.18); background: rgba(255,255,255,0.06); color: #e6e9ef; cursor: pointer; }
.btn-small:hover { background: rgba(102,126,234,0.18); border-color: rgba(102,126,234,0.35); }
.vw-main {
  display: flex; flex-direction: column; min-height: 0;
}
.vw-toolbar {
  display: flex; align-items: center; gap: 12px;
  padding: 10px; border-bottom: 1px solid rgba(255,255,255,0.08);
}
.tool label { font-size: 12px; color: #9aa4b2; margin-right: 8px; }
.hint { font-size: 12px; color: #9aa4b2; margin-left: 8px; }
.spacer { flex: 1; }
.btn {
  background: rgba(102,126,234,0.15); border: 1px solid rgba(102,126,234,0.35);
  color: #e6e9ef; padding: 8px 12px; border-radius: 8px; cursor: pointer;
}
.btn:disabled { opacity: 0.6; cursor: default; }

.vw-progress { padding: 8px 12px; }
.vw-progress h4 { margin: 8px 0; }
.vw-progress .log .line {
  display: grid; grid-template-columns: 180px 1fr 60px; gap: 8px;
  font-size: 12px; padding: 4px 0; border-bottom: 1px dashed rgba(255,255,255,0.06);
}
.vw-progress .line .node { color: #97a3b6; }
.vw-progress .line.success .node { color: #6ee7b7; }
.vw-progress .line.error .node { color: #ef9a9a; }
`;
