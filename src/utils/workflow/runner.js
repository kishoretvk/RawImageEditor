/**
 * WorkflowRunner: Executes a workflow DAG with a node registry and progress callbacks.
 * Non-persistent MVP; can be extended with IndexedDB persistence.
 */
import { normalizeWorkflow, topoSortNodes, buildAdjacency } from './schema.js';

export class WorkflowError extends Error {
  constructor(message, nodeId, cause) {
    super(message);
    this.name = 'WorkflowError';
    this.nodeId = nodeId;
    this.cause = cause;
  }
}

/**
 * NodeRegistry: map nodeType -> implementation({ inputs, params, context, onProgress }) => Promise<output>
 */
export class NodeRegistry {
  constructor() {
    this._map = new Map();
  }
  register(type, impl) {
    if (this._map.has(type)) console.warn(`[Workflow] Overriding node type: ${type}`);
    this._map.set(type, impl);
    return this;
  }
  get(type) {
    const impl = this._map.get(type);
    if (!impl) throw new Error(`No implementation registered for node type "${type}"`);
    return impl;
  }
}

/**
 * WorkflowRunner
 * Options:
 *  - registry: NodeRegistry
 *  - context: shared context across nodes (e.g., caches, settings)
 *  - onProgress: (JobProgress) => void
 */
export class WorkflowRunner {
  constructor({ registry, context = {}, onProgress = () => {} } = {}) {
    this.registry = registry || new NodeRegistry();
    this.context = context;
    this.onProgress = onProgress;
  }

  /**
   * Execute workflow over a set of items (assets). Each asset flows through the graph.
   * @param {WorkflowSpec} spec
   * @param {Array<any>} items - inputs (e.g., File objects or descriptors)
   */
  async run(spec, items) {
    const wf = normalizeWorkflow(spec);
    const sorted = topoSortNodes(wf.nodes);
    const { byId } = buildAdjacency(wf.nodes);
    const resultsPerItem = [];

    // Per-item run (can be parallelized with concurrency in the future)
    for (let idx = 0; idx < items.length; idx++) {
      const item = items[idx];
      const perNodeOutput = new Map(); // nodeId -> output
      for (const node of sorted) {
        const inputs = (node.inputs || []).map((id) => perNodeOutput.get(id));
        const impl = this.registry.get(node.type);
        const nodeContext = {
          itemIndex: idx,
          item,
          workflow: wf,
          node,
          shared: this.context,
        };

        // Retry policy
        let attempt = 0;
        const maxRetry = wf.settings.retry;
        let lastErr = null;

        this._progress({ nodeId: node.id, status: 'running', progress: 0, message: `Start ${node.type}` });

        while (attempt <= maxRetry) {
          try {
            const out = await impl({
              inputs,
              params: node.params || {},
              context: nodeContext,
              onProgress: (p, msg, data) => this._progress({ nodeId: node.id, status: 'running', progress: p, message: msg, data }),
            });
            perNodeOutput.set(node.id, out);
            this._progress({ nodeId: node.id, status: 'success', progress: 1, message: `Done ${node.type}` });
            lastErr = null;
            break;
          } catch (err) {
            lastErr = err;
            const remaining = maxRetry - attempt;
            this._progress({ nodeId: node.id, status: 'error', progress: 0, message: `Error ${node.type}: ${err?.message || err}. Retries left: ${remaining}` });
            if (attempt === maxRetry) {
              throw new WorkflowError(`Node "${node.id}" failed after ${maxRetry + 1} attempts`, node.id, err);
            }
            attempt += 1;
            // simple backoff
            await new Promise((r) => setTimeout(r, 150 * attempt));
          }
        }
        if (lastErr) throw lastErr; // fail hard if exhausted
      }
      resultsPerItem.push(perNodeOutput);
    }
    return resultsPerItem;
  }

  _progress(evt) {
    try { this.onProgress(evt); } catch {}
  }
}

/**
 * Convenience: build a default registry with basic nodes that we implement in nodes/*.js
 */
import { nodeIngestList } from './nodes/ingest.js';
import { nodeReadEXIF } from './nodes/exif.js';
import { nodeApplyPreset } from './nodes/applyPreset.js';
import { nodeWatermark } from './nodes/watermark.js';
import { nodeExport } from './nodes/export.js';
// Newly added nodes
import { nodeAutoWB } from './nodes/autoWB.js';
import { nodeSplitRGB } from './nodes/splitRGB.js';

