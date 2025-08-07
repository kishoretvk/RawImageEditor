/**
 * Workflow node: Background Remove v2 (Alpha PNG)
 * node.data: { feather?: number }
 */
import { bgMatteV2 } from '../../ai/services/bgMatteV2';

export const type = 'bgRemoveV2';
export const label = 'Background Remove v2';

export async function run(node, context) {
  const params = {
    feather: Number.isFinite(node?.data?.feather) ? node.data.feather : 2.0
  };

  const inputImage = context?.image || context?.getImage?.();
  const result = await bgMatteV2.remove(inputImage, params);

  return {
    editsDelta: result.editsDelta || {},
    masks: result.masks || null, // expected: { alpha }
    meta: { ...(result.meta || {}), nodeId: node.id, type },
  };
}

export default { type, label, run };
