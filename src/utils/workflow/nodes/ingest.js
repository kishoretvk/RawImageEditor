/**
 * Ingest nodes: provide a uniform list of items for the workflow.
 * MVP: nodeIngestList simply echoes an input list passed via params.items or context.item.
 */
export async function nodeIngestList({ inputs, params, context, onProgress }) {
  // params.items can be an array of File objects or descriptors
  const items = Array.isArray(params?.items) ? params.items : (inputs && inputs[0]) || [];
  onProgress(1, 'Ingested items', { count: Array.isArray(items) ? items.length : 0 });
  return items;
}