export function buildDefaultRegistry() {
  const reg = new NodeRegistry();
  reg.register('IngestList', nodeIngestList);
  reg.register('ReadEXIF', nodeReadEXIF);
  reg.register('ApplyPreset', nodeApplyPreset);
  reg.register('AutoWB', nodeAutoWB);
  reg.register('SplitRGB', nodeSplitRGB);
  reg.register('Watermark', nodeWatermark);
  reg.register('Export', nodeExport);
  return reg;
}

/**
 * Minimal, page-friendly runner adapter.
 * Accepts the simplified graph format used by WorkflowPage:
 *  {
 *    nodes: [{ id, type, params }],
 *    edges: [{ from, to }]
 *  }
 * where type is normalized (e.g., 'ingest','lensCorrection','applyPreset','export', etc.)
 * This adapter maps normalized types to registry types and simulates progress callbacks.
 */
export async function runWorkflow(graph, ctx = {}) {
  // Defensive defaults
  const onNodeStart = ctx.onNodeStart || (() => {});
  const onNodeProgress = ctx.onNodeProgress || (() => {});
  const onNodeComplete = ctx.onNodeComplete || (() => {});
  const onError = ctx.onError || (() => {});

  // Map normalized types to registry types (align with nodes/* implementations)
  const mapType = (t) => {
    switch (t) {
      case 'ingest': return 'IngestList';
      case 'exif': return 'ReadEXIF';
      case 'applyPreset': return 'ApplyPreset';
      case 'autoWB': return 'AutoWB';
      case 'splitRGB': return 'SplitRGB';
      case 'watermark': return 'Watermark';
      case 'export': return 'Export';
      case 'lensCorrection':
        // Not implemented in nodes/ yet; no-op for now
        return null;
      default:
        return null;
    }
  };

  // Build a trivial linear order based on provided edges (fallback to node order)
  const nodes = Array.isArray(graph?.nodes) ? graph.nodes.slice() : [];
  const edges = Array.isArray(graph?.edges) ? graph.edges.slice() : [];

  // Simple topo: repeatedly pick nodes whose all predecessors are scheduled
  const pred = new Map(nodes.map(n => [n.id, new Set()]));
  for (const e of edges) {
    if (!pred.has(e.to)) pred.set(e.to, new Set());
    pred.get(e.to).add(e.from);
  }
  const scheduled = new Set();
  const order = [];
  let remaining = new Set(nodes.map(n => n.id));

  while (remaining.size) {
    let progressed = false;
    for (const id of Array.from(remaining)) {
      const req = pred.get(id) || new Set();
      let ok = true;
      for (const p of req) if (!scheduled.has(p)) { ok = false; break; }
      if (ok) {
        order.push(id);
        scheduled.add(id);
        remaining.delete(id);
        progressed = true;
      }
    }
    if (!progressed) {
      // cycle or invalid, just append remaining in given order to avoid deadlock
      for (const id of Array.from(remaining)) {
        order.push(id);
        scheduled.add(id);
        remaining.delete(id);
      }
    }
  }

  // Execute in order; for now simulate progress and call registry if available
  const registry = buildDefaultRegistry();

  for (const nodeId of order) {
    const node = nodes.find(n => n.id === nodeId);
    const normType = String(node?.type || '').replace(/Node$/i, ''); // in case RF type leaked here
    const regType = mapType(normType);

    try {
      onNodeStart(node.id, normType || node.type || 'node');

      // If we have an implementation, call it; otherwise simulate work
      if (regType && registry._map.has(regType)) {
        // Minimal call signature — no real inputs wiring yet
        const impl = registry.get(regType);
        // Simulate progressive updates during impl with wrapper
        let lastP = 0;
        const onProgress = (p) => {
          const clamped = Math.max(0, Math.min(1, Number(p) || 0));
          // throttle trivial progress flooding
          if (clamped - lastP >= 0.05 || clamped === 1) {
            onNodeProgress(node.id, clamped);
            lastP = clamped;
          }
        };
        // Provide minimal fields expected by nodes
        await impl({
          inputs: [],
          params: node.params || {},
          context: { node, shared: {}, workflow: { nodes, edges, settings: { retry: 0 } } },
          onProgress
        });
        onNodeProgress(node.id, 1);
      } else {
        // Fallback: simulate ~300ms of progress
        for (let p = 0; p <= 10; p++) {
          await new Promise(r => setTimeout(r, 30));
          onNodeProgress(node.id, p / 10);
        }
      }

      onNodeComplete(node.id, normType || node.type || 'node');
    } catch (err) {
      try { onError(node.id, err); } catch {}
      throw err;
    }
  }
}
