import React, { useMemo, useState, useCallback } from 'react';
import WorkflowCanvasRF from '../components/workflow/WorkflowCanvasRF.jsx';
import NodePalette from '../components/workflow/NodePalette.jsx';
import InspectorPanel from '../components/workflow/InspectorPanel.jsx';
import '../styles/WorkflowPage.css';
import Button from '../components/ui/Button.jsx';
import '../styles/tokens.css';
import * as Runner from '../utils/workflow/runner.js';
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
  const [selectedNodeId, setSelectedNodeId] = useState(null);

  const onGraphChange = useCallback((next) => {
    setGraph(next);
  }, []);

  // Add a new node with sensible defaults; supports both {type, params} and string type
  const addNode = useCallback((spec) => {
    const typeRaw = typeof spec === 'string' ? spec : spec?.type;
    if (!typeRaw) return;
    const params = (typeof spec === 'object' && spec?.params) ? spec.params : {};
    const rfType = typeRaw.endsWith('Node') ? typeRaw : `${typeRaw}Node`;

    // simple id and positioning heuristic
    const idx = (graph.nodes?.length || 0) + 1;
    const id = `${typeRaw}-${idx}`;
    const last = graph.nodes?.[graph.nodes.length - 1] || null;
    const position = last ? { x: (last.position?.x || 80) + 240, y: last.position?.y || 200 } : { x: 80, y: 200 };

    const labels = {
      ingestNode: ['Ingest', 'Load image(s)'],
      lensCorrectionNode: ['Lens Correction', 'Distortion, CA, Vignette'],
      applyPresetNode: ['Apply Preset', 'Tone, Color, Curves'],
      splitRGBNode: ['Split RGB', 'Per-channel outputs'],
      exportNode: ['Export', 'Size target, Format']
    };
    const [label, subtitle] = labels[rfType] || ['Node', ''];

    const newNode = {
      id,
      type: rfType,
      position,
      data: { label, subtitle, params }
    };

    setGraph((g) => ({ ...g, nodes: [...(g.nodes || []), newNode] }));
  }, [graph]);

  // Optional: create a starter graph quickly
  const seedStarterGraph = useCallback(() => {
    setGraph(() => {
      const nodes = [
        { id: 'ingest', type: 'ingestNode', position: { x: 80, y: 200 }, data: { label: 'Ingest', subtitle: 'Load image(s)', params: { source: 'upload' } } },
        { id: 'lens', type: 'lensCorrectionNode', position: { x: 320, y: 200 }, data: { label: 'Lens Correction', subtitle: 'Distortion, CA, Vignette', params: { profile: 'auto', distortion: 0, caRed: 0, caBlue: 0, vignette: 0 } } },
        { id: 'preset', type: 'applyPresetNode', position: { x: 580, y: 200 }, data: { label: 'Apply Preset', subtitle: 'Tone, Color, Curves', params: {} } },
        { id: 'export', type: 'exportNode', position: { x: 840, y: 200 }, data: { label: 'Export', subtitle: 'Size target, Format', params: { sizeMB: 4, format: 'image/jpeg', quality: 0.9, filename: 'export' } } }
      ];
      const edges = [
        { id: 'e1', source: 'ingest', target: 'lens' },
        { id: 'e2', source: 'lens', target: 'preset' },
        { id: 'e3', source: 'preset', target: 'export' }
      ];
      return { nodes, edges };
    });
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

  const clearLog = useCallback(() => setRunLog([]), []);

  // simple schema validation per node type
  const validateGraph = useCallback((runnerGraph) => {
    const errors = [];
    for (const n of runnerGraph.nodes) {
      const p = n.params || {};
      switch (n.type) {
        case 'ingest':
          if (!['upload', 'gallery', undefined].includes(p.source)) errors.push(`${n.id}: invalid source`);
          break;
        case 'lensCorrection':
          if (!['auto', 'generic', undefined].includes(p.profile)) errors.push(`${n.id}: invalid profile`);
          ['distortion', 'caRed', 'caBlue', 'vignette'].forEach(k => {
            if (p[k] != null && typeof p[k] !== 'number') errors.push(`${n.id}: ${k} must be number`);
          });
          break;
        case 'applyPreset':
          // optional presetId ok
          break;
        case 'splitRGB':
          if (!['original', 'processed', undefined].includes(p.source)) errors.push(`${n.id}: invalid source`);
          break;
        case 'export':
          if (p.format && !['image/jpeg', 'image/png'].includes(p.format)) errors.push(`${n.id}: invalid format`);
          if (p.quality != null && (typeof p.quality !== 'number' || p.quality < 0 || p.quality > 1)) errors.push(`${n.id}: quality 0..1`);
          if (p.sizeMB != null && (typeof p.sizeMB !== 'number' || p.sizeMB < 0)) errors.push(`${n.id}: sizeMB >= 0`);
          break;
        default:
          break;
      }
    }
    return errors;
  }, []);

  const handleRun = useCallback(async () => {
    if (isRunning) return;
    setRunLog([]);
    setIsRunning(true);
    try {
      // Map graph for runner
      const runnerGraph = mapRFToRunner(graph);

      // Validate before run
      const errs = validateGraph(runnerGraph);
      if (errs.length) {
        errs.forEach(e => appendLog(`Validation error: ${e}`));
        throw new Error('Validation failed. See log for details.');
      }

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

      if (Runner.runWorkflow) {
        await Runner.runWorkflow(runnerGraph, ctx);
      } else {
        throw new Error('runWorkflow export not found in utils/workflow/runner.js');
      }
      appendLog('Workflow run finished.');
    } catch (e) {
      appendLog(`Run failed: ${e?.message || e}`);
    } finally {
      setIsRunning(false);
    }
  }, [graph, isRunning, updateNodeProgress, appendLog, validateGraph]);

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
          <Button onClick={clearLog} disabled={isRunning} variant="ghost" size="md">
            Clear Log
          </Button>
        </div>
      </div>
      <div className="workflow-body" style={{ display: 'grid', gridTemplateColumns: '260px 1fr 360px', gap: '12px', padding: '12px', minHeight: 0 }}>
        {/* LEFT: Node palette */}
        <div className="workflow-palette u-surface" style={{ padding: '12px', overflow: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>Nodes</h3>
            {(!graph.nodes || graph.nodes.length === 0) && (
              <Button size="sm" variant="secondary" onClick={seedStarterGraph}>Starter Graph</Button>
            )}
          </div>
          <NodePalette onAdd={addNode} />
        </div>

        {/* CENTER: Canvas */}
        <div className="workflow-canvas">
          <WorkflowCanvasRF
            initialNodes={graph.nodes}
            initialEdges={graph.edges}
            onGraphChange={onGraphChange}
            onSelectionChange={(ids) => setSelectedNodeId(Array.isArray(ids) ? ids[0] : ids || null)}
          />
        </div>

        {/* RIGHT: Inspector + Log */}
        <div className="workflow-inspector">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', minHeight: 0 }}>
            <div className="u-surface" style={{ padding: '12px', minHeight: 0 }}>
              <InspectorPanel
                node={(graph.nodes || []).find(n => n.id === selectedNodeId) ? {
                  id: selectedNodeId,
                  type: (graph.nodes || []).find(n => n.id === selectedNodeId)?.type?.replace('Node', '') || (graph.nodes || []).find(n => n.id === selectedNodeId)?.type,
                  params: (graph.nodes || []).find(n => n.id === selectedNodeId)?.data?.params || {},
                  enabled: (graph.nodes || []).find(n => n.id === selectedNodeId)?.data?.enabled !== false
                } : null}
                onChange={(nextNode) => {
                  // write-through to graph state
                  setGraph((g) => {
                    const nodes = g.nodes.map(n => {
                      if (n.id !== nextNode.id) return n;
                      const data = {
                        ...(n.data || {}),
                        params: nextNode.params || {},
                        enabled: nextNode.enabled !== false
                      };
                      return { ...n, data };
                    });
                    return { ...g, nodes };
                  });
                }}
                onOpenLogs={() => {
                  // no-op placeholder; logs are below
                }}
                onRefreshPresets={() => {}}
              />
            </div>

            <div className="u-surface" style={{ padding: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '16px' }}>Run Log</h4>
              <div className="log-lines" style={{ marginTop: '8px', display: 'grid', gap: '6px', maxHeight: 240, overflow: 'auto' }}>
                {runLog.map((l, i) => (<div key={i} style={{ color: 'var(--color-text-dim)' }}>{l}</div>))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
