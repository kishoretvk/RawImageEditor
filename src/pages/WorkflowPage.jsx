import React, { useMemo, useState, useCallback } from 'react';
import WorkflowCanvasRF from '../components/workflow/WorkflowCanvasRF.jsx';
import '../styles/WorkflowPage.css';
import Button from '../components/ui/Button.jsx';
import '../styles/tokens.css';
import { runWorkflow } from '../utils/workflow/runner';
import { JobStore } from '../utils/db/indexedDb';

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
      // Persist graph as a "job" record for simplicity
      const id = await JobStore.createJob({
        name: 'workflow-graph-current',
        spec: { type: 'graph', graph },
        itemsMeta: []
      });
      appendLog(`Graph saved as job ${id}.`);
    } catch (e) {
      appendLog(`Save failed: ${e?.message || e}`);
    }
  }, [graph, appendLog]);

  const handleLoad = useCallback(async () => {
    try {
      // Attempt to load the last incomplete "graph" job as our saved graph
      const last = await JobStore.getLastIncompleteJob();
      const specGraph = last?.spec?.graph;
      if (specGraph && specGraph.nodes && specGraph.edges) {
        setGraph(specGraph);
        appendLog(`Graph loaded from job ${last.id}.`);
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
        <div className="workflow-actions" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Button onClick={handleRun} disabled={isRunning} variant="primary" size="md">
            {isRunning ? 'Running…' : 'Run'}
          </Button>
          <Button onClick={handleSave} disabled={isRunning} variant="secondary" size="md">
            Save
          </Button>
          <Button onClick={handleLoad} disabled={isRunning} variant="secondary" size="md">
            Load
          </Button>
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
          {/* Replace ad-hoc inspector box with reusable Panel */}
          {/* Actions area can host quick controls (e.g., Clear Log) */}
          {/* Panel provides consistent header, body, padding, and scroll */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="u-surface" style={{ padding: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Inspector</h3>
              <p style={{ marginTop: '8px', color: 'var(--color-text-dim)' }}>
                Select a node to edit its settings.
              </p>
            </div>

            <div className="u-surface" style={{ padding: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '16px' }}>Run Log</h4>
              <div className="log-lines" style={{ marginTop: '8px', display: 'grid', gap: '6px', maxHeight: 240, overflow: 'auto' }}>
                {runLog.map((l, i) => (<div key={i} style={{ color: 'var(--color-text-dim)' }}>{l}</div>))}
              </div>
            </div>
          </div>
          {/* TODO: bind real selected-node inspector */}
        </div>
      </div>
    </div>
  );
}
