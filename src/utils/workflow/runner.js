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
