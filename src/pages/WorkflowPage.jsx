import React, { useMemo, useState, useCallback } from 'react';
import WorkflowCanvasRF from '../components/workflow/WorkflowCanvasRF.jsx';
import './WorkflowPage.css';
import { runWorkflow } from '../utils/workflow/runner';
import { saveGraph, loadGraph } from '../utils/db/indexedDb';

/**
 * Map React Flow nodes/edges to runner graph format.
 * Runner expects:
 * {
 *   nodes: [{ id, type, params }],
 *   edges: [{ from, to }]
 * }
 * Node params come from node.data.params (fallback to {}).
 */
function mapRFToRunner(graph) {
  const nodes = (graph.nodes || []).map(n => ({
    id: n.id,
    type: n.type?.replace('Node', '') || 'default',
    params: n.data?.params || {}
  }));
  const edges = (graph.edges || []).map(e => ({
    from: e.source,
    to: e.target
  }));
  return { nodes, edges };
}

export default function WorkflowPage() {
  // Seed a basic pipeline: Ingest -> LensCorrection -> ApplyPreset -> Export
  const [graph, setGraph] = useState(() => {
    const nodes = [
      { id: 'ingest', type: 'ingestNode', position: { x: 80, y: 200 }, data: { label: 'Ingest', subtitle: 'Load image(s)', params: {} } },
      { id: 'lens', type: 'lensCorrectionNode', position: { x: 320, y: 200 }, data: { label: 'Lens Correction', subtitle: 'Distortion, CA, Vignette', params: { profile: 'auto', distortion: 0, caRed: 0, caBlue: 0, vignette: 0 } } },
      { id: 'preset', type: 'applyPresetNode', position: { x: 580, y: 200 }, data: { label: 'Apply Preset', subtitle: 'Tone, Color, Curves', params: {} } },
      { id: 'export', type: 'exportNode', position: { x: 840, y: 200 }, data: { label: 'Export', subtitle: 'Size target, Format', params: { sizeMB: 4, format: 'image/jpeg', quality: 0.9 } } }
    ];
    const edges = [
      { id: 'e1', source: 'ingest', target: 'lens' },
      { id: 'e2', source: 'lens', target: 'preset' },
      { id: 'e3', source: 'preset', target: 'export' }
    ];
    return { nodes, edges };
  });

  const [isRunning, setIsRunning] = useState(false);
  const [runLog, setRunLog] = useState([]);

  const onGraphChange = useCallback((next) => {
    setGraph(next);
  }, []);

  // Progress update helper: set node.data.progress 0..1 and trigger re-render
  const updateNodeProgress = useCallback((nodeId, progress) => {
    setGraph((g) => {
      const nodes = g.nodes.map(n => {
        if (n.id === nodeId) {
          const data = { ...(n.data || {}), progress };
          return { ...n, data };
        }
        return n;
      });
      return { ...g, nodes };
    });
  }, []);

  const appendLog = useCallback((msg) => {
    setRunLog((l) => [...l, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  }, []);

  const handleRun = useCallback(async () => {
    if (isRunning) return;
    setRunLog([]);
    setIsRunning(true);
    try {
      // Map graph for runner
      const runnerGraph = mapRFToRunner(graph);

      // Hook progress callbacks into runner
      const ctx = {
        onNodeStart: (id, type) => {
          updateNodeProgress(id, 0);
          appendLog(`Start ${type} (${id})`);
        },
        onNodeProgress: (id, p) => {
          updateNodeProgress(id, Math.max(0, Math.min(1, p)));
        },
        onNodeComplete: (id, type) => {
          updateNodeProgress(id, 1);
          appendLog(`Complete ${type} (${id})`);
        },
        onError: (id, err) => {
          appendLog(`Error at ${id}: ${err?.message || err}`);
        }
      };

      await runWorkflow(runnerGraph, ctx);
      appendLog('Workflow run finished.');
    } catch (e) {
      appendLog(`Run failed: ${e?.message || e}`);
    } finally {
      setIsRunning(false);
    }
  }, [graph, isRunning, updateNodeProgress, appendLog]);

  const handleSave = useCallback(async () => {
    try {
      await saveGraph('current', graph);
      appendLog('Graph saved.');
    } catch (e) {
      appendLog(`Save failed: ${e?.message || e}`);
    }
  }, [graph, appendLog]);

  const handleLoad = useCallback(async () => {
    try {
      const loaded = await loadGraph('current');
      if (loaded && loaded.nodes && loaded.edges) {
        setGraph(loaded);
        appendLog('Graph loaded.');
      } else {
        appendLog('No saved graph found.');
      }
    } catch (e) {
      appendLog(`Load failed: ${e?.message || e}`);
    }
  }, [appendLog]);

  return (
    <div className="workflow-page">
      <div className="workflow-header">
        <h1>Visual Workflow</h1>
        <div className="workflow-actions">
          <button className="btn" onClick={handleRun} disabled={isRunning}>{isRunning ? 'Running…' : 'Run'}</button>
          <button className="btn secondary" onClick={handleSave} disabled={isRunning}>Save</button>
          <button className="btn secondary" onClick={handleLoad} disabled={isRunning}>Load</button>
        </div>
      </div>
      <div className="workflow-body">
        <div className="workflow-canvas">
          <WorkflowCanvasRF
            initialNodes={graph.nodes}
            initialEdges={graph.edges}
            onGraphChange={onGraphChange}
          />
        </div>
        <div className="workflow-inspector">
          <h3>Inspector</h3>
          <p>Select a node to edit its settings.</p>
          <div className="workflow-log">
            <h4>Run Log</h4>
            <div className="log-lines">
              {runLog.map((l, i) => (<div key={i}>{l}</div>))}
            </div>
          </div>
          {/* TODO: bind real selected-node inspector */}
        </div>
      </div>
    </div>
  );
}
