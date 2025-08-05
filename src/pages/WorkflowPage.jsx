import React, { useMemo, useState, useCallback } from 'react';
import WorkflowCanvasRF from '../components/workflow/WorkflowCanvasRF.jsx';
import './WorkflowPage.css';

export default function WorkflowPage() {
  // Seed a basic pipeline: Ingest -> LensCorrection -> ApplyPreset -> Export
  const [graph, setGraph] = useState(() => {
    const nodes = [
      { id: 'ingest', type: 'ingestNode', position: { x: 80, y: 200 }, data: { label: 'Ingest', subtitle: 'Load image(s)' } },
      { id: 'lens', type: 'lensCorrectionNode', position: { x: 320, y: 200 }, data: { label: 'Lens Correction', subtitle: 'Distortion, CA, Vignette' } },
      { id: 'preset', type: 'applyPresetNode', position: { x: 580, y: 200 }, data: { label: 'Apply Preset', subtitle: 'Tone, Color, Curves' } },
      { id: 'export', type: 'exportNode', position: { x: 840, y: 200 }, data: { label: 'Export', subtitle: 'Size target, Format' } }
    ];
    const edges = [
      { id: 'e1', source: 'ingest', target: 'lens' },
      { id: 'e2', source: 'lens', target: 'preset' },
      { id: 'e3', source: 'preset', target: 'export' }
    ];
    return { nodes, edges };
  });

  const onGraphChange = useCallback((next) => {
    setGraph(next);
  }, []);

  return (
    <div className="workflow-page">
      <div className="workflow-header">
        <h1>Visual Workflow</h1>
        <div className="workflow-actions">
          <button className="btn">Run</button>
          <button className="btn secondary">Save</button>
          <button className="btn secondary">Load</button>
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
          {/* Future: render per-node inspector from nodeDefinitions */}
        </div>
      </div>
    </div>
  );
}
