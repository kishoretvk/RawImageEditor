import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge
} from 'reactflow';
import 'reactflow/dist/style.css';

import styles from '../../styles/WorkflowPage.css?inline';

// Basic node renderers (thin wrappers). We can specialize later.
const NodeCard = ({ data, selected }) => {
  return (
    <div style={{
      border: selected ? '2px solid #667eea' : '1px solid #333',
      borderRadius: 8,
      background: '#1c1f24',
      color: '#e6e6e6',
      padding: 10,
      minWidth: 160,
      boxShadow: selected ? '0 0 0 3px rgba(102,126,234,0.25)' : 'none'
    }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{data.label || 'Node'}</div>
      {data.subtitle && <div style={{ fontSize: 12, opacity: 0.8 }}>{data.subtitle}</div>}
    </div>
  );
};

// Node types registry – map to simple NodeCard for now
const nodeTypes = {
  defaultNode: NodeCard,
  ingestNode: NodeCard,
  exifNode: NodeCard,
  applyPresetNode: NodeCard,
  autoWBNode: NodeCard,
  splitRGBNode: NodeCard,
  lensCorrectionNode: NodeCard,
  lutNode: NodeCard,
  watermarkNode: NodeCard,
  exportNode: NodeCard
};

export default function WorkflowCanvasRF({
  initialNodes = [],
  initialEdges = [],
  onGraphChange,
  onSelectionChange, // optional: notify parent when selection changes
}) {
  // Hold local state
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const idRef = useRef(1000);

  // Keep local state in sync if parent provides new initialNodes/Edges (e.g., load graph)
  useEffect(() => {
    setNodes(initialNodes || []);
  }, [initialNodes]);
  useEffect(() => {
    setEdges(initialEdges || []);
  }, [initialEdges]);

  // Notify parent AFTER first paint to avoid setState-in-render warning
  useEffect(() => {
    // Defer to next microtask to ensure child render completes
    queueMicrotask?.(() => {
      onGraphChange && onGraphChange({ nodes, edges });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only once on mount

  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => {
      const next = applyNodeChanges(changes, nds);
      // Defer parent notification to avoid setState during child render
      queueMicrotask?.(() => onGraphChange && onGraphChange({ nodes: next, edges }));
      return next;
    });
  }, [edges, onGraphChange]);

  const onEdgesChange = useCallback((changes) => {
    setEdges((eds) => {
      const next = applyEdgeChanges(changes, eds);
      // Defer parent notification to avoid setState during child render
      queueMicrotask?.(() => onGraphChange && onGraphChange({ nodes, edges: next }));
      return next;
    });
  }, [nodes, onGraphChange]);

  const onConnect = useCallback((params) => {
    setEdges((eds) => {
      const next = addEdge({ ...params, animated: true, style: { stroke: '#667eea' } }, eds);
      // Defer parent notification to avoid setState during child render
      queueMicrotask?.(() => onGraphChange && onGraphChange({ nodes, edges: next }));
      return next;
    });
  }, [nodes, onGraphChange]);

  const defaultViewport = useMemo(() => ({ x: 0, y: 0, zoom: 0.9 }), []);

  // Forward selection changes to parent
  const handleSelectionChange = useCallback((sel) => {
    // sel has { nodes: Node[], edges: Edge[] } when using ReactFlow onSelectionChange
    const ids = Array.isArray(sel?.nodes) ? sel.nodes.map(n => n.id) : [];
    if (onSelectionChange) {
      try { onSelectionChange(ids); } catch {}
    }
  }, [onSelectionChange]);

  return (
    <div style={{ width: '100%', height: '100%', background: '#0f1216' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        defaultViewport={defaultViewport}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={handleSelectionChange}
        proOptions={{ hideAttribution: true }}
      >
        <MiniMap
          nodeStrokeColor={(n) => (n.selected ? '#667eea' : '#444')}
          nodeColor="#20242b"
          maskColor="rgba(0,0,0,0.2)"
        />
        <Controls showInteractive={false} />
        <Background gap={16} color="#1f2530" />
      </ReactFlow>
    </div>
  );
}
