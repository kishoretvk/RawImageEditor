import React, { useState, useEffect } from 'react';
import WorkflowManager from '../components/WorkflowManager';
import WorkflowBuilder from '../components/WorkflowBuilder';
import BatchWorkflowProcessor from '../components/BatchWorkflowProcessor';
import PresetManager from '../components/PresetManager';
import '../styles/WorkflowPage.css';

import { WorkflowRunner, buildDefaultRegistry } from '../utils/workflow/runner';

const WorkflowPage = () => {
  const [workflows, setWorkflows] = useState([]);
  const [presets, setPresets] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState(null);

  // Quick Batch state
  const [quickFiles, setQuickFiles] = useState([]);
  const [quickSplit, setQuickSplit] = useState(false);
  const [targetSizeMB, setTargetSizeMB] = useState(2);
  const [tolerancePct, setTolerancePct] = useState(5);
  const [leaderIndex, setLeaderIndex] = useState(0);
  const [wbUseRegion, setWbUseRegion] = useState(false);
  const [wbRect, setWbRect] = useState({ x: 0.4, y: 0.4, w: 0.2, h: 0.2 }); // normalized defaults
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState([]); // [{nodeId,status,progress,message,data, itemIndex}]

  useEffect(() => {
    setWorkflows(WorkflowManager.getWorkflows());
    setPresets(PresetManager.getPresets());
  }, []);

  const handleSaveWorkflow = (workflow) => {
    WorkflowManager.saveWorkflow(workflow);
    setWorkflows(WorkflowManager.getWorkflows());
    setIsBuilding(false);
    setEditingWorkflow(null);
  };

  const handleSelectWorkflow = (workflow) => {
    setSelectedWorkflow(workflow);
    setIsBuilding(false);
  };

  const handleEditWorkflow = (workflow) => {
    setEditingWorkflow(workflow);
    setIsBuilding(true);
  };
  
  const handleDeleteWorkflow = (workflowId) => {
    WorkflowManager.deleteWorkflow(workflowId);
    setWorkflows(WorkflowManager.getWorkflows());
    if (selectedWorkflow && selectedWorkflow.id === workflowId) {
      setSelectedWorkflow(null);
    }
  };

  const startNewWorkflow = () => {
    setEditingWorkflow(null);
    setIsBuilding(true);
    setSelectedWorkflow(null);
  };

  const onQuickFilesSelected = (evt) => {
    const files = Array.from(evt.target.files || []);
    setQuickFiles(files);
    // Adjust leader index if out of bounds
    if (leaderIndex >= files.length) setLeaderIndex(0);
  };

  const runQuickBatch = async () => {
    if (!quickFiles || quickFiles.length === 0 || running) return;
    setRunning(true);
    setProgress([]);

    const registry = buildDefaultRegistry();
    const runner = new WorkflowRunner({
      registry,
      onProgress: (evt) => {
        setProgress((prev) => [...prev, { ...evt }]);
      }
    });

    // Build workflow spec
    const nodes = [
      { id: 'ingest', type: 'IngestList', params: { items: quickFiles } },
      { id: 'exif', type: 'ReadEXIF', inputs: ['ingest'] },
      { id: 'preset', type: 'ApplyPreset', inputs: ['exif'], params: { preset: {} } },
      { id: 'wb', type: 'AutoWB', inputs: ['preset'], params: {
        mode: wbUseRegion ? 'region' : 'set',
        leaderIndex,
        rect: wbUseRegion ? wbRect : undefined
      } }
    ];
    const prevId = quickSplit ? 'split' : 'wb';
    if (quickSplit) {
      nodes.push({ id: 'split', type: 'SplitRGB', inputs: ['wb'], params: { useAdjusted: true, exportAll: true } });
    }
    nodes.push(
      { id: 'wm', type: 'Watermark', inputs: [prevId], params: { type: 'text', text: '© RawImageEditor', position: 'br', opacity: 0.3 } },
      { id: 'exp', type: 'Export', inputs: ['wm'], params: {
        format: 'jpeg',
        targetSizeMB: Number(targetSizeMB) || 2,
        tolerancePct: Number(tolerancePct) || 5,
        filenamePattern: '{name}_edit',
        download: true
      } }
    );

    const spec = {
      version: 1,
      name: 'Quick Batch',
      settings: { retry: 1, timeoutSec: 120 },
      nodes
    };

    try {
      await runner.run(spec, quickFiles);
    } catch (e) {
      setProgress((prev) => [...prev, { nodeId: 'workflow', status: 'error', progress: 0, message: e?.message || String(e) }]);
    } finally {
      setRunning(false);
    }
  };

  const renderQuickProgress = () => {
    if (!progress.length) return null;
    return (
      <div className="quick-progress">
        <h3>Batch Progress</h3>
        <div className="progress-log">
          {progress.map((p, idx) => (
            <div key={idx} className={`log-line ${p.status}`}>
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
    <div className="workflow-page">
      <header className="workflow-header">
        <h1>Workflow Automation</h1>
        <p>Create, manage, and run powerful batch processing workflows.</p>
      </header>

      <div className="workflow-container">
        <aside className="workflow-sidebar">
          {/* Quick Batch Runner */}
          <div className="quick-batch card">
            <h2>Quick Batch</h2>
            <p className="muted">Run AutoWB (set-based), optional Split RGB, Watermark, and Export (target size) — browser only.</p>

            <div className="field">
              <label>Files</label>
              <input type="file" multiple onChange={onQuickFilesSelected} />
              {quickFiles?.length ? <div className="hint">{quickFiles.length} files selected</div> : null}
            </div>

            <div className="field-row">
              <label>Target Size (MB)</label>
              <input type="number" min="0.1" step="0.1" value={targetSizeMB} onChange={(e) => setTargetSizeMB(e.target.value)} />
            </div>
            <div className="field-row">
              <label>Tolerance (%)</label>
              <input type="number" min="1" max="20" step="1" value={tolerancePct} onChange={(e) => setTolerancePct(e.target.value)} />
            </div>

            <div className="field-row">
              <label>AutoWB Leader Index</label>
              <input type="number" min="0" max={Math.max(0, (quickFiles?.length || 1) - 1)} step="1" value={leaderIndex} onChange={(e) => setLeaderIndex(Number(e.target.value) || 0)} />
            </div>

            <div className="field-row">
              <label>
                <input type="checkbox" checked={wbUseRegion} onChange={(e) => setWbUseRegion(e.target.checked)} />
                Use Region for WB (normalized)
              </label>
            </div>
            {wbUseRegion && (
              <div className="field-grid">
                <div>
                  <label>x</label>
                  <input type="number" min="0" max="1" step="0.01" value={wbRect.x} onChange={(e) => setWbRect({ ...wbRect, x: clamp01(e.target.value) })} />
                </div>
                <div>
                  <label>y</label>
                  <input type="number" min="0" max="1" step="0.01" value={wbRect.y} onChange={(e) => setWbRect({ ...wbRect, y: clamp01(e.target.value) })} />
                </div>
                <div>
                  <label>w</label>
                  <input type="number" min="0.01" max="1" step="0.01" value={wbRect.w} onChange={(e) => setWbRect({ ...wbRect, w: clamp01(e.target.value) })} />
                </div>
                <div>
                  <label>h</label>
                  <input type="number" min="0.01" max="1" step="0.01" value={wbRect.h} onChange={(e) => setWbRect({ ...wbRect, h: clamp01(e.target.value) })} />
                </div>
              </div>
            )}

            <div className="field-row">
              <label>
                <input type="checkbox" checked={quickSplit} onChange={(e) => setQuickSplit(e.target.checked)} />
                Split Channels (R/G/B mono)
              </label>
            </div>

            <div className="actions">
              <button className="btn-primary" disabled={running || !quickFiles?.length} onClick={runQuickBatch}>
                {running ? 'Running…' : 'Run Batch'}
              </button>
            </div>

            {renderQuickProgress()}
          </div>
          <div className="sidebar-header">
            <h2>Your Workflows</h2>
            <button className="btn-primary" onClick={startNewWorkflow}>
              + New Workflow
            </button>
          </div>
          <ul className="workflow-list">
            {workflows.map(wf => (
              <li 
                key={wf.id} 
                className={`workflow-item ${selectedWorkflow?.id === wf.id ? 'active' : ''}`}
                onClick={() => handleSelectWorkflow(wf)}
              >
                <span className="workflow-name">{wf.name}</span>
                <div className="workflow-actions">
                  <button onClick={(e) => { e.stopPropagation(); handleEditWorkflow(wf); }}>Edit</button>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteWorkflow(wf.id); }}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        </aside>

        <main className="workflow-main">
          {isBuilding ? (
            <WorkflowBuilder 
              presets={presets}
              onSave={handleSaveWorkflow}
              workflow={editingWorkflow}
              onCancel={() => setIsBuilding(false)}
            />
          ) : selectedWorkflow ? (
            <BatchWorkflowProcessor
              workflow={selectedWorkflow}
              presets={presets}
            />
          ) : (
            <div className="empty-state">
              <h2>Select a workflow to run, or create a new one.</h2>
              <p>Workflows allow you to apply a series of edits to multiple images at once.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export default WorkflowPage;
