/**
 * Workflow Schema and Node Type Definitions (lightweight JS)
 * A workflow is a DAG of nodes with typed params and inputs.
 * This module defines the schema shape and helpers to validate/normalize workflows.
 */

export const WorkflowVersion = '1.0.0';

/**
 * @typedef {Object} WorkflowNode
 * @property {string} id - unique within the workflow
 * @property {string} type - node type, must exist in registry
 * @property {string[]=} inputs - array of node ids that feed into this node
 * @property {Object=} params - freeform parameter object, validated per node
 * @property {Object=} meta - optional metadata (e.g., UI position)
 */

/**
 * @typedef {Object} WorkflowSpec
 * @property {string} version - schema version
 * @property {string} name
 * @property {WorkflowNode[]} nodes
 * @property {Object=} conditions - reserved for conditional routing (future)
 * @property {Object=} settings - e.g., { concurrency: number, retry: number, timeoutSec: number }
 */

/**
 * @typedef {Object} JobProgress
 * @property {string} nodeId
 * @property {string} status - 'queued'|'running'|'success'|'error'
 * @property {number=} progress - 0..1
 * @property {string=} message
 * @property {any=} data
 */

/**
 * Basic normalization/validation (light)
 */
export function normalizeWorkflow(spec) {
  if (!spec || typeof spec !== 'object') throw new Error('Workflow spec must be an object');
  const version = spec.version || WorkflowVersion;
  const name = spec.name || 'Untitled Workflow';
  const nodes = Array.isArray(spec.nodes) ? spec.nodes : [];
  const ids = new Set();
  nodes.forEach((n) => {
    if (!n.id) throw new Error('Every node must have an id');
    if (ids.has(n.id)) throw new Error(`Duplicate node id: ${n.id}`);
    ids.add(n.id);
    if (!n.type) throw new Error(`Node ${n.id} missing type`);
    if (n.inputs && !Array.isArray(n.inputs)) throw new Error(`Node ${n.id} inputs must be an array`);
  });
  const settings = {
    concurrency: Math.max(1, Number(spec.settings?.concurrency || 2)),
    retry: Math.max(0, Number(spec.settings?.retry || 1)),
    timeoutSec: Math.max(5, Number(spec.settings?.timeoutSec || 120)),
  };
  return { version, name, nodes, conditions: spec.conditions || {}, settings };
}

/**
 * Resolve topological order (Kahn's algorithm)
 */
export function topoSortNodes(nodes) {
  const idToNode = new Map(nodes.map((n) => [n.id, n]));
  const indegree = new Map(nodes.map((n) => [n.id, 0]));
  nodes.forEach((n) => {
    (n.inputs || []).forEach((src) => {
      if (!idToNode.has(src)) throw new Error(`Node ${n.id} references missing input ${src}`);
      indegree.set(n.id, (indegree.get(n.id) || 0) + 1);
    });
  });
  const q = [];
  indegree.forEach((deg, id) => { if (deg === 0) q.push(id); });
  const order = [];
  while (q.length) {
    const id = q.shift();
    order.push(id);
    const dependents = nodes.filter((n) => (n.inputs || []).includes(id));
    dependents.forEach((d) => {
      indegree.set(d.id, (indegree.get(d.id) || 0) - 1);
      if (indegree.get(d.id) === 0) q.push(d.id);
    });
  }
  if (order.length !== nodes.length) {
    throw new Error('Workflow graph has cycles or unresolved dependencies');
  }
  return order.map((id) => idToNode.get(id));
}

/**
 * Build adjacency for quick lookup
 */
export function buildAdjacency(nodes) {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const deps = new Map(nodes.map((n) => [n.id, new Set(n.inputs || [])]));
  const outs = new Map(nodes.map((n) => [n.id, new Set()]));
  nodes.forEach((n) => (n.inputs || []).forEach((src) => outs.get(src)?.add(n.id)));
  return { byId, deps, outs };
}
